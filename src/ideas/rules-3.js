import React, { useState } from 'react'
import { Link } from 'gatsby'
import Layout from '../components/layout'
import { Badge } from '../components/ui/badge'

/**
 * RULES v3: "FAQ Accordion"
 *
 * Strategy: Every section is a question the player might ask. All collapsed
 * by default so the full page is visible in one screen. Users open only
 * what they need. Zero scrolling to scan all questions. Equipment is
 * de-emphasized. Optimized for mobile reference during a game.
 *
 * UX Laws:
 * - Progressive Disclosure: Only show detail when asked
 * - Recognition over Recall: Questions match what players actually wonder
 * - Fitts's Law: Large tap targets for mobile
 * - Jakob's Law: FAQ pattern is universally understood
 * - Minimal Viable Content: Each answer is as short as possible
 */

const FAQ = ({ question, number, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-border last:border-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-4 text-left hover:bg-muted/50 transition-colors group"
      >
        <span className="text-xs font-bold text-primary bg-primary/10 rounded-full w-6 h-6 flex items-center justify-center shrink-0">
          {number}
        </span>
        <span className={`flex-1 text-sm sm:text-base font-medium ${open ? 'text-primary' : 'text-foreground'}`}>
          {question}
        </span>
        <span className="text-muted-foreground group-hover:text-foreground transition-colors text-lg shrink-0">
          {open ? '−' : '+'}
        </span>
      </button>
      {open && (
        <div className="px-4 pb-4 pl-[52px] text-sm text-muted-foreground space-y-3 animate-in fade-in duration-200">
          {children}
        </div>
      )}
    </div>
  )
}

const Inline = ({ emoji, children }) => (
  <div className="flex items-start gap-2 bg-muted/50 rounded-md p-2.5">
    <span className="shrink-0">{emoji}</span>
    <p className="text-xs">{children}</p>
  </div>
)

