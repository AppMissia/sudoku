// src/hooks/useSudokuGame.ts
import { useState, useEffect, useCallback } from "react";
import { Difficulty, Board, GameState, MoveHistory } from "../types/sudoku";
import { initializeBoard } from "../utils/sudokuEngine";

const STORAGE_KEY = "zen_sudoku_state_v1";

const cloneBoard = (board: Board): Board =>
  board.map(row => row.map(cell => ({ ...cell })));

/**
 * Recompute error flags for the entire board.
 * A cell is an error if:
 *   1) Its value doesn't match the solution, OR
 *   2) It duplicates another cell in the same row/col/subgrid
 */
const recomputeErrors = (b: Board): void => {
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      const cur = b[i][j];
      if (cur.value === null) {
        cur.isError = false;
        continue;
      }
      // Wrong value = always error
      let hasError = cur.value !== cur.solution;
      // Also check duplicates (row, column, subgrid)
      if (!hasError) {
        for (let k = 0; k < 9; k++) {
          if (k !== j && b[i][k].value === cur.value) { hasError = true; break; }
          if (k !== i && b[k][j].value === cur.value) { hasError = true; break; }
        }
      }
      if (!hasError) {
        const sr = Math.floor(i / 3) * 3;
        const sc = Math.floor(j / 3) * 3;
        outer: for (let dr = 0; dr < 3; dr++) {
          for (let dc = 0; dc < 3; dc++) {
            const other = b[sr + dr][sc + dc];
            if (other !== cur && other.value === cur.value) { hasError = true; break outer; }
          }
        }
      }
      cur.isError = hasError;
    }
  }
};

function freshState(difficulty: Difficulty): GameState {
  const board = initializeBoard(difficulty);
  return {
    board,
    difficulty,
    selectedCell: null,
    isPencilMode: false,
    mistakes: 0,
    maxMistakes: null,
    isGameOver: false,
    isWon: false,
    timerSeconds: 0,
    isPaused: false,
    history: [],
  };
}

function loadPersistedOrNew(initialDifficulty: Difficulty): GameState {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as GameState;
      if (
        Array.isArray(parsed.board) &&
        parsed.board.length === 9 &&
        parsed.board.every(r => Array.isArray(r) && r.length === 9)
      ) {
        return parsed;
      }
    } catch { /* ignore */ }
  }
  return freshState(initialDifficulty);
}

function persist(state: GameState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch { /* ignore */ }
}

export function useSudokuGame(initialDifficulty: Difficulty = "medium"): {
  state: GameState;
  selectCell: (row: number, col: number) => void;
  setCellValue: (num: number) => void;
  eraseCell: () => void;
  togglePencilMode: () => void;
  undo: () => void;
  getHint: () => void;
  startNewGame: (difficulty: Difficulty) => void;
  togglePause: () => void;
  setMaxMistakes: (value: number | null) => void;
} {
  const [state, setState] = useState<GameState>(() =>
    loadPersistedOrNew(initialDifficulty)
  );

  // Timer
  useEffect(() => {
    if (state.isPaused || state.isGameOver || state.isWon) return;
    const id = setInterval(() => {
      setState(prev => ({ ...prev, timerSeconds: prev.timerSeconds + 1 }));
    }, 1000);
    return () => clearInterval(id);
  }, [state.isPaused, state.isGameOver, state.isWon]);

  // Persistence
  useEffect(() => { persist(state); }, [state]);

  const selectCell = useCallback((row: number, col: number) => {
    setState(prev => ({ ...prev, selectedCell: [row, col] }));
  }, []);

  const setCellValue = useCallback((num: number) => {
    setState(prev => {
      if (!prev.selectedCell) return prev;
      const [r, c] = prev.selectedCell;
      const cell = prev.board[r][c];
      if (cell.isInitial) return prev;

      const newBoard = cloneBoard(prev.board);
      const target = newBoard[r][c];

      const snapshot: MoveHistory = {
        board: cloneBoard(prev.board),
        selectedCell: prev.selectedCell ? [...prev.selectedCell] : null,
      };

      if (prev.isPencilMode) {
        const notesSet = new Set(target.notes);
        if (notesSet.has(num)) notesSet.delete(num);
        else notesSet.add(num);
        target.notes = Array.from(notesSet).sort();
        return { ...prev, board: newBoard, history: [...prev.history, snapshot] };
      }

      // Normal entry
      target.value = num;
      target.notes = [];
      const isCorrect = num === target.solution;

      // Recompute errors globally (includes wrong-value check)
      recomputeErrors(newBoard);

      const newMistakes = isCorrect ? prev.mistakes : prev.mistakes + 1;
      const gameOver = prev.maxMistakes !== null && newMistakes >= prev.maxMistakes;

      const won = newBoard.every(row =>
        row.every(cell => cell.value !== null && !cell.isError)
      );

      return {
        ...prev,
        board: newBoard,
        mistakes: newMistakes,
        isGameOver: gameOver,
        isWon: won,
        history: [...prev.history, snapshot],
      };
    });
  }, []);

  const eraseCell = useCallback(() => {
    setState(prev => {
      if (!prev.selectedCell) return prev;
      const [r, c] = prev.selectedCell;
      const cell = prev.board[r][c];
      if (cell.isInitial) return prev;

      const newBoard = cloneBoard(prev.board);
      const target = newBoard[r][c];
      const snapshot: MoveHistory = {
        board: cloneBoard(prev.board),
        selectedCell: prev.selectedCell ? [...prev.selectedCell] : null,
      };

      target.value = null;
      target.notes = [];
      target.isError = false;
      recomputeErrors(newBoard);

      return {
        ...prev,
        board: newBoard,
        history: [...prev.history, snapshot],
      };
    });
  }, []);

  const togglePencilMode = useCallback(() => {
    setState(prev => ({ ...prev, isPencilMode: !prev.isPencilMode }));
  }, []);

  const undo = useCallback(() => {
    setState(prev => {
      if (prev.history.length === 0) return prev;
      const last = prev.history[prev.history.length - 1];
      return {
        ...prev,
        board: cloneBoard(last.board),
        selectedCell: last.selectedCell ? [...last.selectedCell] : null,
        history: prev.history.slice(0, -1),
      };
    });
  }, []);

  const getHint = useCallback(() => {
    setState(prev => {
      if (!prev.selectedCell) return prev;
      const [r, c] = prev.selectedCell;
      const cell = prev.board[r][c];
      if (cell.isInitial || (cell.value !== null && !cell.isError)) return prev;

      const newBoard = cloneBoard(prev.board);
      const target = newBoard[r][c];
      target.value = target.solution;
      target.notes = [];
      target.isError = false;
      recomputeErrors(newBoard);

      const won = newBoard.every(row =>
        row.every(cell => cell.value !== null && !cell.isError)
      );

      return { ...prev, board: newBoard, isWon: won };
    });
  }, []);

  const startNewGame = useCallback((difficulty: Difficulty) => {
    setState(freshState(difficulty));
  }, []);

  const togglePause = useCallback(() => {
    setState(prev => ({ ...prev, isPaused: !prev.isPaused }));
  }, []);

  const setMaxMistakes = useCallback((value: number | null) => {
    setState(prev => ({ ...prev, maxMistakes: value }));
  }, []);

  return {
    state,
    selectCell,
    setCellValue,
    eraseCell,
    togglePencilMode,
    undo,
    getHint,
    startNewGame,
    togglePause,
    setMaxMistakes,
  };
}
