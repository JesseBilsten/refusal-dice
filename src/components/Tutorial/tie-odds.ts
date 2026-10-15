import { freshMakeChance, rollOrTakeTie } from '../../strategy'

/**
 * The numbers behind the tutorial's "Take the tie, or roll?" screen: you're
 * tied with Ben at 5+5 = 10 in 10-3 High, Ben is done, and you have 2 rolls
 * left. Kept out of the component so src/__tests__/tutorial-script.test.ts
 * can check every figure the screen shows.
 */

export const TIED_AT = 10

export const TIE_ODDS = rollOrTakeTie({
  kickerDice: 2,
  rolls: 2,
  variant: 'high',
  total: TIED_AT,
  tied: 2,
})

/** Ways (of 36) one roll of your kicker beats, ties and falls short of 10 */
export const WAYS = {
  better: Math.round(TIE_ODDS.better * 36),
  equal: Math.round(TIE_ODDS.equal * 36),
  worse: Math.round(TIE_ODDS.worse * 36),
}

/** Rolling: both rolls fall short, so you lose outright */
export const MISS_TWICE = TIE_ODDS.worse ** 2
/** Rolling: you tie on the first roll, or on the second after a miss */
export const TIE_ALONG_THE_WAY =
  TIE_ODDS.equal + TIE_ODDS.worse * TIE_ODDS.equal
/** Rolling: …and then lose that replay */
export const LOSE_VIA_TIE = TIE_ODDS.loseIfTie * TIE_ALONG_THE_WAY

/** Making 10-3 from fresh dice within 1, 2 and 3 rolls (the replay) */
export const MAKE = {
  1: freshMakeChance('10-3', 1),
  2: freshMakeChance('10-3', 2),
  3: freshMakeChance('10-3', 3),
}

/** With 2 rolls left, rolling beats taking the tie at this kicker total or lower */
export const ROLL_UP_TO = Math.max(
  ...Array.from({ length: 11 }, (_, i) => i + 2).filter(
    (total) =>
      rollOrTakeTie({
        kickerDice: 2,
        rolls: 2,
        variant: 'high',
        total,
        tied: 2,
      }).choice === 'roll'
  )
)

/** The odds at ROLL_UP_TO and one above, to show where the line falls */
export const AT_THE_LINE = [ROLL_UP_TO, ROLL_UP_TO + 1].map((total) => ({
  total,
  ...rollOrTakeTie({
    kickerDice: 2,
    rolls: 2,
    variant: 'high',
    total,
    tied: 2,
  }),
}))
