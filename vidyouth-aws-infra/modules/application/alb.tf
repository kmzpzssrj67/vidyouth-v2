/**
 * Application Load Balancer.
 *
 *   - internet-facing, in the public subnets
 *   - HTTP :80 listener that 301-redirects to HTTPS :443
 *   - HTTPS :443 listener forwards to the target group, BUT we only attach
 *     the HTTPS listener if a certificate ARN is supplied (via the optional
 *     edge module). Until then, port 80 forwards directly to the app — fine
 *     for a learning environment without a domain.
 *
 * The HTTPS listener / ACM cert is wired in the edge module so this module
 * stays buildable without a domain.
 */

resource "aws_lb" "app" {
  name               = "${var.name_prefix}-alb"
  internal           = false
  load_balancer_type = "application"
  subnets            = var.public_subnet_ids
  security_groups    = [var.alb_security_group_id]

  drop_invalid_header_fields  = true
  enable_deletion_protection  = local.is_production
  enable_http2                = true
  idle_timeout                = 60

  tags = merge(var.tags, { Name = "${var.name_prefix}-alb" })
}

resource "aws_lb_target_group" "app" {
  name        = "${var.name_prefix}-app-tg"
  port        = 8080
  protocol    = "HTTP"
  target_type = "instance"
  vpc_id      = var.vpc_id

  deregistration_delay = 30

  health_check {
    enabled             = true
    path                = "/healthz"
    port                = "traffic-port"
    protocol            = "HTTP"
    matcher             = "200"
    interval            = 10
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 2
  }

  stickiness {
    enabled = false
    type    = "lb_cookie"
  }

  tags = merge(var.tags, { Name = "${var.name_prefix}-app-tg" })

  lifecycle {
    create_before_destroy = true
  }
}

# HTTP :80 listener.
# When the edge module ships and supplies a TLS cert, swap this for a 301
# redirect to https://. Until then, forward to the target group directly so
# the app is testable.
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.app.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }

  tags = var.tags
}
