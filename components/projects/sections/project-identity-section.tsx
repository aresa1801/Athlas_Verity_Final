import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { MapPin } from 'lucide-react'

interface ProjectIdentitySectionProps {
  projectName: string
  organization: string
  country: string
  methodology: string
  validationErrors: Record<string, string>
  onProjectNameChange: (value: string) => void
  onOrganizationChange: (value: string) => void
  onCountryChange: (value: string) => void
  onMethodologyChange: (value: string) => void
}

const countryList = [
  { code: 'ID', name: 'Indonesia', flag: '🇮🇩' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
  { code: 'CM', name: 'Cameroon', flag: '🇨🇲' },
  { code: 'CD', name: 'Democratic Republic of Congo', flag: '🇨🇩' },
  { code: 'PE', name: 'Peru', flag: '🇵🇪' },
  { code: 'CO', name: 'Colombia', flag: '🇨🇴' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽' },
  { code: 'MY', name: 'Malaysia', flag: '🇲🇾' },
  { code: 'PH', name: 'Philippines', flag: '🇵🇭' },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬' },
]

export function ProjectIdentitySection({
  projectName,
  organization,
  country,
  methodology,
  validationErrors,
  onProjectNameChange,
  onOrganizationChange,
  onCountryChange,
  onMethodologyChange,
}: ProjectIdentitySectionProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-foreground mb-2 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-emerald-500" />
          Project Identity
        </h3>
        <p className="text-sm text-muted-foreground">Define your carbon verification project</p>
      </div>

      <div className="grid gap-4">
        <div>
          <Label htmlFor="projectName" className="text-foreground font-semibold">
            Project Name
          </Label>
          <Input
            id="projectName"
            placeholder="e.g., Amazon Reforestation Initiative"
            value={projectName}
            onChange={(e) => onProjectNameChange(e.target.value)}
            className="mt-2"
            aria-invalid={!!validationErrors.projectName}
          />
          {validationErrors.projectName && (
            <p className="text-xs text-red-500 mt-1">{validationErrors.projectName}</p>
          )}
        </div>

        <div>
          <Label htmlFor="organization" className="text-foreground font-semibold">
            Organization / Developer
          </Label>
          <Input
            id="organization"
            placeholder="Your organization name"
            value={organization}
            onChange={(e) => onOrganizationChange(e.target.value)}
            className="mt-2"
            aria-invalid={!!validationErrors.organization}
          />
          {validationErrors.organization && (
            <p className="text-xs text-red-500 mt-1">{validationErrors.organization}</p>
          )}
        </div>

        <div>
          <Label htmlFor="country" className="text-foreground font-semibold">
            Country
          </Label>
          <Select value={country} onValueChange={onCountryChange}>
            <SelectTrigger className="mt-2" aria-invalid={!!validationErrors.country}>
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent>
              {countryList.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {c.flag} {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {validationErrors.country && (
            <p className="text-xs text-red-500 mt-1">{validationErrors.country}</p>
          )}
        </div>

        <div>
          <Label htmlFor="methodology" className="text-foreground font-semibold">
            Methodology Reference
          </Label>
          <Select value={methodology} onValueChange={onMethodologyChange}>
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="verra">Verra VCS</SelectItem>
              <SelectItem value="gold">Gold Standard</SelectItem>
              <SelectItem value="pcer">PCR - Certified Emissions Reductions</SelectItem>
              <SelectItem value="ncs">Natural Climate Solutions</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card className="border-emerald-500/20 bg-emerald-500/5 p-4">
          <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-2">✓ Supported by</p>
          <p className="text-sm text-muted-foreground">NASA Landsat • JAXA ALOS PALSAR • Sentinel-2 AWS</p>
        </Card>
      </div>
    </div>
  )
}
