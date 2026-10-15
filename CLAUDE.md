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
npm run typecheck # tsc over the TypeScript engine
npm run format    # Prettier
```

Run `npm run typecheck`, `npm test` and `npm run build` before calling work done. A change isn't verified until the build passes.

## Stack

- **Gatsby 5** (static site generation), **React 18**
- **Tailwind CSS 3** + **shadcn/ui** (JavaScript variant, `components.json`; generated components live in `src/components/ui/`)
- **Radix UI** primitives, **lucide-react** icons, **framer-motion** for animation
- **Jest** for tests
- Hosting: **Netlify**, configured by `netlify.toml` (build `npm run build`, publish `public`; Gatsby's Netlify adapter is installed automatically).
- Node: `.nvmrc` pins **24** (LTS). Gatsby 5 supports Node 18–25.
- CI: GitHub Actions (`.github/workflows/ci.yml`) runs `npm test`, `npm run build` and checks that regenerated `src/data` is committed, on every push to `master` and every PR.

## Layout

```
src/
  pages/            Gatsby file-based routes (one file = one URL)
  templates/        game-detail.js → /games/<id> (created in gatsby-node.js)
  components/       App components; ui/ = shadcn primitives; nav-items.js = site navigation
                    Dice/ = SVG die faces, opt-in 3D dice and sound (useDicePrefs; both off by default)
                    Tutorial/ = the /learn guided round (script.ts holds its scripted dice)
                    Odds/ = the odds-decision pattern (verdict, comparison bars, outcome grid, math, questions)
  lib/
    games-config.js     SINGLE SOURCE OF TRUTH for the game list and metadata (CommonJS; also used by gatsby-node.js and generators)
    game-validation.js  Rules + heuristic strategy (being split up, see below)
    roll-strength.js    Rarity/strength classification
    roll-query.js       Odds Lab query engine: exact odds for any dice requirement (pure, CommonJS)
    utils.js            cn() class merger
  data/             Generated JSON + the generator scripts
  __tests__/        Jest tests
  styles/global.css Tailwind layers + CSS color tokens (light/dark)
