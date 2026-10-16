---
name: design-system
description: Build or change any Refusal Dice UI from the shared design system (docs/DESIGN_SYSTEM.md): page frame (Page, PageHeader), dice (Die, Hand, DiceGroup, RollInput), odds (OddsDecision and friends), ui primitives and color tokens. Use before adding UI, and whenever a pattern repeats.
---

# Using the design system

1. Read `docs/DESIGN_SYSTEM.md` before writing UI.
2. Reach for the shared piece first:
   - **Pages:** `Page` with a width (`reading`, `tool`, `wide`) and
     `PageHeader`. Never set a page's own `max-w-*`.
   - **Dice:** `Hand` for any roll shown for a game, `RollInput` wherever
     the player edits a roll, and `Die` otherwise. Never write a roll as
     text.
   - **Odds:** the odds kit, following the `explain-odds` skill.
   - **Buttons, badges, cards, tables and dialogs:** `src/components/ui`.
   - **Colors:** semantic, odds and rarity tokens only, no raw palette
     colors.
3. **If a piece almost fits, improve it** (add a prop or a size), so every
   use benefits. Don't fork a local copy.
4. **When a pattern shows up a second time,** extract it:
   - into `src/components/Dice` or `src/components/Odds`, or a new kit
     folder;
   - with pure logic in a `.ts` file next to it and a Jest test.

   Then list it in `docs/DESIGN_SYSTEM.md`.
5. **When you touch a page with a listed one-off,** fold it into the
   system and remove it from the "Known one-offs" list.
6. **Check the change everywhere the component appears.** Use 390px wide,
   light and dark mode, and the 3D dice setting both on and off.

Avoid filenames that differ only by case: `hand.ts` next to `Hand.jsx`
breaks on macOS. Use names like `hand-groups.ts`.
