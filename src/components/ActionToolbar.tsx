// src/components/ActionToolbar.tsx
import React from "react";
import { Undo2, Eraser, PenLine, Lightbulb, Wand2 } from "lucide-react";

export interface ActionToolbarProps {
  onUndo: () => void;
  onErase: () => void;
  onTogglePencil: () => void;
  onHint: () => void;
  onAutoNotes: () => void;
  pencilMode: boolean;
  historyLength: number;
  hintsUsed: number;
}

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
  badge?: string | number;
  title?: string;
}

const ActionButton: React.FC<ActionButtonProps> = ({ icon, label, onClick, active, badge, title }) => (
  <button
    onClick={onClick}
    title={title ?? label}
    className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 rounded-xl transition-all duration-150 active:scale-95 ${
      active ? "bg-accent/20 text-accent ring-1 ring-accent/30" : "text-muted hover:text-fg hover:bg-fg/5"
    }`}
    style={{ touchAction: "manipulation" }}
  >
    <div className="relative">
      {icon}
      {badge !== undefined && (
        <span className="absolute -top-1.5 -right-2.5 text-[9px] font-bold bg-accent text-accent-fg rounded-full min-w-[14px] h-[14px] flex items-center justify-center px-0.5">
          {badge}
        </span>
      )}
    </div>
    <span className="text-[10px] font-medium tracking-wide">{label}</span>
  </button>
);

export const ActionToolbar: React.FC<ActionToolbarProps> = ({
  onUndo, onErase, onTogglePencil, onHint, onAutoNotes, pencilMode, historyLength, hintsUsed,
}) => (
  <div className="w-full max-w-[420px] mx-auto flex items-center justify-between gap-1">
    <ActionButton icon={<Undo2 size={20} />} label="Отмена" title="Отмена (Ctrl+Z / U)" onClick={onUndo}
      badge={historyLength > 0 ? Math.min(historyLength, 99) : undefined} />
    <ActionButton icon={<Eraser size={20} />} label="Стереть" title="Стереть (Backspace)" onClick={onErase} />
    <ActionButton icon={<PenLine size={20} />} label={pencilMode ? "Заметки ✓" : "Заметки"} title="Режим заметок (N)"
      onClick={onTogglePencil} active={pencilMode} />
    <ActionButton icon={<Wand2 size={20} />} label="Автозаметки" title="Заполнить все возможные кандидаты (A)" onClick={onAutoNotes} />
    <ActionButton icon={<Lightbulb size={20} />} label="Подсказка" title="Подсказка (H)" onClick={onHint}
      badge={hintsUsed > 0 ? hintsUsed : undefined} />
  </div>
);
