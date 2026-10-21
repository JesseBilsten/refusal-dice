# Lessons

Short rules every session needs. Merge, don't append; drop what no longer holds.

- **Odds are computed, never typed.** Any percentage shown comes from the engine, `strategy/` or a generated table, so it follows house rules and regenerated data. Every chance says how many rolls it covers (`RollsPct`, `rollsLeft`).
- **A question that assumes a house rule is answered under that rule** (`situationRules`), with a note naming the rule, whatever the reader's table uses.
- **Jest:** an ESM `.js` file imported by a test must be listed in `jest.config.js`'s babel transform regex.
- **Tailwind in `gatsby develop`:** a brand-new arbitrary class may not be generated until restart; reuse an existing one (e.g. `grid-cols-[minmax(0,9rem)_1fr_auto]`).
- **Gatsby dev overlay:** an ESLint `import/first` error (code above an import) opens a compile overlay that swallows clicks; keep code below the imports.
- **Playwright checks:** `require('playwright-core')` with the cached Chromium (`~/Library/Caches/ms-playwright/chromium-1169/...`), `waitUntil: 'load'` plus `waitForTimeout(2500)` (`networkidle` hangs on the dev server); write scripts with the Write tool, not a heredoc in a backgrounded shell (it hung).
- **Don't touch the owner's dev server** on :8000, and skip local `npm run build` (CI builds).
