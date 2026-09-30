// src/sudokuEngine.ts
import { Cell, Difficulty, GameState, GameStateSnapshot } from "./types";

/** Utility: deep clone a board (array of arrays of Cells) */
const cloneBoard = (board: Cell[][]): Cell[][] =>
  board.map(row => row.map(cell => ({ ...cell })));

/** Check if placing `num` at (row, col) violates Sudoku rules */
const isValidPlacement = (board: Cell[][], row: number, col: number, num: number): boolean => {
  // row & column
  for (let i = 0; i < 9; i++) {
    if (board[row][i].value === num) return false;
    if (board[i][col].value === num) return false;
  }
  // 3x3 subgrid
  const startRow = Math.floor(row / 3) * 3;
  const startCol = Math.floor(col / 3) * 3;
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      if (board[startRow + r][startCol + c].value === num) return false;
    }
  }
  return true;
};

/** Backtracking solver – fills empty cells (value === null). Returns true when solved. */
export const solveBoard = (board: Cell[][]): boolean => {
  const empty = findEmpty(board);
  if (!empty) return true; // solved
  const { row, col } = empty;
  for (let num = 1; num <= 9; num++) {
    if (isValidPlacement(board, row, col, num)) {
      board[row][col].value = num;
      if (solveBoard(board)) return true;
      board[row][col].value = null;
    }
  }
  return false;
};

/** Find first empty cell (value === null). */
const findEmpty = (board: Cell[][]): { row: number; col: number } | null => {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c].value === null) return { row: r, col: c };
    }
  }
  return null;
};

/** Count number of solutions (up to 2). Used for uniqueness check. */
const countSolutions = (board: Cell[][], limit = 2): number => {
  const empty = findEmpty(board);
  if (!empty) return 1; // solved once
  const { row, col } = empty;
  let count = 0;
  for (let num = 1; num <= 9; num++) {
    if (isValidPlacement(board, row, col, num)) {
      board[row][col].value = num;
      count += countSolutions(board, limit - count);
      board[row][col].value = null;
      if (count >= limit) break;
    }
  }
  return count;
};

/** Generate a completely filled valid Sudoku board using backtracking. */
export const generateFullBoard = (): Cell[][] => {
  // initialise empty board with placeholder cells
  const board: Cell[][] = Array.from({ length: 9 }, (_, r) =>
    Array.from({ length: 9 }, (_, c) => ({
      row: r,
      col: c,
      value: null,
      solution: 0,
      isInitial: false,
      notes: [],
      isError: false,
    }))
  );

  // Helper that shuffles numbers 1‑9 to obtain varied solutions
  const shuffled = () => {
    const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    for (let i = nums.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [nums[i], nums[j]] = [nums[j], nums[i]];
    }
    return nums;
  };

  const fill = (): boolean => {
    const empty = findEmpty(board);
    if (!empty) return true;
    const { row, col } = empty;
    for (const num of shuffled()) {
      if (isValidPlacement(board, row, col, num)) {
        board[row][col].value = num;
        if (fill()) return true;
        board[row][col].value = null;
      }
    }
    return false;
  };

  if (!fill()) throw new Error("Failed to generate a full board");

  // Record solution in each cell (will be used later when we hide numbers)
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      board[r][c].solution = board[r][c].value as number;
    }
  }
  return board;
};

/** Remove numbers according to difficulty while guaranteeing a single solution. */
export const createPuzzle = (difficulty: Difficulty): Cell[][] => {
  const board = generateFullBoard();
  // Determine how many cells should stay visible
  const ranges: Record<Difficulty, [number, number]> = {
    easy: [38, 42],
    medium: [32, 36],
    hard: [28, 31],
    expert: [24, 27],
  };
  const [minOpen, maxOpen] = ranges[difficulty];
  const targetOpen = Math.floor(Math.random() * (maxOpen - minOpen + 1)) + minOpen;
  const totalCells = 81;
  const cellsToRemove = totalCells - targetOpen;

  // create a list of all cell positions and shuffle
  const positions = [] as { row: number; col: number }[];
  for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) positions.push({ row: r, col: c });
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }

  let removed = 0;
  for (const { row, col } of positions) {
    if (removed >= cellsToRemove) break;
    const backup = board[row][col].value;
    board[row][col].value = null;
    // test uniqueness – copy board because countSolutions mutates it
    const copy = cloneBoard(board);
    const solutions = countSolutions(copy, 2);
    if (solutions !== 1) {
      // revert – multiple solutions would appear
      board[row][col].value = backup;
    } else {
      removed++;
    }
  }

  // Mark initial cells
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const cell = board[r][c];
      cell.isInitial = cell.value !== null;
      cell.isError = false;
      cell.notes = [];
    }
  }
  return board;
};

