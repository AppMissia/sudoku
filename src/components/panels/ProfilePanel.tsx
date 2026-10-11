// src/components/panels/ProfilePanel.tsx
import React, { useMemo, useState } from "react";
import { Check, Cloud, CloudOff, LogIn, LogOut, Pencil, RefreshCw } from "lucide-react";
import { Sheet, Card, SectionTitle } from "../Sheet";
import { usePlayer } from "../../context/PlayerContext";
import {
  ACHIEVEMENTS,
  AVATARS,
  DIFFICULTIES,
  DIFFICULTY_LABELS,
  formatTime,
  levelProgress,
  levelTitle,
} from "../../services/progression";

const StatTile: React.FC<{ label: string; value: React.ReactNode; sub?: string }> = ({ label, value, sub }) => (
  <div className="rounded-2xl bg-surface border border-line/50 p-3.5">
    <div className="text-xl font-bold text-fg tabular-nums">{value}</div>
    <div className="text-[11px] text-muted mt-0.5">{label}</div>
    {sub && <div className="text-[10px] text-muted/80 mt-0.5">{sub}</div>}
  </div>
);

export const ProfilePanel: React.FC<{ onClose: () => void; onOpenAuth: () => void }> = ({ onClose, onOpenAuth }) => {
  const { player, user, cloudStatus, updateProfile, signOut } = usePlayer();
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(player.displayName);
  const [pickingAvatar, setPickingAvatar] = useState(false);
  const [historyLimit, setHistoryLimit] = useState(15);

  const { level, current, needed, pct } = levelProgress(player.xp);

  const totals = useMemo(() => {
    let played = 0, won = 0;
    for (const d of DIFFICULTIES) { played += player.stats[d].played; won += player.stats[d].won; }
    return { played, won, rate: played ? Math.round((won / played) * 100) : 0 };
  }, [player.stats]);

  const unlockedCount = ACHIEVEMENTS.filter(a => player.achievements[a.id]).length;

  const saveName = () => {
    const n = nameDraft.trim().slice(0, 24);
    if (n.length >= 2) updateProfile({ displayName: n });
    else setNameDraft(player.displayName);
    setEditingName(false);
  };

  const cloudBadge = (() => {
    switch (cloudStatus) {
      case "synced": return { icon: <Cloud size={13} />, text: "Синхронизировано", cls: "text-accent-2" };
      case "offline": return { icon: <CloudOff size={13} />, text: "Офлайн — синхронизируется позже", cls: "text-amber-500" };
      case "loading": return { icon: <RefreshCw size={13} className="animate-spin" />, text: "Загрузка…", cls: "text-muted" };
      case "error": return { icon: <CloudOff size={13} />, text: "Ошибка синхронизации", cls: "text-red-500" };
      default: return { icon: <CloudOff size={13} />, text: "Гость — прогресс в этом браузере", cls: "text-muted" };
    }
  })();

  return (
    <Sheet title="Профиль" onClose={onClose}>
      {/* Header card */}
      <Card className="text-center space-y-3 relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-accent/20 to-transparent pointer-events-none" />
        <button
          onClick={() => setPickingAvatar(v => !v)}
          className="relative mx-auto w-20 h-20 rounded-full bg-surface-2 ring-4 ring-accent/40 flex items-center justify-center text-4xl hover:scale-105 transition-transform"
          title="Сменить аватар"
        >
          {player.avatar}
          <span className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-accent text-accent-fg flex items-center justify-center ring-2 ring-surface">
            <Pencil size={12} />
          </span>
        </button>

        {pickingAvatar && (
          <div className="grid grid-cols-8 gap-1.5 p-2 rounded-xl bg-surface-2/60 animate-fade-in-up">
            {AVATARS.map(a => (
              <button
                key={a}
                onClick={() => { updateProfile({ avatar: a }); setPickingAvatar(false); }}
                className={`aspect-square rounded-lg text-xl flex items-center justify-center hover:bg-fg/10 transition ${
                  a === player.avatar ? "bg-accent/25 ring-1 ring-accent" : ""
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        )}

        {editingName ? (
          <div className="flex items-center gap-2 max-w-xs mx-auto">
            <input
              autoFocus
              value={nameDraft}
              maxLength={24}
              onChange={e => setNameDraft(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") saveName(); if (e.key === "Escape") setEditingName(false); }}
              className="flex-1 rounded-lg bg-surface-2 border border-line/60 px-3 py-1.5 text-center text-fg outline-none focus:ring-2 focus:ring-accent/60"
            />
            <button onClick={saveName} className="p-2 rounded-lg bg-accent text-accent-fg"><Check size={16} /></button>
          </div>
        ) : (
          <button onClick={() => { setNameDraft(player.displayName); setEditingName(true); }} className="group inline-flex items-center gap-1.5">
            <span className="text-xl font-bold text-fg">{player.displayName}</span>
            <Pencil size={13} className="text-muted opacity-0 group-hover:opacity-100 transition" />
          </button>
        )}

        <div className="text-sm text-muted">
          Уровень <span className="font-semibold text-accent">{level}</span> · {levelTitle(level)}
        </div>

        <div className="space-y-1.5 max-w-xs mx-auto">
          <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-accent to-accent-2 animate-xp-fill" style={{ width: `${pct}%` }} />
          </div>
          <div className="flex justify-between text-[11px] text-muted tabular-nums">
            <span>{player.xp} XP</span>
            <span>ещё {needed - current} XP до {level + 1} ур.</span>
          </div>
        </div>

        <div className={`flex items-center justify-center gap-1.5 text-[11px] ${cloudBadge.cls}`}>
          {cloudBadge.icon} {cloudBadge.text}
        </div>
        {user?.email && <div className="text-[11px] text-muted -mt-2">{user.email}</div>}

        {user ? (
          <button
            onClick={() => void signOut()}
            className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-red-500 transition px-3 py-1.5 rounded-lg hover:bg-red-500/10"
          >
            <LogOut size={14} /> Выйти из аккаунта
          </button>
        ) : (
          <button
            onClick={onOpenAuth}
            className="inline-flex items-center gap-2 text-sm font-semibold bg-accent text-accent-fg px-5 py-2.5 rounded-xl shadow-lg shadow-accent/25 hover:brightness-110 active:scale-[0.98] transition"
          >
            <LogIn size={16} /> Войти или зарегистрироваться
          </button>
        )}
      </Card>

      {/* Overview */}
      <div>
        <SectionTitle>Статистика</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <StatTile label="Сыграно" value={totals.played} />
          <StatTile label="Побед" value={totals.won} sub={`${totals.rate}% побед`} />
          <StatTile label="Серия сейчас" value={`🔥 ${player.currentStreak}`} />
          <StatTile label="Лучшая серия" value={player.bestStreak} />
        </div>
      </div>

      {/* Per difficulty */}
      <div>
        <SectionTitle>По сложности</SectionTitle>
        <Card className="p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-muted">
                <th className="text-left font-medium px-4 py-2.5">Уровень</th>
                <th className="font-medium px-2">Игры</th>
                <th className="font-medium px-2">Побед</th>
                <th className="font-medium px-2">Рекорд</th>
                <th className="font-medium px-3">Среднее</th>
              </tr>
            </thead>
            <tbody>
              {DIFFICULTIES.map(d => {
                const s = player.stats[d];
                return (
                  <tr key={d} className="border-t border-line/40 text-center tabular-nums">
                    <td className="text-left px-4 py-2.5 font-medium text-fg">{DIFFICULTY_LABELS[d]}</td>
                    <td className="text-muted">{s.played}</td>
                    <td className="text-muted">{s.won}</td>
                    <td className="text-accent font-semibold">{s.bestTime !== null ? formatTime(s.bestTime) : "—"}</td>
                    <td className="text-muted px-3">{s.won ? formatTime(Math.round(s.totalTime / s.won)) : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      </div>

      {/* Achievements */}
      <div>
        <SectionTitle right={<span className="text-[11px] text-muted tabular-nums">{unlockedCount}/{ACHIEVEMENTS.length}</span>}>
          Достижения
        </SectionTitle>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {ACHIEVEMENTS.map(a => {
            const at = player.achievements[a.id];
            return (
              <div
                key={a.id}
                title={a.description}
                className={`rounded-2xl border p-3 text-center transition ${
                  at ? "bg-surface border-accent/40 shadow-lg shadow-accent/5" : "bg-surface/50 border-line/40 opacity-50"
                }`}
              >
                <div className={`text-3xl ${at ? "" : "grayscale"}`}>{at ? a.icon : "🔒"}</div>
                <div className="text-[11px] font-semibold text-fg mt-1.5 leading-tight">{a.title}</div>
                <div className="text-[10px] text-muted mt-0.5 leading-tight">{a.description}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* History */}
      <div>
        <SectionTitle>История игр</SectionTitle>
        {player.history.length === 0 ? (
          <Card className="text-center text-sm text-muted py-8">Пока нет сыгранных партий. Самое время начать! 🧩</Card>
        ) : (
          <Card className="p-0 divide-y divide-line/40">
            {player.history.slice(0, historyLimit).map(g => (
              <div key={g.id} className="flex items-center gap-3 px-4 py-3">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                  g.won ? "bg-emerald-500/15 text-emerald-500" : "bg-red-500/15 text-red-500"
                }`}>
                  {g.won ? "✓" : "✕"}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-fg flex items-center gap-1.5">
                    {DIFFICULTY_LABELS[g.difficulty]}
                    {g.dailyDate && <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/15 text-accent">челлендж</span>}
                  </div>
                  <div className="text-[11px] text-muted">
                    {new Date(g.finishedAt).toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    {" · "}ошибок {g.mistakes}{g.hintsUsed ? ` · подсказок ${g.hintsUsed}` : ""}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-mono tabular-nums text-fg">{formatTime(g.time)}</div>
                  <div className="text-[11px] text-accent">+{g.xpGained} XP</div>
                </div>
              </div>
            ))}
            {player.history.length > historyLimit && (
              <button onClick={() => setHistoryLimit(l => l + 25)} className="w-full py-3 text-sm text-accent hover:bg-fg/5 transition">
                Показать ещё
              </button>
            )}
          </Card>
        )}
      </div>
    </Sheet>
  );
};
