import React, { useState } from 'react'
import { Link } from 'gatsby'
import Layout from '../components/layout'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card'
import { Alert, AlertTitle, AlertDescription } from '../components/ui/alert'

const Collapse = ({ title, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border border-border rounded-lg overflow-hidden my-4">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-muted/50 hover:bg-muted transition-colors text-left"
      >
        <span className="font-medium text-foreground">{title}</span>
        <span className="text-muted-foreground text-lg">{open ? '−' : '+'}</span>
      </button>
      {open && <div className="px-4 py-3 border-t border-border">{children}</div>}
    </div>
  )
}

const TOC_ITEMS = [
  { id: 'overview', label: 'Overview' },
  { id: 'equipment', label: 'Equipment' },
  { id: 'setup', label: 'Setup' },
  { id: 'gameplay', label: 'Gameplay' },
  { id: 'first-call', label: '↳ The Call' },
  { id: 'first-refusal', label: '↳ First Refusal' },
  { id: 'second-refusal', label: '↳ Second Refusal' },
  { id: 'second-call', label: '↳ Second Call' },
  { id: 'play-game', label: '↳ Play & Score' },
]

const RulesPage = () => (
  <Layout>
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="my-8 text-center">
        <h1 className="text-4xl font-bold text-foreground">Rules</h1>
        <p className="text-lg text-muted-foreground">Everything you need to know to play Refusal Dice</p>
      </div>

      {/* Table of Contents */}
      <nav className="mb-10 p-4 bg-muted/50 rounded-lg border border-border" aria-label="Table of contents">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">On this page</h2>
        <ul className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1">
          {TOC_ITEMS.map(item => (
            <li key={item.id}>
              <a href={`#${item.id}`} className="text-sm text-foreground/70 hover:text-primary transition-colors">
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* ── Overview ── */}
      <div id="overview" className="scroll-mt-24 mb-12">
        <h2 className="text-3xl font-semibold mb-4 text-foreground">Overview</h2>
        <div className="prose-custom">
          <p className="text-lg mb-4">
            Refusal Dice is a social dice game for <strong>2–8 players</strong>.
            Each round, one player (the{' '}
            <Link to="/glossary#hammer" className="text-primary hover:underline">Hammer</Link>)
            rolls five dice and calls a game. The players to their left can{' '}
            <Link to="/glossary#accept" className="text-primary hover:underline">accept</Link> or{' '}
            <Link to="/glossary#refuse" className="text-primary hover:underline">refuse</Link> the call.
            Each round produces <strong>one loser</strong> who takes a{' '}
            <Link to="/glossary#pencil" className="text-primary hover:underline">pencil</Link>.
            Collect <strong>3 pencils</strong> and you're out. Last player standing wins the pot.
          </p>
        </div>

        <Collapse title="💰 Splitting the pot">
          <p className="mb-2">
            Some players will make an offer to split the pot based on the
            number of pencils each player has left.
          </p>
          <Alert variant="accent" className="shadow-sm border-accent mt-3">
            <AlertTitle>Example</AlertTitle>
            <AlertDescription className="space-y-2">
              <p>2 players remain:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>👨 <em>Player A</em> has ✏️✏️ and the <Link to="/glossary#hammer"><span role="img" aria-label="hammer">🔨</span></Link></li>
                <li>👩 <em>Player B</em> has ✏️</li>
              </ul>
              <p>
                👨 may offer to split the pot 50/50 with 👩 as it's likely he'll
                win the hand and there will be parity and 👩 will get the call to win.
              </p>
            </AlertDescription>
          </Alert>
        </Collapse>
      </div>

      <hr className="my-8 border-border" />

      {/* ── Equipment ── */}
      <div id="equipment" className="scroll-mt-24 mb-12">
        <h2 className="text-3xl font-semibold mb-4 text-foreground">Equipment</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">🎲 5 Dice per player</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                We prefer Michigan Red Eye's but any dice will do. The red eye's make it a little faster to see what game you can play.
              </p>
              <a
                className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-3 py-2"
                role="button"
                href="https://amzn.to/47ZTYoX"
              >
                Buy on Amazon
              </a>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">🥤 Dice cup</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                You could use a dice tower, or a cup. Our group uses a nice Alex Cramer leather cup with ridges inside to help the dice tumble properly.
              </p>
              <a
                className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-3 py-2"
                role="button"
                href="https://amzn.to/3w0X0w6"
              >
                Buy on Amazon
              </a>
            </CardContent>
          </Card>
        </div>
      </div>

      <hr className="my-8 border-border" />

      {/* ── Setup ── */}
      <div id="setup" className="scroll-mt-24 mb-12">
        <h2 className="text-3xl font-semibold mb-4 text-foreground">Setup</h2>

        <h3 className="text-xl font-semibold mb-3 text-foreground">What you need</h3>
        <ul className="list-disc list-inside space-y-2 mb-6">
          <li>2 or more players 👨👨+</li>
          <li>5 dice per player 🎲🎲🎲🎲🎲</li>
          <li>
            A jar of{' '}
            <Link to="/glossary#pencil" className="text-primary hover:underline">pencils</Link>{' '}
            (or tokens — sugar packets, coins, etc.)
          </li>
        </ul>

        <h3 className="text-xl font-semibold mb-3 text-foreground">Ante</h3>
        <p className="mb-4">
          Playing for money is not required, but a typical ante is{' '}
          <strong>$5 per player</strong> into the pot before the first roll. Different groups
          have different amounts and timing.
        </p>

        <Collapse title="💰 Parity ante variation">
          <p>
            Some groups have everyone add an additional $5 when{' '}
            <Link to="/glossary#parity" className="text-primary hover:underline">parity</Link>{' '}
            is reached — that is, when every remaining player has exactly 2 pencils.
            At parity, all pencils go back to zero.
          </p>
        </Collapse>

        <h3 className="text-xl font-semibold mb-3 mt-6 text-foreground">
          Who goes first?{' '}
          <span className="text-base font-normal text-muted-foreground">(the "<Link to="/glossary#piddle" className="text-primary hover:underline">piddle</Link>")</span>
        </h3>
        <ol className="list-decimal list-inside space-y-2 mb-4">
          <li>Each player rolls 1 die</li>
          <li>Highest value wins — that player gets the <Link to="/glossary#hammer" className="text-primary hover:underline">Hammer</Link></li>
          <li>Ties? Those players roll again until one is highest</li>
        </ol>

        <Collapse title="📋 Piddle example">
          <p className="mb-3"><em>There are 4 players: A, B, C, and D.</em></p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <strong className="block mb-2">Roll 1</strong>
              <ul className="list-disc list-inside space-y-1 mb-3">
                <li><em>Player A</em> rolls a 5</li>
                <li><em>Player B</em> rolls a 2</li>
                <li><em>Player C</em> rolls a 3</li>
                <li><em>Player D</em> rolls a 5</li>
              </ul>
              <p className="text-sm"><em>A</em> and <em>D</em> are tied — they roll again.</p>
            </div>
            <div>
              <strong className="block mb-2">Roll 2</strong>
              <ul className="list-disc list-inside space-y-1 mb-3">
                <li><em>Player A</em> rolls a 4</li>
                <li><em>Player D</em> rolls a 4</li>
              </ul>
              <p className="text-sm">Tied again — roll a 3rd time.</p>
            </div>
            <div>
              <strong className="block mb-2">Roll 3</strong>
              <ul className="list-disc list-inside space-y-1 mb-3">
                <li><em>Player A</em> rolls a 6</li>
                <li><em>Player D</em> rolls a 2</li>
              </ul>
              <p className="text-sm"><em>Player A</em> wins the piddle and gets the Hammer.</p>
            </div>
          </div>
        </Collapse>
      </div>

      <hr className="my-8 border-border" />

      {/* ── Gameplay ── */}
      <div id="gameplay" className="scroll-mt-24 mb-12">
        <h2 className="text-3xl font-semibold mb-2 text-foreground">Gameplay</h2>
        <p className="text-muted-foreground mb-6">
          Each round follows a simple loop: <strong>Roll → Call → Accept/Refuse → Play → Pencil → Repeat</strong>
        </p>

        {/* Flow diagram */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-sm font-medium mb-8 px-2">
          <span className="bg-primary/10 text-primary border border-primary/30 rounded px-3 py-1.5">Roll</span>
          <span className="text-muted-foreground">→</span>
          <a href="#first-call" className="bg-primary/10 text-primary border border-primary/30 rounded px-3 py-1.5 hover:bg-primary/20 transition-colors">Call</a>
          <span className="text-muted-foreground">→</span>
          <a href="#first-refusal" className="bg-primary/10 text-primary border border-primary/30 rounded px-3 py-1.5 hover:bg-primary/20 transition-colors">1st Refusal</a>
          <span className="text-muted-foreground">→</span>
          <a href="#second-refusal" className="bg-primary/10 text-primary border border-primary/30 rounded px-3 py-1.5 hover:bg-primary/20 transition-colors">2nd Refusal</a>
          <span className="text-muted-foreground">→</span>
          <a href="#play-game" className="bg-primary/10 text-primary border border-primary/30 rounded px-3 py-1.5 hover:bg-primary/20 transition-colors">Play</a>
          <span className="text-muted-foreground">→</span>
          <span className="bg-primary/10 text-primary border border-primary/30 rounded px-3 py-1.5">Pencil</span>
        </div>

        {/* Step 1: Roll */}
        <div className="mb-8 pl-4 border-l-4 border-primary/30">
          <h3 className="text-xl font-semibold mb-2 text-foreground">Step 1: Roll</h3>
          <p>
            Everyone rolls all five dice and <strong>hides their results</strong> from other players.
          </p>
          <Collapse title="🎲 Variation: Lazy rolling">
            <p>
              Some players will wait to roll if they aren't the{' '}
              <Link to="/glossary#hammer" className="text-primary hover:underline">Hammer</Link>,{' '}
              <Link to="/glossary#first-refusal" className="text-primary hover:underline">First Refusal</Link>, or{' '}
              <Link to="/glossary#second-refusal" className="text-primary hover:underline">Second Refusal</Link>.
            </p>
          </Collapse>
        </div>

        {/* Step 2: Call */}
        <div id="first-call" className="scroll-mt-24 mb-8 pl-4 border-l-4 border-primary/30">
          <h3 className="text-xl font-semibold mb-2 text-foreground">Step 2: The Call (Hammer's turn)</h3>
          <p className="mb-4">
            The{' '}
            <Link to="/glossary#hammer" className="text-primary hover:underline">Hammer</Link>{' '}
            <span role="img" aria-label="hammer">🔨</span> looks at their dice and calls a{' '}
            <Link to="/games" className="text-primary hover:underline">game</Link> they
            want to play.
          </p>

          <div className="bg-muted/50 rounded-lg p-4 mb-4">
            <p className="font-medium mb-2">The Hammer has two options:</p>
            <ol className="list-decimal list-inside space-y-2">
              <li>
                <strong>Call a game</strong> — The player to their left ({' '}
                <Link to="/glossary#first-refusal" className="text-primary hover:underline">First Refusal</Link>)
                decides whether to accept or refuse
              </li>
              <li>
                <strong><Link to="/glossary#bark" className="text-primary hover:underline">Bark</Link></strong> —
                Pass the Hammer to the left without playing. Only allowed on the first call when your hand is too weak.
              </li>
            </ol>
          </div>
        </div>

        {/* Step 3: First Refusal */}
        <div id="first-refusal" className="scroll-mt-24 mb-8 pl-4 border-l-4 border-primary/30">
          <h3 className="text-xl font-semibold mb-2 text-foreground">Step 3: First Refusal</h3>
          <p className="mb-4">
            The player <strong>directly to the Hammer's left</strong> looks at their dice
            and decides whether they want to play the called game.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 dark:bg-green-500/5">
              <p className="font-semibold text-green-700 dark:text-green-400 mb-1">✅ Accept</p>
              <p className="text-sm">
                <strong>With 4+ players:</strong> Everyone plays the called game.
              </p>
              <p className="text-sm mt-1">
                <strong>With 3 players:</strong> Only the Hammer, First Refusal, and{' '}
                <Link to="/glossary#second-refusal" className="text-primary hover:underline">Second Refusal</Link>{' '}
                play.
              </p>
            </div>
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 dark:bg-red-500/5">
              <p className="font-semibold text-red-700 dark:text-red-400 mb-1">🚫 Refuse</p>
              <p className="text-sm">
                The decision passes to{' '}
                <Link to="/glossary#second-refusal" className="text-primary hover:underline">Second Refusal</Link>.
              </p>
              <p className="text-sm mt-1 font-medium">
                ⚠️ If Second Refusal accepts, First Refusal still has to play!
              </p>
            </div>
          </div>
        </div>

        {/* Step 4: Second Refusal */}
        <div id="second-refusal" className="scroll-mt-24 mb-8 pl-4 border-l-4 border-primary/30">
          <h3 className="text-xl font-semibold mb-2 text-foreground">Step 4: Second Refusal</h3>
          <p className="mb-4">
            The player <strong>two seats to the Hammer's left</strong> (one seat left of First Refusal).
            They only get a choice if First Refusal refused.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 dark:bg-green-500/5">
              <p className="font-semibold text-green-700 dark:text-green-400 mb-1">✅ Accept</p>
              <p className="text-sm">
                <strong>With 4+ players:</strong> Everyone plays the called game.
              </p>
              <p className="text-sm mt-1">
                <strong>With 3 players:</strong> Only the Hammer, First Refusal, and Second Refusal play.
              </p>
            </div>
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 dark:bg-red-500/5">
              <p className="font-semibold text-red-700 dark:text-red-400 mb-1">🚫 Refuse</p>
              <p className="text-sm">
                Both refusals declined — the Hammer must now make a{' '}
                <a href="#second-call" className="text-primary hover:underline">Second Call</a>.
              </p>
            </div>
          </div>
        </div>

        {/* Second Call */}
        <div id="second-call" className="scroll-mt-24 mb-8 pl-4 border-l-4 border-primary/30">
          <h3 className="text-xl font-semibold mb-2 text-foreground">Second Call (if both refuse)</h3>
          <p className="mb-3">
            If both refusals are refused, the Hammer must call a <strong>completely different game</strong>.
            No refusals are allowed — <strong>everyone plays</strong>.
          </p>
          <Alert className="!bg-amber-500/10 border-amber-500/30 shadow-sm dark:!bg-amber-500/5">
            <AlertTitle>Important</AlertTitle>
            <AlertDescription>
              The second call must be a different game, not just a different variant.
              For example, if the first call was Monterey Low, the second call <strong>cannot</strong> be
              Monterey High — it must be an entirely different game like{' '}
              <Link to="/games/scc" className="text-primary hover:underline">Ship, Captain, Crew</Link> or{' '}
              <Link to="/games/pairs" className="text-primary hover:underline">Pairs</Link>.
            </AlertDescription>
          </Alert>
        </div>

        {/* Play Game */}
        <div id="play-game" className="scroll-mt-24 mb-8 pl-4 border-l-4 border-primary/30">
          <h3 className="text-xl font-semibold mb-2 text-foreground">Step 5: Play the game & award a pencil</h3>
          <p className="mb-4">
            All participating players reveal their dice. The player with the <strong>worst{' '}
            <Link to="/glossary#kicker" className="text-primary hover:underline">kickers</Link></strong>{' '}
            loses the round and takes a{' '}
            <Link to="/glossary#pencil" className="text-primary hover:underline">pencil</Link>.
          </p>

          <div className="space-y-4">
            <Alert className="!bg-muted shadow-sm border-muted-foreground/30">
              <AlertTitle>🤝 Ties (3+ players)</AlertTitle>
              <AlertDescription>
                If multiple players tie for the worst hand, those tied players
                replay the same game until there is a single loser.
                Players who aren't tied for worst do not have to replay.
              </AlertDescription>
            </Alert>

            <Alert className="!bg-muted shadow-sm border-muted-foreground/30">
              <AlertTitle>🤝 Ties (2 players)</AlertTitle>
              <AlertDescription>
                If only two players remain and they tie, <strong>no pencil is awarded</strong>.
                The Hammer simply passes to the other player.
              </AlertDescription>
            </Alert>

            <Alert className="!bg-muted shadow-sm border-muted-foreground/30">
              <AlertTitle>✏️✏️✏️ Three pencils</AlertTitle>
              <AlertDescription>
                If a player receives their 3rd pencil, they are out.
                The Hammer passes to the next player to their left who doesn't have 3 pencils.
              </AlertDescription>
            </Alert>

            <Alert className="!bg-muted shadow-sm border-muted-foreground/30">
              <AlertTitle>🔨 Who gets the Hammer next?</AlertTitle>
              <AlertDescription>
                <p>The loser of the round gets the Hammer for the next round.</p>
                <p className="mt-1">
                  <strong>Exception (2 players):</strong> The Hammer always passes to the other player, regardless of who lost.
                </p>
              </AlertDescription>
            </Alert>
          </div>
        </div>

        {/* Repeat */}
        <div className="mb-8 pl-4 border-l-4 border-primary/30">
          <h3 className="text-xl font-semibold mb-2 text-foreground">Repeat</h3>
          <p>
            Continue rounds until only <strong>one player remains</strong>. That player wins the pot! 🎉
          </p>
        </div>
      </div>
    </section>
  </Layout>
)

export default RulesPage
