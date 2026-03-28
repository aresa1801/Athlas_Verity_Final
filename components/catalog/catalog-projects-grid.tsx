'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { toast } from 'sonner'
import { Leaf, Droplet, Zap, ChevronRight, MapPin } from 'lucide-react'

interface CatalogProject {
  id: string
  verification_id: string
  verification_type: 'green_carbon' | 'blue_carbon' | 'renewable_energy'
  project_name: string
  project_location: string
  project_description: string | null
  carbon_credits_issued: number | null
  energy_generated_mwh: number | null
  co2_avoided_tonnes: number | null
  primary_image_url: string | null
  published_at: string
  approved_by: string | null
  approved_at: string | null
}

interface CatalogProjectsGridProps {
  type?: 'green_carbon' | 'blue_carbon' | 'renewable_energy' | 'all'
  limit?: number
}

export function CatalogProjectsGrid({ type = 'all', limit }: CatalogProjectsGridProps) {
  const [projects, setProjects] = useState<CatalogProject[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProjects()
  }, [type])

  const fetchProjects = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (type !== 'all') params.append('type', type)
      if (limit) params.append('limit', limit.toString())

      const response = await fetch(`/api/admin/catalog?${params}`)
      const data = await response.json()
      if (data.success) {
        setProjects(data.data || [])
      } else {
        toast.error('Failed to load catalog projects')
      }
    } catch (error) {
      console.error('Error fetching catalog projects:', error)
      toast.error('Error loading projects')
    } finally {
      setLoading(false)
    }
  }

  const typeConfig = {
    green_carbon: {
      label: 'Green Carbon',
      icon: Leaf,
      color: 'bg-emerald-100 text-emerald-800',
      bgColor: 'bg-emerald-50',
    },
    blue_carbon: {
      label: 'Blue Carbon',
      icon: Droplet,
      color: 'bg-cyan-100 text-cyan-800',
      bgColor: 'bg-cyan-50',
    },
    renewable_energy: {
      label: 'Renewable Energy',
      icon: Zap,
      color: 'bg-amber-100 text-amber-800',
      bgColor: 'bg-amber-50',
    },
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    )
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No approved projects found in catalog</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map(project => {
        const config = typeConfig[project.verification_type]
        const IconComponent = config.icon

        return (
          <Card
            key={project.id}
            className="border-border/40 bg-card/40 hover:bg-card/60 transition-colors overflow-hidden group"
          >
            {/* Image placeholder or actual image */}
            {project.primary_image_url ? (
              <div className="w-full h-48 bg-gradient-to-br from-background to-background/50 relative overflow-hidden">
                <img
                  src={project.primary_image_url}
                  alt={project.project_name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            ) : (
              <div className={`w-full h-48 ${config.bgColor} flex items-center justify-center`}>
                <IconComponent className="w-16 h-16 text-muted-foreground/30" />
              </div>
            )}

            <CardHeader>
              <div className="flex items-start justify-between gap-2 mb-2">
                <Badge className={config.color}>{config.label}</Badge>
                <Badge variant="outline" className="text-xs">
                  Verified
                </Badge>
              </div>
              <CardTitle className="text-lg line-clamp-2">{project.project_name}</CardTitle>
              <CardDescription className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {project.project_location}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Description */}
              {project.project_description && (
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {project.project_description}
                </p>
              )}

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-4 py-4 border-t border-border/40">
                {project.verification_type === 'green_carbon' && (
                  <>
                    <div>
                      <p className="text-xs text-muted-foreground">Carbon Credits</p>
                      <p className="text-sm font-semibold">
                        {project.carbon_credits_issued?.toLocaleString() || '-'} tCO₂e
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">CO₂ Avoided</p>
                      <p className="text-sm font-semibold">
                        {project.co2_avoided_tonnes?.toLocaleString() || '-'} t
                      </p>
                    </div>
                  </>
                )}

                {project.verification_type === 'blue_carbon' && (
                  <>
                    <div>
                      <p className="text-xs text-muted-foreground">Carbon Credits</p>
                      <p className="text-sm font-semibold">
                        {project.carbon_credits_issued?.toLocaleString() || '-'} tCO₂e
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">CO₂ Avoided</p>
                      <p className="text-sm font-semibold">
                        {project.co2_avoided_tonnes?.toLocaleString() || '-'} t
                      </p>
                    </div>
                  </>
                )}

                {project.verification_type === 'renewable_energy' && (
                  <>
                    <div>
                      <p className="text-xs text-muted-foreground">Energy Generated</p>
                      <p className="text-sm font-semibold">
                        {project.energy_generated_mwh?.toLocaleString() || '-'} MWh
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">CO₂ Offset</p>
                      <p className="text-sm font-semibold">
                        {project.co2_avoided_tonnes?.toLocaleString() || '-'} t
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Action Button */}
              <Link href={`/project/${project.verification_id}`}>
                <Button variant="outline" className="w-full gap-2 group-hover:bg-accent/10">
                  View Details
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
