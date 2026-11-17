# Bomb Pass API

Backend API for **Bomb Pass**, a tournament game for the SorSU Bulan Campus library.
CS 313 Software Engineering 1, A.Y. 2026-2027.

- Developer: Karl Abraham M. Saboco (dvlDweller), BSCS 3-2
- Group and game concept: Bomb Pass Team (Group 7, BSCS 3-2)

This is my own build of my group's game concept. Every commit in this repository was made by me, with Git, on my own computer or in my own Codespace.

## Tech stack

| Layer | Tool |
|---|---|
| Runtime | Node.js 22 LTS or newer |
| Web framework | Express 5 |
| Database | PostgreSQL 16 or newer |
| ORM and migrations | Sequelize 6 with sequelize-cli |

## Setup

```
git clone [repository-url]
cd [folder-name]
npm install
```

Copy `.env.example` to `.env`, then put your own PostgreSQL password in `DB_PASSWORD`.

```
npm run db:create     (first time only)
npm run db:migrate
npm run db:seed
npm run db:check
npm run dev
```

## Environment variables

| Key | Example | Purpose |
|---|---|---|
| NODE_ENV | development | Which config block to use |
| PORT | 3001 | Port the API listens on (the library assigns the final port at deployment) |
| DB_HOST | 127.0.0.1 | PostgreSQL host |
| DB_PORT | 5432 | PostgreSQL port |
| DB_NAME | your_game_slug | Database name: your game slug, with underscores |
| DB_USER | postgres | Database user |
| DB_PASSWORD | (your own) | Database password. Never commit this. |
| HUB_API_KEY | dev-hub-key | Key the Library Game Hub sends to read results. The library gives the real one at deployment. |
| JWT_SECRET | (your generated 64-char hex secret) | Signs login tokens. Generate locally and never commit it. |
| JWT_EXPIRES_IN | 1h | Login token lifetime |
| CORS_ORIGINS | http://localhost:5173 | Comma-separated browser origins allowed to call the API |

## Demo accounts

Local/development only. Do not use these credentials in production.

Shared demo password: `BombPass-Demo-2026!`

Seeded demo accounts:

| School ID | Name | Role | Email |
|---|---|---|---|
| 2099-0001 | Host Account | HOST | host0001@bombpass.test |
| 2099-0003 | Second Host | HOST | host0003@bombpass.test |
| 2099-1001 | Alice Player | PLAYER | player0001@bombpass.test |
| 2099-1002 | Bob Player | PLAYER | player0002@bombpass.test |
| 2099-1003 | Charlie Player | PLAYER | player0003@bombpass.test |
| 2099-1004 | Diana Player | PLAYER | player0004@bombpass.test |
| 2099-1005 | Eric Player | PLAYER | player0005@bombpass.test |
| 2099-1006 | Free Test Player | PLAYER | player0006@bombpass.test |
| 2099-9001 | Admin Account | ADMIN | admin9001@bombpass.test |

## Authentication

Week 12 replaces the temporary `X-Demo-User` header with JWT Bearer authentication.

1. Log in:
   `POST /api/v1/auth/login` with `{ "school_id": "...", "password": "..." }`.
2. Receive a JWT in the response.
3. Send protected requests with:
   `Authorization: Bearer <token>`

Protected Week 11 routes (`/question-sets`, `/sessions` host actions) now require a valid Bearer token. `/api/v1/auth/me` also requires a valid Bearer token and returns the authenticated account.

The legacy `X-Demo-User` header is no longer accepted; `/auth/me` rejects it with 401.

## Endpoints (Hub Contract v1.2)

Base URL: `http://localhost:3001/api/v1`

| Method | Path | Purpose | Who may call it |
|---|---|---|---|
| GET | /health | Is the API up and can it reach the database? | Public |
| GET | /game-info | Slug, name, group, developer, description, player limits, version | Public |
| GET | /results | Finished games, every player, and the top 3. Needs `X-Hub-Key` header. Optional `?since=` | Anyone with the hub key |
| GET | /question-sets | List all question sets | HOST or ADMIN (Bearer token) |
| GET | /question-sets/:id | Get one question set | HOST or ADMIN (Bearer token) |
| POST | /question-sets | Create a question set | HOST or ADMIN (Bearer token) |
| PATCH | /question-sets/:id | Update a question set | HOST or ADMIN (Bearer token) |
| DELETE | /question-sets/:id | Remove a question set | HOST or ADMIN (Bearer token) |
| POST | /sessions | Create a session | HOST or ADMIN (Bearer token) |
| GET | /sessions/:code | Retrieve a session by join code | Public |
| PATCH | /sessions/:code | Change session status (waiting→playing/ended, playing→ended) | HOST or ADMIN (Bearer token) |
| POST | /sessions/:code/players | Join or rejoin a session | Any authenticated user (Bearer token) |
| GET | /sessions/:code/players | List session players | Public |

## What "completed" means in my game

A player is considered to have completed the game if their `player_status` is `'FINISHED'`. Players with any other status (e.g., `ELIMINATED`, `FORFEITED`) are considered not completed. TIMEOUT answer events do not affect completion status.

## Tables

users
question_sets
questions
choices
game_sessions
players
session_question_history
answers
penalties
exp_transactions
voucher_catalog
voucher_redemptions

## Database scripts

| Command | What it does |
|---|---|
| npm run db:migrate | Runs migrations that have not run yet |
| npm run db:migrate:status | Lists every migration as up or down |
| npm run db:seed | Loads the seed data |
| npm run db:check | Counts the rows in every table |
| npm run db:reset | Empties the database, rebuilds every table and reloads the seed data |
| npm run check | Runs the same automatic check that GitHub runs after every push |
