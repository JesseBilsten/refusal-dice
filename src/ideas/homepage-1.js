import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'gatsby'
import Layout from '../components/layout'
import { Badge } from '../components/ui/badge'
import Die from '../components/Die'

/**
 * HOMEPAGE 1: "The Game Table"
 * 
 * UX Concept: A scripted 4-player round plays out step-by-step in the viewport.
 * Users watch dice appear, a call being made, accept/refuse decisions, and a loser revealed.
 * Teaches the game through observation (Show, Don't Tell).
 * 
 * UX Laws applied:
 * - Aesthetic-Usability Effect: Clean, app-like presentation builds trust
 * - Serial Position Effect: Key info (what is this game?) at the very start
 * - Progressive Disclosure: The animation reveals rules one step at a time
 * - Von Restorff Effect: The active player/step is highlighted
 */

const PLAYERS = [
  { name: 'Alex', emoji: '🟢', pencils: 1 },
  { name: 'Blake', emoji: '🔵', pencils: 0 },
  { name: 'Casey', emoji: '🟡', pencils: 2 },
  { name: 'Dana', emoji: '🟣', pencils: 1 },
]

// Scripted round: Alex has hammer, calls 10-2 High
// Blake (1st refusal) refuses, Casey (2nd refusal) accepts
// Everyone plays. Casey loses (worst kickers).
const SCRIPT = [
  {
    id: 'roll',
    phase: 'Roll',
    label: 'Everyone rolls',
    description: 'All players roll 5 dice and hide their results.',
    duration: 3000,
    activePlayer: null,
    showDice: false,
    highlights: [0, 1, 2, 3],
  },
  {
    id: 'show-hammer',
    phase: 'Roll',
    label: 'Alex has the Hammer 🔨',
    description: 'Alex rolled highest in the piddle, so they call first.',
    duration: 2500,
    activePlayer: 0,
    showDice: true,
    revealDice: [0], // Only Alex sees their dice
    dice: { 0: [4, 6, 2, 5, 3] }, // 4+6=10, kickers [2,5,3] → 10-2
    highlights: [0],
  },
  {
    id: 'call',
    phase: 'Call',
    label: 'Alex calls "10-2 High"',
    description: 'Alex has 4+6=10 with kickers [2,3,5]. Decent hand!',
    duration: 3000,
    activePlayer: 0,
    showDice: true,
    revealDice: [0],
    dice: { 0: [4, 6, 2, 5, 3] },
    callBadge: '10-2 High',
    highlights: [0],
  },
  {
    id: 'first-refusal',
    phase: '1st Refusal',
    label: 'Blake refuses',
    description: 'Blake is to Alex\'s left. They check their dice — no 10-2. They refuse.',
    duration: 3000,
    activePlayer: 1,
    showDice: true,
    revealDice: [0],
    dice: { 0: [4, 6, 2, 5, 3], 1: [1, 3, 3, 2, 5] },
    callBadge: '10-2 High',
    decision: { player: 1, choice: 'REFUSE' },
    highlights: [1],
  },
  {
    id: 'second-refusal',
    phase: '2nd Refusal',
    label: 'Casey accepts!',
    description: 'Casey is next. They have 4+6=10 with kickers [1,1,6]. They accept — everyone plays!',
    duration: 3000,
    activePlayer: 2,
    showDice: true,
    revealDice: [0, 2],
    dice: { 0: [4, 6, 2, 5, 3], 1: [1, 3, 3, 2, 5], 2: [4, 6, 1, 1, 6] },
    callBadge: '10-2 High',
    decision: { player: 2, choice: 'ACCEPT' },
    highlights: [2],
  },
  {
    id: 'play',
    phase: 'Play',
    label: 'All 4 players play 10-2 High',
    description: 'Everyone reveals their dice. Highest kickers win, lowest kickers lose.',
    duration: 3500,
    activePlayer: null,
    showDice: true,
    revealDice: [0, 1, 2, 3],
    dice: {
      0: [4, 6, 2, 5, 3], // kickers: 2+3+5=10
      1: [4, 6, 1, 2, 4], // kickers: 1+2+4=7 ← can't make 10-2? Actually 4+6=10, kickers [1,2,4]
      2: [4, 6, 1, 1, 6], // kickers: 1+1+6=8
      3: [5, 5, 3, 6, 4], // kickers: 3+4+6=13 ← wait, 5+5=10, kickers [3,4,6]
    },
    callBadge: '10-2 High',
    highlights: [0, 1, 2, 3],
  },
  {
    id: 'result',
    phase: 'Pencil',
    label: 'Blake loses — takes a pencil ✏️',
    description: 'Blake had the lowest kickers (1+2+4=7). They take a pencil and get the next call.',
    duration: 4000,
    activePlayer: 1,
    showDice: true,
    revealDice: [0, 1, 2, 3],
    dice: {
      0: [4, 6, 2, 5, 3],
      1: [4, 6, 1, 2, 4],
      2: [4, 6, 1, 1, 6],
      3: [5, 5, 3, 6, 4],
    },
    callBadge: '10-2 High',
    loser: 1,
    kickerSums: { 0: 10, 1: 7, 2: 8, 3: 13 },
    highlights: [1],
  },
]

