# Handoff (2026-10-21 08:20 PDT)

Read by /session-start. Open work: `ROADMAP.md`. Decisions and rulings: `ROADMAP.md` "Decision log", `docs/RULES.md`. Rewritten at each /handoff.

## Next (task of the day, in order)
1. [refusal-dice] Push `c3bc03d` "fix(odds): compute every figure the site shows" once Jesse OKs it (pushing deploys refusaldice.com). Then confirm the CI run's headSha equals HEAD and it goes green (`gh run list -L 1`).
2. [refusal-dice] Finish the odds audit, `ROADMAP.md` Phase 2 item 8. Start with the Boss and Razzle call thresholds: derive them from `specialtyCalls(game).firstAbove` (`src/components/OddsLab/specialty-calls.js`). Done when no advice names a threshold the data contradicts.

## Waiting for the user
- OK to push `c3bc03d` live.
- Whether the Boss/Razzle "call with … or better" advice should be derived from the data (asked 2026-10-21; recommended yes).

## Running in the background
| What | Unit / process | Ends | Check | Stop |
|---|---|---|---|---|
| Jesse's `gatsby develop` | port 8000, started by Jesse | when Jesse stops it | `lsof -i :8000` | not ours, leave it |

## Last session (2026-10-20 to 2026-10-21)
- Done (pushed, CI green on 674ca0c): fine-line Odds Lab questions with flip tables (10-2 tie vs roll, SCC kicker, Boss two pair); "Come Back" glossary entry; Monterey question answered under its house rule; `RollsPct` (tap a chance to compare 1 and 2 rolls left) and "with N rolls left" wording.
- Done (LOCAL ONLY, `c3bc03d`): every figure computed. Computed when-to-call callouts, call-odds strength grades on game pages, computed Boss tip, Games-page note and design samples; `roll-strength.js` deleted. 338 tests pass.
- Unfinished: refusal-dice master is 1 ahead of origin (`c3bc03d`, see Next 1). Open PRs #5/#6 on `tailwind-migration` (CI green, stale). Outside this repo: hh-companion skill-move edits uncommitted; `~/.claude/settings.json` drifted from chezmoi.
- Learned: now in `notes/lessons.md`.
