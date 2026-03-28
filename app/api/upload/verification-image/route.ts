import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { imageHelpers } from '@/lib/supabase-helpers'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const verificationId = formData.get('verificationId') as string
    const verificationType = formData.get('verificationType') as 'green_carbon' | 'blue_carbon' | 'renewable_energy'

    if (!file || !verificationId || !verificationType) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Generate unique filename
    const timestamp = Date.now()
    const filename = `${verificationId}/${timestamp}-${file.name}`
    const bucketPath = `verification-images/${verificationType}`

    // Upload to Supabase Storage
    const buffer = await file.arrayBuffer()
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketPath)
      .upload(filename, buffer, {
        contentType: file.type,
        cacheControl: '3600',
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json(
        { success: false, error: uploadError.message },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucketPath)
      .getPublicUrl(uploadData.path)

    // Save image metadata to database
    const imageRecord = await imageHelpers.uploadImage({
      verification_id: verificationId,
      verification_type: verificationType,
      image_url: urlData.publicUrl,
      storage_path: uploadData.path,
      image_type: file.type,
    })

    return NextResponse.json({
      success: true,
      data: {
        id: imageRecord.id,
        url: urlData.publicUrl,
        path: uploadData.path,
      },
      message: 'Image uploaded successfully',
    })
  } catch (error: any) {
    console.error('Error uploading image:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to upload image' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const verificationId = request.nextUrl.searchParams.get('verificationId')

    if (!verificationId) {
      return NextResponse.json(
        { success: false, error: 'Missing verificationId parameter' },
        { status: 400 }
      )
    }

    const images = await imageHelpers.getVerificationImages(verificationId)

    return NextResponse.json({
      success: true,
      data: images,
    })
  } catch (error: any) {
    console.error('Error fetching images:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch images' },
      { status: 500 }
    )
  }
}
