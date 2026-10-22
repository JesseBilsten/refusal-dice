/**
 * For the 404 page: the page a mistyped address most likely meant, and a
 * random page for the "re-roll". Pure functions over a list of the site's
 * paths (the 404 page reads them from Gatsby's allSitePage).
 */

/** Lower case, decoded, one slash at each end: '/Games/10-2' → '/games/10-2/' */
export function normalizePath(path) {
  let p = String(path || '/')
  try {
    p = decodeURIComponent(p)
  } catch {
    // A malformed escape: match on the raw text
  }
  p = p
    .split(/[?#]/)[0]
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/\/{2,}/g, '/')
  if (!p.startsWith('/')) p = `/${p}`
  if (!p.endsWith('/')) p = `${p}/`
  return p
}

/** Pages a visitor would want to land on: no error pages, no dev pages */
export function contentPaths(paths) {
  return [...new Set(paths.map(normalizePath))].filter(
    (p) => !/^\/(404|dev-404-page)/.test(p)
  )
}

function distance(a, b) {
  const row = Array.from({ length: b.length + 1 }, (_, j) => j)
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0]
    row[0] = i
    for (let j = 1; j <= b.length; j++) {
      const cur = row[j]
      row[j] = Math.min(
        row[j] + 1,
        row[j - 1] + 1,
        prev + (a[i - 1] === b[j - 1] ? 0 : 1)
      )
      prev = cur
    }
  }
  return row[b.length]
}

/**
 * The closest page to `requested`, or null when nothing is close. A small
 * typo wins ('/rules/' for '/rulez'); otherwise the deepest page the
 * address starts with ('/games/' for '/games/yahtzee').
 */
export function closestPage(requested, paths) {
  const want = normalizePath(requested)
  // An exact match counts: '/Odds-Lab' is a 404, but it means '/odds-lab/'
  const pages = contentPaths(paths)
  let best = null
  pages.forEach((p) => {
    const d = distance(want, p)
    if (!best || d < best.d) best = { path: p, d }
  })
  // A typo is a letter or two, and fewer in a short word: 'yahtzee' isn't 'razzle'
  const last = want.split('/').filter(Boolean).pop() || ''
  if (best && best.d <= Math.max(1, Math.floor(last.length / 4)))
    return best.path
  const prefix = pages
    .filter((p) => p !== '/' && want.startsWith(p))
    .sort((a, b) => b.length - a.length)[0]
  return prefix || null
}

/** A random page to re-roll to, never the one you're on */
export function randomPage(paths, avoid, rand = Math.random) {
  const skip = avoid ? normalizePath(avoid) : null
  const pages = contentPaths(paths).filter(
    (p) => p !== skip && !p.startsWith('/design/')
  )
  if (!pages.length) return '/'
  return pages[Math.floor(rand() * pages.length) % pages.length]
}

/** The slug after /games/, when the address asks for a game: '/games/yahtzee' → 'yahtzee' */
export function requestedGame(requested) {
  const m = normalizePath(requested).match(/^\/games?\/([^/]+)\/$/)
  return m ? m[1] : null
}
