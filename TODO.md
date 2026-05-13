# Catfishify — Implementation Roadmap

TDD throughout: write a failing test first, then make it pass.

---

## Phase 1 — Scaffolding

- [x] Init backend (`uv`, FastAPI, SQLAlchemy, Alembic, pytest, httpx) and frontend (`vite react-ts`, `react-router-dom`)
- [x] Configure Vite proxy (`/api` → `localhost:8000`), CORS, `.env.example`
- [x] Scaffold directory structure matching README: routers, services, pages, components
- [x] Verify both dev servers start cleanly

---

## Phase 2 — Backend: Data & Wikipedia

- [x] `Puzzle` and `Result` SQLAlchemy models, initial Alembic migration
- [x] `generate_short_id()` utility (base62, 8 chars, collision-safe) with tests
- [x] Wikipedia service: `search_articles`, `fetch_categories` (strip hidden + eponymous), `fetch_alt_titles` — all tested with mocked HTTP
- [x] Answer checker: `normalize` (lowercase, accent strip, bracket removal) + `check_answer` with Levenshtein-1 tolerance — fully unit tested

---

## Phase 3 — Backend: API Endpoints

- [x] `POST /api/puzzles`, `GET /api/puzzles` (ordered by completions), `GET /api/puzzles/{short_id}` (titles redacted) — all with TestClient tests
- [x] `POST /api/puzzles/{short_id}/results`, `GET /api/puzzles/{short_id}/leaderboard` (score desc, time asc) — with TestClient tests
- [x] `GET /api/wikipedia/search`, `GET /api/wikipedia/article` — thin router wrappers over the service layer, with tests

---

## Phase 4 — Frontend: Create & Play

- [ ] Typed API client (`src/api.ts`) and shared TypeScript types; minimal CSS reset
- [ ] Home page: fetch and list puzzles with completion counts
- [ ] Create Puzzle page: title/description inputs, size picker, Wikipedia search + category preview, article slot management, submit → redirect
- [ ] Play Puzzle page: category display, guess/skip/half-point flow, localStorage progress resume, end screen with score + emoji string + nickname entry + result submission

---

## Phase 5 — Leaderboard, Polish & Deploy

- [ ] Leaderboard page: ranked table, highlight current nickname, linked from end screen and home
- [ ] Share button: copies formatted share text to clipboard
- [ ] 404 handling for unknown `short_id`; basic loading/error states throughout
- [ ] FastAPI serves compiled React build from `/`; Alembic runs on startup
- [ ] `railway.toml`, deploy to Railway, smoke test the full flow
