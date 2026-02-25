import React, { useState } from 'react'
import { Link } from 'gatsby'
import Layout from '../components/layout'
import { Card, CardContent } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Alert, AlertTitle, AlertDescription } from '../components/ui/alert'

/**
 * RULES v1: "Numbered Steps"
 *
 * Strategy: Linear numbered cards. Each gameplay step is a self-contained,
 * visually distinct tile with a large step number, short title, and concise
 * explanation. Equipment/setup are collapsed above the fold. The page reads
 * like a recipe.
 *
 * UX Laws:
 * - Serial Position Effect: Most important info (gameplay) is first visible
 * - Gestalt Proximity: Related info grouped in cards
 * - Gestalt Similarity: All steps look the same = scannable
 * - Progressive Disclosure: Setup/equipment collapsed, gameplay prominent
 * - Chunking: Each step is one digestible chunk
 */

const Collapse = ({ title, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-muted/40 hover:bg-muted transition-colors text-left"
      >
        <span className="font-medium text-sm text-foreground">{title}</span>
        <span className="text-muted-foreground">{open ? '−' : '+'}</span>
      </button>
      {open && <div className="px-4 py-3 border-t border-border text-sm">{children}</div>}
    </div>
  )
}

const StepCard = ({ number, title, icon, children, id }) => (
  <Card id={id} className="scroll-mt-20 shadow-sm overflow-hidden">
    <div className="flex">
      {/* Step number sidebar */}
      <div className="w-16 sm:w-20 shrink-0 bg-primary/10 flex flex-col items-center justify-center border-r border-primary/20">
        <span className="text-2xl mb-1">{icon}</span>
        <span className="text-xs font-bold text-primary uppercase tracking-wider">Step {number}</span>
      </div>
      <CardContent className="flex-1 p-4 sm:p-5">
        <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
        {children}
      </CardContent>
    </div>
  </Card>
)

