"use client";

import { Search, SlidersHorizontal, X, Hash } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import Link from "next/link";
import { useAppStore } from "@/lib/store";
import { motion } from "framer-motion";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const { articles } = useAppStore();

  const filteredArticles = query
    ? articles.filter(
        (a) =>
          a.title.toLowerCase().includes(query.toLowerCase()) ||
          a.hashtags.some((t) =>
            t.toLowerCase().includes(query.toLowerCase()),
          ) ||
          (a.excerpt || "").toLowerCase().includes(query.toLowerCase()),
      )
    : [];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-foreground mb-6">検索</h1>

      {/* Search Input */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="キーワード、トピック、著者で検索..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full h-12 pl-12 pr-12 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-accent flex items-center justify-center hover:bg-primary-100 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Results */}
      {query ? (
        filteredArticles.length === 0 ? (
          <div className="py-16 text-center">
            <Search className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">
              「{query}」に一致する記事が見つかりません
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredArticles.map((article, i) => (
              <motion.div
                key={article.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  href={`/articles/${article.id}`}
                  className="block p-4 rounded-xl bg-card border border-border hover:border-primary-200:border-primary-700 transition-all"
                >
                  <h3 className="text-sm font-semibold text-foreground mb-1 line-clamp-2">
                    {article.title}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
                    {article.excerpt}
                  </p>
                  <div className="flex gap-1.5">
                    {article.hashtags.slice(0, 3).map((t) => (
                      <span
                        key={t}
                        className="px-2 py-0.5 rounded bg-muted text-[10px] text-muted-foreground"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )
      ) : (
        <div className="py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <SlidersHorizontal className="w-7 h-7 text-muted-foreground/50" />
          </div>
          <p className="text-sm text-muted-foreground mb-1">キーワードで検索</p>
          <p className="text-xs text-muted-foreground/70">
            記事のタイトル、トピック、内容から検索できます
          </p>
          <p className="text-xs text-muted-foreground/50 mt-4">
            Tip:{" "}
            <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border font-mono text-[10px]">
              Ctrl
            </kbd>{" "}
            +{" "}
            <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border font-mono text-[10px]">
              K
            </kbd>{" "}
            でコマンドパレットも使えます
          </p>
        </div>
      )}
    </div>
  );
}
