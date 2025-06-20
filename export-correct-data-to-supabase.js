const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

console.log('🔍 SAFE EXPORT SCRIPT - Reading from CORRECT database: ./prisma/dev.db');
console.log('📋 This script will NOT modify any of your environment files');
console.log('');

// Helper functions for data conversion
function toBool(value) {
  return value === 1 ? 'true' : 'false';
}

function toTimestamp(value) {
  if (!value) return 'NULL';
  
  try {
    // SQLite stores timestamps as Unix milliseconds (13-digit numbers)
    if (typeof value === 'number' || (typeof value === 'string' && /^\d{13}$/.test(value))) {
      const timestamp = typeof value === 'string' ? parseInt(value) : value;
      return `'${new Date(timestamp).toISOString()}'`;
    }
    
    // Handle Unix seconds (10-digit numbers) 
    if (typeof value === 'number' || (typeof value === 'string' && /^\d{10}$/.test(value))) {
      const timestamp = typeof value === 'string' ? parseInt(value) : value;
      return `'${new Date(timestamp * 1000).toISOString()}'`;
    }
    
    // If it's already an ISO string, validate and reformat
    if (typeof value === 'string' && value.includes('T')) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return `'${date.toISOString()}'`;
      }
    }
    
    // Try to parse as-is
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return `'${date.toISOString()}'`;
    }
    
    // If we can't parse it, use current timestamp as fallback
    return `'${new Date().toISOString()}'`;
  } catch (error) {
    // Fallback to current timestamp if anything goes wrong
    return `'${new Date().toISOString()}'`;
  }
}

function escapeString(str) {
  if (!str) return 'NULL';
  return `'${str.toString().replace(/'/g, "''")}'`;
}

// Connect directly to the CORRECT database
const db = new sqlite3.Database('./prisma/dev.db', sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('❌ Error opening database:', err.message);
    process.exit(1);
  }
  console.log('✅ Connected to the CORRECT SQLite database: ./prisma/dev.db');
});

let sqlOutput = '';

// Add header
sqlOutput += `-- CORRECT DATA EXPORT FROM ./prisma/dev.db\n`;
sqlOutput += `-- Generated on: ${new Date().toISOString()}\n`;
sqlOutput += `-- This contains your REAL working data\n\n`;

// Clear existing data first
sqlOutput += `-- Clear existing wrong data\n`;
sqlOutput += `DELETE FROM qr_codes;\n`;
sqlOutput += `DELETE FROM saved_qr_configurations;\n`;
sqlOutput += `DELETE FROM "Location";\n`;
sqlOutput += `DELETE FROM "Distributor";\n`;
sqlOutput += `DELETE FROM users;\n\n`;

