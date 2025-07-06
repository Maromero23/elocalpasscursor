import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { put } from '@vercel/blob'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const affiliateId = formData.get('affiliateId') as string
    const affiliateName = formData.get('affiliateName') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!affiliateId || !affiliateName) {
      return NextResponse.json({ error: 'Affiliate ID and name are required' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.' 
      }, { status: 400 })
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024 // 5MB in bytes
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'File too large. Maximum size is 5MB.' 
      }, { status: 400 })
    }

    // Create a clean filename
    const fileExtension = file.type.split('/')[1]
    const cleanName = affiliateName.replace(/[^a-zA-Z0-9-_]/g, '_').toLowerCase()
    const timestamp = Date.now()
    const filename = `logos/${cleanName}_${timestamp}.${fileExtension}`

    console.log(`📤 ADMIN: Uploading logo for ${affiliateName} (${affiliateId})`)
    console.log(`📁 Filename: ${filename}`)
    console.log(`📊 File size: ${(file.size / 1024).toFixed(2)} KB`)

    // Upload to Vercel Blob
    const blob = await put(filename, file, {
      access: 'public',
      addRandomSuffix: true, // Prevents filename conflicts
    })

    console.log(`✅ ADMIN: Logo uploaded successfully`)
    console.log(`🔗 Blob URL: ${blob.url}`)

    return NextResponse.json({
      success: true,
      url: blob.url,
      filename: filename,
      size: file.size,
      type: file.type,
      message: 'Logo uploaded successfully'
    })

  } catch (error) {
    console.error('❌ ADMIN: Error uploading logo:', error)
    return NextResponse.json(
      { error: 'Failed to upload logo' },
      { status: 500 }
    )
  }
} 