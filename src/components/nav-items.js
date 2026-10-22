/**
 * Site navigation, shared by the header, the mobile menu and the footer.
 * Three groups, in the order the story goes (docs/DESIGN_SYSTEM.md, "The
 * story the site tells"): learn the game, get better at it, then play.
 */

export const NAV_GROUPS = [
  {
    title: 'Learn the game',
    items: [
      { to: '/learn', label: 'Learn' },
      { to: '/rules', label: 'Rules' },
      { to: '/games', label: 'Games' },
      { to: '/glossary', label: 'Glossary' },
    ],
  },
  {
    title: 'Get better',
    items: [
      { to: '/odds-lab', label: 'Odds Lab' },
      { to: '/strategy-assistant', label: 'Strategy' },
    ],
  },
  {
    title: 'Play',
    items: [{ to: '/play', label: 'Play' }],
  },
]

/** About the site: in the footer only */
export const SITE_NAV = [{ to: '/design', label: 'Design system' }]
