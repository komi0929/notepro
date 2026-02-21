"use client";

import {
  Clock,
  MoreVertical,
  BookOpen,
  Share2,
  Archive,
  Trash2,
  Heart,
  Hash,
  Lock,
  User,
  ExternalLink,
} from "lucide-react";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { Article } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/lib/store";
import { useState } from "react";
import Link from "next/link";

interface SavedArticlesListProps {
  articles: Article[];
}

export function SavedArticlesList({ articles }: SavedArticlesListProps) {
  const { archiveSuggestions, openArchiveModal } = useAppStore();

  return (
    <section className="px-4 py-6">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-foreground">保存した記事</h2>
        <FilterButton />
      </div>

      {/* Archive Suggestion Banner */}
      {archiveSuggestions.length > 0 && (
        <ArchiveSuggestionBanner
          count={archiveSuggestions.length}
          onReview={openArchiveModal}
        />
      )}

      {/* Articles */}
      <div className="space-y-3">
        <AnimatePresence>
          {articles.map((article) => (
            <SavedArticleCard key={article.id} article={article} />
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
}

function FilterButton() {
  const { currentFilter, setFilter } = useAppStore();
  const filters = [
    { key: null, label: "すべて" },
    { key: "unread", label: "未読" },
    { key: "reading", label: "読書中" },
    { key: "read", label: "読了" },
  ];

  return (
    <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
      {filters.map((filter) => (
        <button
          key={filter.key || "all"}
          onClick={() => setFilter(filter.key)}
          className={cn(
            "px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200",
            currentFilter === filter.key
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}

function ArchiveSuggestionBanner({
  count,
  onReview,
}: {
  count: number;
  onReview: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-4 p-4 rounded-2xl bg-gradient-to-br from-warning-50 to-orange-50 border border-warning-200"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-warning-100 flex items-center justify-center flex-shrink-0">
          <Archive className="w-5 h-5 text-warning-700" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-warning-900 mb-1">
            {count}件の記事、そろそろ整理しませんか？
          </p>
          <p className="text-xs text-warning-700 mb-3">
            30日以上読んでいない記事があります。アーカイブして、新しい記事に集中しましょう
          </p>
          <button
            onClick={onReview}
            className="h-8 px-4 rounded-lg text-xs font-medium border border-warning-300 text-warning-800 hover:bg-warning-100 transition-colors"
          >
            今すぐ整理する
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function SavedArticleCard({ article }: { article: Article }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { archiveArticles, deleteArticle } = useAppStore();

  const handleOpenNote = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.open(article.noteUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, x: -100 }}
      className="p-4 rounded-2xl bg-card border border-border hover:border-primary-200 transition-all duration-300 group"
    >
      {/* Header with Status and Menu */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <StatusBadge status={article.status} />
          {article.isPaid && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md border border-warning-200 bg-warning-50 text-warning-700 text-[10px] font-medium">
              <Lock className="w-2.5 h-2.5" />
              有料
            </span>
          )}
        </div>
        <div className="relative">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          {isMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsMenuOpen(false)}
              />
              <div className="absolute right-0 top-full mt-1 w-48 rounded-xl bg-card border border-border shadow-xl z-50 py-1 animate-scale-in">
                <Link
                  href={`/articles/${article.id}`}
                  className="flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-accent transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <BookOpen className="w-4 h-4" />
                  詳細を見る
                </Link>
                <button
                  onClick={handleOpenNote}
                  className="flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-accent transition-colors w-full text-left"
                >
                  <ExternalLink className="w-4 h-4" />
                  noteで開く
                </button>
                <button className="flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-accent transition-colors w-full text-left">
                  <Share2 className="w-4 h-4" />
                  共有
                </button>
                <div className="h-px bg-border mx-2 my-1" />
                <button
                  onClick={() => {
                    archiveArticles([article.id]);
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center gap-2 px-3 py-2.5 text-sm text-warning-700 hover:bg-accent transition-colors w-full text-left"
                >
                  <Archive className="w-4 h-4" />
                  アーカイブ
                </button>
                <button
                  onClick={() => {
                    deleteArticle(article.id);
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center gap-2 px-3 py-2.5 text-sm text-error-600 hover:bg-accent transition-colors w-full text-left"
                >
                  <Trash2 className="w-4 h-4" />
                  削除
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Creator + Title */}
      <div className="flex items-center gap-2 mb-1.5">
        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary-200 to-primary-100 flex items-center justify-center flex-shrink-0">
          <User className="w-3 h-3 text-primary-600" />
        </div>
        <span className="text-xs text-muted-foreground font-medium">
          {article.creator.nickname}
        </span>
      </div>
      <Link href={`/articles/${article.id}`}>
        <h3 className="text-base font-semibold text-foreground mb-2 line-clamp-2 cursor-pointer group-hover:text-primary-600 transition-colors">
          {article.title}
        </h3>
      </Link>

      {/* Metadata */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {article.readingTime}分
        </span>
        <span className="flex items-center gap-1 text-error-500">
          <Heart className="w-3 h-3 fill-current" />
          {article.likeCount}
        </span>
        <span>{formatRelativeTime(article.savedAt)}</span>
      </div>

      {/* Hashtags */}
      {article.hashtags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {article.hashtags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-muted text-xs text-muted-foreground font-medium"
            >
              <Hash className="w-2.5 h-2.5" />
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Freshness Warning */}
      {article.freshnessScore < 0.3 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-3 pt-3 border-t border-border"
        >
          <div className="flex items-center gap-2 text-xs text-warning-700">
            <Clock className="w-3.5 h-3.5" />
            <span>この記事、そろそろ旬が過ぎるかも</span>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; color: string }> = {
    unread: {
      label: "未読",
      color: "bg-primary-100 text-primary-700 border-primary-200",
    },
    reading: {
      label: "読書中",
      color: "bg-warning-100 text-warning-700 border-warning-200",
    },
    read: {
      label: "読了",
      color: "bg-success-100 text-success-700 border-success-600/20",
    },
    archived: {
      label: "アーカイブ",
      color: "bg-muted text-muted-foreground border-border",
    },
  };

  const { label, color } = config[status] || config.unread;

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-medium",
        color,
      )}
    >
      {label}
    </span>
  );
}
