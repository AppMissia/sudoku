// src/App.tsx
import React, { useEffect, useCallback, useState, useMemo, useRef } from "react";
import { Difficulty } from "./types/sudoku";
import { useSudokuGame } from "./hooks/useSudokuGame";
import { TopBar } from "./components/TopBar";
import { SudokuGrid } from "./components/SudokuGrid";
import { ActionToolbar } from "./components/ActionToolbar";
import { NumberPad } from "./components/NumberPad";
import { GameModals } from "./components/GameModals";
import { SoundEngine } from "./utils/soundEngine";
import { vibrateLight, vibrateError, vibrateSuccess } from "./utils/haptics";

export const App: React.FC = () => {
  const [theme, setTheme] = useState<"light" | "dark">(() =>
    (localStorage.getItem("premium-sudoku-theme") ?? "dark") as "light" | "dark"
  );

  const {
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
  } = useSudokuGame();

  const sound = SoundEngine.getInstance();
  const [isMuted, setMuted] = useState<boolean>(sound.isMuted);

  // Error flash indicator
  const [errorFlash, setErrorFlash] = useState(false);
  const prevMistakes = useRef(state.mistakes);

  // Detect mistake increase → trigger screen flash
  useEffect(() => {
    if (state.mistakes > prevMistakes.current) {
      setErrorFlash(true);
      sound.playError();
      vibrateError();
      const t = setTimeout(() => setErrorFlash(false), 600);
      prevMistakes.current = state.mistakes;
      return () => clearTimeout(t);
    }
    prevMistakes.current = state.mistakes;
  }, [state.mistakes, sound]);

  // Selected cell's value for NumberPad highlighting
  const selectedNumber = useMemo(() => {
    if (!state.selectedCell) return null;
    const [r, c] = state.selectedCell;
    return state.board[r][c].value;
  }, [state.selectedCell, state.board]);

  // Theme
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    localStorage.setItem("premium-sudoku-theme", theme);
  }, [theme]);

  const toggleTheme = useCallback(() =>
    setTheme(t => (t === "light" ? "dark" : "light")), []
  );
  const toggleSound = useCallback(() => {
    sound.toggleMute();
    setMuted(sound.isMuted);
  }, [sound]);

  // Keyboard
  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (state.isGameOver || state.isWon) return;
      const k = e.key;
      if (k >= "1" && k <= "9") {
        setCellValue(parseInt(k, 10));
        e.preventDefault();
      } else if (k === "Backspace" || k === "Delete") {
        eraseCell();
        e.preventDefault();
      } else if (k === "ArrowUp" && state.selectedCell) {
        selectCell((state.selectedCell[0] + 8) % 9, state.selectedCell[1]);
        e.preventDefault();
      } else if (k === "ArrowDown" && state.selectedCell) {
        selectCell((state.selectedCell[0] + 1) % 9, state.selectedCell[1]);
        e.preventDefault();
      } else if (k === "ArrowLeft" && state.selectedCell) {
        selectCell(state.selectedCell[0], (state.selectedCell[1] + 8) % 9);
        e.preventDefault();
      } else if (k === "ArrowRight" && state.selectedCell) {
        selectCell(state.selectedCell[0], (state.selectedCell[1] + 1) % 9);
        e.preventDefault();
      } else if (k.toLowerCase() === "n") {
        togglePencilMode();
        e.preventDefault();
      } else if (k.toLowerCase() === "u" || (e.ctrlKey && k === "z")) {
        undo();
        e.preventDefault();
      } else if (k === " ") {
        togglePause();
        e.preventDefault();
      }
    },
    [state, setCellValue, eraseCell, selectCell, togglePencilMode, undo, togglePause]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  // Cell select feedback
  const handleSelect = useCallback(
    (row: number, col: number) => {
      selectCell(row, col);
      sound.playClick();
      vibrateLight();
    },
    [selectCell, sound]
  );

  // Number entry feedback (error is handled via prevMistakes effect above)
  const handleSetValue = useCallback(
    (num: number) => {
      if (!state.selectedCell) return;
      const [r, c] = state.selectedCell;
      const cell = state.board[r][c];
      if (cell.isInitial) return;
      setCellValue(num);
      // Play click for correct entries (error sound is in the effect)
      setTimeout(() => {
        // Check if mistake count didn't change → it was correct
        sound.playClick();
        vibrateLight();
      }, 0);
    },
    [state, setCellValue, sound]
  );

  const handleErase = useCallback(() => {
    eraseCell();
    sound.playErase();
    vibrateLight();
  }, [eraseCell, sound]);

  // Win feedback
  useEffect(() => {
    if (state.isWon) {
      sound.playWin();
      vibrateSuccess();
    }
  }, [state.isWon, sound]);

  return (
    <div className="min-h-screen w-full bg-zinc-950 flex flex-col items-center px-3 py-4 sm:px-6 sm:py-6 relative">
      {/* Error flash overlay */}
      {errorFlash && (
        <div className="fixed inset-0 pointer-events-none z-40 border-4 border-red-500/40 rounded-lg animate-[cell-correct-flash_0.6s_ease-out_forwards]"
          style={{ background: "radial-gradient(ellipse at center, rgba(239,68,68,0.08) 0%, transparent 70%)" }}
        />
      )}

      <div className="w-full max-w-lg flex flex-col gap-4 flex-1">
        {/* Header */}
        <TopBar
          difficulty={state.difficulty}
          onChangeDifficulty={(d) => startNewGame(d)}
          mistakes={state.mistakes}
          maxMistakes={state.maxMistakes}
          onChangeMaxMistakes={setMaxMistakes}
          timerSeconds={state.timerSeconds}
          isPaused={state.isPaused}
          onTogglePause={togglePause}
          theme={theme}
          onToggleTheme={toggleTheme}
          isMuted={isMuted}
          onToggleSound={toggleSound}
          board={state.board}
        />

        {/* Grid */}
        <div className="flex-1 flex items-center">
          <SudokuGrid
            board={state.board}
            selectedCell={state.selectedCell}
            onSelect={handleSelect}
            onValue={setCellValue}
            isPencilMode={state.isPencilMode}
          />
        </div>

        {/* Actions */}
        <ActionToolbar
          onUndo={undo}
          onErase={handleErase}
          onTogglePencil={togglePencilMode}
          onHint={getHint}
          pencilMode={state.isPencilMode}
          historyLength={state.history.length}
        />

        {/* Number Pad */}
        <NumberPad
          board={state.board}
          onPress={handleSetValue}
          selectedNumber={selectedNumber}
        />

        {/* Bottom spacer for mobile safe area */}
        <div className="h-2 sm:h-4 flex-shrink-0" />
      </div>

      {/* Modals */}
      <GameModals
        state={state}
        onContinue={togglePause}
        onRestart={(diff) => startNewGame(diff ?? state.difficulty)}
        onNextGame={() => startNewGame(state.difficulty)}
        theme={theme}
        toggleTheme={toggleTheme}
      />
    </div>
  );
};

export default App;
