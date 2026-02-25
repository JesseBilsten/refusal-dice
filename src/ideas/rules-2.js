import React, { useState } from 'react'
import { Link } from 'gatsby'
import Layout from '../components/layout'
import { Badge } from '../components/ui/badge'

/**
 * RULES v2: "Visual Flow"
 *
 * Strategy: Tab-separated Setup/Gameplay sections. Gameplay rendered as a
 * visual flowchart with branching paths. A seating diagram shows the
 * positional relationship between Hammer, 1st Refusal, 2nd Refusal.
 * Text is minimal — spatial layout does the heavy lifting.
 *
 * UX Laws:
 * - Dual Coding Theory: Visual diagram + text reinforces learning
 * - Gestalt Continuity: Flow arrows guide the eye through the process
 * - Gestalt Figure/Ground: Active path highlighted, inactive path muted
 * - Spatial Contiguity: Related info placed near its visual element
 * - Tabs reduce cognitive load by splitting setup from gameplay
 */

const Tab = ({ label, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`
      px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors
      ${active
        ? 'border-primary text-primary bg-background'
        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'}
    `}
  >
    {label}
  </button>
)

const FlowNode = ({ children, variant = 'default', className = '', id }) => {
  const variants = {
    default: 'bg-background border-border',
    primary: 'bg-primary/10 border-primary/40',
    accept: 'bg-green-500/10 border-green-500/40',
    refuse: 'bg-red-500/10 border-red-500/40',
    warning: 'bg-amber-500/10 border-amber-500/40',
    result: 'bg-muted border-muted-foreground/30',
  }

  return (
    <div id={id} className={`scroll-mt-20 border rounded-lg p-3 sm:p-4 ${variants[variant]} ${className}`}>
      {children}
    </div>
  )
}

const Arrow = ({ label, className = '' }) => (
  <div className={`flex flex-col items-center py-1 ${className}`}>
    <div className="w-0.5 h-4 bg-border" />
    {label && <span className="text-xs text-muted-foreground my-0.5">{label}</span>}
    <div className="w-0 h-0 border-l-4 border-r-4 border-t-6 border-l-transparent border-r-transparent border-t-border" />
  </div>
)

const BranchArrows = ({ leftLabel, rightLabel }) => (
  <div className="flex justify-center items-start py-1 gap-0">
    <div className="flex flex-col items-center flex-1">
      <div className="w-0.5 h-3 bg-border" />
      <div className="flex items-center w-full">
        <div className="flex-1" />
        <div className="h-0.5 w-1/2 bg-border" />
      </div>
      {leftLabel && <span className="text-xs text-muted-foreground mt-0.5">{leftLabel}</span>}
      <div className="w-0 h-0 border-l-4 border-r-4 border-t-6 border-l-transparent border-r-transparent border-t-border" />
    </div>
    <div className="flex flex-col items-center flex-1">
      <div className="w-0.5 h-3 bg-border" />
      <div className="flex items-center w-full">
        <div className="h-0.5 w-1/2 bg-border" />
        <div className="flex-1" />
      </div>
      {rightLabel && <span className="text-xs text-muted-foreground mt-0.5">{rightLabel}</span>}
      <div className="w-0 h-0 border-l-4 border-r-4 border-t-6 border-l-transparent border-r-transparent border-t-border" />
    </div>
  </div>
)

