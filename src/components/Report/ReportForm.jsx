import React, { useEffect, useState } from 'react'
import { ExternalLink } from 'lucide-react'
import pkg from '../../../package.json'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import Field from '../Page/Field'
import ChoiceGroup from '../Page/ChoiceGroup'
import Panel from '../Page/Panel'
import { useHouseRules } from '../Settings'
import { REPORT_KINDS, issueUrl } from '../../lib/issue-link'

/** A required field left empty: a red border with the message, so it isn't color alone */
const INVALID = 'aria-[invalid=true]:border-destructive aria-[invalid=true]:ring-1 aria-[invalid=true]:ring-destructive'

const KIND_OPTIONS = Object.entries(REPORT_KINDS).map(([value, k]) => ({ value, label: k.label }))

/** The details label and hint for each kind of report */
const ASK = {
  bug: { details: 'What happened?', hint: 'What you tapped, and what the page did.' },
  rules: {
    details: 'What looks wrong?',
    hint: 'The rule or number, and what your table plays or what you expected it to be.',
  },
  idea: { details: 'Your idea', hint: 'What you’d like the site to do, and what it would help with.' },
}

/** The page the reporter came from: ?from=/path, else the referrer when it's this site */
function pageFrom() {
  if (typeof window === 'undefined') return ''
  const from = new URLSearchParams(window.location.search).get('from')
  if (from && from.startsWith('/')) return from
  try {
    const ref = new URL(document.referrer)
    if (ref.origin === window.location.origin && ref.pathname !== window.location.pathname) return ref.pathname
  } catch {
    // No referrer, or not a URL
  }
  return ''
}

/** What the report sends along, read in the browser (empty during the server render) */
function useReportContext() {
  const [rules] = useHouseRules()
  const [env, setEnv] = useState({})
  useEffect(() => {
    setEnv({
      browser: window.navigator.userAgent,
      screen: `${window.innerWidth}×${window.innerHeight}`,
      theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
    })
  }, [])
  return {
    version: pkg.version,
    houseRules: `Monterey lone 3 or 4 ${rules.montereyLoneKeep ? 'on' : 'off'}`,
    ...env,
  }
}

/**
 * Report a problem or an idea as a GitHub issue. Nothing is sent from the
 * site: "Continue on GitHub" opens GitHub's new-issue page in a new tab
 * with the title, the description and the page, version, browser and house
 * rules filled in (lib/issue-link.js). The reporter checks it and submits
 * it there, with a free GitHub account.
 */
export default function ReportForm() {
  const [kind, setKind] = useState('bug')
  const [title, setTitle] = useState('')
  const [details, setDetails] = useState('')
  const [expected, setExpected] = useState('')
  const [page, setPage] = useState('')
  const [tried, setTried] = useState(false)
  const [opened, setOpened] = useState(null)
  const context = useReportContext()
  useEffect(() => setPage(pageFrom()), [])

  const missing = [!title.trim() && 'a title', !details.trim() && 'a description'].filter(Boolean)
  const url = issueUrl({ kind, title, details, expected }, { ...context, page: page.trim() })
  const ask = ASK[kind]

  const submit = (e) => {
    e.preventDefault()
    setTried(true)
    if (missing.length) {
      // Take the reporter to the first thing still missing
      document.getElementById(title.trim() ? 'report-details' : 'report-title')?.focus()
      return
    }
    window.open(url, '_blank', 'noopener')
    setOpened(url)
  }

  const sent = [
    ['Page', page.trim() || 'not given'],
    ['Version', context.version],
    ['Browser', context.browser],
    ['Screen', context.screen && `${context.screen}, ${context.theme} theme`],
    ['House rules', context.houseRules],
  ].filter(([, v]) => v)

  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      <Panel tone="tool">
        <div className="space-y-5">
          <ChoiceGroup label="What are you reporting?" options={KIND_OPTIONS} value={kind} onChange={setKind} size="lg" />
          <Field label="Title" htmlFor="report-title" hint="One line, e.g. “Roll button does nothing in Play”.">
            <Input
              id="report-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              aria-describedby="report-title-hint"
              aria-invalid={tried && !title.trim()}
              className={INVALID}
              autoComplete="off"
              required
            />
          </Field>
          <Field label={ask.details} htmlFor="report-details" hint={ask.hint}>
            <Textarea
              id="report-details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              aria-describedby="report-details-hint"
              aria-invalid={tried && !details.trim()}
              className={INVALID}
              rows={5}
              required
            />
          </Field>
          {kind !== 'idea' && (
            <Field label="What did you expect? (optional)" htmlFor="report-expected">
              <Textarea id="report-expected" value={expected} onChange={(e) => setExpected(e.target.value)} rows={3} />
            </Field>
          )}
          <Field label="Which page? (optional)" htmlFor="report-page" hint="Filled in when you came here from a page.">
            <Input
              id="report-page"
              value={page}
              onChange={(e) => setPage(e.target.value)}
              aria-describedby="report-page-hint"
              placeholder="/play"
              autoComplete="off"
            />
          </Field>
        </div>
      </Panel>

      <Panel tone="note" title="Sent along with your report" collapsible>
        <p className="mb-3 text-sm text-muted-foreground">
          So we can reproduce it. You’ll see all of it on GitHub, and can edit it before you submit.
        </p>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          {sent.map(([k, v]) => (
            <React.Fragment key={k}>
              <dt className="font-semibold">{k}</dt>
              <dd className="break-words text-muted-foreground">{v}</dd>
            </React.Fragment>
          ))}
        </dl>
      </Panel>

      <div className="space-y-3">
        {tried && missing.length > 0 && (
          <p role="alert" className="text-sm text-destructive">
            Add {missing.join(' and ')} first.
          </p>
        )}
        <Button type="submit" size="lg">
          Continue on GitHub
          <ExternalLink aria-hidden className="ml-2 h-4 w-4" />
        </Button>
        <p className="text-sm text-muted-foreground">
          Opens GitHub in a new tab with your report filled in. Submitting it there needs a free GitHub account;
          nothing is sent until you do.
        </p>
        {opened && (
          <p role="status" className="text-sm">
            GitHub opened in a new tab. Didn’t open?{' '}
            <a href={url} target="_blank" rel="noopener noreferrer" className="font-medium text-primary underline">
              Open your report on GitHub
            </a>
            .
          </p>
        )}
      </div>
    </form>
  )
}
