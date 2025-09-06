import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

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
    console.log('🔍 CHECKING EXISTING SELLERS...')
    
    // Get first few sellers
    const sellers = await prisma.user.findMany({
      where: {
        role: 'SELLER'
      },
      take: 5,
      select: {
        id: true,
        email: true,
        name: true
      }
    })
    
    console.log('✅ FOUND SELLERS:', sellers)
    
    return NextResponse.json({ 
      success: true,
      sellers: sellers,
      count: sellers.length
    }, { headers: corsHeaders })
    
  } catch (error) {
    console.error('❌ CHECK SELLERS ERROR:', error)
    return NextResponse.json({ 
      error: 'Failed to check sellers',
      details: error instanceof Error ? error.message : 'Unknown error'
    } finally {
    await prisma.$disconnect()
  }, { 
      status: 500, 
      headers: corsHeaders 
    })
  }
} 