// src/components/Sheet.tsx
import React, { useEffect } from "react";
import { ChevronLeft } from "lucide-react";

interface SheetProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  right?: React.ReactNode;
}

/** Full-screen panel that slides over the game */
export const Sheet: React.FC<SheetProps> = ({ title, onClose, children, right }) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-40 bg-bg overflow-y-auto scroll-thin animate-sheet-in">
      <div className="w-full max-w-lg mx-auto px-4 pb-10">
        <div className="sticky top-0 z-10 bg-bg/90 backdrop-blur-xl flex items-center justify-between py-3 -mx-4 px-4 border-b border-line/40">
          <button
            onClick={onClose}
            className="flex items-center gap-1 text-sm text-muted hover:text-fg transition-colors p-1.5 -ml-1.5 rounded-lg"
          >
            <ChevronLeft size={20} /> Игра
          </button>
          <h1 className="text-base font-semibold text-fg absolute left-1/2 -translate-x-1/2">{title}</h1>
          <div className="min-w-[60px] flex justify-end">{right}</div>
        </div>
        <div className="pt-5 space-y-6">{children}</div>
      </div>
    </div>
  );
};

export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <div className={`rounded-2xl bg-surface border border-line/50 p-4 ${className}`}>{children}</div>
);

export const SectionTitle: React.FC<{ children: React.ReactNode; right?: React.ReactNode }> = ({ children, right }) => (
  <div className="flex items-center justify-between mb-2 px-1">
    <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted">{children}</h2>
    {right}
  </div>
);
