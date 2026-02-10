"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, AlertCircle, Clock, User, Database } from "lucide-react"

export function AuditTrail() {
  const auditEvents = [
    {
      timestamp: "2024-01-15 14:32:00 UTC",
      event: "Verification Completed",
      type: "success",
      actor: "System (Aura Subnet)",
      details: "Project verified with 98.5% confidence score. All checks passed.",
      icon: CheckCircle2,
    },
    {
      timestamp: "2024-01-15 12:18:00 UTC",
      event: "IPCC Validation Passed",
      type: "success",
      actor: "System (AI Engine)",
      details: "AGB estimate validated against IPCC regional defaults. Within acceptable range.",
      icon: CheckCircle2,
    },
    {
      timestamp: "2024-01-15 10:45:00 UTC",
      event: "Biomass Estimation Complete",
      type: "success",
      actor: "System (ML Model)",
      details: "AGB calculated at 185.4 tDM/ha with 18.5% uncertainty. Conservative estimate applied.",
      icon: CheckCircle2,
    },
    {
      timestamp: "2024-01-15 09:22:00 UTC",
      event: "Satellite Data Processed",
      type: "success",
      actor: "System (Data Pipeline)",
      details: "Successfully processed Sentinel-2 and GEDI L4A data. Quality checks passed.",
      icon: CheckCircle2,
    },
    {
      timestamp: "2024-01-15 08:00:00 UTC",
      event: "Project Submitted",
      type: "info",
      actor: "user@example.com",
      details: "Amazon Reforestation Initiative project submitted for verification.",
      icon: Clock,
    },
    {
      timestamp: "2024-01-14 16:45:00 UTC",
      event: "Project Created",
      type: "info",
      actor: "user@example.com",
      details: "Project created with 45,230 Ha area in Brazil.",
      icon: Database,
    },
  ]

  const getEventColor = (type: string) => {
    switch (type) {
      case "success":
        return "text-emerald-600"
      case "warning":
        return "text-amber-600"
      case "error":
        return "text-red-600"
      default:
        return "text-blue-600"
    }
  }

  const getEventBgColor = (type: string) => {
    switch (type) {
      case "success":
        return "bg-emerald-500/10"
      case "warning":
        return "bg-amber-500/10"
      case "error":
        return "bg-red-500/10"
      default:
        return "bg-blue-500/10"
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Audit Trail</h2>
        <p className="text-muted-foreground mt-1">Complete record of all verification events and actions</p>
      </div>

      <Card className="border-border/50 bg-gradient-to-br from-card to-card/50 overflow-hidden">
        <div className="divide-y divide-border/30">
          {auditEvents.map((event, idx) => {
            const Icon = event.icon
            return (
              <div key={idx} className="p-6 hover:bg-accent/5 transition-colors">
                <div className="flex gap-4">
                  {/* Timeline indicator */}
                  <div className="flex flex-col items-center">
                    <div className={`p-2.5 rounded-lg ${getEventBgColor(event.type)}`}>
                      <Icon className={`w-4 h-4 ${getEventColor(event.type)}`} />
                    </div>
                    {idx < auditEvents.length - 1 && (
                      <div className="w-0.5 h-12 bg-border/30 mt-2" />
                    )}
                  </div>

                  {/* Event content */}
                  <div className="flex-1 min-w-0 pb-2">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        <h3 className="font-semibold text-foreground">{event.event}</h3>
                        <p className="text-xs text-muted-foreground mt-1">{event.timestamp}</p>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          event.type === "success"
                            ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20"
                            : event.type === "warning"
                              ? "bg-amber-500/10 text-amber-700 border-amber-500/20"
                              : "bg-blue-500/10 text-blue-700 border-blue-500/20"
                        }
                      >
                        {event.type === "success" ? "Completed" : event.type === "warning" ? "Warning" : "Info"}
                      </Badge>
                    </div>

                    <p className="text-sm text-muted-foreground mb-3">{event.details}</p>

                    <div className="flex items-center gap-6 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span>{event.actor}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
