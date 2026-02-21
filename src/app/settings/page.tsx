"use client";

import {
  Bell,
  Globe,
  Shield,
  HelpCircle,
  ChevronRight,
  ExternalLink,
} from "lucide-react";

export default function SettingsPage() {
  const sections = [
    {
      title: "通知",
      items: [
        {
          icon: <Bell className="w-4 h-4" />,
          label: "プッシュ通知",
          subtitle: "キュー更新・記事推薦を通知",
          action: "arrow" as const,
        },
      ],
    },
    {
      title: "連携",
      items: [
        {
          icon: <Globe className="w-4 h-4" />,
          label: "外部サービス連携",
          subtitle: "Notion・Slack・ToDo",
          action: "arrow" as const,
        },
      ],
    },
    {
      title: "その他",
      items: [
        {
          icon: <Shield className="w-4 h-4" />,
          label: "プライバシーポリシー",
          action: "external" as const,
        },
        {
          icon: <HelpCircle className="w-4 h-4" />,
          label: "ヘルプ＆フィードバック",
          action: "external" as const,
        },
      ],
    },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-foreground mb-6">設定</h1>

      <div className="space-y-6">
        {sections.map((section) => (
          <div key={section.title}>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-1">
              {section.title}
            </h3>
            <div className="bg-card rounded-2xl border border-border overflow-hidden divide-y divide-border">
              {section.items.map((item) => (
                <button
                  key={item.label}
                  className="flex items-center justify-between w-full px-4 py-3.5 hover:bg-accent transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-foreground">
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {item.label}
                      </p>
                      {"subtitle" in item && item.subtitle && (
                        <p className="text-xs text-muted-foreground">
                          {item.subtitle}
                        </p>
                      )}
                    </div>
                  </div>
                  <div>
                    {item.action === "arrow" && (
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    )}
                    {item.action === "external" && (
                      <ExternalLink className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Version */}
      <div className="mt-8 text-center">
        <p className="text-xs text-muted-foreground">NoteReader v0.1.0</p>
        <p className="text-[10px] text-muted-foreground/50 mt-1">
          Made with ❤️ for note readers
        </p>
      </div>
    </div>
  );
}
