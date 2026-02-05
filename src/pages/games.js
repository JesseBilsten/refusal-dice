import React from 'react'
// no direct Link usage on this page
import Layout from '../components/layout'
import Die from '../components/Die'
import Game from '../components/Game'
import PageShell from '../components/PageShell'
// Odds component no longer used on this page

const GamesPage = () => (
  <Layout>
    <PageShell title={"Games"} lead={"A list of the games you can call in Refusal Dice"}>
      <hr className="site-hr" />
      <div className="pb-5 grid md:grid-cols-2 gap-6 items-start">
        <div>
          <h2 id="10-2">✌️ 10-2 <small className="text-muted-foreground">high or low</small></h2>
          <p>2 dice add up to 10 and the remaining 3 dice are either high or low.</p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <div className="flex flex-wrap justify-end gap-2">
            <Game type="10-2">
              <Die number="4" />
              <Die number="6" />
            </Game>
            <Game type="low">
              <Die number="1" />
              <Die number="1" />
              <Die number="1" />
            </Game>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Game type="10-2">
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
      <hr className="site-hr" />
      <div className="pb-5 grid md:grid-cols-2 gap-6 items-start">
        <div>
          <h2 id="10-3">👌 10-3 <small className="text-muted-foreground">high or low</small></h2>
          <p>3 dice add up to 10 and the remaining 2 dice are either high or low.</p>
          <p>AKA "Frankie"</p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <div className="flex flex-wrap justify-end gap-2">
            <Game type="10-3">
              <Die number="1" />
              <Die number="3" />
              <Die number="6" />
            </Game>
            <Game type="low">
              <Die number="1" />
              <Die number="1" />
            </Game>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Game type="10-3">
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
      <hr className="site-hr" />
      <div className="pb-5 grid md:grid-cols-2 gap-6 items-start">
        <div>
          <h2 id="10-4">🔫 10-4 <small className="text-muted-foreground">high or low</small></h2>
          <p>4 dice add up to 10 and the remaining die is either high or low.</p>
          <p>AKA "Shotgun"</p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <div className="flex flex-wrap justify-end gap-2">
            <Game type="10-4">
              <Die number="1" />
              <Die number="2" />
              <Die number="6" />
              <Die number="1" />
            </Game>
            <Game type="low">
              <Die number="1" />
            </Game>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Game type="10-4">
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
      <hr className="site-hr" />
      <div className="grid md:grid-cols-2 gap-6 items-start pb-5">
        <div>
          <h2 id="ship-captain-crew">⚓️ Ship, Captain, Crew <small className="text-muted-foreground">high or low</small></h2>
          <p>3 dice make up an outside straight and the remaining 2 dice are either high or low.</p>
          <p>AKA "Outside straight", "Crew"</p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <div className="flex flex-wrap justify-end gap-2">
            <Game type="ship, captain, crew">
              <Die number="4" />
              <Die number="5" />
              <Die number="6" />
            </Game>
            <Game type="low">
              <Die number="1" />
              <Die number="1" />
            </Game>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Game type="ship, captain, crew">
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
      <hr className="site-hr" />
      <div className="pb-5 grid md:grid-cols-2 gap-6 items-start">
        <div>
          <h2 id="monterey">🔄 Monterey <small className="text-muted-foreground">high or low</small></h2>
          <p>3 dice make up an inside straight and the remaining 2 dice are either high or low.</p>
          <p>AKA "Inside straight"</p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <div className="flex flex-wrap justify-end gap-2">
            <Game type="monterey">
              <Die number="2" />
              <Die number="3" />
              <Die number="4" />
            </Game>
            <Game type="low">
              <Die number="1" />
              <Die number="1" />
            </Game>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Game type="monterey">
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
      <hr className="site-hr" />
      <div className="pb-5 grid md:grid-cols-2 gap-6 items-start">
        <div>
          <h2 id="vegas">🎰 7's <small className="text-muted-foreground">high or low</small></h2>
          <p>2 sets of 2 dice add up to 7 and or 11 and the remaining die is either high or low.</p>
          <p>AKA "7-11", "7 and/or 11's", "Vegas"</p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <div className="flex flex-wrap justify-end gap-2">
            <Game type="vegas">
              <Die number="5" />
              <Die number="6" />
            </Game>
            <Game type="vegas">
              <Die number="1" />
              <Die number="6" />
            </Game>
            <Game type="low">
              <Die number="1" />
            </Game>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Game type="vegas">
              <Die number="2" />
              <Die number="5" />
            </Game>
            <Game type="vegas">
              <Die number="3" />
              <Die number="4" />
            </Game>
            <Game type="high">
              <Die number="6" />
            </Game>
          </div>
        </div>
      </div>
      <hr className="site-hr" />
      <div className="pb-5 grid md:grid-cols-2 gap-6 items-start">
        <div>
          <h2 id="pairs">🍐 Pairs <small className="text-muted-foreground">high or low</small></h2>
          <p>2 sets of 2 dice are matching pairs and the remaining die is either high or low</p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <div className="flex flex-wrap justify-end gap-2">
            <Game type="pairs">
              <Die number="2" />
              <Die number="2" />
              <Die number="4" />
              <Die number="4" />
            </Game>
            <Game type="low">
              <Die number="1" />
            </Game>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Game type="pairs">
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
      <hr className="site-hr" />
      <div className="pb-5 grid md:grid-cols-2 gap-6 items-start">
        <div>
          <h2 id="razzle">✨ Razzle</h2>
          <p>Most amount of any one number with aces being wild.</p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <div className="flex flex-wrap justify-end gap-2">
            <Game type="razzle: (3) 6's">
              <Die number="1" />
              <Die number="6" />
              <Die number="6" />
            </Game>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Game type="razzle: (4) 5's">
              <Die number="1" />
              <Die number="5" />
              <Die number="1" />
              <Die number="1" />
            </Game>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Game type="razzle: (5) 6's">
              <Die number="1" />
              <Die number="1" />
              <Die number="1" />
              <Die number="1" />
            </Game>
          </div>
        </div>
      </div>
      <hr className="site-hr" />
      <div className="pb-5 grid md:grid-cols-2 gap-6 items-start">
        <div>
          <h2 id="boss">💼 Boss</h2>
          <p>The highest poker hand is the "Boss". If two players have the same highest hand, there's no boss and the call is passed to the current callers left. If a Boss is established, she rolls her remaining die or dice and then determines if she wants everyone else to "come on up" meaning they all get 1 roll to try and beat her hand. If she doesn't want to play because she has a poor hand she can choose to "pick them up" and pass the call.</p>
          <p>High numbers are more valuable than low. E.g. 3 of a kind with <Die number="6" /> is better than with <Die number="5" /></p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <div className="flex flex-wrap justify-end gap-2">
            <Game type="5 of a kind">
              <Die number="2" />
              <Die number="2" />
              <Die number="2" />
              <Die number="2" />
              <Die number="2" />
            </Game>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Game type="4 of a kind">
              <Die number="5" />
              <Die number="5" />
              <Die number="5" />
              <Die number="5" />
            </Game>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Game type="full house">
              <Die number="4" />
              <Die number="4" />
              <Die number="4" />
              <Die number="1" />
              <Die number="1" />
            </Game>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Game type="3 of a kind">
              <Die number="1" />
              <Die number="1" />
              <Die number="1" />
            </Game>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Game type="2 pair">
              <Die number="1" />
              <Die number="1" />
              <Die number="3" />
              <Die number="3" />
            </Game>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Game type="1 pair">
              <Die number="5" />
              <Die number="5" />
            </Game>
          </div>
        </div>
      </div>
      <hr className="site-hr" />
      <div className="pb-5 grid md:grid-cols-2 gap-6 items-start">
        <div>
          <h2 id="tres-away">⛳️ Tres away</h2>
          <p>Just like golf, highest score loses with each dice being its face value except for 3's which are worth 0. Each player must put out at least 1 die per roll.</p>
          <p>AKA "Man's game", "Road game"</p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <div className="flex flex-wrap justify-end gap-2">
            <Game type="0">
              <Die number="3" />
              <Die number="3" />
              <Die number="3" />
              <Die number="3" />
              <Die number="3" />
            </Game>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Game type="1">
              <Die number="3" />
              <Die number="1" />
              <Die number="3" />
              <Die number="3" />
              <Die number="3" />
            </Game>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Game type="2">
              <Die number="3" />
              <Die number="1" />
              <Die number="3" />
              <Die number="1" />
              <Die number="3" />
            </Game>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Game type="4">
              <Die number="3" />
              <Die number="3" />
              <Die number="3" />
              <Die number="4" />
              <Die number="3" />
            </Game>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Game type="30">
              <Die number="6" />
              <Die number="6" />
              <Die number="6" />
              <Die number="6" />
              <Die number="6" />
            </Game>
          </div>
        </div>
      </div>
    </PageShell>
  </Layout>
)

export default GamesPage
