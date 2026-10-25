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

## Endpoints (Hub Contract v1.2)

Base URL: `http://localhost:3001/api/v1`

| Method | Path | Purpose | Who may call it |
|---|---|---|---|
| GET | /health | Is the API up and can it reach the database? | Public |
| GET | /game-info | Slug, name, group, developer, description, player limits, version | Public |
| GET | /results | Finished games, every player, and the top 3. Needs `X-Hub-Key` header. Optional `?since=` | Anyone with the hub key |
| GET | /question-sets | List all question sets | HOST or ADMIN (`X-Demo-User`) |
| GET | /question-sets/:id | Get one question set | HOST or ADMIN (`X-Demo-User`) |
| POST | /question-sets | Create a question set | HOST or ADMIN (`X-Demo-User`) |
| PATCH | /question-sets/:id | Update a question set | HOST or ADMIN (`X-Demo-User`) |
| DELETE | /question-sets/:id | Remove a question set | HOST or ADMIN (`X-Demo-User`) |
| POST | /sessions | Create a session | HOST or ADMIN (`X-Demo-User`) |
| GET | /sessions/:code | Retrieve a session by join code | Public |
| PATCH | /sessions/:code | Change session status (waiting→playing/ended, playing→ended) | HOST or ADMIN (`X-Demo-User`) |
| POST | /sessions/:code/players | Join or rejoin a session | Any authenticated user (`X-Demo-User`) |
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
