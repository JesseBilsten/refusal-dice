import {
  Action,
  Call,
  Dice,
  GameState,
  activeSeats,
  bottomTarget,
  compareBoss,
  tresAwayMaxPutOut,
  tresAwayScore,
  wouldLoseIfStopped,
} from '../../engine'
import {
  ALL_CALLS,
  CALL_ODDS_PLAYERS,
  barkOdds,
  bottomGoal,
  callLoss,
  keepOptions,
  tresAwayExpected,
} from '../../strategy'

/**
 * Why the hint says what it says: the numbers behind a solid player's
 * move (the bots in src/strategy/bots.ts), for the hint card in Play.
 *
 * rows compare the options the bot weighed, best first; `kind` says how
 * to read `value`: 'loss' a chance of the pencil (lower is better), 'win'
 * a chance of reaching the goal (higher is better), 'score' an expected
 * Tres Away score (lower is better). `why` says how the choice was made.
 */
export interface HintRow {
  label: string
  value: number
  /** Chance of a tie, alongside a 'win' value */
  tie?: number
  /** The option the hint picks */
  best: boolean
}

export interface HintStats {
  kind: 'loss' | 'win' | 'score' | null
  /** What the values measure, e.g. "Chance you take the pencil" */
  measure: string
  rows: HintRow[]
  why: string
}

export interface HintNames {
  /** A call's name, e.g. "10-3 High" */
  call: (call: Call) => string
  /** A player's name ("You" for you) */
  player: (id: string) => string
  /** A hand in words for the current call, e.g. "a kicker of 9", "no 10-3" */
  hand: (dice: Dice) => string
}

const pct = (p: number) => `${Math.round(p * 100)}%`
const diceText = (dice: number[]) => [...dice].sort((a, b) => a - b).join('-')
const same = (a: Call, b: Call) => a.game === b.game && a.variant === b.variant

