#!/bin/bash

# Database Backup Script
# Backs up PostgreSQL database and uploads to cloud storage (optional)
#
# Usage: ./backup-database.sh
# Requires: pg_dump, gzip
#
# Environment Variables:
# - DATABASE_URL: PostgreSQL connection string
# - BACKUP_DIR: Directory to store backups (default: ./backups)
# - BACKUP_RETENTION_DAYS: Days to keep backups (default: 30)
# - AWS_S3_BUCKET: Optional S3 bucket for cloud backup
# - AWS_ACCESS_KEY_ID: AWS credentials
# - AWS_SECRET_ACCESS_KEY: AWS credentials

set -e # Exit on error

# Load environment variables
if [ -f ../.env ]; then
  export $(cat ../.env | grep -v '^#' | xargs)
fi

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups}"
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="emooti_backup_${TIMESTAMP}.sql.gz"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_FILE}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== EMOOTI Database Backup ===${NC}"
echo "Timestamp: $(date)"
echo "Backup file: ${BACKUP_FILE}"

# Create backup directory if it doesn't exist
mkdir -p "${BACKUP_DIR}"

# Check if DATABASE_URL is set
if [ -z "${DATABASE_URL}" ]; then
  echo -e "${RED}ERROR: DATABASE_URL environment variable not set${NC}"
  exit 1
fi

# Perform backup
echo -e "${YELLOW}Creating database backup...${NC}"
pg_dump "${DATABASE_URL}" | gzip > "${BACKUP_PATH}"

# Check if backup was successful
if [ $? -eq 0 ]; then
  BACKUP_SIZE=$(du -h "${BACKUP_PATH}" | cut -f1)
  echo -e "${GREEN}✓ Backup created successfully${NC}"
  echo "Size: ${BACKUP_SIZE}"
  echo "Location: ${BACKUP_PATH}"
else
  echo -e "${RED}✗ Backup failed${NC}"
  exit 1
fi

# Upload to S3 if configured
if [ -n "${AWS_S3_BUCKET}" ]; then
  echo -e "${YELLOW}Uploading backup to S3...${NC}"

  if command -v aws &> /dev/null; then
    aws s3 cp "${BACKUP_PATH}" "s3://${AWS_S3_BUCKET}/database-backups/${BACKUP_FILE}"

    if [ $? -eq 0 ]; then
      echo -e "${GREEN}✓ Backup uploaded to S3${NC}"
    else
      echo -e "${YELLOW}⚠ Failed to upload to S3 (backup saved locally)${NC}"
    fi
  else
    echo -e "${YELLOW}⚠ AWS CLI not installed, skipping S3 upload${NC}"
  fi
fi

# Clean up old backups
echo -e "${YELLOW}Cleaning up old backups (older than ${BACKUP_RETENTION_DAYS} days)...${NC}"
find "${BACKUP_DIR}" -name "emooti_backup_*.sql.gz" -type f -mtime +${BACKUP_RETENTION_DAYS} -delete
DELETED_COUNT=$(find "${BACKUP_DIR}" -name "emooti_backup_*.sql.gz" -type f -mtime +${BACKUP_RETENTION_DAYS} | wc -l)

if [ ${DELETED_COUNT} -gt 0 ]; then
  echo -e "${GREEN}✓ Deleted ${DELETED_COUNT} old backup(s)${NC}"
else
  echo "No old backups to delete"
fi

# Summary
echo ""
echo -e "${GREEN}=== Backup Summary ===${NC}"
echo "Backup file: ${BACKUP_FILE}"
echo "Local path: ${BACKUP_PATH}"
echo "Size: ${BACKUP_SIZE}"
[ -n "${AWS_S3_BUCKET}" ] && echo "S3 bucket: ${AWS_S3_BUCKET}"
echo "Retention: ${BACKUP_RETENTION_DAYS} days"
echo ""
echo -e "${GREEN}Backup completed successfully!${NC}"
