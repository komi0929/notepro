export type ContentType = "text" | "image" | "sound" | "movie";

export type ArticleStatus = "unread" | "read" | "archived";

export interface NoteCreator {
  urlname: string; // note ID (URL末尾: note.com/{urlname})
  nickname: string; // 表示名
  profileImageUrl: string | null; // プロフィール画像
}

export interface Article {
  id: string;
  userId: string;

  // note.com固有
  noteId: string; // note固有ID (n1234abcd形式)
  noteUrl: string; // 完全URL: https://note.com/{urlname}/n/{noteId}
  creator: NoteCreator; // クリエイター情報
  contentType: ContentType; // テキスト/画像/音声/動画
  isPaid: boolean; // 有料記事
  likeCount: number; // スキ数
  coverImageUrl: string | null; // カバー画像（OG画像）
  hashtags: string[]; // ハッシュタグ

  // 記事メタデータ
  title: string;
  excerpt: string | null; // 記事冒頭の抜粋（OGP description）
  publishedAt: string | null;
  wordCount: number;
  readingTime: number; // 推定読了時間（分）※note.comのメタデータ

  // 管理（notame独自）
  status: ArticleStatus;
  memo: string | null; // ユーザーメモ
  priority: number; // 0-1 — 動的計算
  freshnessScore: number; // 0-1 — 保存からの鮮度
  expiryScore: number; // 0-1

  // AI分析結果
  aiSummary: string | null; // 要約（excerptから生成）
  aiKeyPoints: string[]; // キーポイント

  // タイムスタンプ
  savedAt: string; // notameに保存した日時
  readAt: string | null; // 読了日時
  updatedAt: string;
}

export interface ArchiveSuggestion extends Article {
  archiveReason: "unread_30_days" | "low_freshness";
}

export interface ReadingStats {
  totalRead: number;
  totalSaved: number;
  unreadCount: number;
  weeklyRead: number[];
  weeklyGrowthPercent: number;
  topHashtags: { name: string; count: number }[];
  topCreators: { name: string; urlname: string; count: number }[];
  streak: number;
  bestStreak: number;
}
