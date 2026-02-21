"use client";

import { TodaysQueue } from "@/components/TodaysQueue";
import { SavedArticlesList } from "@/components/SavedArticlesList";
import { useAppStore } from "@/lib/store";

export default function HomePage() {
  const { queueArticles, articles, currentFilter } = useAppStore();

  const filteredArticles = currentFilter
    ? articles.filter((a) => a.status === currentFilter)
    : articles.filter((a) => a.status !== "archived");

  return (
    <div className="max-w-2xl mx-auto">
      <TodaysQueue articles={queueArticles} />

      <div className="h-px bg-border mx-4" />

      <SavedArticlesList articles={filteredArticles} />
    </div>
  );
}
