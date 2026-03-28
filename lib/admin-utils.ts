import {
  greenCarbonHelpers,
  blueCarbonHelpers,
  renewableEnergyHelpers,
  adminReviewHelpers,
  catalogHelpers,
  imageHelpers
} from './supabase-helpers'

export type VerificationType = 'green_carbon' | 'blue_carbon' | 'renewable_energy'
export type VerificationStatus = 'submitted' | 'review' | 'pending' | 'approved' | 'rejected'

// Get the appropriate helper based on verification type
export function getVerificationHelper(type: VerificationType) {
  switch (type) {
    case 'green_carbon':
      return greenCarbonHelpers
    case 'blue_carbon':
      return blueCarbonHelpers
    case 'renewable_energy':
      return renewableEnergyHelpers
  }
}

// Admin Review Workflow
export const adminWorkflow = {
  // Move submission to review status
  async startReview(verificationId: string, type: VerificationType, adminId: string) {
    const helper = getVerificationHelper(type)
    
    // Update status to review
    await helper.updateStatus(verificationId, 'review')
    
    // Add review history
    await adminReviewHelpers.addReview({
      verification_id: verificationId,
      verification_type: type,
      admin_id: adminId,
      action: 'review_started'
    })
  },

  // Set submission to pending (needs more info)
  async setPending(verificationId: string, type: VerificationType, adminId: string, comments: string) {
    const helper = getVerificationHelper(type)
    
    await helper.updateStatus(verificationId, 'pending')
    
    await adminReviewHelpers.addReview({
      verification_id: verificationId,
      verification_type: type,
      admin_id: adminId,
      action: 'marked_pending',
      comments
    })
  },

  // Approve and add to catalog
  async approve(
    verificationId: string,
    type: VerificationType,
    adminId: string,
    catalogEntry: Omit<Parameters<typeof catalogHelpers.addToCatalog>[0], 'verification_id' | 'verification_type'>
  ) {
    const helper = getVerificationHelper(type)
    
    // Get the verification details
    const verification = await helper.getSubmission(verificationId)
    
    // Update status to approved
    await helper.updateStatus(verificationId, 'approved')
    
    // Add to catalog
    const catalogData = {
      ...catalogEntry,
      verification_id: verificationId,
      verification_type: type
    }
    
    await catalogHelpers.addToCatalog(catalogData as any)
    
    // Record approval in history
    await adminReviewHelpers.addReview({
      verification_id: verificationId,
      verification_type: type,
      admin_id: adminId,
      action: 'approved',
      comments: 'Project approved and added to verified catalog'
    })
    
    return { verification, catalog: catalogData }
  },

  // Reject submission
  async reject(verificationId: string, type: VerificationType, adminId: string, reason: string) {
    const helper = getVerificationHelper(type)
    
    await helper.updateStatus(verificationId, 'rejected')
    
    await adminReviewHelpers.addReview({
      verification_id: verificationId,
      verification_type: type,
      admin_id: adminId,
      action: 'rejected',
      comments: reason
    })
  }
}

// Statistics and Analytics helpers
export const adminAnalytics = {
  async getSubmissionStats() {
    // Get counts by status across all types
    const stats = {
      total: 0,
      submitted: 0,
      review: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      byType: {
        green_carbon: { total: 0, approved: 0 },
        blue_carbon: { total: 0, approved: 0 },
        renewable_energy: { total: 0, approved: 0 }
      }
    }
    
    return stats
  },

  async getCatalogStats() {
    const catalog = await catalogHelpers.getAllCatalogEntries()
    
    const stats = {
      total: catalog.length,
      byType: {
        green_carbon: catalog.filter(c => c.verification_type === 'green_carbon').length,
        blue_carbon: catalog.filter(c => c.verification_type === 'blue_carbon').length,
        renewable_energy: catalog.filter(c => c.verification_type === 'renewable_energy').length
      },
      totalCarbonil: catalog.reduce((sum, c) => sum + (c.co2_avoided_tonnes || 0), 0),
      totalEnergy: catalog.reduce((sum, c) => sum + (c.energy_generated_mwh || 0), 0)
    }
    
    return stats
  }
}

// Data Export helpers
export const adminExport = {
  exportToCSV(data: any[], filename: string) {
    if (!data || data.length === 0) return
    
    // Get headers from first object
    const headers = Object.keys(data[0])
    
    // Create CSV content
    let csv = headers.join(',') + '\n'
    
    data.forEach(row => {
      const values = headers.map(header => {
        const value = row[header]
        // Escape quotes and wrap in quotes if contains comma
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value
      })
      csv += values.join(',') + '\n'
    })
    
    // Download
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}.csv`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }
}

// Status badge colors and labels
export const statusConfig = {
  submitted: {
    label: 'Submitted',
    color: 'bg-blue-100 text-blue-800',
    icon: 'Send'
  },
  review: {
    label: 'In Review',
    color: 'bg-yellow-100 text-yellow-800',
    icon: 'Clock'
  },
  pending: {
    label: 'Pending',
    color: 'bg-orange-100 text-orange-800',
    icon: 'AlertCircle'
  },
  approved: {
    label: 'Approved',
    color: 'bg-green-100 text-green-800',
    icon: 'CheckCircle'
  },
  rejected: {
    label: 'Rejected',
    color: 'bg-red-100 text-red-800',
    icon: 'XCircle'
  }
} as const

// Verification type labels and colors
export const typeConfig = {
  green_carbon: {
    label: 'Green Carbon',
    color: 'bg-emerald-100 text-emerald-800',
    description: 'Forest and terrestrial carbon sequestration'
  },
  blue_carbon: {
    label: 'Blue Carbon',
    color: 'bg-cyan-100 text-cyan-800',
    description: 'Coastal and marine ecosystem carbon'
  },
  renewable_energy: {
    label: 'Renewable Energy',
    color: 'bg-amber-100 text-amber-800',
    description: 'Renewable energy generation projects'
  }
} as const
