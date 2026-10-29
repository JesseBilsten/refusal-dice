# Handoff archive

Earlier `notes/handoff.md` files, newest first, word for word. Not read at session start; search it when needed.

# Handoff (2026-10-23 17:05 PDT)

Read by /session-start. Open work: `ROADMAP.md`. Decisions and rulings: `ROADMAP.md` "Decision log", `docs/RULES.md`. Rewritten at each /handoff.

## Next (task of the day, in order)
1. [refusal-dice] **This handoff is on `chore/handoff-2026-10-23` (1.4.2, LOCAL ONLY until the owner OKs a push).** It carries the handoff, lessons, ROADMAP rows, the stacked-PR merge rule in `docs/WORKFLOW.md` and the CHANGELOG release dates. Once OK'd: push, `gh pr create`, the owner merges, then `git tag v1.4.2` and delete the branch.
2. [refusal-dice] `ROADMAP.md` Phase 2 item 8 (the rest of the odds audit), unless the owner picks a new feature. Fresh branch from `master`, version bump, CHANGELOG entry.

## Waiting for the user
- RULES §6 question 6 (missed players make the game all at once, or one at a time from the Hammer's left): the owner is asking players. Nothing is blocked; the engine rolls them at once.
- Whether to delete the `tailwind-migration` branch on GitHub (its PRs #5/#6 are closed).

## Running in the background
| What | Unit / process | Ends | Check | Stop |
|---|---|---|---|---|
| Owner's `gatsby develop` | port 8000, started by the owner | when they stop it | `lsof -i :8000` | not ours, leave it |

## Last session (2026-10-22 → 2026-10-23)
- Done:
  - Merged with the owner's OK, as merge commits in stack order, and tagged: #8 design system, UX audit and workflow (v1.2.0); #9 404/400 error pages (v1.3.0); #10 hard mode checks a pick as it's made (v1.4.0); #11 your seat no longer docks over the table in Play (v1.4.1). Live on refusaldice.com; `master` CI green at d72383b.
  - #9 fix: the 404 page suggests a page by its name alone (`/1o-2` → `/games/10-2/`) in `src/lib/page-match.js`.
  - Closed PRs #5/#6; deleted the four merged branches; stopped the :9100 preview server.
- Unfinished:
  - refusal-dice: `chore/handoff-2026-10-23`, LOCAL ONLY (see Next 1).
  - Outside this repo (carried from 2026-10-21): hh-companion skill-move edits uncommitted; `~/.claude/settings.json` drifted from chezmoi.
- Learned: now in `notes/lessons.md` (merging a stack of PRs, previewing the 404 on the dev server, zsh word splitting).

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

# Handoff (2026-10-21 08:20 PDT)

Read by /session-start. Open work: `ROADMAP.md`. Decisions and rulings: `ROADMAP.md` "Decision log", `docs/RULES.md`. Rewritten at each /handoff.

## Next (task of the day, in order)
1. [refusal-dice] Rest of the odds audit, `ROADMAP.md` Phase 2 item 8 (barking rule of thumb, dead code). Optional: Tres Away's "score of 10 or less" advice could come from the call odds too (any single 3 beats an even share); ask Jesse first.

## Waiting for the user
- Nothing blocking.

## Running in the background
| What | Unit / process | Ends | Check | Stop |
|---|---|---|---|---|
| Jesse's `gatsby develop` | port 8000, started by Jesse | when Jesse stops it | `lsof -i :8000` | not ours, leave it |

## Last session (2026-10-20 to 2026-10-21)
- Done (pushed, CI green on 674ca0c): fine-line Odds Lab questions with flip tables (10-2 tie vs roll, SCC kicker, Boss two pair); "Come Back" glossary entry; Monterey question answered under its house rule; `RollsPct` (tap a chance to compare 1 and 2 rolls left) and "with N rolls left" wording.
- Done (pushed, CI green on 7906a63): every figure computed (`c3bc03d`); Boss/Razzle call thresholds from the call odds (`7906a63`: Boss three of a kind, Razzle two wilds). Computed when-to-call callouts, call-odds strength grades on game pages, computed Boss tip, Games-page note and design samples; `roll-strength.js` deleted. 344 tests pass.
- Unfinished: open PRs #5/#6 on `tailwind-migration` (CI green, stale). Outside this repo: hh-companion skill-move edits uncommitted; `~/.claude/settings.json` drifted from chezmoi.
- Learned: now in `notes/lessons.md`.
