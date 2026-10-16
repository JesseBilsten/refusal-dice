import React from 'react'
import { Link } from 'gatsby'
import Layout from '../components/layout'
import Page, { PageHeader, NextStep, Panel } from '../components/Page'
import { Disclosure } from '../components/Odds'

/**
 * RULES: "Numbered Steps" with combined Refusal phase
 *
 * Refusal v1: "Binary Outcome"
 * Frames the refusal as a single phase with two possible outcomes:
 *   A) Someone accepts → everyone plays the Hammer's call
 *   B) Both refuse → Hammer picks a different game, everyone plays
 * The sub-steps (1st Refusal, 2nd Refusal) are shown as parts of one step.
 */


const StepCard = ({ number, title, icon, children, id }) => (
  <Panel id={id} className="scroll-mt-20">
    <div className="mb-3 flex items-center gap-3">
      <span aria-hidden className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xl">
        {icon}
      </span>
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-primary">Step {number}</p>
        <h3 className="text-lg font-semibold leading-tight">{title}</h3>
      </div>
    </div>
    {children}
  </Panel>
)

/** One way a round can end, in step 5 */
const Outcome = ({ icon, children }) => (
  <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
    <span aria-hidden className="mt-0.5 shrink-0">{icon}</span>
    <p>{children}</p>
  </div>
)

const RulesPage = () => (
  <Layout>
    <Page width="reading">
      {/* Header */}
      <PageHeader
        title="How to Play"
        description="2–8 players · 5 dice each · ~30 min"
      />

      {/* One-line summary */}
      <Panel tone="note" as="div" className="mb-8">
        <p className="text-sm sm:text-base">
          Roll → call a game → others accept or refuse → everyone gets up to 3 rolls to make it → worst hand takes a{' '}
          <Link to="/glossary#pencil" className="text-primary hover:underline">pencil</Link>.
          {' '}3 pencils = out. Last player standing wins.
        </p>
      </Panel>

      {/* Collapsed setup sections */}
      <div id="setup" className="space-y-2 mb-10 scroll-mt-20">
        <Disclosure title="🎲 Equipment — what you need">
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
        </Disclosure>

        <Disclosure title="💵 Ante & setup">
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
        </Disclosure>
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
                <div className="rounded bg-odds-safe/10 border border-odds-safe/30 p-2">
                  <p className="font-semibold text-foreground">✅ Accept</p>
                  <p className="text-muted-foreground mt-0.5">Everyone plays this game.</p>
                </div>
                <div className="rounded bg-odds-lose/10 border border-odds-lose/30 p-2">
                  <p className="font-semibold text-foreground">🚫 Refuse</p>
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
                <div className="rounded bg-odds-safe/10 border border-odds-safe/30 p-2">
                  <p className="font-semibold text-foreground">✅ Accept</p>
                  <p className="text-muted-foreground mt-0.5">Everyone plays this game.</p>
                </div>
                <div className="rounded bg-odds-coin/10 border border-odds-coin/30 p-2">
                  <p className="font-semibold text-foreground">🔄 Refuse</p>
                  <p className="text-muted-foreground mt-0.5">Hammer makes a 2nd call.</p>
                </div>
              </div>
            </div>
          </div>

          <p className="text-xs text-foreground">
            ⚠️ If you refuse but the other player accepts, you still play!
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Refusing doesn't mean re-rolling: everyone keeps the dice they have.
          </p>

          {/* Second Call aside */}
          <div className="mt-3 bg-odds-coin/5 border border-odds-coin/30 rounded-lg p-3">
            <p className="text-sm font-semibold text-foreground mb-1">
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
            Everyone's dice are now face up. Each player gets <strong>up to 3 rolls</strong>, and the roll
            they already have counts as the first.
          </p>
          <p className="text-sm text-muted-foreground mb-3">
            <strong>The worst hand rolls first.</strong> Whoever holds it is the loser right now, so they roll
            until they climb off the bottom or run out of rolls. Then whoever holds the worst hand rolls. If the
            worst hand never gets off the bottom, nobody else has to roll at all.
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
            <li>You only ever roll to get off the bottom: beat the next-worst hand and your turn ends.</li>
          </ul>

          <div className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground mb-3">
            <p className="font-semibold text-foreground mb-1">Example: 10-3 High</p>
            <p>
              You roll 1 · 3 · 6 · 2 · 4. The 1+3+6 make 10, so you have the game, with a kicker of 2+4 = 6.
              Keep the 1, 3 and 6 and re-roll the 2 and 4 to try for a higher kicker total.
            </p>
          </div>

          <Disclosure title="Three games play differently">
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
                face, so four 6s beat four 4s. The lowest hand rolls first, as in the other games. Re-rolling
                everything to chase 1s and 6s is common.
              </li>
            </ul>
          </Disclosure>
        </StepCard>

        {/* Step 5: Find the loser */}
        <StepCard number={5} title="Find the loser" icon="✏️" id="score">
          <div className="space-y-2">
            <Outcome icon="❌">
              <strong>Missed the game?</strong> Missing is the worst hand. If you're the only one who missed, you
              lose. If two or more missed, everyone who made it is safe and the players who missed play the same
              game again with 3 fresh rolls, until one loses.
            </Outcome>
            <Outcome icon="➕">
              <strong>Everyone made it?</strong> The weakest hand loses. The call already says what's weakest:
              in <em>10-3 High</em>, a player whose kicker is 2+1 = 3 loses to everyone with a higher kicker.
            </Outcome>
            <Outcome icon="🤝">
              <strong>Tied for worst?</strong> The tied player nearest the Hammer rolls first. Once the others
              you're tied with are out of rolls, you can <strong>take the tie</strong> (you replay the same game,
              same High/Low, with fresh rolls) or roll to beat them. With only 2 players left in the game, a tie
              (or both missing) means no pencil and the Hammer passes. Alone at the bottom, there's no choice:
              you roll until you're out of rolls.
            </Outcome>
            <Outcome icon="✏️">
              The loser takes a{' '}
              <Link to="/glossary#pencil" className="text-primary hover:underline">pencil</Link> and becomes the
              next Hammer. <strong>3 pencils = out</strong>, and the Hammer skips you.
            </Outcome>
          </div>
        </StepCard>
      </div>

      <p className="mt-8 text-center font-display text-lg font-bold">
        🔁 Repeat until one player remains: they win the pot!
      </p>
      <NextStep to="/games" title="Meet the ten games" text="What makes each one, what it looks like, and its quirks." />
    </Page>
  </Layout>
)

export default RulesPage
