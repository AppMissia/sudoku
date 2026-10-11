// src/components/GameModals.tsx
import React, { useMemo } from "react";
import { GameState, Difficulty, RewardInfo } from "../types/sudoku";
import { Play, RotateCcw, ChevronRight, Trophy, XCircle, Sparkles } from "lucide-react";
import { ACHIEVEMENT_MAP, DIFFICULTY_LABELS, formatTime, levelTitle } from "../services/progression";

export interface GameModalsProps {
  state: GameState;
  reward: RewardInfo | null;
  isNewRecord: boolean;
  isSignedIn: boolean;
  onContinue: () => void;
  onRestart: (difficulty?: Difficulty) => void;
  onNextGame: () => void;
  onOpenAuth: () => void;
}

const Confetti: React.FC = () => {
  const pieces = useMemo(() => {
    const colors = ["#818cf8", "#34d399", "#fbbf24", "#f87171", "#a78bfa", "#22d3ee"];
    return Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      color: colors[i % colors.length],
      delay: Math.random() * 1.5,
      duration: 2 + Math.random() * 2,
      size: 4 + Math.random() * 8,
      round: Math.random() > 0.5,
    }));
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
            borderRadius: p.round ? "50%" : "2px",
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
    <div className="w-full max-w-sm max-h-[90vh] overflow-y-auto scroll-thin rounded-3xl bg-surface border border-line/60 shadow-2xl shadow-black/50 p-6 text-center space-y-5 animate-fade-in-up">
      {children}
    </div>
  </div>
);

export const ModalButton: React.FC<{
  onClick: () => void;
  variant?: "primary" | "secondary";
  children: React.ReactNode;
}> = ({ onClick, variant = "primary", children }) => (
  <button
    onClick={onClick}
    className={`w-full px-5 py-3 rounded-xl font-medium text-sm transition-all duration-150 active:scale-[0.97] flex items-center justify-center gap-2 ${
      variant === "primary"
        ? "bg-accent text-accent-fg hover:brightness-110 shadow-lg shadow-accent/25"
        : "bg-fg/5 text-fg hover:bg-fg/10 border border-line/60"
    }`}
  >
    {children}
  </button>
);

const Stat: React.FC<{ label: string; value: React.ReactNode; highlight?: boolean }> = ({ label, value, highlight }) => (
  <div className="flex-1 rounded-xl bg-surface-2/60 py-2.5">
    <div className={`text-base font-bold tabular-nums ${highlight ? "text-accent-2" : "text-fg"}`}>{value}</div>
    <div className="text-[10px] uppercase tracking-wider text-muted mt-0.5">{label}</div>
  </div>
);

const RewardBlock: React.FC<{ reward: RewardInfo }> = ({ reward }) => (
  <div className="space-y-3">
    <div className="flex items-center justify-center gap-2 text-accent font-bold text-lg">
      <Sparkles size={18} /> +{reward.xpGained} XP
    </div>
    {reward.leveledUp && (
      <div className="rounded-xl bg-accent/15 ring-1 ring-accent/30 py-2.5 px-3 text-sm">
        <span className="font-bold text-accent">Новый уровень {reward.newLevel}!</span>
        <span className="text-muted"> · {levelTitle(reward.newLevel)}</span>
      </div>
    )}
    {reward.newAchievements.length > 0 && (
      <div className="space-y-2 text-left">
        <div className="text-[11px] uppercase tracking-wider text-muted text-center">Новые достижения</div>
        {reward.newAchievements.map(id => {
          const a = ACHIEVEMENT_MAP[id];
          if (!a) return null;
          return (
            <div key={id} className="flex items-center gap-3 rounded-xl bg-surface-2/60 px-3 py-2">
              <span className="text-2xl">{a.icon}</span>
              <div>
                <div className="text-sm font-semibold text-fg">{a.title}</div>
                <div className="text-xs text-muted">{a.description}</div>
              </div>
            </div>
          );
        })}
      </div>
    )}
  </div>
);

export const GameModals: React.FC<GameModalsProps> = ({
  state, reward, isNewRecord, isSignedIn, onContinue, onRestart, onNextGame, onOpenAuth,
}) => {
  if (!state.isPaused && !state.isGameOver && !state.isWon) return null;

  if (state.isWon) {
    return (
      <>
        <Confetti />
        <Overlay>
          <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 flex items-center justify-center">
            <Trophy size={32} className="text-emerald-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-fg">Победа! 🎉</h2>
            <p className="text-sm text-muted mt-1">
              {state.dailyDate ? "Челлендж дня пройден" : DIFFICULTY_LABELS[state.difficulty]}
              {isNewRecord && <span className="ml-1 text-accent-2 font-semibold">· Новый рекорд!</span>}
            </p>
          </div>
          <div className="flex gap-2">
            <Stat label="Время" value={formatTime(state.timerSeconds)} highlight={isNewRecord} />
            <Stat label="Ошибки" value={state.mistakes} highlight={state.mistakes === 0} />
            <Stat label="Подсказки" value={state.hintsUsed} highlight={state.hintsUsed === 0} />
          </div>
          {reward && <RewardBlock reward={reward} />}
          {!isSignedIn && (
            <button onClick={onOpenAuth} className="text-xs text-accent hover:underline">
              Войдите, чтобы сохранить прогресс в облаке и попасть в рейтинг →
            </button>
          )}
          <div className="space-y-2">
            <ModalButton onClick={onNextGame}>
              <ChevronRight size={16} /> {state.dailyDate ? "Обычная игра" : "Следующая партия"}
            </ModalButton>
          </div>
        </Overlay>
      </>
    );
  }

  if (state.isGameOver) {
    return (
      <Overlay>
        <div className="w-16 h-16 mx-auto rounded-full bg-red-500/20 flex items-center justify-center">
          <XCircle size={32} className="text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-fg">Игра окончена</h2>
        <div className="flex gap-2">
          <Stat label="Время" value={formatTime(state.timerSeconds)} />
          <Stat label="Ошибки" value={state.mistakes} />
        </div>
        {reward && <p className="text-sm text-muted">+{reward.xpGained} XP за старание</p>}
        <p className="text-xs text-muted">Совет: в настройках можно выбрать режим «Без лимита ошибок».</p>
        <div className="space-y-2">
          <ModalButton onClick={() => onRestart(state.difficulty)}>
            <RotateCcw size={16} /> Новая игра
          </ModalButton>
        </div>
      </Overlay>
    );
  }

  return (
    <Overlay>
      <div className="w-16 h-16 mx-auto rounded-full bg-accent/20 flex items-center justify-center">
        <Play size={30} className="text-accent ml-1" />
      </div>
      <h2 className="text-2xl font-bold text-fg">Пауза</h2>
      <p className="text-muted text-sm">
        Время: <span className="font-mono tabular-nums text-fg">{formatTime(state.timerSeconds)}</span>
      </p>
      <ModalButton onClick={onContinue}>
        <Play size={16} /> Продолжить
      </ModalButton>
    </Overlay>
  );
};
