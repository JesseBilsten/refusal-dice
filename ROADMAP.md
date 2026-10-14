# Refusal Dice — Product Roadmap

_Written 2026-10-14. This is a living document: update it as phases ship or decisions change._

## Goals

1. **New players learn the game as fast as possible.**
2. **Expert players hone their skills** by understanding the odds behind nuanced decisions (call, bark, accept, refuse, second call).
3. **Play against an AI.**
4. **Play against other people online** in a turn-based game that emails you when it's your turn if you're not signed in.

## Guiding principle: one engine, many surfaces

All four goals need the same foundation: **a pure, UI-free model of a full game of Refusal Dice.**

```
            ┌───────────────────────────────┐
            │  engine/ (pure JS/TS, no React) │
            │  rules · round state machine    │
            └───────────────┬───────────────┘
        ┌─────────┬─────────┼──────────┬──────────────┐
   Tutorial   Decision   Practice vs   Online server   Post-game
 (scripted    trainer    AI (bots use  (authoritative   review
   dice)    (set-up spots) strategy/)   referee)
```

- The tutorial drives the engine with scripted dice.
- The trainer drives it with hand-picked situations.
- Bots are policies that act inside it.
- The online server runs the same code as the referee.

Build it once and every later phase gets cheaper.

## State of the project at roadmap time

**Stack:** Gatsby 5 static site, React 18, Tailwind 3 + shadcn/ui (JS, not TSX), Jest. No backend.

**Pages:** Rules, Games (10 games + Barking, with `/games/<id>` detail pages), Glossary, Odds, Odds Lab (added 2026-10-14), Strategy Assistant, Second Call Predictor, three roll-explorer variants, and a "Coming Soon" Practice page.

**Core logic:** `src/lib/game-validation.js` (~2,600 lines) handles game matching (`checkGame`), kicker strength, Boss rank, Tres Away score, Razzle, Hammer call recommendations, refuser advice and second-call prediction. 148 Jest tests pass.

**Known gaps and problems:**

