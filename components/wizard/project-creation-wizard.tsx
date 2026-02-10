"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ChevronRight, ChevronLeft, CheckCircle2 } from "lucide-react"

interface FormData {
  projectName: string
  description: string
  projectType: string
  country: string
  area: string
  startDate: string
  email: string
}

export function ProjectCreationWizard({ carbonType }: { carbonType: string }) {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<FormData>({
    projectName: "",
    description: "",
    projectType: carbonType,
    country: "",
    area: "",
    startDate: "",
    email: "",
  })

  const totalSteps = 4

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const getTypeColor = () => {
    switch (carbonType) {
      case "green-carbon":
        return "bg-emerald-500/10 text-emerald-700 border-emerald-500/20"
      case "blue-carbon":
        return "bg-blue-500/10 text-blue-700 border-blue-500/20"
      case "renewable-energy":
        return "bg-amber-500/10 text-amber-700 border-amber-500/20"
      default:
        return "bg-slate-500/10 text-slate-700 border-slate-500/20"
    }
  }

  const getTypeLabel = () => {
    switch (carbonType) {
      case "green-carbon":
        return "Green Carbon"
      case "blue-carbon":
        return "Blue Carbon"
      case "renewable-energy":
        return "Renewable Energy"
      default:
        return "Carbon Verification"
    }
  }

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Create Project</h2>
            <p className="text-sm text-muted-foreground mt-1">Step {currentStep} of {totalSteps}</p>
          </div>
          <Badge className={getTypeColor()}>{getTypeLabel()}</Badge>
        </div>
        <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-accent transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Step Content */}
      <Card className="border-border/50 bg-gradient-to-br from-card to-card/50 p-8">
        {currentStep === 1 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">Project Information</h3>
              <p className="text-sm text-muted-foreground mb-6">Tell us about your carbon project</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="projectName">Project Name</Label>
                <Input
                  id="projectName"
                  placeholder="e.g., Amazon Reforestation Initiative"
                  value={formData.projectName}
                  onChange={(e) => handleInputChange("projectName", e.target.value)}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="description">Project Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your project's objectives and scope..."
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  className="mt-2 min-h-24"
                />
              </div>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">Location & Size</h3>
              <p className="text-sm text-muted-foreground mb-6">Specify project location and area</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="country">Country</Label>
                <Select value={formData.country} onValueChange={(value) => handleInputChange("country", value)}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="brazil">Brazil</SelectItem>
                    <SelectItem value="indonesia">Indonesia</SelectItem>
                    <SelectItem value="congo">Democratic Republic of Congo</SelectItem>
                    <SelectItem value="peru">Peru</SelectItem>
                    <SelectItem value="cameroon">Cameroon</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="area">Project Area</Label>
                <Input
                  id="area"
                  placeholder="e.g., 45,230 Ha or 250 MW"
                  value={formData.area}
                  onChange={(e) => handleInputChange("area", e.target.value)}
                  className="mt-2"
                />
              </div>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">Timeline</h3>
              <p className="text-sm text-muted-foreground mb-6">Project dates and milestones</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="startDate">Project Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange("startDate", e.target.value)}
                  className="mt-2"
                />
              </div>

              <div className="p-4 rounded-lg bg-accent/5 border border-accent/10">
                <p className="text-sm text-muted-foreground">
                  Verification will begin immediately after project creation. Expected completion: 5-7 business days.
                </p>
              </div>
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">Contact Information</h3>
              <p className="text-sm text-muted-foreground mb-6">How can we reach you?</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="mt-2"
                />
              </div>

              <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20 flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-emerald-700">Ready to submit</p>
                  <p className="text-xs text-emerald-600/80 mt-1">
                    Review all information before final submission
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-4">
        <Button
          variant="outline"
          onClick={handlePrev}
          disabled={currentStep === 1}
          className="gap-2 bg-transparent"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </Button>

        {currentStep < totalSteps ? (
          <Button
            onClick={handleNext}
            disabled={
              (currentStep === 1 && (!formData.projectName || !formData.description)) ||
              (currentStep === 2 && (!formData.country || !formData.area)) ||
              (currentStep === 3 && !formData.startDate)
            }
            className="gap-2"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button className="gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Submit Project
          </Button>
        )}
      </div>
    </div>
  )
}
