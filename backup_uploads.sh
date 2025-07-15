#!/bin/bash

# Create backups directory if it doesn't exist
mkdir -p production_data_backups/uploads

# Get current timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Create upload backup directory
UPLOAD_BACKUP_DIR="production_data_backups/uploads/backup_${TIMESTAMP}"
mkdir -p "$UPLOAD_BACKUP_DIR"

# Copy all uploaded files
if [ -d "uploads" ]; then
    echo "Backing up uploaded files..."
    cp -r uploads/* "$UPLOAD_BACKUP_DIR/" 2>/dev/null || echo "No files to backup"
    echo "Upload backup completed: $UPLOAD_BACKUP_DIR"
else
    echo "No uploads directory found"
fi

# Create a backup manifest
echo "Upload backup created at: $(date)" > "$UPLOAD_BACKUP_DIR/backup_info.txt"
echo "Files backed up:" >> "$UPLOAD_BACKUP_DIR/backup_info.txt"
ls -la "$UPLOAD_BACKUP_DIR" >> "$UPLOAD_BACKUP_DIR/backup_info.txt"

echo "Upload backup completed successfully!"