# Handoff archive

Earlier `notes/handoff.md` files, newest first, word for word. Not read at session start; search it when needed.

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
