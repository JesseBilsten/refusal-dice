import React, { useState } from 'react'
import { Link } from 'gatsby'
import Layout from '../components/layout'
import { Card, CardContent } from '../components/ui/card'
import { Badge } from '../components/ui/badge'

/**
 * RULES: "Numbered Steps" with combined Refusal phase
 *
 * Refusal v1: "Binary Outcome"
 * Frames the refusal as a single phase with two possible outcomes:
 *   A) Someone accepts → everyone plays the Hammer's call
 *   B) Both refuse → Hammer picks a different game, everyone plays
 * The sub-steps (1st Refusal, 2nd Refusal) are shown as parts of one step.
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

const RulesPage = () => (
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
          Roll → call a game → others accept or refuse → everyone gets up to 3 rolls to make it → worst hand takes a{' '}
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
        {/* Step 1: Roll */}
        <StepCard number={1} title="Roll" icon="🎲" id="roll">
          <p className="text-sm text-muted-foreground">
            Everyone rolls all 5 dice and <strong>hides</strong> them from other players.
          </p>
        </StepCard>

        {/* Step 2: Call */}
        <StepCard number={2} title="The Hammer calls a game" icon="🔨" id="call">
          <p className="text-sm text-muted-foreground mb-3">
            The <Link to="/glossary#hammer" className="text-primary hover:underline">Hammer</Link> looks at their
            dice and announces which <Link to="/games" className="text-primary hover:underline">game</Link> to play.
          </p>
          <p className="text-sm text-muted-foreground">
            <strong>Or <Link to="/glossary#bark" className="text-primary hover:underline">bark</Link>:</strong> If
            your hand is too weak, pass the Hammer left without playing.
          </p>
        </StepCard>

        {/* Step 3: Combined Refusal */}
        <StepCard number={3} title="Refusal" icon="⚖️" id="refusal">
          <p className="text-sm text-muted-foreground mb-3">
            Two players get a chance to reject the Hammer's call. If either one accepts, the call stands and everyone plays.
            If both refuse, the Hammer must call a different game.
          </p>

          {/* Sub-parts */}
          <div className="border border-border rounded-lg overflow-hidden mb-3">
            {/* Part A: 1st Refusal */}
            <div className="p-3 bg-muted/30">
              <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1">
                1st Refusal
              </p>
              <p className="text-sm text-muted-foreground">
                The player <strong>directly left</strong> of the Hammer looks at their dice and decides:
              </p>
              <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                <div className="rounded bg-green-500/10 border border-green-500/30 p-2 dark:bg-green-500/5">
                  <p className="font-semibold text-green-700 dark:text-green-400">✅ Accept</p>
                  <p className="text-muted-foreground mt-0.5">Everyone plays this game.</p>
                </div>
                <div className="rounded bg-red-500/10 border border-red-500/30 p-2 dark:bg-red-500/5">
                  <p className="font-semibold text-red-700 dark:text-red-400">🚫 Refuse</p>
                  <p className="text-muted-foreground mt-0.5">Passes to 2nd Refusal.</p>
                </div>
              </div>
            </div>

            <div className="border-t border-border" />

            {/* Part B: 2nd Refusal */}
            <div className="p-3">
              <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1">
                2nd Refusal
              </p>
              <p className="text-sm text-muted-foreground">
                The player <strong>two seats left</strong> of the Hammer. Only decides if 1st Refusal has refused.
              </p>
              <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                <div className="rounded bg-green-500/10 border border-green-500/30 p-2 dark:bg-green-500/5">
                  <p className="font-semibold text-green-700 dark:text-green-400">✅ Accept</p>
                  <p className="text-muted-foreground mt-0.5">Everyone plays this game.</p>
                </div>
                <div className="rounded bg-amber-500/10 border border-amber-500/30 p-2 dark:bg-amber-500/5">
                  <p className="font-semibold text-amber-700 dark:text-amber-400">🔄 Refuse</p>
                  <p className="text-muted-foreground mt-0.5">Hammer makes a 2nd call.</p>
                </div>
              </div>
            </div>
          </div>

          <p className="text-xs text-amber-700 dark:text-amber-400">
            ⚠️ If you refuse but the other player accepts, you still play!
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Refusing doesn't mean re-rolling: everyone keeps the dice they have.
          </p>

          {/* Second Call aside */}
          <div className="mt-3 bg-amber-500/5 border border-amber-500/20 rounded-lg p-3 dark:bg-amber-500/5">
            <p className="text-sm font-semibold text-amber-700 dark:text-amber-400 mb-1">
              ↳ Second Call
            </p>
            <p className="text-sm text-muted-foreground">
              Must be a <strong>completely different game</strong> (not just a different variant).
              No refusals — everyone plays. Your first roll still counts as roll 1.
            </p>
          </div>
        </StepCard>

        {/* Step 4: Play the game */}
        <StepCard number={4} title="Play the game" icon="🔄" id="play">
          <p className="text-sm text-muted-foreground mb-3">
            Everyone plays at once, and everyone can now see each other's dice. You get{' '}
            <strong>up to 3 rolls</strong>, and the roll you already have counts as the first.
          </p>
          <ul className="text-sm text-muted-foreground space-y-1.5 mb-3 list-disc pl-5">
            <li>After each roll, <strong>keep any dice</strong> you like and re-roll the rest, or stop.</li>
            <li>
              Try to <strong>make the game</strong>, then improve your{' '}
              <Link to="/glossary#kicker" className="text-primary hover:underline">kicker</Link>: all the
              dice that aren't part of the game.
            </li>
            <li>
              <strong>The kicker is rolled whole.</strong> Once the dice you keep make the game, only those
              stay on the table: re-roll your whole kicker or none of it. You can't keep part of your kicker,
              like keeping the 6 of a 6+1 and re-rolling the 1.
            </li>
            <li>Watch the table: you only need to beat the worst hand.</li>
          </ul>

          <div className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground mb-3">
            <p className="font-semibold text-foreground mb-1">Example: 10-3 High</p>
            <p>
              You roll 1 · 3 · 6 · 2 · 4. The 1+3+6 make 10, so you have the game, with a kicker of 2+4 = 6.
              Keep the 1, 3 and 6 and re-roll the 2 and 4 to try for a higher kicker total.
            </p>
          </div>

          <Collapse title="Three games play differently">
            <ul className="space-y-3">
              <li>
                <Link to="/games/tres-away" className="font-medium text-primary hover:underline">Tres Away</Link>:
                lowest total wins (3s count 0). After every roll you must put out at least one die, and put-out dice
                are final. The caller sets the pace: everyone matches how many dice the caller has out, taking turns
                from the caller's left. Your dice stay hidden until you put them out.
              </li>
              <li>
                <Link to="/games/boss" className="font-medium text-primary hover:underline">Boss</Link>: poker
                hands without straights. The best first roll is the Boss, who rolls once more in secret (keeping the
                hand that made them Boss). Then the Boss says <em>"come up"</em> (everyone else gets one last roll,
                and the worst hand loses, even if that's the Boss) or <em>"don't come up"</em> (no loser). A tie
                for the best first roll means no Boss: no loser, and the Hammer passes left.
              </li>
              <li>
                <Link to="/games/razzle" className="font-medium text-primary hover:underline">Razzle</Link>: most
                of any one number, with 1s wild. Three 1s and a 4 make four 4s. Equal counts go to the higher
                face, so four 6s beat four 4s. Re-rolling everything to chase 1s and 6s is common.
              </li>
            </ul>
          </Collapse>
        </StepCard>

        {/* Step 5: Find the loser */}
        <StepCard number={5} title="Find the loser" icon="✏️" id="score">
          <div className="space-y-2">
            <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 rounded p-2">
              <span className="shrink-0 mt-0.5">❌</span>
              <p>
                <strong>Missed the game?</strong> If you're the only one who missed, you lose. If two or more
                missed, everyone who made it is safe and the players who missed play the same game again with
                3 fresh rolls, until one loses.
              </p>
            </div>
            <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 rounded p-2">
              <span className="shrink-0 mt-0.5">➕</span>
              <p>
                <strong>Everyone made it?</strong> The weakest hand loses. The call already says what's weakest:
                in <em>10-3 High</em>, a player whose kicker is 2+1 = 3 loses to everyone with a higher kicker.
              </p>
            </div>
            <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 rounded p-2">
              <span className="shrink-0 mt-0.5">🤝</span>
              <p>
                <strong>Tied for worst?</strong> The tied players replay the same game (same High/Low) with fresh
                rolls. With only 2 players left in the game, a tie (or both missing) means no pencil and the
                Hammer passes. If you're level with the lowest hand, they're done rolling and you have a roll
                left, you can <strong>take the tie</strong> or roll to beat them. Alone at the bottom, there's
                no choice: you roll until you're out of rolls.
              </p>
            </div>
            <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 rounded p-2">
              <span className="shrink-0 mt-0.5">✏️</span>
              <p>
                The loser takes a{' '}
                <Link to="/glossary#pencil" className="text-primary hover:underline">pencil</Link> and becomes
                the next Hammer. <strong>3 pencils = out</strong>, and the Hammer skips you.
              </p>
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

export default RulesPage
