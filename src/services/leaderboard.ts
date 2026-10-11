// src/services/leaderboard.ts
import { collection, doc, getDocs, limit, orderBy, query, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import { DIFFICULTIES, levelFromXp } from "./progression";
import { PlayerData } from "../types/sudoku";

export interface LeaderEntry {
  uid: string;
  displayName: string;
  avatar: string;
  xp: number;
  level: number;
  wins: number;
}

export interface DailyEntry {
  uid: string;
  displayName: string;
  avatar: string;
  time: number;
  mistakes: number;
}

export async function publishLeaderEntry(uid: string, p: PlayerData): Promise<void> {
  if (!db) return;
  const wins = DIFFICULTIES.reduce((s, d) => s + p.stats[d].won, 0);
  await setDoc(doc(db, "leaderboard", uid), {
    displayName: p.displayName,
    avatar: p.avatar,
    xp: p.xp,
    level: levelFromXp(p.xp),
    wins,
    updatedAt: Date.now(),
  });
}

export async function publishDailyScore(
  uid: string,
  p: PlayerData,
  dateKey: string,
  time: number,
  mistakes: number
): Promise<void> {
  if (!db) return;
  try {
    await setDoc(doc(db, "daily", dateKey, "scores", uid), {
      displayName: p.displayName,
      avatar: p.avatar,
      time,
      mistakes,
      updatedAt: Date.now(),
    });
  } catch {
    // Rejected by security rules when the new time isn't better — that's fine
  }
}

export async function fetchTopPlayers(max = 50): Promise<LeaderEntry[]> {
  if (!db) return [];
  const snap = await getDocs(query(collection(db, "leaderboard"), orderBy("xp", "desc"), limit(max)));
  return snap.docs.map(d => {
    const v = d.data();
    return {
      uid: d.id,
      displayName: String(v.displayName ?? "Игрок"),
      avatar: String(v.avatar ?? "🙂"),
      xp: Number(v.xp ?? 0),
      level: Number(v.level ?? 1),
      wins: Number(v.wins ?? 0),
    };
  });
}

export async function fetchDailyTop(dateKey: string, max = 50): Promise<DailyEntry[]> {
  if (!db) return [];
  const snap = await getDocs(
    query(collection(db, "daily", dateKey, "scores"), orderBy("time", "asc"), limit(max))
  );
  return snap.docs.map(d => {
    const v = d.data();
    return {
      uid: d.id,
      displayName: String(v.displayName ?? "Игрок"),
      avatar: String(v.avatar ?? "🙂"),
      time: Number(v.time ?? 0),
      mistakes: Number(v.mistakes ?? 0),
    };
  });
}
