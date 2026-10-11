// src/types/sudoku.ts
export type Difficulty = "easy" | "medium" | "hard" | "expert";

export interface CellData {
  row: number;
  col: number;
  value: number | null; // current user entry (null = empty)
  solution: number;   // the correct digit for this cell
  isInitial: boolean; // true if the digit is part of the puzzle clue
  notes: number[];    // pencil marks (1‑9)
  isError: boolean;  // true if current value differs from the solution
}

export type Board = CellData[][]; // 9 × 9 matrix

export interface MoveHistory {
  board: Board;                 // snapshot of the board after a move
  selectedCell: [number, number] | null; // row, col of the selected cell
}

export interface GameState {
  gameId: string;        // unique id — used to record a finished game exactly once
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
  hintsUsed: number;
  dailyDate: string | null; // "YYYY-MM-DD" when playing the daily challenge
}

// ───────────────────────── Player / progression ─────────────────────────

export type ThemeId = "midnight" | "ocean" | "forest" | "sunset" | "paper" | "sakura";

export interface Settings {
  theme: ThemeId;
  highlightRegion: boolean;      // row / column / box of the selected cell
  highlightSameNumbers: boolean; // same digits as the selected cell
  highlightConflicts: boolean;   // cells that clash with a wrong entry
  autoRemoveNotes: boolean;      // placing a digit removes it from peers' notes
  showTimer: boolean;
  vibration: boolean;
  animations: boolean; // toggle animations and visual effects on/off
}

export interface DifficultyStats {
  played: number;
  won: number;
  bestTime: number | null; // seconds
  totalTime: number;       // seconds spent on won games (for average)
}

export interface GameResult {
  id: string;
  finishedAt: number; // epoch ms
  difficulty: Difficulty;
  won: boolean;
  time: number;       // seconds
  mistakes: number;
  hintsUsed: number;
  dailyDate: string | null;
  xpGained: number;
}

export interface DailyResult {
  time: number;
  mistakes: number;
}

export interface PlayerData {
  displayName: string;
  avatar: string; // emoji
  xp: number;
  stats: Record<Difficulty, DifficultyStats>;
  currentStreak: number;
  bestStreak: number;
  achievements: Record<string, number>; // achievement id -> unlocked at (epoch ms)
  history: GameResult[];                // newest first, capped
  daily: Record<string, DailyResult>;   // "YYYY-MM-DD" -> best result
  settings: Settings;
  updatedAt: number;
}

export interface RewardInfo {
  xpGained: number;
  leveledUp: boolean;
  newLevel: number;
  newAchievements: string[]; // achievement ids
}
