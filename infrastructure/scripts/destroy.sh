#!/bin/bash

# EMOOTI AWS Infrastructure Destruction Script
# ===========================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
TERRAFORM_DIR="infrastructure/terraform"
ENVIRONMENT=${1:-production}

echo -e "${RED}⚠️  EMOOTI AWS Infrastructure Destruction${NC}"
echo -e "${RED}========================================${NC}"
echo -e "Environment: ${RED}$ENVIRONMENT${NC}"
echo ""

# Check if terraform is installed
if ! command -v terraform &> /dev/null; then
    echo -e "${RED}❌ Terraform is not installed.${NC}"
    exit 1
fi

# Check if terraform.tfvars exists
if [ ! -f "$TERRAFORM_DIR/terraform.tfvars" ]; then
    echo -e "${RED}❌ terraform.tfvars not found.${NC}"
    exit 1
fi

# Change to terraform directory
cd "$TERRAFORM_DIR"

# Initialize Terraform
echo -e "${BLUE}🔧 Initializing Terraform...${NC}"
terraform init

# Plan destruction
echo -e "${RED}📋 Planning infrastructure destruction...${NC}"
terraform plan -destroy -var="environment=$ENVIRONMENT"

# Warning message
echo ""
echo -e "${RED}⚠️  WARNING: This will DESTROY all AWS resources!${NC}"
echo -e "${RED}   This action is IRREVERSIBLE!${NC}"
echo -e "${RED}   All data will be PERMANENTLY LOST!${NC}"
echo ""

# Double confirmation
read -p "Are you absolutely sure you want to destroy the infrastructure? Type 'DESTROY' to confirm: " -r
if [[ $REPLY != "DESTROY" ]]; then
    echo -e "${YELLOW}❌ Destruction cancelled.${NC}"
    exit 1
fi

echo ""
read -p "This will delete ALL data including the database. Type 'YES DELETE EVERYTHING' to proceed: " -r
if [[ $REPLY != "YES DELETE EVERYTHING" ]]; then
    echo -e "${YELLOW}❌ Destruction cancelled.${NC}"
    exit 1
fi

# Apply destruction
echo -e "${RED}💥 Destroying infrastructure...${NC}"
terraform destroy -var="environment=$ENVIRONMENT" -auto-approve

echo -e "${GREEN}✅ Infrastructure destroyed successfully.${NC}"
echo -e "${YELLOW}⚠️  All resources have been deleted.${NC}"
