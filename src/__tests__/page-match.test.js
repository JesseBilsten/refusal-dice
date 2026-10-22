const {
  closestPage,
  contentPaths,
  normalizePath,
  randomPage,
  requestedGame,
} = require('../lib/page-match')

const PATHS = [
  '/',
  '/404/',
  '/404.html',
  '/dev-404-page/',
  '/rules/',
  '/glossary/',
  '/games/',
  '/games/10-2',
  '/games/ship-captain-crew',
  '/odds-lab/',
  '/design/',
  '/design/button/',
]

test('normalizes case, slashes, spaces and query strings', () => {
  expect(normalizePath('/Games/10-2')).toBe('/games/10-2/')
  expect(normalizePath('rules')).toBe('/rules/')
  expect(normalizePath('/ship%20captain_crew?x=1#y')).toBe(
    '/ship-captain-crew/'
  )
  expect(normalizePath('//games//')).toBe('/games/')
})

test('error and dev pages are never suggested', () => {
  expect(contentPaths(PATHS)).not.toContain('/404/')
  expect(contentPaths(PATHS)).not.toContain('/404.html/')
  expect(contentPaths(PATHS)).not.toContain('/dev-404-page/')
})

test('a small typo finds the page', () => {
  expect(closestPage('/rulez', PATHS)).toBe('/rules/')
  expect(closestPage('/glosary/', PATHS)).toBe('/glossary/')
  expect(closestPage('/game/10-2', PATHS)).toBe('/games/10-2/')
  expect(closestPage('/games/ship-captian-crew', PATHS)).toBe(
    '/games/ship-captain-crew/'
  )
  expect(closestPage('/Odds-Lab', PATHS)).toBe('/odds-lab/')
})

test('otherwise the deepest page the address starts with', () => {
  expect(closestPage('/games/yahtzee-deluxe', PATHS)).toBe('/games/')
  expect(closestPage('/games/yahtzee', [...PATHS, '/games/razzle'])).toBe(
    '/games/'
  )
  expect(closestPage('/rules/hammer/extra', PATHS)).toBe('/rules/')
})

test('nothing close means no suggestion', () => {
  expect(closestPage('/completely-unrelated-thing', PATHS)).toBeNull()
})

test('a re-roll lands on a content page, never this one or the design system', () => {
  for (let i = 0; i < 50; i++) {
    const p = randomPage(PATHS, '/rules', () => i / 50)
    expect(p).not.toBe('/rules/')
    expect(p.startsWith('/design/')).toBe(false)
    expect(p.startsWith('/404')).toBe(false)
  }
  expect(randomPage([], null)).toBe('/')
})

test('reads the game an address asks for', () => {
  expect(requestedGame('/games/yahtzee')).toBe('yahtzee')
  expect(requestedGame('/game/Yahtzee/')).toBe('yahtzee')
  expect(requestedGame('/games/')).toBeNull()
  expect(requestedGame('/rules/')).toBeNull()
})
