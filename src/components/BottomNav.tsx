"use client";

import { Home, Search, PlusCircle, BarChart3, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";

const NAV_ITEMS = [
  { href: "/", icon: Home, label: "ホーム" },
  { href: "/search", icon: Search, label: "検索" },
  { href: "#save", icon: PlusCircle, label: "保存", isAction: true },
  { href: "/stats", icon: BarChart3, label: "統計" },
  { href: "/settings", icon: Settings, label: "設定" },
];

export function BottomNav() {
  const pathname = usePathname();
  const { openSaveModal } = useAppStore();

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50",
        "h-[72px] px-2 pb-safe",
        "glass",
        "border-t border-border",
      )}
    >
      <div className="flex items-center justify-around h-full max-w-lg mx-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = !item.isAction && pathname === item.href;
          const Icon = item.icon;

          if (item.isAction) {
            return (
              <button
                key={item.href}
                onClick={() => openSaveModal()}
                className="flex flex-col items-center justify-center gap-1 -mt-4"
                aria-label={item.label}
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 transition-shadow">
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </button>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-col items-center justify-center gap-1 w-16 h-full",
                "transition-colors duration-200",
                isActive
                  ? "text-primary-600"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute top-0 w-8 h-0.5 rounded-full bg-primary-500"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
