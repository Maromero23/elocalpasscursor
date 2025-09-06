import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

// GET single saved configuration
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const savedConfig = await prisma.savedQRConfiguration.findUnique({
      where: { id: params.id },
      include: {
        assignedUsers: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })
    
    if (!savedConfig) {
      return NextResponse.json({ error: 'Configuration not found' }, { status: 404 })
    }
    
    // Parse JSON strings back to objects
    const parsedConfig = {
      ...savedConfig,
      config: JSON.parse(savedConfig.config),
      emailTemplates: savedConfig.emailTemplates ? JSON.parse(savedConfig.emailTemplates) : null,
      landingPageConfig: savedConfig.landingPageConfig ? JSON.parse(savedConfig.landingPageConfig) : null,
      selectedUrlIds: savedConfig.selectedUrlIds ? JSON.parse(savedConfig.selectedUrlIds) : null,
    }
    
    // Set cache headers to prevent stale data when content is edited
    const response = NextResponse.json(parsedConfig)
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    return response
    
  } catch (error) {
    console.error('Error fetching saved configuration:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// PUT update saved configuration
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await request.json()
    const { name, description, config, emailTemplates, landingPageConfig, selectedUrlIds } = body
    
    // Check if configuration exists
    const existingConfig = await prisma.savedQRConfiguration.findUnique({
      where: { id: params.id }
    })
    
    if (!existingConfig) {
      return NextResponse.json({ error: 'Configuration not found' }, { status: 404 })
    }

    // Process email templates - copy default template if USE_DEFAULT_TEMPLATE is selected
    let processedEmailTemplates = emailTemplates
    if (emailTemplates?.welcomeEmail?.customHTML === 'USE_DEFAULT_TEMPLATE') {
      console.log('📧 COPY DEFAULT: USE_DEFAULT_TEMPLATE detected in update, copying current default template')
      
      try {
        // Get the current default template from database
        const defaultTemplate = await prisma.welcomeEmailTemplate.findFirst({
          where: { isDefault: true },
          orderBy: { createdAt: 'desc' } // Get the NEWEST default template
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
    
    // Update the configuration
    const updatedConfig = await prisma.savedQRConfiguration.update({
      where: { id: params.id },
      data: {
        name: name || existingConfig.name,
        description: description || existingConfig.description,
        config: config ? JSON.stringify(config) : existingConfig.config,
        emailTemplates: processedEmailTemplates ? JSON.stringify(processedEmailTemplates) : existingConfig.emailTemplates,
        landingPageConfig: landingPageConfig ? JSON.stringify(landingPageConfig) : existingConfig.landingPageConfig,
        selectedUrlIds: selectedUrlIds ? JSON.stringify(selectedUrlIds) : existingConfig.selectedUrlIds,
        updatedAt: new Date()
      },
      include: {
        assignedUsers: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })
    
    // Parse JSON strings back to objects for response
    const parsedConfig = {
      ...updatedConfig,
      config: JSON.parse(updatedConfig.config),
      emailTemplates: updatedConfig.emailTemplates ? JSON.parse(updatedConfig.emailTemplates) : null,
      landingPageConfig: updatedConfig.landingPageConfig ? JSON.parse(updatedConfig.landingPageConfig) : null,
      selectedUrlIds: updatedConfig.selectedUrlIds ? JSON.parse(updatedConfig.selectedUrlIds) : null,
    }
    
    // Set cache headers to ensure updated data is immediately available
    const response = NextResponse.json(parsedConfig)
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    return response
    
  } catch (error) {
    console.error('Error updating saved configuration:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// DELETE saved configuration
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }
    
    // First unassign all users from this configuration
    // Clear all configuration-related fields to completely unpair sellers
    await prisma.user.updateMany({
      where: { savedConfigId: params.id },
      data: { 
        savedConfigId: null,
        configurationId: null,
        configurationName: null
      }
    })
    
    // Then delete the configuration
    await prisma.savedQRConfiguration.delete({
      where: { id: params.id }
    })
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Error deleting saved configuration:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
