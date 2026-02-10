"use client"

import { useEffect } from "react"
import useSWR from "swr"
import { Users, TrendingUp } from "lucide-react"
import { track } from "@vercel/analytics"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function VisitorAnalyticsCards() {
  const { data, error, isLoading } = useSWR("/api/visitors", fetcher, {
    refreshInterval: 15000,
    revalidateOnFocus: true,
  })

  // Track visitor on mount
  useEffect(() => {
    const trackVisitor = async () => {
      try {
        const res = await fetch("/api/visitors", { method: "POST" })
        if (res.ok) {
          track("visitor_tracked")
        }
      } catch (err) {
        console.error("[v0] Failed to track visitor:", err)
      }
    }
    trackVisitor()
  }, [])

  if (error) {
    console.error("[v0] Error loading visitor stats:", error)
    return null
  }

  const todayCount = data?.today || 0
  const totalCount = data?.total || 0

  return (
    <div className="mt-8 md:mt-12 flex flex-col sm:flex-row gap-4 md:gap-6 justify-center items-center">
      {/* Today's Visitors Card */}
      <div className="relative group w-full max-w-[280px] md:max-w-[300px]">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl blur opacity-10 group-hover:opacity-30 transition duration-500"></div>
        <div className="relative flex items-center gap-3 md:gap-5 p-4 md:p-6 rounded-2xl bg-card border border-emerald-500/10 backdrop-blur-xl shadow-xl">
          <div className="flex h-10 w-10 md:h-14 md:w-14 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 shrink-0">
            <TrendingUp className="h-5 w-5 md:h-7 md:w-7" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] md:text-xs font-semibold uppercase tracking-wider text-muted-foreground truncate">
              Today's Activity
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl md:text-3xl font-bold tracking-tight text-foreground tabular-nums">
                {isLoading ? "---" : todayCount.toLocaleString()}
              </span>
              <span className="text-[9px] md:text-[10px] font-bold text-emerald-500 uppercase flex items-center gap-1 bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/20">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Live
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Total Visitors Card */}
      <div className="relative group w-full max-w-[280px] md:max-w-[300px]">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl blur opacity-10 group-hover:opacity-30 transition duration-500"></div>
        <div className="relative flex items-center gap-3 md:gap-5 p-4 md:p-6 rounded-2xl bg-card border border-blue-500/10 backdrop-blur-xl shadow-xl">
          <div className="flex h-10 w-10 md:h-14 md:w-14 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 shrink-0">
            <Users className="h-5 w-5 md:h-7 md:w-7" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] md:text-xs font-semibold uppercase tracking-wider text-muted-foreground truncate">
              Total Visitors
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl md:text-3xl font-bold tracking-tight text-foreground tabular-nums">
                {isLoading ? "---" : totalCount.toLocaleString()}
              </span>
              <span className="text-xs font-medium text-blue-500/80">Users</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
