import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Filter, ChevronRight, Leaf, Droplet, Zap } from "lucide-react"
import Link from "next/link"

export const metadata = {
  title: "Carbon Project Catalog - Athlas Verity",
  description: "Discover verified carbon credit projects across Green Carbon, Blue Carbon, and Renewable Energy",
}

export default function CatalogPage() {
  const projects = [
    {
      id: 1,
      name: "Amazon Rainforest Preservation Fund",
      type: "Green Carbon",
      icon: Leaf,
      country: "Brazil",
      area: "125,000 Ha",
      credits: "5.2M tCO₂e",
      verified: "98.7%",
      description: "Large-scale forest protection initiative preventing deforestation across the Amazon basin.",
      status: "verified",
    },
    {
      id: 2,
      name: "Indonesian Peat Restoration Initiative",
      type: "Green Carbon",
      icon: Leaf,
      country: "Indonesia",
      area: "45,230 Ha",
      credits: "2.1M tCO₂e",
      verified: "95.2%",
      description: "Restoration of degraded peatlands to prevent future carbon emissions.",
      status: "verified",
    },
    {
      id: 3,
      name: "Southeast Asia Mangrove Expansion",
      type: "Blue Carbon",
      icon: Droplet,
      country: "Vietnam",
      area: "8,450 Ha",
      credits: "312k tCO₂e",
      verified: "92.3%",
      description: "Coastal mangrove reforestation providing blue carbon sequestration and biodiversity benefits.",
      status: "verified",
    },
    {
      id: 4,
      name: "African Savanna Restoration",
      type: "Green Carbon",
      icon: Leaf,
      country: "Kenya",
      area: "67,890 Ha",
      credits: "1.8M tCO₂e",
      verified: "91.5%",
      description: "Savanna ecosystem restoration with agroforestry integration for sustainable livelihoods.",
      status: "verified",
    },
    {
      id: 5,
      name: "Renewable Solar Farm Network",
      type: "Renewable Energy",
      icon: Zap,
      country: "India",
      area: "500 MW",
      credits: "225k tCO₂e/year",
      verified: "96.8%",
      description: "Large-scale solar photovoltaic installations displacing fossil fuel generation.",
      status: "verified",
    },
    {
      id: 6,
      name: "Coastal Seagrass Protection Program",
      type: "Blue Carbon",
      icon: Droplet,
      country: "Australia",
      area: "12,890 Ha",
      credits: "456k tCO₂e",
      verified: "89.2%",
      description: "Seagrass meadow protection and restoration supporting marine carbon sequestration.",
      status: "pending-review",
    },
    {
      id: 7,
      name: "Madagascar Forest Corridor Initiative",
      type: "Green Carbon",
      icon: Leaf,
      country: "Madagascar",
      area: "34,560 Ha",
      credits: "920k tCO₂e",
      verified: "88.4%",
      description: "Tropical forest protection connecting fragmented ecosystem areas.",
      status: "verified",
    },
    {
      id: 8,
      name: "Wind Energy Complex - Latin America",
      type: "Renewable Energy",
      icon: Zap,
      country: "Chile",
      area: "350 MW",
      credits: "140k tCO₂e/year",
      verified: "94.6%",
      description: "Multi-turbine wind farm replacing coal-fired generation in the region.",
      status: "verified",
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "verified":
        return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
      case "pending-review":
        return "bg-amber-500/10 text-amber-600 border-amber-500/20"
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
    <main className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/30 px-6 py-8 bg-gradient-to-b from-background to-background/50">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-foreground mb-2">Carbon Project Catalog</h1>
          <p className="text-muted-foreground">Discover and explore verified carbon credit projects globally</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Search and Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search projects by name or country..."
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-card/50 border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent/50 transition-colors"
            />
          </div>
          <Button variant="outline" className="gap-2 bg-transparent">
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Filter</span>
          </Button>
        </div>

        {/* Filter Tags */}
        <div className="flex flex-wrap gap-2 mb-8">
          <Badge variant="outline" className="cursor-pointer hover:bg-accent/10">
            All Projects ({projects.length})
          </Badge>
          <Badge variant="outline" className="cursor-pointer hover:bg-accent/10">
            <Leaf className="w-3 h-3 mr-1" />
            Green Carbon ({projects.filter((p) => p.type === "Green Carbon").length})
          </Badge>
          <Badge variant="outline" className="cursor-pointer hover:bg-accent/10">
            <Droplet className="w-3 h-3 mr-1" />
            Blue Carbon ({projects.filter((p) => p.type === "Blue Carbon").length})
          </Badge>
          <Badge variant="outline" className="cursor-pointer hover:bg-accent/10">
            <Zap className="w-3 h-3 mr-1" />
            Renewable Energy ({projects.filter((p) => p.type === "Renewable Energy").length})
          </Badge>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => {
            const IconComponent = project.icon
            return (
              <Card
                key={project.id}
                className="border-border/50 bg-card/30 hover:bg-card/50 transition-all duration-200 cursor-pointer group overflow-hidden"
              >
                <div className="p-6 space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`p-2 rounded-lg ${getTypeColor(project.type).replace("border-", "").replace("text-", "bg-")}`}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-foreground truncate group-hover:text-accent transition-colors">
                          {project.name}
                        </h3>
                        <p className="text-xs text-muted-foreground">{project.country}</p>
                      </div>
                    </div>
                  </div>

                  {/* Type and Status Badges */}
                  <div className="flex flex-wrap gap-2">
                    <Badge className={`text-xs ${getTypeColor(project.type)}`}>{project.type}</Badge>
                    <Badge className={`text-xs ${getStatusColor(project.status)}`}>
                      {project.status === "verified" ? "Verified" : "Pending Review"}
                    </Badge>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>

                  {/* Metrics */}
                  <div className="grid grid-cols-3 gap-3 py-3 border-y border-border/30">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Area</p>
                      <p className="text-sm font-semibold text-foreground">{project.area}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Credits</p>
                      <p className="text-sm font-semibold text-foreground">{project.credits}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Verified</p>
                      <p className="text-sm font-semibold text-emerald-600">{project.verified}</p>
                    </div>
                  </div>

                  {/* View Details Link */}
                  <Link
                    href={`/project/${project.id}`}
                    className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-lg bg-accent/10 hover:bg-accent/20 text-accent transition-colors text-sm font-medium"
                  >
                    View Details
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </Card>
            )
          })}
        </div>

        {/* Footer CTA */}
        <div className="mt-12 text-center p-8 rounded-lg bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-border/30">
          <h3 className="text-xl font-semibold text-foreground mb-2">Ready to Create Your Project?</h3>
          <p className="text-muted-foreground mb-4">Begin the verification process for your carbon credit project today</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/verification/green-carbon">
              <Button className="gap-2">
                <Leaf className="w-4 h-4" />
                Create Green Carbon Project
              </Button>
            </Link>
            <Link href="/verification/blue-carbon">
              <Button variant="outline" className="gap-2 bg-transparent">
                <Droplet className="w-4 h-4" />
                Create Blue Carbon Project
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
