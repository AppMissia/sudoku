// src/context/PlayerContext.tsx
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { auth, db, isFirebaseConfigured } from "../services/firebase";
import {
  applyGameResult,
  freshPlayer,
  mergeGuestInto,
  normalizePlayer,
} from "../services/progression";
import { publishDailyScore, publishLeaderEntry } from "../services/leaderboard";
import { PENDING_NAME_KEY, signOut as authSignOut } from "../services/auth";
import { GameResult, PlayerData, RewardInfo, Settings } from "../types/sudoku";

const GUEST_KEY = "zen_sudoku_player_v1";

export type CloudStatus = "disabled" | "guest" | "loading" | "synced" | "offline" | "error";

type GameInput = Omit<GameResult, "xpGained" | "finishedAt">;

interface PlayerContextValue {
  player: PlayerData;
  user: User | null;
  isReady: boolean;          // profile is loaded and safe to write
  cloudStatus: CloudStatus;
  recordGame: (game: GameInput) => RewardInfo | null;
  updateProfile: (patch: Partial<Pick<PlayerData, "displayName" | "avatar">>) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  signOut: () => Promise<void>;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

const loadGuest = (): PlayerData => {
  try {
    const raw = localStorage.getItem(GUEST_KEY);
    if (raw) return normalizePlayer(JSON.parse(raw));
  } catch { /* ignore */ }
  return freshPlayer();
};

const saveGuest = (p: PlayerData) => {
  try { localStorage.setItem(GUEST_KEY, JSON.stringify(p)); } catch { /* ignore */ }
};

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [player, setPlayer] = useState<PlayerData>(loadGuest);
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(!isFirebaseConfigured || !auth);
  const [cloudReady, setCloudReady] = useState(false);
  const [cloudStatus, setCloudStatus] = useState<CloudStatus>(isFirebaseConfigured ? "loading" : "disabled");

  const playerRef = useRef(player);
  playerRef.current = player;
  const userRef = useRef<User | null>(null);
  userRef.current = user;
  const cloudReadyRef = useRef(false);
  cloudReadyRef.current = cloudReady;

  // ── Auth state ──
  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(auth, u => {
      setUser(u);
      setAuthReady(true);
      if (!u) {
        setCloudReady(false);
        setCloudStatus("guest");
        setPlayer(loadGuest());
      } else {
        setCloudStatus("loading");
      }
    });
  }, []);

  // ── Cloud profile subscription ──
  useEffect(() => {
    if (!user || !db) return;
    const ref = doc(db, "users", user.uid);
    let first = true;

    const unsub = onSnapshot(
      ref,
      { includeMetadataChanges: true },
      snap => {
        setCloudStatus(snap.metadata.fromCache ? "offline" : "synced");
        if (first) {
          first = false;
          const guest = loadGuest();
          const pendingName = localStorage.getItem(PENDING_NAME_KEY);
          let base: PlayerData;
          if (snap.exists()) {
            base = normalizePlayer(snap.data());
          } else {
            base = {
              ...guest,
              history: [],
              xp: 0,
              stats: freshPlayer().stats,
              achievements: {},
              daily: {},
              currentStreak: 0,
              bestStreak: 0,
              displayName: pendingName || user.displayName || guest.displayName,
            };
          }
          const merged = mergeGuestInto(base, guest);
          localStorage.removeItem(PENDING_NAME_KEY);
          // Guest progress now lives in the cloud — reset the local guest profile
          localStorage.removeItem(GUEST_KEY);
          setPlayer(merged);
          setCloudReady(true);
          if (!snap.exists() || merged !== base) {
            void setDoc(ref, merged);
          }
          void publishLeaderEntry(user.uid, merged).catch(() => undefined);
          return;
        }
        // Updates coming from other devices
        if (!snap.metadata.hasPendingWrites && snap.exists()) {
          setPlayer(normalizePlayer(snap.data()));
        }
      },
      err => {
        console.error("Profile sync error:", err);
        setCloudStatus("error");
        setCloudReady(true); // allow local play anyway
      }
    );
    return unsub;
  }, [user]);

  /** Single write path: updates state + persists to cloud or local storage */
  const persist = useCallback((next: PlayerData, opts?: { publish?: boolean }) => {
    playerRef.current = next;
    setPlayer(next);
    const u = userRef.current;
    if (u && db && cloudReadyRef.current) {
      void setDoc(doc(db, "users", u.uid), next).catch(err => {
        console.error(err);
        setCloudStatus("error");
      });
      if (opts?.publish) void publishLeaderEntry(u.uid, next).catch(() => undefined);
    } else {
      saveGuest(next);
    }
  }, []);

  const recordGame = useCallback((game: GameInput): RewardInfo | null => {
    const current = playerRef.current;
    if (current.history.some(h => h.id === game.id)) return null; // already recorded
    const { player: next, reward } = applyGameResult(current, game);
    persist(next, { publish: true });
    const u = userRef.current;
    if (u && game.won && game.dailyDate) {
      void publishDailyScore(u.uid, next, game.dailyDate, game.time, game.mistakes);
    }
    return reward;
  }, [persist]);

  const updateProfile = useCallback((patch: Partial<Pick<PlayerData, "displayName" | "avatar">>) => {
    persist({ ...playerRef.current, ...patch, updatedAt: Date.now() }, { publish: true });
  }, [persist]);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    const cur = playerRef.current;
    persist({ ...cur, settings: { ...cur.settings, ...patch }, updatedAt: Date.now() });
  }, [persist]);

  const signOut = useCallback(async () => {
    await authSignOut();
  }, []);

  const isReady = authReady && (!user || cloudReady);

  const value = useMemo<PlayerContextValue>(() => ({
    player,
    user,
    isReady,
    cloudStatus,
    recordGame,
    updateProfile,
    updateSettings,
    signOut,
  }), [player, user, isReady, cloudStatus, recordGame, updateProfile, updateSettings, signOut]);

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
};

export function usePlayer(): PlayerContextValue {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used inside <PlayerProvider>");
  return ctx;
}
