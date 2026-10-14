# CLAUDE.md

Guidance for Claude (and humans) working in this repo. Product direction lives in **[ROADMAP.md](ROADMAP.md)**. Read it before starting feature work, and update it when a phase ships or a decision changes.

## What this is

**Refusal Dice** is a site that teaches the bar dice game Refusal and helps players improve, by explaining the rules and the odds behind each decision. Planned additions: a game against AI opponents, and online turn-based play with email turn alerts.

## Commands

```bash
npm ci            # install from the lockfile (preferred over npm install)
npm run develop   # dev server at http://localhost:8000 (GraphiQL at /___graphql)
npm run build     # production build into /public
npm test          # Jest
npm run format    # Prettier
```

Run `npm test` and `npm run build` before calling work done. A change isn't verified until the build passes.

## Stack

- **Gatsby 5** (static site generation), **React 18**
- **Tailwind CSS 3** + **shadcn/ui** (JavaScript variant, `components.json`; generated components live in `src/components/ui/`)
- **Radix UI** primitives, **lucide-react** icons, **framer-motion** for animation
- **Jest** for tests
- Hosting: **Netlify**. Preview deploys have been used (commit `8745485`), but there's no `netlify.toml` yet; adding one is a Phase 0 task.
- Node: `.nvmrc` pins 18 (end of life); the site currently builds on Node 25. Moving to current LTS is a Phase 0 task.

## Layout

```
src/
  pages/            Gatsby file-based routes (one file = one URL)
  templates/        game-detail.js → /games/<id> (created in gatsby-node.js)
  components/       App components; ui/ = shadcn primitives
  lib/
    games-config.js     SINGLE SOURCE OF TRUTH for the game list and metadata
    game-validation.js  Rules + heuristic strategy (being split up, see below)
    roll-strength.js    Rarity/strength classification
    utils.js            cn() class merger
  data/             Generated JSON + the generator scripts
  __tests__/        Jest tests
  styles/global.css Tailwind layers + CSS color tokens (light/dark)
  ideas/            Abandoned prototypes. Don't build on these; scheduled for deletion.
```

### Target layout (Phase 0, see ROADMAP)

```
src/engine/     Pure game engine, TypeScript, no React/DOM/Gatsby imports
  rules/        Playable-game checks, hand/kicker comparison, ties
  round/        Full-game state machine (state + actions + reducer)
src/strategy/   Recommendation and odds logic (consumes engine/)
```

## Code style

- **Prettier:** no semicolons, single quotes, ES5 trailing commas (`.prettierrc`). Some older files (`game-validation.js`, `gatsby-node.js`) still use semicolons. Follow the file you're in, and format files you substantially rewrite.
- **Components:** function components + hooks; `.jsx` for components, `.js` for pages (existing convention). PascalCase component files or `Component/index.js` folders.
- **Imports:** the `@/` alias maps to `src/` (`jsconfig.json`); prefer it for new code.
- **Styling:**
  - Tailwind utilities only.
  - Use the semantic color tokens (`bg-background`, `text-foreground`, `text-muted-foreground`, `bg-primary`, `border-border`, …) from `tailwind.config.js`/`global.css`, never raw hex values.
  - Dark mode is class-based (`darkMode: 'class'`); check that every new UI works in both themes.
  - Merge classes with `cn()` from `src/lib/utils.js`.
- **UI primitives:** reuse `src/components/ui/*` before writing new ones; add new shadcn components with the shadcn CLI (JS, not TSX) so they match.
- **Navigation:** always use Gatsby `<Link>` or `navigate()`. Never `window.location.href` for internal routes.
- **Game metadata:** import from `src/lib/games-config.js` (`GAMES`, `GAMES_MAP`, `getGameName`, `formatCallLabel`, `fmtPct`). Never redefine a local `GAMES` array.
- **SSR safety:** Gatsby renders pages in Node at build time. Guard `window`, `document` and `localStorage` access (`typeof window !== 'undefined'` or inside `useEffect`), and wrap storage access in try/catch.
- **Accessibility:**
  - Interactive elements are real buttons/links with labels.
  - Information isn't conveyed by color alone (pair strength colors with text).
  - Keep the skip-link and focus rings.
  - Mobile-first; test at phone width.

## Engine & strategy rules (important)

