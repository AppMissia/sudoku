// src/App.tsx
import React, { useEffect, useCallback, useState, useMemo, useRef } from "react";
import { Difficulty, RewardInfo } from "./types/sudoku";
import { useSudokuGame } from "./hooks/useSudokuGame";
import { TopBar, View } from "./components/TopBar";
import { SudokuGrid } from "./components/SudokuGrid";
import { ActionToolbar } from "./components/ActionToolbar";
import { NumberPad } from "./components/NumberPad";
import { GameModals } from "./components/GameModals";
import { SoundEngine } from "./utils/soundEngine";
import { vibrateLight, vibrateError, vibrateSuccess } from "./utils/haptics";
import { PlayerProvider, usePlayer } from "./context/PlayerContext";
import { toDateKey } from "./utils/sudokuEngine";

// Lazy load slide-over panels for code-splitting
const ProfilePanel = React.lazy(() => import("./components/panels/ProfilePanel").then(m => ({ default: m.ProfilePanel })));
const AuthPanel = React.lazy(() => import("./components/panels/AuthPanel").then(m => ({ default: m.AuthPanel })));
const LeaderboardPanel = React.lazy(() => import("./components/panels/LeaderboardPanel").then(m => ({ default: m.LeaderboardPanel })));
const DailyPanel = React.lazy(() => import("./components/panels/DailyPanel").then(m => ({ default: m.DailyPanel })));
const SettingsPanel = React.lazy(() => import("./components/panels/SettingsPanel").then(m => ({ default: m.SettingsPanel })));

