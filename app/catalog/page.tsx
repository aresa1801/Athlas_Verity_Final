import { CatalogGrid } from "@/components/catalog/catalog-grid"
import { Badge } from "@/components/ui/badge"
import { Leaf, Droplets, Zap } from "lucide-react"

export const metadata = {
  title: "Carbon Project Catalog - Athlas Verity",
  description: "Discover verified carbon credit projects across Green Carbon, Blue Carbon, and Renewable Energy",
}

export default function CatalogPage() {
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
        <CatalogGrid />
      </div>
    </main>
  )
}
}
