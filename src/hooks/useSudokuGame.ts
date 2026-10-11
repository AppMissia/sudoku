// src/hooks/useSudokuGame.ts
import { useState, useEffect, useCallback, useRef } from "react";
import { Difficulty, Board, GameState, MoveHistory } from "../types/sudoku";
import { initializeBoard, createDailyBoard, dailyDifficulty, candidatesFor } from "../utils/sudokuEngine";

const STORAGE_KEY = "zen_sudoku_state_v1";
const HISTORY_CAP = 200;

const cloneBoard = (board: Board): Board =>
  board.map(row => row.map(cell => ({ ...cell, notes: [...cell.notes] })));

const newId = (): string =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

/** A cell is a mistake when its value differs from the solution */
const recomputeErrors = (b: Board): void => {
  for (const row of b) {
    for (const cell of row) {
      cell.isError = cell.value !== null && cell.value !== cell.solution;
    }
  }
};

const isSolved = (b: Board): boolean =>
  b.every(row => row.every(c => c.value !== null && c.value === c.solution));

const snapshotOf = (s: GameState): MoveHistory => ({
  board: cloneBoard(s.board),
  selectedCell: s.selectedCell ? [s.selectedCell[0], s.selectedCell[1]] : null,
});

const pushHistory = (s: GameState): MoveHistory[] =>
  [...s.history, snapshotOf(s)].slice(-HISTORY_CAP);

function freshState(difficulty: Difficulty, maxMistakes: number | null, board?: Board, dailyDate: string | null = null): GameState {
  return {
    gameId: newId(),
    board: board ?? initializeBoard(difficulty),
    difficulty,
    selectedCell: null,
    isPencilMode: false,
    mistakes: 0,
    maxMistakes,
    isGameOver: false,
    isWon: false,
    timerSeconds: 0,
    isPaused: false,
    history: [],
    hintsUsed: 0,
    dailyDate,
  };
}

function loadPersistedOrNew(initialDifficulty: Difficulty): GameState {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Partial<GameState>;
      if (
        Array.isArray(parsed.board) &&
        parsed.board.length === 9 &&
        parsed.board.every(r => Array.isArray(r) && r.length === 9)
      ) {
        const state: GameState = {
          ...freshState(parsed.difficulty ?? initialDifficulty, parsed.maxMistakes ?? null, parsed.board as Board),
          ...parsed,
          // Fields that older saved versions may lack
          gameId: parsed.gameId ?? newId(),
          hintsUsed: parsed.hintsUsed ?? 0,
          dailyDate: parsed.dailyDate ?? null,
          history: Array.isArray(parsed.history) ? parsed.history : [],
        } as GameState;
        recomputeErrors(state.board);
        return state;
      }
    } catch { /* ignore */ }
  }
  return freshState(initialDifficulty, null);
}

function persist(state: GameState): void {
  try {
    // History snapshots are heavy — keep only the last 30 on disk
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, history: state.history.slice(-30) }));
  } catch { /* ignore */ }
}

export interface GameOptions {
  autoRemoveNotes: boolean;
}

