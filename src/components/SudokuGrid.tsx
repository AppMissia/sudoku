// src/components/SudokuGrid.tsx
import React, { useMemo } from "react";
import { Board, Settings } from "../types/sudoku";
import { SudokuCell } from "./SudokuCell";

export interface SudokuGridProps {
  board: Board;
  selectedCell: [number, number] | null;
  onSelect: (row: number, col: number) => void;
  settings: Settings;
  isPaused: boolean;
}

const samePeer = (r1: number, c1: number, r2: number, c2: number): boolean =>
  r1 === r2 ||
  c1 === c2 ||
  (Math.floor(r1 / 3) === Math.floor(r2 / 3) && Math.floor(c1 / 3) === Math.floor(c2 / 3));

export const SudokuGrid: React.FC<SudokuGridProps> = ({ board, selectedCell, onSelect, settings, isPaused }) => {
  // Cells whose value clashes with a wrong entry in the same row / column / box
  const conflicts = useMemo(() => {
    const set = new Set<string>();
    if (!settings.highlightConflicts) return set;
    for (const row of board) {
      for (const err of row) {
        if (!err.isError || err.value === null) continue;
        for (const row2 of board) {
          for (const other of row2) {
            if (other !== err && other.value === err.value && samePeer(err.row, err.col, other.row, other.col)) {
              set.add(`${other.row}-${other.col}`);
            }
          }
        }
      }
    }
    return set;
  }, [board, settings.highlightConflicts]);

  const selValue = selectedCell ? board[selectedCell[0]][selectedCell[1]].value : null;

  const cells = useMemo(() => {
    const elements: React.ReactNode[] = [];
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const cell = board[r][c];
        const isSelected = selectedCell !== null && selectedCell[0] === r && selectedCell[1] === c;
        const isHighlighted =
          settings.highlightRegion && selectedCell !== null && samePeer(r, c, selectedCell[0], selectedCell[1]);
        const isSameValue =
          settings.highlightSameNumbers && selValue !== null && cell.value === selValue && !isSelected;
        const isNoteMatch = settings.highlightSameNumbers && selValue !== null && cell.notes.includes(selValue);

        const borders: string[] = [];
        if (c === 2 || c === 5) borders.push("border-r-2 border-line");
        if (r === 2 || r === 5) borders.push("border-b-2 border-line");

        elements.push(
          <div key={`${r}-${c}`} className={borders.join(" ")}>
            <SudokuCell
              cell={cell}
              isSelected={isSelected}
              isHighlighted={isHighlighted}
              isSameValue={isSameValue}
              isConflict={conflicts.has(`${r}-${c}`)}
              isNoteMatch={isNoteMatch}
              animations={settings.animations}
              onSelect={() => onSelect(r, c)}
            />
          </div>
        );
      }
    }
    return elements;
  }, [board, selectedCell, onSelect, settings, conflicts, selValue]);

  return (
    <div className="w-full max-w-[420px] mx-auto relative">
      <div
        className={`grid grid-cols-9 rounded-2xl overflow-hidden border-2 border-line shadow-2xl shadow-black/30 bg-line/40 gap-px transition-[filter] duration-300 ${
          isPaused ? "blur-md" : ""
        }`}
      >
        {cells}
      </div>
    </div>
  );
};
