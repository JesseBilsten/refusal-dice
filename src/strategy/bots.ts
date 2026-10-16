import {
  Action,
  Call,
  Dice,
  GameState,
  KICKER_GAMES,
  KickerGameId,
  SPECIALTY_GAMES,
  activeSeats,
  bossHand,
  compareBoss,
  evaluateKickerHand,
  isKickerGame,
  razzleScore,
  bottomTarget,
  bottomTurn,
  refusalSeats,
  tresAwayScore,
  wouldLoseIfStopped,
} from '../engine'
import { makeChance } from './make-odds'
import { Goal, keepOptions } from './situations'
import { tresAwayPutOut } from './tres-away'

/**
 * A "solid" heuristic bot: reasonable, deterministic decisions for every
 * phase of the game. Strategy simulations play rounds with these bots, so
 * simulated odds mean "against (and as) a solid bot", not perfect play.
 *
 * Bots only look at what their player could see: their own dice before
 * play, and the visible dice during play.
 */

export const ALL_CALLS: Call[] = [
  ...KICKER_GAMES.flatMap((game) =>
    (['high', 'low'] as const).map((variant) => ({ game, variant }))
  ),
  ...SPECIALTY_GAMES.map((game) => ({ game })),
]

/** Kicker totals range from the fewest to the most kicker dice: 3 kickers in 10-2, 1 in 10-4 */
const KICKER_COUNT: Record<KickerGameId, number> = {
  '10-2': 3,
  '10-3': 2,
  '10-4': 1,
  'ship-captain-crew': 2,
  monterey: 2,
  vegas: 1,
  pairs: 1,
}

/** 0–1: how good these kickers are for the variant */
function kickerQuality(
  game: KickerGameId,
  variant: 'high' | 'low',
  total: number
): number {
  const n = KICKER_COUNT[game]
  const q = (total - n) / (5 * n)
  return variant === 'high' ? q : 1 - q
}

/** 0–1: how happy the Hammer would be to play `call` with these dice */
export function callScore(dice: Dice, call: Call): number {
  if (isKickerGame(call.game)) {
    const hand = evaluateKickerHand(dice, call.game, call.variant!)
    // Even perfect kickers can be tied, so a made kicker game tops out below an unbeatable hand
    if (hand.made)
      return (
        0.55 + 0.4 * kickerQuality(call.game, call.variant!, hand.kickerTotal)
      )
    return 0.4 * makeChance(dice, call.game, 2)
  }
  if (call.game === 'razzle') {
    const { count, face } = razzleScore(dice)
    return (count - 1 + face / 6) / 5
  }
  if (call.game === 'boss') {
    const order = [
      'high-card',
      'pair',
      'two-pair',
      'three-of-a-kind',
      'full-house',
      'four-of-a-kind',
      'five-of-a-kind',
    ]
    const hand = bossHand(dice)
    return (order.indexOf(hand.category) + hand.ranks[0] / 7) / 7
  }
  // Tres Away: five rolls to improve, so only a very low start is a reason to call it
  return Math.pow(1 - tresAwayScore(dice) / 30, 2)
}

/** The call a bot Hammer makes; `except` is the refused game on a second call */
export function chooseCall(dice: Dice, except?: string): Call {
  let best = ALL_CALLS[0]
  let bestScore = -1
  for (const call of ALL_CALLS) {
    if (call.game === except) continue
    const s = callScore(dice, call)
    if (s > bestScore) {
      best = call
      bestScore = s
    }
  }
  return best
}

/** A refuser bot accepts calls it likes its dice for */
export const wouldAccept = (dice: Dice, call: Call): boolean =>
  callScore(dice, call) >= 0.5

/* ── Playing ── */

/**
 * Play from the bottom (§4): whoever must roll holds the worst hand, so
 * roll with the exact best keep for beating the next-worst hand (or just
 * making the game, when that hand missed too). Tied at the bottom with
 * nobody else left to roll, take the tie when that's at least as good as
 * rolling (always with two players left, where a tie means no pencil).
 */
function bottomAction(state: GameState): Action {
  const phase = state.phase
  if (phase.kind !== 'play') throw new Error('not in play')
  const player = bottomTurn(state)!
  const dice = state.dice[player]
  const target = state.dice[bottomTarget(state, player)!]
  const options = keepOptions(dice, 3 - phase.rolling[player].rollsUsed, bottomGoal(phase.call, target))
  if (!wouldLoseIfStopped(state, player) && (activeSeats(state).length === 2 || options[0].stand))
    return { type: 'stand', player }
  return { type: 'reroll', player, keep: options.find((o) => !o.stand)!.keep }
}

/** What the worst hand needs: beat `target` (Razzle or a kicker), or make the game when `target` missed too */
export function bottomGoal(call: Call, target: Dice): Goal {
  if (call.game === 'razzle') return { kind: 'razzle', ...razzleScore(target) }
  const game = call.game as KickerGameId
  const them = evaluateKickerHand(target, game, call.variant!)
  return them.made
    ? { kind: 'kicker', game, variant: call.variant!, total: them.kickerTotal }
    : { kind: 'make', game }
}

/** The action the bot takes for whoever must act next. */
export function botAction(state: GameState): Action {
  const phase = state.phase
  switch (phase.kind) {
    case 'call':
      return {
        type: 'call',
        player: state.hammer,
        call: chooseCall(state.dice[state.hammer]),
      }
    case 'refusal': {
      const seats = refusalSeats(state)
      const player = phase.seat === 1 ? seats.first : seats.second!
      return {
        type: wouldAccept(state.dice[player], phase.call) ? 'accept' : 'refuse',
        player,
      }
    }
    case 'secondCall':
      return {
        type: 'call',
        player: state.hammer,
        call: chooseCall(state.dice[state.hammer], phase.refused.game),
      }
    case 'play':
      return bottomAction(state)
    case 'tresAway': {
      const player = phase.turn
      const hand = phase.hands[player]
      if (!hand.fresh) return { type: 'roll', player }
      const dice = state.dice[player]
      const inHand = [0, 1, 2, 3, 4].filter((i) => !hand.out.includes(i))
      return { type: 'putOut', player, dice: tresAwayPutOut(dice, inHand) }
    }
    case 'boss': {
      if (phase.stage === 'bossRoll') {
        const dice = state.dice[phase.boss]
        const weak = [0, 1, 2, 3, 4].filter(
          (i) => !phase.mustKeep.includes(i) && dice[i] <= 3
        )
        return weak.length
          ? {
              type: 'reroll',
              player: phase.boss,
              keep: [0, 1, 2, 3, 4].filter((i) => !weak.includes(i)),
            }
          : { type: 'stand', player: phase.boss }
      }
      if (phase.stage === 'decide') {
        // Come up with two pair or better
        const strong = compareBoss(state.dice[phase.boss], [2, 2, 1, 1, 3]) >= 0
        return { type: strong ? 'comeUp' : 'dontComeUp', player: phase.boss }
      }
      const player = phase.waiting[0]
      const dice = state.dice[player]
      const hand = bossHand(dice)
      // Already beating someone who has finished? Stand. Otherwise keep the hand and roll the rest.
      const finished = phase.players.filter(
        (id) =>
          id !== player && id !== phase.boss && !phase.waiting.includes(id)
      )
      if (finished.some((id) => compareBoss(dice, state.dice[id]) > 0))
        return { type: 'stand', player }
      return { type: 'reroll', player, keep: hand.handDice }
    }
    case 'roundOver':
      return { type: 'nextRound' }
    case 'gameOver':
      throw new Error('The game is over')
  }
}
