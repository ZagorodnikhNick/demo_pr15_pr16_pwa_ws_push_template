# Практики 15–16 — PWA: App Shell + WebSocket + Push Notifications (шаблон)

Это учебная заготовка для практик **15–16**.

**База:** практики **13–14** (PWA + Service Worker + Cache API).  
**Новое в 15–16:** **App Shell**, **HTTPS (обязательно для SW/Push)**, **WebSocket (Socket.IO)**, **Web Push (VAPID)**.

> Важно: это НЕ готовое решение. В проекте оставлены **TODO для студентов**.

---

## 1) Что внутри

Корень проекта (клиент — обычный HTML+JS):

- `index.html`, `styles.css`, `app.js` — клиент
- `manifest.json` — PWA манифест
- `sw.js` — service worker (кэш, офлайн, push)
- `assets/` — статика (иконки/картинки)
- `content/` — фрагменты HTML для App Shell (подгружаются через `fetch()`)

Сервер:

- `server/` — Node.js сервер
  - раздаёт статику (корень проекта + `content/*`)
  - поднимает HTTPS
  - WebSocket (Socket.IO)
  - API для Push: подписка + тестовая отправка

### Зачем папка `content/`?

Это сделано специально под практику 15:

- **App Shell** = “оболочка” (index.html) + подмена “контента” **без перезагрузки**
- удобно отдельно кэшировать `/content/*` (можно сделать Network First)

---

## 2) Запуск (Windows / Linux / macOS) — коротко

В проекте НЕТ Vite/React. Клиент — **обычный HTML+JS**.
Запуск идёт **только через сервер**.

1. Установить зависимости:

```bash
cd server
npm i

	2.	Создать HTTPS сертификаты (ОБЯЗАТЕЛЬНО) → server/certs/*
	3.	(Для Push) создать .env с VAPID ключами
	4.	Запустить:

npm run dev

Открыть:
	•	https://localhost:3443

⸻

3) Шаг 1 — HTTPS сертификаты (ОБЯЗАТЕЛЬНО)


3.1 Вариант A (рекомендуется): mkcert

macOS

brew install mkcert nss
mkcert -install
cd server
mkcert -key-file certs/localhost-key.pem -cert-file certs/localhost-cert.pem localhost 127.0.0.1 ::1

Windows
Варианты установки:
	•	Chocolatey: choco install mkcert
	•	Scoop: scoop install mkcert

Далее в терминале (PowerShell/Git Bash):

mkcert -install
cd server
mkdir certs
mkcert -key-file certs/localhost-key.pem -cert-file certs/localhost-cert.pem localhost 127.0.0.1 ::1

Linux
Установите mkcert (пакетом или бинарником), затем:

mkcert -install
cd server
mkdir -p certs
mkcert -key-file certs/localhost-key.pem -cert-file certs/localhost-cert.pem localhost 127.0.0.1 ::1


⸻

3.2 Вариант B (если mkcert недоступен): OpenSSL

macOS / Linux

cd server
mkdir -p certs
rm -f certs/localhost-key.pem certs/localhost-cert.pem

openssl req -x509 -newkey rsa:2048 -nodes \
  -keyout certs/localhost-key.pem \
  -out certs/localhost-cert.pem \
  -days 365 \
  -subj "/CN=localhost"

Windows
Самый простой путь:
	•	Git Bash (если стоит Git) + OpenSSL
	•	либо установить OpenSSL отдельно

⸻

4) Шаг 2 — Push (VAPID) — настройка (можно сделать позже)

Push требует VAPID ключи. Без них сервер запустится, но будет писать:
	•	VAPID keys are missing... (это нормально, push просто отключён)

4.1 Сгенерировать VAPID ключи

В папке server:

cd server
npm run vapid

Скопируйте вывод: publicKey и privateKey.

4.2 Создать server/.env

Файл должен лежать именно тут:
	•	server/.env

Вариант 1 (ручной):
	•	создайте файл server/.env
	•	вставьте:

PORT=3443
VAPID_SUBJECT=mailto:teacher@example.com
VAPID_PUBLIC_KEY=ВАШ_PUBLIC_KEY
VAPID_PRIVATE_KEY=ВАШ_PRIVATE_KEY

Вариант 2 (создать шаблон командой):

cd server
cat > .env << 'EOF'
PORT=3443
VAPID_SUBJECT=mailto:teacher@example.com
VAPID_PUBLIC_KEY=PASTE_PUBLIC_KEY_HERE
VAPID_PRIVATE_KEY=PASTE_PRIVATE_KEY_HERE
EOF

Потом замените значения на реальные.

⸻

5) Запуск сервера

В папке server:

npm run dev

Откройте в браузере:
	•	https://localhost:3443

Если браузер ругается на сертификат:
	•	для OpenSSL это нормально → подтвердите исключение
	•	для mkcert обычно предупреждений нет после mkcert -install

Проверка здоровья:
	•	https://localhost:3443/api/health

⸻

6) Что уже реализовано в шаблоне

Практика 15 (App Shell + офлайн)

Есть:
	•	Service Worker (sw.js) с базовой логикой кэша
	•	Клиент грузит контент из content/*.html через fetch() без перезагрузки

TODO студентам (ПР15):
	•	сделать стратегию кэширования именно для content/* (например Network First)
	•	офлайн fallback для контента (content/offline.html)
	•	показать в DevTools lifecycle SW и почему контент может “залипать”

⸻

Практика 16 (WebSocket + Push)

Есть:
	•	HTTPS сервер
	•	Socket.IO сервер (WS)
	•	Endpoints для push (подписка и тестовая отправка)

TODO студентам (ПР16):
	•	подключить Socket.IO клиент и обновлять UI задач без F5
	•	реализовать подписку на push:
	•	запрос разрешения
	•	pushManager.subscribe()
	•	отправка подписки на сервер
	•	кнопка “Send test push” (сервер рассылает всем подпискам)

⸻

7) Минимум к сдаче

ПР15
	1.	После первой загрузки онлайн — приложение открывается офлайн (App Shell).
	2.	Контент подменяется без перезагрузки + есть офлайн fallback.
	3.	Демонстрация DevTools: SW install/activate/fetch.

ПР16
	1.	WebSocket: задача создана в одном окне → во втором обновилась без F5.
	2.	Push: подписка создана, сервер её хранит, тестовый push приходит.

⸻

8) Частые ошибки

PEM routines::no start line

Файлы сертификатов пустые или не PEM. Проверьте шаг 3.4.

[PUSH] Not configured: VAPID keys are missing

Нет .env или ключей. Push отключён, остальное работает.

⸻

```
