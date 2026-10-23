/**
 * THE DESIGN SYSTEM REGISTRY: every foundation, component and pattern the
 * site renders, with its status. One list drives the design system site
 * (/design, its sidebar and a page per entry, built by gatsby-node.js) and
 * the guard tests (src/__tests__/design-system.test.ts), which fail when a
 * component file isn't listed here or when code uses one that isn't
 * approved.
 *
 * Status:
 *  - proposed: on the design system site for review; only the design system
 *    may render it until it's approved
 *  - approved: use it anywhere
 *  - deprecated: kept for reference; nothing may import it
 *
 * A component is approved when the site owner says so: Claude never flips
 * a status on its own. Record the date and version (docs/WORKFLOW.md).
 *
 * CommonJS, so gatsby-node.js and Jest can read it as plain data.
 */

const SECTIONS = [
  { id: 'overview', title: 'Overview' },
  { id: 'foundations', title: 'Foundations' },
  { id: 'components', title: 'Components' },
  { id: 'patterns', title: 'Patterns' },
]

/** Component groups, in sidebar order (modelled on Ant Design's) */
const GROUPS = {
  components: [
    'General',
    'Layout',
    'Navigation',
    'Data entry',
    'Data display',
    'Dice',
    'Table',
    'Odds',
    'Feedback',
  ],
  patterns: ['Site', 'Play', 'Learn', 'Games', 'Odds Lab', 'Strategy'],
}

const A = 'approved'
const P = 'proposed'
const D = 'deprecated'

// Shorthand: c(id, title, group, source, exports, summary, extra)
const c =
  (section) =>
  (id, title, group, source, exports, summary, extra = {}) => ({
    id,
    title,
    section,
    group,
    source,
    exports,
    summary,
    status: A,
    ...extra,
  })
const comp = c('components')
const pat = c('patterns')

