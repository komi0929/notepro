"use client";

import { Bookmark, Search, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";

export function Header() {
  const { toggleCommandPalette, openSaveModal } = useAppStore();

  return (
    <header
      className={cn(
        "sticky top-0 z-50",
        "h-16 px-4",
        "glass",
        "border-b border-border",
        "flex items-center justify-between",
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/25">
          <Bookmark className="w-5 h-5 text-white" />
        </div>
        <h1 className="text-lg font-bold bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent">
          NoteReader
        </h1>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => openSaveModal()}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200"
          aria-label="記事を保存"
        >
          <Plus className="w-5 h-5" />
        </button>
        <button
          onClick={toggleCommandPalette}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200"
          aria-label="検索"
        >
          <Search className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
