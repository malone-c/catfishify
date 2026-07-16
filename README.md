# Catfishify 🐈

Guess the Wikipedia article from its categories. Create custom puzzles, share links with friends, and compete on leaderboards. Inspired by [catfishing.net](https://catfishing.net).

Live at [catfishify.cmal.one](https://catfishify.cmal.one).

The home page lists all puzzles ordered by popularity (number of completions).

Catfishify is an unofficial custom-puzzle companion inspired by
[catfishing.net](https://catfishing.net), the excellent daily Wikipedia category guessing
game. It is not intended to replace or compete with their game; please play and support it.

---

## How to Play

You're shown Wikipedia categories for a mystery article. Guess the title. Accents, brackets, and capitalisation don't matter, and typos within edit distance 1 are forgiven.

| Result | Points | Emoji |
|---|---|---|
| Correct | 1 | 🐈 |
| Close enough (self-reported) | 0.5 | 🐡 |
| Wrong or skipped | 0 | 🐟 |

Answers match against all redirect / alternative titles, not just the canonical name.

---

## Creating a Puzzle

1. Set a title and optional description.
2. Search Wikipedia and preview the categories for each page.
3. Add between 1 and 10 pages, then select done.
4. Share the generated link.

No account needed.

---

## Playing

- Guess, skip, or claim a half point (honour system).
- Progress is saved locally so you can return later.
- Enter a nickname at the end to appear on the leaderboard. Nickname is remembered via cookie.

---

## Sharing

```
Catfishify 🐈
"Famous Scientists Quiz"
4.5 / 5

🐈🐡🐈🐈🐟

catfishify.cmal.one/p/abc123
```

---

## Leaderboard

Per-puzzle, ranked by score then time. No accounts required.

---

## Stack

- **Backend:** FastAPI, SQLAlchemy, Alembic
- **Frontend:** React, TypeScript, Vite
- **Database:** PostgreSQL
- **Hosting:** Caddy behind a Cloudflare Tunnel on a supervised Mac mini

---

## Wikipedia Integration

Categories are fetched with `clshow=!hidden`, which natively excludes maintenance/admin categories. We additionally strip the eponymous self-referential category (e.g. the article *Albert Einstein* has `Category:Albert Einstein` — which would immediately give the answer away).

Alt titles come from Wikipedia's redirect graph.

---

## Data Model

### `puzzles`

| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| short_id | VARCHAR(8) | base62, used in URLs |
| title | TEXT | |
| description | TEXT | optional |
| size | SMALLINT | 1 to 10 |
| articles | JSONB | see below |
| created_at | TIMESTAMPTZ | |

```json
{
  "wikipedia_title": "Albert Einstein",
  "categories": ["1879 births", "Nobel laureates in Physics"],
  "alt_titles": ["Einstein", "A. Einstein"]
}
```

### `results`

| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| puzzle_id | UUID | FK → puzzles |
| nickname | TEXT | |
| score | NUMERIC(4,1) | |
| time_taken_secs | INTEGER | |
| answer_details | JSONB | per-article outcome |
| completed_at | TIMESTAMPTZ | |

`result` per article: `correct` | `half` | `wrong` | `skipped`

---

## API

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/puzzles` | List all puzzles, ordered by completions desc |
| `POST` | `/api/puzzles` | Create a puzzle |
| `GET` | `/api/puzzles/{short_id}` | Get puzzle (titles stripped for players) |
| `POST` | `/api/puzzles/{short_id}/check-answer` | Check a guess without exposing the title |
| `POST` | `/api/puzzles/{short_id}/reveal-answer` | Reveal a skipped or conceded page |
| `POST` | `/api/puzzles/{short_id}/results` | Submit result |
| `GET` | `/api/puzzles/{short_id}/leaderboard` | Leaderboard |
| `GET` | `/api/wikipedia/search?q=` | Autocomplete |
| `GET` | `/api/wikipedia/article?title=` | Categories + alt titles |

---

## Local Dev

```bash
# backend
cd backend
cp .env.example .env
uv run alembic upgrade head
uv run uvicorn app.main:app --reload

# frontend
cd frontend
npm install && npm run dev
```

The frontend dev server proxies `/api` to `localhost:8000`.

## Verification

```bash
cd backend && uv run pytest -q
cd ../frontend && npm run lint && npm test && npm run build && npm run test:e2e
```

GitHub Actions runs the backend, frontend, and desktop/mobile browser suites on every push and pull request.

## Deploy (cmal.one mini)

From the app clone on the host:

```bash
./deploy.sh
```

The script installs locked dependencies, runs all non-browser release checks, builds the frontend, restarts the launchd-supervised FastAPI service, and smoke-tests both the local service and the public Cloudflare route. Migrations run on startup. FastAPI serves the compiled React build from `/`.

### Env vars

| Variable | Notes |
|---|---|
| `DATABASE_URL` | PostgreSQL connection URL |
| `WIKIPEDIA_API_BASE` | Defaults to `https://en.wikipedia.org/w/api.php` |

---

## Project Structure

```
catfishify/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── models.py
│   │   ├── routers/
│   │   │   ├── puzzles.py
│   │   │   └── wikipedia.py
│   │   └── services/
│   │       ├── answer_check.py
│   │       └── wikipedia.py
│   ├── alembic/
│   └── pyproject.toml
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── CreatePuzzle.tsx
│   │   │   ├── PlayPuzzle.tsx
│   │   │   └── Leaderboard.tsx
│   │   └── components/
│   └── package.json
└── railway.toml
```
