# VideoLearn Pro Database Management Guide

## Database Backup Procedures

### 1. Manual Backup (Immediate)
```bash
# Create a backup with timestamp
./backup_database.sh
```

### 2. Check Current Database Data
```bash
# View current users
echo "SELECT id, username, email, is_admin FROM users;" | psql $DATABASE_URL

# View current videos
echo "SELECT id, title, category_id FROM videos;" | psql $DATABASE_URL

# View current categories
echo "SELECT id, name, slug FROM categories;" | psql $DATABASE_URL
```

### 3. Restore from Backup (if needed)
```bash
# Restore from a specific backup file
psql $DATABASE_URL < backups/videolearn_backup_YYYYMMDD_HHMMSS.sql
```

## Deployment Database Strategy

### Before Deployment:
1. **Create backup** using the backup script
2. **Document current state** (number of users, videos, categories)
3. **Test critical functions** (login, video upload, invitations)

### During Deployment:
- Replit Deployments automatically uses the same DATABASE_URL
- Your data remains intact during deployment
- No manual database migration needed

### After Deployment:
1. **Verify data integrity** on live site
2. **Test all functions** with production data
3. **Keep backup for 30 days** as safety measure

## Production Database Best Practices

### Data Safety:
- Database backups are created in `/backups/` directory
- Only last 5 backups are kept to save space
- Backups are timestamped for easy identification

### Monitoring:
- Check database connection health regularly
- Monitor user registrations and video uploads
- Track invitation acceptance rates

### Maintenance:
- Run backups before major updates
- Clean up old OTP codes periodically
- Monitor database performance

## Current Database Status
- **Provider**: Neon PostgreSQL (Serverless)
- **Connection**: Via DATABASE_URL environment variable
- **Tables**: Users, Categories, Videos, Invitations, OTP Codes, Analytics
- **Data Persistence**: Automatic across deployments