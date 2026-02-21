"use client";

import { useState } from "react";
import { Loader2, X, Link as LinkIcon, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";

export function SaveArticleModal() {
  const {
    isSaveModalOpen,
    closeSaveModal,
    saveModalUrl,
    saveArticle,
    dbError,
  } = useAppStore();
  const [url, setUrl] = useState(saveModalUrl);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const isValidNoteUrl =
    url.trim() === "" ||
    /^https?:\/\/(www\.)?note\.com\/[^/]+\/n\//.test(url.trim());
  const canSave = url.trim() !== "" && isValidNoteUrl;

  const handleSave = async () => {
    if (!canSave) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      await saveArticle(url);
      setUrl("");
    } catch {
      setSaveError("保存に失敗しました。もう一度お試しください。");
    }
    setIsSaving(false);
  };

  return (
    <AnimatePresence>
      {isSaveModalOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
            onClick={closeSaveModal}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="fixed inset-x-4 top-[15%] z-[61] max-w-lg mx-auto bg-card rounded-2xl shadow-2xl border border-border overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  noteを保存
                </h2>
                <p className="text-sm text-muted-foreground">
                  気になったnote記事を保存して、後で読みましょう
                </p>
              </div>
              <button
                onClick={closeSaveModal}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-accent transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* URL Input */}
            <div className="px-6 py-5">
              <div className="relative">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="url"
                  placeholder="https://note.com/username/n/n1234..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && canSave && !isSaving) handleSave();
                  }}
                  className="w-full h-12 pl-10 pr-4 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  autoFocus
                />
              </div>
              {url && !isValidNoteUrl && (
                <p className="mt-2 text-xs text-error-600 flex items-center gap-1">
                  ⚠️
                  note.comの記事URL（note.com/ユーザー名/n/記事ID）を入力してください
                </p>
              )}
              {(saveError || dbError) && (
                <p className="mt-2 text-xs text-error-600 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {saveError || dbError}
                </p>
              )}
              <p className="mt-3 text-xs text-muted-foreground">
                保存すると、タイトル・著者・ハッシュタグを自動取得します
              </p>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
              <button
                onClick={closeSaveModal}
                disabled={isSaving}
                className="h-10 px-5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleSave}
                disabled={!canSave || isSaving}
                className={cn(
                  "h-10 px-6 rounded-xl text-sm font-medium text-white",
                  "bg-gradient-to-r from-primary-500 to-primary-600",
                  "hover:from-primary-600 hover:to-primary-700",
                  "shadow-lg shadow-primary-500/25",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "transition-all duration-200 min-w-[100px]",
                )}
              >
                {isSaving ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    取得中...
                  </span>
                ) : (
                  "保存する"
                )}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
