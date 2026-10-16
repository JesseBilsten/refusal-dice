import React, { useState } from 'react'
import { Link } from 'gatsby'
import Layout from '../components/layout'
import Page, { PageHeader, Panel } from '../components/Page'
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
          <Link to="/rules#refusal" className="text-primary hover:underline">Rules: First Refusal</Link>
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
          <Link to="/rules#refusal" className="text-primary hover:underline">Rules: First Refusal</Link>
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
          <Link to="/rules#call" className="text-primary hover:underline">Rules: First Call</Link>,{' '}
          <Link to="/strategy-assistant" className="text-primary hover:underline">Hammer Strategy</Link>
        </p>
      </>
    ),
  },
  {
    id: 'kicker',
    term: 'Kicker',
    emoji: '🎯',
    keywords: ['kicker', 'kickers', 'remaining dice', 'score', 'strength'],
    body: (
      <>
        <p className="mb-2">
          All the dice that don't count toward making the called game, taken together as one total. The kicker decides the loser when multiple players make the same game.
        </p>
        <p className="text-sm mb-2">
          <strong>Example:</strong> In <Link to="/games/10-3" className="text-primary hover:underline">10-3</Link>,
          if you roll [1,2,3,5,6], the 1+3+6=10, so your kicker is [2,5], a total of 7.
        </p>
        <p className="text-sm text-muted-foreground">
          <strong>High vs Low:</strong> The kicker's dice are added up. In "High" games the higher total wins; in "Low" games the lower total wins.<br/>
          <strong>Rolled whole:</strong> Once the dice you keep make the game, the whole kicker is re-rolled at once. You can't keep part of your kicker.<br/>
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
          <strong>See also:</strong> <Link to="/rules#setup" className="text-primary hover:underline">Rules: Ante Variations</Link>
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
          <Link to="/rules" className="text-primary hover:underline">Rules: Object of the Game</Link>
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
          <strong>See also:</strong> <Link to="/rules#refusal" className="text-primary hover:underline">Rules: Second Call</Link>,{' '}
          <Link to="/strategy-assistant/?tab=second" className="text-primary hover:underline">predict the second call</Link>
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
          <strong>Key decision:</strong> Accepting means everyone plays the Hammer's call. Refusing forces the Hammer's{' '}
          <Link to="#second-call" className="text-primary hover:underline">Second Call</Link> where everyone plays.
        </p>
        <p className="text-sm text-muted-foreground">
          <strong>See also:</strong> <Link to="/rules#refusal" className="text-primary hover:underline">Rules: Second Refusal</Link>
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
          When multiple players have the same <Link to="#kicker" className="text-primary hover:underline">kicker</Link> total after playing a game.
          The goal is to find ONE loser per round.
        </p>
        <p className="text-sm mb-2">
          <strong>With 3+ players:</strong> Players tied for the worst hand replay the same game until there's a single loser.
          Once the others you're tied with are out of rolls, you can <Link to="#take-the-tie" className="text-primary hover:underline">take the tie</Link> or roll to beat them.
        </p>
        <p className="text-sm mb-2">
          <strong>With 2 players:</strong> Ties, or both players missing the game, result in the <Link to="#hammer" className="text-primary hover:underline">Hammer</Link> passing
          to the other player. No pencil is awarded.
        </p>
        <p className="text-sm text-muted-foreground">
          <strong>See also:</strong> <Link to="/rules#score" className="text-primary hover:underline">Rules: Playing the Game</Link>
        </p>
      </>
    ),
  },
  {
    id: 'worst-hand',
    term: 'Worst Hand (the bottom)',
    emoji: '⬇️',
    keywords: ['worst hand', 'bottom', 'lowest', 'who rolls', 'order', 'turn', 'loser'],
    body: (
      <>
        <p className="mb-2">
          The hand that would lose if play stopped now. Missing the game is worst; then the weakest{' '}
          <Link to="#kicker" className="text-primary hover:underline">kicker</Link> for the call.
          <strong> The worst hand rolls first</strong>, until it climbs off the bottom or runs out of rolls. If it never
          gets off the bottom, nobody else has to roll, and it takes the <Link to="#pencil" className="text-primary hover:underline">pencil</Link>.
        </p>
        <p className="text-sm text-muted-foreground">
          <strong>Applies to:</strong> the kicker games and <GameLink id="razzle">Razzle</GameLink>. Tres Away and Boss have their own order.<br/>
          <strong>See also:</strong> <Link to="/rules#play" className="text-primary hover:underline">Rules: Play the game</Link>
        </p>
      </>
    ),
  },
  {
    id: 'take-the-tie',
    term: 'Take the Tie',
    emoji: '🤝',
    keywords: ['take the tie', 'tie', 'stand', 'replay'],
    body: (
      <>
        <p className="mb-2">
          Tied for the worst hand, with the others you're tied with out of rolls, you can stop rolling and go to a replay
          instead of rolling to beat them.
        </p>
        <p className="text-sm text-muted-foreground">
          <strong>Rule of thumb:</strong> take the tie when the tied hand is hard to beat. The{' '}
          <Link to="/learn" className="text-primary hover:underline">guided round</Link> works one out exactly.<br/>
          <strong>See also:</strong> <Link to="#tie" className="text-primary hover:underline">Tie</Link>
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
          <Link to="#kicker" className="text-primary hover:underline">kicker</Link> wins.
        </p>
        <p className="text-sm mb-2">
          <strong>High:</strong> The higher kicker wins (e.g., [6,6] beats [5,5])<br/>
          <strong>Low:</strong> The lower kicker wins (e.g., [1,1] beats [2,2])
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

/** A to Z, however the list above is ordered */
const TERMS = [...GLOSSARY_TERMS].sort((a, b) => a.term.localeCompare(b.term))

const GlossaryPage = () => {
  const [search, setSearch] = useState('')

  const filtered = search.trim() === ''
    ? TERMS
    : TERMS.filter(entry => {
        const q = search.toLowerCase()
        return (
          entry.term.toLowerCase().includes(q) ||
          entry.keywords.some(k => k.includes(q))
        )
      })

  return (
    <Layout>
      <Page width="reading">
        <PageHeader
          title="Glossary"
          description="Common terms and phrases used in Refusal Dice."
        />

        <div className="mb-8">
          <Input
            type="search"
            aria-label="Search the glossary"
            placeholder="Search terms…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-lg py-3"
          />
          {search.trim() !== '' && (
            <p className="text-sm text-muted-foreground mt-2" aria-live="polite">
              {filtered.length === 0
                ? 'No matching terms found.'
                : `Showing ${filtered.length} of ${GLOSSARY_TERMS.length} terms`}
            </p>
          )}
        </div>

        <div className="space-y-6">
          {filtered.map(entry => (
            <Panel
              key={entry.id}
              id={entry.id}
              className="scroll-mt-20"
              title={
                <span className="flex items-center gap-2">
                  <span aria-hidden className="text-2xl">{entry.emoji}</span>
                  {entry.term}
                </span>
              }
            >
              {entry.body}
            </Panel>
          ))}
        </div>
      </Page>
    </Layout>
  )
}

export default GlossaryPage
