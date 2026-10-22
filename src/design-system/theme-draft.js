import { useCallback, useEffect, useState } from 'react'

/**
 * The theme playground (/design/theming): try new token values live, without
 * a rebuild. A draft is a set of CSS custom properties written inline on
 * <html>, so it beats the values in global.css; light and dark keep their own
 * colors, while fonts, radius and type sizes are shared. It lives in this
 * browser only (localStorage), shows on the design system pages, and on the
 * whole site only when `siteWide` is on. Copy CSS turns it into the change to
 * make in src/styles/global.css.
 */

const KEY = 'rd-theme-draft'
const EVENT = 'refusal-dice:theme-draft'

/** The tokens the playground edits. `mode`: colors differ in light and dark */
export const DRAFT_TOKENS = [
  {
    name: '--color-primary',
    label: 'Primary',
    group: 'Color',
    type: 'color',
    mode: true,
    hint: 'Links, actions, the dice that make a game',
  },
  {
    name: '--color-primary-foreground',
    label: 'On primary',
    group: 'Color',
    type: 'color',
    mode: true,
  },
  {
    name: '--color-background',
    label: 'Background',
    group: 'Color',
    type: 'color',
    mode: true,
  },
  {
    name: '--color-foreground',
    label: 'Text',
    group: 'Color',
    type: 'color',
    mode: true,
  },
  {
    name: '--color-card',
    label: 'Card',
    group: 'Color',
    type: 'color',
    mode: true,
  },
  {
    name: '--color-muted',
    label: 'Muted',
    group: 'Color',
    type: 'color',
    mode: true,
  },
  {
    name: '--color-muted-foreground',
    label: 'Muted text',
    group: 'Color',
    type: 'color',
    mode: true,
  },
  {
    name: '--color-border',
    label: 'Border',
    group: 'Color',
    type: 'color',
    mode: true,
  },
  {
    name: '--color-felt',
    label: 'Felt',
    group: 'Brand',
    type: 'color',
    mode: true,
    hint: 'The table',
  },
  {
    name: '--color-felt-foreground',
    label: 'Text on felt',
    group: 'Brand',
    type: 'color',
    mode: true,
  },
  {
    name: '--color-pop',
    label: 'Pop',
    group: 'Brand',
    type: 'color',
    mode: true,
    hint: 'Pencils, the Hammer’s call, the headline',
  },
  {
    name: '--color-dice',
    label: 'Dice',
    group: 'Brand',
    type: 'color',
    mode: true,
  },
  {
    name: '--color-odds-safe',
    label: 'Odds: safe',
    group: 'Odds',
    type: 'color',
    mode: true,
  },
  {
    name: '--color-odds-coin',
    label: 'Odds: either way',
    group: 'Odds',
    type: 'color',
    mode: true,
  },
  {
    name: '--color-odds-lose',
    label: 'Odds: lose',
    group: 'Odds',
    type: 'color',
    mode: true,
  },
  { name: '--font-sans', label: 'Text font', group: 'Type', type: 'font' },
  {
    name: '--font-display',
    label: 'Heading font',
    group: 'Type',
    type: 'font',
  },
  {
    name: '--fs-display',
    label: 'Display',
    group: 'Type',
    type: 'size',
    hint: 'The home headline',
  },
  {
    name: '--fs-title',
    label: 'Title',
    group: 'Type',
    type: 'size',
    hint: 'Each page’s h1',
  },
  {
    name: '--fs-section',
    label: 'Section',
    group: 'Type',
    type: 'size',
    hint: 'Headings between panels',
  },
  {
    name: '--fs-heading',
    label: 'Heading',
    group: 'Type',
    type: 'size',
    hint: 'Panel titles',
  },
  { name: '--fs-subheading', label: 'Subheading', group: 'Type', type: 'size' },
  {
    name: '--radius-lg',
    label: 'Corner radius',
    group: 'Shape',
    type: 'radius',
  },
]