const RulesV1 = () => (
  <Layout>
    <section className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">How to Play</h1>
        <p className="text-muted-foreground">
          2–8 players · 5 dice each · ~30 min
        </p>
      </div>

      {/* One-line summary */}
      <div className="bg-muted/50 rounded-lg p-4 mb-8 text-center">
        <p className="text-sm sm:text-base">
          Roll dice → call a game → others accept or refuse → worst hand takes a{' '}
          <Link to="/glossary#pencil" className="text-primary hover:underline">pencil</Link>.
          <br className="hidden sm:block" /> 3 pencils = out. Last player standing wins.
        </p>
      </div>

      {/* Collapsed setup sections */}
      <div className="space-y-2 mb-10">
        <Collapse title="🎲 Equipment — what you need">
          <ul className="space-y-3">
            <li>
              <strong>5 dice per player</strong> — We like{' '}
              <a href="https://amzn.to/47ZTYoX" className="text-primary hover:underline">Michigan Red Eye dice</a>{' '}
              but any will work.
            </li>
            <li>
              <strong>Dice cup</strong> — A{' '}
              <a href="https://amzn.to/3w0X0w6" className="text-primary hover:underline">leather cup</a>{' '}
              or dice tower.
            </li>
            <li>
              <strong>Pencils or tokens</strong> — Sugar packets, coins, chips — anything to track losses.
            </li>
          </ul>
        </Collapse>

        <Collapse title="💵 Ante & setup">
          <p className="mb-3">
            Typical ante: <strong>$5 per player</strong> into the pot. (Playing for money is optional.)
          </p>
          <p className="mb-3">
            <strong>Who goes first?</strong> Everyone rolls one die. Highest roll gets the{' '}
            <Link to="/glossary#hammer" className="text-primary hover:underline">Hammer</Link>. Ties re-roll.
            This is called the "<Link to="/glossary#piddle" className="text-primary hover:underline">piddle</Link>."
          </p>
          <p className="text-muted-foreground text-xs">
            <strong>Variation:</strong> Some groups add $5 at{' '}
            <Link to="/glossary#parity" className="text-primary hover:underline">parity</Link>{' '}
            (when all remaining players have 2 pencils).
          </p>
        </Collapse>
      </div>

      {/* Gameplay steps */}
      <h2 className="text-xl font-bold text-foreground mb-4">Each Round</h2>

      <div className="space-y-4">
        <StepCard number={1} title="Roll" icon="🎲" id="roll">
          <p className="text-sm text-muted-foreground">
            Everyone rolls all 5 dice and <strong>hides</strong> them from other players.
          </p>
        </StepCard>

        <StepCard number={2} title="The Hammer calls a game" icon="🔨" id="first-call">
          <p className="text-sm text-muted-foreground mb-3">
            The <Link to="/glossary#hammer" className="text-primary hover:underline">Hammer</Link> looks at their
            dice and announces which <Link to="/games" className="text-primary hover:underline">game</Link> to play.
          </p>
          <p className="text-sm text-muted-foreground">
            <strong>Or <Link to="/glossary#bark" className="text-primary hover:underline">bark</Link>:</strong> If
            your hand is too weak, pass the Hammer left without playing.
          </p>
        </StepCard>

        <StepCard number={3} title="First Refusal decides" icon="🥇" id="first-refusal">
          <p className="text-sm text-muted-foreground mb-3">
            The player <strong>directly left</strong> of the Hammer checks their dice.
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-md bg-green-500/10 border border-green-500/30 p-2.5 dark:bg-green-500/5">
              <p className="font-semibold text-green-700 dark:text-green-400">✅ Accept</p>
              <p className="text-muted-foreground mt-1">Everyone plays.</p>
            </div>
            <div className="rounded-md bg-red-500/10 border border-red-500/30 p-2.5 dark:bg-red-500/5">
              <p className="font-semibold text-red-700 dark:text-red-400">🚫 Refuse</p>
              <p className="text-muted-foreground mt-1">Passes to 2nd Refusal.</p>
            </div>
          </div>
          <p className="text-xs text-amber-700 dark:text-amber-400 mt-2">
            ⚠️ If you refuse and 2nd Refusal accepts, you still play!
          </p>
        </StepCard>

        <StepCard number={4} title="Second Refusal decides" icon="🥈" id="second-refusal">
          <p className="text-sm text-muted-foreground mb-3">
            Two seats left of the Hammer. Only decides if 1st Refusal refused.
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-md bg-green-500/10 border border-green-500/30 p-2.5 dark:bg-green-500/5">
              <p className="font-semibold text-green-700 dark:text-green-400">✅ Accept</p>
              <p className="text-muted-foreground mt-1">Everyone plays.</p>
            </div>
            <div className="rounded-md bg-red-500/10 border border-red-500/30 p-2.5 dark:bg-red-500/5">
              <p className="font-semibold text-red-700 dark:text-red-400">🚫 Refuse</p>
              <p className="text-muted-foreground mt-1">Hammer must make a 2nd call.</p>
            </div>
          </div>
        </StepCard>

        {/* Second call inline */}
        <div className="ml-16 sm:ml-20 pl-4 border-l-2 border-dashed border-amber-500/40">
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-4 dark:bg-amber-500/5">
            <p className="text-sm font-semibold text-amber-700 dark:text-amber-400 mb-1">↳ Second Call</p>
            <p className="text-sm text-muted-foreground">
              If both refuse, the Hammer calls a <strong>completely different game</strong> (not just a different variant).
              No refusals — everyone plays.
            </p>
          </div>
        </div>

        <StepCard number={5} title="Play & score" icon="✏️" id="play-game">
          <p className="text-sm text-muted-foreground mb-3">
            Everyone reveals their dice. The player with the <strong>worst{' '}
            <Link to="/glossary#kicker" className="text-primary hover:underline">kickers</Link></strong> loses
            and takes a pencil. The loser gets the Hammer next.
          </p>

          <div className="space-y-2">
            <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 rounded p-2">
              <span className="shrink-0 mt-0.5">🤝</span>
              <p><strong>Ties (3+ players):</strong> Tied losers replay until one loser emerges.</p>
            </div>
            <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 rounded p-2">
              <span className="shrink-0 mt-0.5">👥</span>
              <p><strong>Ties (2 players):</strong> No pencil. Hammer passes to the other player.</p>
            </div>
            <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 rounded p-2">
              <span className="shrink-0 mt-0.5">💀</span>
              <p><strong>3 pencils:</strong> You're out. Hammer goes to the next player to your left.</p>
            </div>
          </div>
        </StepCard>
      </div>

      {/* Repeat */}
      <div className="text-center mt-8 mb-4">
        <Badge variant="outline" className="text-sm px-4 py-2">
          🔁 Repeat until one player remains — they win the pot!
        </Badge>
      </div>

      {/* Nav */}
      <div className="flex flex-wrap justify-center gap-3 mt-8 text-sm">
        <Link to="/games" className="text-primary hover:underline">Browse Games →</Link>
        <span className="text-border">·</span>
        <Link to="/strategy-assistant" className="text-primary hover:underline">Strategy Tool →</Link>
        <span className="text-border">·</span>
        <Link to="/glossary" className="text-primary hover:underline">Glossary →</Link>
      </div>
    </section>
  </Layout>
)

export default RulesV1
