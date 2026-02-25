import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'gatsby'
import Layout from '../components/layout'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import Die from '../components/Die'
import {
  generateHammerStrategy,
  gameOddsMap
} from '../lib/game-validation'

/**
 * HOMEPAGE 4: "The Reveal"
 *
 * UX Concept: Split-screen layout. Left side: bold tagline, one-line game
 * explanation, and 3 CTA buttons. Right side: a die continuously auto-rolls
 * every few seconds, settling on a random value, then showing the best call
 * for that roll. Magazine-style, visual, enticing.
 *
 * UX Laws applied:
 * - Aesthetic-Usability Effect: Bold visual layout creates intrigue
 * - Doherty Threshold: Auto-rolling keeps engagement (<400ms response)
 * - Law of Proximity: Left = info, Right = visual demo — clear separation
 * - Zeigarnik Effect: Continuous rolling creates "what's next?" anticipation
 * - Peak-End Rule: Each reveal is a mini peak moment
 */

const GAMES_MAP = {
  '10-2': { name: '10-2', emoji: '✌️' },
  '10-3': { name: '10-3', emoji: '👌' },
  '10-4': { name: '10-4', emoji: '🔫' },
  'ship-captain-crew': { name: 'SCC', emoji: '⚓️' },
  'monterey': { name: 'Monterey', emoji: '🔄' },
  'vegas': { name: "7's", emoji: '🎰' },
  'pairs': { name: 'Pairs', emoji: '🍐' },
  'razzle': { name: 'Razzle', emoji: '✨' },
  'boss': { name: 'Boss', emoji: '👑' },
  'tres-away': { name: 'Tres Away', emoji: '⛳' },
}

const Homepage4 = () => {
  const [dice, setDice] = useState([3, 5, 2, 6, 1])
  const [isRolling, setIsRolling] = useState(false)
  const [bestCall, setBestCall] = useState(null)
  const [showResult, setShowResult] = useState(false)
  const [rollCount, setRollCount] = useState(0)

  const performRoll = useCallback(() => {
    setIsRolling(true)
    setShowResult(false)
    setBestCall(null)

    // Rapid animation
    const interval = setInterval(() => {
      setDice(Array.from({ length: 5 }, () => Math.ceil(Math.random() * 6)))
    }, 70)

    setTimeout(() => {
      clearInterval(interval)
      const finalDice = Array.from({ length: 5 }, () => Math.ceil(Math.random() * 6))
      setDice(finalDice)
      setIsRolling(false)
      setRollCount(c => c + 1)

      // Calculate best call
      const result = generateHammerStrategy(finalDice, 3, gameOddsMap)

      // Short delay then reveal result
      setTimeout(() => {
        if (result?.bestCall) {
          const g = GAMES_MAP[result.bestCall.game]
          setBestCall({
            name: g?.name || result.bestCall.game,
            emoji: g?.emoji || '🎲',
            variant: result.bestCall.variant,
            strength: result.bestCall.offensiveStrength,
          })
        }
        setShowResult(true)
      }, 400)
    }, 700)
  }, [])

  // Auto-roll loop
  useEffect(() => {
    // Initial roll on mount
    const initialTimer = setTimeout(performRoll, 800)
    return () => clearTimeout(initialTimer)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!showResult) return
    const timer = setTimeout(performRoll, 3500)
    return () => clearTimeout(timer)
  }, [showResult, performRoll])

  return (
    <Layout>
      <section className="min-h-[calc(100vh-64px)] flex flex-col">
        <div className="flex-1 flex flex-col sm:flex-row">
          {/* Left panel — info */}
          <div className="flex-1 flex flex-col justify-center px-6 sm:px-10 lg:px-16 py-10 sm:py-0">
            <p className="text-sm font-medium text-primary mb-3 tracking-wide uppercase">A social dice game for 2–8 players</p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-4">
              Roll. Call.<br />
              <span className="text-primary">Refuse.</span>
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg max-w-md mb-8 leading-relaxed">
              Five dice, ten games, one loser per round. Call a game and dare the table to play — 
              or refuse and force someone else's hand.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <Link to="/rules">
                <Button size="lg" className="w-full sm:w-auto">
                  Learn to Play
                </Button>
              </Link>
              <Link to="/strategy-assistant">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Strategy Tool
                </Button>
              </Link>
            </div>

            <div className="flex gap-4 text-sm text-muted-foreground">
              <Link to="/games" className="hover:text-primary transition-colors">10 Games →</Link>
              <Link to="/rolls" className="hover:text-primary transition-colors">Odds →</Link>
              <Link to="/glossary" className="hover:text-primary transition-colors">Glossary →</Link>
            </div>
          </div>

          {/* Right panel — auto-rolling dice */}
          <div className="flex-1 flex flex-col items-center justify-center bg-muted/30 border-t sm:border-t-0 sm:border-l border-border px-6 py-10 sm:py-0 relative overflow-hidden">
            {/* Subtle background pattern */}
            <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }} />

            {/* Dice display */}
            <div className="relative z-10 flex flex-col items-center">
              <div className="flex gap-3 sm:gap-4 mb-6">
                {dice.map((d, i) => (
                  <div
                    key={i}
                    className={`transition-transform duration-200 ${isRolling ? 'animate-bounce' : ''}`}
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <Die number={d} />
                  </div>
                ))}
              </div>

              {/* Result */}
              <div className="h-20 flex items-center justify-center">
                {showResult && bestCall && (
                  <div className="text-center animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <p className="text-xs text-muted-foreground mb-1.5 uppercase tracking-wide">Best call</p>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{bestCall.emoji}</span>
                      <span className="text-xl font-bold text-foreground">
                        {bestCall.name}{bestCall.variant ? ` ${bestCall.variant === 'high' ? 'High' : 'Low'}` : ''}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-2 justify-center">
                      <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            bestCall.strength >= 70 ? 'bg-green-500' : bestCall.strength >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.max(bestCall.strength, 5)}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground font-mono">{bestCall.strength.toFixed(0)}%</span>
                    </div>
                  </div>
                )}
                {showResult && !bestCall && (
                  <div className="text-center animate-in fade-in duration-300">
                    <p className="text-sm text-muted-foreground">Bark it! 🐕</p>
                  </div>
                )}
              </div>

              {/* Roll counter */}
              <p className="text-xs text-muted-foreground/50 mt-4">
                Roll #{rollCount}
              </p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  )
}

export default Homepage4
