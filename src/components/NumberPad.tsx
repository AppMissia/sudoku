// src/components/NumberPad.tsx
import React, { useMemo } from "react";
import { Board } from "../types/sudoku";

export interface NumberPadProps {
  board: Board;
  onPress: (num: number) => void;
  selectedNumber: number | null;
  pencilMode: boolean;
}

export const NumberPad: React.FC<NumberPadProps> = ({ board, onPress, selectedNumber, pencilMode }) => {
  // Remaining = 9 − correctly placed copies of the digit
  const remaining = useMemo(() => {
    const counts = Array(10).fill(0);
    board.forEach(row => row.forEach(cell => {
      if (cell.value !== null && !cell.isError) counts[cell.value]++;
    }));
    return counts.slice(1).map(c => 9 - c);
  }, [board]);

  return (
    <div className="w-full max-w-[420px] mx-auto grid grid-cols-9 gap-1.5" style={{ touchAction: "manipulation" }}>
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => {
        const left = remaining[num - 1];
        const done = left <= 0;
        const isActive = selectedNumber === num;
        return (
          <button
            key={num}
            onClick={() => onPress(num)}
            disabled={done}
            className={`flex flex-col items-center justify-center py-2.5 rounded-xl font-semibold transition-all duration-100 ${
              done
                ? "opacity-20 pointer-events-none bg-surface"
                : isActive
                  ? "bg-accent/20 text-accent ring-1 ring-accent/40 scale-105 shadow-lg shadow-accent/10"
                  : `bg-surface-2 hover:brightness-110 active:scale-95 ${pencilMode ? "text-muted" : "text-fg"}`
            }`}
          >
            <span className={`leading-none ${pencilMode ? "text-base sm:text-lg italic" : "text-lg sm:text-xl"}`}>
              {done ? "✓" : num}
            </span>
            <span className={`text-[9px] mt-1 font-normal tabular-nums ${done ? "text-transparent" : "text-muted"}`}>
              {left}
            </span>
          </button>
        );
      })}
    </div>
  );
};
