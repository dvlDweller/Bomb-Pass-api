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

## M3 · Gameplay

## M4 · Automated tests and server preparation

## M5 · API documentation and deployment

## M6 · The SE1 portfolio and the release

## M7 · The Test Report