import { useEffect, useState } from 'react'

/**
 * Per-browser dice preferences. Both start off: flat dice, no sound.
 * `pace` is how fast the bots play in Play ('slow' | 'normal' | 'fast').
 * Stored in localStorage (wrapped, since it can be unavailable) and synced
 * between components on the page with a window event.
 */

const KEY = 'refusal-dice:dice-prefs'
const EVENT = 'refusal-dice:dice-prefs'

export const DEFAULT_DICE_PREFS = { dice3d: false, sound: false, pace: 'normal' }

export function readDicePrefs() {
  if (typeof window === 'undefined') return DEFAULT_DICE_PREFS
  try {
    return {
      ...DEFAULT_DICE_PREFS,
      ...JSON.parse(window.localStorage.getItem(KEY) || '{}'),
    }
  } catch {
    return DEFAULT_DICE_PREFS
  }
}

export function writeDicePrefs(prefs) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(prefs))
  } catch {
    // Storage unavailable: the choice lasts for this page only
  }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: prefs }))
}

/** [prefs, update(partial)] */
export function useDicePrefs() {
  const [prefs, setPrefs] = useState(DEFAULT_DICE_PREFS)
  useEffect(() => {
    setPrefs(readDicePrefs())
    const onChange = (e) => setPrefs(e.detail)
    window.addEventListener(EVENT, onChange)
    return () => window.removeEventListener(EVENT, onChange)
  }, [])
  const update = (partial) => writeDicePrefs({ ...readDicePrefs(), ...partial })
  return [prefs, update]
}

/** True when the visitor asked for less motion */
export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    if (!mq) return
    setReduced(mq.matches)
    const onChange = () => setReduced(mq.matches)
    mq.addEventListener?.('change', onChange)
    return () => mq.removeEventListener?.('change', onChange)
  }, [])
  return reduced
}