export function useSudokuGame(options: GameOptions, initialDifficulty: Difficulty = "medium") {
  const [state, setState] = useState<GameState>(() => loadPersistedOrNew(initialDifficulty));
  const optionsRef = useRef(options);
  optionsRef.current = options;

  // Timer
  useEffect(() => {
    if (state.isPaused || state.isGameOver || state.isWon) return;
    const id = setInterval(() => {
      setState(prev => ({ ...prev, timerSeconds: prev.timerSeconds + 1 }));
    }, 1000);
    return () => clearInterval(id);
  }, [state.isPaused, state.isGameOver, state.isWon]);

  // Auto-pause when the tab is hidden
  useEffect(() => {
    const onVis = () => {
      if (document.hidden) {
        setState(prev => (prev.isGameOver || prev.isWon || prev.isPaused ? prev : { ...prev, isPaused: true }));
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  // Persistence (throttled by the timer tick anyway)
  useEffect(() => { persist(state); }, [state]);

  const selectCell = useCallback((row: number, col: number) => {
    setState(prev => ({ ...prev, selectedCell: [row, col] }));
  }, []);

  const setCellValue = useCallback((num: number) => {
    setState(prev => {
      if (!prev.selectedCell || prev.isGameOver || prev.isWon || prev.isPaused) return prev;
      const [r, c] = prev.selectedCell;
      const cell = prev.board[r][c];
      if (cell.isInitial) return prev;
      // Correct digit already in place — nothing to do
      if (!prev.isPencilMode && cell.value === num && !cell.isError) return prev;

      const newBoard = cloneBoard(prev.board);
      const target = newBoard[r][c];

      if (prev.isPencilMode) {
        if (target.value !== null) return prev;
        const notes = new Set(target.notes);
        if (notes.has(num)) notes.delete(num);
        else notes.add(num);
        target.notes = Array.from(notes).sort((a, b) => a - b);
        return { ...prev, board: newBoard, history: pushHistory(prev) };
      }

      target.value = num;
      target.notes = [];
      const isCorrect = num === target.solution;

      // Remove this digit from notes of peers (row / column / box)
      if (isCorrect && optionsRef.current.autoRemoveNotes) {
        const sr = Math.floor(r / 3) * 3;
        const sc = Math.floor(c / 3) * 3;
        for (let i = 0; i < 9; i++) {
          newBoard[r][i].notes = newBoard[r][i].notes.filter(n => n !== num);
          newBoard[i][c].notes = newBoard[i][c].notes.filter(n => n !== num);
          const br = sr + Math.floor(i / 3);
          const bc = sc + (i % 3);
          newBoard[br][bc].notes = newBoard[br][bc].notes.filter(n => n !== num);
        }
      }

      recomputeErrors(newBoard);

      const newMistakes = isCorrect ? prev.mistakes : prev.mistakes + 1;
      const gameOver = prev.maxMistakes !== null && newMistakes >= prev.maxMistakes;

      return {
        ...prev,
        board: newBoard,
        mistakes: newMistakes,
        isGameOver: gameOver,
        isWon: !gameOver && isSolved(newBoard),
        history: pushHistory(prev),
      };
    });
  }, []);

  const eraseCell = useCallback(() => {
    setState(prev => {
      if (!prev.selectedCell || prev.isGameOver || prev.isWon) return prev;
      const [r, c] = prev.selectedCell;
      const cell = prev.board[r][c];
      if (cell.isInitial || (cell.value === null && cell.notes.length === 0)) return prev;

      const newBoard = cloneBoard(prev.board);
      newBoard[r][c].value = null;
      newBoard[r][c].notes = [];
      recomputeErrors(newBoard);
      return { ...prev, board: newBoard, history: pushHistory(prev) };
    });
  }, []);

  const togglePencilMode = useCallback(() => {
    setState(prev => ({ ...prev, isPencilMode: !prev.isPencilMode }));
  }, []);

  const undo = useCallback(() => {
    setState(prev => {
      if (prev.history.length === 0 || prev.isGameOver || prev.isWon) return prev;
      const last = prev.history[prev.history.length - 1];
      return {
        ...prev,
        board: cloneBoard(last.board),
        selectedCell: last.selectedCell ? [last.selectedCell[0], last.selectedCell[1]] : null,
        history: prev.history.slice(0, -1),
      };
    });
  }, []);

  /** Reveal the selected cell — or, if it's already correct, the first empty/wrong one */
  const getHint = useCallback(() => {
    setState(prev => {
      if (prev.isGameOver || prev.isWon || prev.isPaused) return prev;
      let target: [number, number] | null = null;
      if (prev.selectedCell) {
        const [r, c] = prev.selectedCell;
        const cell = prev.board[r][c];
        if (!cell.isInitial && (cell.value === null || cell.isError)) target = [r, c];
      }
      if (!target) {
        outer: for (let r = 0; r < 9; r++) {
          for (let c = 0; c < 9; c++) {
            const cell = prev.board[r][c];
            if (cell.value === null || cell.isError) { target = [r, c]; break outer; }
          }
        }
      }
      if (!target) return prev;

      const [r, c] = target;
      const newBoard = cloneBoard(prev.board);
      const cell = newBoard[r][c];
      cell.value = cell.solution;
      cell.notes = [];
      if (optionsRef.current.autoRemoveNotes) {
        for (let i = 0; i < 9; i++) {
          newBoard[r][i].notes = newBoard[r][i].notes.filter(n => n !== cell.solution);
          newBoard[i][c].notes = newBoard[i][c].notes.filter(n => n !== cell.solution);
        }
      }
      recomputeErrors(newBoard);

      return {
        ...prev,
        board: newBoard,
        selectedCell: target,
        hintsUsed: prev.hintsUsed + 1,
        isWon: isSolved(newBoard),
        history: pushHistory(prev),
      };
    });
  }, []);

  /** Fill every empty cell with all currently possible candidates */
  const fillAutoNotes = useCallback(() => {
    setState(prev => {
      if (prev.isGameOver || prev.isWon || prev.isPaused) return prev;
      const newBoard = cloneBoard(prev.board);
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (newBoard[r][c].value === null) newBoard[r][c].notes = candidatesFor(prev.board, r, c);
        }
      }
      return { ...prev, board: newBoard, history: pushHistory(prev) };
    });
  }, []);

  const startNewGame = useCallback((difficulty: Difficulty) => {
    setState(prev => freshState(difficulty, prev.maxMistakes));
  }, []);

  const startDaily = useCallback((dateKey: string) => {
    setState(prev => freshState(dailyDifficulty(dateKey), prev.maxMistakes, createDailyBoard(dateKey), dateKey));
  }, []);

  const togglePause = useCallback(() => {
    setState(prev => (prev.isGameOver || prev.isWon ? prev : { ...prev, isPaused: !prev.isPaused }));
  }, []);

  const setMaxMistakes = useCallback((value: number | null) => {
    setState(prev => ({
      ...prev,
      maxMistakes: value,
      isGameOver: prev.isGameOver || (value !== null && prev.mistakes >= value && !prev.isWon),
    }));
  }, []);

  return {
    state,
    selectCell,
    setCellValue,
    eraseCell,
    togglePencilMode,
    undo,
    getHint,
    fillAutoNotes,
    startNewGame,
    startDaily,
    togglePause,
    setMaxMistakes,
  };
}
