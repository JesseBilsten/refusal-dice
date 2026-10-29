# Handoff (2026-10-29 07:40 PDT)

Read by /session-start. Open work: `ROADMAP.md`. Decisions and rulings: `ROADMAP.md` "Decision log", `docs/RULES.md`. Rewritten at each /handoff.

## Next (task of the day, in order)
1. [refusal-dice] **PR #12 (`chore/handoff-2026-10-23`, 1.4.2, docs only, CI green) waits for the owner to merge.** After the merge: `git checkout master && git pull`, `git tag v1.4.2 && git push origin v1.4.2`, delete the branch (`git push origin --delete chore/handoff-2026-10-23`, `git branch -d chore/handoff-2026-10-23`). The next handoff goes on the next working branch.
2. [refusal-dice] `ROADMAP.md` Phase 2 item 8 (the rest of the odds audit), unless the owner picks a new feature. Fresh branch from `master`, version bump, CHANGELOG entry.

## Waiting for the user
- RULES §6 question 6 (missed players make the game all at once, or one at a time from the Hammer's left): the owner is asking players. Nothing is blocked; the engine rolls them at once.
- Old branches on GitHub (`codex/find-and-fix-an-important-bug`, `codex/update-npm-packages-to-latest-versions`, `feature/bootstrap-to-tailwind-shadcn` (merged in #7), `feature/unified-components`, `upgrade/gatsby-5-and-deps`, `gatsby` (Netlify's branch before 2026-10-17)): offered to check each against `master` and delete the merged or replaced ones; no answer yet.

## Running in the background
| What | Unit / process | Ends | Check | Stop |
|---|---|---|---|---|
| Owner's `gatsby develop` | port 8000, started by the owner | when they stop it | `lsof -i :8000` | not ours, leave it |

## Last session (2026-10-23 → 2026-10-29)
- Done:
  - Deleted the `tailwind-migration` branch on GitHub (last commit `42e626c`, restorable with `git push origin 42e626c:refs/heads/tailwind-migration`); opened PR #12 for the 2026-10-23 handoff.
  - Moved the refusal-dice conversations (`31bcb671`, `216403c4`) and memories (Netlify deploy, better bots; git accounts copied) from `~/.claude/projects/-Users-jessebilsten-Projects-Code/` to `~/.claude/projects/-Users-jessebilsten-Projects-Code-refusal-dice/`, so `claude` started in this repo lists them. The stale copy left in the old folder was deleted 2026-10-29 with the owner's OK.
- Unfinished:
  - Outside this repo (carried from 2026-10-21): hh-companion skill-move edits uncommitted; `~/.claude/settings.json` drifted from chezmoi.
- Learned: in `notes/lessons.md` (`ls` is `eza`: use `/bin/ls --` for names starting with `-`).
