import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Add CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS(request: NextRequest) {
  return new Response(null, { status: 200, headers: corsHeaders })
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 TESTING DATABASE CONNECTION...')
    
    // Test with a model we know exists - QRCode
    const qrCodeCount = await prisma.qRCode.count()
    
    console.log('✅ DATABASE CONNECTION SUCCESS')
    console.log('📊 QR Code count:', qrCodeCount)
    
    return NextResponse.json({ 
      success: true,
      message: 'Database connection successful',
      qrCodeCount: qrCodeCount,
      availableModels: Object.keys(prisma).filter(key => !key.startsWith('_') && !key.startsWith('$'))
    }, { headers: corsHeaders })
    
  } catch (error) {
    console.error('❌ DATABASE TEST ERROR:', error)
    return NextResponse.json({ 
      error: 'Database connection failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { 
      status: 500, 
      headers: corsHeaders 
    })
  }
} 