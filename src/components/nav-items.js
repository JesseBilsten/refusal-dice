/**
 * Site navigation, shared by the desktop header and the mobile menu, in the
 * order the story goes: learn the game, look up the rules and games, work
 * out the odds, then play.
 */

export const PRIMARY_NAV = [
  { to: '/learn', label: 'Learn' },
  { to: '/rules', label: 'Rules' },
  { to: '/games', label: 'Games' },
  { to: '/odds-lab', label: 'Odds Lab' },
  { to: '/strategy-assistant', label: 'Strategy' },
  { to: '/play', label: 'Play' },
]

/** Reference pages: in the header's end and the mobile menu */
export const MORE_NAV = [
  { to: '/glossary', label: 'Glossary' },
  { to: '/second-call-predictor', label: 'Second Call Predictor' },
]
