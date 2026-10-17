import React from 'react'
import { Link } from 'gatsby'
import { ArrowRight, BookOpen, Dices, FlaskConical, Swords } from 'lucide-react'
import Layout from '../components/layout'
import { Container, StepNumber } from '../components/Page'
import { buttonVariants } from '../components/ui/button'
import RoundStory from '../components/Home/RoundStory'
import { CALLABLE_GAMES, getGamePath } from '../lib/games-config'
import { cn } from '../lib/utils'

/**
 * Home: the game in one animated round, then the path from first roll to
 * sharp player: learn it, meet the games, answer your own questions in the
 * Odds Lab, then play.
 */

const PATH = [
  {
    step: 1,
    icon: BookOpen,
    title: 'Learn by playing',
    text: 'One guided round against two friendly players. About two minutes, and you’ll know how a round works.',
    to: '/learn',
    cta: 'Play the guided round',
  },
  {
    step: 2,
    icon: Dices,
    title: 'Meet the ten games',
    text: 'From 10-3 to Boss. Each has its own quirks: what makes it, what to keep, when to call it.',
    to: '/games',
    cta: 'Browse the games',
  },
  {
    step: 3,
    icon: FlaskConical,
    title: 'Settle the arguments',
    text: 'Hold the 6 in Boss, or roll all five? Keep 2-3 in Monterey, or just the 3? The Odds Lab works it out exactly.',
    to: '/odds-lab/',
    cta: 'Ask the Odds Lab',
  },
  {
    step: 4,
    icon: Swords,
    title: 'Play the bots',
    text: 'Full games against 1 to 7 solid bots, with hints when you want them. Three pencils and you’re out.',
    to: '/play',
    cta: 'Take a seat',
  },
]

const IndexPage = () => (
  <Layout>
    {/* ─── Hero: the pitch, and a round playing out ─── */}
    <Container as="section" width="wide" className="py-10 sm:py-16">
      <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-16">
        <div>
          <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-primary">
            The bar dice game for 2–8 players
          </p>
          <h1 className="mb-5 font-display text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
            Roll. Call.
            <br />
            <span className="relative inline-block text-pop">
              Refuse.
              <svg aria-hidden viewBox="0 0 200 12" className="absolute -bottom-2 left-0 h-3 w-full text-pop/40" preserveAspectRatio="none">
                <path d="M2 9 C 50 2, 120 2, 198 7" stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round" />
              </svg>
            </span>
          </h1>
          <p className="mb-8 text-lg text-muted-foreground">
            Five dice, ten games, one loser a round. Call the game your dice play best and dare the table to play it,
            or refuse and make the Hammer think again.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link to="/learn" className={cn(buttonVariants({ size: 'lg' }), 'h-12 gap-2 px-6 text-base')}>
              Learn by playing <ArrowRight aria-hidden className="h-4 w-4" />
            </Link>
            <Link to="/play" className={cn(buttonVariants({ size: 'lg', variant: 'outline' }), 'h-12 px-6 text-base')}>
              Play the bots
            </Link>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Already play?{' '}
            <Link to="/strategy-assistant" className="font-medium text-primary hover:underline">
              Check a call
            </Link>{' '}
            or{' '}
            <Link to="/odds-lab/" className="font-medium text-primary hover:underline">
              work out the odds
            </Link>
            .
          </p>
        </div>
        <RoundStory />
      </div>
    </Container>

    {/* ─── The path ─── */}
    <section className="border-y bg-muted/40 py-12 sm:py-16">
      <Container width="wide">
        <h2 className="mb-2 text-3xl font-bold tracking-tight">From first roll to sharp player</h2>
        <p className="mb-8 text-muted-foreground">Four stops. Start wherever you are.</p>
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PATH.map((p) => (
            <li key={p.step}>
              <Link
                to={p.to}
                className="group flex h-full flex-col rounded-2xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="mb-4 flex items-center gap-3">
                  <StepNumber n={p.step} className="h-10 w-10 text-lg" />
                  <p.icon aria-hidden className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-primary" />
                </span>
                <span className="mb-1 font-display text-lg font-bold">{p.title}</span>
                <span className="mb-4 flex-1 text-sm text-muted-foreground">{p.text}</span>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
                  {p.cta} <ArrowRight aria-hidden className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </Container>
    </section>

    {/* ─── The games ─── */}
    <Container as="section" width="wide" className="py-12 sm:py-16">
      <h2 className="mb-2 text-3xl font-bold tracking-tight">Ten games, one roll</h2>
      <p className="mb-8 text-muted-foreground">
        The Hammer picks which game everyone plays, after seeing their own dice. Knowing them all is half the fun.
      </p>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {CALLABLE_GAMES.map((g) => (
          <li key={g.id}>
            <Link
              to={getGamePath(g.id)}
              className="flex h-full items-center gap-3 rounded-xl border bg-card p-3 shadow-sm transition-colors hover:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span aria-hidden className="text-2xl">
                {g.emoji}
              </span>
              <span className="font-display font-bold">{g.fullName || g.name}</span>
            </Link>
          </li>
        ))}
      </ul>
    </Container>
  </Layout>
)

export default IndexPage
