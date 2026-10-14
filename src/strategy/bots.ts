import {
  Action,
  Call,
  Dice,
  GameState,
  KICKER_GAMES,
  KickerGameId,
  PlayerId,
  SPECIALTY_GAMES,
  bossHand,
  compareBoss,
  compareRazzle,
  evaluateKickerHand,
  isKickerGame,
  razzleScore,
  refusalSeats,
  tresAwayScore,
} from '../engine'
import { bestKeepToMake, makeChance } from './make-odds'

/**
 * A "solid" heuristic bot: reasonable, deterministic decisions for every
 * phase of the game. Strategy simulations play rounds with these bots, so
 * simulated odds mean "against (and as) a solid bot", not perfect play.
 *
 * Bots only look at what their player could see: their own dice before
 * play, and the visible dice during play.
 */

export const ALL_CALLS: Call[] = [
  ...KICKER_GAMES.flatMap((game) => (['high', 'low'] as const).map((variant) => ({ game, variant }))),
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
function kickerQuality(game: KickerGameId, variant: 'high' | 'low', total: number): number {
  const n = KICKER_COUNT[game]
  const q = (total - n) / (5 * n)
  return variant === 'high' ? q : 1 - q
}

/** 0–1: how happy the Hammer would be to play `call` with these dice */
export function callScore(dice: Dice, call: Call): number {
  if (isKickerGame(call.game)) {
    const hand = evaluateKickerHand(dice, call.game, call.variant!)
    // Even perfect kickers can be tied, so a made kicker game tops out below an unbeatable hand
    if (hand.made) return 0.55 + 0.4 * kickerQuality(call.game, call.variant!, hand.kickerTotal)
    return 0.4 * makeChance(dice, call.game, 2)
  }
  if (call.game === 'razzle') {
    const { count, face } = razzleScore(dice)
    return (count - 1 + face / 6) / 5
  }
  if (call.game === 'boss') {
    const order = ['high-card', 'pair', 'two-pair', 'three-of-a-kind', 'full-house', 'four-of-a-kind', 'five-of-a-kind']
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
export const wouldAccept = (dice: Dice, call: Call): boolean => callScore(dice, call) >= 0.5

/* ── Playing ── */

/** Is `player` already safe from losing, given the players who are done rolling? */
function safeInPlay(state: GameState, player: PlayerId): boolean {
  const phase = state.phase
  if (phase.kind !== 'play') return false
  const call = phase.call
  const done = Object.keys(phase.rolling).filter((id) => id !== player && phase.rolling[id].done)
  const mine = state.dice[player]
  if (call.game === 'razzle') return done.some((id) => compareRazzle(mine, state.dice[id]) > 0)
  if (!isKickerGame(call.game)) return false
  const me = evaluateKickerHand(mine, call.game, call.variant!)
  if (!me.made) return false
  return done.some((id) => {
    const them = evaluateKickerHand(state.dice[id], call.game as KickerGameId, call.variant!)
    if (!them.made) return true
    return call.variant === 'high' ? me.kickerTotal > them.kickerTotal : me.kickerTotal < them.kickerTotal
  })
}

function playAction(state: GameState, player: PlayerId): Action {
  const phase = state.phase
  if (phase.kind !== 'play') throw new Error('not in play')
  const dice = state.dice[player]
  const rerolls = 3 - phase.rolling[player].rollsUsed
  const call = phase.call

  if (call.game === 'razzle') {
    const { count, face } = razzleScore(dice)
    if (count === 5 || safeInPlay(state, player)) return { type: 'stand', player }
    const keep = dice.map((d, i) => (d === face || d === 1 ? i : -1)).filter((i) => i >= 0)
    return { type: 'reroll', player, keep }
  }

  const game = call.game as KickerGameId
  const variant = call.variant!
  const hand = evaluateKickerHand(dice, game, variant)
  if (!hand.made) return { type: 'reroll', player, keep: bestKeepToMake(dice, game, rerolls) }
  if (safeInPlay(state, player)) return { type: 'stand', player }

  // Made it but not safe yet: re-roll weak kickers
  const weak = hand.kickerDice.filter((i) => (variant === 'high' ? dice[i] <= 3 : dice[i] >= 4))
  if (!weak.length) return { type: 'stand', player }
  return { type: 'reroll', player, keep: [0, 1, 2, 3, 4].filter((i) => !weak.includes(i)) }
}

/** The action the bot takes for whoever must act next. */
export function botAction(state: GameState): Action {
  const phase = state.phase
  switch (phase.kind) {
    case 'call':
      return { type: 'call', player: state.hammer, call: chooseCall(state.dice[state.hammer]) }
    case 'refusal': {
      const seats = refusalSeats(state)
      const player = phase.seat === 1 ? seats.first : seats.second!
      return { type: wouldAccept(state.dice[player], phase.call) ? 'accept' : 'refuse', player }
    }
    case 'secondCall':
      return { type: 'call', player: state.hammer, call: chooseCall(state.dice[state.hammer], phase.refused.game) }
    case 'play': {
      // Simultaneous rolling, approximated as rounds: whoever has rolled least goes next
      const ids = Object.keys(phase.rolling).filter((id) => !phase.rolling[id].done)
      const player = ids.reduce((a, b) => (phase.rolling[b].rollsUsed < phase.rolling[a].rollsUsed ? b : a))
      return playAction(state, player)
    }
    case 'tresAway': {
      const player = phase.turn
      const hand = phase.hands[player]
      if (!hand.fresh) return { type: 'roll', player }
      const dice = state.dice[player]
      const inHand = [0, 1, 2, 3, 4].filter((i) => !hand.out.includes(i))
      // Put out 3s, 1s and 2s; otherwise the single lowest die
      const good = inHand.filter((i) => dice[i] <= 3)
      const out = good.length ? good : [inHand.reduce((a, b) => (tresAwayScore([dice[b]]) < tresAwayScore([dice[a]]) ? b : a))]
      return { type: 'putOut', player, dice: out }
    }
    case 'boss': {
      if (phase.stage === 'bossRoll') {
        const dice = state.dice[phase.boss]
        const weak = [0, 1, 2, 3, 4].filter((i) => !phase.mustKeep.includes(i) && dice[i] <= 3)
        return weak.length
          ? { type: 'reroll', player: phase.boss, keep: [0, 1, 2, 3, 4].filter((i) => !weak.includes(i)) }
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
      const finished = phase.players.filter((id) => id !== player && id !== phase.boss && !phase.waiting.includes(id))
      if (finished.some((id) => compareBoss(dice, state.dice[id]) > 0)) return { type: 'stand', player }
      return { type: 'reroll', player, keep: hand.handDice }
    }
    case 'roundOver':
      return { type: 'nextRound' }
    case 'gameOver':
      throw new Error('The game is over')
  }
}
