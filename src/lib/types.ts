export type ContentType = "text" | "image" | "sound" | "movie";

export type ArticleStatus = "unread" | "reading" | "read" | "archived";

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
  readingTime: number; // 分

  // 読書管理（NoteReader独自）
  status: ArticleStatus;
  progress: number; // 0-1
  memo: string | null; // ユーザーメモ
  priority: number; // 0-1
  freshnessScore: number; // 0-1
  readabilityScore: number; // 0-1
  expiryScore: number; // 0-1
  suggestedReadTime: string | null;

  // AI分析結果
  aiSummary: string | null; // AI要約 (3行程度)
  aiKeyPoints: string[]; // キーポイント

  // タイムスタンプ
  savedAt: string; // NoteReaderに保存した日時
  readAt: string | null; // 読了日時
  updatedAt: string;
}

export interface Summary {
  articleId: string;
  keyPoints: string[];
  oneSentence: string;
  hashtags: string[];
  sentiment: string;
}

export interface Queue {
  id: string;
  userId: string;
  name: string;
  articleIds: string[];
  generatedAt: string;
  expiresAt: string;
}

export type ActionType =
  | "read_later"
  | "notion_summary"
  | "todo_item"
  | "slack_share";

export interface ArticlePreview {
  url: string;
  title: string;
  excerpt: string;
  coverImageUrl: string | null;
  creator: NoteCreator;
  hashtags: string[];
  isPaid: boolean;
  estimatedReadingTime: number;
}

export interface ArchiveSuggestion extends Article {
  archiveReason: "unread_30_days" | "low_freshness" | "duplicate_topic";
}

export interface ArchiveSuggestionsResponse {
  suggestions: ArchiveSuggestion[];
  totalCount: number;
  potentialSpaceRecovery: number;
}

export interface ReadingStats {
  totalRead: number;
  totalSaved: number;
  weeklyRead: number[];
  weeklyGrowthPercent: number;
  topHashtags: { name: string; count: number }[];
  topCreators: { name: string; urlname: string; count: number }[];
  streak: number;
  bestStreak: number;
  averageReadingTime: number;
}
