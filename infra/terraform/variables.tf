variable "aws_region" {
  description = "AWS region to deploy into"
  type        = string
  default     = "us-east-1"
}

variable "instance_name" {
  description = "Name of the Lightsail server instance"
  type        = string
  default     = "StudioMelissaRental"
}

variable "instance_bundle_id" {
  description = "Lightsail instance plan. VERIFY this is still valid before applying: run `aws lightsail get-bundles` and pick the ~2GB RAM plan (matches the $12/mo plan used yesterday)."
  type        = string
  default     = "small_3_0"
}

variable "instance_blueprint_id" {
  description = "OS image. VERIFY with `aws lightsail get-blueprints` if this errors."
  type        = string
  default     = "ubuntu_24_04"
}

variable "db_name" {
  description = "Name of the Lightsail database resource"
  type        = string
  default     = "StudioMelissaRentalDB"
}

variable "db_bundle_id" {
  description = "Lightsail database plan. VERIFY with `aws lightsail get-relational-database-bundles` (matches the $15/mo Standard plan used yesterday)."
  type        = string
  default     = "micro_2_0"
}

variable "db_blueprint_id" {
  description = "Database engine/version. VERIFY with `aws lightsail get-relational-database-blueprints`."
  type        = string
  default     = "postgres_18"
}

variable "db_master_database_name" {
  description = "Name of the actual database created inside the Postgres server"
  type        = string
  default     = "dbstudiomelissarental"
}

variable "db_master_username" {
  type    = string
  default = "postgres"
}

variable "db_master_password" {
  description = "Production database password. Set in terraform.tfvars (gitignored), never commit it, never put a real one in this file."
  type        = string
  sensitive   = true
}

variable "ssh_public_key" {
  description = "Contents of your local SSH public key file (e.g. ~/.ssh/id_ed25519.pub), so you can SSH in from your own terminal instead of the browser console."
  type        = string
}
