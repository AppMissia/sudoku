// src/components/TopBar.tsx
import React, { useMemo } from "react";
import { Difficulty, Board } from "../types/sudoku";
import { Clock, Sun, Moon, Volume2, VolumeX, Pause, Play } from "lucide-react";

export interface TopBarProps {
  difficulty: Difficulty;
  onChangeDifficulty: (d: Difficulty) => void;
  mistakes: number;
  maxMistakes: number | null;
  onChangeMaxMistakes: (value: number | null) => void;
  timerSeconds: number;
  isPaused: boolean;
  onTogglePause: () => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  isMuted: boolean;
  onToggleSound: () => void;
  board: Board;
}

const LABELS: Record<Difficulty, string> = {
  easy: "Лёгкий",
  medium: "Средний",
  hard: "Сложный",
  expert: "Эксперт",
};

const formatTime = (sec: number) => {
  const m = String(Math.floor(sec / 60)).padStart(2, "0");
  const s = String(sec % 60).padStart(2, "0");
  return `${m}:${s}`;
};

export const TopBar: React.FC<TopBarProps> = ({
  difficulty,
  onChangeDifficulty,
  mistakes,
  maxMistakes,
  timerSeconds,
  isPaused,
  onTogglePause,
  theme,
  onToggleTheme,
  isMuted,
  onToggleSound,
  board,
}) => {
  const difficulties: Difficulty[] = ["easy", "medium", "hard", "expert"];

  // Progress calculation
  const { filled, total } = useMemo(() => {
    let f = 0;
    board.forEach(row => row.forEach(c => { if (c.value !== null) f++; }));
    return { filled: f, total: 81 };
  }, [board]);

  const pct = Math.round((filled / total) * 100);

  return (
    <div className="w-full max-w-[420px] mx-auto space-y-3">
      {/* Row 1: Difficulty pills */}
      <div className="flex items-center justify-center gap-1.5">
        {difficulties.map(d => (
          <button
            key={d}
            onClick={() => onChangeDifficulty(d)}
            className={`
              px-3 py-1.5 rounded-full text-xs font-medium tracking-wide
              transition-all duration-150
              ${difficulty === d
                ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/30"
                : "bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-zinc-200"
              }
            `}
          >
            {LABELS[d]}
          </button>
        ))}
      </div>

      {/* Row 2: Progress bar */}
      <div className="relative h-1 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Row 3: Stats bar */}
      <div className="flex items-center justify-between px-1">
        {/* Mistakes */}
        <div className="flex items-center gap-2">
          <div className="flex gap-0.5">
            {Array.from({ length: maxMistakes ?? 3 }).map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  i < mistakes
                    ? "bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.6)]"
                    : "bg-zinc-700"
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-zinc-500 tabular-nums">
            {mistakes}{maxMistakes !== null ? `/${maxMistakes}` : ""}
          </span>
        </div>

        {/* Progress text */}
        <span className="text-[11px] text-zinc-500 tabular-nums font-medium">
          {filled}/{total} · {pct}%
        </span>

        {/* Timer */}
        <div className="flex items-center gap-1.5">
          <Clock size={13} className="text-zinc-500" />
          <span className="text-sm font-mono text-zinc-300 tabular-nums tracking-tight">
            {formatTime(timerSeconds)}
          </span>
          <button
            onClick={onTogglePause}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-white/5 transition-colors"
          >
            {isPaused ? <Play size={13} /> : <Pause size={13} />}
          </button>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={onToggleSound}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-white/5 transition-colors"
          >
            {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </button>
          <button
            onClick={onToggleTheme}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-white/5 transition-colors"
          >
            {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>
      </div>
    </div>
  );
};