- **The engine is pure.** No React, DOM, Gatsby, network or `Math.random()`. Randomness comes from an injected, seedable RNG so games are reproducible in tests and replays. The same engine will run on the server for online play.
- **Write the engine in TypeScript** (`.ts`). Gatsby compiles TS natively. When the first `.ts` file lands, add TypeScript support to Jest (`babel-jest` with `@babel/preset-typescript`) and keep `npm test` green.
- **Model the game as an explicit state machine:** `(state, action) → state`, with per-player views that hide other players' dice. UI, bots and the server all go through the same action interface.
- **Rules changes need tests.** Any change to game matching, kicker comparison, tie handling or round flow gets a Jest test with concrete dice. Add the test first if you can.
- **Odds shown to users must be computed, not guessed.** Prefer exact enumeration (252 sorted rolls / 7,776 ordered) or seeded Monte Carlo with stated sample size. Label anything heuristic as such in the UI.
- `game-validation.js` is loaded both as ESM (Gatsby) and CJS (Node generators, Jest via `jest-strip-esm-export.js`). Keep both export styles working until it's split into `engine/` + `strategy/`.

## Generated data

- `src/data/unique-rolls.json` (252 unique rolls) and `src/data/roll-game-matrix.json` are **generated. Don't hand-edit them.**
- `gatsby-node.js` `onPreBootstrap` regenerates the matrix when the MD5 hash of `generate-roll-game-matrix.js`, `game-validation.js` or `unique-rolls.json` changes (metadata in `src/data/.cache-metadata/`, which is gitignored).
- Commit regenerated JSON together with the logic change that caused it.
- Precomputed odds tables (Phase 2) follow the same pattern: generator script + hash check + committed output.

## Game domain cheat sheet

Full rules: `src/pages/rules.js`; terms: `src/pages/glossary.js`.

- **Players and setup:** 2–8 players, 5 dice each.
- **Piddle:** everyone rolls one die; the highest roll gets the **Hammer**.
- **Each round:**
  1. Everyone rolls and hides their dice.
  2. The Hammer **calls** a game, or **barks** (passes the Hammer left without playing).
  3. The **1st refusal** (Hammer's left) accepts or refuses. If they refuse, the **2nd refusal** (two seats left) accepts or refuses.
  4. If either accepts, everyone plays the call. If both refuse, the Hammer makes a **second call**: a *different game* (not just another variant), with no refusals.
  5. Reveal. The worst hand/**kickers** takes a **pencil** and gets the Hammer next.
- **Ties:** with 3+ players, the tied losers replay; with 2 players, no pencil is taken and the Hammer passes.
- **End:** 3 pencils = out; last player standing wins the pot.
- **Games** (ids from `games-config.js`):
  - `10-2`, `10-3`, `10-4`, `ship-captain-crew`, `monterey`, `vegas` (7's) and `pairs` have high/low variants.
  - `razzle` (1s are wild for 6s), `boss` and `tres-away` are always playable specialty games.
  - `barking` is a non-game entry used for the bark option.

## Git & workflow

- Remote: `git@github-jessebilsten:JesseBilsten/refusal-dice.git`. Always use the `github-jessebilsten` SSH alias; commits must be authored as `jessebilsten <jesse@bilsten.net>`.
- Default branch: `master`. Work on a branch (`feature/…`, `fix/…`, `chore/…`) and merge through a GitHub PR.
- Commit messages: Conventional Commits, matching history (`feat:`, `fix:`, `refactor:`, `chore(deps):`, …).
- Don't commit `/public`, `.cache` or `node_modules`.
- Prefer small PRs that map to a roadmap item; reference the phase/item in the PR description.

## Infrastructure direction (Phase 4, not built yet)

- **Backend:** Supabase (magic-link auth, Postgres with row-level security, Realtime, presence, Edge Functions).
- **Email:** Resend (or Postmark).
- **Site hosting:** stays on Netlify.
- **Server authority:**
  - Dice are rolled server-side with a cryptographically secure RNG.
  - Clients send intents, never state.
  - Hidden dice must never be readable by other players, enforced by row-level security and per-player views, not by UI hiding.
- **Turn emails:**
  - Send only when it's your turn and you're not present.
  - Debounce, include a signed deep link, honor notification preferences, and include a one-click unsubscribe link (List-Unsubscribe header).
- **Secrets:** go in Netlify/Supabase environment settings, never in the repo. Only public keys (e.g. the Supabase anon key) may be exposed to the client.
- Whether to stay on Gatsby or move to Next.js/Vite is an open decision for the start of Phase 4. Don't migrate frameworks before then.
