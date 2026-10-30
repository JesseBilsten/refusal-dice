import React, { useState } from 'react'
import Layout from '../components/layout'
import Page, { PageHeader, Panel, TextLink } from '../components/Page'
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
          When a player in the <TextLink to="#first-refusal">First Refusal</TextLink> or{' '}
          <TextLink to="#second-refusal">Second Refusal</TextLink> position decides to play the called game.
        </p>
        <p className="text-sm text-muted-foreground">
          <strong>Usage:</strong> "I'll accept" or "I'll play"<br/>
          <strong>See also:</strong> <TextLink to="#refuse">Refuse</TextLink>,{' '}
          <TextLink to="/rules#refusal">Rules: First Refusal</TextLink>
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
          When the <TextLink to="#hammer">Hammer</TextLink> has a weak hand and chooses not to make a call,
          instead passing the hammer to the player on their left without playing a game.
        </p>
        <p className="text-sm text-muted-foreground mb-2">
          <strong>Usage:</strong> "I'm barking" or "Bark!"<br/>
          <strong>Strategy note:</strong> You can only bark on your first call. Use it when your hand is too weak to risk a game.
        </p>
        <p className="text-sm text-muted-foreground">
          <strong>See also:</strong> <TextLink to="#hammer">Hammer</TextLink>,{' '}
          <TextLink to="/games/barking">Barking Strategy</TextLink>
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
          The player directly to the left of the <TextLink to="#hammer">Hammer</TextLink>.
          They have the first opportunity to <TextLink to="#accept">accept</TextLink> or{' '}
          <TextLink to="#refuse">refuse</TextLink> the called game.
        </p>
        <p className="text-sm text-muted-foreground mb-2">
          <strong>Important:</strong> If First Refusal refuses and Second Refusal accepts, First Refusal still has to play!
        </p>
        <p className="text-sm text-muted-foreground">
          <strong>See also:</strong> <TextLink to="#second-refusal">Second Refusal</TextLink>,{' '}
          <TextLink to="/rules#refusal">Rules: First Refusal</TextLink>
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
          <strong>Passing the Hammer:</strong> The hammer passes to the left after each round (or when someone <TextLink to="#bark">barks</TextLink>).
        </p>
        <p className="text-sm text-muted-foreground">
          <strong>See also:</strong> <TextLink to="#bark">Bark</TextLink>,{' '}
          <TextLink to="/rules#call">Rules: First Call</TextLink>,{' '}
          <TextLink to="/strategy-assistant">Hammer Strategy</TextLink>
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
          <strong>Example:</strong> In <TextLink to="/games/10-3">10-3</TextLink>,
          if you roll [1,2,3,5,6], the 1+3+6=10, so your kicker is [2,5], a total of 7.
        </p>
        <p className="text-sm text-muted-foreground">
          <strong>High vs Low:</strong> The kicker's dice are added up. In "High" games the higher total wins; in "Low" games the lower total wins.<br/>
          <strong>Rolled whole:</strong> Once the dice you keep make the game, the whole kicker is re-rolled at once. You can't keep part of your kicker.<br/>
          <strong>See also:</strong> <TextLink to="/games">Games</TextLink>,{' '}
          <TextLink to="/strategy-assistant">Strategy Assistant</TextLink>
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
          When all remaining players have exactly 2 <TextLink to="#pencil">pencils</TextLink>.
          Some groups reset pencils to zero and add additional money to the pot at parity.
        </p>
        <p className="text-sm text-muted-foreground">
          <strong>House rules vary:</strong> Check with your group about parity rules before playing.<br/>
          <strong>See also:</strong> <TextLink to="/rules#setup">Rules: Ante Variations</TextLink>
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
          <strong>See also:</strong> <TextLink to="#parity">Parity</TextLink>,{' '}
          <TextLink to="/rules">Rules: Object of the Game</TextLink>
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
          The initial roll to determine who gets the <TextLink to="#hammer">Hammer</TextLink> first.
          Each player rolls one die. Highest roll wins; players tied for the highest roll again (a roll-off).
        </p>
        <p className="text-sm text-muted-foreground">
          <strong>See also:</strong> <TextLink to="/rules#setup">Rules: Who Goes First</TextLink>
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
          When a player in the <TextLink to="#first-refusal">First Refusal</TextLink> or{' '}
          <TextLink to="#second-refusal">Second Refusal</TextLink> position decides NOT to play the called game,
          passing the decision to the next player.
        </p>
        <p className="text-sm text-muted-foreground mb-2">
          <strong>Usage:</strong> "No" or "I refuse"<br/>
          <strong>Warning:</strong> If you're First Refusal and refuse, you may still have to play if Second Refusal accepts!
        </p>
        <p className="text-sm text-muted-foreground">
          <strong>See also:</strong> <TextLink to="#accept">Accept</TextLink>,{' '}
          <TextLink to="/strategy-assistant">Refusal Strategy</TextLink>
        </p>
      </>
    ),
  },
  {
    id: 'second-call',
    term: 'Second Call',
    emoji: '2️⃣',
    keywords: ['second call', '2nd call', 'come back', 'comeback', 'different game', 'everyone plays'],
    body: (
      <>
        <p className="mb-2">
          If both <TextLink to="#first-refusal">First</TextLink> and{' '}
          <TextLink to="#second-refusal">Second Refusal</TextLink> refuse the first call,
          the <TextLink to="#hammer">Hammer</TextLink> must call a completely different game.
          No refusals are allowed - everyone must play.
        </p>
        <p className="text-sm text-muted-foreground mb-2">
          <strong>Important:</strong> Second call must be a different game, not just a different variant (e.g., can't call "<GameLink id="monterey">Monterey</GameLink> High" if first call was "<GameLink id="monterey">Monterey</GameLink> Low").
        </p>
        <p className="text-sm text-muted-foreground">
          <strong>See also:</strong> <TextLink to="/rules#refusal">Rules: Second Call</TextLink>,{' '}
          <TextLink to="/strategy-assistant/?tab=second">predict the second call</TextLink>
        </p>
      </>
    ),
  },
  {
    id: 'come-back',
    term: 'Come Back / Come Back Roll',
    emoji: '↩️',
    keywords: ['come back', 'comeback', 'come back roll', 'coming back', 'second call', '2nd call'],
    body: (
      <>
        <p className="mb-2">
          The <TextLink to="#hammer">Hammer</TextLink>'s{' '}
          <TextLink to="#second-call">Second Call</TextLink>: the game they call if
          both refusals turn down the first. Nobody can refuse it.
        </p>
        <p className="text-sm text-muted-foreground mb-2">
          <em>"I may not have 10-3 Low, but I might have the come back."</em> ·{' '}
          <em>"What are you coming back with?"</em> (what's your second call going to be?)
        </p>
        <p className="text-sm text-muted-foreground">
          <strong>See also:</strong>{' '}
          <TextLink to="/strategy-assistant/?tab=second">
            the likeliest come back after each call
          </TextLink>
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
          The player two seats to the left of the <TextLink to="#hammer">Hammer</TextLink> (one seat left of{' '}
          <TextLink to="#first-refusal">First Refusal</TextLink>). They can accept or refuse only if First Refusal refused.
        </p>
        <p className="text-sm text-muted-foreground mb-2">
          <strong>Key decision:</strong> Accepting means everyone plays the Hammer's call. Refusing forces the Hammer's{' '}
          <TextLink to="#second-call">Second Call</TextLink> where everyone plays.
        </p>
        <p className="text-sm text-muted-foreground">
          <strong>See also:</strong> <TextLink to="/rules#refusal">Rules: Second Refusal</TextLink>
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
          When multiple players have the same <TextLink to="#kicker">kicker</TextLink> total after playing a game.
          The goal is to find ONE loser per round.
        </p>
        <p className="text-sm mb-2">
          <strong>With 3+ players:</strong> Players tied for the worst hand replay the same game until there's a single loser.
          On your turn you can <TextLink to="#take-the-tie">take the tie</TextLink> or roll to beat them.
        </p>
        <p className="text-sm mb-2">
          <strong>With 2 players:</strong> Ties, or both players missing the game, result in the <TextLink to="#hammer">Hammer</TextLink> passing
          to the other player. No pencil is awarded.
        </p>
        <p className="text-sm text-muted-foreground">
          <strong>See also:</strong> <TextLink to="/rules#score">Rules: Playing the Game</TextLink>
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
          <TextLink to="#kicker">kicker</TextLink> for the call.
          In a kicker game everyone who missed rolls on their own until they make it or run out; then
          <strong> the worst hand rolls first</strong>, until it climbs off the bottom or runs out of rolls. If it never
          gets off the bottom, nobody else has to roll, and it takes the <TextLink to="#pencil">pencil</TextLink>.
        </p>
        <p className="text-sm text-muted-foreground">
          <strong>Applies to:</strong> the kicker games and <GameLink id="razzle">Razzle</GameLink>. Tres Away and Boss have their own order.<br/>
          <strong>See also:</strong> <TextLink to="/rules#play">Rules: Play the game</TextLink>
        </p>
      </>
    ),
  },
  {
    id: 'coming-out',
    term: 'Coming Out',
    emoji: '🎲',
    keywords: ['coming out', 'come out', 'roll', 'start', 'round'],
    body: (
      <>
        <p className="mb-2">
          What the <TextLink to="#hammer">Hammer</TextLink> says to start a round:
          “Coming out!” lets everyone know the dice are about to be rolled. Everyone rolls their five dice and keeps
          them hidden, then the Hammer calls a game (or <TextLink to="#bark">barks</TextLink>).
        </p>
        <p className="text-sm text-muted-foreground">
          <strong>Usage:</strong> "Coming out!"<br/>
          <strong>See also:</strong> <TextLink to="#hammer">Hammer</TextLink>,{' '}
          <TextLink to="/rules#roll">Rules: Roll</TextLink>
        </p>
      </>
    ),
  },
  {
    id: 'all-day',
    term: 'All Day',
    emoji: '🛑',
    keywords: ['all day', 'out of rolls', 'no rolls', 'done', 'final'],
    body: (
      <>
        <p className="mb-2">
          Out of rolls. A player who's all day can't change their hand, so it's final. Anyone whose hand is
          already better than theirs is <TextLink to="#in-the-cup">in the cup</TextLink>.
        </p>
        <p className="text-sm text-muted-foreground">
          <strong>Example:</strong> "Ava's all day with a kicker of 5." Everyone above a 5 is safe.<br/>
          <strong>See also:</strong> <TextLink to="#worst-hand">Worst Hand</TextLink>,{' '}
          <TextLink to="/rules#play">Rules: Play the game</TextLink>
        </p>
      </>
    ),
  },
  {
    id: 'in-the-cup',
    term: 'In the Cup (safe)',
    emoji: '✅',
    keywords: ['in the cup', 'safe', 'cup', 'can\'t lose', 'standings'],
    body: (
      <>
        <p className="mb-2">
          Safe for the round. Someone who's <TextLink to="#all-day">all day</TextLink> already
          has a worse hand than yours, so you can't take the{' '}
          <TextLink to="#pencil">pencil</TextLink>, and you never have to roll again this round.
          Your dice can go back in the cup.
        </p>
        <p className="text-sm text-muted-foreground">
          <strong>In Play:</strong> the standings mark everyone in the cup.<br/>
          <strong>See also:</strong> <TextLink to="#worst-hand">Worst Hand</TextLink>
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
          Tied for the worst hand, you can stop rolling and offer to replay instead of rolling to beat them. It's a
          replay only if everyone tied takes it. If one of them rolls instead and climbs off the bottom, you roll on with
          the rolls you have left; if they end up the worst hand, they lose. Tied players sometimes all roll to
          climb past a higher hand and "bring the leader back in" rather than replay.
        </p>
        <p className="text-sm text-muted-foreground">
          <strong>Rule of thumb:</strong> take the tie when the tied hand is hard to beat. The{' '}
          <TextLink to="/learn">guided round</TextLink> works one out exactly.<br/>
          <strong>See also:</strong> <TextLink to="#tie">Tie</TextLink>
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
          <TextLink to="#kicker">kicker</TextLink> wins.
        </p>
        <p className="text-sm mb-2">
          <strong>High:</strong> The higher kicker wins (e.g., [6,6] beats [5,5])<br/>
          <strong>Low:</strong> The lower kicker wins (e.g., [1,1] beats [2,2])
        </p>
        <p className="text-sm text-muted-foreground">
          <strong>Important:</strong> Always specify which variant you're calling!<br/>
          <strong>See also:</strong> <TextLink to="/games">Games List</TextLink>
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
          Slang name for <TextLink to="/games/10-3">10-3</TextLink>,
          named after Frank Richardson from SLO Country Club who famously struggled to roll it.
        </p>
        <p className="text-sm text-muted-foreground">
          <strong>Usage:</strong> "I'll call Frankie Low"
        </p>
      </>
    ),
  },
  {
    id: 'keep',
    term: 'Keep / Kept Dice',
    emoji: '✋',
    keywords: ['keep', 'kept', 'hold', 'commit', 'locked', 're-roll'],
    body: (
      <>
        <p className="mb-2">
          The dice you leave on the table while you re-roll the rest. You can only keep dice toward the called game: nothing
          in the 10s until you have it (a 10 has to come in one roll), a{' '}
          <TextLink to="#connector">connector</TextLink> in Ship, Captain, Crew or Monterey,
          one pair in 7's or Pairs. Never part of your <TextLink to="#kicker">kicker</TextLink>.
        </p>
        <p className="text-sm text-muted-foreground">
          <strong>Kept dice stay kept:</strong> once you keep dice you're committed to them for the rest of your rolls,
          and they're part of your game (a kept pair stays a pair). Once you've made the game its dice can't be
          re-rolled; only Razzle and Boss let you pick those up.<br/>
          <strong>See also:</strong> <TextLink to="/rules">Rules</TextLink>,{' '}
          <TextLink to="/odds-lab/?tab=keep">Odds Lab: what should I keep?</TextLink>
        </p>
      </>
    ),
  },
  {
    id: 'cocked-die',
    term: 'Cocked Die',
    emoji: '📐',
    keywords: ['cocked', 'leaning', 'tilted', 'crooked', 'not flat', 're-roll'],
    body: (
      <>
        <p className="mb-2">
          A die that doesn't land flat: it leans against the cup, another die or the edge of the
          table, so you can't say which face is up. A cocked die doesn't count. Pick it up and
          re-roll it.
        </p>
        <p className="text-sm text-muted-foreground">
          <strong>Usage:</strong> "That one's cocked, roll it again"<br/>
          <strong>See also:</strong> <TextLink to="#stacked-dice">Stacked Dice</TextLink>,{' '}
          <TextLink to="#off-the-table">Off the Table</TextLink>
        </p>
      </>
    ),
  },
  {
    id: 'stacked-dice',
    term: 'Stacked Dice',
    emoji: '🗼',
    keywords: ['stacked', 'stack', 'on top', 'tower', 're-roll'],
    body: (
      <>
        <p className="mb-2">
          A die that lands on top of another. Neither one counts: re-roll both, the same as
          a <TextLink to="#cocked-die">cocked die</TextLink>.
        </p>
        <p className="text-sm text-muted-foreground">
          <strong>Usage:</strong> "Stacked! Roll them again"<br/>
          <strong>See also:</strong> <TextLink to="#cocked-die">Cocked Die</TextLink>
        </p>
      </>
    ),
  },
  {
    id: 'off-the-table',
    term: 'Off the Table',
    emoji: '🫳',
    keywords: ['off the table', 'floor', 'dropped', 'fell', 'rolled off', 're-roll'],
    body: (
      <>
        <p className="mb-2">
          A die that rolls off the table (onto the floor, a lap or the next table over)
          doesn't count. Pick it up and re-roll it, like a{' '}
          <TextLink to="#cocked-die">cocked die</TextLink>.
        </p>
        <p className="text-sm text-muted-foreground">
          <strong>Usage:</strong> "Off the table, that one's a re-roll"<br/>
          <strong>See also:</strong> <TextLink to="#cocked-die">Cocked Die</TextLink>,{' '}
          <TextLink to="#stacked-dice">Stacked Dice</TextLink>
        </p>
      </>
    ),
  },
  {
    id: 'connector',
    term: 'Connector',
    emoji: '🔗',
    keywords: ['connector', 'straight', 'ship captain crew', 'monterey', 'partial'],
    body: (
      <>
        <p className="mb-2">
          Two dice in a row that you may keep toward a straight: 1-2 or 5-6 in{' '}
          <TextLink to="/games/ship-captain-crew">Ship, Captain, Crew</TextLink> (pick one),
          and 2-3, 3-4 or 4-5 in <TextLink to="/games/monterey">Monterey</TextLink>. Some
          tables also let you keep a lone 3 or 4 in Monterey; set that under House rules in Settings.
        </p>
        <p className="text-sm text-muted-foreground">
          <strong>Usage:</strong> "I've got the connector, keeping 3-4"<br/>
          <strong>See also:</strong> <TextLink to="#keep">Keep</TextLink>
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
