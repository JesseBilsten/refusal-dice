import React from 'react'
import { Link } from 'gatsby'
import Layout from '../components/layout'

export default () => (
  <Layout>
    <section className="container mt-5">
      <div className="my-5 text-center">
        <h1>Rules</h1>
        <p class="lead">How to play the game</p>
      </div>
      <hr />
      <h2>Object of the game</h2>
      <p className="text-muted">Be the last man standing</p>
      <p>
        Each game that is called will have 1 loser. In the event of a tie, those
        players who tied will play the same game again until a single loser is
        established. That loser takes a pencil. When you have 3 pencils you are
        out. The last player left without 3 pencils wins.
      </p>
      <div className="row">
        <div className="col-sm-6">
          <div className="alert alert-secondary">
            <h5>Variation</h5>
            <p>
              Some players will make an offer to split the pot based on the
              number of pencils each player has left.
            </p>
          </div>
        </div>
        <div className="col-sm-6">
          <div className="alert alert-success">
            <h5>Example</h5>
            <p>2 players remain:</p>
            <ol>
              <li>
                👨<em>Player A</em>
              </li>
              <li>
                👩<em>Player B</em>
              </li>
            </ol>
            <p>The score:</p>
            <ul>
              <li>👨 has ✏️✏️ and the 🔨</li>
              <li>👩 has ✏️</li>
            </ul>
            <p>
              👨 may offer to split the pot 50/50 with 👩 as it's likely he'll
              win the hand and there will be parity and 👩 will get the call to
              win.
            </p>
          </div>
        </div>
      </div>
      <p>&nbsp;</p>
      <hr />
      <h2>Setup</h2>
      <p className="text-muted">
        What you need to do before starting the game.
      </p>
      <h3>Requirements</h3>
      <ul>
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
      <p>
        <strong>Note:</strong> You don't <em>need</em> pencils, you could use
        sugar packets or any "token" but for the sake of this guide, I'll refer
        to them as pencils.
      </p>
      <p>&nbsp;</p>
      <h3>Ante</h3>
      <ul>
        <li>
          <span role="img" aria-label="dollar bills">
            💵
          </span>{' '}
          $5 per player
        </li>
      </ul>
      <p>
        Playing for money is not a requirement, but it can make the game more
        fun.
      </p>
      <p>
        Different groups have different ante amounts and when it's required to
        put in, but a typical ante is $5 from each player at the beginning of
        the game. Once everyone is in (they've paid their $5 to the pot) then
        players can roll to see who goes first.
      </p>
      <div className="row">
        <div className="col-sm-6">
          <div className="alert alert-secondary">
            <h5>Variation</h5>
            <p>
              Some groups of players will have everyone add an additional $5
              when <Link to="glossary#parity">parity</Link> is reached.{' '}
              <Link to="glossary#parity">Parity</Link> is when ever player has 2
              pencils.
            </p>
          </div>
        </div>
        <div className="col-sm-6">
          <div className="alert alert-success">
            <h5>Example</h5>
            <p>
              3 players remain: <em>Player A</em>, <em>Player B</em>, and{' '}
              <em>Player C</em>. Each player has 2 ✏️s so <em>Player A</em>{' '}
              calls out, "Parity!" and all the players put their ✏️s back in the
              jar.
            </p>
          </div>
        </div>
      </div>
      <p>&nbsp;</p>
      <h3>
        Who goes first? <small className="text-muted">(aka the "piddle")</small>
      </h3>
      <ol>
        <li>Each player rolls 1 die</li>
        <li>Highest value die wins</li>
      </ol>
      <p>
        <strong>In the event of a tie:</strong> Players with matching highest
        die values repeat step 1 until only one player has the highest die
      </p>
      <div className="alert alert-success">
        <h5>Example</h5>
        <p>
          <em>There are 4 players: A, B, C, and D.</em>
        </p>
        <strong>Roll 1</strong>
        <ul>
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
        <p>
          <em>Player A</em> and <em>Player B</em> are tied and roll again.
        </p>
        <strong>Roll 2</strong>
        <ul>
          <li>
            <em>Player A</em> rolls a 4
          </li>
          <li>
            <em>Player B</em> rolls a 4
          </li>
        </ul>
        <p>
          <em>Player A</em> and <em>Player B</em> are tied again and roll a 3rd
          time.
        </p>
        <strong>Roll 3</strong>
        <ul>
          <li>
            <em>Player A</em> rolls a 6
          </li>
          <li>
            <em>Player B</em> rolls a 2
          </li>
        </ul>
        <p>
          <em>Player A</em> wins the piddle and will be coming out (rolling
          first).
        </p>
      </div>
      <p>&nbsp;</p>
      <hr />
      <h2>Gameplay</h2>
      <p className="text-muted">
        Roll, call game, accept or refuse, play game, award pencil, repeat until
        there's one player left.
      </p>
      <h3>Phase 1: Roll</h3>
      <p>
        Everyone rolls all their dice and hides the results from other players.
      </p>
      <div className="alert alert-secondary">
        <h5>Variation</h5>
        <p>
          Some players will wait to roll their hands if they aren't the caller,
          first refusal or second refusal.
        </p>
      </div>
      <h3>Phase 2: Select game</h3>
      <p>
        Whoever won the piddle needs to now look at their dice and call the
        first <Link to="games">game</Link> they wish to play.
      </p>
      <div className="row">
        <div className="col-sm-6 col-lg-4 col-xl-3">
          <div className="card mb-4">
            <h4 className="card-header" id="first-call">
              First Call
            </h4>
            <div className="card-body">
              <small className="card-subtitle text-muted">
                Aka "the hammer"
              </small>
              <p className="card-text">
                Whomever has the{' '}
                <a
                  href="#"
                  data-toggle="tooltip"
                  data-placement="top"
                  title="The player who has the call is said to have the hammer"
                >
                  hammer
                </a>{' '}
                looks at their hand and calls out a game they wish to play first
                knowing that the player directly to their left has the right of{' '}
                <em>first refusal</em>.
              </p>
            </div>
            <ul className="list-group list-group-flush">
              <li className="list-group-item">
                <Link to="/games">Call a game</Link> →{' '}
                <Link to="/rules#first-refusal">First Refusal</Link>
              </li>
              <li className="list-group-item">
                <Link to="/glossary#bark">Bark</Link> → Game ends and Hammer
                passes to the left
              </li>
            </ul>
          </div>
        </div>
        <div class="col-sm-6 col-lg-4 col-xl-3">
          <div className="card mb-4">
            <h4 className="card-header" id="first-refusal">
              First Refusal
            </h4>
            <div className="card-body">
              <small className="card-subtitle text-muted">
                First player to the callers left
              </small>
              <p className="card-text">
                The player to the caller's immediate left looks at her dice and
                determines if she can play the game or not. If she can, she
                should accept and say, "I'll play". If she cannot, she says,
                "No".
              </p>
            </div>
            <ul className="list-group list-group-flush">
              <li className="list-group-item">
                <Link to="/rules#second-refusal">Refuse</Link> →{' '}
                <Link to="/rules#second-refusal">Second Refusal</Link>
              </li>
              <li className="list-group-item">
                <Link to="/rules#play-game">Accept</Link> →{' '}
                <Link to="/rules#play-game">Play game</Link>
              </li>
            </ul>
          </div>
        </div>
        <div class="col-sm-6 col-lg-4 col-xl-3">
          <div className="card mb-4">
            <h4 className="card-header" id="second-refusal">
              Second Refusal
            </h4>
            <div className="card-body">
              <small className="card-subtitle text-muted">
                Second player to the callers left
              </small>
              <p className="card-text">
                The second player to the hammer's left can "Accept" or "Refuse"
                the call. If she accepts, then everyone plays. If she refuses
                the hammer must call their second and final call.
              </p>
            </div>
            <ul className="list-group list-group-flush">
              <li className="list-group-item">
                <Link to="/glossary#refuse">Refuse</Link> →{' '}
                <Link to="/rules#second-call">Second Call</Link>
              </li>
              <li className="list-group-item">
                <Link to="/glossary#accept">Accept</Link> →{' '}
                <Link to="/rules#play-game">Play game</Link>
              </li>
            </ul>
          </div>
        </div>
        <div class="col-sm-6 col-lg-4 col-xl-3">
          <div className="card">
            <h4 className="card-header" id="second-call">
              Second Call
            </h4>
            <div className="card-body">
              <small className="card-subtitle text-muted">No refusal!</small>
              <p className="card-text">
                If the first call was refused, all players must play the callers
                second game.
              </p>
            </div>
            <ul className="list-group list-group-flush">
              <li className="list-group-item">
                <Link to="/rules#play-game">Play game</Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <p>&nbsp;</p>
      <h3 id="play-game">Phase 3: Play game</h3>
      <p>
        All players must now play the game that was either accepted in the First
        Call or if the game was refused twice, then whatever the callers Second
        Call is.
      </p>
      <div class="alert alert-secondary mt-4" role="alert">
        <h5 className="alert-heading">Ties</h5>
        <p>
          Ties are handled by re-rolling the same game. Only the players who tie
          participate and players that aren't tied for the low hand do not have
          to play the next hand.
        </p>
      </div>
      <h3>Phase 4: Award a pencil</h3>
      <p>
        Whomever had the lowest hand in Phase 2 takes a pencil and gets to call
        the next game.
      </p>
      <div class="alert alert-secondary" role="alert">
        <h5 className="alert-heading">3 pencils</h5>
        <p>
          If a player has 2 pencils already and receives their 3rd, they go out
          and the call passes to the next player to their left who doesn't have
          3 pencils.
        </p>
      </div>
      <h3>Repeat</h3>
      <p>
        Continue repeating phases 1-4 until only one player remains. That player
        collects the pot.
      </p>
    </section>
  </Layout>
)
