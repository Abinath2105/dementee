# Production Deployment Plan - Cover Images Fix

## Current Issue
Category cover images disappear every deployment because uploaded files are not persisted in the deployment environment.

## Solution Implementation

### 1. Pre-deployment Backup
```bash
# Create backup of current uploads
./backup_uploads.sh
```

### 2. Deploy Application
Deploy through Replit's deployment interface

### 3. Post-deployment Restoration
```bash
# After deployment, restore uploads from backup
./restore_uploads.sh production_data_backups/uploads/backup_20250715_221052
```

### 4. Database Verification
The database currently has:
- Category ID 7: "30 Days UI UX Design Interview Cracking Workshop"
- Cover image: Updated to `/uploads/image-1752610607548-94515505.jpeg` (existing file)

### 5. Upload Directory Structure
```
uploads/
├── image-1752396797389-74703228.jpg
├── image-1752396818849-627331304.jpg
├── image-1752398603189-662726711.jpg
├── image-1752398624651-907478922.jpg
├── image-1752398647718-401869554.jpg
├── image-1752398690706-927834676.jpg
├── image-1752606619506-243987409.jpg
├── image-1752607395516-537362138.jpg
├── image-1752610297233-426447823.jpg
└── image-1752610607548-94515505.jpeg ← Updated cover image
```

### 6. Scripts Created
- `backup_uploads.sh` - Backup uploaded files before deployment
- `restore_uploads.sh` - Restore uploaded files after deployment
- `ensure_uploads_directory.js` - Ensure uploads directory exists

### 7. Deployment Process
1. Run pre-deployment backup
2. Deploy application
3. Run post-deployment restoration
4. Verify cover images are displaying correctly

## Status
✅ Database updated with existing cover image file
✅ Backup scripts created and tested
✅ Upload directory verified and accessible
✅ Cover image serving correctly via /uploads endpoint

## Next Steps
1. Test the deployment process
2. Verify cover images persist after deployment
3. Document any additional issues found