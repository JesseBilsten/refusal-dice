/**
 * The decision trainer (src/components/Trainer/trainer-model.ts): real
 * situations from seeded games against solid bots, options that don't give
 * the answer away, and grading against the computed odds.
 */
import {
  Call,
  activeSeats,
  applyAction,
  bottomTarget,
  evaluateKickerHand,
  isKickerGame,
  wouldLoseIfStopped,
} from '../engine'
import {
  ALL_CALLS,
  RefusalEstimate,
  callLoss,
  hammerCall,
  playOutRound,
  simulateDecision,
} from '../strategy'
import { YOU } from '../components/Play/play-model'
import {
  FOCUSES,
  Focus,
  addToTally,
  describe as describeSituation,
  drawSituation,
  emptyTally,
  grade,
  isBossChoice,
  kindOf,
  ORDER_MAX,
  orderPair,
  orderQuestions,
  parseSituationCode,
  refusalQuestions,
  situationCode,
} from '../components/Trainer/trainer-model'

const callName = (c: Call) => `${c.game}${c.variant ? ` ${c.variant}` : ''}`
const names = {
  call: callName,
  player: (id: string) => (id === YOU ? 'You' : id),
  hand: (dice: number[]) => dice.join(''),
}

test.each(FOCUSES.map((f) => f.id))(
  '"%s" deals your own decisions, with the solid pick among the options',
  (focus) => {
    for (let seed = 1; seed <= 6; seed++) {
      const s = drawSituation(seed, focus as Focus, () => names)
      // Call order is a Hammer's call, asked a different way
      expect(kindOf(s.state)).toBe(s.kind === 'order' ? 'call' : s.kind)
      if (focus !== 'all') expect(s.kind).toBe(focus)
      expect(s.options.length).toBeGreaterThanOrEqual(2)
      expect(s.options.map((o) => o.id)).toContain(s.solid)
      expect(new Set(s.options.map((o) => o.id)).size).toBe(s.options.length)
      if (s.kind !== 'refusal')
        s.options.forEach((o) => expect(o.actions?.length).toBeGreaterThan(0))
    }
  }
)

test('the same seed deals the same situation', () => {
  const a = drawSituation(11, 'all', () => names)
  const b = drawSituation(11, 'all', () => names)
  expect(b.state).toEqual(a.state)
  expect(b.options).toEqual(a.options)
})

test('calls are listed in game order, Bark last, whatever their odds', () => {
  for (let seed = 1; seed <= 8; seed++) {
    const s = drawSituation(seed, 'call', () => names)
    const calls = s.options.filter((o) => o.id !== 'Bark')
    const index = (label: string) =>
      ALL_CALLS.findIndex((c) => label === `Call ${callName(c)}`)
    const order = calls.map((o) => index(o.label))
    expect(order.every((i) => i >= 0)).toBe(true)
    expect([...order].sort((a, b) => a - b)).toEqual(order)
    const bark = s.options.findIndex((o) => o.id === 'Bark')
    if (bark >= 0) expect(bark).toBe(s.options.length - 1)
    // Every option, the bark included, is played out at this table: never a fixed figure
    expect(s.stats.rows).toEqual([])
    s.options.forEach((o) => expect(o.actions?.length).toBe(1))
    if (bark >= 0) expect(s.options[bark].actions![0].type).toBe('bark')
  }
})

test('grading: the lowest chance is best, close calls are a toss-up, the rest cost the difference', () => {
  const options = [
    { id: 'a', label: 'Keep 5-6' },
    { id: 'b', label: 'Keep 6' },
    { id: 'c', label: 'Roll all five' },
  ]
  const values = { a: 0.3, b: 0.32, c: 0.41 }
  expect(grade(options, values, 'a', 0.03)).toMatchObject({
    verdict: 'best',
    cost: 0,
  })
  expect(grade(options, values, 'b', 0.03)).toMatchObject({ verdict: 'tossup' })
  const costly = grade(options, values, 'c', 0.03)
  expect(costly.verdict).toBe('costly')
  expect(costly.cost).toBeCloseTo(0.11, 10)
  expect(costly.ranked.map((o) => o.id)).toEqual(['a', 'b', 'c'])

  let t = emptyTally()
  t = addToTally(t, grade(options, values, 'a', 0.03))
  t = addToTally(t, grade(options, values, 'b', 0.03))
  t = addToTally(t, costly)
  expect(t.played).toBe(3)
  expect(t.good).toBe(2)
  expect(t.given).toBeCloseTo(0.11, 10)
})

