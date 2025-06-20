const { PrismaClient } = require('@prisma/client');

// Create two Prisma clients - one for local SQLite, one for Supabase
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
      url: "postgresql://postgres:basededatos23@db.jthbuhmygodmzjbhoplo.supabase.co:5432/postgres"
    }
  }
});

const migrateEssentialData = async () => {
  console.log('🚀 Starting migration of essential data to Supabase for production testing...\n');

  try {
    // Connect to both databases
    await localPrisma.$connect();
    await supabasePrisma.$connect();
    console.log('✅ Connected to both databases\n');

    // 1. Migrate Admin User
    console.log('👤 Migrating admin user...');
    const adminUser = await localPrisma.user.findFirst({
      where: { email: 'admin@elocalpass.com' }
    });
    
    if (adminUser) {
      await supabasePrisma.user.upsert({
        where: { email: adminUser.email },
        update: adminUser,
        create: adminUser
      });
      console.log('✅ Admin user migrated');
    } else {
      // Create admin user if not exists
      await supabasePrisma.user.upsert({
        where: { email: 'admin@elocalpass.com' },
        update: {},
        create: {
          id: 'admin_production_v223',
          email: 'admin@elocalpass.com',
          password: '$2a$12$LQv3c1yqBwlVHpPjreuYUOh4XzL5EkpC69nivHmA8Ft6eCdHDcws2',
          name: 'Admin User',
          role: 'ADMIN',
          isActive: true
        }
      });
      console.log('✅ Admin user created');
    }

    // 2. Migrate one test distributor for email testing
    console.log('\n🏢 Migrating test distributor...');
    const testDistributor = await localPrisma.distributor.findFirst({
      include: { user: true }
    });
    
    if (testDistributor) {
      // First migrate the user
      await supabasePrisma.user.upsert({
        where: { email: testDistributor.user.email },
        update: testDistributor.user,
        create: testDistributor.user
      });
      
      // Then migrate the distributor
      await supabasePrisma.distributor.upsert({
        where: { id: testDistributor.id },
        update: {
          name: testDistributor.name,
          contactPerson: testDistributor.contactPerson,
          email: testDistributor.email,
          telephone: testDistributor.telephone,
          whatsapp: testDistributor.whatsapp,
          notes: testDistributor.notes,
          isActive: testDistributor.isActive
        },
        create: testDistributor
      });
      console.log(`✅ Distributor migrated: ${testDistributor.name}`);
    }

    // 3. Migrate one test location
    console.log('\n📍 Migrating test location...');
    const testLocation = await localPrisma.location.findFirst({
      include: { user: true }
    });
    
    if (testLocation) {
      // First migrate the user
      await supabasePrisma.user.upsert({
        where: { email: testLocation.user.email },
        update: testLocation.user,
        create: testLocation.user
      });
      
      // Then migrate the location
      await supabasePrisma.location.upsert({
        where: { id: testLocation.id },
        update: {
          name: testLocation.name,
          contactPerson: testLocation.contactPerson,
          email: testLocation.email,
          telephone: testLocation.telephone,
          whatsapp: testLocation.whatsapp,
          notes: testLocation.notes,
          isActive: testLocation.isActive,
          distributorId: testLocation.distributorId
        },
        create: testLocation
      });
      console.log(`✅ Location migrated: ${testLocation.name}`);
    }

    // 4. Migrate one test seller
    console.log('\n👨‍💼 Migrating test seller...');
    const testSeller = await localPrisma.user.findFirst({
      where: { role: 'SELLER' }
    });
    
    if (testSeller) {
      await supabasePrisma.user.upsert({
        where: { email: testSeller.email },
        update: testSeller,
        create: testSeller
      });
      console.log(`✅ Seller migrated: ${testSeller.email}`);
    }

    // 5. Migrate saved QR configurations for testing
    console.log('\n⚙️ Migrating saved QR configurations...');
    const savedConfigs = await localPrisma.savedQRConfiguration.findMany({
      take: 3 // Just a few for testing
    });
    
    for (const config of savedConfigs) {
      await supabasePrisma.savedQRConfiguration.upsert({
        where: { id: config.id },
        update: config,
        create: config
      });
    }
    console.log(`✅ ${savedConfigs.length} QR configurations migrated`);

    // 6. Create sample email templates if they don't exist
    console.log('\n📧 Setting up email templates...');
    await supabasePrisma.welcomeEmailTemplate.upsert({
      where: { id: 'default_welcome' },
      update: {},
      create: {
        id: 'default_welcome',
        name: 'Default Welcome Email',
        subject: 'Welcome to ELocalPass!',
        headerText: 'Welcome to Your ELocalPass Experience!',
        bodyText: 'Thank you for choosing ELocalPass. Your pass is ready to use.',
        footerText: 'Enjoy your local experiences!',
        isDefault: true
      }
    });

    await supabasePrisma.rebuyEmailTemplate.upsert({
      where: { id: 'default_rebuy' },
      update: {},
      create: {
        id: 'default_rebuy',
        name: 'Default Rebuy Email',
        subject: 'Your ELocalPass Expires Soon - Get Another!',
        headerText: 'Don\'t Let Your Local Adventure End!',
        bodyText: 'Your ELocalPass expires in 12 hours. Get another pass to continue your local experiences.',
        footerText: 'Thank you for choosing ELocalPass!',
        isDefault: true
      }
    });
    console.log('✅ Email templates set up');

    console.log('\n🎉 Migration completed successfully!');
    console.log('\n📊 Summary:');
    console.log('✅ Admin user ready for login');
    console.log('✅ Test distributor/location/seller ready');
    console.log('✅ QR configurations ready');
    console.log('✅ Email templates ready');
    console.log('\n🔗 Production URL: https://elocalpasscursor-d6lysh7et-jorge-s-projects-889fbcca.vercel.app');
    console.log('🔑 Admin login: admin@elocalpass.com / admin123');

  } catch (error) {
    console.error('❌ Migration error:', error);
  } finally {
    await localPrisma.$disconnect();
    await supabasePrisma.$disconnect();
  }
};

migrateEssentialData(); 