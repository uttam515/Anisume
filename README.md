# Anisume — Anime Discovery Platform

Anisume is an anime discovery and recommendation platform built with React, Vite, Tailwind CSS, Express, TypeScript, and MongoDB.

Combining the rich browsing experience of AniList with the cinematic presentation of modern streaming platforms, Anisume provides a dark-first discovery experience across 12,900+ anime series and movies.

---

## Features (Phase 1: Anime Discovery Website)

- **Cinematic Dark-First UI**: Deep charcoal canvas (`#08090D`), violet/brand accents (`#8B5CF6`), smooth hover transitions, and zero-layout-shift skeleton loaders.
- **Global Responsive Navigation**: Sticky navbar with active indicators, live search modal shortcut, and mobile drawer.
- **Cinematic Homepage**:
  - Rotating Hero Carousel featuring top-rated anime with backdrop art, scores, synopsis, and direct navigation.
  - Trending TV Anime section sorted by MAL popularity and member metrics.
  - Interactive "Browse by Genre" collection cards with real-time catalog counts.
  - Top Rated Anime showcase (score >= 8.0).
  - Popular Anime Movies carousel.
  - Recently Released series grid.
- **Advanced Discover Engine (`/discover`)**:
  - Live filtering by format (TV Series vs Movies).
  - Multi-genre selection with logical conjunction (e.g. Action + Fantasy).
  - Minimum rating threshold slider/buttons (7.0+, 8.0+, 8.5+).
  - Release year filter.
  - Airing status filter (Finished Airing, Currently Airing, Upcoming).
  - Multi-criterion sorting (Popularity, Highest Rated, Newest, Title A-Z).
  - Responsive pagination and seamless URL search param synchronization.
- **Dedicated Movies Page (`/movies`)**: Direct pre-filtered discovery portal for anime movies.
- **Instant Search (`/search`)**:
  - Searches across English titles, Romaji canonical titles, Japanese titles, and synonyms.
  - Debounced input (350ms) with keyboard shortcuts and type filters.
- **Anime Detail View (`/anime/:mal_id`)**:
  - Full-width backdrop banner, high-res poster, rating badges, MAL score rank & popularity.
  - Complete metadata sidebar (episodes, duration, season/year, status, rating, broadcast).
  - Clickable studio badges and genre/theme tags linked directly to filtered discover queries.
  - Embedded YouTube trailer video player.
  - Related anime recommendations / sequel resolution.

---

## Monorepo Architecture

```
anisume/
├── apps/
│   ├── api/                   # Express backend API & Mongoose models
│   │   ├── src/
│   │   │   ├── config/        # Mongoose database connection manager
│   │   │   ├── models/        # Anime Mongoose schema, compound & text indexes
│   │   │   ├── routes/        # Catalog, discovery, detail, and health endpoints
│   │   │   ├── app.ts         # Express application configuration
│   │   │   └── index.ts       # Server entry point (Port 4000)
│   │   └── package.json
│   └── web/                   # React + Vite + Tailwind CSS frontend
│       ├── src/
│       │   ├── api/           # Typed API client
│       │   ├── components/    # Reusable UI (Navbar, Footer, AnimeCard, Hero, Skeletons)
│       │   ├── pages/         # HomePage, DiscoverPage, SearchPage, AnimeDetailPage
│       │   ├── App.tsx        # Router configuration & layout
│       │   └── index.css      # Dark theme & custom scrollbars
│       ├── vite.config.ts     # Dev server (Port 3000) with /api proxy
│       └── package.json
├── packages/
│   └── shared/                # Shared TypeScript types, schemas, and enums
│       ├── src/
│       │   ├── types/anime.ts # Normalized Anime domain types
│       │   └── index.ts
│       └── package.json
├── scripts/                   # Data ingestion, enrichment, and verification suites
│   ├── import-anime.ts        # Fault-tolerant Jikan API ingestion engine
│   ├── enrich-anime.ts        # Detail enrichment pipeline for top titles
│   ├── verify-phase1.ts       # Automated 16-point test verification suite
│   └── verify-db-connection.ts
├── .env.example               # Environment variables template
├── package.json               # Root scripts and workspace dev tooling
├── pnpm-workspace.yaml        # Workspace configuration
└── tsconfig.base.json         # Base TypeScript strict config
```

---

## Technology Stack

- **Frontend**: React 18, React Router v7, Vite, TypeScript, Tailwind CSS, Lucide Icons
- **Backend**: Node.js (>=20), Express.js, TypeScript, Mongoose 8
- **Database**: MongoDB Atlas (`anisume` database)
- **Tooling**: pnpm workspaces, ESLint, Prettier, tsx

---

## Getting Started

### 1. Prerequisites

- Node.js >= 20.x
- pnpm >= 9.x
- MongoDB Atlas cluster URI

### 2. Environment Setup

Create `.env` in the project root:

```bash
cp .env.example .env
```

Ensure your `.env` contains:
```env
MONGODB_URI=mongodb+srv://Animatch:<PASSWORD>@cluster0.fucarun.mongodb.net/anisume?retryWrites=true&w=majority
PORT=4000
NODE_ENV=development
```

### 3. Install Dependencies

```bash
pnpm install
```

### 4. Running the Development Servers

Run both the API and Web applications concurrently:

```bash
pnpm dev
```

Or run them individually:
- **Backend API**: `pnpm dev:api` (available at `http://localhost:4000`)
- **Frontend App**: `pnpm dev:web` (available at `http://localhost:3000`)

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check and database connection status |
| `GET` | `/api/anime/featured` | Top-rated anime with backdrop art for hero slider |
| `GET` | `/api/anime/trending` | Top TV anime sorted by popularity/members |
| `GET` | `/api/anime/top-rated` | Highest-rated anime (score >= 8.0) |
| `GET` | `/api/anime/recent` | Recent releases sorted by release year |
| `GET` | `/api/anime/movies` | Popular anime movies |
| `GET` | `/api/anime/genres` | Aggregated list of genres with title counts |
| `GET` | `/api/anime` | Paginated search & filtering (`q`, `type`, `genres`, `minScore`, `year`, `status`, `sort`, `page`, `limit`) |
| `GET` | `/api/anime/:mal_id` | Complete anime detail record with resolved related anime |

---

## Running Verification & Quality Checks

```bash
# Run TypeScript check across all packages
pnpm typecheck

# Run ESLint across monorepo
pnpm lint

# Build production bundles
pnpm build

# Run automated Phase 1 end-to-end verification suite
npx tsx scripts/verify-phase1.ts
```