/** History stack helpers – push snapshot */
export const pushHistory = (state: GameState): void => {
  const snapshot: GameStateSnapshot = {
    board: cloneBoard(state.board),
    selected: state.selected ? { ...state.selected } : null,
    pencilMode: state.pencilMode,
    errors: state.errors,
    elapsed: state.elapsed,
  };
  state.history.push(snapshot);
  // keep reasonable size (e.g., 100 steps)
  if (state.history.length > 100) state.history.shift();
};

/** Undo – pop last snapshot and restore */
export const undo = (state: GameState): void => {
  if (state.history.length === 0) return;
  const snapshot = state.history.pop() as GameStateSnapshot;
  state.board = cloneBoard(snapshot.board);
  state.selected = snapshot.selected ? { ...snapshot.selected } : null;
  state.pencilMode = snapshot.pencilMode;
  state.errors = snapshot.errors;
  state.elapsed = snapshot.elapsed;
};

/** LocalStorage persistence */
const STORAGE_KEY = "premium-sudoku-game";

export const saveGame = (state: GameState): void => {
  const serialisable = {
    board: state.board.map(row =>
      row.map(cell => ({
        row: cell.row,
        col: cell.col,
        value: cell.value,
        solution: cell.solution,
        isInitial: cell.isInitial,
        notes: cell.notes,
        isError: cell.isError,
      }))
    ),
    selected: state.selected,
    pencilMode: state.pencilMode,
    errors: state.errors,
    startTime: state.startTime,
    elapsed: state.elapsed,
    difficulty: state.difficulty,
    history: state.history.map(snap => ({
      board: snap.board.map(row =>
        row.map(c => ({
          row: c.row,
          col: c.col,
          value: c.value,
          solution: c.solution,
          isInitial: c.isInitial,
          notes: c.notes,
          isError: c.isError,
        }))
      ),
      selected: snap.selected,
      pencilMode: snap.pencilMode,
      errors: snap.errors,
      elapsed: snap.elapsed,
    })),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(serialisable));
};

export const loadGame = (): GameState | null => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const data = JSON.parse(raw);
    const board: Cell[][] = data.board.map((row: any) =>
      row.map((c: any) => ({
        ...c,
        // ensure correct types
        value: c.value === null ? null : Number(c.value),
        solution: Number(c.solution),
        isInitial: Boolean(c.isInitial),
        notes: (c.notes || []).map((n: any) => Number(n)),
        isError: Boolean(c.isError),
      }))
    );
    const history = (data.history || []).map((snap: any) => ({
      board: snap.board.map((row: any) =>
        row.map((c: any) => ({
          ...c,
          value: c.value === null ? null : Number(c.value),
          solution: Number(c.solution),
          isInitial: Boolean(c.isInitial),
          notes: (c.notes || []).map((n: any) => Number(n)),
          isError: Boolean(c.isError),
        }))
      ),
      selected: snap.selected,
      pencilMode: snap.pencilMode,
      errors: snap.errors,
      elapsed: snap.elapsed,
    }));
    return {
      board,
      selected: data.selected,
      pencilMode: data.pencilMode,
      errors: data.errors,
      startTime: data.startTime,
      elapsed: data.elapsed,
      difficulty: data.difficulty as Difficulty,
      history,
    } as GameState;
  } catch {
    return null;
  }
};
