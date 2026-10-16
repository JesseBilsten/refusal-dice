/**
 * Guards for the design system (docs/DESIGN_SYSTEM.md): things that are easy
 * to slip back in and hard to spot in review.
 */
import fs from 'fs'
import path from 'path'

const ROOT = path.join(__dirname, '..')

function files(dir: string, out: string[] = []): string[] {
  fs.readdirSync(dir, { withFileTypes: true }).forEach((e) => {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) {
      if (!['__tests__', 'data', 'ui'].includes(e.name)) files(p, out)
    } else if (/\.(js|jsx|ts|tsx)$/.test(e.name)) out.push(p)
  })
  return out
}

const source = files(ROOT).map((p) => ({ p: path.relative(ROOT, p), text: fs.readFileSync(p, 'utf8') }))
const pages = source.filter((f) => f.p.startsWith('pages/') || f.p.startsWith('templates/'))

const PALETTE =
  /\b(?:bg|text|border|ring|fill|stroke|from|to|via|divide|outline)-(?:red|green|blue|yellow|amber|orange|purple|pink|gray|slate|zinc|neutral|stone|emerald|teal|cyan|sky|indigo|violet|fuchsia|rose|lime)-\d{2,3}\b/

test('colors come from tokens, never the raw Tailwind palette', () => {
  const offenders = source.filter((f) => PALETTE.test(f.text)).map((f) => `${f.p}: ${f.text.match(PALETTE)![0]}`)
  expect(offenders).toEqual([])
})

test('pages set their width with Page, not their own max-w container', () => {
  const offenders = pages
    .filter((f) => /className="[^"]*\bmx-auto\b[^"]*\bmax-w-(?:[2-7]xl|screen)/.test(f.text) || /className="[^"]*\bmax-w-(?:[2-7]xl|screen)[^"]*\bmx-auto\b/.test(f.text))
    .map((f) => f.p)
  expect(offenders).toEqual([])
})

test('pages with content start with a PageHeader (the home page has its hero)', () => {
  const offenders = pages
    .filter((f) => f.text.includes('<Layout>') && !f.p.endsWith('index.js') && !f.text.includes('<PageHeader'))
    .map((f) => f.p)
  expect(offenders).toEqual([])
})

test('the game list comes from games-config, never a local copy', () => {
  const offenders = source
    .filter((f) => !/lib\/(games-config|game-validation)\.js$/.test(f.p) && /const GAMES = \[/.test(f.text))
    .map((f) => f.p)
  expect(offenders).toEqual([])
})

test('imports are relative (the @/ alias breaks the Gatsby build)', () => {
  const offenders = source.filter((f) => /from '@\//.test(f.text)).map((f) => f.p)
  expect(offenders).toEqual([])
})
