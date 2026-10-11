// src/services/progression.ts
import {
  Difficulty,
  DifficultyStats,
  GameResult,
  PlayerData,
  RewardInfo,
  Settings,
} from "../types/sudoku";

export const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard", "expert"];

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: "Лёгкий",
  medium: "Средний",
  hard: "Сложный",
  expert: "Эксперт",
};

export const AVATARS = [
  "🦊", "🐼", "🦉", "🐯", "🐸", "🐙", "🦄", "🐲",
  "🐧", "🐨", "🦁", "🐺", "🐳", "🦋", "🌵", "🍀",
  "⚡", "🔥", "🌙", "⭐", "🎯", "🧠", "👑", "🚀",
];

export const HISTORY_LIMIT = 100;

export const DEFAULT_SETTINGS: Settings = {
  theme: "midnight",
  highlightRegion: true,
  highlightSameNumbers: true,
  highlightConflicts: true,
  autoRemoveNotes: true,
  showTimer: true,
  vibration: true,
  animations: true,
};

const emptyStats = (): DifficultyStats => ({ played: 0, won: 0, bestTime: null, totalTime: 0 });

export function freshPlayer(displayName = "Игрок"): PlayerData {
  return {
    displayName,
    avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)],
    xp: 0,
    stats: { easy: emptyStats(), medium: emptyStats(), hard: emptyStats(), expert: emptyStats() },
    currentStreak: 0,
    bestStreak: 0,
    achievements: {},
    history: [],
    daily: {},
    settings: { ...DEFAULT_SETTINGS },
    updatedAt: Date.now(),
  };
}

/** Make any (possibly old / partial) stored object a valid PlayerData */
export function normalizePlayer(raw: unknown): PlayerData {
  const base = freshPlayer();
  if (!raw || typeof raw !== "object") return base;
  const p = raw as Partial<PlayerData>;
  const stats = { ...base.stats };
  for (const d of DIFFICULTIES) {
    stats[d] = { ...emptyStats(), ...(p.stats?.[d] ?? {}) };
  }
  return {
    displayName: typeof p.displayName === "string" && p.displayName ? p.displayName : base.displayName,
    avatar: typeof p.avatar === "string" && p.avatar ? p.avatar : base.avatar,
    xp: typeof p.xp === "number" ? p.xp : 0,
    stats,
    currentStreak: p.currentStreak ?? 0,
    bestStreak: p.bestStreak ?? 0,
    achievements: p.achievements ?? {},
    history: Array.isArray(p.history) ? p.history : [],
    daily: p.daily ?? {},
    settings: { ...DEFAULT_SETTINGS, ...(p.settings ?? {}) },
    updatedAt: p.updatedAt ?? Date.now(),
  };
}

// ───────────────────────── Levels ─────────────────────────

/** Total XP required to reach `level` (level 1 = 0 XP, 2 = 100, 3 = 300, 4 = 600 …) */
export const xpForLevel = (level: number): number => 50 * level * (level - 1);

export function levelFromXp(xp: number): number {
  return Math.max(1, Math.floor((1 + Math.sqrt(1 + (8 * xp) / 100)) / 2));
}

export function levelProgress(xp: number): { level: number; current: number; needed: number; pct: number } {
  const level = levelFromXp(xp);
  const start = xpForLevel(level);
  const end = xpForLevel(level + 1);
  const current = xp - start;
  const needed = end - start;
  return { level, current, needed, pct: Math.min(100, Math.round((current / needed) * 100)) };
}

const TITLES: [number, string][] = [
  [1, "Новичок"],
  [3, "Ученик"],
  [5, "Любитель"],
  [8, "Знаток"],
  [12, "Мастер"],
  [17, "Гроссмейстер"],
  [25, "Легенда"],
];

export function levelTitle(level: number): string {
  let title = TITLES[0][1];
  for (const [min, t] of TITLES) if (level >= min) title = t;
  return title;
}

