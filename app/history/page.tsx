"use client"
import { Suspense, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Filter, Search, Download } from "lucide-react"
import Link from "next/link"
import HistoryLoading from "./loading"

function HistoryContent() {
  const searchParams = useSearchParams()
  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "")
  const [selectedType, setSelectedType] = useState(searchParams.get("type") || "")

  const verificationHistory = [
    {
      id: 1,
      name: "Amazon Reforestation Initiative",
      type: "Green Carbon",
      status: "verified",
      date: "Jan 15, 2024",
      credits: "2.1M tCO₂e",
      score: 98.5,
    },
    {
      id: 2,
      name: "Mangrove Restoration Program",
      type: "Blue Carbon",
      status: "pending-review",
      date: "Jan 14, 2024",
      credits: "189k tCO₂e",
      score: 92.3,
    },
    {
      id: 3,
      name: "Solar Farm Expansion",
      type: "Renewable Energy",
      status: "verified",
      date: "Jan 12, 2024",
      credits: "125k tCO₂e/year",
      score: 95.8,
    },
    {
      id: 4,
      name: "Coastal Seagrass Conservation",
      type: "Blue Carbon",
      status: "in-progress",
      date: "Jan 10, 2024",
      credits: "456k tCO₂e",
      score: 87.2,
    },
    {
      id: 5,
      name: "Wetland Protection Initiative",
      type: "Green Carbon",
      status: "verified",
      date: "Jan 8, 2024",
      credits: "780k tCO₂e",
      score: 96.1,
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

  // Filter results based on search term and type
  const filteredHistory = useMemo(() => {
    return verificationHistory.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesType = !selectedType || item.type === selectedType
      return matchesSearch && matchesType
    })
  }, [searchTerm, selectedType])

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/30 px-6 py-6 bg-gradient-to-b from-background to-background/50">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-foreground">Verification History</h1>
          <p className="text-muted-foreground mt-1">Complete record of all your projects and verifications</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-4 py-2 rounded-lg border border-border/30 bg-background text-foreground text-sm hover:border-accent/40 transition-colors"
            >
              <option value="">All Types</option>
              <option value="Green Carbon">Green Carbon</option>
              <option value="Blue Carbon">Blue Carbon</option>
              <option value="Renewable Energy">Renewable Energy</option>
            </select>
            <Button variant="outline" className="gap-2 bg-transparent">
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>
        </div>

        {/* History Table */}
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
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Credits
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Score
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
                {filteredHistory.length > 0 ? (
                  filteredHistory.map((item) => (
                    <tr key={item.id} className="border-b border-border/30 hover:bg-accent/5 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-medium text-foreground">{item.name}</p>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className={getTypeColor(item.type)}>
                          {item.type}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{item.date}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-foreground">{item.credits}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400"
                              style={{ width: `${item.score}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-foreground">{item.score.toFixed(1)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={getStatusColor(item.status)}>
                          {item.status.replace("-", " ")}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Link href={`/project/${item.id}`}>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-sm text-muted-foreground">
                      No results found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-muted-foreground">Showing {Math.min(filteredHistory.length, 5)} of {verificationHistory.length} results</p>
          <div className="flex gap-2">
            <Button variant="outline" disabled>
              Previous
            </Button>
            <Button variant="outline">Next</Button>
          </div>
        </div>
      </div>
    </main>
  )
}

export default function HistoryPage() {
  return (
    <Suspense fallback={<HistoryLoading />}>
      <HistoryContent />
    </Suspense>
  )
}
