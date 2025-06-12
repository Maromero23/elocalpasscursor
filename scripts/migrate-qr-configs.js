const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function migrateQRConfigurations(localStorageData) {
  try {
    console.log('🔄 Starting QR Configuration migration to database...\n')
    
    if (!localStorageData || !localStorageData.savedConfigurations) {
      console.log('❌ No saved configurations found in provided data')
      return
    }
    
    const configurations = localStorageData.savedConfigurations
    console.log(`📊 Found ${configurations.length} configurations to migrate`)
    
    const migrationResults = []
    
    for (const config of configurations) {
      console.log(`\n🔧 Migrating: "${config.name}"`)
      console.log(`   📝 Description: ${config.description || 'No description'}`)
      console.log(`   🆔 Original ID: ${config.id}`)
      
      try {
        // Create saved configuration in database
        const savedConfig = await prisma.savedQRConfiguration.create({
          data: {
            name: config.name,
            description: config.description || '',
            config: JSON.stringify(config.config),
            emailTemplates: config.emailTemplates ? JSON.stringify(config.emailTemplates) : null,
            landingPageConfig: config.landingPageConfig ? JSON.stringify(config.landingPageConfig) : null,
            selectedUrlIds: config.selectedUrlIds ? JSON.stringify(config.selectedUrlIds) : null,
          }
        })
        
        migrationResults.push({
          oldId: config.id,
          newId: savedConfig.id,
          name: config.name,
          success: true
        })
        
        console.log(`   ✅ Migrated successfully - New ID: ${savedConfig.id}`)
        
      } catch (error) {
        console.log(`   ❌ Migration failed:`, error.message)
        migrationResults.push({
          oldId: config.id,
          name: config.name,
          success: false,
          error: error.message
        })
      }
    }
    
    console.log('\n📊 MIGRATION SUMMARY:')
    const successful = migrationResults.filter(r => r.success)
    const failed = migrationResults.filter(r => !r.success)
    
    console.log(`✅ Successfully migrated: ${successful.length}`)
    console.log(`❌ Failed migrations: ${failed.length}`)
    
    if (successful.length > 0) {
      console.log('\n🎯 ID MAPPING (OLD → NEW):')
      successful.forEach(result => {
        console.log(`   ${result.oldId} → ${result.newId} (${result.name})`)
      })
    }
    
    if (failed.length > 0) {
      console.log('\n❌ FAILED MIGRATIONS:')
      failed.forEach(result => {
        console.log(`   ${result.name}: ${result.error}`)
      })
    }
    
    return migrationResults
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

async function updateSellerPairings(migrationResults) {
  try {
    console.log('\n🔗 Updating seller configuration pairings...')
    
    // Find sellers with old configuration IDs that need to be updated
    const sellersToUpdate = await prisma.user.findMany({
      where: {
        role: 'SELLER',
        configurationId: { not: null }
      },
      select: {
        id: true,
        name: true,
        email: true,
        configurationId: true,
        configurationName: true
      }
    })
    
    console.log(`Found ${sellersToUpdate.length} sellers with configuration assignments`)
    
    for (const seller of sellersToUpdate) {
      console.log(`\n👤 Checking: ${seller.name} (${seller.email})`)
      console.log(`   Current config ID: ${seller.configurationId}`)
      console.log(`   Current config name: ${seller.configurationName}`)
      
      // Find matching migration result by old ID
      const migration = migrationResults.find(m => m.oldId === seller.configurationId && m.success)
      
      if (migration) {
        // Update seller to use new database configuration ID
        await prisma.user.update({
          where: { id: seller.id },
          data: {
            savedConfigId: migration.newId,
            // Keep legacy fields for backward compatibility
            configurationId: seller.configurationId,
            configurationName: seller.configurationName
          }
        })
        
        console.log(`   ✅ Updated to use database config: ${migration.newId}`)
      } else {
        console.log(`   ⚠️  No matching migration found - keeping legacy assignment`)
      }
    }
    
    console.log('\n🎉 Seller pairing updates completed!')
    
  } catch (error) {
    console.error('❌ Seller pairing update failed:', error)
    throw error
  }
}

// Function to be called with localStorage data
async function runMigration(localStorageData) {
  const migrationResults = await migrateQRConfigurations(localStorageData)
  if (migrationResults && migrationResults.some(r => r.success)) {
    await updateSellerPairings(migrationResults)
  }
  return migrationResults
}

module.exports = { migrateQRConfigurations, updateSellerPairings, runMigration }
