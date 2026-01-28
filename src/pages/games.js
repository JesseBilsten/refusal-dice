import React from 'react'
import { Link } from 'gatsby'
import Layout from '../components/layout'
import Die from '../components/Die'
import Game from '../components/Game'
import Odds from '../components/Odds'

export default () => (
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
          <h2 id="tres-away" className="text-3xl font-semibold mb-3 text-foreground">⛳️ Tres away</h2>
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