// ───────────────────────── XP ─────────────────────────

const BASE_XP: Record<Difficulty, number> = { easy: 10, medium: 20, hard: 35, expert: 50 };

export function calcXp(r: Omit<GameResult, "id" | "xpGained" | "finishedAt">): number {
  if (!r.won) return 2; // consolation for trying
  let xp = BASE_XP[r.difficulty];
  if (r.mistakes === 0) xp += Math.round(BASE_XP[r.difficulty] * 0.5);
  if (r.hintsUsed === 0) xp += Math.round(BASE_XP[r.difficulty] * 0.25);
  if (r.dailyDate) xp += 20;
  return xp;
}

// ───────────────────────── Achievements ─────────────────────────

export interface Achievement {
  id: string;
  icon: string;
  title: string;
  description: string;
  check: (p: PlayerData, last: GameResult) => boolean;
}

const totalWins = (p: PlayerData) => DIFFICULTIES.reduce((s, d) => s + p.stats[d].won, 0);

/** Longest run of consecutive calendar days with a completed daily ending at the newest one */
function dailyDayStreak(p: PlayerData): number {
  const keys = Object.keys(p.daily).sort();
  if (keys.length === 0) return 0;
  let best = 1;
  let run = 1;
  for (let i = 1; i < keys.length; i++) {
    const prev = new Date(keys[i - 1] + "T00:00:00");
    const cur = new Date(keys[i] + "T00:00:00");
    const diff = Math.round((cur.getTime() - prev.getTime()) / 86400000);
    run = diff === 1 ? run + 1 : 1;
    best = Math.max(best, run);
  }
  return best;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: "first_win", icon: "🏁", title: "Первая победа", description: "Решите первую головоломку", check: p => totalWins(p) >= 1 },
  { id: "flawless", icon: "💎", title: "Без ошибок", description: "Победа без единой ошибки", check: (_, g) => g.won && g.mistakes === 0 },
  { id: "no_hints", icon: "🧠", title: "Сам себе голова", description: "Победа без подсказок", check: (_, g) => g.won && g.hintsUsed === 0 },
  { id: "perfect_expert", icon: "👑", title: "Безупречный эксперт", description: "Эксперт без ошибок и подсказок", check: (_, g) => g.won && g.difficulty === "expert" && g.mistakes === 0 && g.hintsUsed === 0 },
  { id: "wins_10", icon: "🥉", title: "Десятка", description: "10 побед", check: p => totalWins(p) >= 10 },
  { id: "wins_50", icon: "🥈", title: "Полтинник", description: "50 побед", check: p => totalWins(p) >= 50 },
  { id: "wins_100", icon: "🥇", title: "Сотня", description: "100 побед", check: p => totalWins(p) >= 100 },
  { id: "streak_5", icon: "🔥", title: "В ударе", description: "5 побед подряд", check: p => p.currentStreak >= 5 },
  { id: "streak_10", icon: "☄️", title: "Неудержимый", description: "10 побед подряд", check: p => p.currentStreak >= 10 },
  { id: "speed_easy", icon: "⚡", title: "Молния", description: "Лёгкий уровень быстрее 5 минут", check: (_, g) => g.won && g.difficulty === "easy" && g.time < 300 },
  { id: "speed_medium", icon: "🏎️", title: "Скорострел", description: "Средний уровень быстрее 8 минут", check: (_, g) => g.won && g.difficulty === "medium" && g.time < 480 },
  { id: "expert_win", icon: "🎓", title: "Эксперт", description: "Победа на уровне «Эксперт»", check: (_, g) => g.won && g.difficulty === "expert" },
  { id: "expert_10min", icon: "🚀", title: "Эксперт за 10 минут", description: "Эксперт быстрее 10 минут", check: (_, g) => g.won && g.difficulty === "expert" && g.time < 600 },
  { id: "all_difficulties", icon: "🌈", title: "Универсал", description: "Победа на каждой сложности", check: p => DIFFICULTIES.every(d => p.stats[d].won > 0) },
  { id: "daily_first", icon: "📅", title: "Челленджер", description: "Пройдите челлендж дня", check: (_, g) => g.won && g.dailyDate !== null },
  { id: "daily_7", icon: "🗓️", title: "Неделя силы", description: "Челлендж дня 7 дней подряд", check: p => dailyDayStreak(p) >= 7 },
  { id: "night_owl", icon: "🦉", title: "Сова", description: "Победа между полуночью и 5 утра", check: (_, g) => g.won && new Date(g.finishedAt).getHours() < 5 },
  { id: "level_5", icon: "⭐", title: "Растущая звезда", description: "Достигните 5 уровня", check: p => levelFromXp(p.xp) >= 5 },
  { id: "level_10", icon: "🌟", title: "Мастер судоку", description: "Достигните 10 уровня", check: p => levelFromXp(p.xp) >= 10 },
];