const DOCS = [
  /* ── Overview ── */
  {
    id: 'introduction',
    title: 'Introduction',
    section: 'overview',
    status: A,
    summary: 'What the design system is, and how to use this site.',
  },
  {
    id: 'principles',
    title: 'Principles',
    section: 'overview',
    status: A,
    summary: 'The few ideas every screen follows.',
  },
  {
    id: 'contributing',
    title: 'Proposing a pattern',
    section: 'overview',
    status: A,
    summary: 'How a new component or pattern gets approved before it’s used.',
  },

  /* ── Foundations ── */
  {
    id: 'color',
    title: 'Color',
    section: 'foundations',
    status: A,
    summary:
      'Semantic, brand and odds tokens, in light and dark, with their contrast.',
  },
  {
    id: 'typography',
    title: 'Typography',
    section: 'foundations',
    status: A,
    summary: 'Two families, a short type scale and five heading roles.',
  },
  {
    id: 'layout',
    title: 'Layout and spacing',
    section: 'foundations',
    status: A,
    summary: 'Page widths, the 4px spacing grid and how sections group.',
  },
  {
    id: 'shape',
    title: 'Shape and elevation',
    section: 'foundations',
    status: A,
    summary: 'Corner radius, borders and shadows.',
  },
  {
    id: 'motion',
    title: 'Motion',
    section: 'foundations',
    status: A,
    summary: 'Short, purposeful animation that respects reduced motion.',
  },
  {
    id: 'icons',
    title: 'Icons and emoji',
    section: 'foundations',
    status: A,
    summary: 'Lucide icons for actions, each game’s emoji for the game.',
  },
  {
    id: 'writing',
    title: 'Writing style',
    section: 'foundations',
    status: A,
    summary:
      'How the site talks: plain words, the game’s own terms, computed numbers.',
  },
  {
    id: 'accessibility',
    title: 'Accessibility',
    section: 'foundations',
    status: A,
    summary: 'Contrast, keyboard, screen readers, touch targets.',
  },
  {
    id: 'theming',
    title: 'Theme playground',
    section: 'foundations',
    status: A,
    summary:
      'Try new colors, fonts, type sizes and radius live, without a rebuild.',
  },

  /* ── Components: General ── */
  comp(
    'button',
    'Button',
    'General',
    'components/ui/button.jsx',
    ['Button', 'buttonVariants'],
    'An action. One primary (filled) button per view; outline and ghost for the rest. `buttonVariants` styles a link as a button.'
  ),
  comp(
    'chip',
    'Chip',
    'General',
    'components/Page/Chip.jsx',
    ['Chip'],
    'A choice you tap: a game, a count, an example question. `active` marks the chosen one; `to` makes it a link that looks the same.'
  ),
  comp(
    'choice-group',
    'ChoiceGroup',
    'General',
    'components/Page/ChoiceGroup.jsx',
    ['ChoiceGroup'],
    'Pick one of a few options: a labelled row of Chips with radio semantics. `size="lg"` for a page’s main choices (44px targets).',
    { status: A, approved: '2026-10-22', replaces: 'Play setup’s own pill buttons' }
  ),
  comp(
    'badge',
    'Badge',
    'General',
    'components/ui/badge.jsx',
    ['Badge'],
    'A short label that isn’t tappable: “Your roll plays it”, a count, “internal”.'
  ),
  comp(
    'text-link',
    'TextLink and Term',
    'General',
    'components/Page/TextLink.jsx',
    ['TextLink', 'Term'],
    'A link inside running text; `Term` links a game term to its Glossary entry.',
    {
      status: A, approved: '2026-10-22',
      replaces:
        'The Rules page’s `L`, the tutorial’s `T`, 70 hand-styled Glossary links, and the empty `Term`',
    }
  ),
  comp(
    'game-link',
    'GameLink and CallName',
    'General',
    'components/GameLink.jsx',
    ['GameLink', 'CallName'],
    'A game’s name linking to its page; `CallName` names a call the same way everywhere: emoji, name and variant.'
  ),
  comp(
    'step-number',
    'StepNumber',
    'General',
    'components/Page/StepNumber.jsx',
    ['StepNumber'],
    'A step’s number in a filled circle.'
  ),

  /* ── Components: Layout ── */
  comp(
    'page',
    'Page and PageHeader',
    'Layout',
    'components/Page/index.jsx',
    ['Page', 'PageHeader', 'Container', 'PAGE_WIDTHS'],
    'The page frame: a width (reading, tool, wide), then the header: breadcrumbs, title, description.'
  ),
  comp(
    'panel',
    'Panel and Stat',
    'Layout',
    'components/Page/Panel.jsx',
    ['Panel', 'Stat'],
    'A section in a box (default, tool, note; optionally collapsible), and a headline number (`plain` inside a Panel).'
  ),
  comp(
    'step-panel',
    'StepPanel',
    'Layout',
    'components/Page/StepPanel.jsx',
    ['StepPanel'],
    'One numbered step: a Panel titled with its StepNumber.',
    { status: A, approved: '2026-10-22', replaces: 'The Rules page’s local `Step`' }
  ),
  comp(
    'field',
    'Field and EmptyState',
    'Layout',
    'components/Page/Field.jsx',
    ['Field', 'EmptyState'],
    'A labelled control with an optional hint; and the dashed box where a result will appear.',
    { status: A, approved: '2026-10-22', replaces: 'The keep advisor’s local `Field` and `Empty`' }
  ),
  comp(
    'site-layout',
    'Layout',
    'Layout',
    'components/layout.js',
    ['Layout'],
    'Every page’s shell: skip link, header, main, footer.',
    { liveAt: '/' }
  ),

  /* ── Components: Navigation ── */
  comp(
    'header',
    'Header',
    'Navigation',
    'components/header.js',
    ['Header'],
    'The site bar: logo, the navigation in its three groups, settings.',
    { liveAt: '/' }
  ),
  comp(
    'mobile-nav',
    'MobileNav',
    'Navigation',
    'components/MobileNav.jsx',
    ['MobileNav'],
    'The menu on phones: the same groups, then Settings.',
    { liveAt: '/' }
  ),
  comp(
    'footer',
    'Footer',
    'Navigation',
    'components/Footer/index.js',
    ['Footer'],
    'The site map in the navigation’s groups, then the credit.',
    { liveAt: '/' }
  ),
  comp(
    'page-tabs',
    'PageTabs',
    'Navigation',
    'components/Page/PageTabs.jsx',
    ['PageTabs', 'tabFromUrl'],
    'Top-level tools on one page, kept in `?tab=`.'
  ),
  comp(
    'next-step',
    'NextStep',
    'Navigation',
    'components/Page/NextStep.jsx',
    ['NextStep'],
    'The next stop on the site’s path, at the foot of a page.'
  ),

  /* ── Components: Data entry ── */
  comp(
    'roll-input',
    'RollInput',
    'Data entry',
    'components/Dice/RollInput.jsx',
    ['RollInput'],
    'Anywhere a player enters or edits a roll.'
  ),
  comp(
    'roll-button',
    'RollButton',
    'Data entry',
    'components/Dice/RollButton.jsx',
    ['RollButton'],
    'The one Roll button: dice icon and “Roll”.'
  ),
  comp(
    'native-select',
    'NativeSelect',
    'Data entry',
    'components/ui/native-select.jsx',
    ['NativeSelect'],
    'The one dropdown: a native select, so it opens the phone’s own picker.',
    {
      status: A, approved: '2026-10-22',
      replaces:
        'Two local selects in the Odds Lab (`NumberSelect`, `NativeSelect`)',
    }
  ),
  comp(
    'input',
    'Input',
    'Data entry',
    'components/ui/input.jsx',
    ['Input'],
    'A text box (the Glossary search).'
  ),
  comp(
    'label',
    'Label',
    'Data entry',
    'components/ui/label.jsx',
    ['Label'],
    'A form label for a Switch or Input.'
  ),
  comp(
    'switch',
    'Switch',
    'Data entry',
    'components/ui/switch.jsx',
    ['Switch'],
    'An on/off setting that applies right away.'
  ),
  comp(
    'toggle-group',
    'ToggleGroup',
    'Data entry',
    'components/ui/toggle-group.jsx',
    ['ToggleGroup', 'ToggleGroupItem'],
    'A boxed segmented control for a setting: theme, Play’s speed, a variant filter.'
  ),
  comp(
    'slider',
    'Slider',
    'Data entry',
    'components/ui/slider.jsx',
    ['Slider'],
    'A value on a range. Prefer visible choices (ToggleGroup) when there are only a few.'
  ),
  comp(
    'select',
    'Select',
    'Data entry',
    'components/ui/select.jsx',
    [],
    'The shadcn custom select. Use NativeSelect.',
    { status: D }
  ),
  comp(
    'variant-selector',
    'VariantSelector',
    'Data entry',
    'components/VariantSelector.jsx',
    ['VariantSelector'],
    'All, High or Low, for anything shown per variant.'
  ),
  comp(
    'dice-settings',
    'DiceSettings',
    'Data entry',
    'components/Dice/DiceSettings.jsx',
    ['DiceSettings'],
    'The 3D dice and sound switches.'
  ),
  comp(
    'settings',
    'Settings',
    'Data entry',
    'components/Settings/Settings.jsx',
    ['Settings'],
    'Every site-wide setting as one block.'
  ),
  comp(
    'settings-menu',
    'SettingsMenu',
    'Data entry',
    'components/Settings/SettingsMenu.jsx',
    ['SettingsMenu'],
    'The header’s gear: Settings in a popover.',
    { liveAt: '/' }
  ),
  comp(
    'house-rule-settings',
    'HouseRuleSettings',
    'Data entry',
    'components/Settings/HouseRuleSettings.jsx',
    ['HouseRuleSettings'],
    'The house-rule switches, each with what “off” means.'
  ),

  /* ── Components: Data display ── */
  comp(
    'table',
    'Table',
    'Data display',
    'components/ui/table.jsx',
    ['Table', 'TableBody', 'TableCell', 'TableHead', 'TableHeader', 'TableRow'],
    'Rows of figures (sample rolls, comebacks).'
  ),
  comp(
    'card',
    'Card',
    'Data display',
    'components/ui/card.jsx',
    ['Card'],
    'The shadcn card. Use Panel.',
    { status: D }
  ),
  comp(
    'tabs',
    'Tabs',
    'Data display',
    'components/ui/tabs.jsx',
    ['Tabs'],
    'The shadcn tabs. Use PageTabs.',
    { status: D }
  ),
  comp(
    'strength-tag',
    'StrengthTag',
    'Data display',
    'components/Odds/StrengthTag.jsx',
    ['StrengthTag'],
    'How strong a roll is for a call: Strong, Good, Fair or Weak, with the number.'
  ),

  /* ── Components: Dice ── */
  comp(
    'die',
    'Die',
    'Dice',
    'components/Dice/Die.jsx',
    ['Die', 'DIE_SIZES'],
    'One die, flat or 3D, in four sizes.'
  ),
  comp(
    'die-face',
    'DieFace',
    'Dice',
    'components/Dice/DieFace.jsx',
    ['DieFace'],
    'The flat SVG face on its own (the logo, and inside Die).'
  ),
  comp(
    'die-slot',
    'DieSlot',
    'Dice',
    'components/Dice/DieSlot.jsx',
    ['DieSlot'],
    'An empty slot for a die not rolled or entered yet.'
  ),
  comp(
    'hand',
    'Hand',
    'Dice',
    'components/Dice/Hand.jsx',
    ['Hand'],
    'A roll for a game: the game’s dice outlined and named, the kicker dashed with its total.'
  ),
  comp(
    'dice-group',
    'DiceGroup',
    'Dice',
    'components/Dice/DiceGroup.jsx',
    ['DiceGroup'],
    'A hand-picked group of dice with a label, when the grouping is authored.'
  ),

  /* ── Components: Table ── */
  comp(
    'table-felt',
    'TableFelt',
    'Table',
    'components/Table/TableFelt.jsx',
    ['TableFelt'],
    'The table: green felt in a wood rail.'
  ),
  comp(
    'seat',
    'Seat',
    'Table',
    'components/Table/Seat.jsx',
    ['Seat'],
    'One player at the table: name, roles, pencils, dice, their latest move, the turn outline.'
  ),
  comp(
    'seat-ring',
    'SeatRing',
    'Table',
    'components/Table/SeatRing.jsx',
    ['SeatRing'],
    'The table from above, each seat with a chance.'
  ),
  comp(
    'standings',
    'Standings',
    'Table',
    'components/Table/Standings.jsx',
    ['Standings', 'STANDING_STATUS'],
    'The ranking pattern: players best first, with a status chip.'
  ),
  comp(
    'table-order',
    'TableOrder',
    'Table',
    'components/Table/TableOrder.jsx',
    ['TableOrder'],
    'The order of play, fixed all game, with the Hammer token moving down it.'
  ),
  comp(
    'dice-cup',
    'DiceCup',
    'Table',
    'components/Table/DiceCup.jsx',
    ['DiceCup'],
    'Dice picked up: a player in the cup, or your dice before you roll.'
  ),

  /* ── Components: Odds ── */
  comp(
    'odds-decision',
    'OddsDecision',
    'Odds',
    'components/Odds/OddsDecision.jsx',
    ['OddsDecision', 'Swatch'],
    'A decision’s options as comparison bars, verdict first.'
  ),
  comp(
    'probability-bar',
    'ProbabilityBar',
    'Odds',
    'components/Odds/ProbabilityBar.jsx',
    ['ProbabilityBar'],
    'One chance as a labelled bar.'
  ),
  comp(
    'rolls-pct',
    'RollsPct',
    'Odds',
    'components/Odds/RollsPct.jsx',
    ['RollsPct'],
    'A chance that depends on rolls left; tap to compare 1 and 2.'
  ),
  comp(
    'outcome-grid',
    'OutcomeGrid',
    'Odds',
    'components/Odds/OutcomeGrid.jsx',
    ['OutcomeGrid'],
    'Every outcome of two dice as a 6×6 grid.'
  ),
  comp(
    'branches',
    'Branches',
    'Odds',
    'components/Odds/Branches.jsx',
    ['Branches'],
    'How a chance splits, roll by roll.'
  ),
  comp(
    'explain',
    'Disclosure, MathSteps, Questions',
    'Odds',
    'components/Odds/Explain.jsx',
    ['Disclosure', 'MathSteps', 'Questions'],
    'The detail under a verdict, closed until opened.'
  ),
  comp(
    'odds-lab-link',
    'OddsLabLink',
    'Odds',
    'components/Odds/OddsLabLink.jsx',
    ['OddsLabLink'],
    'A link into the Odds Lab, prefilled with the situation.'
  ),
  comp(
    'bark-odds',
    'BarkOdds',
    'Odds',
    'components/Odds/BarkOdds.jsx',
    ['BarkOdds', 'BarkRings', 'PlayersPicker'],
    'What a bark is worth, as two SeatRings.'
  ),
  comp(
    'bark-hands',
    'BarkHands',
    'Odds',
    'components/Odds/BarkHands.jsx',
    ['BarkHands'],
    'Every roll worst first, against a bark.',
    { liveAt: '/games/barking' }
  ),
  comp(
    'bark-case',
    'BarkSizes, BarkWhy, BarkAssumptions',
    'Odds',
    'components/Odds/BarkCase.jsx',
    ['BarkSizes', 'BarkWhy', 'BarkAssumptions'],
    'The Barking page’s detail sections.',
    { liveAt: '/games/barking' }
  ),
  comp(
    'unheld-calls',
    'UnheldCalls',
    'Odds',
    'components/Odds/UnheldCalls.jsx',
    ['UnheldCalls'],
    'Calling a game you don’t have: make odds and how rarely it beats a held game.',
    { liveAt: '/games/barking' }
  ),
  comp(
    'bark-guide',
    'BarkGuide',
    'Odds',
    'components/Odds/BarkGuide.jsx',
    ['BarkGuide'],
    'The Barking page, short answer first.',
    { liveAt: '/games/barking' }
  ),

  /* ── Components: Feedback ── */
  comp(
    'alert',
    'Alert',
    'Feedback',
    'components/ui/alert.jsx',
    ['Alert', 'AlertTitle', 'AlertDescription'],
    'A message about the page’s state: a query that can’t be met, an error.'
  ),
  comp(
    'popover',
    'Popover',
    'Feedback',
    'components/ui/popover.jsx',
    ['Popover', 'PopoverTrigger', 'PopoverContent'],
    'Content anchored to a button (the settings menu).'
  ),
  comp(
    'tooltip',
    'Tooltip',
    'Feedback',
    'components/ui/tooltip.jsx',
    ['Tooltip'],
    'A hint on hover or focus. Never the only place information lives.'
  ),
  comp(
    'dialog',
    'Dialog',
    'Feedback',
    'components/ui/dialog.jsx',
    [],
    'A modal. Not used yet: prefer content on the page.'
  ),
  comp(
    'sheet',
    'Sheet',
    'Feedback',
    'components/ui/sheet.jsx',
    ['Sheet'],
    'A panel from the edge of the screen (the mobile menu).'
  ),

  /* ── Patterns ── */
  pat(
    'round-story',
    'RoundStory',
    'Site',
    'components/Home/RoundStory.jsx',
    ['RoundStory'],
    'The home page’s animated round.',
    { liveAt: '/' }
  ),
  pat(
    'play',
    'Play',
    'Play',
    'components/Play/index.jsx',
    ['Play'],
    'Full games against bots: the felt, the call, the seats, your move docked within thumb reach.',
    { liveAt: '/play' }
  ),
  pat(
    'table-controls',
    'Transport and SpeedPicker',
    'Play',
    'components/Play/TableControls.jsx',
    ['Transport', 'SpeedPicker'],
    'Play’s video-player controls: pause, step, and every speed in view.',
    { status: A, approved: '2026-10-22', replaces: 'The same controls, local to Play' }
  ),
  pat(
    'call-placard',
    'CallPlacard',
    'Play',
    'components/Play/CallPlacard.jsx',
    ['CallPlacard'],
    'The call in its own box: emoji, name, 1st or 2nd call.',
    { status: A, approved: '2026-10-22', replaces: 'The same placard, local to Play' }
  ),
  pat(
    'play-setup',
    'Setup',
    'Play',
    'components/Play/Setup.jsx',
    ['Setup'],
    'Before a game: opponents and difficulty.',
    {
      status: A, approved: '2026-10-22',
      replaces: 'The same screen, local to Play, with its own pill buttons',
    }
  ),
  pat(
    'hint-card',
    'HintCard',
    'Play',
    'components/Play/HintCard.jsx',
    ['HintCard'],
    'Play’s hint: what a solid player would do, and your chance of the pencil for each option.'
  ),
  pat(
    'tutorial',
    'Tutorial',
    'Learn',
    'components/Tutorial/index.jsx',
    ['Tutorial'],
    'One guided round.',
    { liveAt: '/learn' }
  ),
  pat(
    'game-card',
    'GameCard',
    'Games',
    'components/Games/GameCard.jsx',
    ['GameCard'],
    'One game on the Games page: how it’s made, examples, links.',
    {
      status: A, approved: '2026-10-22',
      replaces: 'The Games page’s local `GameSection`',
      liveAt: '/games',
    }
  ),
  pat(
    'game-detail',
    'StrengthChart, SampleRolls, PairedGames',
    'Games',
    'components/GameDetail/index.jsx',
    ['StrengthChart', 'SampleRolls', 'PairedGames'],
    'A game page’s analysis sections.',
    {
      status: A, approved: '2026-10-22',
      replaces: 'Local components in templates/game-detail.js',
      liveAt: '/games/10-2',
    }
  ),
  pat(
    'keep-advisor',
    'KeepAdvisor',
    'Odds Lab',
    'components/OddsLab/KeepAdvisor.jsx',
    ['KeepAdvisor'],
    'What should I keep? Exact keep-or-roll odds.',
    { liveAt: '/odds-lab' }
  ),
  pat(
    'situation-card',
    'SituationCard',
    'Odds Lab',
    'components/OddsLab/SituationCard.jsx',
    ['SituationCard'],
    'A question from the table, answered exactly.',
    { liveAt: '/games/10-2' }
  ),
  pat(
    'situation-why',
    'SituationWhy',
    'Odds Lab',
    'components/OddsLab/SituationWhy.jsx',
    ['SituationWhy'],
    'Why a keep wins, and where it flips.',
    { liveAt: '/games/10-2' }
  ),
  pat(
    'game-odds',
    'GameOdds',
    'Odds Lab',
    'components/OddsLab/GameOdds.jsx',
    ['OddsDashboard'],
    'Every game’s odds, as cards.',
    { liveAt: '/odds-lab/?tab=games' }
  ),
  pat(
    'every-possibility',
    'EveryPossibility',
    'Odds Lab',
    'components/OddsLab/EveryPossibility.jsx',
    ['EveryPossibility'],
    'Every roll a question counts: a dice grid or a map of outcomes.',
    { liveAt: '/odds-lab/?tab=build' }
  ),
  pat(
    'roll-grid',
    'RollGrid',
    'Odds Lab',
    'components/OddsLab/RollGrid.jsx',
    ['RollGrid'],
    'The unique rolls as a dice grid.',
    { liveAt: '/odds-lab/?tab=build' }
  ),
  pat(
    'outcome-map',
    'OutcomeMap',
    'Odds Lab',
    'components/OddsLab/OutcomeMap.jsx',
    ['OutcomeMap'],
    'Every ordered outcome as a map.',
    { liveAt: '/odds-lab/?tab=build' }
  ),
  pat(
    'roll-builder',
    'RollBuilder',
    'Odds Lab',
    'components/OddsLab/RollBuilder.jsx',
    ['RollBuilder'],
    'Build any roll: describe it and count it.',
    {
      status: A, approved: '2026-10-22',
      replaces: 'The same tool, local to pages/odds-lab.js',
      liveAt: '/odds-lab/?tab=build',
    }
  ),
  pat(
    'query-builder',
    'QueryBuilder',
    'Odds Lab',
    'components/OddsLab/QueryBuilder.jsx',
    ['QueryBuilder'],
    'The requirements editor inside RollBuilder.',
    { liveAt: '/odds-lab/?tab=build' }
  ),
  pat(
    'hammer-decision',
    'HammerDecision',
    'Strategy',
    'components/HammerDecision/index.jsx',
    ['HammerDecision'],
    'What to call, simulated for your roll.',
    { liveAt: '/strategy-assistant' }
  ),
  pat(
    'refusal-decision',
    'RefusalDecision',
    'Strategy',
    'components/RefusalDecision/index.jsx',
    ['RefusalDecision'],
    'Accept or refuse, simulated for your roll and seat.',
    { liveAt: '/strategy-assistant' }
  ),
  pat(
    'second-call-predictor',
    'SecondCallPredictor',
    'Strategy',
    'components/SecondCallPredictor.jsx',
    ['SecondCallPredictor'],
    'Predict the Hammer’s second call.',
    { liveAt: '/strategy-assistant/?tab=second' }
  ),
  pat(
    'second-call-distribution',
    'SecondCallDistribution',
    'Strategy',
    'components/SecondCallDistribution.jsx',
    ['SecondCallDistribution'],
    'The comebacks after a refused call, exact.',
    { liveAt: '/games/10-2' }
  ),
]

const docPath = (id) => (id === 'introduction' ? '/design/' : `/design/${id}/`)

module.exports = {
  SECTIONS,
  GROUPS,
  DOCS,
  STATUS: { approved: A, proposed: P, deprecated: D },
  docPath,
}
