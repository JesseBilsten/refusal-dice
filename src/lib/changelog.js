/**
 * CHANGELOG.md, read into releases for the /changelog page (gatsby-node.js
 * reads the file at build time, so the page follows every pull request).
 *
 *   ## 1.5.0 (2026-11-01)        → { version: '1.5.0', date: '2026-11-01' }
 *   ## 1.0.0                     → { version: '1.0.0', date: null }
 *   ## 1.5.1 (unreleased)        → { version: '1.5.1', date: null }
 *
 * A release's paragraphs before its list are `intro`; each `- ` bullet, with
 * its continuation lines joined, is one of `items` (inline Markdown kept as
 * text). Releases that change nothing on the site (every item starts with
 * "**Nothing changes on the site") are left out.
 *
 * CommonJS, so gatsby-node.js and Jest can load it as is.
 */

const HEADING = /^## (\d+\.\d+\.\d+)(?: \(([^)]*)\))?\s*$/
const DATE = /^\d{4}-\d{2}-\d{2}$/
const DOCS_ONLY = /^\*\*Nothing changes on the site/

function parseChangelog(markdown) {
  const releases = []
  let release = null
  let paragraph = []
  let item = null

  const flush = () => {
    if (!release) return
    if (item) release.items.push(item.join(' '))
    else if (paragraph.length) release.intro.push(paragraph.join(' '))
    item = null
    paragraph = []
  }

  markdown.split('\n').forEach((raw) => {
    const line = raw.trim()
    const heading = raw.match(HEADING)
    if (heading) {
      flush()
      const note = heading[2]
      release = {
        version: heading[1],
        date: note && DATE.test(note) ? note : null,
        intro: [],
        items: [],
      }
      releases.push(release)
      return
    }
    if (!release) return
    if (!line) return flush()
    if (line.startsWith('- ')) {
      flush()
      item = [line.slice(2)]
    } else if (item) item.push(line)
    else paragraph.push(line)
  })
  flush()

  return releases.filter((r) => !(r.items.length && r.items.every((i) => DOCS_ONLY.test(i))))
}

/**
 * Inline Markdown in a changelog line, as tokens for the page to render:
 * text, **strong**, *em*, `code` and [links](to). Nested marks aren't
 * needed: CHANGELOG.md doesn't use them.
 */
const INLINE = /\*\*([^*]+)\*\*|`([^`]+)`|\[([^\]]+)\]\(([^)]+)\)|\*([^*]+)\*/g

function inlineTokens(text) {
  const tokens = []
  let last = 0
  for (const m of text.matchAll(INLINE)) {
    if (m.index > last) tokens.push({ type: 'text', text: text.slice(last, m.index) })
    if (m[1] !== undefined) tokens.push({ type: 'strong', text: m[1] })
    else if (m[2] !== undefined) tokens.push({ type: 'code', text: m[2] })
    else if (m[3] !== undefined) tokens.push({ type: 'link', text: m[3], to: m[4] })
    else tokens.push({ type: 'em', text: m[5] })
    last = m.index + m[0].length
  }
  if (last < text.length) tokens.push({ type: 'text', text: text.slice(last) })
  return tokens
}

module.exports = { parseChangelog, inlineTokens }
