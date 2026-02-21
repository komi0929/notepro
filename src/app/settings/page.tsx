"use client";

import { useState } from "react";
import {
  Trash2,
  Database,
  Info,
  AlertTriangle,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { articles, deleteAllArticles } = useAppStore();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);

  const articleCount = articles.length;
  const readCount = articles.filter((a) => a.status === "read").length;
  const unreadCount = articles.filter((a) => a.status === "unread").length;

  const handleDeleteAll = async () => {
    setIsDeleting(true);
    await deleteAllArticles();
    setIsDeleting(false);
    setShowConfirm(false);
    setDeleteSuccess(true);
    setTimeout(() => setDeleteSuccess(false), 3000);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-foreground mb-6">設定</h1>

      {/* Data Summary */}
      <div className="mb-6">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-1">
          データ概要
        </h3>
        <div className="bg-card rounded-2xl border border-border p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
              <Database className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                Supabase 接続中
              </p>
              <p className="text-xs text-muted-foreground">
                データはクラウドに永続保存されています
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-muted text-center">
              <p className="text-xl font-bold text-foreground">
                {articleCount}
              </p>
              <p className="text-[10px] text-muted-foreground">全記事数</p>
            </div>
            <div className="p-3 rounded-xl bg-muted text-center">
              <p className="text-xl font-bold text-foreground">{unreadCount}</p>
              <p className="text-[10px] text-muted-foreground">未読</p>
            </div>
            <div className="p-3 rounded-xl bg-muted text-center">
              <p className="text-xl font-bold text-foreground">{readCount}</p>
              <p className="text-[10px] text-muted-foreground">読了</p>
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="mb-6">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-1">
          データ管理
        </h3>
        <div className="bg-card rounded-2xl border border-error-200 overflow-hidden">
          <div className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-error-100 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-error-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground mb-1">
                  全データを削除
                </p>
                <p className="text-xs text-muted-foreground mb-3">
                  保存した全記事・メモ・読書記録をデータベースから完全に削除します。この操作は元に戻せません。
                </p>

                <AnimatePresence mode="wait">
                  {deleteSuccess ? (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2 text-sm text-success-600"
                    >
                      <CheckCircle className="w-4 h-4" />
                      全データを削除しました
                    </motion.div>
                  ) : showConfirm ? (
                    <motion.div
                      key="confirm"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                    >
                      <div className="flex items-center gap-2 mb-3 p-3 rounded-xl bg-error-50 border border-error-200">
                        <AlertTriangle className="w-4 h-4 text-error-600 flex-shrink-0" />
                        <p className="text-xs text-error-700">
                          本当に{articleCount}件の全データを削除しますか？
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleDeleteAll}
                          disabled={isDeleting}
                          className={cn(
                            "h-9 px-4 rounded-xl text-sm font-medium text-white",
                            "bg-error-600 hover:bg-error-700",
                            "disabled:opacity-50",
                            "transition-colors min-w-[100px]",
                          )}
                        >
                          {isDeleting ? (
                            <span className="flex items-center gap-2">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              削除中...
                            </span>
                          ) : (
                            "削除する"
                          )}
                        </button>
                        <button
                          onClick={() => setShowConfirm(false)}
                          disabled={isDeleting}
                          className="h-9 px-4 rounded-xl text-sm font-medium text-muted-foreground hover:bg-accent transition-colors"
                        >
                          キャンセル
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.button
                      key="trigger"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setShowConfirm(true)}
                      disabled={articleCount === 0}
                      className={cn(
                        "h-9 px-4 rounded-xl text-sm font-medium",
                        "border border-error-300 text-error-600",
                        "hover:bg-error-50",
                        "disabled:opacity-50 disabled:cursor-not-allowed",
                        "transition-colors",
                      )}
                    >
                      全データを削除
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* App Info */}
      <div>
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-1">
          アプリ情報
        </h3>
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3.5">
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-foreground">
              <Info className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">バージョン</p>
            </div>
            <span className="text-sm text-muted-foreground">0.1.0</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="text-xs text-muted-foreground">notame v0.1.0</p>
        <p className="text-[10px] text-muted-foreground/50 mt-1">
          note.com記事管理ツール
        </p>
      </div>
    </div>
  );
}
