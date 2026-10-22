/**
 * Guards for the design system (docs/DESIGN_SYSTEM.md and the live site at
 * /design): everything the site renders comes from a component in the
 * registry (src/design-system/registry.js), and only approved ones are used.
 * Plus the foundations that are easy to slip back in and hard to spot in
 * review: tokens, the type scale, page frames and copy.
 */
import fs from 'fs'
import path from 'path'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { DOCS } = require('../design-system/registry')

interface Doc {
  id: string
  title: string
  section: string
  status: 'approved' | 'proposed' | 'deprecated'
  source?: string
  exports?: string[]
  liveAt?: string
}

const ROOT = path.join(__dirname, '..')
const docs: Doc[] = DOCS

function files(dir: string, out: string[] = []): string[] {
  fs.readdirSync(dir, { withFileTypes: true }).forEach((e) => {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) {
      if (!['__tests__', 'data'].includes(e.name)) files(p, out)
    } else if (/\.(js|jsx|ts|tsx)$/.test(e.name)) out.push(p)
  })
  return out
}

const source = files(ROOT).map((p) => ({
  p: path.relative(ROOT, p),
  text: fs.readFileSync(p, 'utf8'),
}))
const pages = source.filter(
  (f) => f.p.startsWith('pages/') || f.p.startsWith('templates/')
)
const ui = source.filter(
  (f) => /\.(jsx|js)$/.test(f.p) && !f.p.startsWith('design-system/')
)
const isDesignSystem = (p: string) => p.startsWith('design-system/')

/* ── Foundations ── */

const PALETTE =
  /\b(?:bg|text|border|ring|fill|stroke|from|to|via|divide|outline)-(?:red|green|blue|yellow|amber|orange|purple|pink|gray|slate|zinc|neutral|stone|emerald|teal|cyan|sky|indigo|violet|fuchsia|rose|lime)-\d{2,3}\b/

test('colors come from tokens, never the raw Tailwind palette or hex', () => {
  const offenders = source
    .filter(
      (f) => PALETTE.test(f.text) || /-\[#[0-9a-fA-F]{3,8}\]/.test(f.text)
    )
    .map(
      (f) =>
        `${f.p}: ${(f.text.match(PALETTE) || f.text.match(/-\[#[0-9a-fA-F]{3,8}\]/))![0]}`
    )
  expect(offenders).toEqual([])
})

test('text sizes come from the type scale: no arbitrary sizes, and nothing past 2xl outside the heading roles', () => {
  const offenders = ui.flatMap((f) =>
    (f.text.match(/\btext-(?:\[\d[^\]]*\]|[3-9]xl)\b/g) || []).map(
      (m) => `${f.p}: ${m}`
    )
  )
  expect(offenders).toEqual([])
})

test('every heading uses a type role (text-display … text-subheading), eyebrow, or sr-only', () => {
  const ROLE =
    /text-(?:display|title|section|heading|subheading)\b|\beyebrow\b|\bsr-only\b/
  const offenders = source
    .filter((f) => /\.(jsx|js)$/.test(f.p))
    .flatMap((f) =>
      (f.text.match(/<h[1-6](?:\s[^>]*)?>/g) || [])
        .filter((tag) => !ROLE.test(tag))
        .map((tag) => `${f.p}: ${tag}`)
    )
  expect(offenders).toEqual([])
})

/* ── Page frames ── */

test('pages set their width with Page, not their own max-w container', () => {
  const offenders = pages
    .filter(
      (f) =>
        /className="[^"]*\bmx-auto\b[^"]*\bmax-w-(?:[2-7]xl|screen)/.test(
          f.text
        ) ||
        /className="[^"]*\bmax-w-(?:[2-7]xl|screen)[^"]*\bmx-auto\b/.test(
          f.text
        )
    )
    .map((f) => f.p)
  expect(offenders).toEqual([])
})

test('pages with content start with a PageHeader (the home page has its hero; TableFault renders one)', () => {
  const offenders = pages
    .filter(
      (f) =>
        f.text.includes('<Layout>') &&
        !f.p.endsWith('index.js') &&
        !f.text.includes('<PageHeader') &&
        !f.text.includes('<TableFault')
    )
    .map((f) => f.p)
  expect(offenders).toEqual([])
})

test('pages and templates compose components: no components of their own, no raw form or table elements', () => {
  const offenders = pages.flatMap((f) => {
    const defined = [
      ...f.text.matchAll(
        /^(?:const|function) ([A-Z][A-Za-z0-9]*)\s*(?:=\s*(?:\([^)]*\)|[a-z]\w*)\s*=>|\()/gm
      ),
    ].map((m) => m[1])
    const exported = f.text.match(/^export default (\w+)/m)?.[1]
    const locals = defined
      .filter((n) => n !== exported)
      .map((n) => `${f.p}: defines ${n}`)
    const raw = (
      f.text.match(/<(?:button|input|select|textarea|table)\b/g) || []
    ).map((m) => `${f.p}: raw ${m}`)
    return [...locals, ...raw]
  })
  expect(offenders).toEqual([])
})

/* ── The registry ── */

test('registry entries are unique, and each component’s source exists with the exports it lists', () => {
  const ids = docs.map((d) => d.id)
  expect(new Set(ids).size).toBe(ids.length)
  const problems = docs
    .filter((d) => d.source)
    .flatMap((d) => {
      const file = path.join(ROOT, d.source!)
      if (!fs.existsSync(file)) return [`${d.id}: no file ${d.source}`]
      const text = fs.readFileSync(file, 'utf8')
      return (d.exports || [])
        .filter(
          (name) =>
            !new RegExp(
              `export (?:default )?(?:function|const|class) ${name}\\b`
            ).test(text) &&
            !new RegExp(`export \\{[^}]*\\b${name}\\b[^}]*\\}`).test(text) &&
            !new RegExp(`export default ${name}\\b`).test(text)
        )
        .map((name) => `${d.id}: ${d.source} doesn’t export ${name}`)
    })
  expect(problems).toEqual([])
})

