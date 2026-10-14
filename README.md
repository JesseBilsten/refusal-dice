# Refusal Dice

A site for learning **Refusal**, a bar dice game, and for getting better at it. New players can pick up the rules quickly. Experienced players can study the exact odds behind every call, bark and refusal.

- **Rules & Games:** how a round works, plus all 10 games (10-2, 10-3, 10-4, Ship Captain Crew, Monterey, 7's, Pairs, Razzle, Boss, Tres Away) and barking.
- **Odds:** the chance of rolling each game on a single throw of 5 dice.
- **Odds Lab:** describe any roll (specific dice, runs, of-a-kinds, sums, per-die limits, counts) and see exactly how often it happens, with every possible outcome shown.
- **Strategy Assistant:** enter your roll and seat; get call and accept/refuse recommendations.

Planned: play against the computer, and online turn-based games that email you when it's your turn. See **[ROADMAP.md](ROADMAP.md)**.

## Development

Requires Node (see `.nvmrc`) and npm.

```bash
npm ci            # install dependencies
npm run develop   # http://localhost:8000
npm test          # Jest
npm run build     # production build into /public
```

Built with Gatsby 5, React 18, Tailwind CSS and shadcn/ui.

Conventions for code, data, testing and git are in **[CLAUDE.md](CLAUDE.md)**.

## License

MIT