test('every situation is described in words, with nothing left blank', () => {
  for (const focus of ['call', 'refusal', 'roll'] as Focus[])
    for (let seed = 1; seed <= 15; seed++) {
      const { heading, detail } = describeSituation(
        drawSituation(seed, focus, () => names),
        names
      )
      expect(heading.length).toBeGreaterThan(5)
      expect(detail.length).toBeGreaterThan(10)
      expect(`${heading} ${detail}`).not.toMatch(/undefined|null|NaN/)
    }
})

test('once your game is made, every roll is the kicker (§3.1), and a miss never stands', () => {
  let made = 0
  for (let seed = 1; seed <= 400; seed++) {
    const s = drawSituation(seed, 'roll', () => names)
    const phase = s.state.phase
    if (phase.kind !== 'play') continue
    const { game, variant } = phase.call
    if (!isKickerGame(game) || !variant) continue
    const hand = evaluateKickerHand(
      s.state.dice[YOU],
      game,
      variant,
      phase.rolling[YOU].kept
    )
    const labels = s.options.map((o) => o.label)
    if (hand.made) {
      made++
      labels
        .filter((l) => l !== 'Stand' && l !== 'Take the tie')
        .forEach((l) => expect(l).toMatch(/^Roll the kicker/))
    } else {
      expect(labels).not.toContain('Stand')
      expect(labels).not.toContain('Take the tie')
      labels.forEach((l) => expect(l).not.toMatch(/kicker/))
    }
  }
  expect(made).toBeGreaterThan(5)
})

test('the Boss’s own choices are scored in net pencils; everything else in your chance of the pencil', () => {
  let boss = 0
  for (let seed = 1; seed <= 300; seed++) {
    const s = drawSituation(seed, 'roll', () => names)
    expect(s.measure).toBe(isBossChoice(s.state) ? 'net' : 'pencil')
    if (s.measure === 'net') {
      boss++
      // Before the secret roll only keeps are offered; come up or pick ’em up comes after it
      const phase = s.state.phase
      if (phase.kind === 'boss' && phase.stage === 'bossRoll')
        s.options.forEach((o) => expect(o.label).toMatch(/^Keep/))
    }
  }
  expect(boss).toBeGreaterThan(0)
})

test('a sudden-death round (after parity) still has a loser when played out', () => {
  // Seed 35: two players left at parity, so the round's pencil ends the game
  const s = drawSituation(35, 'call', () => names)
  const odds = simulateDecision({
    state: s.state,
    me: YOU,
    choices: s.options.map((o) => ({ label: o.label, actions: o.actions! })),
    samples: 60,
  })
  // (a 2-player tie takes no pencil, so not every round has one; before the fix none did)
  odds.forEach((o) => expect(o.pencil + o.other!).toBeGreaterThan(0.5))
})

test('the options always include taking the tie when it’s allowed, and the best call against the bots', () => {
  for (let seed = 1; seed <= 150; seed++) {
    const roll = drawSituation(seed, 'roll', () => names)
    if (
      roll.state.phase.kind === 'play' &&
      !wouldLoseIfStopped(roll.state, YOU)
    )
      expect(roll.options.some((o) => o.actions?.[0].type === 'stand')).toBe(
        true
      )
    const call = drawSituation(seed, 'call', () => names)
    if (call.state.phase.kind === 'call') {
      const players = activeSeats(call.state).length
      const vsBots = hammerCall(call.state.dice[YOU], players, {
        vsBots: true,
      }).call
      expect(call.options.map((o) => o.label)).toContain(
        `Call ${callName(vsBots)}`
      )
    }
  }
})

test('coming up after the Boss: stand, or keep any dice (never all five) and roll the rest', () => {
  let seen = 0
  for (let seed = 1; seed <= 300; seed++) {
    const s = drawSituation(seed, 'roll', () => names)
    const phase = s.state.phase
    if (phase.kind !== 'boss' || phase.stage !== 'comeUp') continue
    seen++
    const labels = s.options.map((o) => o.label)
    expect(labels[0]).toBe('Stand')
    expect(labels).toContain('Roll all five')
    expect(new Set(labels).size).toBe(labels.length)
    s.options.forEach((o) => {
      const a = o.actions![0]
      if (a.type === 'reroll') expect(a.keep.length).toBeLessThan(5)
    })
  }
  expect(seen).toBeGreaterThan(5)
})

