import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

// GET all saved configurations
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }
    
    const savedConfigs = await prisma.savedQRConfiguration.findMany({
      include: {
        assignedUsers: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    // Parse JSON strings back to objects
    const parsedConfigs = savedConfigs.map(config => ({
      ...config,
      config: JSON.parse(config.config),
      emailTemplates: config.emailTemplates ? JSON.parse(config.emailTemplates) : null,
      landingPageConfig: config.landingPageConfig ? JSON.parse(config.landingPageConfig) : null,
      selectedUrlIds: config.selectedUrlIds ? JSON.parse(config.selectedUrlIds) : null,
    }))
    
    return NextResponse.json(parsedConfigs)
    
  } catch (error) {
    console.error('Error fetching saved configurations:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST create new saved configuration
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }
    
    const body = await request.json()
    const { id, name, description, config, emailTemplates, landingPageConfig, selectedUrlIds } = body
    
    if (!name || !config) {
      return NextResponse.json({ error: 'Name and config are required' }, { status: 400 })
    }

    // Process email templates - copy default template if USE_DEFAULT_TEMPLATE is selected
    let processedEmailTemplates = emailTemplates
    if (emailTemplates?.welcomeEmail?.customHTML === 'USE_DEFAULT_TEMPLATE') {
      console.log('📧 COPY DEFAULT: USE_DEFAULT_TEMPLATE detected, copying current default template')
      
      try {
        // Get the current default template from database
        const defaultTemplate = await prisma.welcomeEmailTemplate.findFirst({
          where: { isDefault: true }
        })
        
        if (defaultTemplate && defaultTemplate.customHTML) {
          console.log('📧 COPY DEFAULT: Found default template, copying HTML content')
          
          // Copy the default template content to this configuration
          processedEmailTemplates = {
            ...emailTemplates,
            welcomeEmail: {
              ...emailTemplates.welcomeEmail,
              customHTML: defaultTemplate.customHTML,
              subject: emailTemplates.welcomeEmail.subject || defaultTemplate.subject
            }
          }
          
          console.log('📧 COPY DEFAULT: Successfully copied default template content')
        } else {
          console.log('⚠️ COPY DEFAULT: No default template found, keeping USE_DEFAULT_TEMPLATE')
        }
      } catch (error) {
        console.error('❌ COPY DEFAULT: Error copying default template:', error)
        // Keep original emailTemplates if copying fails
      }
    }
    
    // Create new saved configuration (with custom ID if provided for migration)
          const createData: any = {
        name,
        description: description || '',
        config: JSON.stringify(config),
        emailTemplates: processedEmailTemplates ? JSON.stringify(processedEmailTemplates) : null,
        landingPageConfig: landingPageConfig ? JSON.stringify(landingPageConfig) : null,
        selectedUrlIds: selectedUrlIds ? JSON.stringify(selectedUrlIds) : null,
      }
    
    // If custom ID is provided (for migration), use it
    if (id) {
      createData.id = id
    }
    
    const savedConfig = await prisma.savedQRConfiguration.create({
      data: createData
    })
    
    return NextResponse.json({
      ...savedConfig,
      config: JSON.parse(savedConfig.config),
      emailTemplates: savedConfig.emailTemplates ? JSON.parse(savedConfig.emailTemplates) : null,
      landingPageConfig: savedConfig.landingPageConfig ? JSON.parse(savedConfig.landingPageConfig) : null,
      selectedUrlIds: savedConfig.selectedUrlIds ? JSON.parse(savedConfig.selectedUrlIds) : null,
    })
    
  } catch (error) {
    console.error('Error creating saved configuration:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE multiple saved configurations (bulk delete)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }
    
    const body = await request.json()
    const { configIds } = body
    
    if (!configIds || !Array.isArray(configIds) || configIds.length === 0) {
      return NextResponse.json({ error: 'Configuration IDs are required' }, { status: 400 })
    }
    
    console.log('🗑️ BULK DELETE: Deleting configurations:', configIds)
    
    // First unassign all users from these configurations
    // Clear all configuration-related fields to completely unpair sellers
    await prisma.user.updateMany({
      where: { savedConfigId: { in: configIds } },
      data: { 
        savedConfigId: null,
        configurationId: null,
        configurationName: null
      }
    })
    
    // Then delete the configurations
    const deleteResult = await prisma.savedQRConfiguration.deleteMany({
      where: { id: { in: configIds } }
    })
    
    console.log('✅ BULK DELETE: Successfully deleted', deleteResult.count, 'configurations')
    
    return NextResponse.json({ 
      success: true, 
      deletedCount: deleteResult.count 
    })
    
  } catch (error) {
    console.error('Error bulk deleting saved configurations:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
