# Development journey: Bomb Pass API

Student: Karl Abraham M. Saboco · Section: BSCS 3-2 · Group: Group 7

One entry per milestone, written the week you did it. Newest at the bottom.

## M1 · Accounts, passwords and tokens
- Dates worked: Nov 12, 2026 · Time spent: Not yet tracked; student to estimate
- Goal: Install the official Weeks 12–18 kit and prepare the backend for real authentication without losing Week 11 work.
- What I built: Installed the kit; replaced `.github/workflows/check.yml`, `scripts/ci-check.js`, `src/middlewares/current-user.js`, and `src/errors/app-error.js` with official versions; merged `src/models/user.js` and `src/repositories/user.repository.js` to add `password_hash`, `defaultScope`, `withPassword`, `findForLogin`, `findById`, `findAll`, `create`, and `update` while preserving Week 11 column lengths; added `src/security/password.js` and `src/security/token.js`; configured `JWT_SECRET`, `JWT_EXPIRES_IN`, `CORS_ORIGINS`, `env.bcryptRounds`, and `env.jwt`; updated `.gitignore`; created the separate `bomb_pass_test` database; added kit shared files (`docs/`, `tests/`, `uploads/`, `render.yaml`, etc.). Authentication endpoints are not implemented yet.
- Evidence: commit `6586223` ("chore: install the Weeks 12-18 kit") · GitHub Actions run #24 on November 12, 2026, branch `feature/auth`: https://github.com/dvlDweller/Bomb-Pass-api/actions/runs/43199318979 — 27 checks passed, 0 failed; criteria A–G passed. This was a feature-branch check, not a merged `main` check. · local health check `GET /api/v1/health` returned HTTP 200.
- Problem I hit: GitHub rejected a push with GH007 because the commit author email was private; a later push failed because the GitHub OAuth token lacked the `workflow` scope needed to push `.github/workflows/check.yml`.
- How I solved it: Set the Git author email to a verified/public address and re-committed; re-authenticated GitHub CLI with the `workflow` scope (`gh auth refresh -s workflow`) before pushing the workflow file.
- Decision I made and why: Keep Week 11 column lengths in `users` (school_id 32, full_name 120, email 254, role 12) to stay compatible with the existing migration; add `password_hash` through a new additive migration instead of editing the old users migration; keep `bomb_pass` and `bomb_pass_test` as separate databases so tests cannot destroy development data.
- Changes to my design set: Added the planned nullable `password_hash` column to the users table design and a separate test database; no other ERD or endpoint-table changes.
- What I would explain to a classmate: Authentication is "who are you" (login and tokens, answered with 401 when unknown), while authorization is "what may you do" (roles and permissions, answered with 403 when known but not allowed).
- Pull request: M1 pull request is pending because authentication implementation is not complete. No pull request has been created yet.

AI disclosure: ChatGPT and OpenCode Desktop were used for planning, repository inspection, kit comparison, environment setup assistance, and drafting this entry. They did not independently complete or verify authentication functionality, which remains pending implementation.

## M2 · The question bank

## M3 · Gameplay

## M4 · Automated tests and server preparation

## M5 · API documentation and deployment

## M6 · The SE1 portfolio and the release

## M7 · The Test Report