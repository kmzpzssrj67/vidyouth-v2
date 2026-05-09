/**
 * EC2 launch template + ASG.
 *
 *   production -> c6i.large, ASG min/desired/max = 2/2/6, IMDSv2 only,
 *                 30 GB encrypted gp3 root, target-tracking on AvgCPU 50%
 *   learning   -> t3.medium (same vCPU/RAM, burstable), ASG 1/1/2
 *
 * User-data script:
 *   - installs Docker + amazon-cloudwatch-agent
 *   - logs into ECR via the instance role
 *   - reads the image tag from SSM /{prefix}/auth-image-tag
 *   - docker pull + docker run -p 8080:8080 -d --restart=always
 *   - configures CloudWatch agent to ship /var/log/docker to a log group
 *
 * Health is /healthz on port 8080. The ALB target group polls it every 10s.
 */

locals {
  is_production    = var.cost_mode == "production"
  ec2_instance_type = local.is_production ? "c6i.large" : "t3.medium"
  asg_min          = local.is_production ? 2 : 1
  asg_desired      = local.is_production ? 2 : 1
  asg_max          = local.is_production ? 6 : 2
}

# Latest Amazon Linux 2023 AMI for x86_64
data "aws_ssm_parameter" "al2023_ami" {
  name = "/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64"
}

data "aws_region" "current" {}
data "aws_caller_identity" "current" {}

locals {
  user_data = base64encode(<<-EOT
    #!/bin/bash
    set -euo pipefail

    REGION="${data.aws_region.current.name}"
    ACCOUNT_ID="${data.aws_caller_identity.current.account_id}"
    ECR_REPO="${aws_ecr_repository.auth.repository_url}"
    SSM_TAG_PARAM="/${var.name_prefix}/auth-image-tag"
    LOG_GROUP="/${var.name_prefix}/auth-service"

    # 1. base packages
    dnf update -y
    dnf install -y docker jq amazon-cloudwatch-agent

    # 2. docker
    systemctl enable --now docker
    usermod -aG docker ec2-user

    # 3. ECR login (uses the IAM instance role)
    aws ecr get-login-password --region "$REGION" \
      | docker login --username AWS --password-stdin "$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com"

    # 4. resolve current tag from SSM
    IMAGE_TAG=$(aws ssm get-parameter --name "$SSM_TAG_PARAM" --region "$REGION" --query Parameter.Value --output text)
    IMAGE="$ECR_REPO:$IMAGE_TAG"

    # 5. pull + run. If the tag is the placeholder we still try; failure
    #    is acceptable on first boot before the real image is pushed.
    if docker pull "$IMAGE"; then
      docker stop auth || true
      docker rm   auth || true
      docker run -d --restart=always --name auth -p 8080:8080 "$IMAGE"
    fi

    # 6. minimal CloudWatch agent config: ship docker JSON logs to CW
    mkdir -p /opt/aws/amazon-cloudwatch-agent/etc
    cat > /opt/aws/amazon-cloudwatch-agent/etc/config.json <<JSON
    {
      "logs": {
        "logs_collected": {
          "files": {
            "collect_list": [
              {
                "file_path": "/var/lib/docker/containers/*/*.log",
                "log_group_name": "$LOG_GROUP",
                "log_stream_name": "{instance_id}",
                "timestamp_format": "%Y-%m-%dT%H:%M:%S.%fZ"
              }
            ]
          }
        }
      }
    }
    JSON
    /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
      -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/config.json -s
  EOT
  )
}

resource "aws_launch_template" "app" {
  name_prefix   = "${var.name_prefix}-app-"
  image_id      = data.aws_ssm_parameter.al2023_ami.value
  instance_type = local.ec2_instance_type

  iam_instance_profile {
    name = var.ec2_instance_profile_name
  }

  vpc_security_group_ids = [var.ec2_security_group_id]

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"  # IMDSv2 only
    http_put_response_hop_limit = 2
  }

  block_device_mappings {
    device_name = "/dev/xvda"
    ebs {
      volume_size           = 30
      volume_type           = "gp3"
      encrypted             = true
      kms_key_id            = var.data_kms_arn
      delete_on_termination = true
    }
  }

  monitoring {
    enabled = true
  }

  user_data = local.user_data

  tag_specifications {
    resource_type = "instance"
    tags          = merge(var.tags, { Name = "${var.name_prefix}-auth" })
  }

  tag_specifications {
    resource_type = "volume"
    tags          = merge(var.tags, { Name = "${var.name_prefix}-auth-vol" })
  }

  tags = var.tags

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_autoscaling_group" "app" {
  name                = "${var.name_prefix}-auth-asg"
  vpc_zone_identifier = var.private_app_subnet_ids
  min_size            = local.asg_min
  desired_capacity    = local.asg_desired
  max_size            = local.asg_max

  launch_template {
    id      = aws_launch_template.app.id
    version = "$Latest"
  }

  health_check_type         = "ELB"
  health_check_grace_period = 180
  default_cooldown          = 180

  target_group_arns = [aws_lb_target_group.app.arn]

  termination_policies = ["OldestLaunchTemplate", "Default"]

  instance_refresh {
    strategy = "Rolling"
    preferences {
      min_healthy_percentage = 50
      instance_warmup        = 180
    }
  }

  tag {
    key                 = "Name"
    value               = "${var.name_prefix}-auth-asg"
    propagate_at_launch = true
  }

  dynamic "tag" {
    for_each = var.tags
    content {
      key                 = tag.key
      value               = tag.value
      propagate_at_launch = true
    }
  }

  lifecycle {
    create_before_destroy = true
    ignore_changes        = [desired_capacity]
  }
}

resource "aws_autoscaling_policy" "cpu_target" {
  name                   = "${var.name_prefix}-cpu50"
  autoscaling_group_name = aws_autoscaling_group.app.name
  policy_type            = "TargetTrackingScaling"
  estimated_instance_warmup = 180

  target_tracking_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ASGAverageCPUUtilization"
    }
    target_value = 50.0
  }
}
