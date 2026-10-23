import React from 'react'
import Panel from './Panel'
import StepNumber from './StepNumber'

/** One numbered step (the Rules page's round): a Panel titled with its StepNumber */
export default function StepPanel({ n, title, id, children, className }) {
  return (
    <Panel
      id={id}
      className={className ?? 'scroll-mt-20'}
      title={
        <span className="flex items-center gap-3">
          <StepNumber n={n} />
          {title}
        </span>
      }
    >
      <div className="space-y-3">{children}</div>
    </Panel>
  )
}
