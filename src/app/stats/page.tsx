"use client";

import {
  BookOpen,
  Flame,
  TrendingUp,
  Clock,
  BarChart3,
  Trophy,
  Zap,
  Hash,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import { motion } from "framer-motion";

export default function StatsPage() {
  const { readingStats } = useAppStore();
  const dayNames = ["月", "火", "水", "木", "金", "土", "日"];
  const maxWeekly = Math.max(...readingStats.weeklyRead, 1);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-foreground mb-6">読書統計</h1>

      {/* Streak Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 text-white mb-6 shadow-xl shadow-primary-500/20"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm opacity-80 mb-1">連続読書ストリーク</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold">{readingStats.streak}</span>
              <span className="text-lg opacity-80">日</span>
            </div>
          </div>
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
            <Flame className="w-8 h-8 text-orange-300" />
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm opacity-80">
          <Trophy className="w-4 h-4 text-yellow-300" />
          <span>最高記録: {readingStats.bestStreak}日</span>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <StatCard
          icon={<BookOpen className="w-5 h-5 text-primary-500" />}
          value={readingStats.totalRead}
          unit="記事"
          label="読了数"
          delay={0.1}
        />
        <StatCard
          icon={<BarChart3 className="w-5 h-5 text-success-500" />}
          value={Math.round(
            (readingStats.totalRead / readingStats.totalSaved) * 100,
          )}
          unit="%"
          label="消化率"
          delay={0.15}
        />
        <StatCard
          icon={<Clock className="w-5 h-5 text-warning-500" />}
          value={readingStats.averageReadingTime}
          unit="分"
          label="平均時間"
          delay={0.2}
        />
      </div>

      {/* Weekly Chart */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="p-5 rounded-2xl bg-card border border-border mb-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-foreground">
            今週の読書量
          </h3>
          {readingStats.weeklyGrowthPercent !== 0 && (
            <div
              className={cn(
                "flex items-center gap-1 text-sm",
                readingStats.weeklyGrowthPercent > 0
                  ? "text-success-600"
                  : "text-error-600",
              )}
            >
              <TrendingUp className="w-4 h-4" />
              <span className="font-medium">
                {readingStats.weeklyGrowthPercent > 0 ? "+" : ""}
                {readingStats.weeklyGrowthPercent}%
              </span>
            </div>
          )}
        </div>

        <div className="flex items-end justify-between gap-2 h-40">
          {readingStats.weeklyRead.map((count, index) => (
            <div
              key={index}
              className="flex-1 flex flex-col items-center gap-2"
            >
              <motion.div
                initial={{ height: 0 }}
                animate={{
                  height: `${(count / maxWeekly) * 100}%`,
                }}
                transition={{ duration: 0.5, delay: 0.3 + index * 0.05 }}
                className={cn(
                  "w-full min-h-[4px] rounded-t-lg",
                  index === new Date().getDay() - 1 ||
                    (new Date().getDay() === 0 && index === 6)
                    ? "bg-gradient-to-t from-primary-500 to-primary-400"
                    : "bg-primary-200",
                )}
              />
              <span className="text-xs text-muted-foreground font-medium">
                {dayNames[index]}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Top Hashtags */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="p-5 rounded-2xl bg-card border border-border mb-6"
      >
        <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
          <Hash className="w-4 h-4 text-primary-500" />
          よく読むハッシュタグ
        </h3>
        <div className="space-y-3">
          {readingStats.topHashtags.map((tag, index) => {
            const maxCount = readingStats.topHashtags[0].count;
            const percentage = (tag.count / maxCount) * 100;
            const colors = [
              "from-primary-500 to-primary-400",
              "from-blue-500 to-blue-400",
              "from-purple-500 to-purple-400",
              "from-success-500 to-emerald-400",
              "from-warning-500 to-amber-400",
            ];

            return (
              <div key={tag.name} className="group">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-muted-foreground w-4">
                      {index + 1}.
                    </span>
                    <span className="text-sm font-medium text-foreground">
                      #{tag.name}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {tag.count}記事
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden ml-6">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{
                      duration: 0.5,
                      delay: 0.4 + index * 0.05,
                    }}
                    className={cn(
                      "h-full rounded-full bg-gradient-to-r",
                      colors[index % colors.length],
                    )}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Top Creators */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="p-5 rounded-2xl bg-card border border-border"
      >
        <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
          <User className="w-4 h-4 text-primary-500" />
          よく読むクリエイター
        </h3>
        <div className="space-y-3">
          {readingStats.topCreators.map((creator, index) => (
            <div key={creator.urlname} className="flex items-center gap-3">
              <span className="text-xs font-mono text-muted-foreground w-4">
                {index + 1}.
              </span>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-200 to-primary-100 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-primary-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">
                  {creator.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  @{creator.urlname}
                </p>
              </div>
              <span className="text-xs text-muted-foreground">
                {creator.count}記事
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Motivation message */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-6 p-4 rounded-2xl bg-gradient-to-br from-primary-50 to-purple-50 border border-primary-100 text-center"
      >
        <Zap className="w-6 h-6 text-primary-500 mx-auto mb-2" />
        <p className="text-sm font-medium text-foreground mb-0.5">
          {readingStats.streak >= 3
            ? `${readingStats.streak}日連続読書中！🔥`
            : readingStats.totalRead > 0
              ? "いい調子です！🎉"
              : "最初の記事を読了しましょう 📚"}
        </p>
        <p className="text-xs text-muted-foreground">
          {readingStats.weeklyGrowthPercent > 0
            ? `先週より${readingStats.weeklyGrowthPercent}%多く読んでいます`
            : readingStats.totalRead > 0
              ? `合計${readingStats.totalRead}記事を読了しました`
              : "note.comの記事を保存して読書を始めましょう"}
        </p>
      </motion.div>
    </div>
  );
}

function StatCard({
  icon,
  value,
  unit,
  label,
  delay = 0,
}: {
  icon: React.ReactNode;
  value: number;
  unit: string;
  label: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="p-4 rounded-2xl bg-card border border-border text-center"
    >
      <div className="flex justify-center mb-2">{icon}</div>
      <div className="text-xl font-bold text-foreground mb-0.5">
        {value}
        <span className="text-sm font-normal text-muted-foreground ml-0.5">
          {unit}
        </span>
      </div>
      <p className="text-xs text-muted-foreground">{label}</p>
    </motion.div>
  );
}