test('a 2-player second call names the one refusal', () => {
  let seen = 0
  for (let seed = 1; seed <= 60; seed++) {
    const s = drawSituation(seed, 'call', () => names)
    if (
      s.state.phase.kind !== 'secondCall' ||
      activeSeats(s.state).length !== 2
    )
      continue
    seen++
    expect(describeSituation(s, names).detail).not.toMatch(/Both refusals/)
  }
  expect(seen).toBeGreaterThan(0)
})

test('playing from the bottom, the hand to beat says how many rolls it has left', () => {
  let seen = 0
  for (let seed = 1; seed <= 30; seed++) {
    const s = drawSituation(seed, 'roll', () => names)
    const phase = s.state.phase
    if (phase.kind !== 'play') continue
    const { detail } = describeSituation(s, names)
    const target = bottomTarget(s.state, YOU)
    if (!target) continue
    seen++
    const left = 3 - phase.rolling[target].rollsUsed
    expect(detail).toContain(
      left > 0 ? `${left} ${left === 1 ? 'roll' : 'rolls'} left)` : 'all day)'
    )
  }
  expect(seen).toBeGreaterThan(3)
})

describe('call order', () => {
  const draw = (seed: number) => drawSituation(seed, 'order', () => names)

  test('deals your two strongest games as the two orders, each with its second call', () => {
    for (let seed = 1; seed <= 8; seed++) {
      const s = draw(seed)
      expect(s.kind).toBe('order')
      expect(s.state.phase.kind).toBe('call')
      expect(s.state.hammer).toBe(YOU)
      const pair = orderPair(s.state.dice[YOU])!
      expect(pair).not.toBeNull()
      pair.forEach((c) =>
        expect(callLoss(s.state.dice[YOU], c)).toBeLessThanOrEqual(ORDER_MAX)
      )
      expect(pair[0].game).not.toBe(pair[1].game)
      expect(s.options).toHaveLength(2)
      const [x, y] = s.options
      const firstOf = (o: (typeof s.options)[0]) =>
        (o.actions![0] as { call: Call }).call
      expect(firstOf(x)).toEqual(y.then)
      expect(firstOf(y)).toEqual(x.then)
      expect(s.options.map((o) => o.id)).toContain(s.solid)
      const { heading, detail } = describeSituation(s, names)
      expect(`${heading} ${detail}`).not.toMatch(/undefined|null|NaN/)
    }
  })

  test('playing it out makes the planned second call when both refuse, and the paths add up', () => {
    const s = draw(3)
    const [est] = simulateDecision({
      state: s.state,
      me: YOU,
      choices: s.options
        .slice(0, 1)
        .map((o) => ({ label: o.label, actions: o.actions!, then: o.then })),
      samples: 300,
    })
    const p = est.orderPaths!
    expect(p.accepted.share + p.refused.share).toBeCloseTo(1, 9)
    expect(p.refused.share).toBeGreaterThan(0)
    expect(
      p.accepted.share * p.accepted.pencil + p.refused.share * p.refused.pencil
    ).toBeCloseTo(est.pencil, 9)
    // The second call is the planned one, not the bot's choice
    let seen = 0
    for (let seed = 1; seed <= 12; seed++) {
      const o = draw(seed).options[0]
      const g = applyAction(draw(seed).state, o.actions![0])
      const second = playOutRound(g, o.then)
        .state.log.slice(g.log.length)
        .find((e) => e.type === 'called' && e.second)
      if (second?.type !== 'called') continue
      seen++
      expect(second.call).toEqual(o.then)
    }
    expect(seen).toBeGreaterThan(0)
  })

  test('the questions quote this situation’s own playouts', () => {
    const s = draw(5)
    const paths = Object.fromEntries(
      s.options.map((o, i) => [
        o.id,
        {
          accepted: { share: 0.6, pencil: 0.1 + i / 10 },
          refused: { share: 0.4, pencil: 0.05 },
        },
      ])
    )
    const qs = orderQuestions(s, paths, names)
    expect(qs.length).toBeGreaterThanOrEqual(3)
    expect(qs[0].a).toContain('10%')
    expect(qs[0].a).toContain('20%')
    qs.forEach((q) => expect(`${q.q} ${q.a}`).not.toMatch(/undefined|null|NaN/))
  })
})

