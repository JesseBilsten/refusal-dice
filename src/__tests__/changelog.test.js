const fs = require('fs')
const path = require('path')
const { parseChangelog, inlineTokens } = require('../lib/changelog')

const SAMPLE = `# Changelog

Every release, newest first.

## 1.5.1 (unreleased)

- **Nothing changes on the site:** release dates and notes.

## 1.5.0 (2026-11-01)

- **Boss replays end like Boss games** (ruled 2026-10-29): when tied
  worst hands replay Boss, there's no Boss.
- **Taking a tie is an offer.**

## 1.1.0 (2026-10-22)

Play, rebuilt to feel like a real table:

- The piddle plays out on the felt.

## 1.0.0

The site before versioning.
`

describe('changelog: CHANGELOG.md for the /changelog page', () => {
  const releases = parseChangelog(SAMPLE)

  test('one release per heading, newest first, with its date (none when unreleased or undated)', () => {
    expect(releases.map((r) => [r.version, r.date])).toEqual([
      ['1.5.0', '2026-11-01'],
      ['1.1.0', '2026-10-22'],
      ['1.0.0', null],
    ])
  })

  test('releases that change nothing on the site are left out', () => {
    expect(releases.find((r) => r.version === '1.5.1')).toBeUndefined()
  })

  test('a bullet’s continuation lines join into one item; paragraphs before the list are the intro', () => {
    expect(releases[0].items).toEqual([
      "**Boss replays end like Boss games** (ruled 2026-10-29): when tied worst hands replay Boss, there's no Boss.",
      '**Taking a tie is an offer.**',
    ])
    expect(releases[1].intro).toEqual(['Play, rebuilt to feel like a real table:'])
    expect(releases[2]).toMatchObject({ intro: ['The site before versioning.'], items: [] })
  })

  test('inline Markdown: strong, em, code and links', () => {
    expect(inlineTokens('**Bold** then `code`, *em* and [a link](/rules).')).toEqual([
      { type: 'strong', text: 'Bold' },
      { type: 'text', text: ' then ' },
      { type: 'code', text: 'code' },
      { type: 'text', text: ', ' },
      { type: 'em', text: 'em' },
      { type: 'text', text: ' and ' },
      { type: 'link', text: 'a link', to: '/rules' },
      { type: 'text', text: '.' },
    ])
  })

  test('the real CHANGELOG.md parses: every release has a version and something to show', () => {
    const real = parseChangelog(fs.readFileSync(path.join(__dirname, '../../CHANGELOG.md'), 'utf8'))
    expect(real.length).toBeGreaterThan(5)
    real.forEach((r) => expect(r.items.length + r.intro.length).toBeGreaterThan(0))
  })
})