/** Fonts the playground can load from Google Fonts (the CSS stack for each) */
export const FONTS = {
  Inter: "'Inter', ui-sans-serif, system-ui, sans-serif",
  'Bricolage Grotesque':
    "'Bricolage Grotesque', 'Inter', ui-sans-serif, sans-serif",
  'DM Sans': "'DM Sans', ui-sans-serif, system-ui, sans-serif",
  'Space Grotesk': "'Space Grotesk', ui-sans-serif, system-ui, sans-serif",
  Fraunces: "'Fraunces', ui-serif, Georgia, serif",
  'Source Serif 4': "'Source Serif 4', ui-serif, Georgia, serif",
  'System UI': 'ui-sans-serif, system-ui, -apple-system, sans-serif',
}

/** A modular scale for the heading roles, from a body size of 16px */
export function typeScale(ratio) {
  const px = (n) => `${Math.round(16 * ratio ** n * 10) / 160}rem`
  return {
    '--fs-subheading': px(1),
    '--fs-heading': px(2),
    '--fs-section': px(3),
    '--fs-title': px(4),
    '--fs-display': px(6),
  }
}

/** A few themes to try. Values are "H S% L%", as in global.css */
export const PRESETS = [
  {
    id: 'default',
    label: 'Site default',
    draft: { light: {}, dark: {}, shared: {} },
  },
  {
    id: 'casino',
    label: 'Casino night',
    draft: {
      light: {
        '--color-primary': '350 70% 40%',
        '--color-pop': '42 90% 50%',
        '--color-felt': '350 45% 22%',
        '--color-background': '40 40% 97%',
      },
      dark: {
        '--color-primary': '350 75% 62%',
        '--color-pop': '42 92% 58%',
        '--color-felt': '350 40% 18%',
        '--color-background': '350 20% 7%',
        '--color-card': '350 16% 10%',
      },
      shared: { '--font-display': FONTS.Fraunces, '--radius-lg': '0.25rem' },
    },
  },
  {
    id: 'clubhouse',
    label: 'Country club',
    draft: {
      light: {
        '--color-primary': '158 60% 28%',
        '--color-pop': '24 85% 52%',
        '--color-background': '60 20% 97%',
        '--color-muted': '80 15% 92%',
      },
      dark: {
        '--color-primary': '158 50% 52%',
        '--color-pop': '24 90% 60%',
        '--color-background': '160 25% 7%',
        '--color-card': '160 20% 10%',
      },
      shared: {
        '--font-sans': FONTS['DM Sans'],
        '--font-display': FONTS['Source Serif 4'],
        '--radius-lg': '0.75rem',
      },
    },
  },
  {
    id: 'contrast',
    label: 'High contrast',
    draft: {
      light: {
        '--color-foreground': '0 0% 0%',
        '--color-muted-foreground': '0 0% 25%',
        '--color-border': '0 0% 55%',
        '--color-primary': '221 90% 38%',
      },
      dark: {
        '--color-foreground': '0 0% 100%',
        '--color-muted-foreground': '0 0% 82%',
        '--color-border': '0 0% 50%',
        '--color-background': '0 0% 0%',
        '--color-card': '0 0% 6%',
      },
      shared: {},
    },
  },
  {
    id: 'bold-type',
    label: 'Bigger headings (scale 1.333)',
    draft: { light: {}, dark: {}, shared: typeScale(1.333) },
  },
]

const EMPTY = { light: {}, dark: {}, shared: {}, siteWide: false }

export function readDraft() {
  if (typeof window === 'undefined') return EMPTY
  try {
    const d = JSON.parse(window.localStorage.getItem(KEY))
    return d && typeof d === 'object' ? { ...EMPTY, ...d } : EMPTY
  } catch {
    return EMPTY
  }
}

function writeDraft(draft) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(draft))
  } catch {
    // Storage unavailable: the draft lasts for this page only
  }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: draft }))
}

export const isEmptyDraft = (d) =>
  !Object.keys(d.light).length &&
  !Object.keys(d.dark).length &&
  !Object.keys(d.shared).length

const isDark = () => document.documentElement.classList.contains('dark')

/** The draft's values for the mode showing now */
export const activeValues = (draft, dark) => ({
  ...draft.shared,
  ...(dark ? draft.dark : draft.light),
})

let applied = []
let fontLink = null

