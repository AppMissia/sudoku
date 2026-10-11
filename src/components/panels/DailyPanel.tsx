// src/components/panels/DailyPanel.tsx
import React from "react";
import { Calendar, Play, CheckCircle2, Flame, Award, Clock } from "lucide-react";
import { Sheet, Card, SectionTitle } from "../Sheet";
import { usePlayer } from "../../context/PlayerContext";
import { toDateKey, dailyDifficulty } from "../../utils/sudokuEngine";
import { DIFFICULTY_LABELS, formatTime } from "../../services/progression";

interface DailyPanelProps {
  onClose: () => void;
  onStartDaily: (dateKey: string) => void;
  currentDailyDate: string | null;
}

export const DailyPanel: React.FC<DailyPanelProps> = ({ onClose, onStartDaily, currentDailyDate }) => {
  const { player } = usePlayer();
  const todayKey = toDateKey();
  const todayResult = player.daily[todayKey];
  const todayDiff = dailyDifficulty(todayKey);

  // Generate the last 14 days
  const days = React.useMemo(() => {
    const list: string[] = [];
    const now = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      list.push(toDateKey(d));
    }
    return list;
  }, []);

  const totalDailyCompleted = Object.keys(player.daily).length;

  return (
    <Sheet title="Ежедневный челлендж" onClose={onClose}>
      {/* Today's feature banner */}
      <Card className="relative overflow-hidden p-5 space-y-4 border-accent/40 bg-gradient-to-br from-surface to-surface-2">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-accent uppercase tracking-wider">
              <Calendar size={14} /> Сегодняшний вызов
            </div>
            <h2 className="text-xl font-bold text-fg mt-1">
              {new Date().toLocaleDateString("ru-RU", { day: "numeric", month: "long" })}
            </h2>
            <div className="text-xs text-muted mt-0.5">
              Сложность: <span className="font-semibold text-fg">{DIFFICULTY_LABELS[todayDiff]}</span>
            </div>
          </div>
          {todayResult ? (
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 size={24} />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-accent/20 text-accent flex items-center justify-center animate-pulse">
              <Award size={24} />
            </div>
          )}
        </div>

        {todayResult ? (
          <div className="flex items-center justify-between p-3 rounded-xl bg-surface-2/70 border border-line/40 text-sm">
            <div>
              <span className="text-xs text-muted block">Пройден со временем:</span>
              <span className="font-mono font-bold text-emerald-400 text-base">{formatTime(todayResult.time)}</span>
            </div>
            <div className="text-right">
              <span className="text-xs text-muted block">Ошибок:</span>
              <span className="font-bold text-fg text-sm">{todayResult.mistakes}</span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted">
            Уникальная головоломка дня, одинаковая для всех игроков по всему миру! Решите её без спешки и сравните своё время в таблице лидеров.
          </p>
        )}

        <button
          onClick={() => {
            onStartDaily(todayKey);
            onClose();
          }}
          className={`w-full py-3 rounded-xl font-semibold text-sm transition-all duration-150 flex items-center justify-center gap-2 shadow-lg ${
            todayResult
              ? "bg-surface-2 text-fg border border-line/60 hover:brightness-110"
              : "bg-accent text-accent-fg hover:brightness-110 shadow-accent/25"
          }`}
        >
          <Play size={16} />
          {todayResult
            ? currentDailyDate === todayKey
              ? "Продолжить сегодняшнюю партию"
              : "Сыграть ещё раз"
            : "Начать челлендж"}
        </button>
      </Card>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-2">
        <Card className="p-3 text-center">
          <div className="text-2xl font-bold text-accent flex items-center justify-center gap-1">
            <Flame size={20} className="text-amber-500" />
            <span>{player.currentStreak}</span>
          </div>
          <div className="text-[11px] text-muted mt-0.5">Текущая серия дней</div>
        </Card>
        <Card className="p-3 text-center">
          <div className="text-2xl font-bold text-fg">{totalDailyCompleted}</div>
          <div className="text-[11px] text-muted mt-0.5">Всего дней пройдено</div>
        </Card>
      </div>

      {/* History calendar list */}
      <div>
        <SectionTitle>Последние 14 дней</SectionTitle>
        <Card className="p-0 divide-y divide-line/40 overflow-hidden">
          {days.map(dateKey => {
            const res = player.daily[dateKey];
            const diff = dailyDifficulty(dateKey);
            const isToday = dateKey === todayKey;
            const isCurrent = currentDailyDate === dateKey;
            const [y, m, d] = dateKey.split("-").map(Number);
            const dateObj = new Date(y, m - 1, d);

            return (
              <div
                key={dateKey}
                className={`flex items-center justify-between p-3.5 transition-colors ${
                  isCurrent ? "bg-accent/10" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold ${
                      res
                        ? "bg-emerald-500/15 text-emerald-400"
                        : isToday
                        ? "bg-accent/20 text-accent"
                        : "bg-surface-2 text-muted"
                    }`}
                  >
                    {d}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-fg flex items-center gap-2">
                      <span>
                        {dateObj.toLocaleDateString("ru-RU", { weekday: "short", day: "numeric", month: "short" })}
                      </span>
                      {isToday && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-accent/20 text-accent font-bold">
                          Сегодня
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-muted">
                      {DIFFICULTY_LABELS[diff]}
                      {res && ` · ошибок ${res.mistakes}`}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {res ? (
                    <div className="text-right">
                      <div className="text-xs font-mono font-bold text-emerald-400">{formatTime(res.time)}</div>
                      <div className="text-[10px] text-muted">Пройдено</div>
                    </div>
                  ) : (
                    <span className="text-xs text-muted flex items-center gap-1">
                      <Clock size={12} /> Не решено
                    </span>
                  )}
                  <button
                    onClick={() => {
                      onStartDaily(dateKey);
                      onClose();
                    }}
                    title="Сыграть этот день"
                    className="p-2 rounded-lg bg-surface-2 hover:bg-fg/10 text-fg transition active:scale-95"
                  >
                    <Play size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </Card>
      </div>
    </Sheet>
  );
};
