import { Button } from "@/components/ui/button"
import { PortfolioSnapshot } from "@/components/dashboard/portfolio-snapshot"
import { ProjectsTable } from "@/components/dashboard/projects-table"
import { Plus, Bell } from "lucide-react"
import Link from "next/link"

export const metadata = {
  title: "Dashboard - Athlas Verity",
  description: "Manage and monitor your carbon credit portfolio",
}

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/30 px-6 py-6 bg-gradient-to-b from-background to-background/50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Welcome back to your carbon verification portfolio</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="gap-2 bg-transparent">
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">Notifications</span>
            </Button>
            <Link href="/verification/green-carbon">
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">New Project</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-12 space-y-12">
        {/* Portfolio Snapshot */}
        <PortfolioSnapshot />

        {/* Projects Table */}
        <ProjectsTable />

        {/* Alerts Section */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Recent Alerts</h3>
            <p className="text-sm text-muted-foreground">Important updates from your projects</p>
          </div>

          <div className="grid gap-4">
            <div className="border border-amber-500/20 bg-amber-500/5 rounded-lg p-4 flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground">Verification In Progress</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Coastal Seagrass Conservation project is undergoing verification. Expected completion: 2 days.
                </p>
              </div>
            </div>

            <div className="border border-emerald-500/20 bg-emerald-500/5 rounded-lg p-4 flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground">Verification Complete</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Amazon Reforestation Initiative has been verified. 2.1M tCO₂e credits are now available for trading.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
