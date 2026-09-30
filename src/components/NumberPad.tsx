// src/components/NumberPad.tsx
import React, { useMemo } from "react";
import { Board } from "../types/sudoku";

export interface NumberPadProps {
  board: Board;
  onPress: (num: number) => void;
  selectedNumber: number | null;
}

const useRemainingCounts = (board: Board): number[] => {
  return useMemo(() => {
    const counts = Array(10).fill(0);
    board.forEach(row =>
      row.forEach(cell => {
        if (cell.value !== null) counts[cell.value]++;
      })
    );
    return counts.slice(1).map(c => 9 - c);
  }, [board]);
};

export const NumberPad: React.FC<NumberPadProps> = ({ board, onPress, selectedNumber }) => {
  const remaining = useRemainingCounts(board);

  return (
    <div
      className="w-full max-w-[420px] mx-auto grid grid-cols-9 gap-1.5"
      style={{ touchAction: "manipulation" }}
    >
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => {
        const left = remaining[num - 1];
        const done = left <= 0;
        const isActive = selectedNumber === num;
        return (
          <button
            key={num}
            onClick={() => onPress(num)}
            disabled={done}
            className={`
              flex flex-col items-center justify-center
              py-2.5 rounded-xl
              font-semibold transition-all duration-100
              ${done
                ? "opacity-15 pointer-events-none bg-zinc-800/50"
                : isActive
                  ? "bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-500/40 scale-105 shadow-lg shadow-indigo-500/10"
                  : "bg-zinc-800 hover:bg-zinc-700 active:scale-95 active:bg-zinc-600 text-zinc-100"
              }
            `}
          >
            <span className="text-lg sm:text-xl leading-none">{num}</span>
            <span
              className={`text-[9px] mt-1 font-normal tabular-nums ${
                done ? "text-transparent" : "text-zinc-500"
              }`}
            >
              {left}
            </span>
          </button>
        );
      })}
    </div>
  );
};
