/**
 * Strategy and odds built on the engine (src/engine). Pure TypeScript.
 * - make-odds: exact chance of making a kicker game with optimal keeps
 * - bots:      a solid heuristic bot for every decision
 * - simulate:  seeded Monte Carlo of your chance of the pencil per decision
 */
export * from './make-odds'
export * from './bots'
export * from './simulate'
