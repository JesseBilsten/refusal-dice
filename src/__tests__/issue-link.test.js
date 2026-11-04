const { NEW_ISSUE, issueBody, issueUrl } = require('../lib/issue-link')

const read = (url) => {
  const u = new URL(url)
  return { base: `${u.origin}${u.pathname}`, params: Object.fromEntries(u.searchParams) }
}

describe('issue-link: a report as a prefilled GitHub issue', () => {
  const context = {
    page: '/games/10-2/',
    version: '1.6.0',
    browser: 'Mozilla/5.0 (iPhone)',
    screen: '390×844',
    theme: 'dark',
    houseRules: 'Monterey: lone 3 or 4 off',
  }

  test('the kind sets the title prefix and the label', () => {
    const { base, params } = read(issueUrl({ kind: 'rules', title: ' 10-3 odds ', details: 'x' }, context))
    expect(base).toBe(NEW_ISSUE)
    expect(params.title).toBe('Rules or odds: 10-3 odds')
    expect(params.labels).toBe('question')
    expect(read(issueUrl({ kind: 'idea', title: 'More games', details: 'x' })).params.labels).toBe('enhancement')
  })

  test('the body holds what happened, what was expected and where it happened', () => {
    const body = issueBody({ kind: 'bug', title: 't', details: 'The dice froze.', expected: 'A roll.' }, context)
    expect(body).toContain('### What happened\n\nThe dice froze.')
    expect(body).toContain('### What I expected\n\nA roll.')
    expect(body).toContain('- Page: /games/10-2/')
    expect(body).toContain('- Version: 1.6.0')
    expect(body).toContain('- House rules: Monterey: lone 3 or 4 off')
  })

  test('empty sections are left out; an idea has no “expected”', () => {
    const body = issueBody({ kind: 'idea', title: 't', details: 'Add Ship Captain Crew drills', expected: 'ignored' })
    expect(body).toContain('### The idea')
    expect(body).not.toContain('What I expected')
    expect(issueBody({ kind: 'bug', title: 't', details: '', expected: '' })).not.toContain('###')
  })

  test('a long description is cut short to keep the link under GitHub’s limit, and says so', () => {
    const url = issueUrl({ kind: 'bug', title: 'Long', details: 'word '.repeat(5000) }, context)
    expect(url.length).toBeLessThanOrEqual(7500)
    expect(read(url).params.body).toContain('(cut short: paste the rest here)')
    expect(read(url).params.body).toContain('- Page: /games/10-2/')
  })
})
