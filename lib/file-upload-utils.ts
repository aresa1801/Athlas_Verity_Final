export type VerificationType = 'green_carbon' | 'blue_carbon' | 'renewable_energy'

export interface UploadResponse {
  success: boolean
  data?: {
    id: string
    url: string
    path: string
  }
  error?: string
  message?: string
}

export interface ImageMetadata {
  id: string
  verification_id: string
  verification_type: VerificationType
  image_url: string
  storage_path: string
  image_type: string | null
  uploaded_at: string
}

/**
 * Upload a verification image to Supabase Storage
 */
export async function uploadVerificationImage(
  file: File,
  verificationId: string,
  verificationType: VerificationType
): Promise<UploadResponse> {
  try {
    // Validate file
    if (!file) {
      return { success: false, error: 'No file provided' }
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return { success: false, error: 'File size exceeds 10MB limit' }
    }

    // Check file type (only images)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return { success: false, error: 'Invalid file type. Only images are allowed' }
    }

    // Create FormData
    const formData = new FormData()
    formData.append('file', file)
    formData.append('verificationId', verificationId)
    formData.append('verificationType', verificationType)

    // Upload to API
    const response = await fetch('/api/upload/verification-image', {
      method: 'POST',
      body: formData,
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Failed to upload image',
      }
    }

    return {
      success: true,
      data: data.data,
      message: data.message,
    }
  } catch (error: any) {
    console.error('Error uploading file:', error)
    return {
      success: false,
      error: error.message || 'Error uploading file',
    }
  }
}

/**
 * Delete a verification image
 */
export async function deleteVerificationImage(imageId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/upload/verification-image?imageId=${imageId}`, {
      method: 'DELETE',
    })

    return response.ok
  } catch (error) {
    console.error('Error deleting image:', error)
    return false
  }
}

/**
 * Fetch all images for a verification
 */
export async function fetchVerificationImages(verificationId: string): Promise<ImageMetadata[]> {
  try {
    const response = await fetch(`/api/upload/verification-image?verificationId=${verificationId}`)
    const data = await response.json()

    if (data.success) {
      return data.data || []
    }
    return []
  } catch (error) {
    console.error('Error fetching images:', error)
    return []
  }
}

/**
 * Generate a preview URL for an image
 */
export function getImagePreviewUrl(imageUrl: string, width: number = 200): string {
  // If the image URL supports transformation parameters, add them
  // This is a basic implementation - adjust based on your Supabase Storage setup
  return imageUrl
}

/**
 * Validate image file before upload
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Please upload an image (JPEG, PNG, WebP, or GIF)',
    }
  }

  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024
  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'File size exceeds 10MB limit',
    }
  }

  // Check dimensions (optional - load image to verify)
  return { valid: true }
}

/**
 * Batch upload multiple images
 */
export async function batchUploadImages(
  files: File[],
  verificationId: string,
  verificationType: VerificationType,
  onProgress?: (index: number, total: number) => void
): Promise<UploadResponse[]> {
  const results: UploadResponse[] = []

  for (let i = 0; i < files.length; i++) {
    const result = await uploadVerificationImage(files[i], verificationId, verificationType)
    results.push(result)
    onProgress?.(i + 1, files.length)
  }

  return results
}
