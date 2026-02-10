import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function HistoryLoading() {
  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/30 px-6 py-6 bg-gradient-to-b from-background to-background/50">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <Skeleton className="flex-1 h-10 rounded-lg" />
          <Skeleton className="w-24 h-10 rounded-lg" />
          <Skeleton className="w-32 h-10 rounded-lg" />
        </div>

        {/* History Table Skeleton */}
        <Card className="border-border/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50 bg-accent/5">
                  <th className="px-6 py-3 text-left">
                    <Skeleton className="h-4 w-32" />
                  </th>
                  <th className="px-6 py-3 text-left">
                    <Skeleton className="h-4 w-20" />
                  </th>
                  <th className="px-6 py-3 text-left">
                    <Skeleton className="h-4 w-16" />
                  </th>
                  <th className="px-6 py-3 text-left">
                    <Skeleton className="h-4 w-20" />
                  </th>
                  <th className="px-6 py-3 text-left">
                    <Skeleton className="h-4 w-16" />
                  </th>
                  <th className="px-6 py-3 text-left">
                    <Skeleton className="h-4 w-20" />
                  </th>
                  <th className="px-6 py-3 text-left">
                    <Skeleton className="h-4 w-16" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border/30">
                    <td className="px-6 py-4">
                      <Skeleton className="h-5 w-48" />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-6 w-28 rounded" />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-5 w-20" />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-5 w-24" />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-5 w-16" />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-6 w-24 rounded" />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-8 w-16 rounded" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Pagination Skeleton */}
        <div className="flex items-center justify-between mt-6">
          <Skeleton className="h-5 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
      </div>
    </main>
  )
}
