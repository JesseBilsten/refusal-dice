import React from 'react'
import { Link } from 'gatsby'
import { GAMES_MAP, getGamePath } from '../lib/games-config'

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
