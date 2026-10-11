// src/components/panels/AuthPanel.tsx
import React, { useState } from "react";
import { Cloud, Loader2, Lock, Mail, User as UserIcon } from "lucide-react";
import { Sheet, Card } from "../Sheet";
import { isFirebaseConfigured } from "../../services/firebase";
import {
  authErrorMessage,
  loginWithEmail,
  loginWithGoogle,
  registerWithEmail,
  resetPassword,
} from "../../services/auth";

type Mode = "login" | "register" | "reset";

const Field: React.FC<{
  icon: React.ReactNode;
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
}> = ({ icon, type, placeholder, value, onChange, autoComplete }) => (
  <label className="flex items-center gap-3 rounded-xl bg-surface-2/60 border border-line/50 px-3.5 py-3 focus-within:ring-2 focus-within:ring-accent/60 transition">
    <span className="text-muted">{icon}</span>
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      autoComplete={autoComplete}
      onChange={e => onChange(e.target.value)}
      className="flex-1 bg-transparent outline-none text-sm text-fg placeholder:text-muted/70"
    />
  </label>
);

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.5 2.4-7.2 2.4-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
  </svg>
);

export const AuthPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const run = async (fn: () => Promise<void>, closeAfter = true) => {
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      await fn();
      if (closeAfter) onClose();
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "register") {
      if (name.trim().length < 2) { setError("Имя должно быть не короче 2 символов."); return; }
      if (password.length < 6) { setError("Пароль — минимум 6 символов."); return; }
      void run(() => registerWithEmail(name, email, password));
    } else if (mode === "login") {
      void run(() => loginWithEmail(email, password));
    } else {
      void run(async () => {
        await resetPassword(email);
        setInfo("Письмо для сброса пароля отправлено. Проверьте почту (и папку «Спам»).");
      }, false);
    }
  };

  const title = mode === "login" ? "Вход" : mode === "register" ? "Регистрация" : "Сброс пароля";

  return (
    <Sheet title={title} onClose={onClose}>
      <div className="text-center space-y-2 pt-2">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-accent/15 flex items-center justify-center">
          <Cloud size={30} className="text-accent" />
        </div>
        <p className="text-sm text-muted max-w-xs mx-auto">
          Аккаунт сохраняет статистику, уровень и достижения в облаке и синхронизирует их между устройствами.
        </p>
      </div>

      {!isFirebaseConfigured ? (
        <Card className="text-sm text-muted space-y-2">
          <p className="font-semibold text-fg">Облако пока не подключено</p>
          <p>
            Владелец сайта ещё не добавил ключи Firebase. Сейчас весь прогресс сохраняется в этом браузере —
            играть можно без ограничений.
          </p>
        </Card>
      ) : (
        <>
          {mode !== "reset" && (
            <div className="grid grid-cols-2 p-1 rounded-xl bg-surface-2/60">
              {(["login", "register"] as const).map(m => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setError(null); setInfo(null); }}
                  className={`py-2 rounded-lg text-sm font-medium transition-all ${
                    mode === m ? "bg-surface text-fg shadow" : "text-muted hover:text-fg"
                  }`}
                >
                  {m === "login" ? "Вход" : "Регистрация"}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={submit} className="space-y-3">
            {mode === "register" && (
              <Field icon={<UserIcon size={18} />} type="text" placeholder="Имя игрока" value={name} onChange={setName} autoComplete="nickname" />
            )}
            <Field icon={<Mail size={18} />} type="email" placeholder="Email" value={email} onChange={setEmail} autoComplete="email" />
            {mode !== "reset" && (
              <Field
                icon={<Lock size={18} />}
                type="password"
                placeholder="Пароль"
                value={password}
                onChange={setPassword}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
              />
            )}

            {error && <p className="text-sm text-red-500 px-1">{error}</p>}
            {info && <p className="text-sm text-accent-2 px-1">{info}</p>}

            <button
              type="submit"
              disabled={busy}
              className="w-full py-3 rounded-xl bg-accent text-accent-fg font-semibold text-sm shadow-lg shadow-accent/25 hover:brightness-110 active:scale-[0.98] transition disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {busy && <Loader2 size={16} className="animate-spin" />}
              {mode === "login" ? "Войти" : mode === "register" ? "Создать аккаунт" : "Отправить письмо"}
            </button>
          </form>

          <div className="flex justify-between text-xs px-1">
            {mode === "reset" ? (
              <button onClick={() => { setMode("login"); setError(null); setInfo(null); }} className="text-accent hover:underline">
                ← Назад ко входу
              </button>
            ) : (
              <button onClick={() => { setMode("reset"); setError(null); setInfo(null); }} className="text-muted hover:text-fg">
                Забыли пароль?
              </button>
            )}
          </div>

          {mode !== "reset" && (
            <>
              <div className="flex items-center gap-3 text-xs text-muted">
                <div className="h-px flex-1 bg-line/60" /> или <div className="h-px flex-1 bg-line/60" />
              </div>
              <button
                onClick={() => void run(loginWithGoogle)}
                disabled={busy}
                className="w-full py-3 rounded-xl bg-surface border border-line/60 text-fg font-medium text-sm hover:bg-fg/5 active:scale-[0.98] transition flex items-center justify-center gap-2.5 disabled:opacity-60"
              >
                <GoogleIcon /> Войти через Google
              </button>
            </>
          )}

          <p className="text-[11px] text-muted text-center">
            Ваш гостевой прогресс автоматически перенесётся в аккаунт.
          </p>
        </>
      )}
    </Sheet>
  );
};
