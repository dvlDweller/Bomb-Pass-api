# Development journey: Bomb Pass API

Student: Karl Abraham M. Saboco · Section: BSCS 3-2 · Group: Group 7

One entry per milestone, written the week you did it. Newest at the bottom.

## M1 · Accounts, passwords and tokens
- Dates worked: Nov 12–17, 2026 · Time spent: Not yet tracked; student to estimate
- Goal: Install the official Weeks 12–18 kit and implement Milestone 1 authentication and admin user management without losing Week 11 functionality.
- What I built: Installed the kit and merged the Week 11 user model/repository changes; added nullable `password_hash` migration `20261112100000-add-password-to-users.js` and idempotent seeder `20261112100100-demo-passwords.js`; added `src/security/password.js` and `src/security/token.js`; configured JWT/bcrypt/CORS environment values; implemented `auth.validator.js`, `auth.service.js`, `auth.controller.js`, and `auth.routes.js`; implemented `user.service.js`, `user.controller.js`, and `user.routes.js`; added user unique-constraint mappings; mounted `/auth` and `/users`; updated README authentication documentation; migrated the Postman collection to JWT Bearer authentication; created the separate `bomb_pass_test` database.
- Authentication behavior implemented: registration always creates `PLAYER`; login uses `findForLogin` and `password.matches`; unknown school IDs and wrong passwords return identical `INVALID_CREDENTIALS`; `/auth/me` requires a valid Bearer token; admin listing and role management are ADMIN-only; self-role changes return `SELF_ROLE_CHANGE`.
- Evidence: commits `75d74c9` (password migration and seeder), `5eeb6b9` (JWT authentication and admin management), `7626f74` (documentation), and `d2d3240` (Postman JWT migration); pull request: https://github.com/dvlDweller/Bomb-Pass-api/pull/6; GitHub Actions run #25 succeeded with 27 checks covering criteria A–G; local verification with `CHECK_WEEK=12` against `bomb_pass_test` on port 5433 passed 38 checks with 0 failures, including H and I; `GET /api/v1/health` returned HTTP 200.
- Postman evidence: 5 login requests passed; 17 Accounts requests passed; 16 session regression requests passed; 28 of the 29 original Week 11 requests were exercised successfully. The DELETE question-set request was intentionally skipped to preserve data and is not claimed as passed.
- Problem I hit: GitHub rejected a push with GH007 because the commit author email was private; a later push failed because the GitHub OAuth token lacked the `workflow` scope needed to push `.github/workflows/check.yml`.
- How I solved it: Set the Git author email to a verified/public address and re-committed; re-authenticated GitHub CLI with the `workflow` scope (`gh auth refresh -s workflow`) before pushing the workflow file.
- Decision I made and why: Keep Week 11 column lengths in `users` to stay compatible with the existing migration; add `password_hash` through a new additive migration instead of editing the old users migration; keep `bomb_pass` and `bomb_pass_test` as separate databases so tests cannot destroy development data.
- Changes to my design set: Added the nullable `password_hash` column to the users table design and a separate test database; no other ERD or endpoint-table changes.
- What I would explain to a classmate: Authentication is "who are you" (login and tokens, answered with 401 when unknown), while authorization is "what may you do" (roles and permissions, answered with 403 when known but not allowed).
- Pull request: https://github.com/dvlDweller/Bomb-Pass-api/pull/6

AI disclosure: ChatGPT and OpenCode Desktop assisted with planning, repository inspection, implementation prompts, code-generation and editing assistance, reviewing, debugging, and documentation. The student personally reviewed the work, executed Postman tests and local verification, and performed the Git staging, commits, push, and pull-request operations. The student remains responsible for understanding and explaining every submitted line of code.

## M2 · The question bank
- Dates worked: November 25–26, 2026 (confirmed commit activity; earlier work sessions may not be fully recorded) · Time spent: Not tracked; a reliable total cannot be reconstructed
- Goal: Implement the Week 13 question bank with paginated question-set lists, nested question management, frozen-set protection, and cover uploads while preserving Week 11 and M1 behavior.
- What I built: Added Question and Choice models, their central registration and associations, and a question repository; extended QuestionSet pagination, safe search, allow-listed sorting, and `?include=questions`; implemented nested question GET, POST, PATCH, and DELETE endpoints with owner-only authorization; validated question and choice payloads; assigned server-generated zero-based `choice_index` values; saved questions and choices transactionally; added frozen-set protection when a game session references a set; added the nullable `cover_path` migration and model field; added the ownership-checked cover upload route and `/uploads` static serving; added 12 Question bank Postman requests and an oversized upload fixture.
- Evidence: Earlier M1 baseline verification: `npm run check` with `CHECK_WEEK=12` against `bomb_pass_test` on port 5433 passed 38 checks with 0 failures, including H and I. M2 Postman Stage 1 passed 17 requests and 28 assertions with 0 failures. M2 Postman Stage 2 passed 33 requests and 67 assertions with 0 failures, including 5 login requests and 28 safe Week 11 regression requests. The destructive question-set DELETE request was intentionally skipped to preserve data and is not claimed as passed. The `cover_path` migration `20261112100200-add-cover-path-to-question-sets.js` was applied to `bomb_pass_test`; all 15 migrations were up. Pull request #7: https://github.com/dvlDweller/Bomb-Pass-api/pull/7
  Commit references:
  - e404105 — Question and Choice models
  - 60fa0f0 — Question bank API endpoints
  - a293ab1 — Postman requests and upload fixtures
- Problem I hit: PostgreSQL 18 was stopped, causing ECONNREFUSED on port 5433; Newman was initially unavailable locally; port 3001 was occupied by an existing Node process whose database target could not be verified.
- How I solved it: The student manually started PostgreSQL 18; installed Newman 6.2.3 globally without changing project dependencies; ran the dedicated Stage 2 API on port 3002 and left the unidentified existing process on port 3001 untouched.
- Decision I made and why: Use server-generated zero-based `choice_index` values instead of a `questions.position` column, so clients cannot dictate stored choice positions; freeze a question set after any game session references it, including ended sessions, so its questions cannot change after use; make nested question content owner-only, while retaining the existing ADMIN metadata access behavior; store uploaded cover references as relative `/uploads/covers/...` paths rather than absolute filesystem paths.
- Changes to my design set: Added Question and Choice model registration and associations; added the nullable `cover_path` column; added nested question endpoints and cover upload; changed the QuestionSet list response from the earlier Week 11 `{ question_sets }` shape to the M2 `{ data, meta }` envelope; no `questions.position` column was added.
- What I would explain to a classmate: A question and its choices must be saved all-or-nothing. The service opens one Sequelize transaction and forwards it to every repository operation. If a write fails, the transaction should roll back rather than leave an incomplete question.
- AI disclosure: ChatGPT and OpenCode were used for planning and implementation guidance, coding assistance, source reviews and audits, and running and reviewing validation and Postman test results. The student reviewed the work and remains responsible for understanding and explaining every submitted line of code.

## M3 · Gameplay

## M4 · Automated tests and server preparation

## M5 · API documentation and deployment

## M6 · The SE1 portfolio and the release

## M7 · The Test Report