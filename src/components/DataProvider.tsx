"use client";

import { useEffect } from "react";
import { useAppStore } from "@/lib/store";

export function DataProvider({ children }: { children: React.ReactNode }) {
  const fetchArticles = useAppStore((s) => s.fetchArticles);
  const isLoading = useAppStore((s) => s.isLoading);
  const dbError = useAppStore((s) => s.dbError);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-primary-200 border-t-primary-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (dbError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-12 h-12 rounded-full bg-error-100 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">
            データ取得に失敗しました
          </h2>
          <p className="text-sm text-muted-foreground mb-4">{dbError}</p>
          <button
            onClick={() => fetchArticles()}
            className="h-10 px-6 rounded-xl text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 transition-colors"
          >
            再試行
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
