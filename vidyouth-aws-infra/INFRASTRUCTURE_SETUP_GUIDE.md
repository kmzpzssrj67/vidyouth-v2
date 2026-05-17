# AWS Infrastructure Setup Guide

This document explains the step-by-step process for setting up the AWS infrastructure for the Vidyouth login backend using Terraform. Each step includes an explanation of why it's necessary.

## 1. Configure AWS Profile

**Command:** `aws configure --profile vidyouth`

**Why:** 
- AWS CLI requires authentication credentials to interact with AWS services.
- Creating a named profile (`vidyouth`) allows you to manage multiple AWS accounts or roles without affecting your default profile.
- This profile will be used by Terraform and other AWS tools to authenticate API calls.

**Configuration:**
- Region: `ap-south-1` (Asia Pacific - Mumbai, chosen for geographic proximity to target users)
- Output: `json` (Structured output format for better tool integration)

**Test Command:** `aws sts get-caller-identity --profile vidyouth`

**Why test:**
- Verifies that the credentials are correct and the profile is properly configured.
- `sts get-caller-identity` is a safe, read-only operation that confirms authentication without making any changes.

## 2. Navigate to Infrastructure Folder

**Command:** `cd ".\vidyouth-aws-infra"`

**Why:**
- The Terraform configuration files are located in the `vidyouth-aws-infra` directory.
- Terraform operates on the current working directory, so we need to be in the correct folder to run Terraform commands.

## 3. Run Bootstrap Script

**Command:** `.\bootstrap-backend.ps1 -Profile vidyouth`

**Why:**
- The bootstrap script sets up the foundational AWS resources required before Terraform can create the main infrastructure.
- It typically creates:
  - S3 bucket for Terraform state storage
  - DynamoDB table for state locking
  - IAM roles and policies needed for Terraform operations
- Running it with the correct profile ensures it uses the right AWS account and credentials.

**Important:** Do NOT run it from the root folder or combine commands incorrectly, as this can cause authentication errors.

## 4. Create Terraform Variables File

**Command:** `copy terraform.tfvars.example terraform.tfvars`

**Why:**
- Terraform uses `.tfvars` files to provide values for variables defined in `.tf` files.
- The example file contains all required variables with placeholder values.
- Copying creates a working file that can be edited without modifying the template.

**Edit terraform.tfvars with these values:**
```
cost_mode = "learning"
domain_name = ""
alerts_email = "your-email@example.com"
auth_service_image_tag = "v0.0.0-placeholder"
```

**Why these specific values:**
- `cost_mode = "learning"`: Uses cost-optimized settings for development/testing. "production" would provision more expensive resources.
- `domain_name = ""`: Empty for now, can be set later when a domain is acquired.
- `alerts_email`: Email address for receiving infrastructure alerts and notifications.
- `auth_service_image_tag = "v0.0.0-placeholder"`: Placeholder tag until the actual Docker image is built and pushed.

## 5. Initialize Terraform

**Command:** `terraform init`

**Why:**
- Downloads required provider plugins (AWS provider).
- Initializes the backend for storing Terraform state.
- Sets up the working directory for Terraform operations.
- Must be run before any other Terraform commands in a new directory.

## 6. Create Terraform Plan

**Command:** `terraform plan -out tfplan`

**Why:**
- `terraform plan` analyzes the configuration and shows what changes will be made.
- The `-out tfplan` flag saves the plan to a file for later execution.
- This allows you to review changes before applying them.
- Critical for understanding infrastructure costs and ensuring correctness.

## 7. Apply Terraform Plan

**Command:** `terraform apply tfplan`

**Why:**
- Executes the planned changes to create the AWS infrastructure.
- Creates resources like:
  - VPC, subnets, security groups
  - RDS database
  - Redis cache
  - ECR repository
  - EC2 launch template
  - Load balancer
  - IAM roles and policies
- Using the saved plan ensures you're applying exactly what was planned.

## Important Notes for Production Deployment

After the infrastructure is created, additional steps are required for a complete deployment:

### Build and Push Docker Image
**Why:** The EC2 launch template references a Docker image in ECR, but initially no image exists.

### Update SSM Parameter
**Why:** The launch template uses an SSM parameter to specify which image tag to run. This needs to be updated after pushing a new image.

### Configure Environment Variables
**Why:** The application requires `DATABASE_URL` and `REDIS_URL` environment variables. These need to be securely stored and injected into the EC2 Docker container.

### Domain and SSL
**Why:** For production, you'll need to configure the domain name, SSL certificates, and update DNS records.

## Cost Considerations

- Use `cost_mode = "learning"` for development to minimize AWS costs.
- Monitor resource usage and clean up unused resources.
- The infrastructure includes CloudWatch alarms to alert on cost thresholds.

## Security Notes

- Never commit AWS credentials to version control.
- Use IAM roles with least privilege.
- Regularly rotate access keys.
- Enable multi-factor authentication on your AWS account.