const SudokuGameView: React.FC = () => {
  const { player, user, recordGame, updateSettings } = usePlayer();
  const [activePanel, setActivePanel] = useState<View | null>(null);
  const [reward, setReward] = useState<RewardInfo | null>(null);
  const [isNewRecord, setIsNewRecord] = useState(false);

  const {
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
  } = useSudokuGame({
    autoRemoveNotes: player.settings.autoRemoveNotes,
  });

  const sound = SoundEngine.getInstance();
  const [isMuted, setMuted] = useState<boolean>(sound.isMuted);

  // Error flash indicator
  const [errorFlash, setErrorFlash] = useState(false);
  const prevMistakes = useRef(state.mistakes);

  // Sync theme & animations attributes with document root
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", player.settings.theme);
  }, [player.settings.theme]);

  useEffect(() => {
    document.documentElement.setAttribute(
      "data-animations",
      player.settings.animations ? "true" : "false"
    );
  }, [player.settings.animations]);

  // Detect mistake increase → trigger screen flash & audio/haptic feedback
  useEffect(() => {
    if (state.mistakes > prevMistakes.current) {
      if (player.settings.animations) setErrorFlash(true);
      sound.playError();
      if (player.settings.vibration) vibrateError();
      const t = setTimeout(() => setErrorFlash(false), 600);
      prevMistakes.current = state.mistakes;
      return () => clearTimeout(t);
    }
    prevMistakes.current = state.mistakes;
  }, [state.mistakes, sound, player.settings.vibration, player.settings.animations]);

  // Selected cell's value for NumberPad & grid highlighting
  const selectedNumber = useMemo(() => {
    if (!state.selectedCell) return null;
    const [r, c] = state.selectedCell;
    return state.board[r][c].value;
  }, [state.selectedCell, state.board]);

  const toggleSound = useCallback(() => {
    sound.toggleMute();
    setMuted(sound.isMuted);
  }, [sound]);

  // Global Keyboard handling
  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (activePanel) return; // Don't intercept game keys when a modal panel is open
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
      } else if (k.toLowerCase() === "a") {
        fillAutoNotes();
        e.preventDefault();
      } else if (k.toLowerCase() === "h") {
        getHint();
        e.preventDefault();
      } else if (k.toLowerCase() === "u" || (e.ctrlKey && k === "z")) {
        undo();
        e.preventDefault();
      } else if (k === " ") {
        togglePause();
        e.preventDefault();
      }
    },
    [
      activePanel,
      state,
      setCellValue,
      eraseCell,
      selectCell,
      togglePencilMode,
      fillAutoNotes,
      getHint,
      undo,
      togglePause,
    ]
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
      if (player.settings.vibration) vibrateLight();
    },
    [selectCell, sound, player.settings.vibration]
  );

  // Number entry feedback
  const handleSetValue = useCallback(
    (num: number) => {
      if (!state.selectedCell) return;
      const [r, c] = state.selectedCell;
      const cell = state.board[r][c];
      if (cell.isInitial) return;
      setCellValue(num);

      setTimeout(() => {
        sound.playClick();
        if (player.settings.vibration) vibrateLight();
      }, 0);
    },
    [state, setCellValue, sound, player.settings.vibration]
  );

  const handleErase = useCallback(() => {
    eraseCell();
    sound.playErase();
    if (player.settings.vibration) vibrateLight();
  }, [eraseCell, sound, player.settings.vibration]);

  // Game completion handling (record win/loss, reward XP, achievements)
  const recordedGameIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (state.isWon && recordedGameIdRef.current !== state.gameId) {
      recordedGameIdRef.current = state.gameId;
      sound.playWin();
      if (player.settings.vibration) vibrateSuccess();

      const currentBest = player.stats[state.difficulty].bestTime;
      const isRecord = currentBest === null || state.timerSeconds < currentBest;
      setIsNewRecord(isRecord);

      const rew = recordGame({
        id: state.gameId,
        difficulty: state.difficulty,
        won: true,
        time: state.timerSeconds,
        mistakes: state.mistakes,
        hintsUsed: state.hintsUsed,
        dailyDate: state.dailyDate,
      });
      if (rew) setReward(rew);
    } else if (state.isGameOver && recordedGameIdRef.current !== state.gameId) {
      recordedGameIdRef.current = state.gameId;
      const rew = recordGame({
        id: state.gameId,
        difficulty: state.difficulty,
        won: false,
        time: state.timerSeconds,
        mistakes: state.mistakes,
        hintsUsed: state.hintsUsed,
        dailyDate: state.dailyDate,
      });
      if (rew) setReward(rew);
    }
  }, [
    state.isWon,
    state.isGameOver,
    state.gameId,
    state.difficulty,
    state.timerSeconds,
    state.mistakes,
    state.hintsUsed,
    state.dailyDate,
    sound,
    player.settings.vibration,
    player.stats,
    recordGame,
  ]);

  const handleRestart = (diff?: Difficulty) => {
    setReward(null);
    setIsNewRecord(false);
    startNewGame(diff ?? state.difficulty);
  };

  const handleNextGame = () => {
    setReward(null);
    setIsNewRecord(false);
    startNewGame(state.difficulty);
  };

  return (
    <div className="min-h-screen w-full bg-bg text-fg flex flex-col items-center px-3 py-4 sm:px-6 sm:py-6 relative transition-colors duration-300">
      {/* Error flash overlay */}
      {errorFlash && (
        <div
          className="fixed inset-0 pointer-events-none z-40 border-4 border-red-500/50 rounded-lg animate-screen-flash"
          style={{ background: "radial-gradient(ellipse at center, rgba(239,68,68,0.12) 0%, transparent 70%)" }}
        />
      )}

      <div className="w-full max-w-lg flex flex-col gap-4 flex-1">
        {/* Header */}
        <TopBar
          avatar={player.avatar}
          xp={player.xp}
          isSignedIn={Boolean(user)}
          onOpen={setActivePanel}
          difficulty={state.difficulty}
          dailyDate={state.dailyDate}
          onChangeDifficulty={d => {
            setReward(null);
            startNewGame(d);
          }}
          mistakes={state.mistakes}
          maxMistakes={state.maxMistakes}
          timerSeconds={state.timerSeconds}
          showTimer={player.settings.showTimer}
          isPaused={state.isPaused}
          onTogglePause={togglePause}
          isMuted={isMuted}
          onToggleSound={toggleSound}
          animations={player.settings.animations}
          onToggleAnimations={() =>
            updateSettings({ animations: !player.settings.animations })
          }
          board={state.board}
          dailyDone={Boolean(player.daily[toDateKey()])}
        />

        {/* Grid */}
        <div className="flex-1 flex items-center">
          <SudokuGrid
            board={state.board}
            selectedCell={state.selectedCell}
            onSelect={handleSelect}
            settings={player.settings}
            isPaused={state.isPaused}
          />
        </div>

        {/* Action Toolbar */}
        <ActionToolbar
          onUndo={undo}
          onErase={handleErase}
          onTogglePencil={togglePencilMode}
          onHint={getHint}
          onAutoNotes={fillAutoNotes}
          pencilMode={state.isPencilMode}
          historyLength={state.history.length}
          hintsUsed={state.hintsUsed}
        />

        {/* Number Pad */}
        <NumberPad
          board={state.board}
          onPress={handleSetValue}
          selectedNumber={selectedNumber}
          pencilMode={state.isPencilMode}
        />

        {/* Bottom spacer for mobile safe area */}
        <div className="h-2 sm:h-4 flex-shrink-0" />
      </div>

      {/* Modals */}
      <GameModals
        state={state}
        reward={reward}
        isNewRecord={isNewRecord}
        isSignedIn={Boolean(user)}
        animations={player.settings.animations}
        onContinue={togglePause}
        onRestart={handleRestart}
        onNextGame={handleNextGame}
        onOpenAuth={() => setActivePanel("auth")}
      />

      {/* Slide-over panels (lazy loaded) */}
      <React.Suspense fallback={null}>
        {activePanel === "profile" && (
          <ProfilePanel
            onClose={() => setActivePanel(null)}
            onOpenAuth={() => setActivePanel("auth")}
          />
        )}

        {activePanel === "auth" && (
          <AuthPanel onClose={() => setActivePanel(null)} />
        )}

        {activePanel === "leaderboard" && (
          <LeaderboardPanel onClose={() => setActivePanel(null)} />
        )}

        {activePanel === "daily" && (
          <DailyPanel
            onClose={() => setActivePanel(null)}
            onStartDaily={dateKey => {
              setReward(null);
              startDaily(dateKey);
            }}
            currentDailyDate={state.dailyDate}
          />
        )}

        {activePanel === "settings" && (
          <SettingsPanel
            onClose={() => setActivePanel(null)}
            maxMistakes={state.maxMistakes}
            onChangeMaxMistakes={setMaxMistakes}
          />
        )}
      </React.Suspense>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <PlayerProvider>
      <SudokuGameView />
    </PlayerProvider>
  );
};

export default App;
