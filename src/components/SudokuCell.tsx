// src/components/SudokuCell.tsx
import React, { useRef, useEffect } from "react";
import { CellData } from "../types/sudoku";

export interface SudokuCellProps {
  cell: CellData;
  isSelected: boolean;
  isHighlighted: boolean;
  isSameValue: boolean;
  onSelect: () => void;
}

export const SudokuCell: React.FC<SudokuCellProps> = React.memo(
  ({ cell, isSelected, isHighlighted, isSameValue, onSelect }) => {
    const prevValueRef = useRef<number | null>(cell.value);
    const prevErrorRef = useRef<boolean>(cell.isError);
    const cellRef = useRef<HTMLDivElement>(null);

    // Detect value change for animation triggers
    const justEntered = cell.value !== null && prevValueRef.current !== cell.value;
    const justBecameError = cell.isError && !prevErrorRef.current && justEntered;
    const justBecameCorrect = !cell.isError && cell.value !== null && justEntered;

    useEffect(() => {
      prevValueRef.current = cell.value;
      prevErrorRef.current = cell.isError;
    });

    // Trigger shake animation on error
    useEffect(() => {
      if (justBecameError && cellRef.current) {
        const el = cellRef.current;
        el.classList.remove("animate-shake");
        // Force reflow for re-triggering
        void el.offsetWidth;
        el.classList.add("animate-shake");
      }
    }, [justBecameError, cell.value]);

    // Build classes
    const classes: string[] = [
      "aspect-square flex items-center justify-center",
      "cursor-pointer select-none",
      "transition-colors duration-100 ease-out",
      "text-base sm:text-xl md:text-2xl",
      "relative",
    ];

    // --- Background ---
    if (cell.isError) {
      // VERY obvious red background for errors
      classes.push("bg-red-500/20 animate-error-pulse");
    } else if (isSelected) {
      classes.push("bg-indigo-500/25 ring-2 ring-inset ring-indigo-400");
    } else if (isSameValue) {
      classes.push("bg-indigo-500/10");
    } else if (isHighlighted) {
      classes.push("bg-white/[0.04]");
    } else {
      classes.push("bg-zinc-900 hover:bg-white/[0.06]");
    }

    // --- Text color ---
    if (cell.isError) {
      classes.push("text-red-400 font-bold");
    } else if (cell.isInitial) {
      classes.push("text-zinc-100 font-bold");
    } else if (cell.value !== null) {
      classes.push("text-indigo-400 font-semibold");
    } else {
      classes.push("text-zinc-400");
    }

    // Pop animation for newly entered values
    const valueClass = justEntered
      ? justBecameError
        ? ""  // shake handles error, no pop
        : "animate-pop"
      : "";

    return (
      <div
        ref={cellRef}
        className={classes.join(" ")}
        onClick={onSelect}
        style={{ touchAction: "manipulation" }}
      >
        {cell.value !== null ? (
          <span className={`relative ${valueClass}`}>
            {cell.value}
            {/* Red underline for errors */}
            {cell.isError && (
              <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-3/4 h-0.5 bg-red-500 rounded-full" />
            )}
          </span>
        ) : cell.notes.length > 0 ? (
          <div className="grid grid-cols-3 grid-rows-3 w-full h-full p-px">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
              <span
                key={n}
                className={`flex items-center justify-center text-[7px] sm:text-[9px] leading-none transition-opacity ${
                  cell.notes.includes(n)
                    ? "text-zinc-400 opacity-100"
                    : "opacity-0"
                }`}
              >
                {n}
              </span>
            ))}
          </div>
        ) : null}

        {/* Correct entry flash overlay */}
        {justBecameCorrect && (
          <div className="absolute inset-0 animate-correct-flash rounded-sm pointer-events-none" />
        )}
      </div>
    );
  }
);

SudokuCell.displayName = "SudokuCell";
