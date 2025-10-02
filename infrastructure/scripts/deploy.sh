#!/bin/bash

# EMOOTI AWS Infrastructure Deployment Script
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
BACKEND_DIR="infrastructure/terraform"
ENVIRONMENT=${1:-production}

echo -e "${BLUE}🚀 EMOOTI AWS Infrastructure Deployment${NC}"
echo -e "${BLUE}=====================================${NC}"
echo -e "Environment: ${GREEN}$ENVIRONMENT${NC}"
echo ""

# Check if terraform is installed
if ! command -v terraform &> /dev/null; then
    echo -e "${RED}❌ Terraform is not installed. Please install Terraform first.${NC}"
    exit 1
fi

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not installed. Please install AWS CLI first.${NC}"
    exit 1
fi

# Check if AWS credentials are configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS credentials not configured. Please run 'aws configure' first.${NC}"
    exit 1
fi

# Get AWS Account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo -e "${GREEN}✅ AWS Account ID: $AWS_ACCOUNT_ID${NC}"

# Check if terraform.tfvars exists
if [ ! -f "$TERRAFORM_DIR/terraform.tfvars" ]; then
    echo -e "${YELLOW}⚠️  terraform.tfvars not found. Creating from example...${NC}"
    if [ -f "$TERRAFORM_DIR/terraform.tfvars.example" ]; then
        cp "$TERRAFORM_DIR/terraform.tfvars.example" "$TERRAFORM_DIR/terraform.tfvars"
        echo -e "${YELLOW}📝 Please edit $TERRAFORM_DIR/terraform.tfvars with your values before continuing.${NC}"
        echo -e "${YELLOW}   Required: aws_account_id, database_password, jwt_secret${NC}"
        exit 1
    else
        echo -e "${RED}❌ terraform.tfvars.example not found.${NC}"
        exit 1
    fi
fi

# Change to terraform directory
cd "$TERRAFORM_DIR"

# Initialize Terraform
echo -e "${BLUE}🔧 Initializing Terraform...${NC}"
terraform init

# Validate Terraform configuration
echo -e "${BLUE}✅ Validating Terraform configuration...${NC}"
terraform validate

# Plan Terraform deployment
echo -e "${BLUE}📋 Planning Terraform deployment...${NC}"
terraform plan -var="environment=$ENVIRONMENT" -out=tfplan

# Ask for confirmation
echo ""
echo -e "${YELLOW}⚠️  This will create/modify AWS resources.${NC}"
read -p "Do you want to proceed? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}❌ Deployment cancelled.${NC}"
    exit 1
fi

# Apply Terraform deployment
echo -e "${BLUE}🚀 Applying Terraform deployment...${NC}"
terraform apply tfplan

# Get outputs
echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo ""
echo -e "${BLUE}📊 Infrastructure Outputs:${NC}"
echo "================================"

# Database connection info
echo -e "${GREEN}Database Connection:${NC}"
echo "Host: $(terraform output -raw rds_cluster_endpoint)"
echo "Port: $(terraform output -raw rds_cluster_port)"
echo "Database: $(terraform output -raw database_name)"
echo ""

# Application URL
echo -e "${GREEN}Application URL:${NC}"
echo "URL: http://$(terraform output -raw alb_dns_name)"
echo ""

# S3 Buckets
echo -e "${GREEN}S3 Buckets:${NC}"
echo "Files: $(terraform output -raw s3_files_bucket_name)"
echo "Backups: $(terraform output -raw s3_backups_bucket_name)"
echo ""

# Save connection info to file
echo -e "${BLUE}💾 Saving connection information...${NC}"
terraform output -json connection_info > ../../backend/aws-connection-info.json

echo -e "${GREEN}🎉 EMOOTI infrastructure deployed successfully!${NC}"
echo ""
echo -e "${YELLOW}📝 Next steps:${NC}"
echo "1. Update your .env file with the database connection details"
echo "2. Run database migrations: npm run db:migrate"
echo "3. Deploy your application to ECS"
echo "4. Configure your domain name to point to the ALB"
echo ""
echo -e "${BLUE}Connection info saved to: backend/aws-connection-info.json${NC}"
