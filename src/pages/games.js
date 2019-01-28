import React from 'react'
import { Link } from 'gatsby'
import Layout from '../components/layout'
import Die from '../components/Die'
import Game from '../components/Game'

export default () => (
  <Layout>
    <section className="container mt-5">
      <div className="my-5 text-center">
        <h1>
          Games
        </h1>
        <p className="lead">A list of the games you can call in Refusal Dice</p>
      </div>
      <hr />
      <h2 id="10-2">
        10-2 <small className="text-muted">high or low</small>
      </h2>
      <p>
        2 dice add up to 10 and the remaining 3 dice are either high or low.
      </p>
      <div className="d-flex justify-content-end">
        <Game type="10-2" className="mr-1">
          <Die number="5"></Die>
          <Die number="5"></Die>
        </Game>
        <Game type="high">
          <Die number="6"></Die>
          <Die number="6"></Die>
          <Die number="6"></Die>
        </Game>
      </div>
      <h2 id="10-3">
        10-3 <small className="text-muted">high or low</small>
      </h2>
      <p>
        3 dice add up to 10 and the remaining 2 dice are either high or low.
      </p>
      <h2 id="10-4">
        10-4 <small className="text-muted">high or low</small>
      </h2>
      <p>4 dice add up to 10 and the remaining die is either high or low.</p>
      <h2 id="ship-captain-crew">
        Ship, Captain, Crew <small className="text-muted">high or low</small>
      </h2>
      <p>
        3 dice make up an outside straight and the remaining 2 dice are either
        high or low.
      </p>
      <h2 id="monterey">
        Monterey <small className="text-muted">high or low</small>
      </h2>
      <p>
        3 dice make up an inside straight and the remaining 2 dice are either
        high or low.
      </p>
      <h2 id="vegas">
        Vegas <small className="text-muted">high or low</small>
      </h2>
      <p>
        2 sets of 2 dice add up to 7 and or 11 and the remaining die is either
        high or low.
      </p>
      <h2 id="pairs">
        Pairs <small className="text-muted">high or low</small>
      </h2>
      <p>
        2 sets of 2 dice are matching pairs and the remaining die is either high
        or low
      </p>
      <h2 id="razzle">Razzle</h2>
      <p>Most amount of any one number with ace's being wild.</p>
      <h2 id="bossy">Boss</h2>
      <p>
        The highest poker hand is the "Boss". If two players have the same
        highest hand, there's no boss and the call is passed to the current
        callers left. If a Boss is established, she rolls her remaining die or
        dice and then determines if she wants everyone else to "come on up"
        meaning they all get 1 roll to try and beat her hand.
      </p>
      <h2 id="tres-away">Tres away</h2>
      <p>
        Highest score loses with each dice being its face value except for 3's
        which are worth 0. Each player must put out at least 1 die per roll.
      </p>
    </section>
  </Layout>
)
