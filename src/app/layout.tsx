import type { Metadata } from "next";
import { Sora, Inter, Caveat } from "next/font/google";
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from "@/lib/seo";
import "./globals.css";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

// The style guide's "two families" rule is about the site's actual
// typography — this is a narrow, deliberate exception scoped only to
// rendering a typed e-signature as a script mark, never used for real UI text.
const caveat = Caveat({
  variable: "--font-signature",
  subsets: ["latin"],
  weight: ["600"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Austin PA & Audio Equipment Rental`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "audio equipment rental Austin",
    "PA system rental Austin",
    "speaker rental Austin",
    "event sound rental Central Texas",
    "wedding PA rental",
    "corporate event audio rental",
    "microphone rental Austin",
  ],
  authors: [{ name: SITE_NAME }],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Austin PA & Audio Equipment Rental`,
    description: SITE_DESCRIPTION,
    images: [{ url: "/images/hero-stage.jpg", width: 1200, height: 630, alt: SITE_NAME }],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — Austin PA & Audio Equipment Rental`,
    description: SITE_DESCRIPTION,
    images: ["/images/hero-stage.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  icons: { icon: "/favicon.ico" },
};

const localBusinessJsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": `${SITE_URL}/#business`,
  name: SITE_NAME,
  description: SITE_DESCRIPTION,
  url: SITE_URL,
  telephone: "+1-512-906-8492",
  email: "info@studiomelissarental.com",
  image: `${SITE_URL}/images/hero-stage.jpg`,
  priceRange: "$$",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Pflugerville",
    addressRegion: "TX",
    addressCountry: "US",
  },
  areaServed: [
    "Austin",
    "Round Rock",
    "Georgetown",
    "Cedar Park",
    "Hutto",
    "Kyle",
    "Buda",
    "San Marcos",
    "Dripping Springs",
    "Pflugerville",
  ].map((name) => ({ "@type": "City", name })),
  sameAs: [],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sora.variable} ${inter.variable} ${caveat.variable} h-full antialiased`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-paper text-navy">{children}</body>
    </html>
  );
}
