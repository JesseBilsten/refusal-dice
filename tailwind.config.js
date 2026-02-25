/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/pages/**/*.{js,jsx,ts,tsx}",
    "./src/components/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--color-border))",
        input: "hsl(var(--color-input))",
        ring: "hsl(var(--color-ring))",
        background: "hsl(var(--color-background))",
        foreground: "hsl(var(--color-foreground))",
        primary: {
          DEFAULT: "hsl(var(--color-primary))",
          foreground: "hsl(var(--color-primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--color-secondary))",
          foreground: "hsl(var(--color-secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--color-destructive))",
          foreground: "hsl(var(--color-destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--color-muted))",
          foreground: "hsl(var(--color-muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--color-accent))",
          foreground: "hsl(var(--color-accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--color-popover))",
          foreground: "hsl(var(--color-popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--color-card))",
          foreground: "hsl(var(--color-card-foreground))",
        },
        legendary: {
          DEFAULT: "hsl(var(--color-legendary))",
          foreground: "hsl(var(--color-legendary-foreground))",
          border: "hsl(var(--color-legendary-border))",
        },
        epic: {
          DEFAULT: "hsl(var(--color-epic))",
          foreground: "hsl(var(--color-epic-foreground))",
          border: "hsl(var(--color-epic-border))",
        },
        rare: {
          DEFAULT: "hsl(var(--color-rare))",
          foreground: "hsl(var(--color-rare-foreground))",
          border: "hsl(var(--color-rare-border))",
        },
        uncommon: {
          DEFAULT: "hsl(var(--color-uncommon))",
          foreground: "hsl(var(--color-uncommon-foreground))",
          border: "hsl(var(--color-uncommon-border))",
        },
        common: {
          DEFAULT: "hsl(var(--color-common))",
          foreground: "hsl(var(--color-common-foreground))",
          border: "hsl(var(--color-common-border))",
        },
      },
      borderRadius: {
        lg: "var(--radius-lg)",
        md: "var(--radius-md)",
        sm: "var(--radius-sm)",
      },
    },
  },
}
