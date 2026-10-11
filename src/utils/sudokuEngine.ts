// src/utils/sudokuEngine.ts
import { Difficulty, Board, CellData } from "../types/sudoku";

/** Random source: returns a float in [0, 1) */
export type Rng = () => number;

/** Deterministic PRNG (mulberry32) — same seed ⇒ same sequence */
export function createSeededRng(seed: string): Rng {
  // FNV-1a hash of the seed string
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Check if placing `num` at (r,c) respects Sudoku rules */
function isValid(grid: (number | null)[][], r: number, c: number, num: number): boolean {
  for (let i = 0; i < 9; i++) {
    if (grid[r][i] === num) return false; // row
    if (grid[i][c] === num) return false; // column
  }
  const startRow = Math.floor(r / 3) * 3;
  const startCol = Math.floor(c / 3) * 3;
  for (let dr = 0; dr < 3; dr++) {
    for (let dc = 0; dc < 3; dc++) {
      if (grid[startRow + dr][startCol + dc] === num) return false;
    }
  }
  return true;
}

/** Fisher–Yates shuffle (in place) using the provided rng */
function shuffle<T>(arr: T[], rng: Rng): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Back‑tracking generator of a full solved grid */
export function generateSolvedGrid(rng: Rng = Math.random): number[][] {
  const grid: (number | null)[][] = Array.from({ length: 9 }, () => Array<number | null>(9).fill(null));

  const fill = (): boolean => {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (grid[r][c] === null) {
          for (const num of shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9], rng)) {
            if (isValid(grid, r, c, num)) {
              grid[r][c] = num;
              if (fill()) return true;
              grid[r][c] = null;
            }
          }
          return false; // none fits
        }
      }
    }
    return true; // no empty cells → solved
  };

  if (!fill()) throw new Error("Failed to generate solved Sudoku grid");
  return grid as number[][];
}

/** Count solutions of a partially filled grid; stops after count exceeds 1 */
export function countSolutions(
  grid: (number | null)[][],
  count: { val: number } = { val: 0 }
): number {
  if (count.val > 1) return count.val;

  let emptyPos: [number, number] | null = null;
  for (let r = 0; r < 9 && !emptyPos; r++) {
    for (let c = 0; c < 9; c++) {
      if (grid[r][c] === null) { emptyPos = [r, c]; break; }
    }
  }

  if (!emptyPos) {
    count.val++;
    return count.val;
  }
  const [row, col] = emptyPos;
  for (let num = 1; num <= 9; num++) {
    if (isValid(grid, row, col, num)) {
      grid[row][col] = num;
      countSolutions(grid, count);
      grid[row][col] = null;
      if (count.val > 1) break;
    }
  }
  return count.val;
}

/** Difficulty → number of cells to keep (clues) */
const cluesByDifficulty: Record<Difficulty, number> = {
  easy: 40,
  medium: 34,
  hard: 29,
  expert: 25,
};

/** Create a puzzle ensuring a single solution */
export function createPuzzle(
  difficulty: Difficulty,
  rng: Rng = Math.random
): { initialGrid: (number | null)[][]; solution: number[][] } {
  const solution = generateSolvedGrid(rng);
  const grid: (number | null)[][] = solution.map(row => row.slice());

  const cellsToRemove = 81 - cluesByDifficulty[difficulty];

  const positions: [number, number][] = [];
  for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) positions.push([r, c]);
  shuffle(positions, rng);

  let removed = 0;
  for (const [r, c] of positions) {
    if (removed >= cellsToRemove) break;
    const backup = grid[r][c];
    grid[r][c] = null;
    const copy = grid.map(row => row.slice());
    if (countSolutions(copy, { val: 0 }) !== 1) {
      grid[r][c] = backup; // revert – would create multiple solutions
    } else {
      removed++;
    }
  }

  return { initialGrid: grid, solution };
}

/** Transform raw matrices into typed Board */
export function initializeBoard(difficulty: Difficulty, rng: Rng = Math.random): Board {
  const { initialGrid, solution } = createPuzzle(difficulty, rng);
  const board: Board = [];
  for (let r = 0; r < 9; r++) {
    const row: CellData[] = [];
    for (let c = 0; c < 9; c++) {
      const val = initialGrid[r][c];
      row.push({
        row: r,
        col: c,
        value: val,
        solution: solution[r][c],
        isInitial: val !== null,
        notes: [],
        isError: false,
      });
    }
    board.push(row);
  }
  return board;
}

// ───────────────────────── Daily challenge ─────────────────────────

/** Local date → "YYYY-MM-DD" */
export function toDateKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Daily difficulty depends on the weekday (Sun=0 … Sat=6) */
const DAILY_DIFFICULTY: Difficulty[] = ["hard", "easy", "medium", "medium", "hard", "medium", "expert"];

export function dailyDifficulty(dateKey: string): Difficulty {
  const [y, m, d] = dateKey.split("-").map(Number);
  return DAILY_DIFFICULTY[new Date(y, m - 1, d).getDay()];
}

/** Same date ⇒ same puzzle for every player */
export function createDailyBoard(dateKey: string): Board {
  return initializeBoard(dailyDifficulty(dateKey), createSeededRng(`zen-sudoku-daily-${dateKey}`));
}

/** Candidate digits for an empty cell based on current values */
export function candidatesFor(board: Board, r: number, c: number): number[] {
  const used = new Set<number>();
  for (let i = 0; i < 9; i++) {
    const rv = board[r][i].value;
    const cv = board[i][c].value;
    if (rv !== null && !board[r][i].isError) used.add(rv);
    if (cv !== null && !board[i][c].isError) used.add(cv);
  }
  const sr = Math.floor(r / 3) * 3;
  const sc = Math.floor(c / 3) * 3;
  for (let dr = 0; dr < 3; dr++) {
    for (let dc = 0; dc < 3; dc++) {
      const cell = board[sr + dr][sc + dc];
      if (cell.value !== null && !cell.isError) used.add(cell.value);
    }
  }
  const res: number[] = [];
  for (let n = 1; n <= 9; n++) if (!used.has(n)) res.push(n);
  return res;
}