const PlayerCard = ({ player, index, step, isActive, isHighlighted, isLoser }) => {
  const dice = step.dice?.[index]
  const isRevealed = step.revealDice?.includes(index)
  const kickerSum = step.kickerSums?.[index]
  const roles = ['Hammer 🔨', '1st Refusal', '2nd Refusal', 'Player']
  const decision = step.decision?.player === index ? step.decision.choice : null

  return (
    <div
      className={`
        relative rounded-lg border p-3 transition-all duration-500
        ${isActive ? 'border-primary bg-primary/5 ring-2 ring-primary/30' : ''}
        ${isLoser ? 'border-red-500 bg-red-500/10 ring-2 ring-red-500/30' : ''}
        ${!isActive && !isLoser && isHighlighted ? 'border-border bg-muted/50' : ''}
        ${!isActive && !isLoser && !isHighlighted ? 'border-border/50 bg-background opacity-60' : ''}
      `}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{player.emoji}</span>
          <span className="font-semibold text-sm">{player.name}</span>
        </div>
        <div className="flex items-center gap-1">
          {Array.from({ length: player.pencils + (isLoser ? 1 : 0) }).map((_, i) => (
            <span key={i} className="text-xs">✏️</span>
          ))}
          {player.pencils + (isLoser ? 1 : 0) === 0 && (
            <span className="text-xs text-muted-foreground">0 ✏️</span>
          )}
        </div>
      </div>

      <div className="text-xs text-muted-foreground mb-2">{roles[index]}</div>

      {/* Dice display */}
      <div className="flex gap-1 min-h-[28px] items-center">
        {dice && isRevealed ? (
          dice.map((d, i) => <Die key={i} number={d} inline />)
        ) : dice ? (
          <span className="text-xs text-muted-foreground italic">Hidden</span>
        ) : step.showDice === false ? (
          <span className="text-xs text-muted-foreground italic">Rolling…</span>
        ) : null}
      </div>

      {/* Decision badge */}
      {decision && (
        <div className="mt-2">
          <Badge variant={decision === 'ACCEPT' ? 'default' : 'secondary'} className={decision === 'ACCEPT' ? 'bg-green-600' : 'bg-red-600 text-white'}>
            {decision === 'ACCEPT' ? '✅ Accept' : '🚫 Refuse'}
          </Badge>
        </div>
      )}

      {/* Kicker sum */}
      {kickerSum !== undefined && (
        <div className={`mt-2 text-xs font-medium ${isLoser ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'}`}>
          Kickers: {kickerSum} {isLoser ? '← Lowest' : ''}
        </div>
      )}
    </div>
  )
}

const Homepage1 = () => {
  const [stepIndex, setStepIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  const step = SCRIPT[stepIndex]

  const advance = useCallback(() => {
    setStepIndex(prev => (prev + 1) % SCRIPT.length)
  }, [])

  useEffect(() => {
    if (isPaused) return
    const timer = setTimeout(advance, step.duration)
    return () => clearTimeout(timer)
  }, [stepIndex, isPaused, step.duration, advance])

  return (
    <Layout>
      <section className="min-h-[calc(100vh-64px)] flex flex-col">
        {/* Header */}
        <div className="text-center pt-8 pb-4 px-4">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">Refusal Dice</h1>
          <p className="text-muted-foreground max-w-lg mx-auto text-sm sm:text-base">
            A social dice game for 2–8 players. Roll, call a game, and dare others to play. Watch a round unfold:
          </p>
        </div>

        {/* Game animation area */}
        <div className="flex-1 flex flex-col justify-center px-4 pb-4 max-w-3xl mx-auto w-full">
          {/* Phase indicator */}
          <div className="flex items-center justify-center gap-1 mb-4">
            {['Roll', 'Call', '1st Refusal', '2nd Refusal', 'Play', 'Pencil'].map(phase => (
              <div
                key={phase}
                className={`
                  px-2 py-1 rounded text-xs font-medium transition-all duration-300
                  ${step.phase === phase 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground'}
                `}
              >
                {phase}
              </div>
            ))}
          </div>

          {/* Step info */}
          <div className="text-center mb-4 min-h-[60px]">
            <h2 className="text-lg font-semibold text-foreground mb-1">{step.label}</h2>
            <p className="text-sm text-muted-foreground">{step.description}</p>
            {step.callBadge && (
              <Badge className="mt-2 text-sm" variant="outline">{step.callBadge}</Badge>
            )}
          </div>

          {/* Player cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {PLAYERS.map((player, i) => (
              <PlayerCard
                key={player.name}
                player={player}
                index={i}
                step={step}
                isActive={step.activePlayer === i}
                isHighlighted={step.highlights?.includes(i)}
                isLoser={step.loser === i}
              />
            ))}
          </div>

          {/* Progress bar */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 flex gap-1">
              {SCRIPT.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setStepIndex(i)}
                  className={`
                    flex-1 h-1.5 rounded-full transition-all duration-300 cursor-pointer
                    ${i === stepIndex ? 'bg-primary' : i < stepIndex ? 'bg-primary/40' : 'bg-muted'}
                  `}
                  aria-label={`Go to step ${i + 1}`}
                />
              ))}
            </div>
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded border border-border"
              aria-label={isPaused ? 'Play animation' : 'Pause animation'}
            >
              {isPaused ? '▶' : '⏸'}
            </button>
          </div>
        </div>

        {/* Bottom CTAs */}
        <div className="border-t border-border bg-muted/30 py-4 px-4">
          <div className="max-w-3xl mx-auto flex flex-wrap justify-center gap-3">
            <Link to="/rules" className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4">
              Learn the Rules
            </Link>
            <Link to="/games" className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-border bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4">
              Browse Games
            </Link>
            <Link to="/strategy-assistant" className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-border bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4">
              Strategy Tool
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  )
}

export default Homepage1
