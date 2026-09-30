// src/types/sudoku.ts
export type Difficulty = "easy" | "medium" | "hard" | "expert";

export interface CellData {
  row: number;
  col: number;
  value: number | null; // current user entry (null = empty)
  solution: number;   // the correct digit for this cell
  isInitial: boolean; // true if the digit is part of the puzzle clue
  notes: number[];    // pencil marks (1‑9)
  isError: boolean;  // true if current value violates Sudoku rules
}

export type Board = CellData[][]; // 9 × 9 matrix

export interface MoveHistory {
  board: Board;                 // snapshot of the board after a move
  selectedCell: [number, number] | null; // row, col of the selected cell
}

export interface GameState {
  board: Board;
  difficulty: Difficulty;
  selectedCell: [number, number] | null;
  isPencilMode: boolean;
  mistakes: number;      // current mistake count
  maxMistakes: number | null;   // allowed mistakes before game over; null = unlimited (Zen mode)
  isGameOver: boolean;
  isWon: boolean;
  timerSeconds: number;  // elapsed seconds since game start
  isPaused: boolean;
  history: MoveHistory[]; // stack for undo
}
