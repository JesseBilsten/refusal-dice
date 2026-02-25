import React, { useState, useCallback } from 'react'
import { Link } from 'gatsby'
import Layout from '../components/layout'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import Die from '../components/Die'
import {
  checkGame,
  generateHammerStrategy,
  gameOddsMap
} from '../lib/game-validation'

/**
 * HOMEPAGE 2: "The Analyzer"
 * 
 * UX Concept: The homepage IS the tool. A dice roller sits front-and-center.
 * Roll or type 5 dice, instantly see the top 2 best calls with strength indicators.
 * The page teaches by doing — users interact immediately.
 * 
 * UX Laws applied:
 * - Fitts's Law: Primary action (roll button) is large and central
 * - Immediate Feedback: Results appear instantly after rolling
 * - Recognition over Recall: Shows game names + emoji, not codes
 * - Aesthetic-Usability Effect: Clean, tool-like interface builds confidence
 */

const GAMES = [
  { id: '10-2', name: '10-2', emoji: '✌️' },
  { id: '10-3', name: '10-3', emoji: '👌' },
  { id: '10-4', name: '10-4', emoji: '🔫' },
  { id: 'ship-captain-crew', name: 'SCC', emoji: '⚓️' },
  { id: 'monterey', name: 'Monterey', emoji: '🔄' },
  { id: 'vegas', name: "7's", emoji: '🎰' },
  { id: 'pairs', name: 'Pairs', emoji: '🍐' },
  { id: 'razzle', name: 'Razzle', emoji: '✨' },
  { id: 'boss', name: 'Boss', emoji: '👑' },
  { id: 'tres-away', name: 'Tres Away', emoji: '⛳' },
]

const getGameEmoji = (gameId) => GAMES.find(g => g.id === gameId)?.emoji || ''
const getGameName = (gameId) => GAMES.find(g => g.id === gameId)?.name || gameId

