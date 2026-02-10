"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronRight, Filter } from "lucide-react"
import Link from "next/link"

export function ProjectsTable() {
  const projects = [
    {
      id: 1,
      name: "Amazon Reforestation Initiative",
      type: "Green Carbon",
      area: "45,230 Ha",
      credits: "2.1M tCO₂e",
      verified: "98.5%",
      status: "verified",
      lastUpdate: "2 hours ago",
    },
    {
      id: 2,
      name: "Mangrove Restoration Program",
      type: "Blue Carbon",
      area: "8,450 Ha",
      credits: "189k tCO₂e",
      verified: "92.3%",
      status: "pending-review",
      lastUpdate: "1 day ago",
    },
    {
      id: 3,
      name: "Solar Farm Expansion",
      type: "Renewable Energy",
      area: "250 MW",
      credits: "125k tCO₂e/year",
      verified: "95.8%",
      status: "verified",
      lastUpdate: "3 hours ago",
    },
    {
      id: 4,
      name: "Coastal Seagrass Conservation",
      type: "Blue Carbon",
      area: "12,890 Ha",
      credits: "456k tCO₂e",
      verified: "87.2%",
      status: "in-progress",
      lastUpdate: "5 hours ago",
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "verified":
        return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
      case "pending-review":
        return "bg-amber-500/10 text-amber-600 border-amber-500/20"
      case "in-progress":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20"
      default:
        return "bg-slate-500/10 text-slate-600 border-slate-500/20"
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Green Carbon":
        return "bg-emerald-500/10 text-emerald-700 border-emerald-500/20"
      case "Blue Carbon":
        return "bg-blue-500/10 text-blue-700 border-blue-500/20"
      case "Renewable Energy":
        return "bg-amber-500/10 text-amber-700 border-amber-500/20"
      default:
        return "bg-slate-500/10 text-slate-700 border-slate-500/20"
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Active Projects</h3>
          <p className="text-sm text-muted-foreground">Manage and monitor your carbon verification projects</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2 bg-transparent">
          <Filter className="w-4 h-4" />
          Filter
        </Button>
      </div>

      <Card className="border-border/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50 bg-accent/5">
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Project Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Area / Capacity
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Credits
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Verified
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr key={project.id} className="border-b border-border/30 hover:bg-accent/5 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-foreground">{project.name}</p>
                      <p className="text-xs text-muted-foreground">{project.lastUpdate}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="outline" className={getTypeColor(project.type)}>
                      {project.type}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-sm text-foreground">{project.area}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-foreground">{project.credits}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400"
                          style={{ width: `${parseFloat(project.verified)}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-foreground">{project.verified}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge className={getStatusColor(project.status)}>{project.status.replace("-", " ")}</Badge>
                  </td>
                  <td className="px-6 py-4">
                    <Link href={`/project/${project.id}`}>
                      <Button variant="ghost" size="sm" className="gap-1">
                        <span>View</span>
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
