import React, { useState } from 'react'
import { Link } from 'gatsby'
import Layout from '../components/layout'
import { Card, CardContent } from '../components/ui/card'
import { Badge } from '../components/ui/badge'

/**
 * RULES-A: "Flowchart / Funnel"
 *
 * Same 4-step structure, but the Refusal step uses a visual funnel/flowchart.
 * The call "flows" through two gates. If it passes either gate, you play.
 * If it fails both, the Hammer calls again.
 *
 * UX: Visual path makes the branching logic intuitive at a glance.
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

const RulesA = () => (
  <Layout>
    <section className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">How to Play</h1>
        <p className="text-muted-foreground">2–8 players · 5 dice each · ~30 min</p>
      </div>

      <div className="bg-muted/50 rounded-lg p-4 mb-8 text-center">
        <p className="text-sm sm:text-base">
          Roll dice → call a game → others accept or refuse → worst hand takes a{' '}
          <Link to="/glossary#pencil" className="text-primary hover:underline">pencil</Link>.
          <br className="hidden sm:block" /> 3 pencils = out. Last player standing wins.
        </p>
      </div>

      <div className="space-y-2 mb-10">
        <Collapse title="🎲 Equipment — what you need">
          <ul className="space-y-3">
            <li><strong>5 dice per player</strong> — We like <a href="https://amzn.to/47ZTYoX" className="text-primary hover:underline">Michigan Red Eye dice</a> but any will work.</li>
            <li><strong>Dice cup</strong> — A <a href="https://amzn.to/3w0X0w6" className="text-primary hover:underline">leather cup</a> or dice tower.</li>
            <li><strong>Pencils or tokens</strong> — Sugar packets, coins, chips — anything to track losses.</li>
          </ul>
        </Collapse>
        <Collapse title="💵 Ante & setup">
          <p className="mb-3">Typical ante: <strong>$5 per player</strong> into the pot. (Playing for money is optional.)</p>
          <p className="mb-3"><strong>Who goes first?</strong> Everyone rolls one die. Highest roll gets the <Link to="/glossary#hammer" className="text-primary hover:underline">Hammer</Link>. Ties re-roll. This is called the "<Link to="/glossary#piddle" className="text-primary hover:underline">piddle</Link>."</p>
          <p className="text-muted-foreground text-xs"><strong>Variation:</strong> Some groups add $5 at <Link to="/glossary#parity" className="text-primary hover:underline">parity</Link> (when all remaining players have 2 pencils).</p>
        </Collapse>
      </div>

      <h2 className="text-xl font-bold text-foreground mb-4">Each Round</h2>

      <div className="space-y-4">
        <StepCard number={1} title="Roll" icon="🎲" id="roll">
          <p className="text-sm text-muted-foreground">
            Everyone rolls all 5 dice and <strong>hides</strong> them from other players.
          </p>
        </StepCard>

        <StepCard number={2} title="The Hammer calls a game" icon="🔨" id="call">
          <p className="text-sm text-muted-foreground mb-3">
            The <Link to="/glossary#hammer" className="text-primary hover:underline">Hammer</Link> looks at their dice and announces which <Link to="/games" className="text-primary hover:underline">game</Link> to play.
          </p>
          <p className="text-sm text-muted-foreground">
            <strong>Or <Link to="/glossary#bark" className="text-primary hover:underline">bark</Link>:</strong> If your hand is too weak, pass the Hammer left without playing.
          </p>
        </StepCard>

        {/* Step 3: Refusal as a visual flowchart */}
        <StepCard number={3} title="Refusal" icon="⚖️" id="refusal">
          <p className="text-sm text-muted-foreground mb-4">
            The Hammer's call passes through two players. If either accepts, that game is played. If both refuse, the Hammer picks a new game.
          </p>

          {/* Visual flow */}
          <div className="relative pl-5 border-l-2 border-primary/30 space-y-0">
            {/* Hammer's call */}
            <div className="relative pb-4">
              <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-primary border-2 border-background" />
              <div className="pl-4">
                <p className="text-xs font-bold text-primary uppercase tracking-wider">Hammer's Call</p>
                <p className="text-xs text-muted-foreground mt-0.5">"We're playing 10-2 High"</p>
              </div>
            </div>

            {/* Gate 1: 1st Refusal */}
            <div className="relative pb-4">
              <div className="absolute -left-[7px] top-0 w-3 h-3 rounded-full bg-muted border-2 border-primary/40" />
              <div className="pl-4">
                <p className="text-xs font-bold text-foreground">1st Refusal</p>
                <p className="text-xs text-muted-foreground">Player directly left of Hammer</p>
                <div className="flex gap-2 mt-1.5">
                  <span className="inline-flex items-center text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/30">
                    ✅ Accept → play
                  </span>
                  <span className="inline-flex items-center text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/30">
                    🚫 Refuse → next ↓
                  </span>
                </div>
              </div>
            </div>

            {/* Gate 2: 2nd Refusal */}
            <div className="relative pb-4">
              <div className="absolute -left-[7px] top-0 w-3 h-3 rounded-full bg-muted border-2 border-primary/40" />
              <div className="pl-4">
                <p className="text-xs font-bold text-foreground">2nd Refusal</p>
                <p className="text-xs text-muted-foreground">Two seats left of Hammer</p>
                <div className="flex gap-2 mt-1.5">
                  <span className="inline-flex items-center text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/30">
                    ✅ Accept → play
                  </span>
                  <span className="inline-flex items-center text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                    🚫 Both refuse ↓
                  </span>
                </div>
              </div>
            </div>

            {/* End: 2nd Call */}
            <div className="relative">
              <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-amber-500 border-2 border-background" />
              <div className="pl-4">
                <p className="text-xs font-bold text-amber-700 dark:text-amber-400">Second Call</p>
                <p className="text-xs text-muted-foreground">Hammer calls a <strong>different game</strong>. No refusals — everyone plays.</p>
              </div>
            </div>
          </div>

          <p className="text-xs text-amber-700 dark:text-amber-400 mt-4">
            ⚠️ If you refuse but the other player accepts, you still play!
          </p>
        </StepCard>

        <StepCard number={4} title="Play & score" icon="✏️" id="play">
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
            <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 rounded p-2">
              <span className="shrink-0 mt-0.5">👥</span>
              <p><strong>Who plays?</strong> With 4+ players, everyone at the table plays. With 3 players, only the Hammer and the two refusers play (which is everyone).</p>
            </div>
          </div>
        </StepCard>
      </div>

      <div className="text-center mt-8 mb-4">
        <Badge variant="outline" className="text-sm px-4 py-2">
          🔁 Repeat until one player remains — they win the pot!
        </Badge>
      </div>

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

export default RulesA
