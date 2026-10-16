import { compareBoss, compareTresAway, tresAwayScore } from '../rules/specialty-games'
import { Dice, PlayerId } from '../types'
import { GameState, MAX_ROLLS, activeSeats, bottomHands, playCompare, seatOrderFrom } from './game'

/**
 * The table ranked, best hand first, from what everyone can see: who's at
 * the bottom, who still might have to roll, and who is safe.
 *
 * "All day": a player with no rolls left; their hand is final.
 * "In the cup" (safe): someone whose hand is final is already worse than
 * yours, so you can't lose this round and never have to roll again.
 */

export type StandingStatus =
  /** Alone at the bottom: the loser right now */
  | 'bottom'
  /** Tied at the bottom */
  | 'tied'
  /** In the cup: can't lose this round */
  | 'safe'
  /** Could still end up at the bottom */
  | 'live'

export interface Standing {
  player: PlayerId
  /** 1 is the best hand; tied hands share a rank. Null for players already safe from an earlier cycle (a replay) */
  rank: number | null
  status: StandingStatus
  /** Rolls this player has left, or null where the game has no fixed count (Tres Away) */
  rollsLeft: number | null
  /** No rolls left: this hand is final */
  allDay: boolean
  /** Boss: the Boss's hand is partly hidden, so they're listed first, unranked against the rest */
  boss?: boolean
}

/**
 * Competition ranks ("1, 2, 2, 4") for `ids`, best first. `compare` is
 * negative when its first hand is worse. Ties keep the order of `ids`.
 */
export function rankBest<T>(ids: T[], compare: (a: T, b: T) => number): { id: T; rank: number }[] {
  const sorted = [...ids].sort((a, b) => compare(b, a))
  return sorted.map((id, i) => {
    let first = i
    while (first > 0 && compare(sorted[first - 1], id) === 0) first--
    return { id, rank: first + 1 }
  })
}

/** Active players who aren't in this cycle: a replay leaves them safe */
const alreadySafe = (state: GameState, inCycle: PlayerId[]): Standing[] =>
  seatOrderFrom(
    state,
    state.hammer,
    activeSeats(state)
      .map((s) => s.id)
      .filter((id) => !inCycle.includes(id))
  ).map((player) => ({ player, rank: null, status: 'safe', rollsLeft: null, allDay: true }))

export function standings(state: GameState): Standing[] {
  const { phase } = state

  if (phase.kind === 'play') {
    const ids = seatOrderFrom(state, state.hammer, Object.keys(phase.rolling))
    const cmp = playCompare(phase.call)
    const hand = (id: PlayerId) => state.dice[id]
    const bottom = bottomHands(state)
    // A finished hand that's already worse than yours puts you in the cup
    const final = ids.filter((id) => phase.rolling[id].done)
    const ranked: Standing[] = rankBest(ids, (a, b) => cmp(hand(a), hand(b))).map(({ id, rank }) => {
      const left = MAX_ROLLS - phase.rolling[id].rollsUsed
      const safe = final.some((y) => y !== id && cmp(hand(y), hand(id)) < 0)
      return {
        player: id,
        rank,
        status: bottom.includes(id) ? (bottom.length > 1 ? 'tied' : 'bottom') : safe ? 'safe' : 'live',
        rollsLeft: left,
        allDay: left === 0,
      }
    })
    return [...alreadySafe(state, ids), ...ranked]
  }

  if (phase.kind === 'tresAway') {
    // Only put-out dice are public. Each die still in hand adds 0 (a 3) to 6.
    const ids = phase.order
    const low = (id: PlayerId) => tresAwayScore(phase.hands[id].out.map((i) => state.dice[id][i]))
    const high = (id: PlayerId) => low(id) + 6 * (5 - phase.hands[id].out.length)
    const ranked: Standing[] = rankBest(ids, (a, b) => low(b) - low(a)).map(({ id, rank }) => {
      const others = ids.filter((y) => y !== id)
      const safe = others.some((y) => low(y) > high(id))
      const bottom = others.every((y) => low(id) > high(y))
      return {
        player: id,
        rank,
        status: bottom ? 'bottom' : safe ? 'safe' : 'live',
        rollsLeft: null,
        allDay: phase.hands[id].out.length === 5,
      }
    })
    return [...alreadySafe(state, ids), ...ranked]
  }

  if (phase.kind === 'boss') {
    const others = seatOrderFrom(state, phase.boss, phase.players).slice(1)
    const rolled = (id: PlayerId) => phase.stage === 'comeUp' && !phase.waiting.includes(id)
    const hand = (id: PlayerId) => state.dice[id]
    const boss: Standing = { player: phase.boss, rank: 1, status: 'live', rollsLeft: 0, allDay: true, boss: true }
    const ranked: Standing[] = rankBest(others, (a, b) => compareBoss(hand(a), hand(b))).map(({ id, rank }) => {
      // A last roll can make a hand worse, so only a final hand can be in the cup
      const safe = rolled(id) && others.some((y) => y !== id && rolled(y) && compareBoss(hand(y), hand(id)) < 0)
      return {
        player: id,
        rank: rank + 1,
        status: safe ? 'safe' : 'live',
        rollsLeft: rolled(id) ? 0 : 1,
        allDay: rolled(id),
      }
    })
    return [...alreadySafe(state, phase.players), boss, ...ranked]
  }

  if (phase.kind === 'roundOver' && phase.loser) {
    // The final cycle: its players are ranked; anyone it left out was already safe
    const from = state.log.map((e) => e.type).lastIndexOf('called')
    const cycles = state.log.slice(from).filter((e) => e.type === 'cycle')
    const last = cycles[cycles.length - 1]
    const ids = last?.type === 'cycle'
      ? last.players
      : state.seats.filter((s) => !s.out || s.id === phase.loser).map((s) => s.id)
    const { call } = phase
    const cmp: (a: Dice, b: Dice) => number =
      call.game === 'tres-away' ? compareTresAway : call.game === 'boss' ? compareBoss : playCompare(call)
    const ranked: Standing[] = rankBest(seatOrderFrom(state, state.hammer, ids), (a, b) =>
      cmp(state.dice[a], state.dice[b])
    ).map(({ id, rank }) => ({
      player: id,
      rank,
      status: id === phase.loser ? 'bottom' : 'safe',
      rollsLeft: null,
      allDay: true,
    }))
    const others = state.seats.filter((s) => !s.out && !ids.includes(s.id)).map((s) => s.id)
    return [
      ...seatOrderFrom(state, state.hammer, others).map((player): Standing => ({
        player,
        rank: null,
        status: 'safe',
        rollsLeft: null,
        allDay: true,
      })),
      ...ranked,
    ]
  }

  return []
}
