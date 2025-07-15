#!/bin/bash

# Function to restore uploads from backup
restore_uploads() {
    local backup_dir="$1"
    
    if [ ! -d "$backup_dir" ]; then
        echo "Error: Backup directory '$backup_dir' does not exist"
        return 1
    fi
    
    # Create uploads directory if it doesn't exist
    mkdir -p uploads
    
    # Copy files from backup to uploads
    echo "Restoring files from $backup_dir..."
    cp -r "$backup_dir"/* uploads/ 2>/dev/null || echo "No files to restore"
    
    # Remove backup info file from uploads directory
    rm -f uploads/backup_info.txt
    
    echo "Upload restore completed successfully!"
}

# Check if backup directory is provided
if [ $# -eq 0 ]; then
    echo "Usage: $0 <backup_directory>"
    echo "Available backups:"
    ls -la production_data_backups/uploads/ 2>/dev/null || echo "No backups found"
    exit 1
fi

# Restore from specified backup
restore_uploads "$1"