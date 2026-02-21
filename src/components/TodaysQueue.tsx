"use client";

import {
  Sparkles,
  Sun,
  BookOpen,
  Moon,
  Clock,
  Flame,
  Heart,
  User,
  Hash,
} from "lucide-react";
import {
  cn,
  formatRelativeTime,
  getTimeSlot,
  getQueueTitle,
} from "@/lib/utils";
import type { Article } from "@/lib/types";
import { motion } from "framer-motion";
import Link from "next/link";

interface TodaysQueueProps {
  articles: Article[];
}

export function TodaysQueue({ articles }: TodaysQueueProps) {
  const timeSlot = getTimeSlot();
  const queueTitle = getQueueTitle(timeSlot);

  const QueueIcon = () => {
    const icons: Record<string, React.ReactNode> = {
      morning: <Sun className="w-6 h-6 text-yellow-500" />,
      afternoon: <BookOpen className="w-6 h-6 text-blue-500" />,
      evening: <Clock className="w-6 h-6 text-purple-500" />,
      night: <Moon className="w-6 h-6 text-indigo-500" />,
    };
    return (
      <>{icons[timeSlot] || <Clock className="w-6 h-6 text-neutral-500" />}</>
    );
  };

  if (articles.length === 0) return null;

  return (
    <section className="px-4 py-6">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <QueueIcon />
          <h2 className="text-xl font-semibold text-foreground">
            {queueTitle}
          </h2>
        </div>
        <Link
          href="/search"
          className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
        >
          すべて見る
        </Link>
      </div>

      {/* Insight Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-4 p-4 rounded-2xl bg-gradient-to-br from-primary-50 to-primary-100 border border-primary-200"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary-500/25">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-primary-900 mb-1">
              未読のおすすめが{articles.length}件あります
            </p>
            <p className="text-xs text-primary-700">
              {timeSlot === "morning"
                ? "通勤時間にぴったりな短めの記事を選びました"
                : timeSlot === "evening"
                  ? "帰宅中にサクッと読めるnote記事です"
                  : "じっくり読むのにおすすめの記事です"}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Article Cards - Horizontal Scroll */}
      <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory scrollbar-hide">
        {articles.map((article, index) => (
          <QueueArticleCard key={article.id} article={article} index={index} />
        ))}
      </div>
    </section>
  );
}

function QueueArticleCard({
  article,
  index,
}: {
  article: Article;
  index: number;
}) {
  return (
    <Link href={`/articles/${article.id}`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay: index * 0.1 }}
        className={cn(
          "w-72 flex-shrink-0 snap-start",
          "p-4 rounded-2xl",
          "bg-card border border-border",
          "shadow-sm hover:shadow-lg transition-all duration-300",
          "cursor-pointer group",
        )}
      >
        {/* Priority Badge */}
        {article.priority > 0.7 && (
          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-error-50 border border-error-200 mb-3">
            <Flame className="w-3 h-3 text-error-600" />
            <span className="text-xs font-medium text-error-700">旬な記事</span>
          </div>
        )}

        {/* Creator */}
        <div className="flex items-center gap-2 mb-2">
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary-200 to-primary-100 flex items-center justify-center flex-shrink-0">
            <User className="w-3 h-3 text-primary-600" />
          </div>
          <span className="text-xs text-muted-foreground font-medium truncate">
            {article.creator.nickname}
          </span>
          {article.isPaid && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-warning-100 text-warning-700">
              有料
            </span>
          )}
        </div>

        {/* Article Title */}
        <h3 className="text-base font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors">
          {article.title}
        </h3>

        {/* Excerpt */}
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {article.excerpt}
        </p>

        {/* Metadata */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {article.readingTime > 0 && (
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>約{article.readingTime}分</span>
            </div>
          )}
          {article.likeCount > 0 && (
            <div className="flex items-center gap-1 text-error-500">
              <Heart className="w-3 h-3 fill-current" />
              <span>{article.likeCount}</span>
            </div>
          )}
          <span>{formatRelativeTime(article.savedAt)}</span>
        </div>

        {/* Hashtags */}
        {article.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {article.hashtags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] text-muted-foreground bg-muted font-medium"
              >
                <Hash className="w-2.5 h-2.5" />
                {tag}
              </span>
            ))}
          </div>
        )}
      </motion.div>
    </Link>
  );
}
