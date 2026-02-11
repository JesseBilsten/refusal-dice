import React from 'react'
import Layout from '../components/layout'
import Die from '../components/Die'
import Game from '../components/Game'

const GamesPage = () => (

  <Layout>
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="my-8 text-center">
        <h1 className="text-4xl font-bold text-foreground">Games</h1>
        <p className="text-lg text-muted-foreground">A list of the games you can call in Refusal Dice</p>
      </div>
      <hr className="my-8 border-border" />
      <div className="pb-8 px-6 py-6 rounded-lg bg-muted/20 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 id="10-2" className="text-3xl font-semibold mb-3 text-foreground">
            ✌️ 10-2 <small className="text-muted-foreground text-base">high or low</small>
          </h2>
          <p>
            2 dice add up to 10 and the remaining 3 dice are either high or low.
          </p>
        </div>
        <div className="">
          <div className="flex justify-end gap-2 mb-2">
            <Game type="10-2" className="mr-1">
              <Die number="4" />
              <Die number="6" />
            </Game>
            <Game type="low">
              <Die number="1" />
              <Die number="1" />
              <Die number="1" />
            </Game>
          </div>
          <div className="flex justify-end gap-2 mb-2">
            <Game type="10-2" className="mr-1">
              <Die number="5" />
              <Die number="5" />
            </Game>
            <Game type="high">
              <Die number="6" />
              <Die number="6" />
              <Die number="6" />
            </Game>
          </div>
        </div>
      </div>
      <hr />
      <div className="pb-8 px-6 py-6 rounded-lg bg-muted/20 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="">
          <h2 id="10-3" className="text-3xl font-semibold mb-3 text-foreground">
            👌 10-3  <small className="text-muted-foreground">high or low</small>
          </h2>
          <p>
            3 dice add up to 10 and the remaining 2 dice are either high or low.
          </p>
          <p>AKA "Frankie"</p>
        </div>
        <div className="">
          <div className="flex justify-end gap-2 mb-2">
            <Game type="10-3" className="mr-1">
              <Die number="1" />
              <Die number="3" />
              <Die number="6" />
            </Game>
            <Game type="low">
              <Die number="1" />
              <Die number="1" />
            </Game>
          </div>
          <div className="flex justify-end gap-2 mb-2">
            <Game type="10-3" className="mr-1">
              <Die number="2" />
              <Die number="3" />
              <Die number="5" />
            </Game>
            <Game type="high">
              <Die number="6" />
              <Die number="6" />
            </Game>
          </div>
        </div>
      </div>
      <hr className="my-8 border-border" />
      <div className="pb-8 px-6 py-6 rounded-lg bg-muted/20 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="">
          <h2 id="10-4" className="text-3xl font-semibold mb-3 text-foreground">
            🔫 10-4 <small className="text-muted-foreground">high or low</small>
          </h2>
          <p>
            4 dice add up to 10 and the remaining die is either high or low.
          </p>
          <p>AKA "Shotgun"</p>
        </div>
        <div className="">
          <div className="flex justify-end gap-2 mb-2">
            <Game type="10-4" className="mr-1">
              <Die number="1" />
              <Die number="2" />
              <Die number="6" />
              <Die number="1" />
            </Game>
            <Game type="low">
              <Die number="1" />
            </Game>
          </div>
          <div className="flex justify-end gap-2 mb-2">
            <Game type="10-4" className="mr-1">
              <Die number="1" />
              <Die number="2" />
              <Die number="3" />
              <Die number="4" />
            </Game>
            <Game type="high">
              <Die number="6" />
            </Game>
          </div>
        </div>
      </div>
      <hr className="my-8 border-border" />
      <div className="pb-8 px-6 py-6 rounded-lg bg-muted/20 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="">
          <h2 id="ship-captain-crew" className="text-3xl font-semibold mb-3 text-foreground">
            ⚓️ Ship, Captain, Crew <small className="text-muted-foreground">high or low</small>
          </h2>
          <p>
            3 dice make up an outside straight and the remaining 2 dice are
            either high or low.
          </p>
          <p>AKA "Outside straight", "Crew"</p>
        </div>
        <div className="">
          <div className="flex justify-end gap-2 mb-2">
            <Game type="ship, captain, crew" className="mr-1">
              <Die number="4" />
              <Die number="5" />
              <Die number="6" />
            </Game>
            <Game type="low">
              <Die number="1" />
              <Die number="1" />
            </Game>
          </div>
          <div className="flex justify-end gap-2 mb-2">
            <Game type="ship, captain, crew" className="mr-1">
              <Die number="1" />
              <Die number="2" />
              <Die number="3" />
            </Game>
            <Game type="high">
              <Die number="6" />
              <Die number="6" />
            </Game>
          </div>
        </div>
      </div>
      <hr className="my-8 border-border" />
      <div className="pb-8 px-6 py-6 rounded-lg bg-muted/20 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="">
          <h2 id="monterey" className="text-3xl font-semibold mb-3 text-foreground">
            🔄 Monterey <small className="text-muted-foreground">high or low</small>
          </h2>
          <p>
            3 dice make up an inside straight and the remaining 2 dice are
            either high or low.
          </p>
          <p>AKA "Inside straight"</p>
        </div>
        <div className="">
          <div className="flex justify-end gap-2 mb-2">
            <Game type="monterey" className="mr-1">
              <Die number="2" />
              <Die number="3" />
              <Die number="4" />
            </Game>
            <Game type="low">
              <Die number="1" />
              <Die number="1" />
            </Game>
          </div>
          <div className="flex justify-end gap-2 mb-2">
            <Game type="monterey" className="mr-1">
              <Die number="3" />
              <Die number="4" />
              <Die number="5" />
            </Game>
            <Game type="high">
              <Die number="6" />
              <Die number="6" />
            </Game>
          </div>
        </div>
      </div>
      <hr className="my-8 border-border" />
      <div className="pb-8 px-6 py-6 rounded-lg bg-muted/20 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="">
          <h2 id="vegas" className="text-3xl font-semibold mb-3 text-foreground">
            🎰 7's <small className="text-muted-foreground">high or low</small>
          </h2>
          <p>
            2 sets of 2 dice add up to 7 and or 11 and the remaining die is
            either high or low.
          </p>
          <p>AKA "7-11", "7 and/or 11's", "Vegas"</p>
        </div>
        <div className="">
          <div className="flex justify-end gap-2 mb-2">
            <Game type="vegas" className="mr-1">
              <Die number="5" />
              <Die number="6" />
            </Game>
            <Game type="vegas" className="mr-1">
              <Die number="1" />
              <Die number="6" />
            </Game>
            <Game type="low">
              <Die number="1" />
            </Game>
          </div>
          <div className="flex justify-end gap-2 mb-2">
            <Game type="vegas" className="mr-1">
              <Die number="2" />
              <Die number="5" />
            </Game>
            <Game type="vegas" className="mr-1">
              <Die number="3" />
              <Die number="4" />
            </Game>
            <Game type="high">
              <Die number="6" />
            </Game>
          </div>
        </div>
      </div>
      <hr className="my-8 border-border" />
      <div className="pb-8 px-6 py-6 rounded-lg bg-muted/20 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="">
          <h2 id="pairs" className="text-3xl font-semibold mb-3 text-foreground">
            🍐 Pairs <small className="text-muted-foreground">high or low</small>
          </h2>
          <p>
            2 sets of 2 dice are matching pairs and the remaining die is either
            high or low
          </p>
        </div>
        <div className="">
          <div className="flex justify-end gap-2 mb-2">
            <Game type="pairs" className="mr-1">
              <Die number="2" />
              <Die number="2" />
              <Die number="4" />
              <Die number="4" />
            </Game>
            <Game type="low">
              <Die number="1" />
            </Game>
          </div>
          <div className="flex justify-end gap-2 mb-2">
            <Game type="pairs" className="mr-1">
              <Die number="6" />
              <Die number="6" />
              <Die number="6" />
              <Die number="6" />
            </Game>
            <Game type="high">
              <Die number="6" />
            </Game>
          </div>
        </div>
      </div>
      <hr className="my-8 border-border" />
      <div className="pb-8 px-6 py-6 rounded-lg bg-muted/20 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="">
					<h2 id="razzle" className="text-3xl font-semibold mb-3 text-foreground">✨ Razzle</h2>
          <p>Most amount of any one number with aces being wild.</p>
        </div>
        <div className="">
          <div className="flex justify-end gap-2 mb-2">
            <Game type="razzle: (3) 6's" className="mr-1">
              <Die number="1" />
              <Die number="6" />
              <Die number="6" />
            </Game>
          </div>
          <div className="flex justify-end gap-2 mb-2">
            <Game type="razzle: (4) 5's" className="mr-1">
              <Die number="1" />
              <Die number="5" />
              <Die number="1" />
              <Die number="1" />
            </Game>
          </div>
          <div className="flex justify-end gap-2 mb-2">
            <Game type="razzle: (5) 6's" className="mr-1">
              <Die number="1" />
              <Die number="1" />
              <Die number="1" />
              <Die number="1" />
            </Game>
          </div>
        </div>
      </div>
      <hr className="my-8 border-border" />
      <div className="pb-8 px-6 py-6 rounded-lg bg-muted/20 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="">
          <h2 id="boss" className="text-3xl font-semibold mb-3 text-foreground">💼 Boss</h2>
          <p>
            The highest poker hand is the "Boss". If two players have the same
            highest hand, there's no boss and the call is passed to the current
            callers left. If a Boss is established, she rolls her remaining die
            or dice and then determines if she wants everyone else to "come on
            up" meaning they all get 1 roll to try and beat her hand. If she
            doesn't want to play because she has a poor hand she can choose to
            "pick them up" and pass the call.
          </p>
          <p>
            High numbers are more valuable than low. E.g. 3 of a kind with{' '}
            <Die number="6" inline /> is better than with <Die number="5" inline />
          </p>
        </div>
        <div className="">
          <div className="flex justify-end gap-2 mb-2">
            <Game type="5 of a kind" className="mr-1">
              <Die number="2" />
              <Die number="2" />
              <Die number="2" />
              <Die number="2" />
              <Die number="2" />
            </Game>
          </div>
          <div className="flex justify-end gap-2 mb-2">
            <Game type="4 of a kind" className="mr-1">
              <Die number="5" />
              <Die number="5" />
              <Die number="5" />
              <Die number="5" />
            </Game>
          </div>
          <div className="flex justify-end gap-2 mb-2">
            <Game type="full house" className="mr-1">
              <Die number="4" />
              <Die number="4" />
              <Die number="4" />
              <Die number="1" />
              <Die number="1" />
            </Game>
          </div>
          <div className="flex justify-end gap-2 mb-2">
            <Game type="3 of a kind" className="mr-1">
              <Die number="1" />
              <Die number="1" />
              <Die number="1" />
            </Game>
          </div>
          <div className="flex justify-end gap-2 mb-2">
            <Game type="2 pair" className="mr-1">
              <Die number="1" />
              <Die number="1" />
              <Die number="3" />
              <Die number="3" />
            </Game>
          </div>
          <div className="flex justify-end gap-2 mb-2">
            <Game type="1 pair" className="mr-1">
              <Die number="5" />
              <Die number="5" />
            </Game>
          </div>
        </div>
      </div>
      <hr className="my-8 border-border" />
      <div className="pb-8 px-6 py-6 rounded-lg bg-muted/20 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="">
          <h2 id="boss" className="text-3xl font-semibold mb-3 text-foreground">👑 Boss</h2>
          <p className="mb-2">
            Poker-style hands without straights or flushes. All players reveal their dice, and the highest hand becomes the "Boss."
          </p>
          <p className="mb-2">
            <strong>Hand Rankings (highest to lowest):</strong>
          </p>
          <ul className="list-disc list-inside mb-2 space-y-1">
            <li>5-of-a-kind (e.g., five 6s)</li>
            <li>4-of-a-kind (e.g., four 5s)</li>
            <li>Full House (e.g., three 4s, two 3s)</li>
            <li>3-of-a-kind (e.g., three 6s)</li>
            <li>Two Pair (e.g., two 6s, two 4s)</li>
            <li>Pair (e.g., two 5s)</li>
            <li>High Card (e.g., 6-5-4-3-1)</li>
          </ul>
          <p className="mb-2">
            <strong>Boss Mechanics:</strong> If there's a Boss, they can pick up and re-roll any dice that won't break their winning hand. After re-rolling, the Boss can either call up the other players (everyone re-rolls once to avoid losing) or say "Pick them up" (no loser, play passes left).
          </p>
          <p className="text-sm text-muted-foreground">
            Note: Hands use poker tie-breaking rules. Two pairs with 6s over 2s beats two pairs with 5s over 4s.
          </p>
        </div>
        <div className="">
          <div className="flex justify-end gap-2 mb-2">
            <Game type="5 of a kind" className="mr-1">
              <Die number="6" />
              <Die number="6" />
              <Die number="6" />
              <Die number="6" />
              <Die number="6" />
            </Game>
          </div>
          <div className="flex justify-end gap-2 mb-2">
            <Game type="4 of a kind" className="mr-1">
              <Die number="5" />
              <Die number="5" />
              <Die number="5" />
              <Die number="5" />
              <Die number="2" />
            </Game>
          </div>
          <div className="flex justify-end gap-2 mb-2">
            <Game type="Full House" className="mr-1">
              <Die number="4" />
              <Die number="4" />
              <Die number="4" />
              <Die number="3" />
              <Die number="3" />
            </Game>
          </div>
          <div className="flex justify-end gap-2 mb-2">
            <Game type="3 of a kind" className="mr-1">
              <Die number="6" />
              <Die number="6" />
              <Die number="6" />
              <Die number="4" />
              <Die number="2" />
            </Game>
          </div>
          <div className="flex justify-end gap-2 mb-2">
            <Game type="Two Pair" className="mr-1">
              <Die number="6" />
              <Die number="6" />
              <Die number="4" />
              <Die number="4" />
              <Die number="1" />
            </Game>
          </div>
          <div className="flex justify-end gap-2 mb-2">
            <Game type="Pair" className="mr-1">
              <Die number="5" />
              <Die number="5" />
              <Die number="6" />
              <Die number="3" />
              <Die number="1" />
            </Game>
          </div>
        </div>
      </div>
      <hr className="my-8 border-border" />
      <div className="pb-8 px-6 py-6 rounded-lg bg-muted/20 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="">
          <h2 id="tres-away" className="text-3xl font-semibold mb-3 text-foreground">⛳️ Tres away</h2>
          <p className="mb-2">
            Just like golf, lowest score wins. Each die is worth its face
            value except for 3's which are worth 0 points.
          </p>
          <p className="mb-2">
            <strong>Reveal Cycle Mechanics:</strong> Play happens in cycles. On each cycle, players must reveal at least one die but can reveal more. The optimal strategy (based on Monte Carlo simulation) is to reveal dice with expected value below 2.33 (i.e., 1s, 2s, and 3s always). With remaining dice, re-roll and repeat until all dice are revealed.
          </p>
          <p className="mb-2">
            Once all players have revealed all five dice, calculate total scores. The player with the highest total score loses.
          </p>
          <p className="text-sm text-muted-foreground">
            Perfect score: Five 3s = 0 points. Worst score: Five 6s = 30 points.
          </p>
        </div>
        <div className="">
          <div className="flex justify-end gap-2 mb-2">
            <Game type="0 (Best)" className="mr-1">
              <Die number="3" />
              <Die number="3" />
              <Die number="3" />
              <Die number="3" />
              <Die number="3" />
            </Game>
          </div>
          <div className="flex justify-end gap-2 mb-2">
            <Game type="2 (Strong)" className="mr-1">
              <Die number="3" />
              <Die number="1" />
              <Die number="1" />
              <Die number="3" />
              <Die number="3" />
            </Game>
          </div>
          <div className="flex justify-end gap-2 mb-2">
            <Game type="7 (Average)" className="mr-1">
              <Die number="3" />
              <Die number="1" />
              <Die number="2" />
              <Die number="4" />
              <Die number="3" />
            </Game>
          </div>
          <div className="flex justify-end gap-2 mb-2">
            <Game type="15 (Weak)" className="mr-1">
              <Die number="3" />
              <Die number="5" />
              <Die number="3" />
              <Die number="4" />
              <Die number="3" />
            </Game>
          </div>
          <div className="flex justify-end gap-2 mb-2">
            <Game type="30 (Worst)" className="mr-1">
              <Die number="6" />
              <Die number="6" />
              <Die number="6" />
              <Die number="6" />
              <Die number="6" />
            </Game>
          </div>
        </div>
      </div>
      <hr className="my-8 border-border" />
      <div className="pb-8 px-6 py-6 rounded-lg bg-muted/20 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="">
          <h2 id="barking" className="text-3xl font-semibold mb-3 text-foreground">🐕 Barking</h2>
          <p className="text-muted-foreground mb-3">Don't have any of these games? Consider...barking</p>
          <p>
            A player calls "Bark" to pass their turn when they have no good calls 
            and don't want to risk a bluff. The call passes to the player on their left, 
            all players pick up their dice, and a new round starts with the player to 
            the left as the new caller.
          </p>
        </div>
        <div className="">
          <div className="flex justify-end gap-2 mb-2">
            <Game type="bark" className="mr-1">
              <Die number="2" />
              <Die number="2" />
              <Die number="2" />
              <Die number="5" />
              <Die number="6" />
            </Game>
          </div>
          <div className="flex justify-end gap-2 mb-2">
            <Game type="bark" className="mr-1">
              <Die number="3" />
              <Die number="3" />
              <Die number="3" />
              <Die number="5" />
              <Die number="6" />
            </Game>
          </div>
        </div>
      </div>
      <hr className="my-8 border-border" />
      {/* Removed old Tres Away section - replaced with enhanced version above */}
      <div style={{display: 'none'}} className="pb-8 px-6 py-6 rounded-lg bg-muted/20 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="">
          <h2 className="text-3xl font-semibold mb-3 text-foreground">OLD Tres away</h2>
          <p>
            Just like golf, highest score loses with each dice being its face
            value except for 3's which are worth 0. Each player must put out at
            least 1 die per roll.
          </p>
          <p>AKA "Man's game", "Road game"</p>
        </div>
        <div className="">
          <div className="flex justify-end gap-2 mb-2">
            <Game type="0" className="mr-1">
              <Die number="3" />
              <Die number="3" />
              <Die number="3" />
              <Die number="3" />
              <Die number="3" />
            </Game>
          </div>
          <div className="flex justify-end gap-2 mb-2">
            <Game type="1" className="mr-1">
              <Die number="3" />
              <Die number="1" />
              <Die number="3" />
              <Die number="3" />
              <Die number="3" />
            </Game>
          </div>
          <div className="flex justify-end gap-2 mb-2">
            <Game type="2" className="mr-1">
              <Die number="3" />
              <Die number="1" />
              <Die number="3" />
              <Die number="1" />
              <Die number="3" />
            </Game>
          </div>
          <div className="flex justify-end gap-2 mb-2">
            <Game type="4" className="mr-1">
              <Die number="3" />
              <Die number="3" />
              <Die number="3" />
              <Die number="4" />
              <Die number="3" />
            </Game>
          </div>
          <div className="flex justify-end gap-2 mb-2">
            <Game type="30" className="mr-1">
              <Die number="6" />
              <Die number="6" />
              <Die number="6" />
              <Die number="6" />
              <Die number="6" />
            </Game>
          </div>
        </div>
      </div>
    </section>
  </Layout>
)

export default GamesPage