/** Write the draft onto <html> (or clear it with `null`), and load any font it names */
export function applyDraft(draft) {
  const root = document.documentElement
  applied.forEach((name) => root.style.removeProperty(name))
  applied = []
  if (!draft) return
  const values = activeValues(draft, isDark())
  Object.entries(values).forEach(([name, value]) => {
    root.style.setProperty(name, value)
    applied.push(name)
  })
  // Load the fonts the draft names from Google Fonts
  const families = Object.keys(FONTS).filter(
    (f) =>
      f !== 'System UI' &&
      Object.values(values).some(
        (v) => typeof v === 'string' && v.startsWith(`'${f}'`)
      )
  )
  if (families.length) {
    const href = `https://fonts.googleapis.com/css2?${families.map((f) => `family=${f.replace(/ /g, '+')}:wght@400..800`).join('&')}&display=swap`
    if (!fontLink) {
      fontLink = document.createElement('link')
      fontLink.rel = 'stylesheet'
      document.head.appendChild(fontLink)
    }
    if (fontLink.href !== href) fontLink.href = href
  }
}

/**
 * The draft, applied while the component using it is mounted (`apply`), or
 * only when it's switched on for the whole site (Layout). Re-applies when
 * light and dark switch.
 */
export function useThemeDraft({ apply = true } = {}) {
  const [draft, setDraftState] = useState(EMPTY)
  useEffect(() => {
    setDraftState(readDraft())
    const onChange = (e) => setDraftState(e.detail)
    window.addEventListener(EVENT, onChange)
    return () => window.removeEventListener(EVENT, onChange)
  }, [])
  const live = apply || draft.siteWide
  useEffect(() => {
    if (!live) return undefined
    applyDraft(draft)
    const observer = new MutationObserver(() => applyDraft(draft))
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })
    return () => {
      observer.disconnect()
      applyDraft(null)
    }
  }, [draft, live])
  const setDraft = useCallback((next) => {
    const value = typeof next === 'function' ? next(readDraft()) : next
    writeDraft(value)
  }, [])
  return [draft, setDraft]
}

/** Set one token in the draft: colors for the mode showing now, everything else shared */
export function withToken(draft, token, value) {
  const bucket = token.mode ? (isDark() ? 'dark' : 'light') : 'shared'
  const next = { ...draft[bucket] }
  if (value == null) delete next[token.name]
  else next[token.name] = value
  return { ...draft, [bucket]: next }
}

/** The draft as the edit to make in src/styles/global.css */
export function draftCss(draft) {
  const block = (selector, values) => {
    const lines = Object.entries(values).map(([k, v]) => `  ${k}: ${v};`)
    return lines.length ? `${selector} {\n${lines.join('\n')}\n}\n` : ''
  }
  return (
    [
      block(':root', { ...draft.shared, ...draft.light }),
      block('.dark', draft.dark),
    ]
      .filter(Boolean)
      .join('\n') || '/* No changes: the draft matches the site */\n'
  )
}

/* ── Color math: "H S% L%" ↔ #rrggbb, and WCAG contrast ── */

export function hslToHex(hsl) {
  const [h, s, l] = hsl.replace(/%/g, '').split(/\s+/).map(Number)
  const a = (s / 100) * Math.min(l / 100, 1 - l / 100)
  const f = (n) => {
    const k = (n + h / 30) % 12
    const c = l / 100 - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))
    return Math.round(c * 255)
      .toString(16)
      .padStart(2, '0')
  }
  return `#${f(0)}${f(8)}${f(4)}`
}

export function hexToHsl(hex) {
  const [r, g, b] = [1, 3, 5].map(
    (i) => parseInt(hex.slice(i, i + 2), 16) / 255
  )
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  let h = 0
  let s = 0
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    h =
      max === r
        ? (g - b) / d + (g < b ? 6 : 0)
        : max === g
          ? (b - r) / d + 2
          : (r - g) / d + 4
    h *= 60
  }
  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
}

const luminance = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** WCAG 2 contrast ratio between two "H S% L%" colors */
export function contrast(a, b) {
  const [x, y] = [luminance(hslToHex(a)), luminance(hslToHex(b))].sort(
    (p, q) => q - p
  )
  return (x + 0.05) / (y + 0.05)
}

/** A token's value as the page has it now (the draft, or global.css) */
export const currentValue = (name) =>
  typeof window === 'undefined'
    ? ''
    : getComputedStyle(document.documentElement).getPropertyValue(name).trim()
