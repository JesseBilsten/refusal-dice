import React, { useState } from 'react'
import { Link } from 'gatsby'
import { Menu } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './ui/sheet'
import DarkModeToggle from './DarkModeToggle'

const MobileNav = () => {
  const [open, setOpen] = useState(false)

  const primaryNavItems = [
    { to: '/rules', label: 'Rules' },
    { to: '/games', label: 'Games' },
    { to: '/strategy-assistant', label: 'Strategy' },
    { to: '/odds', label: 'Odds' },
    { to: '/glossary', label: 'Glossary' },
  ]
  
  const secondaryNavItems = [
    { to: '/strategies', label: 'Advanced Strategies' },
    { to: '/practice', label: 'Practice Mode' },
  ]
  
  const toolNavItems = [
    { to: '/odds', label: 'Rolls Explorer' },
    { to: '/second-call-predictor', label: 'Second Call Predictor' },
  ]

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:bg-accent hover:text-accent-foreground h-9 w-9 md:hidden"
          aria-label="Open navigation menu"
          aria-expanded={open}
        >
          <Menu className="h-5 w-5" />
        </button>
      </SheetTrigger>
      <SheetContent side="right" aria-label="Mobile navigation menu">
        <SheetHeader>
          <SheetTitle>Navigation</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-4 mt-6">
          <div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Main</div>
            {primaryNavItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="block text-base font-medium text-foreground hover:text-primary transition-colors py-2"
                activeClassName="text-primary"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>
          
          <div className="pt-2 border-t border-border">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Learn More</div>
            {secondaryNavItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="block text-base font-medium text-foreground hover:text-primary transition-colors py-2"
                activeClassName="text-primary"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>
          
          <div className="pt-2 border-t border-border">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Tools</div>
            {toolNavItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="block text-base font-medium text-foreground hover:text-primary transition-colors py-2"
                activeClassName="text-primary"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>
          
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Theme:</span>
              <DarkModeToggle />
            </div>
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  )
}

export default MobileNav