describe('situation codes', () => {
  test('a code reads back to the same practice, seed and house rule', () => {
    for (const focus of FOCUSES.map((f) => f.id))
      for (const seed of [0, 1, 31, 32, 123456789, 2 ** 31 - 1])
        for (const loneKeep of [false, true])
          expect(
            parseSituationCode(situationCode(seed, focus, loneKeep))
          ).toEqual({ seed, focus, loneKeep })
  })

  test('codes avoid look-alike letters, and read them back when typed', () => {
    const code = situationCode(2 ** 31 - 1, 'refusal')
    expect(code).toMatch(/^R-[0-9A-HJKMNP-TV-Z]+$/)
    expect(parseSituationCode(code.toLowerCase())?.seed).toBe(2 ** 31 - 1)
    expect(parseSituationCode('R-1O')).toEqual(parseSituationCode('R-10'))
    expect(parseSituationCode('R-1L')).toEqual(parseSituationCode('R-11'))
  })

  test('anything else is not a code', () => {
    for (const bad of ['', 'R', 'R-', 'X-12', 'R-12-Q', 'R-ZZZZZZZ', 'hello'])
      expect(parseSituationCode(bad)).toBeNull()
  })

  test('the same code deals the same situation', () => {
    const { seed, focus } = parseSituationCode(situationCode(77, 'refusal'))!
    expect(drawSituation(seed, focus, () => names).state).toEqual(
      drawSituation(77, 'refusal', () => names).state
    )
  })
})

describe('refusal questions', () => {
  const estimate: RefusalEstimate = {
    accept: { pencil: 0.571, error: 0.003, samples: 2000 },
    refuse: { pencil: 0.569, error: 0.004, samples: 2000 },
    refusePaths: [
      { path: 'nextAccepts', share: 0.225, pencil: 0.848 },
      { path: 'secondCall', share: 0.775, pencil: 0.488 },
    ],
    secondCalls: [
      { call: { game: 'pairs', variant: 'high' }, share: 0.259, pencil: 0.598 },
      {
        call: { game: 'ship-captain-crew', variant: 'high' },
        share: 0.253,
        pencil: 0.333,
      },
      { call: { game: 'razzle' }, share: 0.191, pencil: 0.586 },
      { call: { game: 'boss' }, share: 0.127, pencil: 0.696 },
    ],
    conditioned: true,
  }
  const info = {
    call: { game: '10-4', variant: 'high' } as Call,
    position: 1 as const,
    players: 3,
    callOdds: 0.409,
  }

  test('answer from the playouts: the Hammer has it, the 2nd refusal, the second calls, the sum', () => {
    const qs = refusalQuestions(estimate, info, names)
    const text = qs.map((q) => `${q.q} ${q.a}`).join(' ')
    expect(text).toContain('41%') // nobody's dice known
    expect(text).toContain('57%') // accepting, against a Hammer who has it
    expect(text).toContain('85%') // the 2nd refusal accepts
    expect(text).toContain('pairs high (26%') // the likeliest second call
    expect(text).not.toContain('boss') // only the top three
    expect(text).toMatch(/23% × 85% .* \+ 78% × 49% .* = 57%/)
    expect(text).not.toMatch(/undefined|null|NaN/)
  })

  test('the parts add up to refusing', () => {
    const sum = estimate.refusePaths.reduce((s, p) => s + p.share * p.pencil, 0)
    expect(sum).toBeCloseTo(estimate.refuse.pencil, 2)
  })

  test('as 2nd refusal nobody else can accept, and away from 3 players there are no 3-player call odds', () => {
    const qs = refusalQuestions(
      {
        ...estimate,
        refusePaths: [{ path: 'secondCall', share: 1, pencil: 0.569 }],
      },
      { ...info, position: 2, players: 4 },
      names
    )
    const text = qs.map((q) => `${q.q} ${q.a}`).join(' ')
    expect(text).not.toContain('2nd refusal accepts')
    expect(text).not.toContain('41%')
  })
})
