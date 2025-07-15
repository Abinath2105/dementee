#!/bin/bash

# VideoLearn Pro Production Backup Restore Script
# This script restores your production database from a backup file

set -e  # Exit on any error

if [ $# -eq 0 ]; then
    echo "Usage: $0 <backup_file.sql>"
    echo "Available backups:"
    ls -la production_backups/*.sql 2>/dev/null || echo "No backups found"
    exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "🔄 Restoring VideoLearn Pro from backup..."
echo "Backup file: $BACKUP_FILE"
echo "Target database: $DATABASE_URL"
echo "Timestamp: $(date)"
echo "=================================="

# Create a pre-restore backup
echo "📦 Creating pre-restore backup..."
PRE_RESTORE_BACKUP="production_backups/pre_restore_$(date +%Y%m%d_%H%M%S).sql"
pg_dump "$DATABASE_URL" --no-owner --no-privileges > "$PRE_RESTORE_BACKUP"
echo "✅ Pre-restore backup created: $PRE_RESTORE_BACKUP"

# Restore from backup
echo "🔄 Restoring database from backup..."
psql "$DATABASE_URL" < "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Database restored successfully!"
    
    # Verify restored data
    echo "🔍 Verifying restored data..."
    psql "$DATABASE_URL" -c "SELECT 
      'users' as table_name, COUNT(*) as count FROM users
    UNION ALL
    SELECT 
      'categories' as table_name, COUNT(*) as count FROM categories
    UNION ALL
    SELECT 
      'videos' as table_name, COUNT(*) as count FROM videos
    UNION ALL
    SELECT 
      'app_settings' as table_name, COUNT(*) as count FROM app_settings;"
    
    echo "🎉 Production database restored successfully!"
else
    echo "❌ Database restore failed"
    exit 1
fi