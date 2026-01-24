import React from 'react'

const PageShell = ({ title, lead, badge, headerRight, children }) => {
  return (
    <section className="section-gap">
      <div className="section-gap container-custom">
        <header className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              {title} {badge}
            </h1>
            {lead && (
              <p className="lead mt-2 text-surface-foreground content-prose">{lead}</p>
            )}
          </div>
          {headerRight && <div className="ml-4">{headerRight}</div>}
        </header>
      </div>

      <main className="container-custom">{children}</main>
    </section>
  )
}

export default PageShell
