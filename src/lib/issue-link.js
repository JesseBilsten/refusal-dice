/**
 * A report from the site, as a link to GitHub's new-issue page with the
 * title, body and label filled in. Nothing is sent from the site: the
 * reporter reviews it on GitHub and submits it there (a free account).
 *
 * CommonJS, so Jest can load it without a Babel config.
 */

const REPO = 'JesseBilsten/refusal-dice'
const NEW_ISSUE = `https://github.com/${REPO}/issues/new`

/** What's being reported: the title's prefix and the repo label (labels apply only for maintainers) */
const REPORT_KINDS = {
  bug: { label: 'Something’s broken', prefix: 'Bug', githubLabel: 'bug' },
  rules: { label: 'A rule or odds look wrong', prefix: 'Rules or odds', githubLabel: 'question' },
  idea: { label: 'An idea', prefix: 'Idea', githubLabel: 'enhancement' },
}

/** Keep the link under GitHub's limit (about 8,000 characters) */
const MAX_URL = 7500

const section = (heading, text) => (text && text.trim() ? `### ${heading}\n\n${text.trim()}\n\n` : '')

/**
 * report: { kind, title, details, expected }
 * context: { page, version, browser, screen, theme, houseRules } (any may be missing)
 */
function issueBody(report, context = {}) {
  const facts = [
    context.page && `- Page: ${context.page}`,
    context.version && `- Version: ${context.version}`,
    context.browser && `- Browser: ${context.browser}`,
    context.screen && `- Screen: ${context.screen}`,
    context.theme && `- Theme: ${context.theme}`,
    context.houseRules && `- House rules: ${context.houseRules}`,
  ].filter(Boolean)
  return (
    section(report.kind === 'idea' ? 'The idea' : 'What happened', report.details) +
    section('What I expected', report.kind === 'idea' ? '' : report.expected) +
    `---\nSent from the site's report form\n${facts.join('\n')}\n`
  )
}

function issueUrl(report, context = {}) {
  const kind = REPORT_KINDS[report.kind] || REPORT_KINDS.bug
  const title = `${kind.prefix}: ${(report.title || '').trim()}`
  const build = (r) =>
    `${NEW_ISSUE}?${new URLSearchParams({ title, body: issueBody(r, context), labels: kind.githubLabel })}`
  let url = build(report)
  // Too long for a link: shorten the description, and say so in the issue
  let details = report.details || ''
  while (url.length > MAX_URL && details.length > 0) {
    details = details.slice(0, Math.max(0, details.length - (url.length - MAX_URL) - 40))
    url = build({ ...report, details: `${details}… (cut short: paste the rest here)` })
  }
  return url
}

module.exports = { REPO, NEW_ISSUE, REPORT_KINDS, issueBody, issueUrl }
