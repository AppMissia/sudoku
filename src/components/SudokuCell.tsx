// src/components/SudokuCell.tsx
import React, { useRef, useEffect } from "react";
import { CellData } from "../types/sudoku";

export interface SudokuCellProps {
  cell: CellData;
  isSelected: boolean;
  isHighlighted: boolean;
  isSameValue: boolean;
  isConflict: boolean;
  isNoteMatch: boolean; // selected digit appears in this cell's notes
  animations?: boolean;
  onSelect: () => void;
}

export const SudokuCell: React.FC<SudokuCellProps> = React.memo(
  ({ cell, isSelected, isHighlighted, isSameValue, isConflict, isNoteMatch, animations = true, onSelect }) => {
    const prevValueRef = useRef<number | null>(cell.value);
    const cellRef = useRef<HTMLDivElement>(null);

    const justEntered = cell.value !== null && prevValueRef.current !== cell.value;
    const justBecameError = justEntered && cell.isError;
    const justBecameCorrect = justEntered && !cell.isError && !cell.isInitial;

    useEffect(() => {
      prevValueRef.current = cell.value;
    });

    useEffect(() => {
      if (animations && justBecameError && cellRef.current) {
        const el = cellRef.current;
        el.classList.remove("animate-shake");
        void el.offsetWidth; // restart animation
        el.classList.add("animate-shake");
      }
    }, [animations, justBecameError, cell.value]);

    const classes: string[] = [
      "aspect-square flex items-center justify-center",
      "cursor-pointer select-none relative",
      "transition-colors duration-100 ease-out",
      "text-base sm:text-xl md:text-2xl",
    ];

    // Background
    if (cell.isError) {
      classes.push(`bg-red-500/20 ${animations ? "animate-error-pulse" : ""}`);
    } else if (isSelected) {
      classes.push("bg-accent/25 ring-2 ring-inset ring-accent");
    } else if (isConflict) {
      classes.push("bg-red-500/10");
    } else if (isSameValue) {
      classes.push("bg-accent/15");
    } else if (isHighlighted) {
      classes.push("bg-fg/[0.05]");
    } else {
      classes.push("bg-surface hover:bg-fg/[0.06]");
    }

    // Text
    if (cell.isError) classes.push("text-red-500 font-bold");
    else if (cell.isInitial) classes.push("text-given font-bold");
    else if (cell.value !== null) classes.push("text-accent font-semibold");
    else classes.push("text-muted");

    const cellLabel = `Строка ${cell.row + 1}, колонка ${cell.col + 1}: ${
      cell.value !== null
        ? `${cell.value}${cell.isInitial ? " (исходная)" : cell.isError ? " (ошибка)" : ""}`
        : cell.notes.length > 0
        ? `пусто, заметки: ${cell.notes.join(", ")}`
        : "пусто"
    }`;

    return (
      <div
        ref={cellRef}
        role="gridcell"
        aria-label={cellLabel}
        aria-selected={isSelected}
        tabIndex={isSelected ? 0 : -1}
        className={classes.join(" ")}
        onClick={onSelect}
        style={{ touchAction: "manipulation" }}
      >
        {cell.value !== null ? (
          <span className={`relative ${animations && justBecameCorrect ? "animate-pop" : ""}`}>
            {cell.value}
            {cell.isError && (
              <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-3/4 h-0.5 bg-red-500 rounded-full" />
            )}
          </span>
        ) : cell.notes.length > 0 ? (
          <div className="grid grid-cols-3 grid-rows-3 w-full h-full p-px">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => {
              const has = cell.notes.includes(n);
              return (
                <span
                  key={n}
                  className={`flex items-center justify-center text-[7px] sm:text-[9px] leading-none rounded-sm ${
                    has
                      ? isNoteMatch && has
                        ? "text-accent font-bold"
                        : "text-muted"
                      : "opacity-0"
                  }`}
                >
                  {n}
                </span>
              );
            })}
          </div>
        ) : null}

        {animations && justBecameCorrect && (
          <div className="absolute inset-0 animate-correct-flash pointer-events-none" />
        )}
      </div>
    );
  }
);

SudokuCell.displayName = "SudokuCell";
