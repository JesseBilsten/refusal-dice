/**
 * Strategy and odds built on the engine (src/engine). Pure TypeScript.
 * - make-odds: exact chance of making a kicker game with the best legal keeps
 * - kicker-odds: exact kicker re-roll odds, e.g. take the tie or roll
 * - situations: exact keep-or-roll choices for any goal
 * - tres-away: exact best put-out in Tres Away
 * - bots:      a solid heuristic bot for every decision
 * - simulate:  seeded Monte Carlo of your chance of the pencil per decision
 * - comebacks: exact second calls: what the Hammer calls when a call is refused
 */
export * from './make-odds'
export * from './kicker-odds'
export * from './tres-away'
export * from './situations'
export * from './bots'
export * from './simulate'
export * from './call-odds'
export * from './seat-odds'
export * from './hammer-odds'
export * from './bark'
export * from './comebacks'
