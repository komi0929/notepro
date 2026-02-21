"use client";

import { useState, useEffect } from "react";
import {
  Archive,
  CheckCircle,
  Loader2,
  X,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { cn, formatRelativeTime } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";

export function ArchiveSuggestionModal() {
  const {
    isArchiveModalOpen,
    closeArchiveModal,
    archiveSuggestions,
    archiveArticles,
  } = useAppStore();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isArchiving, setIsArchiving] = useState(false);

  // Auto-select all on mount
  useEffect(() => {
    if (isArchiveModalOpen && archiveSuggestions.length > 0) {
      setSelectedIds(new Set(archiveSuggestions.map((a) => a.id)));
    }
  }, [isArchiveModalOpen, archiveSuggestions]);

  const handleToggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleArchive = async () => {
    setIsArchiving(true);
    await archiveArticles(Array.from(selectedIds));
    setIsArchiving(false);
    setSelectedIds(new Set());
  };

  const stats = {
    unreadOver30Days: archiveSuggestions.filter(
      (a) => a.archiveReason === "unread_30_days",
    ).length,
    lowFreshness: archiveSuggestions.filter(
      (a) => a.archiveReason === "low_freshness",
    ).length,
  };

  return (
    <AnimatePresence>
      {isArchiveModalOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
            onClick={closeArchiveModal}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-x-4 top-[5%] z-[61] max-w-2xl mx-auto bg-card rounded-2xl shadow-2xl border border-border overflow-hidden max-h-[85vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
              <div className="flex items-center gap-2">
                <Archive className="w-5 h-5 text-warning-600" />
                <h2 className="text-lg font-semibold text-foreground">
                  記事を整理しましょう
                </h2>
              </div>
              <button
                onClick={closeArchiveModal}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-accent transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Stats */}
            <div className="px-6 py-4 flex-shrink-0">
              <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-gradient-to-br from-warning-50 to-orange-50 border border-warning-200">
                <div className="text-center">
                  <div className="text-2xl font-bold text-warning-900">
                    {stats.unreadOver30Days}件
                  </div>
                  <div className="text-xs text-warning-700">30日以上未読</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-warning-900">
                    {stats.lowFreshness}件
                  </div>
                  <div className="text-xs text-warning-700">鮮度切れ</div>
                </div>
              </div>
            </div>

            {/* Articles */}
            <div className="flex-1 overflow-y-auto px-6">
              {archiveSuggestions.length === 0 ? (
                <div className="py-12 text-center">
                  <CheckCircle className="w-12 h-12 text-success-500 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    整理が必要な記事はありません
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {archiveSuggestions.map((article) => (
                    <label
                      key={article.id}
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all",
                        selectedIds.has(article.id)
                          ? "border-primary-500 bg-primary-50"
                          : "border-border hover:bg-accent",
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.has(article.id)}
                        onChange={() => handleToggle(article.id)}
                        className="sr-only"
                      />
                      <div
                        className={cn(
                          "w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors",
                          selectedIds.has(article.id)
                            ? "border-primary-500 bg-primary-500"
                            : "border-border",
                        )}
                      >
                        {selectedIds.has(article.id) && (
                          <svg
                            className="w-3 h-3 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={3}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-foreground mb-1 line-clamp-1">
                          {article.title}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{formatRelativeTime(article.savedAt)}</span>
                          <span>•</span>
                          <span>{article.readingTime}分</span>
                        </div>
                        <div className="mt-2">
                          <ArchiveReasonBadge reason={article.archiveReason} />
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-border flex-shrink-0">
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    setSelectedIds(new Set(archiveSuggestions.map((a) => a.id)))
                  }
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  すべて選択
                </button>
                <span className="text-xs text-border">|</span>
                <button
                  onClick={() => setSelectedIds(new Set())}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  すべて解除
                </button>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={closeArchiveModal}
                  className="h-9 px-4 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleArchive}
                  disabled={selectedIds.size === 0 || isArchiving}
                  className={cn(
                    "h-9 px-5 rounded-xl text-sm font-medium text-white",
                    "bg-gradient-to-r from-warning-500 to-orange-500",
                    "hover:from-warning-600 hover:to-orange-600",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    "transition-all duration-200 min-w-[120px]",
                  )}
                >
                  {isArchiving ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      処理中...
                    </span>
                  ) : (
                    `${selectedIds.size}件アーカイブ`
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function ArchiveReasonBadge({ reason }: { reason: string }) {
  const config: Record<
    string,
    { label: string; color: string; icon: React.ReactNode }
  > = {
    unread_30_days: {
      label: "30日以上未読",
      color: "bg-orange-100 text-orange-700",
      icon: <Clock className="w-3 h-3" />,
    },
    low_freshness: {
      label: "鮮度切れ",
      color: "bg-error-100 text-error-700",
      icon: <AlertTriangle className="w-3 h-3" />,
    },
    low_relevance: {
      label: "関連性低下",
      color: "bg-warning-100 text-warning-700",
      icon: <AlertTriangle className="w-3 h-3" />,
    },
  };

  const { label, color, icon } = config[reason] || config.unread_30_days;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium",
        color,
      )}
    >
      {icon}
      {label}
    </span>
  );
}