```

### Game engine (`src/engine/`, TypeScript)

```
src/engine/
  types.ts         Die, Call, HouseRules, EngineError
  dice-source.ts   Seeded (mulberry32) or scripted dice; pure
  rules/           Kicker games (making the game, kicker totals, a cycle's loser) and
                   specialty-games.ts (Tres Away score, Razzle score, Boss poker hands)
  round/game.ts    Full game: createGame / applyAction (reducer) / viewFor (hidden info)
  index.ts         Public API; import from '../engine'
```

All ten games are playable. Kicker games and Razzle use the `play` phase (simultaneous rolls); Tres Away (`tresAway` phase: `putOut`/`roll`, caller-paced) and Boss (`boss` phase: hidden Boss roll, `comeUp`/`dontComeUp`) have their own phases. `viewFor` hides what a player mustn't see, including redacting other players' hidden rolls from the log.

### Strategy (`src/strategy/`, TypeScript)

```
src/strategy/
  make-odds.ts   Exact chance of making a kicker game with optimal keeps (DP over the 252 sorted hands)
  bots.ts        "Solid" heuristic bot: call, refuse and play decisions for every game (botAction)
  simulate.ts    Seeded Monte Carlo through the engine: your chance of the pencil per decision
                 (simulateHammer, simulateRefusal); common random numbers across options
```

Simulated odds mean "against (and as) solid bots". Show the sample size and that assumption wherever they appear. Strategy code may only read what its player could see.

## Code style

- **Prettier:** no semicolons, single quotes, ES5 trailing commas (`.prettierrc`). Some older files (`game-validation.js`, `gatsby-node.js`) still use semicolons. Follow the file you're in, and format files you substantially rewrite.
- **Components:** function components + hooks; `.jsx` for components, `.js` for pages (existing convention). PascalCase component files or `Component/index.js` folders.
- **Imports:** use relative imports. `jsconfig.json` declares an `@/` alias for editors, but Gatsby's webpack isn't configured for it, so `@/` imports fail the build.
- **Styling:**
  - Tailwind utilities only.
  - Use the semantic color tokens (`bg-background`, `text-foreground`, `text-muted-foreground`, `bg-primary`, `border-border`, …) from `tailwind.config.js`/`global.css`, never raw hex values.
  - Dark mode is class-based (`darkMode: 'class'`); check that every new UI works in both themes.
  - Merge classes with `cn()` from `src/lib/utils.js`.
- **UI primitives:** reuse `src/components/ui/*` before writing new ones; add new shadcn components with the shadcn CLI (JS, not TSX) so they match.
- **Navigation:** always use Gatsby `<Link>` or `navigate()`. Never `window.location.href` for internal routes. For a link that looks like a button, use `<Link className={buttonVariants({ variant, size })}>`. Add new pages to `src/components/nav-items.js`, which feeds both the header and the mobile menu.
- **Game metadata:** import from `src/lib/games-config.js` (`GAMES`, `CALLABLE_GAMES`, `KICKER_GAME_IDS`, `GAMES_MAP`, `getGameName`, `getGameFullName`, `formatCallLabel`, `fmtPct`). Never redefine a local `GAMES` array. (The one exception left is inside `game-validation.js`, which can't import it until the engine split.)
- **SSR safety:** Gatsby renders pages in Node at build time. Guard `window`, `document` and `localStorage` access (`typeof window !== 'undefined'` or inside `useEffect`), and wrap storage access in try/catch.
- **Accessibility:**
  - Interactive elements are real buttons/links with labels.
  - Information isn't conveyed by color alone (pair strength colors with text).
  - Keep the skip-link and focus rings.
  - Mobile-first; test at phone width.

## Engine & strategy rules (important)

- **The engine is pure.** No React, DOM, Gatsby, network or `Math.random()`. Randomness comes from an injected, seedable RNG so games are reproducible in tests and replays. The same engine will run on the server for online play.
- **The engine is TypeScript** (`.ts`, `strict`). Gatsby compiles it natively. Jest compiles it with `babel-jest` using an **inline** config in `jest.config.js`. Don't add a project-level `babel.config.js` or `.babelrc`, because Gatsby would pick it up and change how the site builds. Engine tests are `src/__tests__/engine-*.test.ts`.
- **Model the game as an explicit state machine:** `(state, action) → state`, with per-player views that hide other players' dice. UI, bots and the server all go through the same action interface.
- **Rules changes need tests.** Any change to game matching, kicker comparison, tie handling or round flow gets a Jest test with concrete dice. Add the test first if you can.
- **Present decision odds with the odds-decision pattern** (`src/components/Odds`). Follow the `explain-odds` skill (`.claude/skills/explain-odds/SKILL.md`). Improve the pattern there rather than building a one-off.
- **Odds shown to users must be computed, not guessed.** Prefer exact enumeration (252 sorted rolls / 7,776 ordered) or seeded Monte Carlo with stated sample size. Label anything heuristic as such in the UI.
- `roll-query.js` is CommonJS (`module.exports`) so Jest can load it without a Babel config; Gatsby/webpack imports it fine with named imports. Its game presets must keep matching `checkGame`; the Jest suite enforces this on all 7,776 rolls.
- **Game odds are computed, never typed in.** `SINGLE_ROLL_ODDS` in `game-validation.js` counts each kicker game with `checkGame` over all 7,776 rolls. A hardcoded copy once left 10-3 at 53.43% instead of 63.85%.
- **Data generators must be deterministic.** Use a seeded PRNG (see `generate-unique-rolls.js`), never `Math.random()`, so regenerating only changes what the logic change caused.
- `game-validation.js` is loaded both as ESM (Gatsby) and CJS (Node generators, Jest via `jest-strip-esm-export.js`). Keep both export styles working until it's split into `engine/` + `strategy/`.

## Generated data

- `src/data/unique-rolls.json` (252 unique rolls) and `src/data/roll-game-matrix.json` are **generated. Don't hand-edit them.**
- `gatsby-node.js` `onPreBootstrap` regenerates the matrix when the MD5 hash of `generate-roll-game-matrix.js`, `game-validation.js` or `unique-rolls.json` changes (metadata in `src/data/.cache-metadata/`, which is gitignored).
- Commit regenerated JSON together with the logic change that caused it.
- Precomputed odds tables (Phase 2) follow the same pattern: generator script + hash check + committed output.

## Game domain cheat sheet

**Authoritative rules: [`docs/RULES.md`](docs/RULES.md)** (the engine and its tests follow it; player-facing pages must agree with it). Player-facing copy: `src/pages/rules.js`, `src/pages/games.js`, `src/pages/glossary.js`.

- **Players and setup:** 2–8 players, 5 dice each.
- **Piddle:** everyone rolls one die; the highest roll gets the **Hammer**.
- **Each round:**
  1. Everyone rolls and hides their dice.
  2. The Hammer **calls** a game, or **barks** (passes the Hammer left without playing).
  3. The **1st refusal** (Hammer's left) accepts or refuses. If they refuse, the **2nd refusal** (two seats left) accepts or refuses.
  4. If either accepts, everyone plays the call. If both refuse, the Hammer makes a **second call**: a *different game* (not just another variant), with no refusals.
  5. Reveal. The worst hand/**kickers** takes a **pencil** and gets the Hammer next.
- **Kicker** (singular): all the dice left after making the game, as one total. It's re-rolled whole, never in part. Write "a kicker of 6+1", not "kickers".
- **Ties:** with 3+ players, the tied losers replay; with 2 players, no pencil is taken and the Hammer passes.
- **End:** 3 pencils = out; last player standing wins the pot.
- **Games** (ids from `games-config.js`):
  - `10-2`, `10-3`, `10-4`, `ship-captain-crew`, `monterey`, `vegas` (7's) and `pairs` have high/low variants.
  - `razzle` (1s wild; most of one number, higher face breaks equal counts), `boss` (poker hands) and `tres-away` (lowest total, 3s = 0) are specialty games with no variant.
  - `barking` is a non-game entry used for the bark option.

## Git & workflow

- Remote: `git@github-jessebilsten:JesseBilsten/refusal-dice.git`. Always use the `github-jessebilsten` SSH alias; commits must be authored as `jessebilsten <jesse@bilsten.net>`.
- Default branch: `master`. While there's a single developer, **commit directly to `master`** and push. Once collaborators join, switch to branches (`feature/…`, `fix/…`, `chore/…`) merged through GitHub PRs.
- Commit messages: Conventional Commits, matching history (`feat:`, `fix:`, `refactor:`, `chore(deps):`, …).
- Don't commit `/public`, `.cache` or `node_modules`.
- Keep commits small and mapped to a roadmap item where possible.

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
