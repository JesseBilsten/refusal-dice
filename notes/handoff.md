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
