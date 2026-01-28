import React from 'react'

const Footer = () => (
  <footer className="mt-24 border-t border-border bg-muted/30">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-sm text-muted-foreground">
          This site built and designed by <a href="http://bilsten.net" className="text-primary hover:underline font-medium">Jesse Bilsten</a>.
        </p>
        <a href="#" className="text-sm text-primary hover:underline font-medium">Back to top</a>
      </div>
    </div>
  </footer>
)

export default Footer
