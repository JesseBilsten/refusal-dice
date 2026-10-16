import { useEffect } from 'react'
import { navigate } from 'gatsby'

/** Practice mode shipped as Play */
const PracticeRedirect = () => {
  useEffect(() => {
    navigate('/play/', { replace: true })
  }, [])
  return null
}

export default PracticeRedirect
