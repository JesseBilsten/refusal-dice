/**
 * Pure helpers behind the odds-decision pattern (see
 * .claude/skills/explain-odds/SKILL.md). No React here, so Jest can test
 * the numbers every odds explanation shows.
 */

/** `p` as a percent: 0.7708 → "77%" (digits = 0) or "77.1%" (digits = 1) */
export function fmtPct(p: number, digits = 0): string {
  const v = p * 100
  // Never print a nonzero chance as "0%" or a sure miss as "100%"
  if (v > 0 && v < 0.5 * 10 ** -digits) return `<${(10 ** -digits).toString()}%`
  if (v < 100 && v > 100 - 0.5 * 10 ** -digits)
    return `>${(100 - 10 ** -digits).toFixed(digits)}%`
  return `${v.toFixed(digits)}%`
}

const DENOMINATORS = [2, 3, 4, 5, 6, 8, 10, 12, 20, 36, 100]

/**
 * A natural frequency for `p`: 0.5 → "1 in 2", 0.7708 → "about 3 in 4",
 * 1/12 → "1 in 12". People judge "3 in 4" faster than "77%". An exact
 * fraction wins; otherwise the smallest denominator that's close (within
 * 3 points and 10% of the chance itself), said with "about".
 */
export function inWords(p: number): string {
  if (p <= 0) return 'never'
  if (p >= 1) return 'always'
  const fits = (exact: boolean) =>
    DENOMINATORS.map((d) => ({ d, n: Math.round(p * d) })).find(({ d, n }) => {
      if (n < 1 || n >= d) return false
      const err = Math.abs(p - n / d)
      // Exact fractions only read easily with small denominators (1 in 12, not 25 in 36)
      return exact
        ? err < 1e-9 && d <= 12
        : err < 0.03 && err < 0.1 * Math.min(p, 1 - p)
    })
  const exact = fits(true)
  if (exact) return `${exact.n} in ${exact.d}`
  const near = fits(false)
  return near ? `about ${near.n} in ${near.d}` : fmtPct(p)
}

export type SegmentKind = 'lose' | 'coin' | 'safe'

/** One way an option ends badly (or well), as a slice of its bar */
export interface Segment {
  p: number
  label: string
  kind: SegmentKind
}

export interface Option {
  id: string
  label: string
  /** The slices that make up this option's total (usually the ways you lose) */
  segments: Segment[]
}

export interface Ranked extends Option {
  total: number
  best: boolean
}

/**
 * Totals each option and marks the best one. `lowerIsBetter` when the
 * measure is a bad outcome (the pencil); options within `tieMargin` of the
 * best are all marked best (a real toss-up).
 */
export function rankOptions(
  options: Option[],
  lowerIsBetter = true,
  tieMargin = 0.005
): Ranked[] {
  const totals = options.map((o) => o.segments.reduce((s, x) => s + x.p, 0))
  const best = lowerIsBetter ? Math.min(...totals) : Math.max(...totals)
  return options.map((o, i) => ({
    ...o,
    total: totals[i],
    best: Math.abs(totals[i] - best) <= tieMargin,
  }))
}

/** Every ordered roll of two dice, classified: 36 cells for the outcome grid */
export function twoDiceGrid<K extends string>(
  classify: (a: number, b: number) => K
): { a: number; b: number; sum: number; kind: K }[] {
  const cells: { a: number; b: number; sum: number; kind: K }[] = []
  for (let a = 1; a <= 6; a++)
    for (let b = 1; b <= 6; b++)
      cells.push({ a, b, sum: a + b, kind: classify(a, b) })
  return cells
}
