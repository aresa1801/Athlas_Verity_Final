'use client'

import { AlertCircle, CheckCircle, AlertTriangle, Info, X } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useCallback, useState } from 'react'

interface AlertProps {
  type: 'error' | 'success' | 'warning' | 'info'
  title?: string
  message: string
  details?: Record<string, string[]>
  onClose?: () => void
  actions?: Array<{
    label: string
    onClick: () => void
    variant?: 'default' | 'outline' | 'destructive'
  }>
  dismissible?: boolean
  autoClose?: number
}

const alertStyles = {
  error: {
    container: 'border-destructive/50 bg-destructive/5',
    icon: 'text-destructive',
    title: 'text-destructive-foreground',
  },
  success: {
    container: 'border-emerald-500/50 bg-emerald-500/5',
    icon: 'text-emerald-500',
    title: 'text-emerald-500',
  },
  warning: {
    container: 'border-amber-500/50 bg-amber-500/5',
    icon: 'text-amber-500',
    title: 'text-amber-500',
  },
  info: {
    container: 'border-blue-500/50 bg-blue-500/5',
    icon: 'text-blue-500',
    title: 'text-blue-500',
  },
}

const iconMap = {
  error: AlertCircle,
  success: CheckCircle,
  warning: AlertTriangle,
  info: Info,
}

export function ErrorAlert({
  type,
  title,
  message,
  details,
  onClose,
  actions,
  dismissible = true,
  autoClose,
}: AlertProps) {
  const [isOpen, setIsOpen] = useState(true)

  const handleClose = useCallback(() => {
    setIsOpen(false)
    onClose?.()
  }, [onClose])

  // Auto-close after specified duration
  React.useEffect(() => {
    if (autoClose && isOpen) {
      const timer = setTimeout(handleClose, autoClose)
      return () => clearTimeout(timer)
    }
  }, [autoClose, isOpen, handleClose])

  if (!isOpen) return null

  const styles = alertStyles[type]
  const IconComponent = iconMap[type]

  return (
    <Card className={`border ${styles.container} p-4`}>
      <div className="flex gap-4">
        <IconComponent className={`h-5 w-5 flex-shrink-0 ${styles.icon} mt-0.5`} />

        <div className="flex-1 min-w-0">
          {title && <h4 className={`font-semibold mb-1 ${styles.title}`}>{title}</h4>}
          <p className="text-sm text-muted-foreground mb-3">{message}</p>

          {details && Object.keys(details).length > 0 && (
            <div className="mb-3 bg-background/50 rounded-md p-2 text-xs">
              {Object.entries(details).map(([field, errors]) => (
                <div key={field} className="mb-1">
                  <span className="font-mono text-muted-foreground">{field}:</span>
                  <ul className="list-disc list-inside text-destructive/80 ml-2">
                    {errors.map((error, idx) => (
                      <li key={idx}>{error}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {(actions || dismissible) && (
            <div className="flex gap-2 flex-wrap">
              {actions?.map((action, idx) => (
                <Button
                  key={idx}
                  size="sm"
                  variant={action.variant || 'outline'}
                  onClick={() => {
                    action.onClick()
                    if (action.variant !== 'destructive') handleClose()
                  }}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          )}
        </div>

        {dismissible && (
          <button
            onClick={handleClose}
            className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close alert"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
    </Card>
  )
}

export default ErrorAlert
