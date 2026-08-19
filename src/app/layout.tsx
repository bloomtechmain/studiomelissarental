import type { Metadata } from "next";
import { Sora, Inter, Caveat } from "next/font/google";
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
  title: "Studio Melissa Rental",
  description: "Audio & PA equipment rentals — Central Texas",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sora.variable} ${inter.variable} ${caveat.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-paper text-navy">{children}</body>
    </html>
  );
}
