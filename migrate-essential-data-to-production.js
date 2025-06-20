#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

// Two Prisma clients - one for local SQLite, one for Supabase
const localPrisma = new PrismaClient({
  datasources: {
    db: {
      url: "file:./prisma/dev.db"
    }
  }
});

const supabasePrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function migrateEssentialData() {
  try {
    console.log('🚀 Starting Essential Data Migration to Supabase...\n');

    // Step 1: Create Admin User
    console.log('👤 Creating admin user...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const adminUser = await supabasePrisma.user.create({
      data: {
        email: 'admin@elocalpass.com',
        password: hashedPassword,
        name: 'System Administrator',
        role: 'ADMIN',
        isActive: true
      }
    });
    console.log('✅ Admin user created:', adminUser.email);

    // Step 2: Migrate Distributors
    console.log('\n📊 Migrating distributors...');
    const localDistributors = await localPrisma.distributor.findMany({
      include: { user: true }
    });

    for (const dist of localDistributors) {
      // Create distributor user if needed
      let distributorUser = null;
      if (dist.user) {
        const hashedDistPassword = await bcrypt.hash('distributor123', 10);
        distributorUser = await supabasePrisma.user.create({
          data: {
            email: dist.user.email,
            password: hashedDistPassword,
            name: dist.user.name,
            role: 'DISTRIBUTOR',
            isActive: dist.user.isActive,
            telephone: dist.user.telephone,
            whatsapp: dist.user.whatsapp,
            notes: dist.user.notes
          }
        });
      }

      // Create distributor
      const newDistributor = await supabasePrisma.distributor.create({
        data: {
          id: dist.id,
          name: dist.name,
          contactPerson: dist.contactPerson,
          email: dist.email,
          telephone: dist.telephone,
          whatsapp: dist.whatsapp,
          notes: dist.notes,
          isActive: dist.isActive,
          userId: distributorUser?.id
        }
      });
      console.log(`✅ Migrated distributor: ${newDistributor.name}`);
    }

    // Step 3: Migrate Locations
    console.log('\n🏢 Migrating locations...');
    const localLocations = await localPrisma.location.findMany({
      include: { user: true }
    });

    for (const loc of localLocations) {
      // Create location user if needed
      let locationUser = null;
      if (loc.user) {
        const hashedLocPassword = await bcrypt.hash('location123', 10);
        locationUser = await supabasePrisma.user.create({
          data: {
            email: loc.user.email,
            password: hashedLocPassword,
            name: loc.user.name,
            role: 'LOCATION',
            isActive: loc.user.isActive,
            telephone: loc.user.telephone,
            whatsapp: loc.user.whatsapp,
            notes: loc.user.notes
          }
        });
      }

      // Create location
      const newLocation = await supabasePrisma.location.create({
        data: {
          id: loc.id,
          name: loc.name,
          contactPerson: loc.contactPerson,
          email: loc.email,
          telephone: loc.telephone,
          whatsapp: loc.whatsapp,
          notes: loc.notes,
          isActive: loc.isActive,
          distributorId: loc.distributorId,
          userId: locationUser?.id
        }
      });
      console.log(`✅ Migrated location: ${newLocation.name}`);
    }

    // Step 4: Migrate Sellers
    console.log('\n👥 Migrating sellers...');
    const localSellers = await localPrisma.user.findMany({
      where: { role: 'SELLER' }
    });

    for (const seller of localSellers) {
      const hashedSellerPassword = await bcrypt.hash('seller123', 10);
      
      const newSeller = await supabasePrisma.user.create({
        data: {
          email: seller.email,
          password: hashedSellerPassword,
          name: seller.name,
          role: 'SELLER',
          isActive: seller.isActive,
          telephone: seller.telephone,
          whatsapp: seller.whatsapp,
          notes: seller.notes,
          locationId: seller.locationId,
          distributorId: seller.distributorId,
          configurationId: seller.configurationId,
          configurationName: seller.configurationName,
          savedConfigId: seller.savedConfigId
        }
      });
      console.log(`✅ Migrated seller: ${newSeller.name} (${newSeller.email})`);
    }

    // Step 5: Migrate Saved QR Configurations
    console.log('\n⚙️ Migrating saved QR configurations...');
    const localConfigs = await localPrisma.savedQRConfiguration.findMany();

    for (const config of localConfigs) {
      const newConfig = await supabasePrisma.savedQRConfiguration.create({
        data: {
          id: config.id,
          name: config.name,
          defaultGuests: config.defaultGuests,
          defaultDays: config.defaultDays,
          button1Text: config.button1Text,
          button1DeliveryMethod: config.button1DeliveryMethod,
          button2Text: config.button2Text,
          button2DeliveryMethod: config.button2DeliveryMethod,
          button3Text: config.button3Text,
          button3DeliveryMethod: config.button3DeliveryMethod,
          button4Text: config.button4Text,
          button4DeliveryMethod: config.button4DeliveryMethod,
          button5Text: config.button5Text,
          button5DeliveryMethod: config.button5DeliveryMethod,
          welcomeEmailSubject: config.welcomeEmailSubject,
          welcomeEmailBody: config.welcomeEmailBody,
          isActive: config.isActive,
          createdAt: config.createdAt,
          updatedAt: config.updatedAt
        }
      });
      console.log(`✅ Migrated config: ${newConfig.name}`);
    }

    // Step 6: Summary
    console.log('\n📊 Migration Summary:');
    const counts = await Promise.all([
      supabasePrisma.user.count(),
      supabasePrisma.distributor.count(),
      supabasePrisma.location.count(),
      supabasePrisma.savedQRConfiguration.count()
    ]);

    console.log(`👥 Users: ${counts[0]}`);
    console.log(`📊 Distributors: ${counts[1]}`);
    console.log(`🏢 Locations: ${counts[2]}`);
    console.log(`⚙️ Saved Configs: ${counts[3]}`);

    console.log('\n🎉 Migration completed successfully!');
    console.log('\n🔐 Login Credentials for Production:');
    console.log('Admin: admin@elocalpass.com / admin123');
    console.log('Distributors: [original-email] / distributor123');
    console.log('Locations: [original-email] / location123');
    console.log('Sellers: [original-email] / seller123');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await localPrisma.$disconnect();
    await supabasePrisma.$disconnect();
  }
}

migrateEssentialData(); 