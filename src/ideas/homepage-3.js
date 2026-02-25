import React from 'react'
import { Link } from 'gatsby'
import Layout from '../components/layout'

/**
 * HOMEPAGE 3: "The Chooser"
 *
 * UX Concept: Three experience-level paths as full-width interactive columns.
 * Users self-select their level and land on the most useful page.
 * Minimal text, maximum clarity. Single viewport.
 *
 * UX Laws applied:
 * - Hick's Law: Only 3 choices — reduces decision paralysis
 * - Miller's Law: Chunk options into meaningful groups (3)
 * - Von Restorff Effect: Each tier has a distinct color accent
 * - Jakob's Law: Familiar "choose your adventure" onboarding pattern
 * - Goal Gradient Effect: Showing what's ahead motivates exploration
 */

const TIERS = [
  {
    level: 'Beginner',
    tagline: 'Never played before',
    description: 'Learn the rules from scratch. Equipment, setup, and a full walkthrough of how a round works.',
    icon: '📖',
    cta: 'Read the Rules',
    to: '/rules',
    color: 'green',
    features: ['What you need to play', 'How rounds work', 'What accept & refuse mean', 'How you win'],
  },
  {
    level: 'Intermediate',
    tagline: 'Know the basics',
    description: 'Explore all 10 games, see which ones fit your hand, and understand kicker strength.',
    icon: '🎲',
    cta: 'Browse Games',
    to: '/games',
    color: 'blue',
    features: ['All 10 game types', 'High vs low variants', 'Difficulty ratings', 'Best kicker combos'],
  },
  {
    level: 'Advanced',
    tagline: 'Ready for an edge',
    description: 'Analyze any roll, see win probabilities, and get strategic call recommendations.',
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
    badge: 'bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/30',
    button: 'bg-green-600 hover:bg-green-700 text-white',
    dot: 'bg-green-500',
  },
  blue: {
    border: 'border-blue-500/40 hover:border-blue-500',
    bg: 'hover:bg-blue-500/5',
    accent: 'text-blue-600 dark:text-blue-400',
    badge: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30',
    button: 'bg-blue-600 hover:bg-blue-700 text-white',
    dot: 'bg-blue-500',
  },
  purple: {
    border: 'border-purple-500/40 hover:border-purple-500',
    bg: 'hover:bg-purple-500/5',
    accent: 'text-purple-600 dark:text-purple-400',
    badge: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30',
    button: 'bg-purple-600 hover:bg-purple-700 text-white',
    dot: 'bg-purple-500',
  },
}

const TierCard = ({ tier }) => {
  const c = colorClasses[tier.color]

  return (
    <Link
      to={tier.to}
      className={`
        group flex flex-col rounded-xl border-2 p-6 transition-all duration-300
        ${c.border} ${c.bg}
        focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
      `}
    >
      <div className="flex items-center gap-3 mb-3">
        <span className="text-3xl">{tier.icon}</span>
        <div>
          <h2 className={`text-xl font-bold ${c.accent}`}>{tier.level}</h2>
          <p className="text-xs text-muted-foreground">{tier.tagline}</p>
        </div>
      </div>

      <p className="text-sm text-foreground/80 mb-4 leading-relaxed">
        {tier.description}
      </p>

      <ul className="space-y-1.5 mb-6 flex-1">
        {tier.features.map(f => (
          <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${c.dot}`} />
            {f}
          </li>
        ))}
      </ul>

      <div className={`inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-4 transition-colors ${c.button}`}>
        {tier.cta} →
      </div>
    </Link>
  )
}

const Homepage3 = () => (
  <Layout>
    <section className="min-h-[calc(100vh-64px)] flex flex-col justify-center px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">Refusal Dice</h1>
        <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto">
          A social dice game for 2–8 players. Roll five dice, call a game, and dare others to play.
          Where do you want to start?
        </p>
      </div>

      {/* Tier cards */}
      <div className="max-w-4xl mx-auto w-full grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        {TIERS.map(tier => (
          <TierCard key={tier.level} tier={tier} />
        ))}
      </div>

      {/* Footer links */}
      <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
        <Link to="/glossary" className="hover:text-primary transition-colors">Glossary</Link>
        <span className="text-border">·</span>
        <Link to="/rolls" className="hover:text-primary transition-colors">Odds</Link>
        <span className="text-border">·</span>
        <Link to="/second-call-predictor" className="hover:text-primary transition-colors">Second Call Predictor</Link>
      </div>
    </section>
  </Layout>
)

export default Homepage3
