import type { Metadata } from "next";
import "./globals.css";
import { ClientLayout } from "@/components/ClientLayout";

export const metadata: Metadata = {
  title: "NoteReader — 保存した記事を、ちゃんと読む。",
  description:
    "note記事の保存から再発見まで。AIがあなたの読書習慣に合わせて最適な記事をお届けします。",
  keywords: ["note", "記事", "読書", "AI", "要約", "ブックマーク"],
  openGraph: {
    title: "NoteReader — 保存した記事を、ちゃんと読む。",
    description:
      "note記事の保存から再発見まで。AIがあなたの読書習慣に合わせて最適な記事をお届けします。",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body className="font-sans antialiased min-h-screen bg-background">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
