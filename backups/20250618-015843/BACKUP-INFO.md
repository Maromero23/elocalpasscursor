# ELocalPass Database Backup

**Backup Created:** June 18, 2025 at 01:58:43  
**Version:** v2.19  
**Database Type:** SQLite

## 📋 What's Included

### Database Files
- `dev-backup.db` - Complete SQLite database file (167KB)
- `database-dump.sql` - SQL dump for easy restoration (13KB)

### Configuration Files
- `.env` - Environment variables
- `.env.local` - Local environment overrides  
- `.env.example` - Environment template
- `prisma/` - Complete Prisma schema and migrations

## 🔄 How to Restore

### Option 1: Using the Restoration Script (Recommended)
```bash
cd "/Users/jr23studio/Documents/Cursor projects/Elocalpass Cursor"
./backups/20250618-015843/restore-database.sh
```

### Option 2: Manual Restoration
```bash
# Navigate to your project root
cd "/Users/jr23studio/Documents/Cursor projects/Elocalpass Cursor"

# Backup current database (if you want to keep it)
cp dev.db dev.db.backup

# Restore from backup
cp backups/20250618-015843/dev-backup.db dev.db

# Or restore from SQL dump
rm dev.db
sqlite3 dev.db < backups/20250618-015843/database-dump.sql
```

## 📊 Database Contents at Backup Time

Your database contains:
- **Users:** Admin, sellers, distributors, locations
- **QR Configurations:** All saved configurations
- **QR Codes:** Generated QR codes and customer data
- **Landing Page URLs:** Custom landing page configurations
- **Email Templates:** Welcome and rebuy email templates
- **Analytics Data:** Usage tracking and customer access tokens

## ⚠️ Important Notes

1. **This backup was created BEFORE migrating to Supabase**
2. **Keep this backup safe** - it's your complete working system
3. **The restoration script will backup your current database** before restoring
4. **After restoration, run:** `npm run dev -- --port 3003`

## 🆘 Emergency Contact

If you need help restoring this backup:
1. Use the restoration script first
2. Check that dev.db file exists and has data
3. Restart your development server
4. Test login with: admin@elocalpass.com / admin123 