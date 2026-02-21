import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// DB行 → フロント Article 型の変換
export interface ArticleRow {
  id: string;
  user_id: string;
  note_id: string;
  note_url: string;
  creator_urlname: string;
  creator_nickname: string;
  creator_profile_image_url: string | null;
  content_type: string;
  is_paid: boolean;
  like_count: number;
  cover_image_url: string | null;
  hashtags: string[];
  title: string;
  excerpt: string | null;
  published_at: string | null;
  word_count: number;
  reading_time: number;
  status: string;
  progress: number;
  memo: string | null;
  priority: number;
  freshness_score: number;
  readability_score: number;
  expiry_score: number;
  suggested_read_time: string | null;
  ai_summary: string | null;
  ai_key_points: string[];
  saved_at: string;
  read_at: string | null;
  updated_at: string;
}

import type { Article, ArticleStatus, ContentType } from "./types";

export function rowToArticle(row: ArticleRow): Article {
  return {
    id: row.id,
    userId: row.user_id,
    noteId: row.note_id,
    noteUrl: row.note_url,
    creator: {
      urlname: row.creator_urlname,
      nickname: row.creator_nickname,
      profileImageUrl: row.creator_profile_image_url,
    },
    contentType: row.content_type as ContentType,
    isPaid: row.is_paid,
    likeCount: row.like_count,
    coverImageUrl: row.cover_image_url,
    hashtags: row.hashtags || [],
    title: row.title,
    excerpt: row.excerpt,
    publishedAt: row.published_at,
    wordCount: row.word_count,
    readingTime: row.reading_time,
    status: row.status as ArticleStatus,
    progress: row.progress,
    memo: row.memo,
    priority: row.priority,
    freshnessScore: row.freshness_score,
    readabilityScore: row.readability_score,
    expiryScore: row.expiry_score,
    suggestedReadTime: row.suggested_read_time,
    aiSummary: row.ai_summary,
    aiKeyPoints: row.ai_key_points || [],
    savedAt: row.saved_at,
    readAt: row.read_at,
    updatedAt: row.updated_at,
  };
}

export function articleToRow(
  article: Omit<Article, "id">,
): Omit<ArticleRow, "id"> {
  return {
    user_id: article.userId,
    note_id: article.noteId,
    note_url: article.noteUrl,
    creator_urlname: article.creator.urlname,
    creator_nickname: article.creator.nickname,
    creator_profile_image_url: article.creator.profileImageUrl,
    content_type: article.contentType,
    is_paid: article.isPaid,
    like_count: article.likeCount,
    cover_image_url: article.coverImageUrl,
    hashtags: article.hashtags,
    title: article.title,
    excerpt: article.excerpt,
    published_at: article.publishedAt,
    word_count: article.wordCount,
    reading_time: article.readingTime,
    status: article.status,
    progress: article.progress,
    memo: article.memo,
    priority: article.priority,
    freshness_score: article.freshnessScore,
    readability_score: article.readabilityScore,
    expiry_score: article.expiryScore,
    suggested_read_time: article.suggestedReadTime,
    ai_summary: article.aiSummary,
    ai_key_points: article.aiKeyPoints,
    saved_at: article.savedAt,
    read_at: article.readAt,
    updated_at: article.updatedAt,
  };
}
