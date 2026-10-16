import { useEffect, useState } from 'react'

/**
 * The colour theme: 'light', 'dark' or 'system' (follow the device).
 * Stored in localStorage under 'theme' (wrapped, since it can be
 * unavailable); no stored value means 'system'. gatsby-ssr.js applies the
 * same rule before first paint, so the page doesn't flash.
 */

const KEY = 'theme'
const EVENT = 'refusal-dice:theme'
export const THEMES = ['light', 'dark', 'system']

const systemDark = () => window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false

export function readTheme() {
  if (typeof window === 'undefined') return 'system'
  try {
    const saved = window.localStorage.getItem(KEY)
    return THEMES.includes(saved) ? saved : 'system'
  } catch {
    return 'system'
  }
}

/** Put the dark class on <html> to match `theme` */
export function applyTheme(theme) {
  const dark = theme === 'dark' || (theme === 'system' && systemDark())
  document.documentElement.classList.toggle('dark', dark)
}

export function writeTheme(theme) {
  try {
    if (theme === 'system') window.localStorage.removeItem(KEY)
    else window.localStorage.setItem(KEY, theme)
  } catch {
    // Storage unavailable: the choice lasts for this page only
  }
  applyTheme(theme)
  window.dispatchEvent(new CustomEvent(EVENT, { detail: theme }))
}

/** [theme, setTheme]. Null until mounted, so the server render matches */
export function useTheme() {
  const [theme, setTheme] = useState(null)
  useEffect(() => {
    const saved = readTheme()
    setTheme(saved)
    // gatsby-ssr.js already did this before paint; again in case it didn't run
    applyTheme(saved)
    const onChange = (e) => setTheme(e.detail)
    window.addEventListener(EVENT, onChange)
    return () => window.removeEventListener(EVENT, onChange)
  }, [])
  // Following the device: change with it
  useEffect(() => {
    if (theme !== 'system') return
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)')
    if (!mq) return
    const onChange = () => applyTheme('system')
    mq.addEventListener?.('change', onChange)
    return () => mq.removeEventListener?.('change', onChange)
  }, [theme])
  return [theme, writeTheme]
}
