import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'gatsby'
import Layout from '../components/layout'
import Die from '../components/Die'
import { CallList } from '../components/RollAnalysis'
import {
  generateHammerStrategy,
  gameOddsMap,
} from '../lib/game-validation'

/* ── Tier cards (from homepage-3) ── */
const TIERS = [
  {
    level: 'Beginner',
    tagline: 'Never played before',
    description: 'Learn the rules, equipment, and how a round works.',
    icon: '📖',
    cta: 'Read the Rules',
    to: '/rules',
    color: 'green',
    features: ['What you need to play', 'How rounds work', 'Accept & refuse', 'How you win'],
  },
  {
    level: 'Intermediate',
    tagline: 'Know the basics',
    description: 'Explore all 10 games and understand kicker strength.',
    icon: '🎲',
    cta: 'Browse Games',
    to: '/games',
    color: 'blue',
    features: ['All 10 game types', 'High vs low variants', 'Difficulty ratings', 'Best kicker combos'],
  },
  {
    level: 'Advanced',
    tagline: 'Ready for an edge',
    description: 'Win probabilities and strategic call recommendations.',
    icon: '🧠',
    cta: 'Strategy Tools',
    to: '/strategy-assistant',
    color: 'purple',
    features: ['Win probability per call', 'Accept or refuse advice', 'Roll odds lookup', 'Second call predictor'],
  },
]

const colorClasses = {
  green: {
    border: 'border-green-500/40 hover:border-green-500',
    bg: 'hover:bg-green-500/5',
    accent: 'text-green-600 dark:text-green-400',
    dot: 'bg-green-500',
    button: 'bg-green-600 hover:bg-green-700 text-white',
  },
  blue: {
    border: 'border-blue-500/40 hover:border-blue-500',
    bg: 'hover:bg-blue-500/5',
    accent: 'text-blue-600 dark:text-blue-400',
    dot: 'bg-blue-500',
    button: 'bg-blue-600 hover:bg-blue-700 text-white',
  },
  purple: {
    border: 'border-purple-500/40 hover:border-purple-500',
    bg: 'hover:bg-purple-500/5',
    accent: 'text-purple-600 dark:text-purple-400',
    dot: 'bg-purple-500',
    button: 'bg-purple-600 hover:bg-purple-700 text-white',
  },
}

