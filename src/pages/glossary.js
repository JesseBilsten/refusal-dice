import React, { useState } from 'react'
import { Link } from 'gatsby'
import Layout from '../components/layout'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import GameLink from '../components/GameLink'

const GLOSSARY_TERMS = [
  {
    id: 'accept',
    term: 'Accept',
    emoji: '✅',
    keywords: ['accept', 'play', 'agree'],
    body: (
      <>
        <p className="mb-2">
          When a player in the <Link to="#first-refusal" className="text-primary hover:underline">First Refusal</Link> or{' '}
          <Link to="#second-refusal" className="text-primary hover:underline">Second Refusal</Link> position decides to play the called game.
        </p>
        <p className="text-sm text-muted-foreground">
          <strong>Usage:</strong> "I'll accept" or "I'll play"<br/>
          <strong>See also:</strong> <Link to="#refuse" className="text-primary hover:underline">Refuse</Link>,{' '}
          <Link to="/rules#first-refusal" className="text-primary hover:underline">Rules: First Refusal</Link>
        </p>
      </>
    ),
  },
  {
    id: 'bark',
    term: 'Bark / Barking',
    emoji: '🐕',
    keywords: ['bark', 'barking', 'pass', 'weak hand'],
    body: (
      <>
        <p className="mb-2">
          When the <Link to="#hammer" className="text-primary hover:underline">Hammer</Link> has a weak hand and chooses not to make a call,
          instead passing the hammer to the player on their left without playing a game.
        </p>
        <p className="text-sm text-muted-foreground mb-2">
          <strong>Usage:</strong> "I'm barking" or "Bark!"<br/>
          <strong>Strategy note:</strong> You can only bark on your first call. Use it when your hand is too weak to risk a game.
        </p>
        <p className="text-sm text-muted-foreground">
          <strong>See also:</strong> <Link to="#hammer" className="text-primary hover:underline">Hammer</Link>,{' '}
          <Link to="/games/barking" className="text-primary hover:underline">Barking Strategy</Link>
        </p>
      </>
    ),
  },
  {
    id: 'first-refusal',
    term: 'First Refusal',
    emoji: '🥇',
    keywords: ['first refusal', '1st refusal', 'left', 'position'],
    body: (
      <>
        <p className="mb-2">
          The player directly to the left of the <Link to="#hammer" className="text-primary hover:underline">Hammer</Link>.
          They have the first opportunity to <Link to="#accept" className="text-primary hover:underline">accept</Link> or{' '}
          <Link to="#refuse" className="text-primary hover:underline">refuse</Link> the called game.
        </p>
        <p className="text-sm text-muted-foreground mb-2">
          <strong>Important:</strong> If First Refusal refuses and Second Refusal accepts, First Refusal still has to play!
        </p>
        <p className="text-sm text-muted-foreground">
          <strong>See also:</strong> <Link to="#second-refusal" className="text-primary hover:underline">Second Refusal</Link>,{' '}
          <Link to="/rules#first-refusal" className="text-primary hover:underline">Rules: First Refusal</Link>
        </p>
      </>
    ),
  },
  {
    id: 'hammer',
    term: 'Hammer',
    emoji: '🔨',
    keywords: ['hammer', 'call', 'caller', 'first call'],
    body: (
      <>
        <p className="mb-2">
          The player who has the call. The Hammer rolls their dice and makes the first call of which game to play.
          If both refusals are refused, the Hammer must make a second call (a completely different game) that everyone must play.
        </p>
        <p className="text-sm text-muted-foreground mb-2">
          <strong>Passing the Hammer:</strong> The hammer passes to the left after each round (or when someone <Link to="#bark" className="text-primary hover:underline">barks</Link>).
        </p>
        <p className="text-sm text-muted-foreground">
          <strong>See also:</strong> <Link to="#bark" className="text-primary hover:underline">Bark</Link>,{' '}
          <Link to="/rules#first-call" className="text-primary hover:underline">Rules: First Call</Link>,{' '}
          <Link to="/strategy-assistant" className="text-primary hover:underline">Hammer Strategy</Link>
        </p>
      </>
    ),
  },
  {
    id: 'kicker',
    term: 'Kicker / Kickers',
    emoji: '🎯',
    keywords: ['kicker', 'kickers', 'remaining dice', 'score', 'strength'],
    body: (
      <>
        <p className="mb-2">
          The dice that don't count toward making the called game. Kickers determine the winner when multiple players make the same game.
        </p>
        <p className="text-sm mb-2">
          <strong>Example:</strong> In <Link to="/games/10-2" className="text-primary hover:underline">10-2</Link>,
          if you roll [1,2,3,5,6], the 1+3+6=10, so your kickers are [2,5].
        </p>
        <p className="text-sm text-muted-foreground">
          <strong>High vs Low:</strong> In "High" games, higher kickers win. In "Low" games, lower kickers win.<br/>
          <strong>See also:</strong> <Link to="/games" className="text-primary hover:underline">Games</Link>,{' '}
          <Link to="/strategy-assistant" className="text-primary hover:underline">Strategy Assistant</Link>
        </p>
      </>
    ),
  },
  {
    id: 'parity',
    term: 'Parity',
    emoji: '✏️✏️',
    keywords: ['parity', 'two pencils', 'reset', 'even'],
    body: (
      <>
        <p className="mb-2">
          When all remaining players have exactly 2 <Link to="#pencil" className="text-primary hover:underline">pencils</Link>.
          Some groups reset pencils to zero and add additional money to the pot at parity.
        </p>
        <p className="text-sm text-muted-foreground">
          <strong>House rules vary:</strong> Check with your group about parity rules before playing.<br/>
          <strong>See also:</strong> <Link to="/rules#ante" className="text-primary hover:underline">Rules: Ante Variations</Link>
        </p>
      </>
    ),
  },
  {
    id: 'pencil',
    term: 'Pencil / Token',
    emoji: '✏️',
    keywords: ['pencil', 'token', 'lose', 'out', 'life', 'lives', 'death'],
    body: (
      <>
        <p className="mb-2">
          A marker indicating a lost round. Each player starts with 0 pencils. Lose a round, take a pencil.
          Get 3 pencils and you're out of the game.
        </p>
        <p className="text-sm text-muted-foreground mb-2">
          <strong>Common substitutes:</strong> Sugar packets, coins, poker chips, or actual pencils
        </p>
        <p className="text-sm text-muted-foreground">
          <strong>See also:</strong> <Link to="#parity" className="text-primary hover:underline">Parity</Link>,{' '}
          <Link to="/rules#object" className="text-primary hover:underline">Rules: Object of the Game</Link>
        </p>
      </>
    ),
  },
  {
    id: 'piddle',
    term: 'Piddle',
    emoji: '🎲',
    keywords: ['piddle', 'first roll', 'who goes first', 'start'],
    body: (
      <>
        <p className="mb-2">
          The initial roll to determine who gets the <Link to="#hammer" className="text-primary hover:underline">Hammer</Link> first.
          Each player rolls one die. Highest roll wins (ties roll again).
        </p>
        <p className="text-sm text-muted-foreground">
          <strong>See also:</strong> <Link to="/rules#setup" className="text-primary hover:underline">Rules: Who Goes First</Link>
        </p>
      </>
    ),
  },
  {
    id: 'refuse',
    term: 'Refuse / Refusal',
    emoji: '🚫',
    keywords: ['refuse', 'refusal', 'no', 'pass', 'decline'],
    body: (
      <>
        <p className="mb-2">
          When a player in the <Link to="#first-refusal" className="text-primary hover:underline">First Refusal</Link> or{' '}
          <Link to="#second-refusal" className="text-primary hover:underline">Second Refusal</Link> position decides NOT to play the called game,
          passing the decision to the next player.
        </p>
        <p className="text-sm text-muted-foreground mb-2">
          <strong>Usage:</strong> "No" or "I refuse"<br/>
          <strong>Warning:</strong> If you're First Refusal and refuse, you may still have to play if Second Refusal accepts!
        </p>
        <p className="text-sm text-muted-foreground">
          <strong>See also:</strong> <Link to="#accept" className="text-primary hover:underline">Accept</Link>,{' '}
          <Link to="/strategy-assistant" className="text-primary hover:underline">Refusal Strategy</Link>
        </p>
      </>
    ),
  },
  {
    id: 'second-call',
    term: 'Second Call',
    emoji: '2️⃣',
    keywords: ['second call', '2nd call', 'different game', 'everyone plays'],
    body: (
      <>
        <p className="mb-2">
          If both <Link to="#first-refusal" className="text-primary hover:underline">First</Link> and{' '}
          <Link to="#second-refusal" className="text-primary hover:underline">Second Refusal</Link> refuse the first call,
          the <Link to="#hammer" className="text-primary hover:underline">Hammer</Link> must call a completely different game.
          No refusals are allowed - everyone must play.
        </p>
        <p className="text-sm text-muted-foreground mb-2">
          <strong>Important:</strong> Second call must be a different game, not just a different variant (e.g., can't call "<GameLink id="monterey">Monterey</GameLink> High" if first call was "<GameLink id="monterey">Monterey</GameLink> Low").
        </p>
        <p className="text-sm text-muted-foreground">
          <strong>See also:</strong> <Link to="/rules#second-call" className="text-primary hover:underline">Rules: Second Call</Link>,{' '}
          <Link to="/second-call-predictor" className="text-primary hover:underline">Second Call Predictor Tool</Link>
        </p>
      </>
    ),
  },
  {
    id: 'second-refusal',
    term: 'Second Refusal',
    emoji: '🥈',
    keywords: ['second refusal', '2nd refusal', 'position'],
    body: (
      <>
        <p className="mb-2">
          The player two seats to the left of the <Link to="#hammer" className="text-primary hover:underline">Hammer</Link> (one seat left of{' '}
          <Link to="#first-refusal" className="text-primary hover:underline">First Refusal</Link>). They can accept or refuse only if First Refusal refused.
        </p>
        <p className="text-sm text-muted-foreground mb-2">
          <strong>Key decision:</strong> Accepting means you play against First Refusal. Refusing forces the Hammer's{' '}
          <Link to="#second-call" className="text-primary hover:underline">Second Call</Link> where everyone plays.
        </p>
        <p className="text-sm text-muted-foreground">
          <strong>See also:</strong> <Link to="/rules#second-refusal" className="text-primary hover:underline">Rules: Second Refusal</Link>
        </p>
      </>
    ),
  },
  {
    id: 'tie',
    term: 'Tie',
    emoji: '🤝',
    keywords: ['tie', 'tied', 'draw', 'replay', 'same score'],
    body: (
      <>
        <p className="mb-2">
          When multiple players have the same <Link to="#kicker" className="text-primary hover:underline">kickers</Link> after playing a game.
          The goal is to find ONE loser per round.
        </p>
        <p className="text-sm mb-2">
          <strong>With 3+ players:</strong> Tied players (for lowest score) replay the same game until there's a single loser.
        </p>
        <p className="text-sm mb-2">
          <strong>With 2 players:</strong> Ties result in the <Link to="#hammer" className="text-primary hover:underline">Hammer</Link> passing
          to the other player. No pencil is awarded.
        </p>
        <p className="text-sm text-muted-foreground">
          <strong>See also:</strong> <Link to="/rules#play-game" className="text-primary hover:underline">Rules: Playing the Game</Link>
        </p>
      </>
    ),
  },
  {
    id: 'variant',
    term: 'Variant (High/Low)',
    emoji: '↕️',
    keywords: ['variant', 'high', 'low', 'version'],
    body: (
      <>
        <p className="mb-2">
          Most games have "High" and "Low" variants that determine whether higher or lower{' '}
          <Link to="#kicker" className="text-primary hover:underline">kickers</Link> win.
        </p>
        <p className="text-sm mb-2">
          <strong>High:</strong> Higher kickers win (e.g., [6,6] beats [5,5])<br/>
          <strong>Low:</strong> Lower kickers win (e.g., [1,1] beats [2,2])
        </p>
        <p className="text-sm text-muted-foreground">
          <strong>Important:</strong> Always specify which variant you're calling!<br/>
          <strong>See also:</strong> <Link to="/games" className="text-primary hover:underline">Games List</Link>
        </p>
      </>
    ),
  },
  {
    id: 'frankie',
    term: 'Frankie',
    emoji: '😅',
    keywords: ['frankie', 'frank', '10-3', 'slang', 'nickname'],
    body: (
      <>
        <p className="mb-2">
          Slang name for <Link to="/games/10-3" className="text-primary hover:underline">10-3</Link>,
          named after Frank Richardson from SLO Country Club who famously struggled to roll it.
        </p>
        <p className="text-sm text-muted-foreground">
          <strong>Usage:</strong> "I'll call Frankie Low"
        </p>
      </>
    ),
  },
]

const GlossaryPage = () => {
  const [search, setSearch] = useState('')

  const filtered = search.trim() === ''
    ? GLOSSARY_TERMS
    : GLOSSARY_TERMS.filter(entry => {
        const q = search.toLowerCase()
        return (
          entry.term.toLowerCase().includes(q) ||
          entry.keywords.some(k => k.includes(q))
        )
      })

  return (
    <Layout>
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="my-8 text-center">
          <h1 className="text-4xl font-bold text-foreground">Glossary</h1>
          <p className="text-lg text-muted-foreground">
            Common terms and phrases used in Refusal Dice
          </p>
        </div>

        <div className="mb-8">
          <Input
            type="text"
            placeholder="Search terms…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-lg py-3"
          />
          {search.trim() !== '' && (
            <p className="text-sm text-muted-foreground mt-2">
              {filtered.length === 0
                ? 'No matching terms found.'
                : `Showing ${filtered.length} of ${GLOSSARY_TERMS.length} terms`}
            </p>
          )}
        </div>

        <div className="space-y-6">
          {filtered.map(entry => (
            <Card key={entry.id} id={entry.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">{entry.emoji}</span>
                  {entry.term}
                </CardTitle>
              </CardHeader>
              <CardContent>{entry.body}</CardContent>
            </Card>
          ))}
        </div>
      </section>
    </Layout>
  )
}

export default GlossaryPage
