// src/components/SudokuGrid.tsx
import React, { useMemo } from "react";
import { Board, CellData } from "../types/sudoku";
import { SudokuCell } from "./SudokuCell";

export interface SudokuGridProps {
  board: Board;
  selectedCell: [number, number] | null;
  onSelect: (row: number, col: number) => void;
  onValue: (num: number) => void;
  isPencilMode: boolean;
}

const computeCellFlags = (
  cell: CellData,
  selected: [number, number] | null,
  board: Board
) => {
  if (!selected) return { isHighlighted: false, isSameValue: false };
  const [sr, sc] = selected;
  const selCell = board[sr][sc];
  const isSameRow = cell.row === sr;
  const isSameCol = cell.col === sc;
  const isSameBlock =
    Math.floor(cell.row / 3) === Math.floor(sr / 3) &&
    Math.floor(cell.col / 3) === Math.floor(sc / 3);
  const isHighlighted = isSameRow || isSameCol || isSameBlock;
  const isSameValue =
    selCell.value !== null && cell.value !== null && selCell.value === cell.value;
  return { isHighlighted, isSameValue };
};

export const SudokuGrid: React.FC<SudokuGridProps> = ({
  board,
  selectedCell,
  onSelect,
}) => {
  const cells = useMemo(() => {
    const elements: React.ReactNode[] = [];
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const cell = board[r][c];
        const { isHighlighted, isSameValue } = computeCellFlags(cell, selectedCell, board);
        const isSelected = selectedCell !== null && selectedCell[0] === r && selectedCell[1] === c;

        // Border classes for 3×3 sub-grid separation
        const borders: string[] = [];
        // Right borders
        if (c === 2 || c === 5) borders.push("border-r border-zinc-500/50");
        // Bottom borders
        if (r === 2 || r === 5) borders.push("border-b border-zinc-500/50");

        elements.push(
          <div key={`${r}-${c}`} className={borders.join(" ")}>
            <SudokuCell
              cell={cell}
              isSelected={!!isSelected}
              isHighlighted={isHighlighted}
              isSameValue={isSameValue}
              onSelect={() => onSelect(r, c)}
            />
          </div>
        );
      }
    }
    return elements;
  }, [board, selectedCell, onSelect]);

  return (
    <div className="w-full max-w-[420px] mx-auto">
      <div
        className="grid grid-cols-9 rounded-2xl overflow-hidden border-2 border-zinc-700/80 shadow-2xl shadow-black/40 bg-zinc-800/50 gap-px"
      >
        {cells}
      </div>
    </div>
  );
};
