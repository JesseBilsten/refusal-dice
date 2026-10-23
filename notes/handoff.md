# Handoff (2026-10-22 21:00 PDT)

Read by /session-start. Open work: `ROADMAP.md`. Decisions and rulings: `ROADMAP.md` "Decision log", `docs/RULES.md`. Rewritten at each /handoff.

## Next (task of the day, in order)
1. [refusal-dice] **PRs #8, #9 and #10 wait for the owner to merge, in that order**: #8 (design system, audit, workflow, darker coral; 1.2.0), #9 (404/400 error pages; 1.3.0, stacked on #8), #10 (hard mode checks a pick as it's made; 1.4.0, stacked on #9). Every component is approved and both should be green. If a base is squash-merged, rebase the next one onto `origin/master` (`git rebase --onto origin/master <old base> <branch>`), then force-push with lease.
2. [refusal-dice] Then `ROADMAP.md` Phase 2 item 8 (rest of the odds audit), unless the owner picks a new feature (fresh branch from `master`, version bump).

## Waiting for the user
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
  - 404/400 error pages with cocked/stacked dice, page matching (`src/lib/page-match.js`), and glossary entries (Cocked Die, Stacked Dice, Off the Table): PR #9. The owner approved `TableFault`/`DiceMishap`, ruled cocked/stacked/off-table dice are re-rolled, and approved darkening the coral (`pop`) for AA.
  - Hard-mode showing revised (2026-10-22): a pick is checked live; "Not a valid game" offers Roll all five; PR #10 (`showCheck` in play-model).
  - Seen, not fixed: at 390px in Play, your seat overlaps the seat above it (covers Ava's tags). Pre-existing; worth a look.
- Unfinished:
  - Stale PRs #5/#6 (`tailwind-migration`, CI green) are still open; ask the owner whether to close them.
  - Outside this repo (carried from 2026-10-21): hh-companion skill-move edits uncommitted; `~/.claude/settings.json` drifted from chezmoi.
- Learned: now in `notes/lessons.md` (scratch builds, 404 testing, gatsby-node restarts, stacked PRs, `cat >` hang).
