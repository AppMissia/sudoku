// src/components/GameModals.tsx
import React, { useEffect, useState, useCallback } from "react";
import { GameState, Difficulty } from "../types/sudoku";
import { Play, RotateCcw, ChevronRight, Trophy, XCircle } from "lucide-react";

export interface GameModalsProps {
  state: GameState;
  onContinue: () => void;
  onRestart: (difficulty?: Difficulty) => void;
  onNextGame: () => void;
  theme: "light" | "dark";
  toggleTheme: () => void;
}

const formatTime = (sec: number) => {
  const m = String(Math.floor(sec / 60)).padStart(2, "0");
  const s = String(sec % 60).padStart(2, "0");
  return `${m}:${s}`;
};

const DIFF_LABELS: Record<Difficulty, string> = {
  easy: "Лёгкий",
  medium: "Средний",
  hard: "Сложный",
  expert: "Эксперт",
};

// Simple confetti effect
const Confetti: React.FC = () => {
  const [pieces, setPieces] = useState<Array<{
    id: number; left: number; color: string; delay: number; duration: number; size: number;
  }>>([]);

  useEffect(() => {
    const colors = ["#818cf8", "#34d399", "#fbbf24", "#f87171", "#a78bfa", "#22d3ee"];
    const newPieces = Array.from({ length: 40 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 1.5,
      duration: 2 + Math.random() * 2,
      size: 4 + Math.random() * 8,
    }));
    setPieces(newPieces);
  }, []);

  return (
    <>
      {pieces.map(p => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            top: "-10px",
            backgroundColor: p.color,
            width: `${p.size}px`,
            height: `${p.size}px`,
            borderRadius: Math.random() > 0.5 ? "50%" : "2px",
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </>
  );
};

const Overlay: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
    <div className="w-full max-w-sm rounded-2xl bg-zinc-900 border border-zinc-700/50 shadow-2xl shadow-black/50 p-6 text-center space-y-5 animate-fade-in-up">
      {children}
    </div>
  </div>
);

const ModalButton: React.FC<{
  onClick: () => void;
  variant?: "primary" | "secondary";
  children: React.ReactNode;
}> = ({ onClick, variant = "primary", children }) => (
  <button
    onClick={onClick}
    className={`
      w-full px-5 py-3 rounded-xl font-medium text-sm
      transition-all duration-150 active:scale-[0.97]
      flex items-center justify-center gap-2
      ${variant === "primary"
        ? "bg-indigo-500 text-white hover:bg-indigo-400 shadow-lg shadow-indigo-500/25"
        : "bg-white/5 text-zinc-300 hover:bg-white/10 border border-white/10"
      }
    `}
  >
    {children}
  </button>
);

export const GameModals: React.FC<GameModalsProps> = ({
  state,
  onContinue,
  onRestart,
  onNextGame,
}) => {
  if (!state.isPaused && !state.isGameOver && !state.isWon) return null;

  // --- Pause ---
  if (state.isPaused) {
    return (
      <Overlay>
        <div className="w-14 h-14 mx-auto rounded-full bg-indigo-500/20 flex items-center justify-center">
          <Play size={28} className="text-indigo-400 ml-1" />
        </div>
        <h2 className="text-xl font-bold text-zinc-100">Пауза</h2>
        <p className="text-zinc-400 text-sm">
          Время: <span className="font-mono tabular-nums text-zinc-300">{formatTime(state.timerSeconds)}</span>
        </p>
        <ModalButton onClick={onContinue}>
          <Play size={16} />
          Продолжить
        </ModalButton>
      </Overlay>
    );
  }

  // --- Game Over ---
  if (state.isGameOver) {
    return (
      <Overlay>
        <div className="w-14 h-14 mx-auto rounded-full bg-red-500/20 flex items-center justify-center">
          <XCircle size={28} className="text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-zinc-100">Игра окончена</h2>
        <div className="space-y-1">
          <p className="text-zinc-400 text-sm">
            Ошибок: <span className="text-red-400 font-semibold">{state.mistakes}</span>
          </p>
          <p className="text-zinc-400 text-sm">
            Время: <span className="font-mono tabular-nums text-zinc-300">{formatTime(state.timerSeconds)}</span>
          </p>
        </div>
        <div className="space-y-2">
          <ModalButton onClick={() => onRestart(state.difficulty)}>
            <RotateCcw size={16} />
            Новая игра
          </ModalButton>
        </div>
      </Overlay>
    );
  }

  // --- Victory ---
  return (
    <>
      <Confetti />
      <Overlay>
        <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/20 flex items-center justify-center">
          <Trophy size={28} className="text-emerald-400" />
        </div>
        <h2 className="text-xl font-bold text-zinc-100">Поздравляем! 🎉</h2>
        <div className="space-y-1">
          <p className="text-zinc-400 text-sm">
            Время: <span className="font-mono tabular-nums text-zinc-300">{formatTime(state.timerSeconds)}</span>
          </p>
          <p className="text-zinc-400 text-sm">
            Сложность: <span className="text-indigo-400 font-medium">{DIFF_LABELS[state.difficulty]}</span>
          </p>
          <p className="text-zinc-400 text-sm">
            Ошибок: <span className={`font-semibold ${state.mistakes === 0 ? "text-emerald-400" : "text-zinc-300"}`}>{state.mistakes}</span>
            {state.mistakes === 0 && <span className="ml-1 text-emerald-400">Идеально!</span>}
          </p>
        </div>
        <div className="space-y-2">
          <ModalButton onClick={onNextGame}>
            <ChevronRight size={16} />
            Следующая партия
          </ModalButton>
          <ModalButton onClick={() => onRestart(state.difficulty)} variant="secondary">
            <RotateCcw size={16} />
            Начать заново
          </ModalButton>
        </div>
      </Overlay>
    </>
  );
};
