# Vidyouth — AWS Infrastructure (Terraform)

Production-grade AWS environment for the Vidyouth auth service. Region:
`ap-south-1` (Mumbai), Multi-AZ across `1a` and `1b`.

## Layout

```
vidyouth-aws-infra/
├── versions.tf            Terraform + provider version pins
├── providers.tf           default + us_east_1 (for ACM/CloudFront/WAF)
├── variables.tf           inputs incl. cost_mode (production | learning)
├── backend.tf             S3 + DynamoDB remote state
├── main.tf                root composition (wires modules)
├── outputs.tf             surface IDs/endpoints
├── bootstrap-backend.ps1  one-time S3 + DynamoDB state-table bootstrap
├── terraform.tfvars.example
├── .gitignore
├── modules/
│   ├── foundations/       KMS keys + IAM roles
│   ├── networking/        VPC, subnets, NAT, SGs, endpoints, flow logs
│   ├── secrets/           Secrets Manager (DB, Redis, JWT, etc.)
│   ├── data/              RDS Postgres + ElastiCache Redis
│   ├── application/       ECR + LT + ASG + ALB + listeners
│   ├── edge/              Route 53 + ACM + CloudFront + WAFv2 (conditional)
│   └── observability/     CloudWatch + CloudTrail + S3 audit
└── environments/prod/
```

## Prerequisites

- Terraform `>= 1.6` (we pin `~> 1.15`)
- AWS CLI v2, authenticated via `aws configure` or SSO
  (`aws sts get-caller-identity` must succeed before bootstrap)
- PowerShell 5.1+ on Windows (the bootstrap script is `.ps1`)

## Cost modes

| Mode | RDS | NAT GW | Redis | EC2 size | ≈ ₹/month |
|---|---|---|---|---|---|
| `production` | db.m6i.large Multi-AZ + 200 GB gp3 | 2 | primary + replica | c6i.large × 2-6 | 50,000–60,000 |
| `learning`   | db.t3.medium single-AZ + 50 GB gp3 | 1 | primary only      | t3.medium × 2     | ~7,500 |

Set in `terraform.tfvars`. Switching values after a first apply requires
replacement of stateful resources (RDS class, Redis topology) — `terraform
plan` will show that clearly before anything destructive happens.

## First-time setup

```pwsh
# 1. Authenticate the AWS CLI
aws configure          # paste IAM access keys, region ap-south-1, output json
aws sts get-caller-identity   # verify

# 2. Bootstrap the remote state backend
cd "vidyouth-aws-infra"
pwsh ./bootstrap-backend.ps1

# 3. Configure inputs
copy terraform.tfvars.example terraform.tfvars
# edit terraform.tfvars — set cost_mode, domain_name (or leave empty), alerts_email

# 4. Initialise + plan + apply
terraform init
terraform plan -out tfplan
terraform apply tfplan
```

## Tear-down

To destroy everything (cost control):

```pwsh
terraform destroy
```

Note: RDS is created with `deletion_protection = true` in production mode.
You'll need to set that to `false`, apply, then destroy. The bootstrap S3
bucket and DynamoDB table are NOT managed by Terraform and survive a
destroy — empty and delete them manually if you want a fully clean slate.

## Status

This scaffold contains versions/providers/variables/backend/outputs. Module
bodies are added incrementally — see the commented-out blocks in `main.tf`
for the wiring order.
