"use client";

import { TodaysQueue } from "@/components/TodaysQueue";
import { SavedArticlesList } from "@/components/SavedArticlesList";
import { useAppStore } from "@/lib/store";
import { ExternalLink, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function HomePage() {
  const {
    queueArticles,
    articles,
    currentFilter,
    lastSavedArticle,
    clearLastSaved,
  } = useAppStore();

  const filteredArticles = currentFilter
    ? articles.filter((a) => a.status === currentFilter)
    : articles.filter((a) => a.status !== "archived");

  return (
    <div className="max-w-2xl mx-auto">
      {/* Save Success Toast */}
      <AnimatePresence>
        {lastSavedArticle && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mx-4 mt-4 p-4 rounded-2xl bg-gradient-to-br from-success-50 to-emerald-50 border border-success-200"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-success-800 mb-1">
                  ✅ 保存しました！
                </p>
                <p className="text-xs text-success-700 truncate">
                  {lastSavedArticle.title}
                </p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => {
                    window.open(
                      lastSavedArticle.noteUrl,
                      "_blank",
                      "noopener,noreferrer",
                    );
                    clearLastSaved();
                  }}
                  className="h-8 px-3 rounded-lg text-xs font-medium bg-success-500 text-white hover:bg-success-600 transition-colors flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  今読む
                </button>
                <button
                  onClick={clearLastSaved}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-success-600 hover:bg-success-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <TodaysQueue articles={queueArticles} />

      <div className="h-px bg-border mx-4" />

      <SavedArticlesList articles={filteredArticles} />
    </div>
  );
}
