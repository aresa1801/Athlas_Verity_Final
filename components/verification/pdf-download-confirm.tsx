import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Download, Sun, Moon, X } from 'lucide-react'

interface PDFDownloadConfirmProps {
  isOpen: boolean
  onClose: () => void
  onDownload: (theme: 'light' | 'dark') => void
  projectName: string
  isLoading?: boolean
}

export function PDFDownloadConfirm({
  isOpen,
  onClose,
  onDownload,
  projectName,
  isLoading = false,
}: PDFDownloadConfirmProps) {
  const [selectedTheme, setSelectedTheme] = useState<'light' | 'dark'>('light')

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg bg-background border-2 border-primary shadow-xl">
        <div className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">Download Validation Report</h2>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="text-foreground/60 hover:text-foreground transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Project Info */}
          <div className="mb-8 p-4 bg-foreground/5 rounded-lg border border-foreground/10">
            <p className="text-sm text-foreground/60 mb-2">Project</p>
            <p className="text-lg font-semibold text-foreground">{projectName}</p>
          </div>

          {/* Theme Selection */}
          <div className="mb-8">
            <p className="text-sm font-semibold text-foreground mb-4">Select PDF Theme</p>
            <div className="grid grid-cols-2 gap-4">
              {/* Light Theme */}
              <button
                onClick={() => setSelectedTheme('light')}
                disabled={isLoading}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedTheme === 'light'
                    ? 'border-primary bg-primary/10'
                    : 'border-foreground/20 hover:border-foreground/40'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <div className="flex flex-col items-center gap-3">
                  <Sun className={`w-8 h-8 ${selectedTheme === 'light' ? 'text-primary' : 'text-foreground/60'}`} />
                  <span className={`font-medium text-sm ${selectedTheme === 'light' ? 'text-primary' : 'text-foreground'}`}>
                    Light Mode
                  </span>
                  <span className="text-xs text-foreground/60">Professional white background</span>
                </div>
              </button>

              {/* Dark Theme */}
              <button
                onClick={() => setSelectedTheme('dark')}
                disabled={isLoading}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedTheme === 'dark'
                    ? 'border-primary bg-primary/10'
                    : 'border-foreground/20 hover:border-foreground/40'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <div className="flex flex-col items-center gap-3">
                  <Moon className={`w-8 h-8 ${selectedTheme === 'dark' ? 'text-primary' : 'text-foreground/60'}`} />
                  <span className={`font-medium text-sm ${selectedTheme === 'dark' ? 'text-primary' : 'text-foreground'}`}>
                    Dark Mode
                  </span>
                  <span className="text-xs text-foreground/60">Dark sophisticated design</span>
                </div>
              </button>
            </div>
          </div>

          {/* Description */}
          <div className="mb-8 p-4 bg-foreground/5 rounded-lg border border-foreground/10">
            <p className="text-sm text-foreground/70">
              Your PDF will include all project information, carbon calculations, verification results, vegetation analysis, 
              and validator information formatted with professional tables and charts.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={onClose}
              variant="outline"
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={() => onDownload(selectedTheme)}
              disabled={isLoading}
              className="flex-1 bg-primary hover:bg-primary/90 text-white gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Download PDF
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
