# Инструкция: Подключение Firebase к Судоку 🚀

Приложение полностью работает и без Firebase (в гостевом режиме все данные сохраняются в браузере).
Когда вы подключите Firebase, игроки смогут:
1. Регистрироваться и входить по Email/паролю или через Google.
2. Сохранять прогресс в облаке и играть с разных устройств.
3. Соревноваться в глобальной таблице лидеров по опыту (XP) и времени в ежедневном челлендже.

---

## Шаг 1. Создание проекта в Firebase (3 минуты)

1. Откройте [Firebase Console](https://console.firebase.google.com/) и войдите в свой Google-аккаунт.
2. Нажмите **«Создать проект»** (или «Add project»).
3. Введите название, например: `sudoku-app`.
4. Google Analytics можно выключить (или оставить по желанию) и нажмите **«Создать проект»**.

---

## Шаг 2. Включение способов входа (Authentication)

1. В левом меню выберите **Build** → **Authentication** (Аутентификация).
2. Нажмите кнопку **«Начать»** (Get started).
3. Во вкладке **Sign-in method** включите два провайдера:
   - **Email/Password** → включите первый переключатель (Email/Password) и нажмите «Сохранить».
   - **Google** → включите переключатель, выберите ваш email поддержки и нажмите «Сохранить».
4. Перейдите во вкладку **Settings** внутри Authentication → **Authorized domains** (Авторизованные домены):
   - Убедитесь, что там есть `localhost`.
   - Нажмите **Add domain** и добавьте домен вашего GitHub Pages: `appmissia.github.io`.

---

## Шаг 3. Включение базы данных (Cloud Firestore)

1. В левом меню выберите **Build** → **Firestore Database**.
2. Нажмите **«Создать базу данных»** (Create database).
3. Выберите регион (например, `eur3 (europe-west)` или `nam5 (us-central)`).
4. Выберите режим: **Start in production mode** (В рабочей среде) и нажмите «Создать».
5. Перейдите во вкладку **Rules** (Правила) вверху и вставьте правила из файла `firestore.rules`:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
       match /leaderboard/{userId} {
         allow read: if true;
         allow write: if request.auth != null && request.auth.uid == userId;
       }
       match /daily/{dateKey}/scores/{userId} {
         allow read: if true;
         allow write: if request.auth != null && request.auth.uid == userId;
       }
     }
   }
   ```
6. Нажмите кнопку **«Опубликовать»** (Publish).

---

## Шаг 4. Получение ключей приложения

1. Нажмите на значок ⚙️ (Шестерёнка) рядом с надписью «Project Overview» вверху слева → **Project settings** (Настройки проекта).
2. Прокрутите страницу вниз до раздела «Your apps» (Ваши приложения).
3. Нажмите на круглую иконку **Web `</>`** (веб-приложение).
4. Введите название (например, `Sudoku Web`) и нажмите **«Зарегистрировать приложение»** (Firebase Hosting настраивать не нужно).
5. Вы увидите блок `const firebaseConfig = { ... }` с вашими ключами:
   ```javascript
   apiKey: "AIzaSy...",
   authDomain: "sudoku-app.firebaseapp.com",
   projectId: "sudoku-app",
   storageBucket: "sudoku-app.firebasestorage.app",
   messagingSenderId: "1234567890",
   appId: "1:1234567890:web:abcdef..."
   ```

---

## Шаг 5. Подключение ключей к сайту

### Вариант А: Для GitHub Pages (сайт в интернете)
Чтобы сайт на GitHub Pages автоматически собрался с вашими ключами:
1. Откройте ваш репозиторий на GitHub: `https://github.com/AppMissia/sudoku`
2. Перейдите в **Settings** → слева **Secrets and variables** → **Actions**.
3. Нажмите **«New repository secret»** и добавьте 6 секретов:
   - Имя: `VITE_FIREBASE_API_KEY`, Значение: ваш `apiKey`
   - Имя: `VITE_FIREBASE_AUTH_DOMAIN`, Значение: ваш `authDomain`
   - Имя: `VITE_FIREBASE_PROJECT_ID`, Значение: ваш `projectId`
   - Имя: `VITE_FIREBASE_STORAGE_BUCKET`, Значение: ваш `storageBucket`
   - Имя: `VITE_FIREBASE_MESSAGING_SENDER_ID`, Значение: ваш `messagingSenderId`
   - Имя: `VITE_FIREBASE_APP_ID`, Значение: ваш `appId`

### Вариант Б: Для локальной разработки на компьютере
В папке проекта создайте файл `.env.local` и вставьте:
```env
VITE_FIREBASE_API_KEY=ваш_apiKey
VITE_FIREBASE_AUTH_DOMAIN=ваш_authDomain
VITE_FIREBASE_PROJECT_ID=ваш_projectId
VITE_FIREBASE_STORAGE_BUCKET=ваш_storageBucket
VITE_FIREBASE_MESSAGING_SENDER_ID=ваш_messagingSenderId
VITE_FIREBASE_APP_ID=ваш_appId
```
Перезапустите локальный сервер (`npm run dev`), и в приложении сразу активируется статус «Облако подключено».
