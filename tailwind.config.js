/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,jsx,ts,tsx}',
    './src/components/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--color-border))',
        input: 'hsl(var(--color-input))',
        ring: 'hsl(var(--color-ring))',
        background: 'hsl(var(--color-background))',
        foreground: 'hsl(var(--color-foreground))',
        primary: {
          DEFAULT: 'hsl(var(--color-primary))',
          foreground: 'hsl(var(--color-primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--color-secondary))',
          foreground: 'hsl(var(--color-secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--color-destructive))',
          foreground: 'hsl(var(--color-destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--color-muted))',
          foreground: 'hsl(var(--color-muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--color-accent))',
          foreground: 'hsl(var(--color-accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--color-popover))',
          foreground: 'hsl(var(--color-popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--color-card))',
          foreground: 'hsl(var(--color-card-foreground))',
        },
        legendary: {
          DEFAULT: 'hsl(var(--color-legendary))',
          foreground: 'hsl(var(--color-legendary-foreground))',
          border: 'hsl(var(--color-legendary-border))',
        },
        epic: {
          DEFAULT: 'hsl(var(--color-epic))',
          foreground: 'hsl(var(--color-epic-foreground))',
          border: 'hsl(var(--color-epic-border))',
        },
        rare: {
          DEFAULT: 'hsl(var(--color-rare))',
          foreground: 'hsl(var(--color-rare-foreground))',
          border: 'hsl(var(--color-rare-border))',
        },
        uncommon: {
          DEFAULT: 'hsl(var(--color-uncommon))',
          foreground: 'hsl(var(--color-uncommon-foreground))',
          border: 'hsl(var(--color-uncommon-border))',
        },
        // <alpha-value> lets the odds pattern tint cells (bg-odds-lose/15)
        odds: {
          lose: 'hsl(var(--color-odds-lose) / <alpha-value>)',
          coin: 'hsl(var(--color-odds-coin) / <alpha-value>)',
          safe: 'hsl(var(--color-odds-safe) / <alpha-value>)',
        },
        // Brand: the felt of a bar-dice table, the dice, and a playful pop
        felt: {
          DEFAULT: 'hsl(var(--color-felt) / <alpha-value>)',
          foreground: 'hsl(var(--color-felt-foreground))',
        },
        dice: 'hsl(var(--color-dice) / <alpha-value>)',
        pop: {
          DEFAULT: 'hsl(var(--color-pop) / <alpha-value>)',
          foreground: 'hsl(var(--color-pop-foreground))',
        },
        common: {
          DEFAULT: 'hsl(var(--color-common))',
          foreground: 'hsl(var(--color-common-foreground))',
          border: 'hsl(var(--color-common-border))',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Bricolage Grotesque"', 'Inter', 'ui-sans-serif', 'sans-serif'],
      },
      borderRadius: {
        lg: 'var(--radius-lg)',
        md: 'var(--radius-md)',
        sm: 'var(--radius-sm)',
      },
    },
  },
}
