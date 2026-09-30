// src/components/ActionToolbar.tsx
import React from "react";
import { Undo2, Eraser, PenLine, Lightbulb } from "lucide-react";

export interface ActionToolbarProps {
  onUndo: () => void;
  onErase: () => void;
  onTogglePencil: () => void;
  onHint: () => void;
  pencilMode: boolean;
  historyLength: number;
}

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
  badge?: string | number;
}

const ActionButton: React.FC<ActionButtonProps> = ({ icon, label, onClick, active, badge }) => (
  <button
    onClick={onClick}
    className={`
      flex flex-col items-center justify-center gap-1
      px-4 py-2.5 rounded-xl
      transition-all duration-150 active:scale-95
      ${active
        ? "bg-indigo-500/20 text-indigo-400 ring-1 ring-indigo-500/30"
        : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
      }
    `}
    style={{ touchAction: "manipulation" }}
  >
    <div className="relative">
      {icon}
      {badge !== undefined && (
        <span className="absolute -top-1.5 -right-2.5 text-[9px] font-bold bg-indigo-500 text-white rounded-full min-w-[14px] h-[14px] flex items-center justify-center px-0.5">
          {badge}
        </span>
      )}
    </div>
    <span className="text-[10px] font-medium tracking-wide">{label}</span>
  </button>
);

export const ActionToolbar: React.FC<ActionToolbarProps> = ({
  onUndo,
  onErase,
  onTogglePencil,
  onHint,
  pencilMode,
  historyLength,
}) => {
  return (
    <div className="w-full max-w-[420px] mx-auto flex items-center justify-center gap-2">
      <ActionButton
        icon={<Undo2 size={20} />}
        label="Отмена"
        onClick={onUndo}
        badge={historyLength > 0 ? historyLength : undefined}
      />
      <ActionButton
        icon={<Eraser size={20} />}
        label="Стереть"
        onClick={onErase}
      />
      <ActionButton
        icon={<PenLine size={20} />}
        label="Заметки"
        onClick={onTogglePencil}
        active={pencilMode}
      />
      <ActionButton
        icon={<Lightbulb size={20} />}
        label="Подсказка"
        onClick={onHint}
      />
    </div>
  );
};
