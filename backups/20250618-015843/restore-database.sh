#!/bin/bash

# ELocalPass Database Restoration Script
# Created: $(date)
# 
# This script restores your ELocalPass database from backup

echo "🔄 ELocalPass Database Restoration Starting..."
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "📂 Backup location: $SCRIPT_DIR"
echo ""

# Check if backup files exist
if [ ! -f "$SCRIPT_DIR/dev-backup.db" ]; then
    echo "❌ ERROR: dev-backup.db not found in $SCRIPT_DIR"
    exit 1
fi

if [ ! -f "$SCRIPT_DIR/database-dump.sql" ]; then
    echo "❌ ERROR: database-dump.sql not found in $SCRIPT_DIR"
    exit 1
fi

echo "✅ Backup files found"
echo ""

# Go to project root (assuming script is in backups/timestamp/ folder)
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$PROJECT_ROOT"

echo "📁 Project root: $PROJECT_ROOT"
echo ""

# Backup current database if it exists
if [ -f "dev.db" ]; then
    echo "💾 Backing up current dev.db to dev.db.before-restore..."
    cp dev.db dev.db.before-restore
fi

echo "🔄 Restoring database..."

# Method 1: Copy the binary backup
echo "   → Copying database file..."
cp "$SCRIPT_DIR/dev-backup.db" dev.db

echo "✅ Database restored successfully!"
echo ""
echo "🎉 Restoration completed!"
echo ""
echo "📋 What was restored:"
echo "   • Database: dev.db"
echo "   • Backup of current DB: dev.db.before-restore (if existed)"
echo ""
echo "🚀 You can now run: npm run dev -- --port 3003" 