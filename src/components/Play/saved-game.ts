import { GameState, PlayerId } from '../../engine'

/**
 * The game in progress at Play, kept in this browser so a refresh or a
 * closed tab doesn't lose it. The engine's state is plain data (the dice
 * source included), so it's stored as it is, with the few table settings
 * Play needs to pick up where it was. Storage can be missing or full: every
 * access is wrapped, and a game that can't be saved still plays.
 *
 * Signed-out, per browser. Accounts (Phase 4) will move games to the server.
 */

export const SAVE_KEY = 'refusal-dice:play-game'
/** Bump when the saved shape changes; older saves are then ignored */
export const SAVE_VERSION = 1

export interface SavedGame {
  v: number
  game: GameState
  /** Hard mode: you show your own game */
  hard: boolean
  /** Where this round's events start in the log, and the round before it */
  roundStart: number
  lastRound: [number, number] | null
  /** The round you rolled your dice in */
  rolledRound: number
}

export interface Store {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

/** The browser's localStorage, or null (server render, or storage blocked) */
const storage = (): Store | null => {
  try {
    return (globalThis as { localStorage?: Store }).localStorage ?? null
  } catch {
    return null
  }
}

/** A saved game worth resuming: the current version, well formed, not finished */
export function parseSaved(raw: string | null): SavedGame | null {
  if (!raw) return null
  try {
    const s = JSON.parse(raw)
    const g = s?.game
    if (
      s?.v !== SAVE_VERSION ||
      !g ||
      !Array.isArray(g.seats) ||
      !Array.isArray(g.log)
    )
      return null
    if (
      !g.phase?.kind ||
      g.phase.kind === 'gameOver' ||
      !g.source?.kind ||
      !g.rules
    )
      return null
    if (typeof s.roundStart !== 'number' || s.roundStart > g.log.length)
      return null
    return {
      ...s,
      hard: !!s.hard,
      lastRound: s.lastRound || null,
      rolledRound: s.rolledRound || 0,
    }
  } catch {
    return null
  }
}

export function loadGame(store: Store | null = storage()): SavedGame | null {
  try {
    return parseSaved(store ? store.getItem(SAVE_KEY) : null)
  } catch {
    return null
  }
}

/** Save the game; a finished one is cleared instead (nothing left to resume) */
export function saveGame(
  saved: Omit<SavedGame, 'v'>,
  store: Store | null = storage()
): void {
  if (!store) return
  try {
    if (saved.game.phase.kind === 'gameOver') store.removeItem(SAVE_KEY)
    else store.setItem(SAVE_KEY, JSON.stringify({ v: SAVE_VERSION, ...saved }))
  } catch {
    // Storage full or blocked: the game goes on unsaved
  }
}

export function clearGame(store: Store | null = storage()): void {
  try {
    store?.removeItem(SAVE_KEY)
  } catch {
    // Nothing to do
  }
}

/** "Round 4 · pot $20 · you have 1 pencil", for the resume prompt */
export function savedSummary(saved: SavedGame, you: PlayerId) {
  const g = saved.game
  const me = g.seats.find((s) => s.id === you)
  return {
    round: g.round,
    pot: g.pot || 0,
    players: g.seats.filter((s) => !s.out).length,
    pencils: me?.pencils ?? 0,
    out: Boolean(me?.out),
  }
}
