# Handoff (2026-10-22 20:40 PDT)

Read by /session-start. Open work: `ROADMAP.md`. Decisions and rulings: `ROADMAP.md` "Decision log", `docs/RULES.md`. Rewritten at each /handoff.

## Next (task of the day, in order)
1. [refusal-dice] **Get PR #8 merged** (design system, audit fixes, workflow; 1.2.0). CI is green and all its components are approved. The owner merges; nothing for Claude to do unless review comments arrive (`gh pr view 8 --comments`).
2. [refusal-dice] **PR #9** (404/400 error pages, 1.3.0) is stacked on #8 (base `feature/design-system`). Its CI is red only because the approval gate blocks `TableFault`, used by `pages/404.js`. Once the owner approves (ROADMAP open question 5), on branch `feature/error-pages`:
   - set `status: A, approved: '<date>'` for `dice-mishap` and `table-fault` in `src/design-system/registry.js`;
   - add a CHANGELOG line, commit and push.
   - Done when `npm test` passes 372/372 and #9's CI is green.
   - If #8 was squash-merged first, rebase: `git rebase --onto origin/master feature/design-system feature/error-pages`.
3. [refusal-dice] Then back to `ROADMAP.md` Phase 2 item 8 (rest of the odds audit), unless the owner picks a new feature. A new feature starts on a fresh branch from `master`, with a version bump.

## Waiting for the user
- ROADMAP open question 5: approve `TableFault` and `DiceMishap` (blocks #9).
- ROADMAP open question 6: pop color contrast (3.55:1).
- `docs/RULES.md` §6 question 7 (cocked and stacked dice re-rolled? off the table?) and question 8 (hard-mode misread handling, asked twice, still unanswered).
- §6 question 6 (making the game in order): the owner is asking players.

## Running in the background
| What | Unit / process | Ends | Check | Stop |
|---|---|---|---|---|
| Owner's `gatsby develop` | port 8000, started by the owner | when they stop it | `lsof -i :8000` | not ours, leave it (needs a restart to show the new `/design` pages) |
| `gatsby serve` of #9's production build | port 9100, from the scratchpad `build/` copy | when the session ends | `curl -sI http://127.0.0.1:9100/rulez` | `lsof -ti :9100 \| xargs kill` |

## Last session (2026-10-22)
- Done:
  - Play speed picker, cup text ("Kicker is higher than…"), Boss stall fix; pushed to `master` (ee28856, live, CI green).
  - UX audit and design system site with theme playground and approval gate: PR #8.
  - Workflow docs: `docs/WORKFLOW.md`, `CHANGELOG.md`, CI version check.
  - The owner approved the 11 proposed components and kept `master` (no rename).
  - 404/400 error pages with cocked/stacked dice, page matching (`src/lib/page-match.js`), and glossary entries: PR #9.
- Unfinished:
  - Stale PRs #5/#6 (`tailwind-migration`, CI green) are still open; ask the owner whether to close them.
  - Outside this repo (carried from 2026-10-21): hh-companion skill-move edits uncommitted; `~/.claude/settings.json` drifted from chezmoi.
- Learned: now in `notes/lessons.md` (scratch builds, 404 testing, gatsby-node restarts, stacked PRs, `cat >` hang).
