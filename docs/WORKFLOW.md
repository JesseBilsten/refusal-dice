# Workflow: branches, versions, pull requests and approvals

How every change reaches refusaldice.com. Claude follows this in every
session; CLAUDE.md points here.

## The default branch

`master` is the default branch and the live site: Netlify deploys every
push to it. Nothing is committed to `master` directly; it only changes
through merged pull requests. (It stays `master`: the owner decided
against renaming it to `main` on 2026-10-22.)

## One branch per change

1. Branch from an up-to-date `master`:
   `feature/<short-name>` for something new, `fix/<short-name>` for a bug,
   `chore/<short-name>` for tooling, docs and dependencies.
2. Commit as `jessebilsten <jesse@bilsten.net>` with Conventional Commits
   (`feat:`, `fix:`, `refactor:`, `docs:`, `chore:`, `test:`), ending with
   the session's attribution lines.
3. Keep a branch to one change a reviewer can hold in their head. Two
   features are two branches.

## Versions: major.minor.patch

The version lives in `package.json` and every release is listed in
`CHANGELOG.md`. Each pull request bumps it once, by the biggest change it
contains:

| Bump | When | Example |
|---|---|---|
| **major** (`2.0.0`) | A change that breaks what players or links rely on: a URL removed, a saved setting reset, a rule that changes how games are scored | Moving to a new framework that changes URLs |
| **minor** (`1.3.0`) | Something new: a feature, a page, a component, a new rule option | The design system site |
| **patch** (`1.2.1`) | A fix that changes nothing else | A Boss round that stalled |

- Bump `version` in `package.json` and add the release at the top of
  `CHANGELOG.md` (date, version, and what changed, in players' words).
  CI fails a pull request whose version isn't higher than `master`'s.
- After the merge, tag it: `git tag v1.3.0 && git push origin v1.3.0`.

## Pull requests

1. Before opening one: `npm run typecheck`, `npm test` and `npm run build`
   pass, and every changed screen has been looked at in light and dark mode
   and at 390px wide.
2. Push the branch (pushing a branch doesn't deploy) and open the pull
   request with `gh pr create`. Say what changed and why, how it was
   checked, the version bump and why it's that size, and link screenshots.
   End the description with the session's attribution lines.
3. CI runs typecheck, tests, the build, the generated-data check and the
   version check.
4. **The owner merges.** Claude never merges a pull request, and never
   pushes to `master`, without the owner's OK in that conversation: merging
   deploys the site. Use "Squash and merge" so `master` has one commit per
   release, titled with the Conventional Commit and version, e.g.
   `feat: design system site (1.2.0)`. Stacked pull requests are the
   exception: merge them bottom first as merge commits (a squash leaves the
   next one's commits duplicated), retargeting each next one to `master`
   (`gh pr edit <n> --base master`) before merging it.
5. Tag the release (see Versions) and delete the branch after the merge.

## New UI patterns need approval first

Anything new a player will see (a component, a pattern, a token) goes
through the design system before it's used:

1. Build it in its kit and register it in `src/design-system/registry.js`
   with `status: 'proposed'`, what it replaces, and a live example in
   `src/design-system/examples.jsx`.
2. Show it on its page at `/design/<id>/`, in light and dark and at phone
   width. Put the link and screenshots in the pull request.
3. **The owner approves it.** Only then does Claude set
   `status: 'approved'` (with `approved: '<date>'`). Until then the tests
   fail if anything outside the design system uses it, so the pull request
   can't go green.
4. Retiring something: set `status: 'deprecated'`, say what replaces it,
   and move every use over. The tests fail while anything still imports it.

The full rules for building UI are in [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md)
and on the live site at `/design`.

## Trying a theme change

Use the theme playground at `/design/theming/` to try colors, fonts, type
sizes and radius without a rebuild. When a draft is worth keeping, Copy CSS
gives the edit for `src/styles/global.css`; make it on a branch and propose
it like any other change.
