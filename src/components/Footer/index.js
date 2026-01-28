import React from 'react'
import './style.scss'

const Footer = () => (
  <footer className="border-t border-gray-200 bg-white">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-sm text-gray-600">
          This site built and designed by <a href="http://bilsten.net" className="text-blue-600 hover:underline font-medium">Jesse Bilsten</a>.
        </p>
        <a href="#" className="text-sm text-blue-600 hover:underline font-medium">Back to top</a>
      </div>
    </div>
  </footer>
)

export default Footer