const RulesV2 = () => {
  const [tab, setTab] = useState('gameplay')

  return (
    <Layout>
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">How to Play</h1>
          <p className="text-muted-foreground text-sm">
            2–8 players · 5 dice each · Last player standing wins
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border mb-6">
          <Tab label="🎯 Gameplay" active={tab === 'gameplay'} onClick={() => setTab('gameplay')} />
          <Tab label="📦 Setup" active={tab === 'setup'} onClick={() => setTab('setup')} />
          <Tab label="⚖️ Edge Cases" active={tab === 'edge'} onClick={() => setTab('edge')} />
        </div>

        {/* ═══ GAMEPLAY TAB ═══ */}
        {tab === 'gameplay' && (
          <div>
            {/* Seating diagram */}
            <div className="bg-muted/40 rounded-xl p-4 sm:p-6 mb-8 border border-border">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4 text-center">
                Table Positions
              </h2>
              <div className="flex items-center justify-center gap-2 sm:gap-4 flex-wrap">
                <div className="text-center">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center text-xl">
                    🔨
                  </div>
                  <p className="text-xs font-semibold mt-1.5 text-primary">Hammer</p>
                  <p className="text-xs text-muted-foreground">Calls</p>
                </div>
                <div className="text-muted-foreground text-lg sm:text-xl">→</div>
                <div className="text-center">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-blue-500/15 border-2 border-blue-500/50 flex items-center justify-center text-xl">
                    🥇
                  </div>
                  <p className="text-xs font-semibold mt-1.5 text-blue-600 dark:text-blue-400">1st Refusal</p>
                  <p className="text-xs text-muted-foreground">Left of Hammer</p>
                </div>
                <div className="text-muted-foreground text-lg sm:text-xl">→</div>
                <div className="text-center">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-purple-500/15 border-2 border-purple-500/50 flex items-center justify-center text-xl">
                    🥈
                  </div>
                  <p className="text-xs font-semibold mt-1.5 text-purple-600 dark:text-purple-400">2nd Refusal</p>
                  <p className="text-xs text-muted-foreground">Left of 1st</p>
                </div>
                <div className="text-muted-foreground text-lg sm:text-xl hidden sm:block">→</div>
                <div className="text-center hidden sm:block">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-muted border-2 border-border flex items-center justify-center text-xl">
                    👥
                  </div>
                  <p className="text-xs font-semibold mt-1.5 text-muted-foreground">Others</p>
                  <p className="text-xs text-muted-foreground">Play if accepted</p>
                </div>
              </div>
            </div>

            {/* Flow chart */}
            <h2 className="text-lg font-semibold text-foreground mb-4 text-center">Round Flow</h2>

            <div className="max-w-md mx-auto">
              {/* Roll */}
              <FlowNode variant="primary" id="roll">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🎲</span>
                  <div>
                    <p className="font-semibold text-sm">Everyone rolls 5 dice</p>
                    <p className="text-xs text-muted-foreground">Hide your results from other players.</p>
                  </div>
                </div>
              </FlowNode>

              <Arrow />

              {/* Call */}
              <FlowNode variant="primary" id="first-call">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🔨</span>
                  <div>
                    <p className="font-semibold text-sm">Hammer calls a game</p>
                    <p className="text-xs text-muted-foreground">
                      Pick a <Link to="/games" className="text-primary hover:underline">game</Link> you can play well —
                      or <Link to="/glossary#bark" className="text-primary hover:underline">bark</Link> to pass.
                    </p>
                  </div>
                </div>
              </FlowNode>

              <Arrow />

              {/* 1st Refusal */}
              <FlowNode variant="default" id="first-refusal">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">🥇</span>
                  <div>
                    <p className="font-semibold text-sm">1st Refusal: Accept or Refuse?</p>
                    <p className="text-xs text-muted-foreground">Player to the Hammer's left.</p>
                  </div>
                </div>
              </FlowNode>

              {/* Branch from 1st refusal */}
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div className="flex flex-col items-center">
                  <div className="w-0.5 h-3 bg-green-500/50" />
                  <FlowNode variant="accept" className="w-full">
                    <p className="font-semibold text-xs text-green-700 dark:text-green-400">✅ Accept</p>
                    <p className="text-xs text-muted-foreground mt-1">Everyone plays the game.</p>
                  </FlowNode>
                  <div className="w-0.5 h-3 bg-border" />
                  <div className="text-xs text-muted-foreground">↓ Skip to Play</div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-0.5 h-3 bg-red-500/50" />
                  <FlowNode variant="refuse" className="w-full">
                    <p className="font-semibold text-xs text-red-700 dark:text-red-400">🚫 Refuse</p>
                    <p className="text-xs text-muted-foreground mt-1">Passes to 2nd Refusal. <span className="font-medium">You may still play!</span></p>
                  </FlowNode>
                  <div className="w-0.5 h-3 bg-border" />
                  <div className="text-xs text-muted-foreground">↓</div>
                </div>
              </div>

              {/* 2nd Refusal (only on refuse path) */}
              <div className="ml-auto w-1/2 pl-1.5 mt-1">
                <FlowNode variant="default" id="second-refusal" className="w-full">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">🥈</span>
                    <p className="font-semibold text-xs">2nd Refusal</p>
                  </div>
                </FlowNode>

                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="flex flex-col items-center">
                    <div className="w-0.5 h-2 bg-green-500/50" />
                    <div className="rounded bg-green-500/10 border border-green-500/30 p-1.5 w-full text-center dark:bg-green-500/5">
                      <p className="text-xs font-semibold text-green-700 dark:text-green-400">✅</p>
                      <p className="text-[10px] text-muted-foreground">All play</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-0.5 h-2 bg-red-500/50" />
                    <div className="rounded bg-red-500/10 border border-red-500/30 p-1.5 w-full text-center dark:bg-red-500/5">
                      <p className="text-xs font-semibold text-red-700 dark:text-red-400">🚫</p>
                      <p className="text-[10px] text-muted-foreground">2nd Call ↓</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Second Call */}
              <div className="mt-3 ml-auto w-1/2 pl-1.5">
                <FlowNode variant="warning" id="second-call">
                  <p className="font-semibold text-xs text-amber-700 dark:text-amber-400">⚡ Second Call</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Hammer calls a <strong>different game</strong>. No refusals — everyone plays.
                  </p>
                </FlowNode>
              </div>

              <Arrow className="mt-3" />

              {/* Play */}
              <FlowNode variant="primary" id="play-game">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">🃏</span>
                  <div>
                    <p className="font-semibold text-sm">Reveal & score</p>
                    <p className="text-xs text-muted-foreground">
                      Everyone shows their dice. Worst{' '}
                      <Link to="/glossary#kicker" className="text-primary hover:underline">kickers</Link>{' '}
                      loses.
                    </p>
                  </div>
                </div>
              </FlowNode>

              <Arrow />

              {/* Pencil */}
              <FlowNode variant="result">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">✏️</span>
                  <div>
                    <p className="font-semibold text-sm">Loser takes a pencil</p>
                    <p className="text-xs text-muted-foreground">3 pencils = out. Loser gets the Hammer next.</p>
                  </div>
                </div>
              </FlowNode>

              <div className="text-center mt-4">
                <Badge variant="outline" className="text-xs px-3 py-1.5">
                  🔁 Repeat until one player remains
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* ═══ SETUP TAB ═══ */}
        {tab === 'setup' && (
          <div className="max-w-md mx-auto space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-3">What you need</h2>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-xl mt-0.5">🎲</span>
                  <div>
                    <p className="font-medium text-sm">5 dice per player</p>
                    <p className="text-xs text-muted-foreground">
                      <a href="https://amzn.to/47ZTYoX" className="text-primary hover:underline">Michigan Red Eye</a> dice
                      are ideal but any work.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-xl mt-0.5">🥤</span>
                  <div>
                    <p className="font-medium text-sm">Dice cup or tower</p>
                    <p className="text-xs text-muted-foreground">
                      We like <a href="https://amzn.to/3w0X0w6" className="text-primary hover:underline">Alex Cramer leather cups</a>.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-xl mt-0.5">✏️</span>
                  <div>
                    <p className="font-medium text-sm">Pencils or tokens</p>
                    <p className="text-xs text-muted-foreground">Anything small: sugar packets, coins, chips.</p>
                  </div>
                </li>
              </ul>
            </div>

            <hr className="border-border" />

            <div>
              <h2 className="text-lg font-semibold text-foreground mb-3">Ante</h2>
              <p className="text-sm text-muted-foreground">
                Typical: <strong>$5 per player</strong> into the pot. Optional but fun.
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                <strong>Parity variation:</strong> Everyone adds $5 when all remaining players have 2 pencils.
                Pencils reset to 0.
              </p>
            </div>

            <hr className="border-border" />

            <div>
              <h2 className="text-lg font-semibold text-foreground mb-3">Who goes first?</h2>
              <p className="text-sm text-muted-foreground mb-3">
                The "<Link to="/glossary#piddle" className="text-primary hover:underline">piddle</Link>":
              </p>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>Each player rolls 1 die</li>
                <li>Highest roll gets the Hammer</li>
                <li>Ties re-roll until one wins</li>
              </ol>
            </div>
          </div>
        )}

        {/* ═══ EDGE CASES TAB ═══ */}
        {tab === 'edge' && (
          <div className="max-w-md mx-auto space-y-4">
            <div className="rounded-lg border border-border p-4 bg-muted/30">
              <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <span>🤝</span> Ties (3+ players)
              </h3>
              <p className="text-sm text-muted-foreground">
                Players tied for the worst hand replay the same game. Non-tied players sit out the replay.
                Repeat until there's a single loser.
              </p>
            </div>

            <div className="rounded-lg border border-border p-4 bg-muted/30">
              <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <span>👥</span> Ties (2 players)
              </h3>
              <p className="text-sm text-muted-foreground">
                No pencil awarded. The Hammer passes to the other player.
              </p>
            </div>

            <div className="rounded-lg border border-border p-4 bg-muted/30">
              <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <span>💀</span> Elimination (3 pencils)
              </h3>
              <p className="text-sm text-muted-foreground">
                A player with 3 pencils is out. The Hammer passes to the next remaining player on their left.
              </p>
            </div>

            <div className="rounded-lg border border-border p-4 bg-muted/30">
              <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <span>🔨</span> Who gets the Hammer?
              </h3>
              <p className="text-sm text-muted-foreground">
                The round's loser gets the Hammer next.
                <br />
                <strong>Exception (2 players):</strong> Hammer always alternates, regardless of who lost.
              </p>
            </div>

            <div className="rounded-lg border border-border p-4 bg-muted/30">
              <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <span>⚡</span> Second Call rules
              </h3>
              <p className="text-sm text-muted-foreground">
                Must be a completely different game — not just a different variant.
                Example: if first call was Monterey Low, you <em>cannot</em> call Monterey High.
              </p>
            </div>

            <div className="rounded-lg border border-border p-4 bg-muted/30">
              <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <span>👀</span> Lazy rolling
              </h3>
              <p className="text-sm text-muted-foreground">
                Some groups let non-refusal players wait to roll until the game is confirmed.
              </p>
            </div>

            <div className="rounded-lg border border-border p-4 bg-muted/30">
              <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <span>💰</span> Splitting the pot
              </h3>
              <p className="text-sm text-muted-foreground">
                With 2 players left, one may offer to split based on pencils. Not required — just common courtesy.
              </p>
            </div>
          </div>
        )}

        {/* Nav */}
        <div className="flex flex-wrap justify-center gap-3 mt-10 text-sm">
          <Link to="/games" className="text-primary hover:underline">Browse Games →</Link>
          <span className="text-border">·</span>
          <Link to="/strategy-assistant" className="text-primary hover:underline">Strategy Tool →</Link>
          <span className="text-border">·</span>
          <Link to="/glossary" className="text-primary hover:underline">Glossary →</Link>
        </div>
      </section>
    </Layout>
  )
}

export default RulesV2
