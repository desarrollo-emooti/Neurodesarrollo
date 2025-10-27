#!/bin/bash

# Database Restore Script
# Restores PostgreSQL database from backup file
#
# Usage: ./restore-database.sh <backup-file>
# Example: ./restore-database.sh backups/emooti_backup_20251027_120000.sql.gz

set -e # Exit on error

# Load environment variables
if [ -f ../.env ]; then
  export $(cat ../.env | grep -v '^#' | xargs)
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${RED}=== EMOOTI Database Restore ===${NC}"
echo "Timestamp: $(date)"

# Check if backup file is provided
if [ -z "$1" ]; then
  echo -e "${RED}ERROR: Backup file not specified${NC}"
  echo "Usage: $0 <backup-file>"
  echo "Example: $0 backups/emooti_backup_20251027_120000.sql.gz"
  exit 1
fi

BACKUP_FILE="$1"

# Check if backup file exists
if [ ! -f "${BACKUP_FILE}" ]; then
  echo -e "${RED}ERROR: Backup file not found: ${BACKUP_FILE}${NC}"
  exit 1
fi

# Check if DATABASE_URL is set
if [ -z "${DATABASE_URL}" ]; then
  echo -e "${RED}ERROR: DATABASE_URL environment variable not set${NC}"
  exit 1
fi

echo -e "${YELLOW}Backup file: ${BACKUP_FILE}${NC}"
BACKUP_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
echo "Size: ${BACKUP_SIZE}"
echo ""

# Confirmation prompt
echo -e "${RED}⚠ WARNING: This will REPLACE all data in the current database!${NC}"
read -p "Are you sure you want to continue? (type 'YES' to confirm): " CONFIRM

if [ "${CONFIRM}" != "YES" ]; then
  echo -e "${YELLOW}Restore cancelled${NC}"
  exit 0
fi

# Perform restore
echo ""
echo -e "${YELLOW}Restoring database from backup...${NC}"

# Drop existing schema (optional, uncomment if needed)
# echo "Dropping existing schema..."
# psql "${DATABASE_URL}" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# Restore from backup
gunzip -c "${BACKUP_FILE}" | psql "${DATABASE_URL}"

# Check if restore was successful
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Database restored successfully${NC}"
else
  echo -e "${RED}✗ Restore failed${NC}"
  exit 1
fi

# Run Prisma migrations to ensure schema is up to date
echo ""
echo -e "${YELLOW}Running Prisma migrations...${NC}"
cd ..
npx prisma migrate deploy

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Prisma migrations applied${NC}"
else
  echo -e "${YELLOW}⚠ Prisma migrations failed (database may be out of sync)${NC}"
fi

echo ""
echo -e "${GREEN}=== Restore Summary ===${NC}"
echo "Backup file: ${BACKUP_FILE}"
echo "Database: $(echo ${DATABASE_URL} | sed 's/postgresql:\/\/[^@]*@/postgresql:\/\/***@/')"
echo ""
echo -e "${GREEN}Restore completed successfully!${NC}"
