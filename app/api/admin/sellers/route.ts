import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sellers = await prisma.user.findMany({
      where: { role: 'SELLER' },
      select: {
        id: true,
        name: true,
        email: true
      },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json({ sellers })

  } catch (error) {
    console.error('Error fetching sellers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sellers' },
      { status: 500 }
    )
  }
}
