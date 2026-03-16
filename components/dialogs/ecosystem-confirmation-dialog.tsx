'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, MapPin, CheckCircle2, AlertTriangle } from 'lucide-react'

interface EcosystemConfirmationProps {
  isOpen: boolean
  detectedType: 'terrestrial' | 'coastal' | 'marine'
  expectedType: 'terrestrial' | 'coastal'
  coordinates: string
  onConfirm: () => void
  onEdit: () => void
  onCancel: () => void
}

export function EcosystemConfirmationDialog({
  isOpen,
  detectedType,
  expectedType,
  coordinates,
  onConfirm,
  onEdit,
  onCancel,
}: EcosystemConfirmationProps) {
  if (!isOpen) return null

  const isCorrect = 
    (expectedType === 'terrestrial' && detectedType === 'terrestrial') ||
    (expectedType === 'coastal' && (detectedType === 'coastal' || detectedType === 'marine'))

  const getEcosystemLabel = (type: 'terrestrial' | 'coastal' | 'marine'): string => {
    switch (type) {
      case 'terrestrial':
        return 'Terrestrial Forest'
      case 'coastal':
        return 'Coastal/Mangrove'
      case 'marine':
        return 'Marine/Seagrass'
      default:
        return 'Unknown'
    }
  }

  const getEcosystemDescription = (type: 'terrestrial' | 'coastal' | 'marine'): string => {
    switch (type) {
      case 'terrestrial':
        return 'Upland forest areas with typical terrestrial vegetation'
      case 'coastal':
        return 'Mangrove forests and salt marshes in coastal zones'
      case 'marine':
        return 'Seagrass meadows and marine vegetation in shallow waters'
      default:
        return 'Unknown ecosystem type'
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl border-border/50 bg-card shadow-xl">
        <div className="p-8 space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              {isCorrect ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              )}
              <h2 className="text-2xl font-bold text-foreground">
                Ecosystem Type Verification
              </h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Confirm the detected ecosystem type based on your satellite data coordinates
            </p>
          </div>

          {/* Detection Results */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Detected Type */}
            <Card className="border-border/30 bg-card/50 p-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-semibold text-muted-foreground">Detected Ecosystem</span>
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground">{getEcosystemLabel(detectedType)}</p>
                  <p className="text-xs text-muted-foreground mt-2">{getEcosystemDescription(detectedType)}</p>
                </div>
              </div>
            </Card>

            {/* Project Type */}
            <Card className="border-border/30 bg-card/50 p-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-emerald-600" />
                  <span className="text-sm font-semibold text-muted-foreground">Project Type</span>
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground">
                    {expectedType === 'terrestrial' ? 'Green Carbon (Terrestrial)' : 'Blue Carbon (Coastal)'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {expectedType === 'terrestrial' 
                      ? 'Forest-based carbon sequestration' 
                      : 'Coastal ecosystem carbon sequestration'}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Coordinates */}
          <div className="p-4 bg-muted/50 rounded-lg border border-border/30">
            <p className="text-xs font-semibold text-muted-foreground mb-2">Project Location</p>
            <p className="text-sm font-mono text-foreground">{coordinates}</p>
          </div>

          {/* Status Message */}
          {isCorrect ? (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
              <div className="flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-emerald-900 dark:text-emerald-400">
                    Ecosystem Match Confirmed
                  </p>
                  <p className="text-sm text-emerald-800 dark:text-emerald-300 mt-1">
                    The detected ecosystem type matches your project. You can proceed with the satellite analysis.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-900 dark:text-amber-400">
                    Ecosystem Type Mismatch
                  </p>
                  <p className="text-sm text-amber-800 dark:text-amber-300 mt-1">
                    The detected ecosystem does not match your project type. Please verify your satellite data is from the correct location, or contact support if you believe this is an error.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={onCancel}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={onEdit}
              variant="outline"
              className="flex-1"
            >
              Upload Different Data
            </Button>
            <Button
              onClick={onConfirm}
              disabled={!isCorrect}
              className={`flex-1 ${isCorrect ? 'bg-emerald-600 hover:bg-emerald-700' : 'opacity-50 cursor-not-allowed'}`}
            >
              Continue with Analysis
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
