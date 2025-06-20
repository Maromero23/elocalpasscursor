#!/usr/bin/env node

const sqlite3 = require('sqlite3').verbose();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

// Supabase Prisma client
const supabasePrisma = new PrismaClient();

async function migrateFromSQLite() {
  console.log('🚀 Starting SQLite to Supabase Migration...\n');

  // Open SQLite database
  const db = new sqlite3.Database('./prisma/dev.db', (err) => {
    if (err) {
      console.error('❌ Error opening SQLite database:', err.message);
      return;
    }
    console.log('✅ Connected to SQLite database');
  });

  try {
    // Step 1: Create Admin User
    console.log('\n👤 Creating admin user...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const adminUser = await supabasePrisma.user.upsert({
      where: { email: 'admin@elocalpass.com' },
      update: {
        password: hashedPassword,
        name: 'System Administrator',
        role: 'ADMIN',
        isActive: true
      },
      create: {
        email: 'admin@elocalpass.com',
        password: hashedPassword,
        name: 'System Administrator',
        role: 'ADMIN',
        isActive: true
      }
    });
    console.log('✅ Admin user ready:', adminUser.email);

    // Step 2: Migrate Distributors
    console.log('\n📊 Migrating distributors...');
    const distributors = await new Promise((resolve, reject) => {
      db.all(`
        SELECT d.*, u.email as userEmail, u.name as userName, u.password as userPassword,
               u.telephone as userTelephone, u.whatsapp as userWhatsapp, u.notes as userNotes,
               u.isActive as userIsActive
        FROM Distributor d
        LEFT JOIN users u ON d.userId = u.id
      `, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    for (const dist of distributors) {
      // Create distributor user if exists
      let distributorUser = null;
      if (dist.userEmail) {
        const hashedDistPassword = await bcrypt.hash('distributor123', 10);
        distributorUser = await supabasePrisma.user.create({
          data: {
            email: dist.userEmail,
            password: hashedDistPassword,
            name: dist.userName || dist.name,
            role: 'DISTRIBUTOR',
                         isActive: Boolean(dist.userIsActive),
            telephone: dist.userTelephone,
            whatsapp: dist.userWhatsapp,
            notes: dist.userNotes
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
                     isActive: Boolean(dist.isActive),
          userId: distributorUser?.id
        }
      });
      console.log(`✅ Migrated distributor: ${newDistributor.name}`);
    }

    // Step 3: Migrate Locations
    console.log('\n🏢 Migrating locations...');
    const locations = await new Promise((resolve, reject) => {
      db.all(`
        SELECT l.*, u.email as userEmail, u.name as userName, u.password as userPassword,
               u.telephone as userTelephone, u.whatsapp as userWhatsapp, u.notes as userNotes,
               u.isActive as userIsActive
        FROM Location l
        LEFT JOIN users u ON l.userId = u.id
      `, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    for (const loc of locations) {
      // Create location user if exists
      let locationUser = null;
      if (loc.userEmail) {
        const hashedLocPassword = await bcrypt.hash('location123', 10);
        locationUser = await supabasePrisma.user.create({
          data: {
            email: loc.userEmail,
            password: hashedLocPassword,
            name: loc.userName || loc.name,
            role: 'LOCATION',
                         isActive: Boolean(loc.userIsActive),
            telephone: loc.userTelephone,
            whatsapp: loc.userWhatsapp,
            notes: loc.userNotes
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
                     isActive: Boolean(loc.isActive),
          distributorId: loc.distributorId,
          userId: locationUser?.id
        }
      });
      console.log(`✅ Migrated location: ${newLocation.name}`);
    }

    // Step 4: Migrate Sellers
    console.log('\n👥 Migrating sellers...');
    const sellers = await new Promise((resolve, reject) => {
      db.all(`
        SELECT * FROM users WHERE role = 'SELLER'
      `, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    for (const seller of sellers) {
      const hashedSellerPassword = await bcrypt.hash('seller123', 10);
      
      const newSeller = await supabasePrisma.user.create({
        data: {
          email: seller.email,
          password: hashedSellerPassword,
          name: seller.name,
          role: 'SELLER',
                     isActive: Boolean(seller.isActive),
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
    const configs = await new Promise((resolve, reject) => {
      db.all(`SELECT * FROM saved_qr_configurations`, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

         for (const config of configs) {
       // Create a JSON config string from the old data structure
       const configData = {
         defaultGuests: config.defaultGuests || 2,
         defaultDays: config.defaultDays || 3,
         buttons: {
           button1: { text: config.button1Text, deliveryMethod: config.button1DeliveryMethod },
           button2: { text: config.button2Text, deliveryMethod: config.button2DeliveryMethod },
           button3: { text: config.button3Text, deliveryMethod: config.button3DeliveryMethod },
           button4: { text: config.button4Text, deliveryMethod: config.button4DeliveryMethod },
           button5: { text: config.button5Text, deliveryMethod: config.button5DeliveryMethod }
         },
         email: {
           welcomeSubject: config.welcomeEmailSubject,
           welcomeBody: config.welcomeEmailBody
         }
       };

       const newConfig = await supabasePrisma.savedQRConfiguration.create({
         data: {
           id: config.id,
           name: config.name,
           description: `Migrated configuration: ${config.name}`,
           config: JSON.stringify(configData),
           createdAt: new Date(config.createdAt),
           updatedAt: new Date(config.updatedAt)
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
    // Close connections
    db.close((err) => {
      if (err) {
        console.error('❌ Error closing SQLite database:', err.message);
      } else {
        console.log('🔌 SQLite database connection closed');
      }
    });
    await supabasePrisma.$disconnect();
    console.log('🔌 Supabase connection closed');
  }
}

migrateFromSQLite(); 