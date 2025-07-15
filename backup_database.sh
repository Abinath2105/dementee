#!/bin/bash

# VideoLearn Pro Database Backup Script
# This script creates a backup of your PostgreSQL database

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "Error: DATABASE_URL environment variable is not set"
    exit 1
fi

# Create backup directory if it doesn't exist
mkdir -p backups

# Generate timestamp for backup filename
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backups/videolearn_backup_${TIMESTAMP}.sql"

echo "Creating database backup..."
echo "Backup file: $BACKUP_FILE"

# Create the backup
pg_dump "$DATABASE_URL" > "$BACKUP_FILE"

# Check if backup was successful
if [ $? -eq 0 ]; then
    echo "✓ Database backup created successfully: $BACKUP_FILE"
    echo "File size: $(du -h "$BACKUP_FILE" | cut -f1)"
    
    # Keep only the last 5 backups to save space
    echo "Cleaning up old backups (keeping latest 5)..."
    ls -t backups/videolearn_backup_*.sql | tail -n +6 | xargs -r rm
    
    echo "Current backups:"
    ls -la backups/videolearn_backup_*.sql 2>/dev/null || echo "No backups found"
else
    echo "✗ Database backup failed"
    exit 1
fi

echo "Backup procedure completed."