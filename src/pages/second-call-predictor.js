import { useEffect } from 'react'
import { navigate } from 'gatsby'

/** The Second Call Predictor is now a Strategy Assistant tab */
const SecondCallRedirect = () => {
  useEffect(() => {
    navigate('/strategy-assistant/?tab=second', { replace: true })
  }, [])
  return null
}

export default SecondCallRedirect
