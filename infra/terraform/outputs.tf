output "static_ip" {
  description = "Visit this in a browser once the app is deployed"
  value       = aws_lightsail_static_ip.app.ip_address
}

output "database_endpoint" {
  description = "Use this as the host in DATABASE_URL on the server"
  value       = aws_lightsail_database.db.master_endpoint_address
}

output "database_port" {
  value = aws_lightsail_database.db.master_endpoint_port
}

output "ssh_command" {
  value = "ssh -i <path-to-your-private-key> ubuntu@${aws_lightsail_static_ip.app.ip_address}"
}
