# Anisume (アニメの宇宙)

> A modern, full-stack anime discovery and recommendation platform blending deep sensory matching with a traditional Japanese-inspired cinematic dark aesthetic.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61dafb.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6-646cff.svg)](https://vitejs.dev/)
[![Express](https://img.shields.io/badge/Express-4-green.svg)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose%208-47A248.svg)](https://www.mongodb.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8.svg)](https://tailwindcss.com/)

---

## ✨ Highlights

- **🧠 Taste-Matching Recommendation Engine**: 4-step interactive questionnaire analyzing sensory preferences, pacing, mood, and themes to recommend curated anime.
- **📚 Library & Episode Tracker**: Personal library management with watch statuses (*Watching*, *Completed*, *Plan to Watch*, *On Hold*, *Dropped*), episode steppers, and 10-star rating system.
- **🔍 12,900+ Title Catalog**: Instant search across English, Romaji, and Japanese titles with advanced filters (genre combinations, score thresholds, format, airing year).
- **🌸 Japanese Dark Aesthetics**: Sumi-ink canvas (`#0D100F`), Torii gate emblem, 60fps cherry blossom petal canvas, and responsive cinematic artwork cards.
- **🔐 Secure Authentication**: JWT session management, email verification tokens, secure password reset, and user profile management.
- **📑 Custom Lists**: Create, curate, and share custom public or private anime collections.

---

## 🏗️ Architecture

```
anisume/
├── apps/
│   ├── api/             # Express.js REST API with Mongoose 8
│   │   └── src/         # Auth, library, recommendations, anime routes & models
│   └── web/             # React 18 + Vite frontend with Tailwind CSS
│       └── src/         # Pages, components, hooks, and API client
├── packages/
│   └── shared/          # Shared TypeScript models, enums, and schemas
└── posters/             # High-resolution artwork assets
```

---

## 🚀 Quickstart

### Prerequisites
- **Node.js** >= 20.x
- **pnpm** >= 9.x
- **MongoDB Atlas** or local MongoDB instance

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Configure Environment
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Ensure `.env` contains:
```env
MONGODB_URI=mongodb+srv://<USER>:<PASSWORD>@<CLUSTER>.mongodb.net/anisume?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key
PORT=4000
NODE_ENV=development
```

### 3. Run Development Servers
```bash
# Start both API (port 4000) and Web (port 3000) concurrently
pnpm dev

# Or run separately
pnpm dev:api
pnpm dev:web
```

---

## 🛠️ Verification & Build

```bash
# Typecheck across all workspace packages
pnpm typecheck

# Lint codebase
pnpm lint

# Production build
pnpm build
```

---

## 📡 Core API Routes

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Service health & database connectivity |
| `GET` | `/api/anime` | Paginated search & multi-genre filtering |
| `GET` | `/api/anime/:mal_id` | Anime detail view & related titles |
| `POST` | `/api/recommendations/match` | Sensory questionnaire recommendation engine |
| `POST` | `/api/auth/register` | User signup with email validation |
| `POST` | `/api/auth/login` | Secure session authentication |
| `GET` / `PUT` | `/api/library` | User personal watch list & episode tracking |
| `GET` / `POST` | `/api/custom-lists` | Custom user-curated anime collections |

---

## 📄 License

MIT