const StrengthBar = ({ value, label }) => (
  <div className="flex items-center gap-2">
    <span className="text-xs text-muted-foreground w-20 shrink-0">{label}</span>
    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ${
          value >= 70 ? 'bg-green-500' : value >= 40 ? 'bg-yellow-500' : 'bg-red-500'
        }`}
        style={{ width: `${Math.max(value, 3)}%` }}
      />
    </div>
    <span className="text-xs font-mono text-muted-foreground w-10 text-right">{value.toFixed(0)}%</span>
  </div>
)

const Homepage2 = () => {
  const [dice, setDice] = useState([0, 0, 0, 0, 0]) // 0 = unset
  const [isRolling, setIsRolling] = useState(false)
  const [strategy, setStrategy] = useState(null)
  const [hasRolled, setHasRolled] = useState(false)

  const rollDice = useCallback(() => {
    setIsRolling(true)
    setStrategy(null)

    // Animate rapid changes
    const rollInterval = setInterval(() => {
      setDice(prev => prev.map(() => Math.ceil(Math.random() * 6)))
    }, 80)

    setTimeout(() => {
      clearInterval(rollInterval)
      const finalDice = Array.from({ length: 5 }, () => Math.ceil(Math.random() * 6))
      setDice(finalDice)
      setIsRolling(false)
      setHasRolled(true)

      // Calculate best calls
      const result = generateHammerStrategy(finalDice, 3, gameOddsMap)
      setStrategy(result)
    }, 600)
  }, [])

  const setDieValue = useCallback((index, value) => {
    const newDice = [...dice]
    newDice[index] = value
    setDice(newDice)

    // If all dice are set, auto-calculate
    if (newDice.every(d => d >= 1 && d <= 6)) {
      setHasRolled(true)
      const result = generateHammerStrategy(newDice, 3, gameOddsMap)
      setStrategy(result)
    }
  }, [dice])

  const cycleDie = useCallback((index) => {
    const current = dice[index]
    const next = current >= 6 ? 1 : current + 1
    setDieValue(index, next)
  }, [dice, setDieValue])

  const best = strategy?.bestCall
  const second = strategy?.secondBestCall

  return (
    <Layout>
      <section className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center px-4 py-8">
        {/* Title */}
        <div className="text-center mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">Refusal Dice</h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-md mx-auto">
            Roll 5 dice. See what to call. It's that simple.
          </p>
        </div>

        {/* Dice area */}
        <div className="flex items-center gap-3 sm:gap-4 mb-6">
          {dice.map((d, i) => (
            <button
              key={i}
              onClick={() => cycleDie(i)}
              className="focus:outline-none focus:ring-2 focus:ring-primary rounded-lg transition-transform hover:scale-110 active:scale-95"
              aria-label={`Die ${i + 1}, value ${d || 'not set'}. Click to change.`}
            >
              {d > 0 ? (
                <Die number={d} />
              ) : (
                <div className="w-[2rem] h-[2rem] rounded-md border-2 border-dashed border-muted-foreground/40 flex items-center justify-center text-muted-foreground text-xs">
                  ?
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Roll button */}
        <Button
          size="lg"
          onClick={rollDice}
          disabled={isRolling}
          className="mb-8 text-base px-8 py-3 h-auto"
        >
          {isRolling ? 'Rolling…' : hasRolled ? 'Roll Again' : '🎲 Roll Dice'}
        </Button>

        {/* Results */}
        {strategy && !isRolling && (
          <div className="w-full max-w-md space-y-4 animate-in fade-in duration-300">
            {/* Best call */}
            {best && (
              <div className="border border-primary/50 rounded-lg p-4 bg-primary/5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-primary text-primary-foreground">Best Call</Badge>
                    <span className="text-lg font-semibold">
                      {getGameEmoji(best.game)} {getGameName(best.game)} {best.variant ? (best.variant === 'high' ? 'High' : 'Low') : ''}
                    </span>
                  </div>
                </div>
                <StrengthBar value={best.offensiveStrength} label="Win chance" />
                {best.kicker && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Kickers: [{best.kicker.join(', ')}]
                  </p>
                )}
              </div>
            )}

            {/* Second best */}
            {second && (
              <div className="border border-border rounded-lg p-4 bg-muted/30">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">2nd Best</Badge>
                    <span className="text-base font-medium">
                      {getGameEmoji(second.game)} {getGameName(second.game)} {second.variant ? (second.variant === 'high' ? 'High' : 'Low') : ''}
                    </span>
                  </div>
                </div>
                <StrengthBar value={second.offensiveStrength} label="Win chance" />
              </div>
            )}

            {/* No games */}
            {!best && (
              <div className="text-center text-muted-foreground py-4">
                <p className="text-lg mb-1">Tough roll! 😬</p>
                <p className="text-sm">Consider <Link to="/glossary#bark" className="text-primary hover:underline">barking</Link> this one.</p>
              </div>
            )}

            {/* Deep link */}
            <div className="text-center pt-2">
              <Link
                to={`/strategy-assistant`}
                className="text-sm text-primary hover:underline"
              >
                Full strategy breakdown →
              </Link>
            </div>
          </div>
        )}

        {/* Pre-roll hint */}
        {!hasRolled && !isRolling && (
          <p className="text-xs text-muted-foreground text-center max-w-xs">
            Click each die to set manually, or hit Roll to randomize. We'll show you the best game to call.
          </p>
        )}

        {/* Bottom nav */}
        <div className="mt-auto pt-8 flex flex-wrap justify-center gap-3 text-sm">
          <Link to="/rules" className="text-muted-foreground hover:text-primary transition-colors">Rules</Link>
          <span className="text-border">·</span>
          <Link to="/games" className="text-muted-foreground hover:text-primary transition-colors">Games</Link>
          <span className="text-border">·</span>
          <Link to="/rolls" className="text-muted-foreground hover:text-primary transition-colors">Odds</Link>
          <span className="text-border">·</span>
          <Link to="/glossary" className="text-muted-foreground hover:text-primary transition-colors">Glossary</Link>
        </div>
      </section>
    </Layout>
  )
}

export default Homepage2
