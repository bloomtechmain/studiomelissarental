# Studio Melissa Rental

Public website and booking platform for Studio Melissa Rental — professional PA and audio
equipment rental for homes, corporate events, and commercial productions across the Greater
Austin area. Built with Next.js (App Router), Prisma/PostgreSQL, and Tailwind CSS.

## Features

- **Public site** — home, services (package tiers), products (à la carte equipment catalog),
  request-a-quote flow, and contact page, all backed by a real, admin-managed inventory.
- **Booking & cart** — real-time availability, online checkout, and Stripe-powered payments.
- **Quote requests** — a 3-step public form (event date/time → details → e-signed agreement)
  that emails the team inbox on submission.
- **Contact form** — lightweight name/email/phone/message form, also emailed to the team inbox.
- **Service area map** — interactive Leaflet map centered on Pflugerville with a 70km delivery
  radius and city markers.
- **Admin dashboard** — inventory, bookings, leads, quotes, and staff management at `/admin`.

## Getting started

Install dependencies and set up the database:

```bash
npm install
npx prisma migrate dev
npm run seed   # optional — seeds a demo admin user and settings
```

Run the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the public site, or
[http://localhost:3000/admin](http://localhost:3000/admin) for the admin dashboard.

## Environment variables

Create a `.env` file (never committed) with:

| Variable | Required for |
| --- | --- |
| `DATABASE_URL` | Prisma / PostgreSQL connection |
| `SESSION_SECRET` | Admin staff sessions |
| `CUSTOMER_SESSION_SECRET` | Customer account sessions |
| `SIGNATURE_ENCRYPTION_KEY` | Encrypting e-signature codes on leads/bookings |
| `STRIPE_SECRET_KEY` | Payments |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook verification |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` | Outbound email (quote/contact notifications, payment links) |
| `SMTP_FROM_EMAIL` | Optional — overrides the default "From" address |

## Tech stack

- [Next.js](https://nextjs.org) (App Router) + TypeScript
- [Prisma](https://www.prisma.io) + PostgreSQL
- [Tailwind CSS](https://tailwindcss.com)
- [Leaflet](https://leafletjs.com) / react-leaflet for the service-area map
- [Stripe](https://stripe.com) for payments
- [Nodemailer](https://nodemailer.com) (Zoho SMTP) for transactional email

## Deployment

Deployed to a production server over SSH (see `.github/workflows/deploy.yml`). Pushing to
`main` triggers a GitHub Actions job that pulls the latest code, runs `npm ci`,
`npx prisma generate`, `npx prisma migrate deploy`, `npm run build`, and restarts the app via
`pm2`. Make sure all required environment variables above are set in the server's `.env` file
before deploying schema or config changes.
