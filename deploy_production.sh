#!/bin/bash

echo "=== PRODUCTION DEPLOYMENT SCRIPT ==="
echo "Running post-deployment restoration..."

# Ensure uploads directory exists
echo "1. Creating uploads directory..."
mkdir -p uploads

# Restore latest backup
echo "2. Restoring upload files..."
./restore_uploads.sh production_data_backups/uploads/backup_20250715_221537

# Verify key files
echo "3. Verifying key files..."
if [ -f "uploads/image-1752617683113-527127480.jpg" ]; then
    echo "✅ Category cover image found"
else
    echo "❌ Category cover image missing"
fi

# Check directory permissions
echo "4. Checking permissions..."
if [ -w "uploads" ]; then
    echo "✅ Uploads directory is writable"
else
    echo "❌ Uploads directory not writable"
fi

# List uploaded files
echo "5. Current upload files:"
ls -la uploads/ | grep -E "\.(jpg|jpeg|png)$" | wc -l
echo "files found"

echo "=== DEPLOYMENT RESTORATION COMPLETE ==="
echo "Your category cover images should now be visible!"