export const ACHIEVEMENT_MAP: Record<string, Achievement> = Object.fromEntries(
  ACHIEVEMENTS.map(a => [a.id, a])
);

// ───────────────────────── Apply a finished game ─────────────────────────

export function applyGameResult(
  player: PlayerData,
  input: Omit<GameResult, "id" | "xpGained" | "finishedAt"> & { id: string; finishedAt?: number }
): { player: PlayerData; reward: RewardInfo } {
  const result: GameResult = {
    ...input,
    finishedAt: input.finishedAt ?? Date.now(),
    xpGained: calcXp(input),
  };

  const levelBefore = levelFromXp(player.xp);
  const s = player.stats[result.difficulty];
  const stats = {
    ...player.stats,
    [result.difficulty]: {
      played: s.played + 1,
      won: s.won + (result.won ? 1 : 0),
      bestTime: result.won ? (s.bestTime === null ? result.time : Math.min(s.bestTime, result.time)) : s.bestTime,
      totalTime: s.totalTime + (result.won ? result.time : 0),
    },
  };

  const currentStreak = result.won ? player.currentStreak + 1 : 0;
  const daily = { ...player.daily };
  if (result.won && result.dailyDate) {
    const prev = daily[result.dailyDate];
    if (!prev || result.time < prev.time) {
      daily[result.dailyDate] = { time: result.time, mistakes: result.mistakes };
    }
  }

  let next: PlayerData = {
    ...player,
    xp: player.xp + result.xpGained,
    stats,
    currentStreak,
    bestStreak: Math.max(player.bestStreak, currentStreak),
    daily,
    history: [result, ...player.history].slice(0, HISTORY_LIMIT),
    updatedAt: Date.now(),
  };

  // Achievements (check twice so that level-based ones see XP from this game)
  const unlocked: string[] = [];
  const achievements = { ...next.achievements };
  for (const a of ACHIEVEMENTS) {
    if (!achievements[a.id] && a.check(next, result)) {
      achievements[a.id] = Date.now();
      unlocked.push(a.id);
    }
  }
  next = { ...next, achievements };

  const levelAfter = levelFromXp(next.xp);
  return {
    player: next,
    reward: {
      xpGained: result.xpGained,
      leveledUp: levelAfter > levelBefore,
      newLevel: levelAfter,
      newAchievements: unlocked,
    },
  };
}

/** Replays guest games (not yet present in the cloud profile) on top of the cloud profile */
export function mergeGuestInto(cloud: PlayerData, guest: PlayerData): PlayerData {
  const known = new Set(cloud.history.map(h => h.id));
  const missing = guest.history.filter(h => !known.has(h.id)).sort((a, b) => a.finishedAt - b.finishedAt);
  let merged = cloud;
  for (const g of missing) {
    merged = applyGameResult(merged, g).player;
  }
  return merged;
}

export const formatTime = (sec: number): string => {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
};
