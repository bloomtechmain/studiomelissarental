# Deploying with Terraform (Windows / PowerShell)

Replaces the manual Lightsail console clicking from 2026-08-19. Terraform
creates the same three things (server, database, static IP, firewall) but
from code, so it's repeatable and reviewable.

## 0. Clean up yesterday's manual resources

Nothing real is in them yet (schema wasn't even migrated), so it's safe to
delete and let Terraform create fresh ones — avoids ending up with two
servers and two databases.

In the Lightsail console: delete the `StudioMelissaRental` instance and the
`StudioMelissaRentalDB` database. Also release the static IP if one shows
as unattached afterward.

## 1. Install Terraform and the AWS CLI

```powershell
winget install Hashicorp.Terraform
winget install Amazon.AWSCLI
```

Close and reopen your terminal afterward, then confirm:

```powershell
terraform -version
aws --version
```

## 2. Create AWS credentials for Terraform to use

This one step has to be done by hand in the AWS console — Terraform needs
credentials before it can do anything.

1. AWS Console → IAM → Users → Create user (e.g. `terraform-deployer`).
2. Attach policy directly: `AmazonLightsailFullAccess`.
3. On the user → Security credentials tab → Create access key → choose
   "Command Line Interface (CLI)" → create it.
4. Copy the Access Key ID and Secret Access Key immediately (the secret is
   only shown once).

Then on your machine:

```powershell
aws configure
```

Paste in the Access Key ID, Secret Access Key, region `us-east-1`, and
output format `json` when prompted.

**Do not paste these keys into chat with me or anywhere else** — `aws
configure` stores them locally in `~/.aws/credentials`, which is all
Terraform needs.

## 3. Generate an SSH key (if you don't already have one)

```powershell
ssh-keygen -t ed25519 -C "studio-melissa-deploy"
```

Accept the default file location, press Enter through the passphrase
prompts (or set one if you prefer).

## 4. Configure this Terraform project

```powershell
cd D:\Melissa\app\infra\terraform
copy terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars`:
- `db_master_password` — a real strong password (not `postgres` this time).
- `ssh_public_key` — paste the contents of `id_ed25519.pub`:
  ```powershell
  type $env:USERPROFILE\.ssh\id_ed25519.pub
  ```

## 5. Verify the bundle/blueprint IDs are still valid

AWS occasionally renames these. Quick check before applying:

```powershell
aws lightsail get-bundles --query "bundles[?ramSizeInGb==\`2\`].bundleId"
aws lightsail get-blueprints --query "blueprints[?name=='Ubuntu'].blueprintId"
aws lightsail get-relational-database-bundles --query "bundles[?ramSizeInGb==\`1\`].bundleId"
aws lightsail get-relational-database-blueprints --query "blueprints[?engine=='postgres'].blueprintId"
```

If any default in `variables.tf` doesn't appear in these lists, update it
(or override it in `terraform.tfvars`).

## 6. Deploy

```powershell
terraform init
terraform plan
terraform apply
```

Review the plan before typing `yes` — it should show 5 resources being
created (instance, key pair, firewall rules, static IP + attachment,
database). Takes a few minutes, mostly waiting on the database.

Note the `static_ip` and `database_endpoint` values it prints at the end.

## 7. Finish app setup on the server

Node/git/nginx/pm2 are already installed via the boot script. SSH in:

```powershell
ssh -i $env:USERPROFILE\.ssh\id_ed25519 ubuntu@<static_ip from step 6>
```

Then, on the server:

```bash
git clone https://github.com/bloomtechmain/studiomelissarental.git app
cd app

cat > .env <<'EOF'
DATABASE_URL="postgresql://postgres:<db_master_password>@<database_endpoint>:5432/dbstudiomelissarental"
SESSION_SECRET="<generate a fresh random 32+ byte string, don't reuse the local dev one>"
EOF

npm install
npx prisma migrate deploy
npx tsx prisma/import-inventory.ts   # loads the real 132-unit catalog
npm run build

pm2 start npm --name studio-melissa -- start
pm2 save
pm2 startup   # follow the printed instructions to enable on-reboot
```

Then configure Nginx as a reverse proxy from port 80 to the app's port
(3000 by default), same as planned yesterday, and reload:

```bash
sudo nano /etc/nginx/sites-available/default
# proxy_pass http://localhost:3000; inside the location / block
sudo nginx -t && sudo systemctl reload nginx
```

`user_data.sh` already raises nginx's `client_max_body_size` to 25MB on
first boot (nginx defaults to 1MB, which silently 413s any photo upload
over that — gallery photos, item photos, signed agreements — before it
ever reaches the app, independent of the app's own upload limits; bit us
in production on 2026-09-04). Nothing extra to do here on a fresh server —
just worth knowing it's not nginx's stock config if you ever go looking.

## 8. Verify

Visit `http://<static_ip>` in a browser.

## Changing infrastructure later

Edit the `.tf` files, then `terraform plan` to preview and `terraform
apply` to apply. Never hand-edit resources in the AWS console again once
they're Terraform-managed — console changes get silently reverted (or
cause errors) on the next `apply`.