const RulesV3 = () => (
  <Layout>
    <section className="max-w-xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">Rules</h1>
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground flex-wrap">
          <Badge variant="outline">2–8 players</Badge>
          <Badge variant="outline">5 dice each</Badge>
          <Badge variant="outline">~30 min</Badge>
        </div>
      </div>

      {/* The big idea */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-6 text-center">
        <p className="text-sm sm:text-base">
          Roll dice. Call a game. Others accept or refuse.
          <br />
          Worst hand takes a pencil. <strong>3 pencils = out.</strong>
          <br />
          Last player standing wins.
        </p>
      </div>

      {/* FAQ sections */}
      <div className="border border-border rounded-lg overflow-hidden mb-8">
        <FAQ number={1} question="What do I need to play?">
          <ul className="space-y-2">
            <li><strong>5 dice per player</strong> — Any dice work. We like <a href="https://amzn.to/47ZTYoX" className="text-primary hover:underline">Michigan Red Eyes</a>.</li>
            <li><strong>A cup or tower</strong> — <a href="https://amzn.to/3w0X0w6" className="text-primary hover:underline">Leather cups</a> are great.</li>
            <li><strong>Pencils/tokens</strong> — Sugar packets, coins, whatever.</li>
            <li><strong>Optional: money</strong> — $5/player into the pot is typical.</li>
          </ul>
        </FAQ>

        <FAQ number={2} question="How do I decide who goes first?">
          <p>
            Each player rolls one die. Highest wins — they get the{' '}
            <Link to="/glossary#hammer" className="text-primary hover:underline">Hammer</Link> (the right to call).
            Ties re-roll. This is called the "<Link to="/glossary#piddle" className="text-primary hover:underline">piddle</Link>."
          </p>
        </FAQ>

        <FAQ number={3} question="What does the Hammer do?" defaultOpen>
          <p>The Hammer rolls 5 dice, looks at their hand, and either:</p>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div className="rounded-md bg-primary/5 border border-primary/20 p-2.5 text-center">
              <p className="font-semibold text-xs">📢 Call a game</p>
              <p className="text-xs mt-1">Announce which <Link to="/games" className="text-primary hover:underline">game</Link> to play</p>
            </div>
            <div className="rounded-md bg-muted border border-border p-2.5 text-center">
              <p className="font-semibold text-xs">🐕 Bark</p>
              <p className="text-xs mt-1">Pass if your hand stinks</p>
            </div>
          </div>
        </FAQ>

        <FAQ number={4} question="What is 'First Refusal'?">
          <p>
            The player <strong>directly left</strong> of the Hammer. They look at their dice and decide:
          </p>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <Inline emoji="✅">
              <strong>Accept</strong> — everyone plays the called game.
            </Inline>
            <Inline emoji="🚫">
              <strong>Refuse</strong> — passes to 2nd Refusal.
            </Inline>
          </div>
          <p className="text-amber-700 dark:text-amber-400 text-xs font-medium mt-2">
            ⚠️ If you refuse but 2nd Refusal accepts, you still play!
          </p>
        </FAQ>

        <FAQ number={5} question="What is 'Second Refusal'?">
          <p>
            Two seats left of the Hammer. Only decides if 1st Refusal refused.
          </p>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <Inline emoji="✅">
              <strong>Accept</strong> — everyone plays.
            </Inline>
            <Inline emoji="🚫">
              <strong>Refuse</strong> — forces a Second Call.
            </Inline>
          </div>
        </FAQ>

        <FAQ number={6} question="What's a Second Call?">
          <p>
            When both refuse, the Hammer must call a <strong>completely different game</strong>.
            No one can refuse — everyone plays.
          </p>
          <Inline emoji="⚡">
            "Different game" means a different base game, not just High↔Low.
            E.g., can't switch from Monterey Low to Monterey High.
          </Inline>
        </FAQ>

        <FAQ number={7} question="How do I win a round?">
          <p>
            Everyone reveals their dice. For games with{' '}
            <Link to="/glossary#kicker" className="text-primary hover:underline">kickers</Link>,
            the best kickers win and worst kickers lose.
          </p>
          <p className="font-medium">The loser takes a pencil ✏️ and gets the Hammer next.</p>
        </FAQ>

        <FAQ number={8} question="What happens on a tie?">
          <div className="space-y-2">
            <Inline emoji="👥">
              <strong>3+ players:</strong> Tied losers replay the same game. Others sit out. Repeat until one loser.
            </Inline>
            <Inline emoji="🤝">
              <strong>2 players:</strong> No pencil. Hammer passes to the other player.
            </Inline>
          </div>
        </FAQ>

        <FAQ number={9} question="When am I out?">
          <p>
            <strong>3 pencils = eliminated.</strong> The Hammer passes to the next player on your left who's still in.
          </p>
          <p>
            When only one player remains without 3 pencils, they win the pot.
          </p>
        </FAQ>

        <FAQ number={10} question="What is parity?">
          <p>
            When all remaining players have exactly 2 pencils. Some groups reset all pencils to zero
            and add extra money to the pot when this happens. Ask your group.
          </p>
        </FAQ>

        <FAQ number={11} question="Who plays when a call is accepted?">
          <div className="space-y-2">
            <Inline emoji="4️⃣">
              <strong>4+ players:</strong> Everyone at the table plays, not just the Hammer and refusers.
            </Inline>
            <Inline emoji="3️⃣">
              <strong>3 players:</strong> Only Hammer, 1st Refusal, and 2nd Refusal play (which is everyone).
            </Inline>
            <Inline emoji="2️⃣">
              <strong>2 players:</strong> There's no 2nd Refusal — Hammer calls, other player accepts or refuses. If refused, second call, both play.
            </Inline>
          </div>
        </FAQ>
      </div>

      {/* Navigate */}
      <div className="flex flex-wrap justify-center gap-3 text-sm">
        <Link to="/games" className="text-primary hover:underline">Browse Games →</Link>
        <span className="text-border">·</span>
        <Link to="/strategy-assistant" className="text-primary hover:underline">Strategy Tool →</Link>
        <span className="text-border">·</span>
        <Link to="/glossary" className="text-primary hover:underline">Glossary →</Link>
      </div>
    </section>
  </Layout>
)

export default RulesV3
