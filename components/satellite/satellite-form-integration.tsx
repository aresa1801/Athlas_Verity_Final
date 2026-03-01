'use client'

import { useState, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Satellite, Leaf, Droplets, CheckCircle2, AlertCircle } from 'lucide-react'
import { useLoadingState } from '@/hooks/use-loading-state'
import { ErrorAlert } from '@/components/error-alert'
import { ProgressIndicator } from '@/components/progress-indicator'
import { SkeletonCard } from '@/components/skeleton-loaders'

export interface SatelliteVerificationData {
  imageId: string
  timestamp: string
  cloudCover: number
  ndvi: number
  carbonEstimate: number
  biomassEstimate: number
  vegetationHealth: number
  areaHa: number
  dataQuality: 'High' | 'Medium' | 'Low'
  recommendations: string[]
}

interface SatelliteFormIntegrationProps {
  projectType: 'green-carbon' | 'blue-carbon'
  onDataReceived?: (data: SatelliteVerificationData) => void
  onClose?: () => void
  initialPolygon?: Array<[number, number]>
}

export function SatelliteFormIntegration({
  projectType,
  onDataReceived,
  onClose,
  initialPolygon,
}: SatelliteFormIntegrationProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const { isLoading, error, progress, setLoading, setProgress, setError, reset } =
    useLoadingState('Initializing satellite verification...')
  const [verificationData, setVerificationData] = useState<SatelliteVerificationData | null>(null)
  const [isIntegrated, setIsIntegrated] = useState(false)

  const handleLaunchVerification = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      setProgress(10)

      // Simulate verification workflow
      setProgress(30)
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setProgress(60)
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setProgress(100)

      // Mock data for demonstration
      const mockData: SatelliteVerificationData = {
        imageId: 'LANDSAT_20240101',
        timestamp: new Date().toISOString(),
        cloudCover: 12.5,
        ndvi: 0.68,
        carbonEstimate: 245000,
        biomassEstimate: 520.8,
        vegetationHealth: 0.82,
        areaHa: 1250.5,
        dataQuality: 'High',
        recommendations: [
          'Excellent vegetation health indicators',
          'Suitable for carbon credit generation',
          'Monitor for seasonal variations',
        ],
      }

      setVerificationData(mockData)
      setIsIntegrated(true)
      onDataReceived?.(mockData)

      setLoading(false)
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setError(error)
      setLoading(false)
    }
  }, [setLoading, setProgress, setError, onDataReceived])

  const handleUseData = useCallback(() => {
    if (verificationData) {
      // Auto-populate form fields with satellite data
      const event = new CustomEvent('satelliteDataIntegrated', {
        detail: verificationData,
      })
      window.dispatchEvent(event)
      onClose?.()
    }
  }, [verificationData, onClose])

  const handleReset = useCallback(() => {
    setVerificationData(null)
    setIsIntegrated(false)
    reset()
  }, [reset])

  const projectIcon = projectType === 'green-carbon' ? Leaf : Droplets
  const ProjectIcon = projectIcon

  return (
    <div className="space-y-4">
      <Card className="border-border/50 bg-card/40 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
            <Satellite className="h-6 w-6 text-emerald-500" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Satellite Verification</h3>
            <p className="text-sm text-muted-foreground">
              Enhance your project with AI-powered satellite analysis
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4">
            <ErrorAlert
              type="error"
              message={error.message}
              title="Verification Error"
              dismissible
              onClose={() => setError(null)}
            />
          </div>
        )}

        {!isIntegrated ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Launch satellite imagery analysis to automatically populate project data with verified
              estimates.
            </p>

            {isLoading ? (
              <ProgressIndicator
                steps={[
                  { label: 'Fetching satellite data', progress: progress < 30 ? progress : 100, completed: progress >= 30 },
                  { label: 'Processing imagery', progress: progress < 60 ? Math.max(progress - 30, 0) * 2 : 100, completed: progress >= 60 },
                  { label: 'Gemini AI analysis', progress: progress < 100 ? Math.max(progress - 60, 0) * 2.5 : 100, completed: progress >= 100 },
                ]}
                currentProgress={progress}
                isComplete={progress === 100}
                title="Running Satellite Verification"
              />
            ) : (
              <Button onClick={handleLaunchVerification} className="w-full gap-2" size="lg">
                <Satellite className="h-5 w-5" />
                Launch Satellite Verification
              </Button>
            )}
          </div>
        ) : verificationData ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="analysis">Analysis</TabsTrigger>
              <TabsTrigger value="recommendations">Actions</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card className="border-border/30 bg-background/50 p-4">
                  <p className="text-xs text-muted-foreground mb-1">Area</p>
                  <p className="text-lg font-semibold">{verificationData.areaHa.toLocaleString()} ha</p>
                </Card>

                <Card className="border-border/30 bg-background/50 p-4">
                  <p className="text-xs text-muted-foreground mb-1">Cloud Cover</p>
                  <p className="text-lg font-semibold">{verificationData.cloudCover}%</p>
                </Card>

                <Card className="border-border/30 bg-background/50 p-4">
                  <p className="text-xs text-muted-foreground mb-1">Data Quality</p>
                  <p className="text-lg font-semibold text-emerald-500">{verificationData.dataQuality}</p>
                </Card>

                <Card className="border-border/30 bg-background/50 p-4">
                  <p className="text-xs text-muted-foreground mb-1">Analysis Date</p>
                  <p className="text-sm font-semibold">
                    {new Date(verificationData.timestamp).toLocaleDateString()}
                  </p>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="analysis" className="space-y-4">
              <Card className="border-border/30 bg-background/50 p-4">
                <p className="text-sm font-semibold mb-2">Carbon Estimation</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Carbon:</span>
                    <span className="font-semibold">
                      {(verificationData.carbonEstimate / 1000).toFixed(1)} tC
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">CO2 Equivalent:</span>
                    <span className="font-semibold">
                      {(verificationData.carbonEstimate * 1.467 / 1000).toFixed(1)} tCO2e
                    </span>
                  </div>
                </div>
              </Card>

              <Card className="border-border/30 bg-background/50 p-4">
                <p className="text-sm font-semibold mb-2">Vegetation Metrics</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">NDVI Score:</span>
                    <span className="font-semibold">{verificationData.ndvi.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Biomass (t/ha):</span>
                    <span className="font-semibold">{verificationData.biomassEstimate.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Health Score:</span>
                    <span className="font-semibold">{(verificationData.vegetationHealth * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="recommendations" className="space-y-3">
              {verificationData.recommendations.map((rec, idx) => (
                <Alert
                  key={idx}
                  className="border-emerald-500/30 bg-emerald-500/5"
                >
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <AlertDescription className="text-sm">{rec}</AlertDescription>
                </Alert>
              ))}
            </TabsContent>
          </Tabs>
        ) : null}

        {isIntegrated && verificationData && (
          <div className="flex gap-2 mt-6 pt-4 border-t border-border/30">
            <Button onClick={handleUseData} className="flex-1 gap-2" variant="default">
              <CheckCircle2 className="h-4 w-4" />
              Use This Data
            </Button>
            <Button onClick={handleReset} variant="outline" className="flex-1">
              Try Again
            </Button>
          </div>
        )}
      </Card>
    </div>
  )
}

export default SatelliteFormIntegration
