"use client";

import { useState } from "react";
import {
  Bookmark,
  FileText,
  CheckSquare,
  MessageSquare,
  Loader2,
  X,
  Link as LinkIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";

const ACTIONS = [
  {
    value: "read_later",
    icon: <Bookmark className="w-5 h-5" />,
    label: "後で読む",
    description: "デフォルトの保存",
    isDefault: true,
  },
  {
    value: "notion_summary",
    icon: <FileText className="w-5 h-5" />,
    label: "要約をNotionに送る",
    description: "3行要約を自動生成",
  },
  {
    value: "todo_item",
    icon: <CheckSquare className="w-5 h-5" />,
    label: "ToDoリストに追加",
    description: "タスクとして管理",
  },
  {
    value: "slack_share",
    icon: <MessageSquare className="w-5 h-5" />,
    label: "Slackで共有",
    description: "チームに共有",
  },
];

export function SaveArticleModal() {
  const { isSaveModalOpen, closeSaveModal, saveModalUrl, saveArticle } =
    useAppStore();
  const [url, setUrl] = useState(saveModalUrl);
  const [selectedAction, setSelectedAction] = useState("read_later");
  const [isSaving, setIsSaving] = useState(false);

  const isValidNoteUrl =
    url.trim() === "" ||
    /^https?:\/\/(www\.)?note\.com\/[^/]+\/n\//.test(url.trim());
  const canSave = url.trim() !== "" && isValidNoteUrl;

  const handleSave = async () => {
    if (!canSave) return;
    setIsSaving(true);
    await saveArticle(url, selectedAction);
    setIsSaving(false);
    setUrl("");
    setSelectedAction("read_later");
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
            className="fixed inset-x-4 top-[10%] z-[61] max-w-lg mx-auto bg-card rounded-2xl shadow-2xl border border-border overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  note記事を保存
                </h2>
                <p className="text-sm text-muted-foreground">
                  note.comの記事URLを入力してください
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
            <div className="px-6 pt-4">
              <div className="relative">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="url"
                  placeholder="https://note.com/username/n/n1234..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
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
            </div>

            {/* Action Selection */}
            <div className="px-6 pt-4 pb-2">
              <label className="text-sm font-medium text-muted-foreground mb-3 block">
                次のアクションを選択:
              </label>
              <div className="space-y-2">
                {ACTIONS.map((action) => (
                  <label
                    key={action.value}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-200",
                      selectedAction === action.value
                        ? "border-primary-500 bg-primary-50"
                        : "border-border hover:bg-accent",
                    )}
                  >
                    <input
                      type="radio"
                      name="action"
                      value={action.value}
                      checked={selectedAction === action.value}
                      onChange={(e) => setSelectedAction(e.target.value)}
                      className="sr-only"
                    />
                    <div
                      className={cn(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors",
                        selectedAction === action.value
                          ? "border-primary-500 bg-primary-500"
                          : "border-border",
                      )}
                    >
                      {selectedAction === action.value && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-muted-foreground">
                          {action.icon}
                        </span>
                        <span className="text-sm font-medium text-foreground">
                          {action.label}
                        </span>
                        {action.isDefault && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary-100 text-primary-700">
                            推奨
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {action.description}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border mt-2">
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
                    保存中...
                  </span>
                ) : (
                  "保存"
                )}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
