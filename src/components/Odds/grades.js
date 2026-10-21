/**
 * How strong a roll is for a call, by `loss` (the Hammer's chance of the
 * pencil calling it): the first grade whose `max` it's within. Plain JS so
 * odds code (and Jest) can read it without React.
 */
export const STRENGTH_GRADES = [
  { max: 0.15, label: 'Strong', tone: 'border-odds-safe/50 bg-odds-safe/15' },
  { max: 0.25, label: 'Good', tone: 'border-odds-safe/40 bg-odds-safe/10' },
  { max: 1 / 3, label: 'Fair', tone: 'border-odds-coin/60 bg-odds-coin/15' },
  { max: Infinity, label: 'Weak', tone: 'border-odds-lose/50 bg-odds-lose/15' },
]

export const strengthGrade = (loss) => STRENGTH_GRADES.find((g) => loss <= g.max)
