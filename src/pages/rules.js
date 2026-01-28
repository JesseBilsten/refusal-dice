import React from 'react'
import { Link } from 'gatsby'
import Layout from '../components/layout'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card'
import { Alert, AlertTitle, AlertDescription } from '../components/ui/alert'

export default () => (
  <Layout>
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="my-8 text-center">
        <h1 className="text-4xl font-bold text-foreground">Rules</h1>
        <p className="text-lg text-muted-foreground">How to play the game</p>
      </div>
      <hr className="my-8 border-border" />
      <h2 className="text-3xl font-semibold mb-2 text-foreground">Equipment</h2>
      <p className="text-muted-foreground mb-4">What you need to play</p>
      <h3 className="text-2xl font-semibold mb-2 text-foreground">5 dice</h3>
      <p className="mb-3">
        We prefer Michigan Red Eye's but any die will do. The red eye's make it a little faster to see what game you can play.
      </p>
      <a className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 mb-4" role="button" href="https://amzn.to/47ZTYoX">Buy Michigan Red Eye Dice on Amazon</a>
      <h3 className="text-2xl font-semibold mb-2 mt-6 text-foreground">Dice cup</h3>
      <p className="mb-3">
        You could use a dice tower, or a cup. Our group uses a nice Alex Cramer leather cup with ridges inside to help the dice tumble properly.
      </p>
      <a className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 mb-4" role="button" href="https://amzn.to/3w0X0w6">Buy Alex Cramer dice cups on Amazon</a>
      
      <h2 className="text-3xl font-semibold mb-2 mt-8 text-foreground">Object of the game</h2>
      <p className="text-muted-foreground mb-4">Be the last man standing</p>
      <p className="mb-6">
        Each game that is called will have 1 loser. In the event of a tie, those
        players who tied will play the same game again until a single loser is
        established. That loser takes a pencil. When you have 3 pencils you are
        out. The last player left without 3 pencils wins.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
        <Alert variant="muted" className="shadow-sm border-muted-foreground/30">
          <AlertTitle>Variation</AlertTitle>
          <AlertDescription>
            Some players will make an offer to split the pot based on the
            number of pencils each player has left.
          </AlertDescription>
        </Alert>
        
        <Alert variant="accent" className="shadow-sm border-accent">
          <AlertTitle>Example</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>2 players remain:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>
                👨 <em>Player A</em>
              </li>
              <li>
                👩 <em>Player B</em>
              </li>
            </ol>
            <p>The score:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>👨 has ✏️✏️ and the <Link to="/glossary#hammer"><span role="img" aria-label="hammer">🔨</span></Link></li>
              <li>👩 has ✏️</li>
            </ul>
            <p>
              👨 may offer to split the pot 50/50 with 👩 as it's likely he'll
              win the hand and there will be parity and 👩 will get the call to
              win.
            </p>
          </AlertDescription>
        </Alert>
      </div>
      
      <hr className="my-8 border-border" />
      
      <h2 className="text-3xl font-semibold mb-2 text-foreground">Setup</h2>
      <p className="text-muted-foreground mb-4">
        What you need to do before starting the game.
      </p>
      
      <h3 className="text-2xl font-semibold mb-3 mt-6 text-foreground">Requirements</h3>
      <ul className="list-disc list-inside space-y-2 mb-6">
        <li>
          Have 2 or more players:{' '}
          <span role="img" aria-label="players">
            👨👨
          </span>
          +
        </li>
        <li>
          Each player must have 5 dice:{' '}
          <span role="img" aria-label="dice">
            🎲🎲🎲🎲🎲
          </span>{' '}
          per{' '}
          <span role="img" aria-label="player">
            👨
          </span>
        </li>
        <li>
          A jar of pencils (or some way to record them):{' '}
          <span role="img" aria-label="pencils">
            ✏️✏️
          </span>{' '}
          per{' '}
          <span role="img" aria-label="player">
            👨
          </span>
        </li>
      </ul>
      <p className="mb-6">
        <strong>Note:</strong> You don't <em>need</em> pencils, you could use
        sugar packets or any "token" but for the sake of this guide, I'll refer
        to them as pencils.
      </p>
      
      <h3 className="text-2xl font-semibold mb-3 mt-6 text-foreground">Ante</h3>
      <ul className="list-disc list-inside mb-4">
        <li>
          <span role="img" aria-label="dollar bills">
            💵
          </span>{' '}
          $5 per player
        </li>
      </ul>
      <p className="mb-4">
        Playing for money is not a requirement, but it can make the game more
        fun.
      </p>
      <p className="mb-6">
        Different groups have different ante amounts and when it's required to
        put in, but a typical ante is $5 from each player at the beginning of
        the game. Once everyone is in (they've paid their $5 to the pot) then
        players can roll to see who goes first.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
        <Alert variant="muted" className="shadow-sm border-muted-foreground/30">
          <AlertTitle>Variation</AlertTitle>
          <AlertDescription>
            Some groups of players will have everyone add an additional $5
            when <Link to="glossary#parity">parity</Link> is reached.{' '}
            <Link to="glossary#parity">Parity</Link> is when ever player has 2
            pencils.
          </AlertDescription>
        </Alert>
        
        <Alert variant="accent" className="shadow-sm border-accent">
          <AlertTitle>Example</AlertTitle>
          <AlertDescription>
            3 players remain: <em>Player A</em>, <em>Player B</em>, and{' '}
            <em>Player C</em>. Each player has 2 ✏️s so <em>Player A</em>{' '}
            calls out, "Parity!" and all the players put their ✏️s back in the
            jar.
          </AlertDescription>
        </Alert>
      </div>
      
      <h3 className="text-2xl font-semibold mb-3 mt-8 text-foreground">
        Who goes first? <small className="text-muted-foreground">(aka the "piddle")</small>
      </h3>
      <ol className="list-decimal list-inside space-y-2 mb-4">
        <li>Each player rolls 1 die</li>
        <li>Highest value die wins</li>
      </ol>
      <p className="mb-6">
        <strong>In the event of a tie:</strong> Players with matching highest
        die values repeat step 1 until only one player has the highest die
      </p>
      
      <Alert className="!bg-accent/30 border-accent shadow-sm dark:!bg-accent/20 my-6">
        <AlertTitle>Example</AlertTitle>
        <AlertDescription>
          <p className="mb-4">
            <em>There are 4 players: A, B, C, and D.</em>
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <strong className="block mb-2">Roll 1</strong>
              <ul className="list-disc list-inside space-y-1 mb-3">
                <li>
                  <em>Player A</em> rolls a 5
                </li>
                <li>
                  <em>Player B</em> rolls a 2
                </li>
                <li>
                  <em>Player C</em> rolls a 3
                </li>
                <li>
                  <em>Player D</em> rolls a 5
                </li>
              </ul>
              <p className="text-sm">
                <em>Player A</em> and <em>Player D</em> are tied and roll again.
              </p>
            </div>
            <div>
              <strong className="block mb-2">Roll 2</strong>
              <ul className="list-disc list-inside space-y-1 mb-3">
                <li>
                  <em>Player A</em> rolls a 4
                </li>
                <li>
                  <em>Player D</em> rolls a 4
                </li>
              </ul>
              <p className="text-sm">
                <em>Player A</em> and <em>Player D</em> are tied again and roll a 3rd
                time.
              </p>
            </div>
            <div>
              <strong className="block mb-2">Roll 3</strong>
              <ul className="list-disc list-inside space-y-1 mb-3">
                <li>
                  <em>Player A</em> rolls a 6
                </li>
                <li>
                  <em>Player D</em> rolls a 2
                </li>
              </ul>
              <p className="text-sm">
                <em>Player A</em> wins the piddle and will be coming out (rolling
                first).
              </p>
            </div>
          </div>
        </AlertDescription>
      </Alert>
      
      <hr className="my-8 border-border" />
      
      <h2 className="text-3xl font-semibold mb-2 text-foreground">Gameplay</h2>
      <p className="text-muted-foreground mb-6">
        Roll, call game, accept or refuse, play game, award pencil, repeat until
        there's one player left.
      </p>
      
      <h3 className="text-2xl font-semibold mb-3 mt-8 text-foreground">Phase 1: Roll</h3>
      <p className="mb-6">
        Everyone rolls all their dice and hides the results from other players.
      </p>
      
      <Alert className="!bg-muted shadow-sm border-muted-foreground/30 my-6">
        <AlertTitle>Variation</AlertTitle>
        <AlertDescription>
          Some players will wait to roll their hands if they aren't the caller,
          first refusal or second refusal.
        </AlertDescription>
      </Alert>
      
      <h3 className="text-2xl font-semibold mb-3 mt-8 text-foreground">Phase 2: Select game</h3>
      <p className="mb-6">
        Whoever won the piddle needs to now look at their dice and call the
        first <Link to="games">game</Link> they wish to play.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle id="first-call">First Call</CardTitle>
            <CardDescription>
              Aka "the hammer" <Link to="/glossary#hammer"><span role="img" aria-label="hammer">🔨</span></Link>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              Whomever has the <Link to="/glossary#hammer"><span role="img" aria-label="hammer">🔨</span></Link> looks at their hand and calls out a game they wish to play first
              knowing that the player directly to their left has the right of{' '}
              <em>first refusal</em>.
            </p>
            <ul className="space-y-2 divide-y divide-border">
              <li className="pt-2 first:pt-0">
                <Link to="/games" className="text-primary hover:underline">Call a game</Link> →{' '}
                <Link to="/rules#first-refusal" className="text-primary hover:underline">First Refusal</Link>
              </li>
              <li className="pt-2">
                <Link to="/glossary#bark" className="text-primary hover:underline">Bark</Link> → Game ends and Hammer passes to the left
              </li>
            </ul>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle id="first-refusal">First Refusal</CardTitle>
            <CardDescription>
              First player to the callers left
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              The player to the caller's immediate left looks at her dice and
              determines if she can play the game or not. If she can, she
              should accept and say, "I'll play". If she cannot, she says,
              "No".
            </p>
            <ul className="space-y-2 divide-y divide-border">
              <li className="pt-2 first:pt-0">
                <Link to="/rules#second-refusal" className="text-primary hover:underline">Refuse</Link> →{' '}
                <Link to="/rules#second-refusal" className="text-primary hover:underline">Second Refusal</Link>
              </li>
              <li className="pt-2">
                <Link to="/rules#play-game" className="text-primary hover:underline">Accept</Link> →{' '}
                <Link to="/rules#play-game" className="text-primary hover:underline">Play game</Link>
              </li>
            </ul>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle id="second-refusal">Second Refusal</CardTitle>
            <CardDescription>
              Second player to the callers left
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              The second player to the hammer's left can "Accept" or "Refuse"
              the call. If she accepts, then everyone plays. If she refuses
              the hammer must call their second and final call.
            </p>
            <ul className="space-y-2 divide-y divide-border">
              <li className="pt-2 first:pt-0">
                <Link to="/glossary#refuse" className="text-primary hover:underline">Refuse</Link> →{' '}
                <Link to="/rules#second-call" className="text-primary hover:underline">Second Call</Link>
              </li>
              <li className="pt-2">
                <Link to="/glossary#accept" className="text-primary hover:underline">Accept</Link> →{' '}
                <Link to="/rules#play-game" className="text-primary hover:underline">Play game</Link>
              </li>
            </ul>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle id="second-call">Second Call</CardTitle>
            <CardDescription>No refusal!</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              If the first call was refused, all players must play the callers
              second game.
            </p>
            <ul className="space-y-2 divide-y divide-border">
              <li className="pt-2 first:pt-0">
                <Link to="/rules#play-game" className="text-primary hover:underline">Play game</Link>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
      
      <h3 id="play-game" className="text-2xl font-semibold mb-3 mt-8 text-foreground">Phase 3: Play game</h3>
      <p className="mb-6">
        All players must now play the game that was either accepted in the First
        Call or if the game was refused twice, then whatever the callers Second
        Call is.
      </p>
      
      <Alert className="!bg-muted shadow-sm border-muted-foreground/30 my-6">
        <AlertTitle>Ties</AlertTitle>
        <AlertDescription className="space-y-3">
          <p>
            Ties are handled by re-rolling the same game. Only the players who tie
            participate and players that aren't tied for the low hand do not have
            to play the next hand.
          </p>
          <p className="font-semibold">
            Exception: <span className="text-sm font-normal">2 players <span role="img" aria-label="player">👨</span><span role="img" aria-label="player">👨</span></span>
          </p>
          <p>
            If there are only two players left, rather than play the same game again, the call is passed.
          </p>
        </AlertDescription>
      </Alert>
      
      <h3 className="text-2xl font-semibold mb-3 mt-8 text-foreground">Phase 4: Award a pencil</h3>
      <p className="mb-6">
        Whomever had the lowest hand in Phase 2 takes a pencil and gets to call
        the next game.
      </p>
      
      <Alert className="!bg-muted shadow-sm border-muted-foreground/30 my-6">
        <AlertTitle>3 <span role="img" aria-label="pencil">✏️</span>'s</AlertTitle>
        <AlertDescription>
          If a player has 2 pencils already and receives their 3rd, they go out
          and the call passes to the next player to their left who doesn't have
          3 pencils.
        </AlertDescription>
      </Alert>
      
      <Alert className="!bg-muted shadow-sm border-muted-foreground/30 my-6">
        <AlertTitle>
          Exception: <span className="text-sm font-normal">2 players <span role="img" aria-label="player">👨</span><span role="img" aria-label="player">👨</span></span>
        </AlertTitle>
        <AlertDescription>
          If only 2 players remain, the call is passed regardless of who lost.
        </AlertDescription>
      </Alert>
      
      <h3 className="text-2xl font-semibold mb-3 mt-8 text-foreground">Repeat</h3>
      <p className="mb-6">
        Continue repeating phases 1-4 until only one player remains. That player
        collects the pot.
      </p>
    </section>
  </Layout>
)
