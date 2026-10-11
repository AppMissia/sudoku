// src/services/auth.ts
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
  signOut as fbSignOut,
  updateProfile,
} from "firebase/auth";
import { auth, googleProvider } from "./firebase";

export const PENDING_NAME_KEY = "zen_sudoku_pending_name";

const requireAuth = () => {
  if (!auth) throw new Error("cloud-disabled");
  return auth;
};

export async function registerWithEmail(name: string, email: string, password: string): Promise<void> {
  const a = requireAuth();
  localStorage.setItem(PENDING_NAME_KEY, name.trim());
  const cred = await createUserWithEmailAndPassword(a, email.trim(), password);
  await updateProfile(cred.user, { displayName: name.trim() });
}

export async function loginWithEmail(email: string, password: string): Promise<void> {
  await signInWithEmailAndPassword(requireAuth(), email.trim(), password);
}

export async function loginWithGoogle(): Promise<void> {
  await signInWithPopup(requireAuth(), googleProvider);
}

export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(requireAuth(), email.trim());
}

export async function signOut(): Promise<void> {
  if (auth) await fbSignOut(auth);
}

/** Firebase error code → human readable Russian message */
export function authErrorMessage(err: unknown): string {
  const code = typeof err === "object" && err && "code" in err ? String((err as { code: unknown }).code) : "";
  const msg = err instanceof Error ? err.message : "";
  if (msg === "cloud-disabled") return "Облако не настроено. Играйте в гостевом режиме.";
  switch (code) {
    case "auth/invalid-email": return "Некорректный email.";
    case "auth/missing-password": return "Введите пароль.";
    case "auth/weak-password": return "Пароль слишком простой — минимум 6 символов.";
    case "auth/email-already-in-use": return "Этот email уже зарегистрирован. Попробуйте войти.";
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found": return "Неверный email или пароль.";
    case "auth/too-many-requests": return "Слишком много попыток. Подождите немного.";
    case "auth/network-request-failed": return "Нет соединения с интернетом.";
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request": return "Окно входа было закрыто.";
    case "auth/popup-blocked": return "Браузер заблокировал всплывающее окно. Разрешите его и повторите.";
    case "auth/unauthorized-domain": return "Этот домен не добавлен в Firebase (Authentication → Settings → Authorized domains).";
    case "auth/operation-not-allowed": return "Этот способ входа не включён в Firebase Console.";
    default: return "Что-то пошло не так. Попробуйте ещё раз.";
  }
}