export function hintStats(state: GameState, me: string, action: Action, names: HintNames): HintStats | null {
  const phase = state.phase
  const dice = state.dice[me]

  // The Hammer's call: the calls this hand loses least often, and a bark
  if (phase.kind === 'call' || phase.kind === 'secondCall') {
    const except = phase.kind === 'secondCall' ? phase.refused.game : undefined
    const ranked = ALL_CALLS.filter((c) => c.game !== except)
      .map((call) => ({ call, loss: callLoss(dice, call) }))
      .sort((a, b) => a.loss - b.loss)
    const pick = action.type === 'call' ? action.call : ranked[0].call
    const rows: HintRow[] = ranked.slice(0, 4).map((o) => ({
      label: `Call ${names.call(o.call)}`,
      value: o.loss,
      best: same(o.call, pick),
    }))
    const players = Math.min(8, Math.max(2, activeSeats(state).length))
    const canBark = phase.kind === 'call' && state.rules.barking
    const bark = barkOdds(players)
    if (canBark) rows.push({ label: 'Bark', value: bark, best: action.type === 'bark' })
    const best = ranked[0]
    let why =
      `With ${diceText(dice)}, ${names.call(best.call)} loses least often: ${pct(best.loss)} when everyone plays it. ` +
      `Call odds come from rounds played out by solid bots at a ${CALL_ODDS_PLAYERS}-player table.`
    if (except) why = `Your first call was refused, so ${names.call({ game: except } as Call)} is out. ${why}`
    if (canBark)
      why +=
        bark > best.loss
          ? ` A bark passes the Hammer left and you sit last: ${pct(bark)} with any hand, so calling is better.`
          : ` A bark passes the Hammer left and you sit last: ${pct(bark)} with any hand, better than any call here.`
    return { kind: 'loss', measure: 'Chance you take the pencil', rows, why }
  }

  // A refusal: how often you'd lose the call against an even share of the table
  if (phase.kind === 'refusal') {
    const loss = callLoss(dice, phase.call)
    const even = 1 / CALL_ODDS_PLAYERS
    const accept = loss <= even
    return {
      kind: 'loss',
      measure: 'Chance you take the pencil',
      rows: [
        { label: `Play ${names.call(phase.call)}`, value: loss, best: accept },
        { label: 'An even share', value: even, best: false },
      ],
      why: accept
        ? `With ${diceText(dice)} you’d take the pencil ${pct(loss)} of the time playing ${names.call(phase.call)}, no more than an even share (${pct(even)}), so accept. Refusing lets the Hammer pick a second call to suit their dice.`
        : `With ${diceText(dice)} you’d take the pencil ${pct(loss)} of the time playing ${names.call(phase.call)}, worse than an even share (${pct(even)}), so refuse and make the Hammer call something else.`,
    }
  }

  // Kicker games and Razzle: you hold the worst hand; the exact chance each keep gets you off the bottom
  if (phase.kind === 'play') {
    const targetId = bottomTarget(state, me)
    if (!targetId) return null
    const target = state.dice[targetId]
    const rollsLeft = 3 - phase.rolling[me].rollsUsed
    const goal = bottomGoal(phase.call, target)
    const mustRoll = wouldLoseIfStopped(state, me)
    const options = keepOptions(dice, rollsLeft, goal).filter((o) => !(o.stand && mustRoll))
    const chosen = (o: (typeof options)[number]) =>
      action.type === 'stand' ? o.stand : action.type === 'reroll' && !o.stand && diceText(o.keep.map((i) => dice[i])) === diceText(action.keep.map((i) => dice[i]))
    const rows: HintRow[] = options.slice(0, 4).map((o) => ({
      label: o.stand ? (o.tie > 0 ? 'Take the tie' : 'Stand') : o.dice.length ? `Keep ${diceText(o.dice)}` : 'Roll all five',
      value: o.win,
      tie: o.tie,
      best: chosen(o),
    }))
    const need =
      goal.kind === 'make'
        ? `${names.player(targetId)} missed too, so you just need to make the game`
        : `you need to beat ${names.player(targetId)}, who has ${names.hand(target)}`
    return {
      kind: 'win',
      measure: `Chance you get off the bottom (${rollsLeft} ${rollsLeft === 1 ? 'roll' : 'rolls'} left)`,
      rows,
      why:
        `You hold the worst hand: ${need}. Each chance is exact, playing on as well as possible with the rolls you have left. Options are ranked by that chance plus half the chance of a tie, since a tie is a replay, not a loss.` +
        (mustRoll ? ' You can’t stand while you’re at the bottom.' : ''),
    }
  }

  // Tres Away: the average final score of each put-out, playing on well
  if (phase.kind === 'tresAway') {
    const hand = phase.hands[me]
    const inHand = [0, 1, 2, 3, 4].filter((i) => !hand.out.includes(i))
    const shownScore = (id: string) => tresAwayScore(phase.hands[id].out.map((i) => state.dice[id][i]))
    const outScore = shownScore(me)
    const mine = tresAwayScore(dice)
    const beaten = phase.order.find((id) => id !== me && shownScore(id) > mine)
    const most = tresAwayMaxPutOut(phase, me)
    const cap =
      me === phase.pacer
        ? 'You called it, so you can put out as many as you like.'
        : `${names.player(phase.pacer)} has ${phase.hands[phase.pacer].out.length} out, so you can put out ${most} more at most.`
    if (beaten) {
      return {
        kind: null,
        measure: '',
        rows: [],
        why: `${names.player(beaten)} has already put out ${shownScore(beaten)}, and your whole hand scores ${mine}. Put out what you can now and you can’t finish highest. ${cap}`,
      }
    }
    const v = tresAwayExpected()
    const order = [...inHand].sort((a, b) => tresAwayScore([dice[a]]) - tresAwayScore([dice[b]]))
    const n = order.length
    const picked = action.type === 'putOut' ? action.dice.length : 0
    const rows: HintRow[] = []
    if (!hand.fresh) rows.push({ label: `Roll ${n}`, value: outScore + v[n], best: action.type === 'roll' })
    let sum = 0
    for (let k = 1; k <= Math.min(n, most); k++) {
      sum += tresAwayScore([dice[order[k - 1]]])
      rows.push({
        label: `Put out ${order.slice(0, k).map((i) => dice[i]).join(' ')}`,
        value: outScore + sum + v[n - k],
        best: picked === k,
      })
    }
    rows.sort((a, b) => a.value - b.value)
    return {
      kind: 'score',
      measure: 'Average final score (lower is better)',
      rows: rows.slice(0, 4),
      why: `3s count 0, so the lowest dice go out first. Each average is exact, playing the rest of your dice well; it doesn’t see the other players’ hidden dice. ${cap}`,
    }
  }

  if (phase.kind === 'boss') {
    let why = ''
    if (phase.stage === 'bossRoll')
      why = 'You must keep the dice that made you Boss. Re-roll any other die of 3 or lower for a chance at a better hand; keep the high ones.'
    else if (phase.stage === 'decide') {
      const strong = compareBoss(dice, [2, 2, 1, 1, 3]) >= 0
      why = strong
        ? 'With two pair or better, “come up”: most hands can’t beat yours in one roll, and the worst hand at the table loses.'
        : 'Below two pair, “don’t come up”: one last roll each gives the others a good chance to pass you, and you could take the pencil.'
    } else
      why =
        'Already better than someone who has finished? Stand: you can’t be the worst. Otherwise keep the dice that make your hand and roll the rest.'
    return { kind: null, measure: '', rows: [], why }
  }

  return null
}
