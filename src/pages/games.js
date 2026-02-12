import React, { useState, useEffect, useRef, useMemo } from 'react'
import Layout from '../components/layout'
import Die from '../components/Die'
import Game from '../components/Game'
import { Input } from '../components/ui/input'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { analyzeRoll } from '../lib/game-validation'
import rollGameMatrix from '../data/roll-game-matrix.json'

// Calculate single-roll probability for each game
const calculateGameProbabilities = () => {
  const probabilities = {}
  const games = ['10-2', '10-3', '10-4', 'ship-captain-crew', 'monterey', 'vegas', 'pairs', 'razzle', 'boss', 'tres-away']
  
  games.forEach((gameId) => {
    let totalCount = 0
    Object.values(rollGameMatrix).forEach(rollData => {
      if (rollData.games && rollData.games.includes(gameId)) {
        totalCount += rollData.count || 0
      }
    })
    probabilities[gameId] = ((totalCount / 7776) * 100).toFixed(1)
  })
  
  return probabilities
}

const GamesPage = () => {
  const [diceValues, setDiceValues] = useState(['', '', '', '', ''])
  const [analyzedRoll, setAnalyzedRoll] = useState(null)
  const diceInputRefs = [useRef(), useRef(), useRef(), useRef(), useRef()]
  const gameProbabilities = useMemo(() => calculateGameProbabilities(), [])
  
  // Read roll from URL on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const rollParam = params.get('roll')
      if (rollParam && rollParam.length === 5) {
        const values = rollParam.split('')
        setDiceValues(values)
        analyzeCurrentRoll(values)
      }
    }
  }, [])
  
  const analyzeCurrentRoll = (values) => {
    const roll = values.map(v => parseInt(v)).filter(v => v >= 1 && v <= 6)
    if (roll.length === 5) {
      const analysis = analyzeRoll(roll)
      setAnalyzedRoll(analysis)
      
      // Update URL
      if (typeof window !== 'undefined') {
        const newUrl = `/games?roll=${values.join('')}`
        window.history.replaceState({}, '', newUrl)
      }
    } else {
      setAnalyzedRoll(null)
    }
  }
  
  const handleDieChange = (index, value) => {
    const newValues = [...diceValues]
    
    // Only allow 1-6 or empty
    if (value === '' || (value >= '1' && value <= '6' && value.length === 1)) {
      newValues[index] = value
      setDiceValues(newValues)
      
      // Auto-focus next input if value entered
      if (value !== '' && index < 4) {
        diceInputRefs[index + 1].current?.focus()
      }
      
      analyzeCurrentRoll(newValues)
    }
  }
  
  const handleRollRandom = () => {
    const randomRoll = Array.from({ length: 5 }, () => String(Math.floor(Math.random() * 6) + 1))
    setDiceValues(randomRoll)
    analyzeCurrentRoll(randomRoll)
  }
  
  const handleClear = () => {
    setDiceValues(['', '', '', '', ''])
    setAnalyzedRoll(null)
    
    // Clear URL
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', '/games')
    }
    
    diceInputRefs[0].current?.focus()
  }
  
  // Check if a specific game is playable
  const isGamePlayable = (gameId) => {
    if (!analyzedRoll || !analyzedRoll.variants) return null
    return analyzedRoll.variants.find(v => v.game === gameId)
  }
  
  const getGameInfo = (gameId) => {
    const variant = isGamePlayable(gameId)
    return {
      isPlayable: !!variant,
      variant: variant,
      shouldDim: analyzedRoll && !variant
    }
  }

  return (

  <Layout>
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="my-8 text-center">
        <h1 className="text-4xl font-bold text-foreground">Games</h1>
        <p className="text-lg text-muted-foreground">A list of the games you can call in Refusal Dice</p>
      </div>
      
      {/* Dice Roll Lookup Widget */}
      <div className="mb-8 p-6 rounded-lg bg-primary/5 border-2 border-primary/20">
        <h2 className="text-2xl font-semibold mb-4 text-center">What Should I Call?</h2>
        <p className="text-center text-muted-foreground mb-4">Enter your roll to see which games you can play</p>
        
        <div className="flex flex-col items-center gap-4">
          {/* Dice Inputs */}
          <div className="flex gap-2 sm:gap-3">
            {diceValues.map((value, index) => (
              <Input
                key={index}
                ref={diceInputRefs[index]}
                type="text"
                inputMode="numeric"
                pattern="[1-6]"
                maxLength={1}
                value={value}
                onChange={(e) => handleDieChange(index, e.target.value)}
                className="w-14 h-14 sm:w-16 sm:h-16 text-3xl sm:text-4xl text-center font-bold rounded-lg border-2 p-0"
                placeholder="?"
              />
            ))}
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button onClick={handleRollRandom} variant="default">
              🎲 Roll Random
            </Button>
            <Button onClick={handleClear} variant="outline">
              Clear
            </Button>
          </div>
          
          {/* Analysis Result */}
          {analyzedRoll && analyzedRoll.variants && analyzedRoll.variants.length > 0 && (
            <div className="mt-2 text-center">
              <p className="text-sm text-muted-foreground">
                <strong>{analyzedRoll.flexibility}</strong> playable game{analyzedRoll.flexibility !== 1 ? 's' : ''}
              </p>
              <p className="text-sm mt-1">
                <span className="text-muted-foreground">Best call:</span>{' '}
                <strong className="text-foreground">{analyzedRoll.bestCall?.game}{analyzedRoll.bestCall?.variant ? ` (${analyzedRoll.bestCall.variant})` : ''}</strong>
                {analyzedRoll.bestCall?.rawStrength != null && (
                  <span className="text-muted-foreground"> · Strength: <strong className="text-foreground">{Math.round(analyzedRoll.bestCall.rawStrength)}</strong></span>
                )}
              </p>
              {analyzedRoll.secondBestCall && (
                <p className="text-sm mt-1">
                  <span className="text-muted-foreground">2nd best:</span>{' '}
                  <strong className="text-foreground">{analyzedRoll.secondBestCall.game}{analyzedRoll.secondBestCall.variant ? ` (${analyzedRoll.secondBestCall.variant})` : ''}</strong>
                  {analyzedRoll.secondBestCall.rawStrength != null && (
                    <span className="text-muted-foreground"> · Strength: <strong className="text-foreground">{Math.round(analyzedRoll.secondBestCall.rawStrength)}</strong></span>
                  )}
                </p>
              )}
            </div>
          )}
          
          {analyzedRoll && (!analyzedRoll.variants || analyzedRoll.variants.length === 0) && (
            <div className="mt-2 text-center">
              <Badge variant="warning">Consider barking - no valid games!</Badge>
            </div>
          )}
        </div>
      </div>
      
      <hr className="my-8 border-border" />
      <div className={`pb-8 px-6 py-6 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-6 ${getGameInfo('10-2').isPlayable ? 'bg-primary/10 border-2 border-primary/30' : 'bg-muted/20'} ${getGameInfo('10-2').shouldDim ? 'opacity-40' : ''}`}>
        <div>
          <h2 id="10-2" className="text-3xl font-semibold mb-3 text-foreground">
            ✌️ 10-2 <small className="text-muted-foreground text-base">high or low</small>
          </h2>
          <div className="mb-3">
            <Badge variant="secondary">{gameProbabilities['10-2']}% single-roll</Badge>
            {getGameInfo('10-2').isPlayable && (
              <Badge variant="default" className="ml-2">
                Playable ({getGameInfo('10-2').variant.variant})
                {getGameInfo('10-2').variant.rawStrength != null && ` · ${Math.round(getGameInfo('10-2').variant.rawStrength)}`}
              </Badge>
            )}
          </div>
          <p>
            2 dice add up to 10 and the remaining 3 dice are either high or low.
          </p>
          <div className="mt-3 flex gap-2">
            <Button variant="outline" size="sm" onClick={() => typeof window !== 'undefined' && (window.location.href = '/games/10-2')}>
              Learn more →
            </Button>
            <Button variant="ghost" size="sm" onClick={() => typeof window !== 'undefined' && (window.location.href = '/rolls?game=10-2&view=table')}>
              Explore rolls →
            </Button>
          </div>
        </div>
        <div className="">
          <div className="flex justify-end gap-2 mb-2">
            <Game type="10-2" className="mr-1">
              <Die number="4" />
              <Die number="6" />
            </Game>
            <Game type="low">
              <Die number="1" />
              <Die number="1" />
              <Die number="1" />
            </Game>
          </div>
          <div className="flex justify-end gap-2 mb-2">
            <Game type="10-2" className="mr-1">
              <Die number="5" />
              <Die number="5" />
            </Game>
            <Game type="high">
              <Die number="6" />
              <Die number="6" />
              <Die number="6" />
            </Game>
          </div>
        </div>
      </div>
      <hr className="my-8 border-border" />
      <div className={`pb-8 px-6 py-6 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-6 ${getGameInfo('10-3').isPlayable ? 'bg-primary/10 border-2 border-primary/30' : 'bg-muted/20'} ${getGameInfo('10-3').shouldDim ? 'opacity-40' : ''}`}>
        <div className="">
          <h2 id="10-3" className="text-3xl font-semibold mb-3 text-foreground">
            👌 10-3  <small className="text-muted-foreground">high or low</small>
          </h2>
          <div className="mb-3">
            <Badge variant="secondary">{gameProbabilities['10-3']}% single-roll</Badge>
            {getGameInfo('10-3').isPlayable && (
              <Badge variant="default" className="ml-2">
                Playable ({getGameInfo('10-3').variant.variant})
                {getGameInfo('10-3').variant.rawStrength != null && ` · ${Math.round(getGameInfo('10-3').variant.rawStrength)}`}
              </Badge>
            )}
          </div>
          <p>
            3 dice add up to 10 and the remaining 2 dice are either high or low.
          </p>
          <p>AKA "Frankie"</p>
          <div className="mt-3 flex gap-2">
            <Button variant="outline" size="sm" onClick={() => typeof window !== 'undefined' && (window.location.href = '/games/10-3')}>
              Learn more →
            </Button>
            <Button variant="ghost" size="sm" onClick={() => typeof window !== 'undefined' && (window.location.href = '/rolls?game=10-3&view=table')}>
              Explore rolls →
            </Button>
          </div>
        </div>
        <div className="">
          <div className="flex justify-end gap-2 mb-2">
            <Game type="10-3" className="mr-1">
              <Die number="1" />
              <Die number="3" />
              <Die number="6" />
            </Game>
            <Game type="low">
              <Die number="1" />
              <Die number="1" />
            </Game>
          </div>
          <div className="flex justify-end gap-2 mb-2">
            <Game type="10-3" className="mr-1">
              <Die number="2" />
              <Die number="3" />
              <Die number="5" />
            </Game>
            <Game type="high">
              <Die number="6" />
              <Die number="6" />
            </Game>
          </div>
        </div>
      </div>
      <hr className="my-8 border-border" />
      <div className={`pb-8 px-6 py-6 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-6 ${getGameInfo('10-4').isPlayable ? 'bg-primary/10 border-2 border-primary/30' : 'bg-muted/20'} ${getGameInfo('10-4').shouldDim ? 'opacity-40' : ''}`}>
        <div className="">
          <h2 id="10-4" className="text-3xl font-semibold mb-3 text-foreground">
            🔫 10-4 <small className="text-muted-foreground">high or low</small>
          </h2>
          <div className="mb-3">
            <Badge variant="secondary">{gameProbabilities['10-4']}% single-roll</Badge>
            {getGameInfo('10-4').isPlayable && (
              <Badge variant="default" className="ml-2">
                Playable ({getGameInfo('10-4').variant.variant})
                {getGameInfo('10-4').variant.rawStrength != null && ` · ${Math.round(getGameInfo('10-4').variant.rawStrength)}`}
              </Badge>
            )}
          </div>
          <p>
            4 dice add up to 10 and the remaining die is either high or low.
          </p>
          <p>AKA "Shotgun"</p>
          <div className="mt-3 flex gap-2">
            <Button variant="outline" size="sm" onClick={() => typeof window !== 'undefined' && (window.location.href = '/games/10-4')}>
              Learn more →
            </Button>
            <Button variant="ghost" size="sm" onClick={() => typeof window !== 'undefined' && (window.location.href = '/rolls?game=10-4&view=table')}>
              Explore rolls →
            </Button>
          </div>
        </div>
        <div className="">
          <div className="flex justify-end gap-2 mb-2">
            <Game type="10-4" className="mr-1">
              <Die number="1" />
              <Die number="2" />
              <Die number="6" />
              <Die number="1" />
            </Game>
            <Game type="low">
              <Die number="1" />
            </Game>
          </div>
          <div className="flex justify-end gap-2 mb-2">
            <Game type="10-4" className="mr-1">
              <Die number="1" />
              <Die number="2" />
              <Die number="3" />
              <Die number="4" />
            </Game>
            <Game type="high">
              <Die number="6" />
            </Game>
          </div>
        </div>
      </div>
      <hr className="my-8 border-border" />
      <div className={`pb-8 px-6 py-6 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-6 ${getGameInfo('ship-captain-crew').isPlayable ? 'bg-primary/10 border-2 border-primary/30' : 'bg-muted/20'} ${getGameInfo('ship-captain-crew').shouldDim ? 'opacity-40' : ''}`}>
        <div className="">
          <h2 id="ship-captain-crew" className="text-3xl font-semibold mb-3 text-foreground">
            ⚓️ Ship, Captain, Crew <small className="text-muted-foreground">high or low</small>
          </h2>
          <div className="mb-3">
            <Badge variant="secondary">{gameProbabilities['ship-captain-crew']}% single-roll</Badge>
            {getGameInfo('ship-captain-crew').isPlayable && (
              <Badge variant="default" className="ml-2">
                Playable ({getGameInfo('ship-captain-crew').variant.variant})
                {getGameInfo('ship-captain-crew').variant.rawStrength != null && ` · ${Math.round(getGameInfo('ship-captain-crew').variant.rawStrength)}`}
              </Badge>
            )}
          </div>
          <p>
            3 dice make up an outside straight and the remaining 2 dice are
            either high or low.
          </p>
          <p>AKA "Outside straight", "Crew"</p>
          <div className="mt-3 flex gap-2">
            <Button variant="outline" size="sm" onClick={() => typeof window !== 'undefined' && (window.location.href = '/games/ship-captain-crew')}>
              Learn more →
            </Button>
            <Button variant="ghost" size="sm" onClick={() => typeof window !== 'undefined' && (window.location.href = '/rolls?game=ship-captain-crew&view=table')}>
              Explore rolls →
            </Button>
          </div>
        </div>
        <div className="">
          <div className="flex justify-end gap-2 mb-2">
            <Game type="ship, captain, crew" className="mr-1">
              <Die number="4" />
              <Die number="5" />
              <Die number="6" />
            </Game>
            <Game type="low">
              <Die number="1" />
              <Die number="1" />
            </Game>
          </div>
          <div className="flex justify-end gap-2 mb-2">
            <Game type="ship, captain, crew" className="mr-1">
              <Die number="1" />
              <Die number="2" />
              <Die number="3" />
            </Game>
            <Game type="high">
              <Die number="6" />
              <Die number="6" />
            </Game>
          </div>
        </div>
      </div>
      <hr className="my-8 border-border" />
      <div className={`pb-8 px-6 py-6 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-6 ${getGameInfo('monterey').isPlayable ? 'bg-primary/10 border-2 border-primary/30' : 'bg-muted/20'} ${getGameInfo('monterey').shouldDim ? 'opacity-40' : ''}`}>
        <div className="">
          <h2 id="monterey" className="text-3xl font-semibold mb-3 text-foreground">
            🔄 Monterey <small className="text-muted-foreground">high or low</small>
          </h2>
          <div className="mb-3">
            <Badge variant="secondary">{gameProbabilities['monterey']}% single-roll</Badge>
            {getGameInfo('monterey').isPlayable && (
              <Badge variant="default" className="ml-2">
                Playable ({getGameInfo('monterey').variant.variant})
                {getGameInfo('monterey').variant.rawStrength != null && ` · ${Math.round(getGameInfo('monterey').variant.rawStrength)}`}
              </Badge>
            )}
          </div>
          <p>
            3 dice make up an inside straight and the remaining 2 dice are
            either high or low.
          </p>
          <p>AKA "Inside straight"</p>
          <div className="mt-3 flex gap-2">
            <Button variant="outline" size="sm" onClick={() => typeof window !== 'undefined' && (window.location.href = '/games/monterey')}>
              Learn more →
            </Button>
            <Button variant="ghost" size="sm" onClick={() => typeof window !== 'undefined' && (window.location.href = '/rolls?game=monterey&view=table')}>
              Explore rolls →
            </Button>
          </div>
        </div>
        <div className="">
          <div className="flex justify-end gap-2 mb-2">
            <Game type="monterey" className="mr-1">
              <Die number="2" />
              <Die number="3" />
              <Die number="4" />
            </Game>
            <Game type="low">
              <Die number="1" />
              <Die number="1" />
            </Game>
          </div>
          <div className="flex justify-end gap-2 mb-2">
            <Game type="monterey" className="mr-1">
              <Die number="3" />
              <Die number="4" />
              <Die number="5" />
            </Game>
            <Game type="high">
              <Die number="6" />
              <Die number="6" />
            </Game>
          </div>
        </div>
      </div>
      <hr className="my-8 border-border" />
      <div className={`pb-8 px-6 py-6 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-6 ${getGameInfo('vegas').isPlayable ? 'bg-primary/10 border-2 border-primary/30' : 'bg-muted/20'} ${getGameInfo('vegas').shouldDim ? 'opacity-40' : ''}`}>
        <div className="">
          <h2 id="vegas" className="text-3xl font-semibold mb-3 text-foreground">
            🎰 7's <small className="text-muted-foreground">high or low</small>
          </h2>
          <div className="mb-3">
            <Badge variant="secondary">{gameProbabilities['vegas']}% single-roll</Badge>
            {getGameInfo('vegas').isPlayable && (
              <Badge variant="default" className="ml-2">
                Playable ({getGameInfo('vegas').variant.variant})
                {getGameInfo('vegas').variant.rawStrength != null && ` · ${Math.round(getGameInfo('vegas').variant.rawStrength)}`}
              </Badge>
            )}
          </div>
          <p>
            2 sets of 2 dice add up to 7 and or 11 and the remaining die is
            either high or low.
          </p>
          <p>AKA "7-11", "7 and/or 11's", "Vegas"</p>
          <div className="mt-3 flex gap-2">
            <Button variant="outline" size="sm" onClick={() => typeof window !== 'undefined' && (window.location.href = '/games/vegas')}>
              Learn more →
            </Button>
            <Button variant="ghost" size="sm" onClick={() => typeof window !== 'undefined' && (window.location.href = '/rolls?game=vegas&view=table')}>
              Explore rolls →
            </Button>
          </div>
        </div>
        <div className="">
          <div className="flex justify-end gap-2 mb-2">
            <Game type="vegas" className="mr-1">
              <Die number="5" />
              <Die number="6" />
            </Game>
            <Game type="vegas" className="mr-1">
              <Die number="1" />
              <Die number="6" />
            </Game>
            <Game type="low">
              <Die number="1" />
            </Game>
          </div>
          <div className="flex justify-end gap-2 mb-2">
            <Game type="vegas" className="mr-1">
              <Die number="2" />
              <Die number="5" />
            </Game>
            <Game type="vegas" className="mr-1">
              <Die number="3" />
              <Die number="4" />
            </Game>
            <Game type="high">
              <Die number="6" />
            </Game>
          </div>
        </div>
      </div>
      <hr className="my-8 border-border" />
      <div className={`pb-8 px-6 py-6 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-6 ${getGameInfo('pairs').isPlayable ? 'bg-primary/10 border-2 border-primary/30' : 'bg-muted/20'} ${getGameInfo('pairs').shouldDim ? 'opacity-40' : ''}`}>
        <div className="">
          <h2 id="pairs" className="text-3xl font-semibold mb-3 text-foreground">
            🍐 Pairs <small className="text-muted-foreground">high or low</small>
          </h2>
          <div className="mb-3">
            <Badge variant="secondary">{gameProbabilities['pairs']}% single-roll</Badge>
            {getGameInfo('pairs').isPlayable && (
              <Badge variant="default" className="ml-2">
                Playable ({getGameInfo('pairs').variant.variant})
                {getGameInfo('pairs').variant.rawStrength != null && ` · ${Math.round(getGameInfo('pairs').variant.rawStrength)}`}
              </Badge>
            )}
          </div>
          <p>
            2 sets of 2 dice are matching pairs and the remaining die is either
            high or low
          </p>
          <div className="mt-3 flex gap-2">
            <Button variant="outline" size="sm" onClick={() => typeof window !== 'undefined' && (window.location.href = '/games/pairs')}>
              Learn more →
            </Button>
            <Button variant="ghost" size="sm" onClick={() => typeof window !== 'undefined' && (window.location.href = '/rolls?game=pairs&view=table')}>
              Explore rolls →
            </Button>
          </div>
        </div>
        <div className="">
          <div className="flex justify-end gap-2 mb-2">
            <Game type="pairs" className="mr-1">
              <Die number="2" />
              <Die number="2" />
              <Die number="4" />
              <Die number="4" />
            </Game>
            <Game type="low">
              <Die number="1" />
            </Game>
          </div>
          <div className="flex justify-end gap-2 mb-2">
            <Game type="pairs" className="mr-1">
              <Die number="6" />
              <Die number="6" />
              <Die number="6" />
              <Die number="6" />
            </Game>
            <Game type="high">
              <Die number="6" />
            </Game>
          </div>
        </div>
      </div>
      <hr className="my-8 border-border" />
      <div className={`pb-8 px-6 py-6 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-6 ${getGameInfo('razzle').isPlayable ? 'bg-primary/10 border-2 border-primary/30' : 'bg-muted/20'} ${getGameInfo('razzle').shouldDim ? 'opacity-40' : ''}`}>
        <div className="">
					<h2 id="razzle" className="text-3xl font-semibold mb-3 text-foreground">✨ Razzle</h2>
          <div className="mb-3">
            <Badge variant="secondary">Threshold: 4+ wild 6s (or 5+ other)</Badge>
            {getGameInfo('razzle').isPlayable && (
              <Badge variant="default" className="ml-2">
                Playable
                {getGameInfo('razzle').variant.rawStrength != null && ` · ${Math.round(getGameInfo('razzle').variant.rawStrength)}`}
              </Badge>
            )}
          </div>
          <p className="mb-2">Most amount of any one number with aces being wild.</p>
          <div className="mb-3 p-3 bg-primary/10 dark:bg-primary/20 border border-primary/20 dark:border-primary/40 rounded-lg">
            <strong className="text-primary dark:text-primary">When to Call:</strong> <span className="text-foreground">Call with 4+ wild 6s (1s + 6s), or 5 of any other number. Over 3 rolls, players keeping 1s/6s will average 4+ wild 6s, so this threshold helps ensure you won't be the worst hand (~50% of rolls achieve this).</span>
          </div>
          <div className="mt-3 flex gap-2">
            <Button variant="outline" size="sm" onClick={() => typeof window !== 'undefined' && (window.location.href = '/games/razzle')}>
              Learn more →
            </Button>
            <Button variant="ghost" size="sm" onClick={() => typeof window !== 'undefined' && (window.location.href = '/rolls?game=razzle&view=table')}>
              Explore rolls →
            </Button>
          </div>
        </div>
        <div className="">
          <div className="flex justify-end gap-2 mb-2">
            <Game type="razzle: (3) 6's" className="mr-1">
              <Die number="1" />
              <Die number="6" />
              <Die number="6" />
            </Game>
          </div>
          <div className="flex justify-end gap-2 mb-2">
            <Game type="razzle: (4) 5's" className="mr-1">
              <Die number="1" />
              <Die number="5" />
              <Die number="1" />
              <Die number="1" />
            </Game>
          </div>
          <div className="flex justify-end gap-2 mb-2">
            <Game type="razzle: (5) 6's" className="mr-1">
              <Die number="1" />
              <Die number="1" />
              <Die number="1" />
              <Die number="1" />
            </Game>
          </div>
        </div>
      </div>

      <hr className="my-8 border-border" />
      <div className={`pb-8 px-6 py-6 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-6 ${getGameInfo('boss').isPlayable ? 'bg-primary/10 border-2 border-primary/30' : 'bg-muted/20'} ${getGameInfo('boss').shouldDim ? 'opacity-40' : ''}`}>
        <div className="">
          <h2 id="boss" className="text-3xl font-semibold mb-3 text-foreground">👑 Boss</h2>
          <div className="mb-3">
            <Badge variant="secondary">Threshold: 3 of a Kind+ (21.3%)</Badge>
            {getGameInfo('boss').isPlayable && (
              <Badge variant="default" className="ml-2">
                Playable
                {getGameInfo('boss').variant.rawStrength != null && ` · ${Math.round(getGameInfo('boss').variant.rawStrength)}`}
              </Badge>
            )}
          </div>
          <p className="mb-2">
            Poker-style hands without straights or flushes. All players reveal their dice, and the highest hand becomes the "Boss."
          </p>
          <div className="mb-3 p-3 bg-primary/10 dark:bg-primary/20 border border-primary/20 dark:border-primary/40 rounded-lg">
            <strong className="text-primary dark:text-primary">When to Call:</strong> <span className="text-foreground">Call with Three of a Kind or better (rank 4+). You have 21.3% base odds, and can keep your matching dice while re-rolling others twice to improve, giving you the best chance of not being the worst hand.</span>
          </div>
          <p className="mb-2">
            <strong>Hand Rankings (highest to lowest):</strong>
          </p>
          <ul className="list-disc list-inside mb-2 space-y-1">
            <li>5-of-a-kind (e.g., five 6s)</li>
            <li>4-of-a-kind (e.g., four 5s)</li>
            <li>Full House (e.g., three 4s, two 3s)</li>
            <li>3-of-a-kind (e.g., three 6s)</li>
            <li>Two Pair (e.g., two 6s, two 4s)</li>
            <li>Pair (e.g., two 5s)</li>
            <li>High Card (e.g., 6-5-4-3-1)</li>
          </ul>
          <p className="mb-2">
            <strong>Boss Mechanics:</strong> If there's a Boss, they can pick up and re-roll any dice that won't break their winning hand. After re-rolling, the Boss can either call up the other players (everyone re-rolls once to avoid losing) or say "Pick them up" (no loser, play passes left).
          </p>
          <p className="text-sm text-muted-foreground mb-3">
            Note: Hands use poker tie-breaking rules. Two pairs with 6s over 2s beats two pairs with 5s over 4s.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => typeof window !== 'undefined' && (window.location.href = '/games/boss')}>
              Learn more →
            </Button>
            <Button variant="ghost" size="sm" onClick={() => typeof window !== 'undefined' && (window.location.href = '/rolls?game=boss&view=table')}>
              Explore rolls →
            </Button>
          </div>
        </div>
        <div className="">
          <div className="flex justify-end gap-2 mb-2">
            <Game type="5 of a kind" className="mr-1">
              <Die number="6" />
              <Die number="6" />
              <Die number="6" />
              <Die number="6" />
              <Die number="6" />
            </Game>
          </div>
          <div className="flex justify-end gap-2 mb-2">
            <Game type="4 of a kind" className="mr-1">
              <Die number="5" />
              <Die number="5" />
              <Die number="5" />
              <Die number="5" />
              <Die number="2" />
            </Game>
          </div>
          <div className="flex justify-end gap-2 mb-2">
            <Game type="Full House" className="mr-1">
              <Die number="4" />
              <Die number="4" />
              <Die number="4" />
              <Die number="3" />
              <Die number="3" />
            </Game>
          </div>
          <div className="flex justify-end gap-2 mb-2">
            <Game type="3 of a kind" className="mr-1">
              <Die number="6" />
              <Die number="6" />
              <Die number="6" />
              <Die number="4" />
              <Die number="2" />
            </Game>
          </div>
          <div className="flex justify-end gap-2 mb-2">
            <Game type="Two Pair" className="mr-1">
              <Die number="6" />
              <Die number="6" />
              <Die number="4" />
              <Die number="4" />
              <Die number="1" />
            </Game>
          </div>
          <div className="flex justify-end gap-2 mb-2">
            <Game type="Pair" className="mr-1">
              <Die number="5" />
              <Die number="5" />
              <Die number="6" />
              <Die number="3" />
              <Die number="1" />
            </Game>
          </div>
        </div>
      </div>
      <hr className="my-8 border-border" />
      <hr className="my-8 border-border" />
      <div className={`pb-8 px-6 py-6 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-6 ${getGameInfo('tres-away').isPlayable ? 'bg-primary/10 border-2 border-primary/30' : 'bg-muted/20'} ${getGameInfo('tres-away').shouldDim ? 'opacity-40' : ''}`}>
        <div className="">
          <h2 id="tres-away" className="text-3xl font-semibold mb-3 text-foreground">⛳️ Tres away</h2>
          <div className="mb-3">
            <Badge variant="secondary">Threshold: Score ≤7 (6.13%)</Badge>
            {getGameInfo('tres-away').isPlayable && (
              <Badge variant="default" className="ml-2">
                Playable
                {getGameInfo('tres-away').variant.rawStrength != null && ` · ${Math.round(getGameInfo('tres-away').variant.rawStrength)}`}
              </Badge>
            )}
          </div>
          <p className="mb-2">
            Just like golf, lowest score wins. Each die is worth its face
            value except for 3's which are worth 0 points.
          </p>
          <div className="mb-3 p-3 bg-primary/10 dark:bg-primary/20 border border-primary/20 dark:border-primary/40 rounded-lg">
            <strong className="text-primary dark:text-primary">When to Call:</strong> <span className="text-foreground">Call with a score of 7 or less. Only 6.13% of rolls achieve this, making it a strong position.</span>
          </div>
          <p className="mb-2">
            <strong>Reveal Cycle Mechanics:</strong> Play happens in cycles. On each cycle, players must reveal at least one die but can reveal more. The optimal strategy (based on Monte Carlo simulation) is to reveal dice with expected value below 2.33 (i.e., 1s, 2s, and 3s always). With remaining dice, re-roll and repeat until all dice are revealed.
          </p>
          <p className="mb-2">
            Once all players have revealed all five dice, calculate total scores. The player with the highest total score loses.
          </p>
          <p className="text-sm text-muted-foreground mb-3">
            Perfect score: Five 3s = 0 points. Worst score: Five 6s = 30 points.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => typeof window !== 'undefined' && (window.location.href = '/games/tres-away')}>
              Learn more →
            </Button>
            <Button variant="ghost" size="sm" onClick={() => typeof window !== 'undefined' && (window.location.href = '/rolls?game=tres-away&view=table')}>
              Explore rolls →
            </Button>
          </div>
        </div>
        <div className="">
          <div className="flex justify-end gap-2 mb-2">
            <Game type="0 (Best)" className="mr-1">
              <Die number="3" />
              <Die number="3" />
              <Die number="3" />
              <Die number="3" />
              <Die number="3" />
            </Game>
          </div>
          <div className="flex justify-end gap-2 mb-2">
            <Game type="2 (Strong)" className="mr-1">
              <Die number="3" />
              <Die number="1" />
              <Die number="1" />
              <Die number="3" />
              <Die number="3" />
            </Game>
          </div>
          <div className="flex justify-end gap-2 mb-2">
            <Game type="7 (Average)" className="mr-1">
              <Die number="3" />
              <Die number="1" />
              <Die number="2" />
              <Die number="4" />
              <Die number="3" />
            </Game>
          </div>
          <div className="flex justify-end gap-2 mb-2">
            <Game type="15 (Weak)" className="mr-1">
              <Die number="3" />
              <Die number="5" />
              <Die number="3" />
              <Die number="4" />
              <Die number="3" />
            </Game>
          </div>
          <div className="flex justify-end gap-2 mb-2">
            <Game type="30 (Worst)" className="mr-1">
              <Die number="6" />
              <Die number="6" />
              <Die number="6" />
              <Die number="6" />
              <Die number="6" />
            </Game>
          </div>
        </div>
      </div>
      <hr className="my-8 border-border" />
      <div className="pb-8 px-6 py-6 rounded-lg bg-amber-500/10 border-2 border-amber-500/30 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="">
          <h2 id="barking" className="text-2xl font-semibold mb-3 text-foreground">🐕 Barking</h2>
          <Badge variant="warning" className="mb-3">Strategy</Badge>
          <p className="text-muted-foreground mb-3">Don't have any of these games? Consider...barking</p>
          <p className="mb-3">
            A player calls "Bark" to pass their turn when they have no good calls 
            and don't want to risk a bluff. The call passes to the player on their left, 
            all players pick up their dice, and a new round starts with the player to 
            the left as the new caller.
          </p>
          <p className="text-sm text-muted-foreground mb-3">
            Barking is recommended when you have low flexibility (few playable games) 
            and weak hand strength. See the detailed page for specific thresholds.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => typeof window !== 'undefined' && (window.location.href = '/games/barking')}>
              Learn when to bark →
            </Button>
          </div>
        </div>
        <div className="">
          <div className="flex justify-end gap-2 mb-2">
            <Game type="bark" className="mr-1">
              <Die number="2" />
              <Die number="2" />
              <Die number="2" />
              <Die number="5" />
              <Die number="6" />
            </Game>
          </div>
          <div className="flex justify-end gap-2 mb-2">
            <Game type="bark" className="mr-1">
              <Die number="3" />
              <Die number="3" />
              <Die number="3" />
              <Die number="5" />
              <Die number="6" />
            </Game>
          </div>
        </div>
      </div>
      <hr className="my-8 border-border" />
      {/* Removed old Tres Away section - replaced with enhanced version above */}
      <div style={{display: 'none'}} className="pb-8 px-6 py-6 rounded-lg bg-muted/20 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="">
          <h2 className="text-3xl font-semibold mb-3 text-foreground">OLD Tres away</h2>
          <p>
            Just like golf, highest score loses with each dice being its face
            value except for 3's which are worth 0. Each player must put out at
            least 1 die per roll.
          </p>
          <p>AKA "Man's game", "Road game"</p>
        </div>
        <div className="">
          <div className="flex justify-end gap-2 mb-2">
            <Game type="0" className="mr-1">
              <Die number="3" />
              <Die number="3" />
              <Die number="3" />
              <Die number="3" />
              <Die number="3" />
            </Game>
          </div>
          <div className="flex justify-end gap-2 mb-2">
            <Game type="1" className="mr-1">
              <Die number="3" />
              <Die number="1" />
              <Die number="3" />
              <Die number="3" />
              <Die number="3" />
            </Game>
          </div>
          <div className="flex justify-end gap-2 mb-2">
            <Game type="2" className="mr-1">
              <Die number="3" />
              <Die number="1" />
              <Die number="3" />
              <Die number="1" />
              <Die number="3" />
            </Game>
          </div>
          <div className="flex justify-end gap-2 mb-2">
            <Game type="4" className="mr-1">
              <Die number="3" />
              <Die number="3" />
              <Die number="3" />
              <Die number="4" />
              <Die number="3" />
            </Game>
          </div>
          <div className="flex justify-end gap-2 mb-2">
            <Game type="30" className="mr-1">
              <Die number="6" />
              <Die number="6" />
              <Die number="6" />
              <Die number="6" />
              <Die number="6" />
            </Game>
          </div>
        </div>
      </div>
    </section>
  </Layout>
  )
}

export default GamesPage
