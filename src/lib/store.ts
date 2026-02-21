import { create } from "zustand";
import type { Article, ReadingStats, ArchiveSuggestion } from "./types";
import { supabase, rowToArticle, articleToRow } from "./supabase";
import type { ArticleRow } from "./supabase";

// === 動的スコアリング ===

/** 保存からの経過日数で鮮度を計算 (0〜1, 60日で0) */
function calcFreshnessScore(savedAt: string): number {
  const daysSinceSaved = (Date.now() - new Date(savedAt).getTime()) / 86400000;
  return Math.max(0, Math.min(1, 1 - daysSinceSaved / 60));
}

/** 時間帯に合った読書時間かどうか */
function isGoodTimeForReading(readingTime: number): boolean {
  const hour = new Date().getHours();
  // 朝・通勤: 短め (5-10分)
  if (hour >= 6 && hour < 9) return readingTime <= 10;
  // 昼休み: 中程度 (5-15分)
  if (hour >= 12 && hour < 14) return readingTime <= 15;
  // 夜: 長めもOK
  if (hour >= 20) return true;
  // それ以外: 短め推奨
  return readingTime <= 10;
}

/** 記事の優先度を動的計算 */
function calcPriority(article: Article): number {
  const freshness = calcFreshnessScore(article.savedAt);
  let score = 0;

  // 未読は高優先度
  if (article.status === "unread") score += 0.4;
  else if (article.status === "reading") score += 0.3;

  // 鮮度が高い = 優先度高い
  score += freshness * 0.3;

  // 時間帯にフィットする記事を優先
  if (isGoodTimeForReading(article.readingTime)) score += 0.2;

  // スキ数による補正 (多い = 質が高い可能性)
  if (article.likeCount > 100) score += 0.1;

  return Math.min(1, score);
}

/** 全記事のスコアを再計算して返す */
function applyDynamicScores(articles: Article[]): Article[] {
  return articles.map((a) => ({
    ...a,
    freshnessScore: calcFreshnessScore(a.savedAt),
    priority: calcPriority(a),
    expiryScore: calcFreshnessScore(a.savedAt),
  }));
}

// === 統計計算 ===

