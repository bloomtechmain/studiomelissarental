# --- SSH key so you can connect from your own terminal ---
resource "aws_lightsail_key_pair" "deployer" {
  name       = "${var.instance_name}-key"
  public_key = var.ssh_public_key
}

# --- The application server ---
resource "aws_lightsail_instance" "app" {
  name              = var.instance_name
  availability_zone = "${var.aws_region}a"
  blueprint_id      = var.instance_blueprint_id
  bundle_id         = var.instance_bundle_id
  key_pair_name     = aws_lightsail_key_pair.deployer.name

  # Installs Node.js, git, nginx, and pm2 automatically the first time the
  # server boots, so those steps from yesterday's manual run don't need
  # to be repeated by hand.
  user_data = file("${path.module}/user_data.sh")
}

# --- Firewall: only SSH/HTTP/HTTPS open, same as yesterday ---
resource "aws_lightsail_instance_public_ports" "app_firewall" {
  instance_name = aws_lightsail_instance.app.name

  port_info {
    protocol   = "tcp"
    from_port  = 22
    to_port    = 22
    cidrs      = ["0.0.0.0/0"]
    ipv6_cidrs = ["::/0"]
  }
  port_info {
    protocol   = "tcp"
    from_port  = 80
    to_port    = 80
    cidrs      = ["0.0.0.0/0"]
    ipv6_cidrs = ["::/0"]
  }
  port_info {
    protocol   = "tcp"
    from_port  = 443
    to_port    = 443
    cidrs      = ["0.0.0.0/0"]
    ipv6_cidrs = ["::/0"]
  }
}

# --- Static (permanent) IP address, attached to the server ---
resource "aws_lightsail_static_ip" "app" {
  name = "${var.instance_name}-ip"
}

resource "aws_lightsail_static_ip_attachment" "app" {
  static_ip_name = aws_lightsail_static_ip.app.name
  instance_name  = aws_lightsail_instance.app.name
}

# --- Managed Postgres database, not exposed to the public internet ---
resource "aws_lightsail_database" "db" {
  relational_database_name = var.db_name
  availability_zone         = "${var.aws_region}a"
  blueprint_id              = var.db_blueprint_id
  bundle_id                 = var.db_bundle_id
  master_database_name      = var.db_master_database_name
  master_username           = var.db_master_username
  master_password           = var.db_master_password
  publicly_accessible       = false
  skip_final_snapshot       = true
}
