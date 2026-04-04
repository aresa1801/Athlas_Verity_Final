'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Download, X } from 'lucide-react'

interface PDFPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  projectName: string
  finalReduction: number
  integrityClass: string
  validatorConsensus: number
  onDownload: () => void
}

export function PDFPreviewModal({
  isOpen,
  onClose,
  projectName,
  finalReduction,
  integrityClass,
  validatorConsensus,
  onDownload,
}: PDFPreviewModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>PDF Validation Report Preview</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Report Header */}
          <div className="border-b pb-4">
            <h2 className="text-2xl font-bold text-green-600 mb-2">
              Athlas Verity Impact Verification & Carbon Reduction Report
            </h2>
            <p className="text-sm text-gray-500">Generated via Athlas Verity AI System</p>
          </div>

          {/* Project Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-gray-500">PROJECT NAME</p>
              <p className="text-lg font-bold text-green-600">{projectName}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500">CARBON OFFSET TYPE</p>
              <p className="text-lg font-bold">Green Carbon</p>
            </div>
          </div>

          {/* Verification Status */}
          <div className="bg-green-50 border border-green-200 rounded p-4">
            <p className="text-sm font-semibold text-green-700">✓ Verification Status: VERIFIED</p>
          </div>

          {/* Main Results */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 border-l-4 border-green-600 p-6 rounded">
            <p className="text-sm text-gray-600 mb-2">Final Verified CO₂ Reduction</p>
            <p className="text-4xl font-bold text-green-600 mb-2">{finalReduction.toLocaleString('en-US', { maximumFractionDigits: 2 })}</p>
            <p className="text-sm text-gray-600">tonnes CO₂ equivalent</p>
          </div>

          {/* Scores */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded">
              <p className="text-xs font-semibold text-gray-500 mb-1">INTEGRITY CLASS</p>
              <p className="text-2xl font-bold text-blue-600">{integrityClass}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <p className="text-xs font-semibold text-gray-500 mb-1">VALIDATOR CONSENSUS</p>
              <p className="text-2xl font-bold text-green-600">{validatorConsensus}%</p>
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <p className="text-xs font-semibold text-gray-500 mb-1">AURA SCORE</p>
              <p className="text-2xl font-bold text-purple-600">91%</p>
            </div>
          </div>

          {/* Validation Checks */}
          <div className="space-y-2">
            <p className="font-semibold text-sm text-gray-700">Validation Summary</p>
            <div className="grid grid-cols-1 gap-2">
              <p className="text-sm text-green-600">✓ Data Quality Check - Passed</p>
              <p className="text-sm text-green-600">✓ Satellite Imagery Verification - Passed</p>
              <p className="text-sm text-green-600">✓ Geospatial Consistency - Passed</p>
            </div>
          </div>

          {/* Report Info */}
          <div className="bg-gray-50 p-4 rounded text-xs text-gray-600 space-y-1">
            <p><strong>Report Type:</strong> 6-page Professional Validation Report</p>
            <p><strong>Sections:</strong> Project Info, Carbon Calculations, Verification Results, Vegetation Analysis, Validators, Disclaimer</p>
            <p><strong>Generated:</strong> {new Date().toLocaleDateString('en-US')}</p>
          </div>

          {/* Footer Text */}
          <div className="border-t pt-4 text-xs text-gray-500">
            <p>© 2025 Athlas Verity - Environmental Impact Verification Platform. All rights reserved.</p>
            <p>This document contains sensitive verification data. Please handle with appropriate confidentiality.</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose} className="gap-2">
            <X className="w-4 h-4" />
            Close Preview
          </Button>
          <Button
            onClick={onDownload}
            className="gap-2 bg-green-600 hover:bg-green-700"
          >
            <Download className="w-4 h-4" />
            Download PDF Report
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
