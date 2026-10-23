# Lessons

Short rules every session needs. Merge, don't append; drop what no longer holds.

- **Odds are computed, never typed.** Any percentage shown comes from the engine, `strategy/` or a generated table, so it follows house rules and regenerated data. Every chance says how many rolls it covers (`RollsPct`, `rollsLeft`).
- **A question that assumes a house rule is answered under that rule** (`situationRules`), with a note naming the rule, whatever the reader's table uses.
- **Jest:** an ESM `.js` file imported by a test must be listed in `jest.config.js`'s babel transform regex.
- **Tailwind in `gatsby develop`:** a brand-new arbitrary class may not be generated until restart; reuse an existing one (e.g. `grid-cols-[minmax(0,9rem)_1fr_auto]`).
- **Gatsby dev overlay:** an ESLint `import/first` error (code above an import) opens a compile overlay that swallows clicks; keep code below the imports.
- **Playwright checks:** `require('playwright-core')` with the cached Chromium (`~/Library/Caches/ms-playwright/chromium-1169/...`), `waitUntil: 'load'` plus `waitForTimeout(2500)` (`networkidle` hangs on the dev server); write scripts with the Write tool, not a heredoc in a backgrounded shell (it hung).
- **Don't touch the owner's dev server** on :8000. Run previews and builds in an rsync copy in the scratchpad (`rsync -a --exclude node_modules --exclude .cache --exclude public --exclude .git`), never in the repo. The custom 404 only shows for real misses in a production build (`gatsby build` + `gatsby serve`); `gatsby develop` shows its own 404 list.
- **New pages from gatsby-node** (e.g. `/design/<id>/`) need a dev-server restart; tell the owner when a branch adds some.
- **Shell:** never `cat > file` without a heredoc or input: it waits on stdin and hangs the call. Commit messages go in a scratchpad file, passed with `git commit -F`. Archive a file before overwriting it.
- **Workflow:** branch per change, version bump + CHANGELOG per PR, the owner merges (CLAUDE.md "Git & workflow"). A feature that needs an unmerged one is a stacked PR (`--base feature/<previous>`); GitHub retargets it to `master` when the base merges.