const TierCard = ({ tier }) => {
  const c = colorClasses[tier.color]
  return (
    <Link
      to={tier.to}
      className={`group flex flex-col rounded-xl border-2 p-5 transition-all duration-300 ${c.border} ${c.bg} focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2`}
    >
      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl">{tier.icon}</span>
        <div>
          <h2 className={`text-lg font-bold ${c.accent}`}>{tier.level}</h2>
          <p className="text-xs text-muted-foreground">{tier.tagline}</p>
        </div>
      </div>
      <p className="text-sm text-foreground/80 mb-3 leading-relaxed">{tier.description}</p>
      <ul className="space-y-1 mb-4 flex-1">
        {tier.features.map(f => (
          <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${c.dot}`} />
            {f}
          </li>
        ))}
      </ul>
      <div className={`inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-4 transition-colors ${c.button}`}>
        {tier.cta} →
      </div>
    </Link>
  )
}

/* ── Main Page ── */
const IndexPage = () => {
  const [dice, setDice] = useState([3, 5, 2, 6, 1])
  const [isRolling, setIsRolling] = useState(false)
  const [calls, setCalls] = useState([])
  const [phase, setPhase] = useState('idle') // 'idle' | 'in' | 'hold' | 'out'
  const [progress, setProgress] = useState(0)
  const timerRef = useRef(null)
  const progressRef = useRef(null)

  const performRoll = useCallback(() => {
    setIsRolling(true)
    setPhase('out')

    // Brief fade-out of previous results
    setTimeout(() => {
      setCalls([])
      setPhase('idle')

      // Rapid dice animation
      const interval = setInterval(() => {
        setDice(Array.from({ length: 5 }, () => Math.ceil(Math.random() * 6)))
      }, 70)

      setTimeout(() => {
        clearInterval(interval)
        const finalDice = Array.from({ length: 5 }, () => Math.ceil(Math.random() * 6))
        setDice(finalDice)
        setIsRolling(false)

        // Compute all calls
        const result = generateHammerStrategy(finalDice, 3, gameOddsMap)
        const recs = (result?.allRecommendations || []).filter(
          (r) => r.rawStrength > 0
        )

        setCalls(recs)

        // Slide in
        setTimeout(() => setPhase('in'), 80)
      }, 700)
    }, 250)
  }, [])

  // Auto-roll on mount
  useEffect(() => {
    const t = setTimeout(performRoll, 600)
    return () => clearTimeout(t)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Progress bar tracks hold duration
  useEffect(() => {
    if (phase !== 'in') {
      setProgress(0)
      if (progressRef.current) cancelAnimationFrame(progressRef.current)
      return
    }
    const holdMs = 4000
    const start = performance.now()
    const tick = (now) => {
      const elapsed = now - start
      const pct = Math.min(elapsed / holdMs, 1)
      setProgress(pct)
      if (pct < 1) progressRef.current = requestAnimationFrame(tick)
    }
    progressRef.current = requestAnimationFrame(tick)
    return () => { if (progressRef.current) cancelAnimationFrame(progressRef.current) }
  }, [phase])

  // Hold, then fade-out and re-roll
  useEffect(() => {
    if (phase !== 'in') return
    timerRef.current = setTimeout(() => {
      setPhase('out')
      setTimeout(performRoll, 400)
    }, 4000)
    return () => clearTimeout(timerRef.current)
  }, [phase, performRoll])

  const isBark = phase === 'in' && calls.length === 0

  return (
    <Layout>
      {/* ─── Hero: Magazine split-screen ─── */}
      <section className="min-h-[calc(100vh-64px)] flex flex-col">
        <div className="flex-1 flex flex-col sm:flex-row">
          {/* Left panel — intro */}
          <div className="flex-1 flex flex-col justify-center px-6 sm:px-10 lg:px-16 py-10 sm:py-0">
            <p className="text-sm font-medium text-primary mb-3 tracking-wide uppercase">
              A social dice game for 2–8 players
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-4">
              Roll. Call.<br />
              <span className="text-primary">Refuse.</span>
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg max-w-md mb-8 leading-relaxed">
              Five dice, ten games, one loser per round. Call a game and dare the
              table to play — or refuse and force someone else's hand.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <Link
                to="/rules"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium h-11 px-6 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Learn to Play
              </Link>
              <Link
                to="/strategy-assistant"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium h-11 px-6 border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                Strategy Tool
              </Link>
            </div>

            <div className="flex gap-4 text-sm text-muted-foreground">
              <Link to="/games" className="hover:text-primary transition-colors">10 Games →</Link>
              <Link to="/odds" className="hover:text-primary transition-colors">Odds →</Link>
              <Link to="/glossary" className="hover:text-primary transition-colors">Glossary →</Link>
            </div>
          </div>

          {/* Right panel — auto-rolling dice + call list */}
          <div className="flex-1 flex flex-col items-center justify-center bg-muted/30 border-t sm:border-t-0 sm:border-l border-border px-6 py-10 sm:py-0 relative overflow-hidden">
            {/* Subtle background pattern */}
            <div
              className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }}
            />

            <div className="relative z-10 flex flex-col items-center">
              {/* Dice */}
              <div className="flex gap-3 sm:gap-4 mb-6">
                {dice.map((d, i) => (
                  <div
                    key={i}
                    className={`transition-transform duration-150 ${
                      isRolling ? 'animate-bounce' : ''
                    }`}
                    style={{ animationDelay: `${i * 40}ms` }}
                  >
                    <Die number={d} />
                  </div>
                ))}
              </div>

              {/* Progress bar */}
              <div className="w-full max-w-xs h-0.5 bg-muted/60 rounded-full overflow-hidden mb-4">
                <div
                  className="h-full bg-primary/40 rounded-full"
                  style={{ width: `${progress * 100}%`, transition: progress === 0 ? 'none' : undefined }}
                />
              </div>

              {/* Call list */}
              <CallList
                recommendations={isBark ? [] : calls}
                isBark={isBark}
                phase={phase}
                variant="compact"
                className="w-full max-w-xs min-h-[160px] flex flex-col items-stretch"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ─── Where do you want to start? ─── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <h2 className="text-center text-lg font-semibold text-foreground mb-6">
          Where do you want to start?
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          {TIERS.map((tier) => (
            <TierCard key={tier.level} tier={tier} />
          ))}
        </div>
      </section>

      {/* ─── Footer links ─── */}
      <div className="pb-10 flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
        <Link to="/glossary" className="hover:text-primary transition-colors">
          Glossary
        </Link>
        <span className="text-border">·</span>
        <Link to="/odds" className="hover:text-primary transition-colors">
          Odds
        </Link>
        <span className="text-border">·</span>
        <Link
          to="/second-call-predictor"
          className="hover:text-primary transition-colors"
        >
          Second Call Predictor
        </Link>
      </div>
    </Layout>
  )
}

export default IndexPage
