import { NextRequest, NextResponse } from 'next/server'
import { qrConfigurations } from '../../../../../lib/qr-storage'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../auth/[...nextauth]/route'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { qrId, configData } = await request.json()

    if (!qrId || !configData) {
      return NextResponse.json(
        { error: 'QR ID and config data are required' },
        { status: 400 }
      )
    }

    console.log(`🔄 Updating qrConfigurations Map for QR ID: ${qrId}`)
    console.log(`🔄 New config data:`, configData)

    // Get existing config from Map or create new one
    const existingConfig = qrConfigurations.get(qrId) || {}
    
    // Update the config with new data
    const updatedConfig = {
      ...existingConfig,
      ...configData,
      updatedAt: new Date().toISOString()
    }

    // Update the Map
    qrConfigurations.set(qrId, updatedConfig)

    console.log(`✅ Successfully updated qrConfigurations Map for ${qrId}`)
    console.log(`✅ Updated config:`, updatedConfig)

    return NextResponse.json({ 
      success: true, 
      message: 'QR configuration Map updated successfully',
      qrId,
      updatedConfig
    })

  } catch (error) {
    console.error('Error updating qrConfigurations Map:', error)
    return NextResponse.json(
      { error: 'Failed to update QR configuration Map' },
      { status: 500 }
    )
  }
} 