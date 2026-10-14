/**
 * Core types for the Refusal Dice engine.
 * The engine follows docs/RULES.md; it has no React, DOM or network code so
 * the site, bots and a future game server can all run it.
 */

export type Die = 1 | 2 | 3 | 4 | 5 | 6
export type Dice = Die[]

export type PlayerId = string

/** Games decided by making a hand, then comparing kicker totals (docs/RULES.md §3.1) */
export type KickerGameId =
  | '10-2'
  | '10-3'
  | '10-4'
  | 'ship-captain-crew'
  | 'monterey'
  | 'vegas'
  | 'pairs'

/** Games with their own procedures (§3.2–3.4); not playable in the engine yet */
export type SpecialtyGameId = 'razzle' | 'boss' | 'tres-away'

export type GameId = KickerGameId | SpecialtyGameId

export type Variant = 'high' | 'low'

export interface Call {
  game: GameId
  /** Required for kicker games */
  variant?: Variant
}

/** Table rules that vary between groups (docs/RULES.md §5) */
export interface HouseRules {
  /** Pencils that put a player out */
  pencilsToLose: number
  /** Whether the Hammer may bark */
  barking: boolean
}

export const DEFAULT_HOUSE_RULES: HouseRules = {
  pencilsToLose: 3,
  barking: true,
}

/** Thrown when an action isn't legal in the current state */
export class EngineError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'EngineError'
  }
}
