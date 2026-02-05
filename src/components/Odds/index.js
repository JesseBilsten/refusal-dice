import React from 'react'

const Odds = ({ game, label }) => {
  let percentage = 0

  switch (game) {
    case '10-2':
      percentage = 49.07
      break
    case '10-3':
      percentage = 53.43
      break
    case '10-4':
      percentage = 22.25
      break
    case 'ship, captain, crew':
      percentage = 32.64
      break
    case 'monterey':
      percentage = 25.46
      break
    case 'vegas':
      percentage = 32.41
      break
    case 'pairs':
      percentage = 29.01
      break
    default:
      percentage = 0
  }

  return (
    <div className="flex items-center">
      <span className="mr-2">{label}</span>
      <div className="flex-1 mx-2 h-1 rounded bg-muted-surface overflow-hidden">
        <div className="h-full bg-primary rounded" style={{ width: `${percentage}%` }} />
      </div>
      <span className="ml-2 text-sm text-muted-foreground">{percentage}%</span>
    </div>
  )
}

export default Odds
