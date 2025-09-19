# Backup & Rollback Procedures

The goal of this guide is to ensure we can recover the platform quickly when
something goes wrong. Keep it close to the deployment runbook and update it
whenever the infrastructure changes.

## 1. Database Backups (PostgreSQL)

1. **Create a dump**
   - Local Docker: `docker compose exec database pg_dump -U postgres sesimiz_ol_db > backups/$(date +%F-%H%M)-sesimiz_ol_db.sql`
   - Direct connection: `pg_dump "$DATABASE_URL" --format=plain --file=backups/$(date +%F-%H%M)-sesimiz_ol_db.sql`
2. **Compress the dump** to save space: `gzip backups/*.sql`
3. **Store off-site** (S3 bucket, GCS, or encrypted drive). Keep at least 7
   daily copies and 4 weekly copies.
4. **Verify** by restoring into a temporary database once per month:
   `psql -U postgres -d sesimiz_ol_verify < backups/backup.sql.gz`

## 2. Uploaded Files (`backend/uploads`)

1. Sync the uploads directory before deployment:
   `rsync -a backend/uploads/ backups/uploads-$(date +%F)/`
2. For cloud storage, use the provider CLI (e.g. `gsutil rsync` or `aws s3 sync`).
3. Keep the uploads backup in the same location as the database dump so a
   restore pulls matching data + files.

## 3. Environment Configuration

1. Export all runtime secrets before every release:
   - Backend: copy `backend/.env`
   - Frontend: copy `frontend/.env`
   - Functions: copy `functions/.env`
2. Store encrypted copies (Bitwarden, 1Password, or sealed secrets repo).
3. Track changes to `.env.example` in git so missing variables are obvious.

## 4. Rollback Workflow

1. **Stop traffic**: disable the load balancer route or scale the service to 0.
2. **Restore database**
   - Drop the broken database (or create a new instance)
   - `createdb sesimiz_ol_db`
   - `pg_restore -U postgres -d sesimiz_ol_db backups/<timestamp>-sesimiz_ol_db.sql.gz`
3. **Restore uploads**
   - `rsync -a backups/uploads-<timestamp>/ backend/uploads/`
4. **Deploy the previous release tag**
   - Checkout the last known good tag in git
   - Rebuild containers and redeploy
5. **Re-apply environment files** and restart services.
6. **Verification checklist**
   - `curl https://api.sesimiz-ol.com/health`
   - Login with a test account
   - Fetch a story and confirm uploads render
   - Review logs for errors during the first 10 minutes
7. **Re-enable traffic** once verification passes.

## 5. Automation Recommendations

- Schedule nightly `pg_dump` via cron on the database host or CI pipeline.
- Enable object lifecycle rules on the backup bucket (auto-delete after 90 days).
- Add a GitHub Action that reminds the team if no backup ran in 48 hours.
- Test the rollback plan at least once per quarter.
