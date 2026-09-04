#!/bin/bash
# Runs once, automatically, the first time the Lightsail instance boots.
# Replaces the manual "install Node/git/nginx/pm2" steps from yesterday.
set -e

apt-get update -y
apt-get upgrade -y

curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs git nginx

npm install -g pm2

# nginx's installed default is 1MB, which silently 413s any upload over
# that (gallery/item photos, signed agreements) before it ever reaches the
# app, regardless of the app's own upload limits — bit us in production
# once already (see DEPLOY.md). Baking the fix into first boot so a fresh
# server doesn't regress back to the 1MB default.
if ! grep -q 'client_max_body_size' /etc/nginx/sites-available/default; then
  sed -i '/server_name _;/a\    client_max_body_size 25m;' /etc/nginx/sites-available/default
  nginx -t && systemctl reload nginx
fi
