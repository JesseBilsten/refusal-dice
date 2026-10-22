---
name: design-system
description: Build or change any Refusal Dice UI from the shared design system (the live site at /design, src/design-system/registry.js, docs/DESIGN_SYSTEM.md): page frame (Page, PageHeader), dice (Die, Hand, RollInput), odds (OddsDecision and friends), ui primitives, color tokens and type roles. Use before adding UI, whenever a pattern repeats, and before proposing a new component or theme change.
---

# Using the design system

1. **Look first.** Open `/design` (or read `src/design-system/registry.js`
   and `docs/DESIGN_SYSTEM.md`). Search for a piece that does the job.
2. **Reach for the shared piece:**
   - **Pages:** `Page` with a width (`reading`, `tool`, `wide`) and
     `PageHeader`; `Panel` (default, tool, note, `collapsible`), `Stat`
     (`plain` inside a Panel), `PageTabs`, `Chip`, `NextStep`. Never set a
     page's own `max-w-*`; never nest panels; pages and templates define no
     components of their own and render no raw buttons, inputs, selects or
     tables.
   - **Players at a table:** `Seat`, `TableFelt`, `Standings`, `TableOrder`.
   - **Dice:** `Hand` for any roll shown for a game, `RollInput` wherever
     the player edits a roll, and `Die` otherwise. Never write a roll as
     text.
   - **Odds:** the odds kit, following the `explain-odds` skill.
   - **Buttons, badges, tables, alerts:** `src/components/ui`.
   - **Colors:** semantic, brand, odds and dice tokens only.
   - **Type:** headings use a role (`text-display`, `text-title`,
     `text-section`, `text-heading`, `text-subheading`) or `eyebrow`; text
     sizes `2xs`–`2xl` only.
   - **Copy:** the writing guide at `/design/writing/`: "tap", sentence
     case, curly quotes, game names from games-config, computed numbers
     with their source.
3. **If a piece almost fits, improve it** (add a prop or a size), so every
   use benefits. Don't fork a local copy.
4. **Something new, or a pattern showing up a second time:**
   - build it in the right kit folder (pure logic in a `.ts` beside it,
     with a Jest test);
   - add it to `src/design-system/registry.js` with `status: 'proposed'`
     and `replaces`, and a live example in `src/design-system/examples.jsx`
     (or `liveAt` for a whole page);
   - show its page (`/design/<id>/`) to the owner in light, dark and at
     390px, and **wait for their approval**. Never set `approved` yourself;
     the tests block proposed pieces outside the design system until then.
5. **When you touch a page with a listed one-off,** fold it into the
   system and remove it from the "Known one-offs" list.
6. **Theme changes:** try them in the playground (`/design/theming/`),
   then put the copied CSS in `src/styles/global.css` on a branch.
7. **Check** `/design` after changing a kit, run
   `npx jest src/__tests__/design-system.test.ts`, and look at every place
   the component appears: 390px wide, light and dark, 3D dice on and off.
8. **Ship** through a branch and pull request with a version bump
   (`docs/WORKFLOW.md`).

Avoid filenames that differ only by case: `hand.ts` next to `Hand.jsx`
breaks on macOS. Use names like `hand-groups.ts`.

`gatsby-node.js` creates a page per registry entry, so a new entry needs a
dev server restart to get its page.
