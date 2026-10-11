// src/components/panels/LeaderboardPanel.tsx
import React, { useEffect, useState } from "react";
import { Trophy, Calendar, Medal, Loader2, CloudOff } from "lucide-react";
import { Sheet, Card } from "../Sheet";
import { fetchTopPlayers, fetchDailyTop, LeaderEntry, DailyEntry } from "../../services/leaderboard";
import { isFirebaseConfigured } from "../../services/firebase";
import { formatTime, levelTitle } from "../../services/progression";
import { toDateKey } from "../../utils/sudokuEngine";
import { usePlayer } from "../../context/PlayerContext";

type Tab = "allTime" | "daily";

export const LeaderboardPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [tab, setTab] = useState<Tab>("allTime");
  const [loading, setLoading] = useState(true);
  const [allTimeList, setAllTimeList] = useState<LeaderEntry[]>([]);
  const [dailyList, setDailyList] = useState<DailyEntry[]>([]);
  const { user } = usePlayer();
  const todayKey = toDateKey();

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);

    if (tab === "allTime") {
      fetchTopPlayers(50)
        .then(data => {
          if (isMounted) {
            setAllTimeList(data);
            setLoading(false);
          }
        })
        .catch(() => {
          if (isMounted) setLoading(false);
        });
    } else {
      fetchDailyTop(todayKey, 50)
        .then(data => {
          if (isMounted) {
            setDailyList(data);
            setLoading(false);
          }
        })
        .catch(() => {
          if (isMounted) setLoading(false);
        });
    }

    return () => {
      isMounted = false;
    };
  }, [tab, todayKey]);

  return (
    <Sheet title="Таблица лидеров" onClose={onClose}>
      {/* Tabs */}
      <div className="grid grid-cols-2 p-1 rounded-xl bg-surface-2/60">
        <button
          onClick={() => setTab("allTime")}
          className={`py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 transition-all ${
            tab === "allTime" ? "bg-surface text-fg shadow" : "text-muted hover:text-fg"
          }`}
        >
          <Trophy size={16} /> Общий зачёт
        </button>
        <button
          onClick={() => setTab("daily")}
          className={`py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 transition-all ${
            tab === "daily" ? "bg-surface text-fg shadow" : "text-muted hover:text-fg"
          }`}
        >
          <Calendar size={16} /> Челлендж дня
        </button>
      </div>

      {!isFirebaseConfigured ? (
        <Card className="text-center py-10 space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-accent/15 flex items-center justify-center text-accent">
            <CloudOff size={24} />
          </div>
          <h3 className="font-semibold text-fg">Облако не настроено</h3>
          <p className="text-xs text-muted max-w-xs mx-auto">
            Для глобальной таблицы лидеров требуется подключение к Firebase. Подключите Firebase по инструкции, чтобы соревноваться с другими игроками!
          </p>
        </Card>
      ) : loading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-2 text-muted">
          <Loader2 size={24} className="animate-spin text-accent" />
          <span className="text-xs">Загрузка рейтинга…</span>
        </div>
      ) : tab === "allTime" ? (
        allTimeList.length === 0 ? (
          <Card className="text-center py-10 text-sm text-muted">
            Пока нет результатов. Будьте первым, кто сыграет партию в облаке!
          </Card>
        ) : (
          <Card className="p-0 divide-y divide-line/40 overflow-hidden">
            {allTimeList.map((entry, idx) => {
              const isCurrentUser = user && user.uid === entry.uid;
              return (
                <div
                  key={entry.uid}
                  className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                    isCurrentUser ? "bg-accent/10" : ""
                  }`}
                >
                  <div className="w-7 text-center font-bold text-sm">
                    {idx === 0 ? (
                      <span className="text-amber-400">🥇</span>
                    ) : idx === 1 ? (
                      <span className="text-slate-300">🥈</span>
                    ) : idx === 2 ? (
                      <span className="text-amber-600">🥉</span>
                    ) : (
                      <span className="text-muted tabular-nums">{idx + 1}</span>
                    )}
                  </div>
                  <div className="w-9 h-9 rounded-full bg-surface-2 flex items-center justify-center text-xl">
                    {entry.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-fg truncate flex items-center gap-1.5">
                      <span>{entry.displayName}</span>
                      {isCurrentUser && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-accent text-accent-fg font-bold">Вы</span>
                      )}
                    </div>
                    <div className="text-[11px] text-muted">
                      Ур. {entry.level} · {levelTitle(entry.level)} · {entry.wins} побед
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-accent tabular-nums">{entry.xp} XP</div>
                  </div>
                </div>
              );
            })}
          </Card>
        )
      ) : dailyList.length === 0 ? (
        <Card className="text-center py-10 text-sm text-muted">
          Сегодня этот челлендж ещё никто не прошёл. Будьте первыми в списке лидеров дня!
        </Card>
      ) : (
        <Card className="p-0 divide-y divide-line/40 overflow-hidden">
          {dailyList.map((entry, idx) => {
            const isCurrentUser = user && user.uid === entry.uid;
            return (
              <div
                key={entry.uid}
                className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                  isCurrentUser ? "bg-accent/10" : ""
                }`}
              >
                <div className="w-7 text-center font-bold text-sm">
                  {idx === 0 ? (
                    <span className="text-amber-400">🥇</span>
                  ) : idx === 1 ? (
                    <span className="text-slate-300">🥈</span>
                  ) : idx === 2 ? (
                    <span className="text-amber-600">🥉</span>
                  ) : (
                    <span className="text-muted tabular-nums">{idx + 1}</span>
                  )}
                </div>
                <div className="w-9 h-9 rounded-full bg-surface-2 flex items-center justify-center text-xl">
                  {entry.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-fg truncate flex items-center gap-1.5">
                    <span>{entry.displayName}</span>
                    {isCurrentUser && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-accent text-accent-fg font-bold">Вы</span>
                    )}
                  </div>
                  <div className="text-[11px] text-muted">
                    Ошибок: {entry.mistakes}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-mono font-bold text-fg tabular-nums">{formatTime(entry.time)}</div>
                </div>
              </div>
            );
          })}
        </Card>
      )}
    </Sheet>
  );
};
