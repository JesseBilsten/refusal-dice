import * as React from "react"
import { cn } from "../../lib/utils"

const Alert = React.forwardRef(({ className, variant = "default", ...props }, ref) => {
  const variants = {
    default: "bg-background text-foreground border border-border",
    destructive: "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
    warning: "border-odds-coin/50 bg-odds-coin/10 text-foreground",
    success: "border-odds-safe/50 bg-odds-safe/10 text-foreground",
    muted: "bg-muted text-foreground",
    accent: "bg-accent/30 dark:bg-accent/20 text-foreground",
  }
  
  return (
    <div
      ref={ref}
      role="alert"
      className={cn(
        "relative w-full rounded-lg border p-4",
        variants[variant],
        className
      )}
      {...props}
    />
  )
})
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("mb-1 font-semibold leading-none tracking-tight", className)}
    {...props}
  />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }
