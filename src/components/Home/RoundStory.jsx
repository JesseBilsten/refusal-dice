import React, { useEffect, useRef, useState } from 'react'
import { Pause, Pencil, Play, RotateCcw } from 'lucide-react'
import { cn } from '../../lib/utils'
import { Hand, usePrefersReducedMotion } from '../Dice'

/**
 * The home page's story: one round of Refusal told in six scenes on a felt
 * table, with tumbling 3D dice. It plays itself (pausing on hover or focus,
 * and not at all with reduced motion); the dots jump to any scene.
 *
 * The dice are scripted: You make 10-3 with a kicker of 5+5, Ben's kicker is
 * 5+4, and Ava re-rolls a kicker of 6+1 into 2+1 and takes the pencil.
 */

const YOU_DICE = [1, 3, 6, 5, 5]
const AVA_FIRST = [4, 4, 2, 6, 1]
const AVA_FINAL = [4, 4, 2, 2, 1]
const BEN_DICE = [2, 2, 6, 5, 4]
const HIDDEN = [null, null, null, null, null]
const CALL = { game: '10-3', variant: 'high' }

const SCENES = [
  {
    caption: 'Everyone rolls five dice and hides them.',
    detail: 'Highest single die (the piddle) took the Hammer: that’s you.',
    you: { dice: YOU_DICE, roll: 1 },
    ava: { dice: HIDDEN },
    ben: { dice: HIDDEN },
  },
  {
    caption: 'The Hammer calls a game.',
    detail: '1 + 3 + 6 makes 10 with three dice: “10-3 High!” The other two dice are your kicker: 5 + 5.',
    you: { dice: YOU_DICE, game: true, say: '10-3 High!' },
    ava: { dice: HIDDEN },
    ben: { dice: HIDDEN },
  },
  {
    caption: 'The next two players can refuse.',
    detail: 'Ava refuses. Ben accepts, so everyone plays 10-3 High.',
    you: { dice: YOU_DICE, game: true },
    ava: { dice: HIDDEN, badge: 'Refused' },
    ben: { dice: HIDDEN, badge: 'Accepted' },
  },
  {
    caption: 'Dice up: up to three rolls to make it.',
    detail: 'Everyone has 10-3. Now it’s about the kicker, and in High the biggest kicker is safest.',
    you: { dice: YOU_DICE, game: true },
    ava: { dice: AVA_FIRST, game: true, roll: 1 },
    ben: { dice: BEN_DICE, game: true, roll: 1 },
  },
  {
    caption: 'Ava re-rolls her kicker…',
    detail: 'The kicker is rolled as a whole. Her 6 + 1 comes back 2 + 1.',
    you: { dice: YOU_DICE, game: true },
    ava: { dice: AVA_FINAL, game: true, roll: 2 },
    ben: { dice: BEN_DICE, game: true },
  },
  {
    caption: 'Weakest hand takes a pencil.',
    detail: 'Three pencils and you’re out. Last player standing wins the pot.',
    you: { dice: YOU_DICE, game: true },
    ava: { dice: AVA_FINAL, game: true, pencil: true },
    ben: { dice: BEN_DICE, game: true },
  },
]

const SCENE_MS = 4200

function Player({ name, state, hammer }) {
  return (
    <div
      className={cn(
        'relative rounded-2xl bg-background/90 p-2.5 shadow-lg ring-1 ring-black/5 transition-colors sm:p-3 dark:bg-card/90',
        state.pencil && 'ring-2 ring-pop'
      )}
    >
      <div className="mb-1.5 flex items-center gap-2 text-sm">
        <span className="font-display font-bold">{name}</span>
        {hammer && <span className="rounded-full bg-secondary px-2 py-0.5 text-xs">🔨 Hammer</span>}
        {state.badge && (
          <span className="story-pop rounded-full border px-2 py-0.5 text-xs font-medium">{state.badge}</span>
        )}
        {state.pencil && (
          <span className="story-pencil ml-auto flex items-center gap-1 text-xs font-semibold text-pop">
            <Pencil aria-hidden className="h-4 w-4" /> Pencil
          </span>
        )}
      </div>
      <Hand
        dice={state.dice}
        game={state.game ? CALL.game : null}
        variant={CALL.variant}
        rollIds={state.dice.map(() => state.roll || 0)}
        dimension="3d"
        size="md"
      />
      {state.say && (
        <span className="story-pop absolute -top-4 right-3 rounded-2xl rounded-br-sm bg-pop px-3 py-1 font-display text-sm font-bold text-pop-foreground shadow-md">
          {state.say}
        </span>
      )}
    </div>
  )
}

