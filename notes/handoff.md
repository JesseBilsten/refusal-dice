# Handoff (2026-11-01 08:45 PST)

Read by /session-start. Open work: `ROADMAP.md`. Decisions and rulings: `ROADMAP.md` "Decision log", `docs/RULES.md`. Rewritten at each /handoff.

## Next (task of the day, in order)
1. [refusal-dice] **This handoff is on `chore/handoff-2026-11-01` (1.5.1, docs only): LOCAL ONLY until the owner OKs the push.** Then `git push -u origin chore/handoff-2026-11-01` and `gh pr create` (base `master`). The owner merges (`! gh pr merge <n> --merge`), then tag `v1.5.1` and delete the branch.
2. [refusal-dice] Check that CI on `master` for v1.5.0 (run 41327216523, the #13 merge) went green: `gh run list -L 1 --branch master`. It was still running at 08:38 PST.
3. [refusal-dice] `ROADMAP.md` Phase 2 item 8 (the rest of the odds audit), unless the owner picks a new feature. Fresh branch from `master`, version bump, CHANGELOG entry.

## Waiting for the user
- Push OK for this handoff branch (project handoff rule).
- Old branches on GitHub (`codex/find-and-fix-an-important-bug`, `codex/update-npm-packages-to-latest-versions`, `feature/bootstrap-to-tailwind-shadcn` (merged in #7), `feature/unified-components`, `upgrade/gatsby-5-and-deps`, `gatsby` (Netlify's branch before 2026-10-17)): offered to check each against `master` and delete the merged or replaced ones; no answer yet.
- `docs/RULES.md` §6 has no open questions. One [inferred] detail remains: in a Tres Away replay, the tied player nearest the caller puts out first (§3.2).

## Running in the background
| What | Unit / process | Ends | Check | Stop |
|---|---|---|---|---|
| Owner's `gatsby develop` (not running at 08:38 PST) | port 8000, started by the owner | when they stop it | `lsof -i :8000` | not ours, leave it |

## Last session (2026-10-29 → 2026-11-01)
- Done:
  - Rulings (docs/RULES.md, ROADMAP decision log): Boss replay tie for the best hand = no Boss; taking a tie is an offer every tied player must take (one who rolls instead and ends worst loses; one who climbs off sends the offerers back to rolling, `reopenTie`); Tres Away replay goes one die at a time; tied with equal rolls, start at the Hammer, clockwise (engine already did). Making the game in any order; Boss comes up in fixed order (both already enforced).
  - PR #12 merged (v1.4.2) and PR #13 merged (v1.5.0, the three engine rule changes + three table regenerations); both branches deleted, both tagged.
  - Comeback test adjusted: since tie offers, 7's Low edges out 10-4 Low after Monterey Low (10-4 Low still first after 10-3 Low).
- Unfinished:
  - A missed kicker game still can't take a tie while another miss can roll (kept as before; the owner's ruling was about tied hands). Ask if it comes up.
  - One build ran in the repo by mistake (2026-10-29); if `npm run develop` misbehaves, `npx gatsby clean`.
  - Outside this repo (carried from 2026-10-21): hh-companion skill-move edits uncommitted; `~/.claude/settings.json` drifted from chezmoi.
- Learned: in `notes/lessons.md` (auto mode blocks `gh pr merge`; batch rulings before regenerating tables; `${var/…}` trips the safety check).
