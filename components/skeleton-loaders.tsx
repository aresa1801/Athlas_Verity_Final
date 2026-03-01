'use client'

import { Card } from '@/components/ui/card'

export function SkeletonLoader() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 bg-muted rounded w-3/4" />
      <div className="space-y-2">
        <div className="h-4 bg-muted rounded" />
        <div className="h-4 bg-muted rounded w-5/6" />
      </div>
    </div>
  )
}

export function SkeletonCard() {
  return (
    <Card className="border-border/50 bg-card/40 p-6">
      <div className="animate-pulse space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-muted rounded-lg" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-3 bg-muted rounded w-1/2" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-muted rounded" />
          <div className="h-4 bg-muted rounded w-5/6" />
        </div>
      </div>
    </Card>
  )
}

export function SkeletonGrid({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}

export function SkeletonMapPlaceholder() {
  return (
    <Card className="border-border/50 bg-muted/20 p-4 h-96 flex items-center justify-center">
      <div className="animate-pulse text-center space-y-3">
        <div className="w-16 h-16 bg-muted rounded-full mx-auto" />
        <div className="h-4 bg-muted rounded w-40 mx-auto" />
        <div className="h-3 bg-muted rounded w-48 mx-auto" />
      </div>
    </Card>
  )
}

export function SkeletonChart() {
  return (
    <Card className="border-border/50 bg-card/40 p-6">
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-muted rounded w-1/4" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-end gap-2">
              <div
                className="bg-muted rounded"
                style={{
                  width: '100%',
                  height: `${Math.random() * 100 + 20}px`,
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <Card className="border-border/50 bg-card/40 p-4">
      <div className="animate-pulse space-y-3">
        <div className="flex gap-2">
          <div className="h-4 bg-muted rounded flex-1" />
          <div className="h-4 bg-muted rounded flex-1" />
          <div className="h-4 bg-muted rounded flex-1" />
        </div>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-2">
            <div className="h-4 bg-muted rounded flex-1" />
            <div className="h-4 bg-muted rounded flex-1" />
            <div className="h-4 bg-muted rounded flex-1" />
          </div>
        ))}
      </div>
    </Card>
  )
}