- **Strategy is heuristic, not computed.** Accept/refuse uses percentile cutoffs (e.g. ">70th percentile, accept") and tuning factors. It's fine for orienting a newcomer but not trustworthy for experts.
- **The Strategy Assistant is fixed at 3 players.**
- **No full-game model.** We can evaluate a single roll, but nothing models a round: piddle → Hammer → call/bark → 1st and 2nd refusal → second call → reveal → ties → pencils → elimination.
- **Broken or duplicate navigation.** The mobile nav links to `/strategies` (doesn't exist) and lists "Odds" twice.
- **Old content left in the page.** `games.js` contains a hidden (`display: none`) "OLD Tres away" section.
- **Full page reloads.** Some buttons use `window.location.href` instead of Gatsby `<Link>`/`navigate`.
- **Dead code.** `rolls-explorer`, `rolls-hybrid` and `rolls-original` are three parallel pages; `src/ideas/` holds about 12 abandoned prototypes; `src/pages/rolls.js.archive` is unused.
- **Starter leftovers.** The manifest is still named "gatsby-starter-default" and the README is Gatsby boilerplate.
- **The game list is defined in several places:** `gatsby-node.js`, `second-call-predictor.js`, `generate-roll-game-matrix.js`, `game-validation.js` (`predictHammerSecondCalls`) and `games-config.js`.
- **The Practice page's email signup only does `console.log`.**
- **`npm audit` reports 128 vulnerabilities,** mostly transitive through Gatsby 5.
- **Node version mismatch.** `.nvmrc` pins Node 18 (end of life); the site currently builds fine on Node 25.

---

## Phase 0 — Foundation & cleanup (≈1–2 weeks)

**Goal:** a clean base and a reusable engine.

1. **Cleanup** ✅ _done 2026-10-14. The roll-explorer variants were all deleted because Odds + Odds Lab supersede them; they're recoverable from git history (before commit `3ad9409`)._
   - Delete `src/ideas/`, `rolls.js.archive` and the roll-explorer variants we don't keep (pick one; fold anything good into `/odds`).
   - Remove the "OLD Tres away" section.
   - Fix the mobile nav (`/strategies`, duplicate Odds entry).
   - Replace `window.location.href` with `<Link>`/`navigate`.
   - Fix the manifest name and colors; replace the README with a project README.
2. **One game list.** Every module imports from `src/lib/games-config.js` (including `gatsby-node.js` and the data generators).
3. **Extract the engine** from `game-validation.js`:
   - `src/engine/rules`: playable-game checks, kicker/hand comparison, tie rules. Pure functions.
   - `src/engine/round`: an explicit state machine (states + actions + reducer) for a full game: piddle, Hammer, call, bark, 1st/2nd refusal, second call (must be a *different game*, not just a variant), reveal, loser takes a pencil and the Hammer, ties (3+ players replay; 2 players no pencil), 3 pencils = out, last player standing wins.
   - `src/strategy/`: the current recommendation logic, moved as-is for now.
   - Engine code has **no React, no DOM, no Gatsby** so a server can import it later. Use TypeScript for the engine (see `CLAUDE.md`).
   - Seedable RNG passed in (never `Math.random()` inside the engine) so games are replayable and testable.
4. **Node version.** Move `.nvmrc` to the current LTS and verify Gatsby builds on it.
5. **Deploys.** Confirm Netlify builds from `master` with preview deploys on PRs; add a `netlify.toml` so the setup lives in the repo.
6. **CI.** GitHub Action running tests + build on every PR.

**Done when:** the engine can play a full scripted game in a Jest test, every page still works, and nav has no dead links.

## Phase 1 — Learn fast (new players)

**Goal:** someone who has never played can play a round with friends after ~5 minutes on the site.

1. **Interactive first round.** A guided tutorial on the engine with scripted dice, explaining each step in context instead of asking people to read the rules first.
2. **"What can I call?" as the centerpiece.** Tap your five dice and see the playable games and hand strength. The logic exists in `games.js` and the Strategy Assistant; give it a fast, mobile-first screen and make it prominent on the homepage.
3. **Inline jargon.** Use the existing `Term` component everywhere: Hammer, kicker, pencil, bark, piddle, parity, refusal.
4. **Micro-drills.** Quick quizzes with instant feedback: "Which games does this roll make?", "Who takes the pencil?", "Is this second call legal?"
5. **Simpler information architecture:** **Learn / Practice / Analyze / Play** replaces the current seven tool pages.

**Measure:** time from landing to finishing the tutorial; tutorial completion rate.

## Phase 2 — Hone skills (experts)

**Goal:** the odds behind every decision are exact (or tightly simulated), explained, and practicable.

1. **A real odds engine.** There are only 252 distinct sorted rolls (7,776 ordered), so exact enumeration or tight Monte Carlo is cheap. Compute the **probability of taking the pencil** for each option by:
   - decision (call X / bark / accept / refuse / second call)
   - roll
   - called game and variant
   - seat (Hammer, 1st refusal, 2nd refusal, other)
   - player count (2–8)
   - opponent policy assumption

   Precompute the tables at build time, as `roll-game-matrix.json` is today (hash-based regeneration in `gatsby-node.js`).
2. **Odds Lab — shipped 2026-10-14** (`/odds-lab`, `src/lib/roll-query.js`).
   - **What it does:** users build any roll query from 1–5 dice and see exact odds live, as every outcome lights up or fades.
     - Requirement types: specific dice, runs, of-a-kinds, sums, per-die limits and counts.
     - Combining: requirements within a pattern use their own dice (AND); multiple patterns are alternatives (OR); "remaining dice" means the kickers.
   - **Checks the site:** queries can be compared with the site's own game definitions (`checkGame`), and differing rolls are outlined. The game presets are verified against `checkGame` on all 7,776 rolls in Jest.
   - **Follow-ups:**
     - Specialty-game scoring rules (Razzle wilds as a "count toward" rule, Boss rank, Tres Away score).
     - Conditional odds ("given I hold X, chance my re-roll makes Y"), which leads into the trainer.
     - "Beat a hand" queries, comparing against N opponents.
3. **Decision trainer.** Show a situation, take the player's decision, then reveal the odds of every option and the trade-off in plain words. Example: "Refusing costs you 4% now but dodges a 30% second-call risk."
4. **Player-count aware everywhere** (2–8), especially the Strategy Assistant.
5. **Personal stats** in `localStorage`: accuracy by decision type, and weak spots to drill.
6. Retire or re-base the heuristic thresholds in `strategy/` once the computed odds exist. Keep the heuristics only as the "novice/solid" bot policies.

**Measure:** trainer sessions per returning user; accuracy improvement over time.

## Phase 3 — Play vs AI

1. **Full game table UI** on the engine, 2–7 bots. Show dice animations, whose turn it is, pencils and Hammer position clearly.
2. **Bot difficulty levels:**
   - **Novice:** simple rules of thumb, some randomness.
   - **Solid:** today's heuristics.
   - **Expert:** the Phase 2 odds engine.

   Bots see only their own dice (the engine enforces information hiding through per-player views).
3. **Post-game review.** Annotate each human decision, highlight the costliest mistakes, and deep-link into the Phase 2 trainer for that situation.
4. Works signed-out; games saved in `localStorage`.

## Phase 4 — Online async multiplayer with email turn alerts

1. **Backend (recommended):** **Supabase**, which covers:
   - sign-in by emailed magic link
   - a Postgres database
   - real-time updates for players who are online
   - presence (who's online)
   - Edge Functions for server logic

   Plus **Resend** (or Postmark) for transactional email. Site hosting stays on Netlify.
2. **The server is authoritative:**
   - The server rolls the dice with a cryptographically secure RNG and runs the shared engine to validate every action.
   - Hidden hands **never** reach other clients; Supabase row-level security enforces it, with per-player game views.
   - Clients send intents ("accept", "call 10-2 high"), never state.
3. **Turn flow:**
   - Rolls happen simultaneously; decisions are sequential.
   - Email only when it's your turn **and** you're not online (presence check), with a short delay so quick back-and-forths don't spam.
   - Each email has a one-click, signed link straight back into the game.
   - Nudges, then a configurable turn timeout (auto-action or forfeit) so one player can't stall a game.
   - Invite links; per-user notification preferences; a one-click unsubscribe link (List-Unsubscribe header) in every email.
4. **Framework decision point** (decide at the start of this phase, not before). Gatsby is fine for content but awkward for an authenticated app. Options:
   - Keep Gatsby for content and add a client-only `/play/*` app section.
   - Migrate to Next.js or Vite + React.

   The engine being framework-free keeps either path cheap.

## Phase 5 — Ongoing polish

- Installable app (PWA) with offline support for Learn/Practice/Analyze.
- Accessibility pass (WCAG 2.1 AA): keyboard play, screen-reader dice announcements, color-independent indicators.
- Privacy-friendly analytics to track time-to-first-round and trainer engagement.
- Dependency hygiene: reduce the `npm audit` backlog; revisit Gatsby's long-term viability.

---

## Open questions

1. **House rules:** should the ante, extra money at parity, and barking be configurable settings, or are we encoding one canonical ruleset?
2. **Player counts:** support 2–8 everywhere? (The 2-player tie rule already differs.)
3. **Accounts:** confirm AI play works fully signed-out, with accounts required only for online play.
4. **Money:** do we track the pot/ante in online games, or only pencils?

## Decision log

| Date | Decision | Notes |
|---|---|---|
| 2026-10-14 | Build a pure, shared game engine before any new feature surfaces | Powers the tutorial, trainer, AI and online server |
| 2026-10-14 | Defer the framework choice (Gatsby vs Next/Vite) to the start of Phase 4 | Engine is framework-free either way |
| 2026-10-14 | Supabase + Resend as the default plan for online play | Revisit at Phase 4 |
| 2026-10-14 | Commit directly to `master` while there's a single developer | Switch to PRs when collaborators join |
| 2026-10-14 | Odds Lab ships ahead of Phase 0 | Self-contained (`roll-query.js` is pure and tested), so it doesn't block or depend on the engine split |
