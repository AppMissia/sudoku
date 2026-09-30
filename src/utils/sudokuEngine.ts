// src/utils/sudokuEngine.ts
import { Difficulty, Board, CellData } from "../types/sudoku";

/** Helper: create empty 9×9 grid of nulls */
const emptyGrid = (): (number | null)[][] =>
  Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => null));

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

/** Randomly shuffled array of numbers 1‑9 */
function shuffledNumbers(): number[] {
  const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  for (let i = nums.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [nums[i], nums[j]] = [nums[j], nums[i]];
  }
  return nums;
}

/** Back‑tracking generator of a full solved grid */
export function generateSolvedGrid(): number[][] {
  const grid: number[][] = Array.from({ length: 9 }, () => Array(9).fill(0));

  const fill = (): boolean => {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (grid[r][c] === 0) {
          const candidates = shuffledNumbers();
          for (const num of candidates) {
            if (isValid(grid as unknown as (number | null)[][], r, c, num)) {
              grid[r][c] = num;
              if (fill()) return true;
              grid[r][c] = 0;
            }
          }
          return false; // none fits
        }
      }
    }
    return true; // no empty cells → solved
  };

  if (!fill()) throw new Error("Failed to generate solved Sudoku grid");
  return grid;
}

/** Count solutions of a partially filled grid; stops after count exceeds 1 */
export function countSolutions(
  grid: (number | null)[][],
  count: { val: number } = { val: 0 }
): number {
  if (count.val > 1) return count.val;

  const findEmpty = (): [number, number] | null => {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (grid[r][c] === null) return [r, c];
      }
    }
    return null;
  };

  const emptyPos = findEmpty();
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
  difficulty: Difficulty
): { initialGrid: (number | null)[][]; solution: number[][] } {
  const solution = generateSolvedGrid();
  const grid: (number | null)[][] = solution.map(row => row.slice()); // copy as mutable

  const totalCells = 81;
  const clues = cluesByDifficulty[difficulty];
  const cellsToRemove = totalCells - clues;

  // list of all positions, shuffled
  const positions: [number, number][] = [];
  for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) positions.push([r, c]);
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }

  let removed = 0;
  for (const [r, c] of positions) {
    if (removed >= cellsToRemove) break;
    const backup = grid[r][c];
    grid[r][c] = null;
    const copy = grid.map(row => row.slice());
    const sols = countSolutions(copy, { val: 0 });
    if (sols !== 1) {
      grid[r][c] = backup; // revert – would create multiple solutions
    } else {
      removed++;
    }
  }

  return { initialGrid: grid, solution };
}

/** Transform raw matrices into typed Board */
export function initializeBoard(difficulty: Difficulty): Board {
  const { initialGrid, solution } = createPuzzle(difficulty);
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
