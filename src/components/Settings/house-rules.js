import { useEffect, useState } from 'react'

/**
 * The house rules your table plays (docs/RULES.md §5), per browser. Every
 * odds figure that depends on them reads this hook, so changing a rule
 * recalculates them. Stored in localStorage (wrapped, since it can be
 * unavailable) and synced between components with a window event.
 */

const KEY = 'refusal-dice:house-rules'
const EVENT = 'refusal-dice:house-rules'

export const DEFAULT_TABLE_RULES = { montereyLoneKeep: false }

export function readHouseRules() {
  if (typeof window === 'undefined') return DEFAULT_TABLE_RULES
  try {
    const saved = JSON.parse(window.localStorage.getItem(KEY) || '{}')
    return { montereyLoneKeep: saved.montereyLoneKeep === true }
  } catch {
    return DEFAULT_TABLE_RULES
  }
}

export function writeHouseRules(rules) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(rules))
  } catch {
    // Storage unavailable: the choice lasts for this page only
  }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: rules }))
}

/** [rules, update(partial)]. The defaults until mounted, so the server render matches */
export function useHouseRules() {
  const [rules, setRules] = useState(DEFAULT_TABLE_RULES)
  useEffect(() => {
    setRules(readHouseRules())
    const onChange = (e) => setRules(e.detail)
    window.addEventListener(EVENT, onChange)
    return () => window.removeEventListener(EVENT, onChange)
  }, [])
  const update = (partial) => writeHouseRules({ ...readHouseRules(), ...partial })
  return [rules, update]
}
