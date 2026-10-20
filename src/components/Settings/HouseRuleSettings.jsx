import React, { useId } from 'react'
import { Switch } from '../ui/switch'
import { Label } from '../ui/label'
import { cn } from '../../lib/utils'
import { useHouseRules } from './house-rules'

/**
 * The house rules that change the odds. Each one recalculates every figure
 * on the site that depends on it.
 */
const HouseRuleSettings = ({ className }) => {
  const [rules, update] = useHouseRules()
  const id = useId()
  return (
    <div className={cn('space-y-2 text-sm', className)}>
      <div className="font-medium">House rules</div>
      <div className="flex flex-row-reverse items-start justify-between gap-3">
        <Switch
          id={`${id}-lone`}
          checked={rules.montereyLoneKeep}
          onCheckedChange={(on) => update({ montereyLoneKeep: on })}
          aria-describedby={`${id}-lone-hint`}
        />
        <div>
          <Label htmlFor={`${id}-lone`}>Monterey: keep a lone 3 or 4</Label>
          <p id={`${id}-lone-hint`} className="text-xs text-muted-foreground">
            Off: keep 2-3, 3-4 or 4-5.
          </p>
        </div>
      </div>
    </div>
  )
}

export default HouseRuleSettings