export default function RoundStory({ className }) {
  const reduced = usePrefersReducedMotion()
  const [scene, setScene] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [hovered, setHovered] = useState(false)
  // Roll counters only ever go up: visiting a scene where someone rolls tumbles their dice
  const [rolls, setRolls] = useState({ you: 1, ava: 0, ben: 0 })
  const root = useRef(null)

  const go = (i) => {
    setScene(i)
    setRolls((r) => {
      const next = { ...r }
      Object.keys(next).forEach((p) => {
        if (SCENES[i][p].roll) next[p] += 1
      })
      return next
    })
  }

  useEffect(() => {
    if (reduced || !playing || hovered) return undefined
    const t = setTimeout(() => go((scene + 1) % SCENES.length), SCENE_MS)
    return () => clearTimeout(t)
  }, [scene, playing, hovered, reduced])

  const s = SCENES[scene]
  const bump = (p, id) => ({ ...p, roll: rolls[id] })
  const autoplay = playing && !reduced

  return (
    <figure
      ref={root}
      className={cn('w-full', className)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={(e) => !root.current?.contains(e.relatedTarget) && setHovered(false)}
      aria-roledescription="carousel"
      aria-label="How a round of Refusal goes"
    >
      {/* The table */}
      <div className="story-felt relative overflow-hidden rounded-[2rem] p-4 shadow-xl sm:p-6">
        <div className="relative grid gap-3 sm:gap-4">
          <Player name="You" state={bump(s.you, 'you')} hammer />
          <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
            <Player name="Ava" state={bump(s.ava, 'ava')} />
            <Player name="Ben" state={bump(s.ben, 'ben')} />
          </div>
        </div>
      </div>

      {/* The story */}
      <figcaption className="mt-4 min-h-[6.5rem]" aria-live={autoplay ? 'off' : 'polite'}>
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">
          Step {scene + 1} of {SCENES.length}
        </p>
        <p key={`c${scene}`} className="story-pop font-display text-xl font-bold sm:text-2xl">
          {s.caption}
        </p>
        <p key={`d${scene}`} className="story-fade mt-1 text-muted-foreground">
          {s.detail}
        </p>
      </figcaption>

      <div className="mt-2 flex items-center gap-3">
        <button
          type="button"
          onClick={() => (scene === SCENES.length - 1 && !autoplay ? go(0) : setPlaying((p) => !p))}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border bg-background hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={autoplay ? 'Pause the story' : 'Play the story'}
        >
          {autoplay ? (
            <Pause aria-hidden className="h-4 w-4" />
          ) : scene === SCENES.length - 1 ? (
            <RotateCcw aria-hidden className="h-4 w-4" />
          ) : (
            <Play aria-hidden className="h-4 w-4" />
          )}
        </button>
        <div className="flex gap-1.5" role="group" aria-label="Scenes">
          {SCENES.map((x, i) => (
            <button
              key={i}
              type="button"
              onClick={() => go(i)}
              aria-label={`Step ${i + 1}: ${x.caption}`}
              aria-current={i === scene ? 'step' : undefined}
              className="flex h-9 w-6 items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span
                className={cn(
                  'block h-2 rounded-full transition-all',
                  i === scene ? 'w-6 bg-primary' : 'w-2 bg-muted-foreground/30'
                )}
              />
            </button>
          ))}
        </div>
      </div>
    </figure>
  )
}