async function exportData() {
  try {
    // Export Users (without locationId first to avoid circular dependency)
    console.log('📤 Exporting Users...');
    const users = await new Promise((resolve, reject) => {
      db.all(`SELECT * FROM users ORDER BY createdAt`, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    sqlOutput += `-- Insert Users (without locationId to avoid circular dependency)\n`;
    for (const user of users) {
      sqlOutput += `INSERT INTO users (id, email, password, name, telephone, whatsapp, notes, role, "isActive", "createdAt", "updatedAt", "distributorId", "configurationId", "configurationName", "savedConfigId") VALUES (`;
      sqlOutput += `${escapeString(user.id)}, `;
      sqlOutput += `${escapeString(user.email)}, `;
      sqlOutput += `${escapeString(user.password)}, `;
      sqlOutput += `${escapeString(user.name)}, `;
      sqlOutput += `${escapeString(user.telephone)}, `;
      sqlOutput += `${escapeString(user.whatsapp)}, `;
      sqlOutput += `${escapeString(user.notes)}, `;
      sqlOutput += `${escapeString(user.role)}, `;
      sqlOutput += `${toBool(user.isActive)}, `;
      sqlOutput += `${toTimestamp(user.createdAt)}, `;
      sqlOutput += `${toTimestamp(user.updatedAt)}, `;
      sqlOutput += `${escapeString(user.distributorId)}, `;
      sqlOutput += `${escapeString(user.configurationId)}, `;
      sqlOutput += `${escapeString(user.configurationName)}, `;
      sqlOutput += `${escapeString(user.savedConfigId)});\n`;
    }
    sqlOutput += `\n`;

    // Export Distributors
    console.log('📤 Exporting Distributors...');
    const distributors = await new Promise((resolve, reject) => {
      db.all(`SELECT * FROM Distributor ORDER BY createdAt`, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    sqlOutput += `-- Insert Distributors\n`;
    for (const dist of distributors) {
      // Find the corresponding user
      const distUser = users.find(u => u.distributorId === dist.id);
      const userId = distUser ? distUser.id : 'NULL';

      sqlOutput += `INSERT INTO "Distributor" (id, name, "contactPerson", email, telephone, whatsapp, notes, "isActive", "createdAt", "updatedAt", "userId") VALUES (`;
      sqlOutput += `${escapeString(dist.id)}, `;
      sqlOutput += `${escapeString(dist.name)}, `;
      sqlOutput += `${escapeString(dist.contactPerson)}, `;
      sqlOutput += `${escapeString(dist.email)}, `;
      sqlOutput += `${escapeString(dist.telephone)}, `;
      sqlOutput += `${escapeString(dist.whatsapp)}, `;
      sqlOutput += `${escapeString(dist.notes)}, `;
      sqlOutput += `${toBool(dist.isActive)}, `;
      sqlOutput += `${toTimestamp(dist.createdAt)}, `;
      sqlOutput += `${toTimestamp(dist.updatedAt)}, `;
      sqlOutput += `${escapeString(userId)});\n`;
    }
    sqlOutput += `\n`;

    // Export Locations
    console.log('📤 Exporting Locations...');
    const locations = await new Promise((resolve, reject) => {
      db.all(`SELECT * FROM Location ORDER BY createdAt`, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    sqlOutput += `-- Insert Locations\n`;
    for (const loc of locations) {
      // Find the corresponding user
      const locUser = users.find(u => u.locationId === loc.id);
      const userId = locUser ? locUser.id : 'NULL';

      sqlOutput += `INSERT INTO "Location" (id, name, "contactPerson", email, telephone, whatsapp, notes, "isActive", "createdAt", "updatedAt", "distributorId", "userId") VALUES (`;
      sqlOutput += `${escapeString(loc.id)}, `;
      sqlOutput += `${escapeString(loc.name)}, `;
      sqlOutput += `${escapeString(loc.contactPerson)}, `;
      sqlOutput += `${escapeString(loc.email)}, `;
      sqlOutput += `${escapeString(loc.telephone)}, `;
      sqlOutput += `${escapeString(loc.whatsapp)}, `;
      sqlOutput += `${escapeString(loc.notes)}, `;
      sqlOutput += `${toBool(loc.isActive)}, `;
      sqlOutput += `${toTimestamp(loc.createdAt)}, `;
      sqlOutput += `${toTimestamp(loc.updatedAt)}, `;
      sqlOutput += `${escapeString(loc.distributorId)}, `;
      sqlOutput += `${escapeString(userId)});\n`;
    }
    sqlOutput += `\n`;

    // Update users with locationId
    sqlOutput += `-- Update users with locationId\n`;
    for (const user of users) {
      if (user.locationId) {
        sqlOutput += `UPDATE users SET "locationId" = ${escapeString(user.locationId)} WHERE id = ${escapeString(user.id)};\n`;
      }
    }
    sqlOutput += `\n`;

    // Export Saved QR Configurations
    console.log('📤 Exporting Saved QR Configurations...');
    const savedConfigs = await new Promise((resolve, reject) => {
      db.all(`SELECT * FROM saved_qr_configurations ORDER BY createdAt`, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    sqlOutput += `-- Insert Saved QR Configurations\n`;
    for (const config of savedConfigs) {
      sqlOutput += `INSERT INTO saved_qr_configurations (id, name, description, config, "emailTemplates", "landingPageConfig", "selectedUrlIds", "createdAt", "updatedAt") VALUES (`;
      sqlOutput += `${escapeString(config.id)}, `;
      sqlOutput += `${escapeString(config.name)}, `;
      sqlOutput += `${escapeString(config.description)}, `;
      sqlOutput += `${escapeString(config.config)}, `;
      sqlOutput += `${escapeString(config.emailTemplates)}, `;
      sqlOutput += `${escapeString(config.landingPageConfig)}, `;
      sqlOutput += `${escapeString(config.selectedUrlIds)}, `;
      sqlOutput += `${toTimestamp(config.createdAt)}, `;
      sqlOutput += `${toTimestamp(config.updatedAt)});\n`;
    }
    sqlOutput += `\n`;

    // Export QR Codes
    console.log('📤 Exporting QR Codes...');
    const qrCodes = await new Promise((resolve, reject) => {
      db.all(`SELECT * FROM qr_codes ORDER BY createdAt`, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    sqlOutput += `-- Insert QR Codes\n`;
    for (const qr of qrCodes) {
      sqlOutput += `INSERT INTO qr_codes (id, "sellerId", guests, days, "totalPrice", "isActive", "expiresAt", "createdAt", "updatedAt", "customerName", "customerEmail") VALUES (`;
      sqlOutput += `${escapeString(qr.id)}, `;
      sqlOutput += `${escapeString(qr.sellerId)}, `;
      sqlOutput += `${qr.guests || 'NULL'}, `;
      sqlOutput += `${qr.days || 'NULL'}, `;
      sqlOutput += `${qr.totalPrice || 'NULL'}, `;
      sqlOutput += `${toBool(qr.isActive)}, `;
      sqlOutput += `${toTimestamp(qr.expiresAt)}, `;
      sqlOutput += `${toTimestamp(qr.createdAt)}, `;
      sqlOutput += `${toTimestamp(qr.updatedAt)}, `;
      sqlOutput += `${escapeString(qr.customerName)}, `;
      sqlOutput += `${escapeString(qr.customerEmail)});\n`;
    }

    // Write to file
    fs.writeFileSync('supabase-import-CORRECT-data.sql', sqlOutput);
    
    console.log('');
    console.log('✅ EXPORT COMPLETE!');
    console.log('📄 File created: supabase-import-CORRECT-data.sql');
    console.log('');
    console.log('📊 DATA SUMMARY (from your CORRECT database):');
    console.log(`   👥 Users: ${users.length}`);
    console.log(`   🏢 Distributors: ${distributors.length}`);
    console.log(`   📍 Locations: ${locations.length}`);
    console.log(`   ⚙️  Saved Configs: ${savedConfigs.length}`);
    console.log(`   🔲 QR Codes: ${qrCodes.length}`);
    console.log('');
    console.log('🔍 SELLERS IN EXPORT:');
    users.filter(u => u.role === 'SELLER').forEach(seller => {
      console.log(`   ✅ ${seller.email} (${seller.name})`);
    });
    console.log('');
    console.log('⚠️  NEXT STEP: Review the file before importing to Supabase');

  } catch (error) {
    console.error('❌ Export failed:', error);
  } finally {
    db.close();
  }
}

exportData(); 