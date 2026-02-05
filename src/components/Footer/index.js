import React from 'react'
import './style.scss'

const Footer = () => {
  const handleBackToTop = (e) => {
    e.preventDefault()
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <footer className="bg-surface-alt text-surface-foreground">
      <div className="container-custom py-8">
        <div className="flex justify-between items-center">
          <p className="text-sm">This site built and designed by <a className="text-sky-600" href="http://bilsten.net">Jesse Bilsten</a>.</p>
          <p className="text-sm">
            <button type="button" onClick={handleBackToTop} className="text-sm hover:underline">Back to top</button>
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
