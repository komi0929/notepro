"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Search,
  Command,
  FileText,
  Clock,
  Hash,
  ArrowRight,
  X,
  User,
  Heart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

export function CommandPalette() {
  const { isCommandPaletteOpen, toggleCommandPalette, articles } =
    useAppStore();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter articles by query (search title, hashtags, creator name)
  const filteredArticles = query
    ? articles.filter(
        (a) =>
          a.title.toLowerCase().includes(query.toLowerCase()) ||
          a.hashtags.some((t) =>
            t.toLowerCase().includes(query.toLowerCase()),
          ) ||
          a.creator.nickname.toLowerCase().includes(query.toLowerCase()) ||
          a.creator.urlname.toLowerCase().includes(query.toLowerCase()) ||
          (a.excerpt || "").toLowerCase().includes(query.toLowerCase()),
      )
    : articles.slice(0, 5);

  // Keyboard shortcut to open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        toggleCommandPalette();
      }
      if (e.key === "Escape" && isCommandPaletteOpen) {
        toggleCommandPalette();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCommandPaletteOpen, toggleCommandPalette]);

  // Focus input on open
  useEffect(() => {
    if (isCommandPaletteOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery("");
      setSelectedIndex(0);
    }
  }, [isCommandPaletteOpen]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          Math.min(prev + 1, filteredArticles.length - 1),
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      }
    },
    [filteredArticles.length],
  );

  return (
    <AnimatePresence>
      {isCommandPaletteOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm"
            onClick={toggleCommandPalette}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="fixed inset-x-4 top-[15%] z-[71] max-w-xl mx-auto bg-card rounded-2xl shadow-2xl border border-border overflow-hidden"
          >
            {/* Search Input */}
            <div className="flex items-center gap-3 px-4 border-b border-border">
              <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                placeholder="記事・クリエイター・ハッシュタグを検索..."
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                onKeyDown={handleKeyDown}
                className="flex-1 h-14 bg-transparent text-base outline-none placeholder:text-muted-foreground"
              />
              <div className="flex items-center gap-1.5">
                <kbd className="hidden sm:inline-flex h-6 px-1.5 rounded bg-muted text-[10px] text-muted-foreground items-center font-mono">
                  ESC
                </kbd>
                <button
                  onClick={toggleCommandPalette}
                  className="sm:hidden w-8 h-8 rounded-lg flex items-center justify-center hover:bg-accent"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Results */}
            <div className="max-h-[50vh] overflow-y-auto py-2">
              {query && filteredArticles.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    「{query}」に一致する記事が見つかりません
                  </p>
                </div>
              ) : (
                <>
                  {!query && (
                    <div className="px-4 py-2">
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                        最近のnote記事
                      </p>
                    </div>
                  )}
                  {filteredArticles.map((article, index) => (
                    <Link
                      key={article.id}
                      href={`/articles/${article.id}`}
                      onClick={toggleCommandPalette}
                    >
                      <div
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors",
                          index === selectedIndex
                            ? "bg-primary-50"
                            : "hover:bg-accent",
                        )}
                      >
                        <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {article.title}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                              <User className="w-2.5 h-2.5" />
                              {article.creator.nickname}
                            </span>
                            {article.hashtags.slice(0, 2).map((tag) => (
                              <span
                                key={tag}
                                className="flex items-center gap-0.5 text-[10px] text-muted-foreground"
                              >
                                <Hash className="w-2.5 h-2.5" />
                                {tag}
                              </span>
                            ))}
                            <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                              <Clock className="w-2.5 h-2.5" />
                              {article.readingTime}分
                            </span>
                            <span className="flex items-center gap-0.5 text-[10px] text-error-500">
                              <Heart className="w-2.5 h-2.5 fill-current" />
                              {article.likeCount}
                            </span>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </Link>
                  ))}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-2.5 border-t border-border bg-muted/50">
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <kbd className="h-4 px-1 rounded bg-card border border-border font-mono text-[9px]">
                    ↑↓
                  </kbd>
                  移動
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="h-4 px-1 rounded bg-card border border-border font-mono text-[9px]">
                    ↵
                  </kbd>
                  開く
                </span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Command className="w-3 h-3" />
                <span>K で検索</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
