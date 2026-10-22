import React from 'react'
import { Link } from 'gatsby'
import Layout from '../components/layout'
import Page, { PageHeader, NextStep, Panel, StepNumber } from '../components/Page'
import { Hand } from '../components/Dice'
import GameLink from '../components/GameLink'
import SeatRing from '../components/Table/SeatRing'
import { Disclosure } from '../components/Odds'

/** A step of the round: a Panel titled with its number */
const Step = ({ n, title, id, children }) => (
  <Panel
    id={id}
    className="scroll-mt-20"
    title={
      <span className="flex items-center gap-3">
        <StepNumber n={n} />
        {title}
      </span>
    }
  >
    <div className="space-y-3">{children}</div>
  </Panel>
)

/** Where the refusals sit: the Hammer, then each seat to their left */
const REFUSAL_SEATS = [{ text: '🔨' }, { text: '1st' }, { text: '2nd' }, { text: '' }]

const L = ({ to, children }) => (
  <Link to={to} className="text-primary hover:underline">
    {children}
  </Link>
)

const RulesPage = () => (
  <Layout>
    <Page width="reading">
      <PageHeader title="How to play" description="2–8 players · 5 dice each · about 30 minutes" />

      <Panel tone="note" as="div" className="mb-8">
        <p>
          Roll → call a game → others accept or refuse → everyone gets up to 3 rolls to make it → the worst hand
          takes a <L to="/glossary#pencil">pencil</L>. 3 pencils and you’re out. The last player standing wins.
        </p>
      </Panel>

      <div id="setup" className="mb-10 scroll-mt-20 space-y-2">
        <Disclosure title="Equipment: what you need">
          <ul className="space-y-3">
            <li>
              <strong>5 dice per player.</strong> We like{' '}
              <a href="https://amzn.to/47ZTYoX" className="text-primary hover:underline">
                Michigan Red Eye dice
              </a>
              , but any will work.
            </li>
            <li>
              <strong>A dice cup:</strong> a{' '}
              <a href="https://amzn.to/3w0X0w6" className="text-primary hover:underline">
                leather cup
              </a>{' '}
              or a dice tower.
            </li>
            <li>
              <strong>Pencils or tokens</strong> to track losses: sugar packets, coins, chips, anything.
            </li>
          </ul>
        </Disclosure>

        <Disclosure title="Ante and setup">
          <p className="mb-3">
            A typical ante is <strong>$5 per player</strong> into the pot. Playing for money is optional.
          </p>
          <p className="mb-3">
            <strong>Who goes first?</strong> Everyone rolls one die, and the highest roll gets the{' '}
            <L to="/glossary#hammer">Hammer</L>. A tie for the highest rolls again. This is the{' '}
            <L to="/glossary#piddle">piddle</L>.
          </p>
          <p className="text-sm text-muted-foreground">
            <strong>Variation:</strong> some groups add $5 at <L to="/glossary#parity">parity</L> (when every
            remaining player has 2 pencils).
          </p>
        </Disclosure>
      </div>

      <h2 className="mb-4 text-xl font-bold">Each round</h2>

      <div className="space-y-4">
        <Step n={1} title="Roll" id="roll">
          <p>
            The Hammer says <L to="/glossary#coming-out">“coming out”</L>, then everyone rolls all 5 dice and{' '}
            <strong>hides</strong> them from the other players.
          </p>
        </Step>

        <Step n={2} title="The Hammer calls a game" id="call">
          <p>
            The <L to="/glossary#hammer">Hammer</L> looks at their dice and names the <L to="/games">game</L>{' '}
            everyone will play, including High or Low for the kicker games.
          </p>
          <p>
            <strong>
              Or <L to="/glossary#bark">bark</L>:
            </strong>{' '}
            the Hammer passes left, everyone picks up their dice, and a new round starts.{' '}
            <L to="/games/#barking">What a bark is worth</L>
          </p>
        </Step>

        <Step n={3} title="Refusal" id="refusal">
          <p>
            Two players can turn the call down. If either one accepts, everyone plays it. If both refuse, the
            Hammer must call a different game.
          </p>
          <div className="grid items-center gap-4 sm:grid-cols-[13rem_minmax(0,1fr)]">
            <SeatRing
              seats={REFUSAL_SEATS}
              label="The Hammer, with the 1st refusal on their left and the 2nd refusal two seats left"
              className="max-w-[13rem]"
            />
            <dl className="divide-y border-y text-sm">
              <div className="py-2">
                <dt className="font-semibold">1st refusal: directly left of the Hammer</dt>
                <dd className="text-muted-foreground">
                  Accept, and everyone plays the call. Refuse, and it passes to the 2nd refusal.
                </dd>
              </div>
              <div className="py-2">
                <dt className="font-semibold">2nd refusal: two seats left</dt>
                <dd className="text-muted-foreground">
                  Only decides if the 1st refusal refused. Accept, and everyone plays the call. Refuse, and the
                  Hammer makes a second call.
                </dd>
              </div>
            </dl>
          </div>
          <p>
            <strong>If you refuse but the other player accepts, you still play.</strong> Refusing doesn’t mean
            re-rolling: everyone keeps the dice they have.
          </p>
          <h3 className="pt-1 font-semibold">Second call</h3>
          <p>
            It must be a <strong>different game</strong>, not just the other High or Low. Nobody can refuse it, and
            your first roll still counts as roll 1.
          </p>
        </Step>

        <Step n={4} title="Play the game" id="play">
          <p>
            Everyone’s dice are now face up. Each player gets <strong>up to 3 rolls</strong>, and the roll they
            already have counts as the first.
          </p>
          <p>
            <strong>Missed the game? Roll on your own.</strong> Everyone who hasn’t made the game rolls at the same
            time, until they make it or run out of rolls.
          </p>
          <p>
            <strong>Then the worst hand rolls first.</strong> Whoever holds it is the loser right now, so they roll
            until they climb off the bottom or run out of rolls. Then whoever holds the worst hand rolls. If the worst
            hand never gets off the bottom, nobody else has to roll at all.
          </p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              After each roll, keep some dice and re-roll the rest, or stop. <strong>Only dice toward the game</strong>{' '}
              can be kept:
              <ul className="mt-1.5 list-[circle] space-y-1 pl-5">
                <li>
                  <strong>10-2, 10-3, 10-4:</strong> nothing until you have it. A 10 has to come in one roll, so roll all
                  five each time.
                </li>
                <li>
                  <strong>Ship Captain Crew:</strong> 1-2 or 5-6, not both.
                </li>
                <li>
                  <strong>Monterey:</strong> 2-3, 3-4 or 4-5 (some tables allow a lone 3 or 4).
                </li>
                <li>
                  <strong>7’s:</strong> one pair that sums to 7 or 11. <strong>Pairs:</strong> one pair.
                </li>
              </ul>
            </li>
            <li>
              <strong>Kept dice stay kept.</strong> Once you keep dice you’re committed to them: keep 1-2 and you can’t
              switch to 5-6 on your next roll. They’re part of your game, too: keep 5-6 in 7’s and the other 7 or 11
              has to come from the three dice you roll (the 5 can’t pair with a rolled 2).
            </li>
            <li>
              <strong>A made game can’t be re-rolled.</strong> Once you have it, keep the dice that make it or stand:
              in 10-2 you can’t pick up your 5-5 and roll it again.
            </li>
            <li>
              Try to <strong>make the game</strong>, then improve your <L to="/glossary#kicker">kicker</L>: all the
              dice that aren’t part of the game.
            </li>
            <li>
              <strong>The kicker is rolled whole.</strong> Once the dice you keep make the game, only those stay on
              the table: re-roll your whole kicker or none of it. You can’t keep the 6 of a 6+1 kicker and re-roll
              the 1.
            </li>
            <li>You only ever roll to get off the bottom: beat the next-worst hand and your turn ends.</li>
            <li>
              Out of rolls is <L to="/glossary#all-day">all day</L>: that hand is final. Anyone already better than a
              hand that’s all day is <L to="/glossary#in-the-cup">in the cup</L>: safe, with nothing left to do this
              round.
            </li>
          </ul>
          <h3 className="pt-1 font-semibold">Example: 10-3 High</h3>
          <Hand dice={[1, 3, 6, 2, 4]} game="10-3" variant="high" />
          <p className="text-sm text-muted-foreground">
            The 1, 3 and 6 make 10, so you have the game, with a kicker of 2+4 = 6. Keep the 1, 3 and 6 and re-roll
            the 2 and 4 together to try for a higher kicker.
          </p>
          <Disclosure title="Three games play differently">
            <ul className="space-y-3">
              <li>
                <GameLink id="tres-away" />: lowest total wins (3s count 0). After every roll you must put out at
                least one die, and put-out dice are final. The caller sets the pace: taking turns from the caller’s
                left, everyone catches up to how many dice the caller has out, and never past it. Your dice stay
                hidden until you put them out, and keep their values between turns: on your next turn you can put
                one out as it is, after seeing what the others put out, or roll them all.
              </li>
              <li>
                <GameLink id="boss" />: poker hands without straights. The best first roll is the Boss, who rolls
                once more in secret, picking up any dice as long as what they keep still beats everyone, or skips the roll. Then the Boss says <em>“come up”</em>{' '}
                (everyone else gets one last roll, and the worst hand loses, even if that’s the Boss) or{' '}
                <em>“pick ’em up”</em> (no loser, and the Hammer passes left). A tie for the best first roll means no Boss: no loser, and the
                Hammer passes left.
              </li>
              <li>
                <GameLink id="razzle" />: most of any one number, with 1s wild. Three 1s and a 4 make four 4s.
                Equal counts go to the higher face, so four 6s beat four 4s. The lowest hand rolls first, as in the
                other games. Re-rolling everything to chase 1s and 6s is common.
              </li>
            </ul>
          </Disclosure>
        </Step>

        <Step n={5} title="Find the loser" id="score">
          <ul className="divide-y border-y">
            <li className="py-3">
              <strong>Missed the game?</strong> Missing is the worst hand. If you’re the only one who missed, you
              lose. If two or more missed, everyone who made it is safe, and the players who missed play the same
              game again with 3 fresh rolls until one loses.
            </li>
            <li className="py-3">
              <strong>Everyone made it?</strong> The weakest hand loses. The call says what’s weakest: in{' '}
              <em>10-3 High</em>, a player whose kicker is 2+1 = 3 loses to everyone with a higher kicker.
            </li>
            <li className="py-3">
              <strong>Tied for worst?</strong> Whoever has the most rolls left rolls first, until you’ve all used
              the same number; then the tied player nearest the Hammer goes. Once the others you’re tied with are
              out of rolls, you can <strong>take the tie</strong> (replay the same game, same
              High or Low, with fresh rolls) or roll to beat them. With only 2 players left in the game, a tie (or
              both missing) means no pencil and the Hammer passes. Alone at the bottom, there’s no choice: you roll
              until you’re out of rolls.
            </li>
            <li className="py-3">
              The loser takes a <L to="/glossary#pencil">pencil</L> and becomes the next Hammer.{' '}
              <strong>3 pencils and you’re out</strong>, and the Hammer skips you.
            </li>
          </ul>
        </Step>
      </div>

      <p className="mt-8 font-display text-lg font-bold">Repeat until one player remains: they win the pot.</p>
      <NextStep to="/games" title="Meet the ten games" text="What makes each one, what it looks like, and its quirks." />
    </Page>
  </Layout>
)

export default RulesPage