function computeStats(articles: Article[]): ReadingStats {
  const readArticles = articles.filter((a) => a.status === "read");
  const allArticles = articles.filter((a) => a.status !== "archived");

  // === ハッシュタグ集計 ===
  const tagCounts: Record<string, number> = {};
  allArticles.forEach((a) => {
    a.hashtags.forEach((tag) => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });
  const topHashtags = Object.entries(tagCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  // === クリエイター集計 ===
  const creatorCounts: Record<
    string,
    { name: string; urlname: string; count: number }
  > = {};
  allArticles.forEach((a) => {
    const key = a.creator.urlname;
    if (!creatorCounts[key]) {
      creatorCounts[key] = { name: a.creator.nickname, urlname: key, count: 0 };
    }
    creatorCounts[key].count += 1;
  });
  const topCreators = Object.values(creatorCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // === 週間読了数（直近7日の読了日から計算） ===
  const weeklyRead = [0, 0, 0, 0, 0, 0, 0];
  const now = new Date();
  readArticles.forEach((a) => {
    if (a.readAt) {
      const readDate = new Date(a.readAt);
      const dayDiff = Math.floor(
        (now.getTime() - readDate.getTime()) / 86400000,
      );
      if (dayDiff < 7) {
        const dayIndex = (readDate.getDay() + 6) % 7; // 月=0, 日=6
        weeklyRead[dayIndex] += 1;
      }
    }
  });

  // === 先週の読了数（成長率計算用） ===
  const lastWeeklyRead = [0, 0, 0, 0, 0, 0, 0];
  readArticles.forEach((a) => {
    if (a.readAt) {
      const readDate = new Date(a.readAt);
      const dayDiff = Math.floor(
        (now.getTime() - readDate.getTime()) / 86400000,
      );
      if (dayDiff >= 7 && dayDiff < 14) {
        const dayIndex = (readDate.getDay() + 6) % 7;
        lastWeeklyRead[dayIndex] += 1;
      }
    }
  });

  const thisWeekTotal = weeklyRead.reduce((s, v) => s + v, 0);
  const lastWeekTotal = lastWeeklyRead.reduce((s, v) => s + v, 0);
  const weeklyGrowthPercent =
    lastWeekTotal > 0
      ? Math.round(((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100)
      : thisWeekTotal > 0
        ? 100
        : 0;

  // === ストリーク計算（正確版） ===
  // 読了日のセットを作成
  const readDatesSet = new Set<string>();
  readArticles.forEach((a) => {
    if (a.readAt) {
      const d = new Date(a.readAt);
      readDatesSet.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
    }
  });

  // 現在のストリーク
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < 365; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - i);
    const key = `${checkDate.getFullYear()}-${checkDate.getMonth()}-${checkDate.getDate()}`;
    if (readDatesSet.has(key)) {
      streak++;
    } else if (i > 0) {
      // 今日まだ読んでない場合はスキップ（ストリークを維持）
      break;
    }
  }

  // ベストストリーク（全読了日から最長連続日数を算出）
  let bestStreak = streak;
  if (readDatesSet.size > 0) {
    // 全読了日をソート
    const sortedDates = Array.from(readDatesSet)
      .map((s) => {
        const [y, m, d] = s.split("-").map(Number);
        return new Date(y, m, d).getTime();
      })
      .sort((a, b) => a - b);

    let currentRun = 1;
    for (let i = 1; i < sortedDates.length; i++) {
      const diffDays = (sortedDates[i] - sortedDates[i - 1]) / 86400000;
      if (diffDays === 1) {
        currentRun++;
        if (currentRun > bestStreak) bestStreak = currentRun;
      } else if (diffDays > 1) {
        currentRun = 1;
      }
      // diffDays === 0 はスキップ（同日の複数記事）
    }
  }

  return {
    totalRead: readArticles.length,
    totalSaved: allArticles.length || 1,
    weeklyRead,
    weeklyGrowthPercent,
    topHashtags:
      topHashtags.length > 0
        ? topHashtags
        : [{ name: "まだデータなし", count: 0 }],
    topCreators:
      topCreators.length > 0
        ? topCreators
        : [{ name: "まだデータなし", urlname: "-", count: 0 }],
    streak,
    bestStreak,
    averageReadingTime:
      readArticles.length > 0
        ? Math.round(
            readArticles.reduce((sum, a) => sum + a.readingTime, 0) /
              readArticles.length,
          )
        : 0,
  };
}

// === Store ===
interface AppState {
  // Articles
  articles: Article[];
  queueArticles: Article[];
  archiveSuggestions: ArchiveSuggestion[];
  readingStats: ReadingStats;
  isLoading: boolean;
  dbError: string | null;

  // UI State
  isCommandPaletteOpen: boolean;
  isSaveModalOpen: boolean;
  isArchiveModalOpen: boolean;
  currentFilter: string | null;
  saveModalUrl: string;

  // Actions
  toggleCommandPalette: () => void;
  openSaveModal: (url?: string) => void;
  closeSaveModal: () => void;
  openArchiveModal: () => void;
  closeArchiveModal: () => void;
  setFilter: (filter: string | null) => void;

  // DB Actions
  fetchArticles: () => Promise<void>;
  saveArticle: (url: string, action: string) => Promise<void>;
  archiveArticles: (ids: string[]) => Promise<void>;
  updateProgress: (id: string, progress: number) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  updateMemo: (id: string, memo: string) => Promise<void>;
  deleteArticle: (id: string) => Promise<void>;
  deleteAllArticles: () => Promise<void>;
}

/** スコア付き記事からキュー・アーカイブ提案を導出 */
function deriveFromArticles(articles: Article[]) {
  const activeArticles = articles.filter((a) => a.status !== "archived");

  return {
    queueArticles: activeArticles
      .filter((a) => a.status === "unread" || a.status === "reading")
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 3),
    archiveSuggestions: activeArticles
      .filter((a) => a.freshnessScore < 0.3 && a.status === "unread")
      .map((a) => ({
        ...a,
        archiveReason: (a.freshnessScore < 0.15
          ? "low_freshness"
          : "unread_30_days") as ArchiveSuggestion["archiveReason"],
      })),
    readingStats: computeStats(articles),
  };
}

export const useAppStore = create<AppState>((set) => ({
  articles: [],
  queueArticles: [],
  archiveSuggestions: [],
  readingStats: {
    totalRead: 0,
    totalSaved: 1,
    weeklyRead: [0, 0, 0, 0, 0, 0, 0],
    weeklyGrowthPercent: 0,
    topHashtags: [{ name: "まだデータなし", count: 0 }],
    topCreators: [{ name: "まだデータなし", urlname: "-", count: 0 }],
    streak: 0,
    bestStreak: 0,
    averageReadingTime: 0,
  },
  isLoading: true,
  dbError: null,

  // UI State
  isCommandPaletteOpen: false,
  isSaveModalOpen: false,
  isArchiveModalOpen: false,
  currentFilter: null,
  saveModalUrl: "",

  // UI Actions
  toggleCommandPalette: () =>
    set((s) => ({ isCommandPaletteOpen: !s.isCommandPaletteOpen })),
  openSaveModal: (url) =>
    set({ isSaveModalOpen: true, saveModalUrl: url || "" }),
  closeSaveModal: () => set({ isSaveModalOpen: false, saveModalUrl: "" }),
  openArchiveModal: () => set({ isArchiveModalOpen: true }),
  closeArchiveModal: () => set({ isArchiveModalOpen: false }),
  setFilter: (filter) => set({ currentFilter: filter }),

  // === DB Actions ===

  fetchArticles: async () => {
    set({ isLoading: true, dbError: null });
    try {
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .eq("user_id", "demo_user")
        .order("saved_at", { ascending: false });

      if (error) throw error;

      const rawArticles = (data as ArticleRow[]).map(rowToArticle);
      // 動的スコアを適用
      const articles = applyDynamicScores(rawArticles);

      set({
        articles,
        ...deriveFromArticles(articles),
        isLoading: false,
      });
    } catch (err) {
      console.error("Failed to fetch articles:", err);
      set({
        isLoading: false,
        dbError:
          err instanceof Error ? err.message : "データ取得に失敗しました",
      });
    }
  },

  saveArticle: async (url, action) => {
    // note.com URL解析
    const noteMatch = url.match(/note\.com\/([^/]+)\/n\/([^/?#]+)/);
    const creatorUrlname = noteMatch ? noteMatch[1] : "unknown";
    const noteId = noteMatch ? noteMatch[2] : `n${Date.now()}`;

    // 1. note.comからメタデータを取得
    let metadata: {
      title: string;
      excerpt: string | null;
      coverImageUrl: string | null;
      creatorNickname: string;
      creatorUrlname: string;
      creatorProfileImage: string | null;
      hashtags: string[];
      isPaid: boolean;
      wordCount: number;
      readingTime: number;
    } = {
      title: url,
      excerpt: null,
      coverImageUrl: null,
      creatorNickname: creatorUrlname,
      creatorUrlname: creatorUrlname,
      creatorProfileImage: null,
      hashtags: [],
      isPaid: false,
      wordCount: 0,
      readingTime: 0,
    };

    try {
      const res = await fetch("/api/fetch-note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (res.ok) {
        metadata = await res.json();
      }
    } catch (err) {
      console.warn("Metadata fetch failed, using defaults:", err);
    }

    // 2. メタデータ付きでDBに保存
    // excerptをaiSummaryとして利用（AI API不要）
    const aiSummary = metadata.excerpt || null;
    // ハッシュタグをキーポイントとして整形
    const aiKeyPoints =
      metadata.hashtags.length > 0
        ? metadata.hashtags.slice(0, 5).map((tag) => `#${tag} に関する記事`)
        : [];

    const newArticle: Omit<Article, "id"> = {
      userId: "demo_user",
      noteId,
      noteUrl: url,
      creator: {
        urlname: metadata.creatorUrlname || creatorUrlname,
        nickname: metadata.creatorNickname || creatorUrlname,
        profileImageUrl: metadata.creatorProfileImage || null,
      },
      contentType: "text",
      isPaid: metadata.isPaid,
      likeCount: 0,
      coverImageUrl: metadata.coverImageUrl,
      hashtags: metadata.hashtags || [],
      title: metadata.title || url,
      excerpt: metadata.excerpt,
      publishedAt: new Date().toISOString(),
      wordCount: metadata.wordCount || 0,
      readingTime: metadata.readingTime || 0,
      status: "unread",
      progress: 0,
      memo: null,
      priority: 0.8,
      freshnessScore: 1.0,
      readabilityScore: 0.7,
      expiryScore: 1.0,
      suggestedReadTime: null,
      aiSummary,
      aiKeyPoints,
      savedAt: new Date().toISOString(),
      readAt: null,
      updatedAt: new Date().toISOString(),
    };

    try {
      const row = articleToRow(newArticle);
      const { data, error } = await supabase
        .from("articles")
        .insert(row)
        .select()
        .single();

      if (error) throw error;

      const saved = rowToArticle(data as ArticleRow);
      console.log(`Article saved with action: ${action}`);

      set((state) => {
        const articles = applyDynamicScores([saved, ...state.articles]);
        return {
          articles,
          ...deriveFromArticles(articles),
          isSaveModalOpen: false,
          saveModalUrl: "",
        };
      });
    } catch (err) {
      console.error("Failed to save article:", err);
      set({
        dbError:
          err instanceof Error ? err.message : "記事の保存に失敗しました",
      });
    }
  },

  archiveArticles: async (ids) => {
    try {
      const { error } = await supabase
        .from("articles")
        .update({ status: "archived", updated_at: new Date().toISOString() })
        .in("id", ids);

      if (error) throw error;

      set((state) => {
        const articles = state.articles.map((a) =>
          ids.includes(a.id) ? { ...a, status: "archived" as const } : a,
        );
        return {
          articles,
          ...deriveFromArticles(articles),
          isArchiveModalOpen: false,
        };
      });
    } catch (err) {
      console.error("Failed to archive articles:", err);
    }
  },

  updateProgress: async (id, progress) => {
    const newStatus =
      progress >= 1 ? "read" : progress > 0 ? "reading" : "unread";
    const readAt = progress >= 1 ? new Date().toISOString() : null;

    try {
      const updateData: Record<string, unknown> = {
        progress,
        status: newStatus,
        updated_at: new Date().toISOString(),
      };
      if (readAt) updateData.read_at = readAt;

      const { error } = await supabase
        .from("articles")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;

      set((state) => {
        const articles = state.articles.map((a) =>
          a.id === id
            ? {
                ...a,
                progress,
                status: newStatus as Article["status"],
                readAt: readAt || a.readAt,
              }
            : a,
        );
        return { articles, ...deriveFromArticles(articles) };
      });
    } catch (err) {
      console.error("Failed to update progress:", err);
    }
  },

  markAsRead: async (id) => {
    const now = new Date().toISOString();
    try {
      const { error } = await supabase
        .from("articles")
        .update({
          status: "read",
          progress: 1.0,
          read_at: now,
          updated_at: now,
        })
        .eq("id", id);

      if (error) throw error;

      set((state) => {
        const articles = state.articles.map((a) =>
          a.id === id
            ? { ...a, status: "read" as const, progress: 1.0, readAt: now }
            : a,
        );
        return { articles, ...deriveFromArticles(articles) };
      });
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  },

  updateMemo: async (id, memo) => {
    try {
      const { error } = await supabase
        .from("articles")
        .update({ memo, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;

      set((state) => ({
        articles: state.articles.map((a) => (a.id === id ? { ...a, memo } : a)),
      }));
    } catch (err) {
      console.error("Failed to update memo:", err);
    }
  },

  deleteArticle: async (id) => {
    try {
      const { error } = await supabase.from("articles").delete().eq("id", id);

      if (error) throw error;

      set((state) => {
        const articles = state.articles.filter((a) => a.id !== id);
        return { articles, ...deriveFromArticles(articles) };
      });
    } catch (err) {
      console.error("Failed to delete article:", err);
    }
  },

  deleteAllArticles: async () => {
    try {
      const { error } = await supabase
        .from("articles")
        .delete()
        .eq("user_id", "demo_user");

      if (error) throw error;

      set({
        articles: [],
        queueArticles: [],
        archiveSuggestions: [],
        readingStats: {
          totalRead: 0,
          totalSaved: 1,
          weeklyRead: [0, 0, 0, 0, 0, 0, 0],
          weeklyGrowthPercent: 0,
          topHashtags: [{ name: "まだデータなし", count: 0 }],
          topCreators: [{ name: "まだデータなし", urlname: "-", count: 0 }],
          streak: 0,
          bestStreak: 0,
          averageReadingTime: 0,
        },
      });
    } catch (err) {
      console.error("Failed to delete all articles:", err);
    }
  },
}));
