#!/bin/bash
# Runs once, automatically, the first time the Lightsail instance boots.
# Replaces the manual "install Node/git/nginx/pm2" steps from yesterday.
set -e

apt-get update -y
apt-get upgrade -y

curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs git nginx

npm install -g pm2
