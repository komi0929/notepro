"use client";

import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { SaveArticleModal } from "@/components/SaveArticleModal";
import { ArchiveSuggestionModal } from "@/components/ArchiveSuggestionModal";
import { CommandPalette } from "@/components/CommandPalette";
import { DataProvider } from "@/components/DataProvider";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <DataProvider>
      <Header />
      <main className="pb-24">{children}</main>
      <BottomNav />
      <SaveArticleModal />
      <ArchiveSuggestionModal />
      <CommandPalette />
    </DataProvider>
  );
}