/** A file that renders something: it has JSX. Barrels, hooks and data files don't. */
const rendersJsx = (text: string) =>
  /<(?:[A-Z][A-Za-z.]*|div|span|button|p|section|svg|ul|ol|nav|header|footer|figure|table|label|a)[\s/>]/.test(
    text
  )

test('every component file is in the design system registry', () => {
  const registered = new Set(docs.map((d) => d.source).filter(Boolean))
  const unregistered = source
    .filter(
      (f) =>
        f.p.startsWith('components/') &&
        /\.(jsx|js)$/.test(f.p) &&
        rendersJsx(f.text)
    )
    .map((f) => f.p)
    .filter((p) => !registered.has(p))
  expect(unregistered).toEqual([])
})

test('every component has a live example on the design system site, or a page that shows it', () => {
  const examples = fs.readFileSync(
    path.join(ROOT, 'design-system/examples.jsx'),
    'utf8'
  )
  const keys = new Set(
    [...examples.matchAll(/^ {2}'?([a-z0-9-]+)'?: \(\) =>/gm)].map((m) => m[1])
  )
  const missing = docs
    .filter(
      (d) =>
        d.source && d.status !== 'deprecated' && !d.liveAt && !keys.has(d.id)
    )
    .map((d) => d.id)
  expect(missing).toEqual([])
})

/** The registry entries a file's imports pull in (direct files, and named imports through a kit's index) */
function importedDocs(f: { p: string; text: string }): Doc[] {
  const out: Doc[] = []
  for (const m of f.text.matchAll(
    /import\s+([\s\S]*?)\s+from\s+'(\.[^']+)'/g
  )) {
    const [, clause, spec] = m
    const base = path.normalize(path.join(path.dirname(f.p), spec))
    const candidates = [
      '',
      '.jsx',
      '.js',
      '.ts',
      '/index.jsx',
      '/index.js',
    ].map((ext) => base + ext)
    const file = candidates.find(
      (c) =>
        fs.existsSync(path.join(ROOT, c)) &&
        fs.statSync(path.join(ROOT, c)).isFile()
    )
    if (!file) continue
    const direct = docs.find((d) => d.source === file)
    // A kit's index re-exports its pieces: match each named import to the entry that exports it
    if (/\/index\.(js|jsx)$/.test(file)) {
      const dir = path.dirname(file)
      const names = (clause.match(/\{([\s\S]*)\}/)?.[1] || '')
        .split(',')
        .map((s) => s.trim().split(/\s+as\s+/)[0])
        .filter(Boolean)
      names.forEach((name) => {
        const d = docs.find(
          (x) =>
            x.source &&
            path.dirname(x.source) === dir &&
            x.exports?.includes(name)
        )
        if (d) out.push(d)
      })
      // The index's own default export (Page, Play…)
      if (direct && /^\s*[A-Za-z_$]/.test(clause)) out.push(direct)
    } else if (direct) out.push(direct)
  }
  return out
}

test('only approved components are used outside the design system; nothing uses a deprecated one', () => {
  const problems = source
    .filter((f) => /\.(jsx|js)$/.test(f.p))
    .flatMap((f) => {
      const own = docs.find((d) => d.source === f.p)
      return importedDocs(f)
        .filter((d) => d !== own)
        .filter((d) => {
          if (d.status === 'deprecated') return true
          // A proposal may build on other proposals; the design system shows them all
          if (d.status === 'proposed')
            return !isDesignSystem(f.p) && own?.status !== 'proposed'
          return false
        })
        .map(
          (d) =>
            `${f.p} uses ${d.title} (${d.status}): ${d.status === 'proposed' ? 'approve it at /design/' + d.id + '/ first' : 'use its replacement'}`
        )
    })
  expect([...new Set(problems)]).toEqual([])
})

/* ── Conventions ── */

test('the game list comes from games-config, never a local copy', () => {
  const offenders = source
    .filter(
      (f) =>
        !/lib\/(games-config|game-validation)\.js$/.test(f.p) &&
        /const GAMES = \[/.test(f.text)
    )
    .map((f) => f.p)
  expect(offenders).toEqual([])
})

test('imports are relative (the @/ alias breaks the Gatsby build)', () => {
  const offenders = source
    .filter((f) => /from '@\//.test(f.text))
    .map((f) => f.p)
  expect(offenders).toEqual([])
})

test('sections are Panels, never the raw ui/card primitive', () => {
  const offenders = source
    .filter((f) => /from '[./]+\/(?:components\/)?ui\/card'/.test(f.text))
    .map((f) => f.p)
  expect(offenders).toEqual([])
})

/** A file's copy: its strings and JSX text, without comments or code */
const copyOf = (text: string) =>
  (
    text
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*\/\/.*$/gm, '')
      .match(/'[^'\n]*'|"[^"\n]*"|`[^`]*`|>[^<>{}]+</g) || []
  ).join('\n')

test('copy follows the writing style: “tap”, not “click”, and game names as games-config spells them', () => {
  const offenders = ui.flatMap((f) =>
    [/\b[Cc]lick(?:s|ed|ing)?\b/, /Ship Captain Crew/, /\bSevens\b/]
      .map((re) => copyOf(f.text).match(re))
      .filter(Boolean)
      .map((m) => `${f.p}: “${m![0]}”`)
  )
  expect(offenders).toEqual([])
})
