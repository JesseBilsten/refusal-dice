import {
  Action,
  Call,
  Dice,
  GameState,
  activeSeats,
  bossHand,
  bossKeepProblem,
  bottomTarget,
  evaluateKickerHand,
  isKickerGame,
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
  hammerCall,
  keepOptions,
  DecisionChoice,
} from '../../strategy'

/**
 * Why the hint says what it says: the numbers behind a solid player's
 * move (the bots in src/strategy/bots.ts), for the hint card in Play.
 *
 * Every decision is measured the same way: your chance of the pencil
 * this round. The Hammer's call reads the generated call odds (`rows`);
 * every other decision is played out by solid bots, so it comes back as
 * `choices` for simulateDecision (or `refusal` for simulateRefusal), run
 * off the main thread by the page. `why` says how the choice was made.
 */
export interface HintRow {
  label: string
  value: number
  /** Chance of a tie, alongside a 'win' value */
  tie?: number
  /** The option the hint picks */
  best: boolean
}

export interface HintChoice extends DecisionChoice {
  /** The choice the hint picks */
  best: boolean
}

export interface HintStats {
  kind: 'loss' | null
  /** What the values measure, e.g. "Chance you take the pencil" */
  measure: string
  rows: HintRow[]
  why: string
  /** Choices to play out (simulateDecision); `rows` is empty until they're measured */
  choices?: HintChoice[]
  /** A refusal to play out (simulateRefusal) */
  refusal?: { dice: Dice; call: Call; position: 1 | 2; players: number }
}

