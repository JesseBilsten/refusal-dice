import React from 'react'
import { Link } from 'gatsby'
import { GAMES_MAP, formatCallLabel, getGamePath } from '../lib/games-config'

/**
 * Inline link to a game's detail page.
 *
 * Props:
 *  - id:        game id (e.g. '10-2', 'razzle', 'monterey')
 *  - children:  optional custom label; defaults to the game's display name
 *  - className: optional extra classes
 *  - showEmoji: prepend the game emoji (default false)
 */
const GameLink = ({ id, children, className = '', showEmoji = false }) => {
  const game = GAMES_MAP[id]
  const label = children || game?.name || id
  const emoji = showEmoji && game?.emoji ? `${game.emoji} ` : ''

  return (
    <Link
      to={getGamePath(id)}
      className={`font-medium underline decoration-primary/40 underline-offset-2
        hover:decoration-primary hover:text-primary transition-colors ${className}`}
    >
      {emoji}{label}
    </Link>
  )
}

export default GameLink

/**
 * A call, named the same way everywhere: the game's emoji, its name and the
 * variant ("👌 10-3 High"), linking to the game's page unless `link` is false.
 * call: { game, variant? }
 */
export const CallName = ({ call, link = true, className = '' }) => {
  const game = GAMES_MAP[call.game]
  const text = formatCallLabel(call)
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      {game?.emoji && <span aria-hidden>{game.emoji}</span>}
      {link ? <GameLink id={call.game}>{text}</GameLink> : <span className="font-medium">{text}</span>}
    </span>
  )
}
