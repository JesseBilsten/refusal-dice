import { useEffect } from 'react'
import { navigate } from 'gatsby'

/** Game odds now live in the Odds Lab ("Every game's odds" tab) */
const OddsRedirect = () => {
  useEffect(() => {
    const game = new URLSearchParams(window.location.search).get('game')
    navigate(`/odds-lab/?tab=games${game ? `&game=${game}` : ''}`, { replace: true })
  }, [])
  return null
}

export default OddsRedirect