const MEASURE = 'Chance you take the pencil'

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
      .map((call) => ({ call, loss: callLoss(dice, call, state.rules) }))
      .sort((a, b) => a.loss - b.loss)
    const pick = action.type === 'call' ? action.call : ranked[0].call
    const rows: HintRow[] = ranked.slice(0, 4).map((o) => ({
      label: `Call ${names.call(o.call)}`,
      value: o.loss,
      best: same(o.call, pick),
    }))
    const players = Math.min(8, Math.max(2, activeSeats(state).length))
    const canBark = phase.kind === 'call'
    const bark = barkOdds(players, state.rules)
    if (canBark) rows.push({ label: 'Bark', value: bark, best: action.type === 'bark' })
    const best = ranked[0]
    let why =
      `With ${diceText(dice)}, ${names.call(best.call)} loses least often: ${pct(best.loss)} when everyone plays it. ` +
      `Call odds come from rounds played out by solid bots at a ${CALL_ODDS_PLAYERS}-player table.`
    if (except) why = `Your first call was refused, so ${names.call({ game: except } as Call)} is out. ${why}`
    if (canBark) {
      // At this table size, with refusals played out (hammer-odds.ts)
      const here = hammerCall(dice, players, { rules: state.rules })
      why +=
        bark > here.loss
          ? ` A bark passes the Hammer left and you sit last: ${pct(bark)} with any hand. At ${players} players your best call, ${names.call(here.call)}, takes the pencil ${pct(here.loss)} of the time, so calling is better.`
          : ` A bark passes the Hammer left and you sit last: ${pct(bark)} with any hand, better than your best call at ${players} players (${pct(here.loss)}).`
    }
    return { kind: 'loss', measure: 'Chance you take the pencil', rows, why }
  }

  // A refusal: accept or refuse, each played out by solid bots
  if (phase.kind === 'refusal') {
    const loss = callLoss(dice, phase.call, state.rules)
    const even = 1 / CALL_ODDS_PLAYERS
    return {
      kind: 'loss',
      measure: MEASURE,
      rows: [],
      refusal: { dice: [...dice], call: phase.call, position: phase.seat, players: activeSeats(state).length },
      why:
        `Each chance plays the round out with solid bots from here: refuse, and the next refuser or the Hammer’s second call decides what you play. ` +
        `Played by everyone, ${names.call(phase.call)} takes your pencil ${pct(loss)} of the time with ${diceText(dice)}; an even share is ${pct(even)}.`,
    }
  }

  // Kicker games and Razzle: the best keeps for getting off the bottom (or making the game), played out
  if (phase.kind === 'play') {
    const targetId = bottomTarget(state, me)
    if (!targetId) return null
    const target = state.dice[targetId]
    const rollsLeft = 3 - phase.rolling[me].rollsUsed
    const goal = bottomGoal(phase.call, target, phase.rolling[targetId].kept)
    const mustRoll = wouldLoseIfStopped(state, me)
    const options = keepOptions(dice, rollsLeft, goal, { locked: phase.rolling[me].kept, rules: state.rules }).filter(
      (o) => !(o.stand && mustRoll)
    )
    const chosen = (o: (typeof options)[number]) =>
      action.type === 'stand' ? o.stand : action.type === 'reroll' && !o.stand && diceText(o.keep.map((i) => dice[i])) === diceText(action.keep.map((i) => dice[i]))
    const top = options.slice(0, 4)
    // Always weigh the hint's own pick
    const pick = options.find(chosen)
    if (pick && !top.includes(pick)) top[top.length - 1] = pick
    const need =
      goal.kind === 'make'
        ? 'you need to make the game'
        : `you need to beat ${names.player(targetId)}, who has ${names.hand(target)}`
    // Once the kept dice make the game, the only roll left is the kicker (§3.1)
    const { game, variant } = phase.call
    const rollsKicker = (o: (typeof options)[number]) => {
      if (o.stand || !isKickerGame(game) || !variant) return false
      const hand = evaluateKickerHand(dice, game, variant, o.keep)
      return hand.made && hand.gameDice.length === o.keep.length
    }
    const kickerRolls = top.filter(rollsKicker).length
    const label = (o: (typeof options)[number]) => {
      if (o.stand) return o.tie > 0 ? 'Take the tie' : 'Stand'
      if (rollsKicker(o))
        return kickerRolls > 1 ? `Roll the kicker, keeping ${diceText(o.dice)}` : 'Roll the kicker'
      return o.dice.length ? `Keep ${diceText(o.dice)}` : 'Roll all five'
    }
    return {
      kind: 'loss',
      measure: MEASURE,
      rows: [],
      choices: top.map((o) => ({
        label: label(o),
        actions: [o.stand ? { type: 'stand', player: me } : { type: 'reroll', player: me, keep: o.keep }] as Action[],
        best: chosen(o),
      })),
      why:
        `To get off the bottom ${need}, with ${rollsLeft} ${rollsLeft === 1 ? 'roll' : 'rolls'} left. Each chance plays the round out with solid bots after your move, so it counts ties, replays and what the others still roll.` +
        (mustRoll ? ' You can’t stand while you’re at the bottom.' : ''),
    }
  }

  // Tres Away: roll, or put out the lowest dice, played out
  if (phase.kind === 'tresAway') {
    const hand = phase.hands[me]
    const inHand = [0, 1, 2, 3, 4].filter((i) => !hand.out.includes(i))
    const most = tresAwayMaxPutOut(phase, me)
    const cap =
      phase.cycle > 0
        ? 'In a replay everyone puts out one die at a time.'
        : me === phase.pacer
        ? 'You called it, so you can put out as many as you like.'
        : `${names.player(phase.pacer)} has ${phase.hands[phase.pacer].out.length} out, so you can put out ${most} more at most.`
    const order = [...inHand].sort((a, b) => tresAwayScore([dice[a]]) - tresAwayScore([dice[b]]))
    const picked = action.type === 'putOut' ? action.dice.length : 0
    const choices: HintChoice[] = []
    if (!hand.fresh) choices.push({ label: `Roll ${order.length}`, actions: [{ type: 'roll', player: me }], best: action.type === 'roll' })
    for (let k = 1; k <= Math.min(order.length, most); k++) {
      const out = order.slice(0, k)
      choices.push({
        label: `Put out ${out.map((i) => dice[i]).join(' ')}`,
        actions: [{ type: 'putOut', player: me, dice: [...out].sort((a, b) => a - b) }],
        best: picked === k,
      })
    }
    return {
      kind: 'loss',
      measure: MEASURE,
      rows: [],
      choices: choices.filter((c, i) => c.best || i < 4).slice(0, 5),
      why: `3s count 0, so the lowest dice go out first. Each chance plays the round out with solid bots; the other players’ hidden dice are drawn fresh each time, since you can’t see them. ${cap}`,
    }
  }

  // Boss: roll, come up, or pick 'em up, played out
  if (phase.kind === 'boss') {
    const others = phase.players.filter((id) => id !== me).map((id) => state.dice[id])
    // The secret roll first: which dice to keep (keeping all five rolls none); then come up or pick 'em up
    if (phase.stage === 'bossRoll') {
      // The keeps worth weighing: your hand alone, your hand and its highest other die, the solid pick, all five
      const hand = bossHand(dice).handDice
      const rest = [0, 1, 2, 3, 4].filter((i) => !hand.includes(i)).sort((a, b) => dice[b] - dice[a])
      const solidKeep = action.type === 'reroll' ? action.keep : [0, 1, 2, 3, 4]
      const keeps = [hand, rest.length ? [...hand, rest[0]] : hand, solidKeep, [0, 1, 2, 3, 4]]
      const solidText = diceText(solidKeep.map((i) => dice[i]))
      const seen = new Set<string>()
      const choices: HintChoice[] = []
      for (const keep of keeps) {
        const values = diceText(keep.map((i) => dice[i]))
        if (keep.length === 0 || seen.has(values)) continue
        if (keep.length < 5 && bossKeepProblem(keep.map((i) => dice[i]), others)) continue
        seen.add(values)
        choices.push(
          keep.length === 5
            ? { label: 'Keep all five', actions: [{ type: 'stand', player: me }], best: values === solidText }
            : {
                label: `Keep ${values}, roll ${5 - keep.length}`,
                actions: [{ type: 'reroll', player: me, keep: [...keep].sort((a, b) => a - b) }],
                best: values === solidText,
              }
        )
      }
      return {
        kind: 'loss',
        measure: MEASURE,
        rows: [],
        choices,
        why: 'You roll once more in secret, keeping dice that still beat the table, and then decide: come up or pick ’em up. Each chance plays the round out with solid bots after your roll, including that decision (they come up when someone else is likelier to take the pencil than they are). As the Boss, each option is scored in net pencils: the pencils that go to someone else, minus yours.',
      }
    }
    if (phase.stage === 'decide') {
      const choices: HintChoice[] = [
        { label: 'Come up', actions: [{ type: 'comeUp', player: me }], best: action.type === 'comeUp' },
        { label: 'Pick ’em up', actions: [{ type: 'dontComeUp', player: me }], best: action.type === 'dontComeUp' },
      ]
      return {
        kind: 'loss',
        measure: MEASURE,
        rows: [],
        choices,
        why:
          'Pick ’em up ends the round with no loser, so it never costs a pencil, but it gives up the chance to hand one to someone else. Come up gives everyone one last roll and the worst hand loses, which can be you. So each option is scored in net pencils: the pencils that go to someone else, minus yours.',
      }
    }
    const hand = bossHand(dice).handDice
    const choices: HintChoice[] = [
      { label: 'Stand', actions: [{ type: 'stand', player: me }], best: action.type === 'stand' },
      { label: hand.length ? `Keep ${diceText(hand.map((i) => dice[i]))}, roll ${5 - hand.length}` : 'Roll all five', actions: [{ type: 'reroll', player: me, keep: hand }], best: action.type === 'reroll' },
    ]
    if (hand.length) choices.push({ label: 'Roll all five', actions: [{ type: 'reroll', player: me, keep: [] }], best: false })
    return {
      kind: 'loss',
      measure: MEASURE,
      rows: [],
      choices,
      why: 'Your last roll. Already better than someone who has finished? Standing means you can’t be the worst. Each chance plays the round out with solid bots; the Boss’s secret dice are drawn fresh each time.',
    }
  }

  return null
}
