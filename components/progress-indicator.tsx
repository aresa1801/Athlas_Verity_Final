'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Loader2, CheckCircle2 } from 'lucide-react'

interface ProgressStep {
  label: string
  progress: number
  completed: boolean
}

interface ProgressIndicatorProps {
  steps: ProgressStep[]
  currentProgress: number
  isComplete?: boolean
  title?: string
}

export function ProgressIndicator({
  steps,
  currentProgress,
  isComplete = false,
  title = 'Processing',
}: ProgressIndicatorProps) {
  const [animatedProgress, setAnimatedProgress] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(currentProgress)
    }, 100)
    return () => clearTimeout(timer)
  }, [currentProgress])

  return (
    <Card className="border-border/50 bg-card/40 p-6 space-y-4">
      <div className="flex items-center gap-2 mb-4">
        {isComplete ? (
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
        ) : (
          <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
        )}
        <h3 className="font-semibold">{title}</h3>
      </div>

      <div className="space-y-2">
        {steps.map((step, idx) => (
          <div key={idx} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className={step.completed ? 'text-emerald-500' : 'text-muted-foreground'}>
                {step.label}
              </span>
              <span className="text-xs text-muted-foreground">{step.progress}%</span>
            </div>
            <div className="w-full h-2 bg-background/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-blue-500 transition-all duration-300 ease-out"
                style={{
                  width: `${step.completed ? 100 : step.progress}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-border/30">
        <span className="text-xs text-muted-foreground">
          {steps.filter((s) => s.completed).length} of {steps.length} complete
        </span>
        <span className="text-sm font-semibold text-foreground">{animatedProgress}%</span>
      </div>
    </Card>
  )
}

interface MultiStageProgressProps {
  stages: {
    title: string
    status: 'pending' | 'in-progress' | 'completed' | 'error'
    estimatedTime?: string
  }[]
  currentStage: number
}

export function MultiStageProgress({ stages, currentStage }: MultiStageProgressProps) {
  return (
    <div className="space-y-3">
      {stages.map((stage, idx) => {
        const isActive = idx === currentStage
        const isCompleted = idx < currentStage

        return (
          <div key={idx} className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                isCompleted
                  ? 'bg-emerald-500 text-white'
                  : isActive
                    ? 'bg-blue-500 text-white'
                    : 'bg-muted text-muted-foreground'
              }`}
            >
              {isCompleted ? '✓' : idx + 1}
            </div>
            <div className="flex-1">
              <div className="font-medium text-sm">{stage.title}</div>
              {stage.estimatedTime && (
                <div className="text-xs text-muted-foreground">{stage.estimatedTime}</div>
              )}
            </div>
            {isActive && <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />}
          </div>
        )
      })}
    </div>
  )
}
