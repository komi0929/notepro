import { create } from "zustand";
import type { Article, ReadingStats, ArchiveSuggestion } from "./types";
import { supabase, rowToArticle, articleToRow } from "./supabase";
import type { ArticleRow } from "./supabase";

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
}

// 記事データから統計を計算
function computeStats(articles: Article[]): ReadingStats {
  const readArticles = articles.filter((a) => a.status === "read");
  const allArticles = articles.filter((a) => a.status !== "archived");

  // ハッシュタグ集計
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

  // クリエイター集計
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

  // 週間読了数（簡易: 直近7日の読了日から計算）
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

  // ストリーク計算（簡易）
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < 365; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - i);
    const hasRead = readArticles.some((a) => {
      if (!a.readAt) return false;
      const rd = new Date(a.readAt);
      return (
        rd.getFullYear() === checkDate.getFullYear() &&
        rd.getMonth() === checkDate.getMonth() &&
        rd.getDate() === checkDate.getDate()
      );
    });
    if (hasRead) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }

  return {
    totalRead: readArticles.length,
    totalSaved: allArticles.length || 1, // divisionByZero防止
    weeklyRead,
    topHashtags:
      topHashtags.length > 0
        ? topHashtags
        : [{ name: "まだデータなし", count: 0 }],
    topCreators:
      topCreators.length > 0
        ? topCreators
        : [{ name: "まだデータなし", urlname: "-", count: 0 }],
    streak,
    bestStreak: streak, // 簡易: 現在のストリーク = ベスト
    averageReadingTime:
      readArticles.length > 0
        ? Math.round(
            readArticles.reduce((sum, a) => sum + a.readingTime, 0) /
              readArticles.length,
          )
        : 0,
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
    topHashtags: [{ name: "まだデータなし", count: 0 }],
    topCreators: [{ name: "まだデータなし", urlname: "-", count: 0 }],
    streak: 0,
    bestStreak: 0,
    averageReadingTime: 0,
  },
  isLoading: true,
  dbError: null,

  isCommandPaletteOpen: false,
  isSaveModalOpen: false,
  isArchiveModalOpen: false,
  currentFilter: null,
  saveModalUrl: "",

  toggleCommandPalette: () =>
    set((state) => ({ isCommandPaletteOpen: !state.isCommandPaletteOpen })),

  openSaveModal: (url?: string) =>
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

      const articles = (data as ArticleRow[]).map(rowToArticle);
      const activeArticles = articles.filter((a) => a.status !== "archived");

      set({
        articles,
        queueArticles: activeArticles
          .filter((a) => a.status === "unread" || a.status === "reading")
          .sort((a, b) => b.priority - a.priority)
          .slice(0, 3),
        archiveSuggestions: activeArticles
          .filter((a) => a.freshnessScore < 0.3 && a.status === "unread")
          .map((a) => ({
            ...a,
            archiveReason: (a.freshnessScore < 0.2
              ? "low_freshness"
              : "unread_30_days") as ArchiveSuggestion["archiveReason"],
          })),
        readingStats: computeStats(articles),
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
      aiSummary: null,
      aiKeyPoints: [],
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

      set((state) => ({
        articles: [saved, ...state.articles],
        readingStats: computeStats([saved, ...state.articles]),
        isSaveModalOpen: false,
        saveModalUrl: "",
      }));
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
          archiveSuggestions: state.archiveSuggestions.filter(
            (a) => !ids.includes(a.id),
          ),
          readingStats: computeStats(articles),
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
        return { articles, readingStats: computeStats(articles) };
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
        return { articles, readingStats: computeStats(articles) };
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
        return { articles, readingStats: computeStats(articles) };
      });
    } catch (err) {
      console.error("Failed to delete article:", err);
    }
  },
}));
