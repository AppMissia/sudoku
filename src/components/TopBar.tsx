// src/components/TopBar.tsx
import React, { useMemo } from "react";
import { Board, Difficulty } from "../types/sudoku";
import { CalendarDays, Clock, Pause, Play, Settings as SettingsIcon, Sparkles, Trophy, Volume2, VolumeX } from "lucide-react";
import { DIFFICULTIES, DIFFICULTY_LABELS, formatTime, levelProgress } from "../services/progression";

export type View = "profile" | "leaderboard" | "daily" | "settings" | "auth";

export interface TopBarProps {
  avatar: string;
  xp: number;
  isSignedIn: boolean;
  onOpen: (view: View) => void;
  difficulty: Difficulty;
  dailyDate: string | null;
  onChangeDifficulty: (d: Difficulty) => void;
  mistakes: number;
  maxMistakes: number | null;
  timerSeconds: number;
  showTimer: boolean;
  isPaused: boolean;
  onTogglePause: () => void;
  isMuted: boolean;
  onToggleSound: () => void;
  animations: boolean;
  onToggleAnimations: () => void;
  board: Board;
  dailyDone: boolean;
}

const IconBtn: React.FC<{ onClick: () => void; label: string; children: React.ReactNode; dot?: boolean }> = ({
  onClick, label, children, dot,
}) => (
  <button
    onClick={onClick}
    aria-label={label}
    title={label}
    className="relative p-2 rounded-xl text-muted hover:text-fg hover:bg-fg/5 transition-colors active:scale-95"
  >
    {children}
    {dot && <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent ring-2 ring-bg" />}
  </button>
);

const formatDailyDate = (key: string) => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
};

export const TopBar: React.FC<TopBarProps> = ({
  avatar, xp, isSignedIn, onOpen,
  difficulty, dailyDate, onChangeDifficulty,
  mistakes, maxMistakes, timerSeconds, showTimer, isPaused, onTogglePause,
  isMuted, onToggleSound, animations, onToggleAnimations, board, dailyDone,
}) => {
  const { level, pct: levelPct } = levelProgress(xp);

  const { filled, pct } = useMemo(() => {
    let f = 0;
    board.forEach(row => row.forEach(c => { if (c.value !== null && !c.isError) f++; }));
    return { filled: f, pct: Math.round((f / 81) * 100) };
  }, [board]);

  // Ring around avatar shows progress to the next level
  const R = 19;
  const CIRC = 2 * Math.PI * R;

  return (
    <div className="w-full max-w-[420px] mx-auto space-y-3">
      {/* Row 1: profile + navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onOpen("profile")}
          className="flex items-center gap-2.5 pr-3 rounded-full hover:bg-fg/5 transition-colors active:scale-[0.98]"
        >
          <span className="relative w-11 h-11 flex items-center justify-center">
            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 44 44">
              <circle cx="22" cy="22" r={R} fill="none" strokeWidth="3" className="stroke-surface-2" />
              <circle
                cx="22" cy="22" r={R} fill="none" strokeWidth="3" strokeLinecap="round"
                className="stroke-accent transition-all duration-700"
                strokeDasharray={CIRC}
                strokeDashoffset={CIRC * (1 - levelPct / 100)}
              />
            </svg>
            <span className="text-xl leading-none">{avatar}</span>
            <span className="absolute -bottom-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-accent text-accent-fg text-[10px] font-bold flex items-center justify-center ring-2 ring-bg">
              {level}
            </span>
          </span>
          <span className="text-left leading-tight">
            <span className="block text-sm font-semibold text-fg">Судоку</span>
            <span className="block text-[11px] text-muted">{isSignedIn ? "Профиль" : "Гость · Войти"}</span>
          </span>
        </button>

        <div className="flex items-center">
          <IconBtn onClick={() => onOpen("daily")} label="Челлендж дня" dot={!dailyDone}>
            <CalendarDays size={19} />
          </IconBtn>
          <IconBtn onClick={() => onOpen("leaderboard")} label="Рейтинг">
            <Trophy size={19} />
          </IconBtn>
          <IconBtn onClick={onToggleSound} label={isMuted ? "Включить звук" : "Выключить звук"}>
            {isMuted ? <VolumeX size={19} /> : <Volume2 size={19} />}
          </IconBtn>
          <IconBtn onClick={onToggleAnimations} label={animations ? "Выключить анимации" : "Включить анимации"}>
            {animations ? (
              <Sparkles size={19} className="text-accent" />
            ) : (
              <div className="relative w-[19px] h-[19px] flex items-center justify-center">
                <Sparkles size={19} className="opacity-35" />
                <div className="absolute w-[22px] h-[2px] bg-muted rotate-45 rounded-full" />
              </div>
            )}
          </IconBtn>
          <IconBtn onClick={() => onOpen("settings")} label="Настройки">
            <SettingsIcon size={19} />
          </IconBtn>
        </div>
      </div>

      {/* Row 2: difficulty pills / daily badge */}
      {dailyDate ? (
        <div className="flex items-center justify-center gap-2">
          <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-accent/15 text-accent ring-1 ring-accent/30">
            📅 Челлендж дня · {formatDailyDate(dailyDate)} · {DIFFICULTY_LABELS[difficulty]}
          </span>
        </div>
      ) : (
        <div className="flex items-center justify-center gap-1.5">
          {DIFFICULTIES.map(d => (
            <button
              key={d}
              onClick={() => onChangeDifficulty(d)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium tracking-wide transition-all duration-150 ${
                difficulty === d
                  ? "bg-accent text-accent-fg shadow-lg shadow-accent/30"
                  : "bg-fg/5 text-muted hover:bg-fg/10 hover:text-fg"
              }`}
            >
              {DIFFICULTY_LABELS[d]}
            </button>
          ))}
        </div>
      )}

      {/* Row 3: progress bar */}
      <div className="relative h-1 bg-surface-2 rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-accent to-accent-2 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Row 4: stats */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2" title="Ошибки">
          {maxMistakes !== null ? (
            <div className="flex gap-1">
              {Array.from({ length: Math.min(maxMistakes, 10) }).map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    i < mistakes ? "bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.6)]" : "bg-surface-2"
                  }`}
                />
              ))}
            </div>
          ) : (
            <span className="text-[11px] text-muted">∞ Дзен</span>
          )}
          <span className={`text-xs tabular-nums ${mistakes > 0 ? "text-red-500" : "text-muted"}`}>
            {mistakes}{maxMistakes !== null ? `/${maxMistakes}` : ""}
          </span>
        </div>

        <span className="text-[11px] text-muted tabular-nums font-medium">
          {filled}/81 · {pct}%
        </span>

        <div className="flex items-center gap-1">
          {showTimer && (
            <>
              <Clock size={13} className="text-muted" />
              <span className="text-sm font-mono text-fg tabular-nums tracking-tight">{formatTime(timerSeconds)}</span>
            </>
          )}
          <button
            onClick={onTogglePause}
            aria-label={isPaused ? "Продолжить" : "Пауза"}
            className="p-1.5 rounded-lg text-muted hover:text-fg hover:bg-fg/5 transition-colors"
          >
            {isPaused ? <Play size={14} /> : <Pause size={14} />}
          </button>
        </div>
      </div>
    </div>
  );
};
