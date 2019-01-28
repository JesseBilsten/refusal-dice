import React from 'react'
import './style.scss'

const Footer = () => (
  <footer className="footer" style={{padding: '2rem 0'}}>
    <div className="container text-muted">
      <p className="float-right">
        <a href="#">Back to top</a>
      </p>
      <p>This site built and designed by <a href="http://bilsten.net">Jesse Bilsten</a>.</p>
    </div>
  </footer>
)

export default Footer
