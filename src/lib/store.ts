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
  if (hour >= 6 && hour < 9) return readingTime <= 10;
  if (hour >= 12 && hour < 14) return readingTime <= 15;
  if (hour >= 20) return true;
  return readingTime <= 10;
}

/** 記事の優先度を動的計算 */
function calcPriority(article: Article): number {
  const freshness = calcFreshnessScore(article.savedAt);
  let score = 0;
  if (article.status === "unread") score += 0.4;
  score += freshness * 0.3;
  if (isGoodTimeForReading(article.readingTime)) score += 0.2;
  if (article.likeCount > 100) score += 0.1;
  return Math.min(1, score);
}

/** 全記事のスコアを再計算 */
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
  const activeArticles = articles.filter((a) => a.status !== "archived");
  const unreadArticles = activeArticles.filter((a) => a.status === "unread");

  // ハッシュタグ集計
  const tagCounts: Record<string, number> = {};
  activeArticles.forEach((a) => {
    a.hashtags.forEach((tag) => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });
  const topHashtags = Object.entries(tagCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  // クリエイター集計
  const creatorCounts: Record<
    string,
    { name: string; urlname: string; count: number }
  > = {};
  activeArticles.forEach((a) => {
    const key = a.creator.urlname;
    if (!creatorCounts[key]) {
      creatorCounts[key] = { name: a.creator.nickname, urlname: key, count: 0 };
    }
    creatorCounts[key].count += 1;
  });
  const topCreators = Object.values(creatorCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // 週間読了数
  const weeklyRead = [0, 0, 0, 0, 0, 0, 0];
  const now = new Date();
  readArticles.forEach((a) => {
    if (a.readAt) {
      const readDate = new Date(a.readAt);
      const dayDiff = Math.floor(
        (now.getTime() - readDate.getTime()) / 86400000,
      );
      if (dayDiff < 7) {
        const dayIndex = (readDate.getDay() + 6) % 7;
        weeklyRead[dayIndex] += 1;
      }
    }
  });

  // 先週の読了数（成長率計算用）
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

  // ストリーク（読了マークした連続日数）
  const readDatesSet = new Set<string>();
  readArticles.forEach((a) => {
    if (a.readAt) {
      const d = new Date(a.readAt);
      readDatesSet.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
    }
  });

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
      break;
    }
  }

  let bestStreak = streak;
  if (readDatesSet.size > 0) {
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
    }
  }

  return {
    totalRead: readArticles.length,
    totalSaved: activeArticles.length || 1,
    unreadCount: unreadArticles.length,
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
  };
}

// === Store ===
interface AppState {
  articles: Article[];
  queueArticles: Article[];
  archiveSuggestions: ArchiveSuggestion[];
  readingStats: ReadingStats;
  isLoading: boolean;
  dbError: string | null;
  lastSavedArticle: Article | null;

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
  clearLastSaved: () => void;

  // DB Actions
  fetchArticles: () => Promise<void>;
  saveArticle: (url: string) => Promise<void>;
  archiveArticles: (ids: string[]) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAsUnread: (id: string) => Promise<void>;
  updateMemo: (id: string, memo: string) => Promise<void>;
  deleteArticle: (id: string) => Promise<void>;
  deleteAllArticles: () => Promise<void>;
}

/** スコア付き記事からキュー・アーカイブ提案を導出 */
function deriveFromArticles(articles: Article[]) {
  const activeArticles = articles.filter((a) => a.status !== "archived");

  return {
    queueArticles: activeArticles
      .filter((a) => a.status === "unread")
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

const defaultStats: ReadingStats = {
  totalRead: 0,
  totalSaved: 1,
  unreadCount: 0,
  weeklyRead: [0, 0, 0, 0, 0, 0, 0],
  weeklyGrowthPercent: 0,
  topHashtags: [{ name: "まだデータなし", count: 0 }],
  topCreators: [{ name: "まだデータなし", urlname: "-", count: 0 }],
  streak: 0,
  bestStreak: 0,
};

export const useAppStore = create<AppState>((set) => ({
  articles: [],
  queueArticles: [],
  archiveSuggestions: [],
  readingStats: defaultStats,
  isLoading: true,
  dbError: null,
  lastSavedArticle: null,

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
  clearLastSaved: () => set({ lastSavedArticle: null }),

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

  saveArticle: async (url) => {
    const noteMatch = url.match(/note\.com\/([^/]+)\/n\/([^/?#]+)/);
    const creatorUrlname = noteMatch ? noteMatch[1] : "unknown";
    const noteId = noteMatch ? noteMatch[2] : `n${Date.now()}`;

    // メタデータ取得
    let metadata = {
      title: url,
      excerpt: null as string | null,
      coverImageUrl: null as string | null,
      creatorNickname: creatorUrlname,
      creatorUrlname: creatorUrlname,
      creatorProfileImage: null as string | null,
      hashtags: [] as string[],
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
      console.warn("Metadata fetch failed:", err);
    }

    const aiSummary = metadata.excerpt || null;
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
      memo: null,
      priority: 0.8,
      freshnessScore: 1.0,
      expiryScore: 1.0,
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

      set((state) => {
        const articles = applyDynamicScores([saved, ...state.articles]);
        return {
          articles,
          ...deriveFromArticles(articles),
          isSaveModalOpen: false,
          saveModalUrl: "",
          lastSavedArticle: saved,
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
          a.id === id ? { ...a, status: "read" as const, readAt: now } : a,
        );
        return { articles, ...deriveFromArticles(articles) };
      });
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  },

  markAsUnread: async (id) => {
    try {
      const { error } = await supabase
        .from("articles")
        .update({
          status: "unread",
          progress: 0,
          read_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;

      set((state) => {
        const articles = state.articles.map((a) =>
          a.id === id ? { ...a, status: "unread" as const, readAt: null } : a,
        );
        return { articles, ...deriveFromArticles(articles) };
      });
    } catch (err) {
      console.error("Failed to mark as unread:", err);
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
        readingStats: defaultStats,
      });
    } catch (err) {
      console.error("Failed to delete all articles:", err);
    }
  },
}));
