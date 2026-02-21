"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Heart,
  Clock,
  ExternalLink,
  Sparkles,
  BookOpen,
  Check,
  ChevronDown,
  ChevronUp,
  Hash,
  Lock,
  StickyNote,
  User,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";

export default function ArticleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { articles, markAsRead, updateMemo } = useAppStore();
  const [showKeyPoints, setShowKeyPoints] = useState(false);
  const [memoText, setMemoText] = useState("");
  const [memoSaved, setMemoSaved] = useState(false);

  const article = articles.find((a) => a.id === params.id);

  // Initialize memo text from article
  useState(() => {
    if (article?.memo) {
      setMemoText(article.memo);
    }
  });

  const handleMarkAsRead = useCallback(() => {
    if (article) {
      markAsRead(article.id);
    }
  }, [article, markAsRead]);

  const handleOpenNote = useCallback(() => {
    if (article) {
      window.open(article.noteUrl, "_blank", "noopener,noreferrer");
    }
  }, [article]);

  const handleSaveMemo = useCallback(() => {
    if (article) {
      updateMemo(article.id, memoText);
      setMemoSaved(true);
      setTimeout(() => setMemoSaved(false), 2000);
    }
  }, [article, memoText, updateMemo]);

  if (!article) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-lg text-muted-foreground">記事が見つかりません</p>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 rounded-xl bg-primary-500 text-white text-sm font-medium"
        >
          戻る
        </button>
      </div>
    );
  }

  const publishedDate = article.publishedAt
    ? new Date(article.publishedAt)
    : null;
  const formattedDate = publishedDate
    ? `${publishedDate.getFullYear()}年${publishedDate.getMonth() + 1}月${publishedDate.getDate()}日`
    : "不明";

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border">
        <div className="flex items-center justify-between h-14 px-4">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            {article.status === "read" && (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-success-100 text-success-700 text-xs font-medium">
                <Check className="w-3 h-3" />
                読了
              </span>
            )}
            {article.isPaid && (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-warning-100 text-warning-700 text-xs font-medium">
                <Lock className="w-3 h-3" />
                有料
              </span>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4">
        {/* Cover Image */}
        {article.coverImageUrl && (
          <div className="mt-4 rounded-2xl overflow-hidden border border-border">
            <div className="aspect-[1200/630] bg-muted relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center">
                <BookOpen className="w-12 h-12 text-primary-300" />
              </div>
            </div>
          </div>
        )}

        {/* Title */}
        <h1 className="mt-5 text-xl font-bold text-foreground leading-tight">
          {article.title}
        </h1>

        {/* Creator Info */}
        <div className="mt-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-200 to-primary-100 flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              {article.creator.nickname}
            </p>
            <p className="text-xs text-muted-foreground">
              @{article.creator.urlname}
            </p>
          </div>
        </div>

        {/* Meta Row */}
        <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {formattedDate}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {article.readingTime}分
          </span>
          <span className="flex items-center gap-1 text-error-500">
            <Heart className="w-3.5 h-3.5 fill-current" />
            {article.likeCount.toLocaleString()} スキ
          </span>
        </div>

        {/* Hashtags */}
        {article.hashtags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {article.hashtags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-0.5 px-2.5 py-1 rounded-full bg-primary-50 text-primary-700 text-xs font-medium border border-primary-100"
              >
                <Hash className="w-3 h-3" />
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Excerpt */}
        {article.excerpt && (
          <p className="mt-5 text-sm text-muted-foreground leading-relaxed border-l-2 border-primary-200 pl-4">
            {article.excerpt}
          </p>
        )}

        {/* AI Summary Card */}
        {article.aiSummary && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 p-4 rounded-2xl bg-gradient-to-br from-primary-50/80 to-purple-50/80 border border-primary-100 backdrop-blur-sm"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">AI要約</h3>
            </div>
            <p className="text-sm text-foreground/80 leading-relaxed">
              {article.aiSummary}
            </p>

            {/* Key Points Toggle */}
            {article.aiKeyPoints.length > 0 && (
              <>
                <button
                  onClick={() => setShowKeyPoints(!showKeyPoints)}
                  className="mt-3 flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors"
                >
                  {showKeyPoints ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                  キーポイント（{article.aiKeyPoints.length}件）
                </button>
                <AnimatePresence>
                  {showKeyPoints && (
                    <motion.ul
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-2 space-y-1.5 overflow-hidden"
                    >
                      {article.aiKeyPoints.map((point, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-xs text-foreground/70"
                        >
                          <span className="w-4 h-4 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center flex-shrink-0 text-[10px] font-bold mt-0.5">
                            {i + 1}
                          </span>
                          {point}
                        </li>
                      ))}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </>
            )}
          </motion.div>
        )}

        {/* CTA: noteで読む */}
        <motion.button
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          onClick={handleOpenNote}
          className={cn(
            "mt-6 w-full py-4 rounded-2xl",
            "bg-gradient-to-r from-[#2cbc63] to-[#1da04d]",
            "text-white font-semibold text-base",
            "flex items-center justify-center gap-2",
            "shadow-lg shadow-[#2cbc63]/25",
            "hover:shadow-xl hover:shadow-[#2cbc63]/30 hover:-translate-y-0.5",
            "active:translate-y-0 active:shadow-md",
            "transition-all duration-200",
          )}
        >
          <ExternalLink className="w-5 h-5" />
          noteで読む
        </motion.button>
        <p className="mt-2 text-center text-[11px] text-muted-foreground">
          note.comの元記事ページが新しいタブで開きます
        </p>

        {/* Reading Management Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6 p-4 rounded-2xl bg-card border border-border"
        >
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <StickyNote className="w-4 h-4 text-muted-foreground" />
            読書管理
          </h3>

          {/* Status Toggle */}
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={handleMarkAsRead}
              className={cn(
                "flex-1 py-2.5 rounded-xl text-sm font-medium transition-all",
                article.status === "read"
                  ? "bg-success-100 text-success-700 border border-success-200"
                  : "bg-muted text-muted-foreground hover:bg-accent",
              )}
            >
              {article.status === "read" ? "✓ 読了済み" : "読了にする"}
            </button>
          </div>

          {/* Memo */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              メモ
            </label>
            <textarea
              value={memoText}
              onChange={(e) => setMemoText(e.target.value)}
              placeholder="気づきやアクションをメモ..."
              rows={3}
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-300 resize-none transition-all"
            />
            <div className="flex items-center justify-between mt-2">
              <AnimatePresence>
                {memoSaved && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-xs text-success-600 flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" />
                    保存しました
                  </motion.span>
                )}
              </AnimatePresence>
              <button
                onClick={handleSaveMemo}
                className="ml-auto px-4 py-1.5 rounded-lg bg-primary-500 text-white text-xs font-medium hover:bg-primary-600 transition-colors"
              >
                メモを保存
              </button>
            </div>
          </div>
        </motion.div>

        {/* Article Info Footer */}
        <div className="mt-6 p-4 rounded-2xl bg-muted/50 border border-border">
          <dl className="space-y-2 text-xs">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">文字数</dt>
              <dd className="text-foreground font-medium">
                {article.wordCount.toLocaleString()}字
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">種別</dt>
              <dd className="text-foreground font-medium capitalize">
                {article.contentType === "text"
                  ? "テキスト"
                  : article.contentType === "image"
                    ? "画像"
                    : article.contentType === "sound"
                      ? "音声"
                      : "動画"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">保存日</dt>
              <dd className="text-foreground font-medium">
                {new Date(article.savedAt).toLocaleDateString("ja-JP")}
              </dd>
            </div>
            {article.readAt && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">読了日</dt>
                <dd className="text-foreground font-medium">
                  {new Date(article.readAt).toLocaleDateString("ja-JP")}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>
    </div>
  );
}
