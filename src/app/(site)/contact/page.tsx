import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Mail, MapPin, MessageSquareText, Navigation, Phone } from "lucide-react";
import ServiceAreaMap from "@/components/ServiceAreaMapLoader";
import ContactForm from "@/components/ContactForm";

// lucide-react deliberately ships no brand/wordmark logos, so the real
// Facebook glyph (not a generic "share" stand-in) has to be its own inline
// SVG — same prop shape as the lucide icons above so it drops into the
// same `card.icon` slot below.
function FacebookIcon({ className }: { className?: string; strokeWidth?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12S0 5.446 0 12.073c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string; strokeWidth?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2.16c3.2 0 3.58.012 4.85.07 1.17.054 1.8.249 2.23.415.55.216.95.475 1.38.9.42.42.68.82.9 1.38.16.42.36 1.05.41 2.22.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.22-.22.56-.48.96-.9 1.38-.43.42-.83.68-1.38.9-.43.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.22-.41-.56-.22-.96-.48-1.38-.9-.42-.42-.68-.82-.9-1.38-.16-.42-.36-1.05-.41-2.22-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.22.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.05-.36 2.22-.41 1.27-.06 1.65-.07 4.85-.07M12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63c-.79.31-1.46.72-2.13 1.38S.94 3.35.63 4.14C.33 4.9.13 5.78.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91.31.79.72 1.46 1.38 2.13.67.66 1.34 1.07 2.13 1.38.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56.79-.31 1.46-.72 2.13-1.38.66-.67 1.07-1.34 1.38-2.13.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91a5.87 5.87 0 0 0-1.38-2.13A5.87 5.87 0 0 0 19.86.63c-.76-.3-1.64-.5-2.91-.56C15.67.01 15.26 0 12 0zm0 5.84A6.16 6.16 0 1 0 18.16 12 6.16 6.16 0 0 0 12 5.84zM12 16a4 4 0 1 1 4-4 4 4 0 0 1-4 4zm6.41-10.85a1.44 1.44 0 1 0 1.44 1.44 1.44 1.44 0 0 0-1.44-1.44z" />
    </svg>
  );
}

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Have a question before you book, or need help figuring out the right PA system for your event? Reach out — call, email, or send a message.",
  alternates: { canonical: "/contact" },
};

const DIRECTIONS_URL = "https://www.google.com/maps/dir/?api=1&destination=30.4394,-97.6200";
const PHONE_DISPLAY = "(512) 906-8492";
const PHONE_HREF = "tel:+15129068492";
const EMAIL = "info@studiomelissarental.com";

const contactCards = [
  {
    icon: Phone,
    label: "Phone",
    value: PHONE_DISPLAY,
    href: PHONE_HREF,
    nowrap: true,
  },
  {
    icon: Mail,
    label: "Email",
    value: EMAIL,
    href: `mailto:${EMAIL}`,
    nowrap: true,
  },
  {
    icon: MapPin,
    label: "Service area",
    value: "Greater Austin, TX (Pflugerville-based)",
  },
  {
    icon: FacebookIcon,
    label: "Facebook",
    value: "Follow us",
    href: "https://www.facebook.com/profile.php?id=61593839501124",
    external: true,
  },
  {
    icon: InstagramIcon,
    label: "Instagram",
    value: "Follow us",
    href: "https://www.instagram.com/sudio_melissa_rental/",
    external: true,
  },
];

export default function ContactPage() {
  return (
    <div>
      <section className="relative isolate overflow-hidden bg-navy-dark">
        <Image
          src="/images/detail-stack.jpg"
          alt="Close-up of a professional PA speaker stack at dusk"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-navy-dark via-navy-dark/85 to-navy-dark/40" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-navy-dark/95 via-navy-dark/50 to-transparent" />

        <div className="relative mx-auto max-w-3xl px-6 py-16">
          <p className="tier-pill bg-white/10 text-amber ring-1 ring-inset ring-white/15">
            Get in touch
          </p>
          <h1 className="mt-4 font-display text-4xl font-semibold text-white sm:text-5xl">
            Contact us
          </h1>
          <p className="mt-3 text-lg leading-relaxed text-signal-light/80">
            Have a question before you book, or need help figuring out the right system for your
            event? Reach out — we&apos;re happy to talk it through.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-6 py-12">
        <div className="grid gap-4 sm:grid-cols-2">
          {contactCards.map((card) => {
            const Wrapper = card.href ? "a" : "div";
            return (
              <Wrapper
                key={card.label}
                {...(card.href ? { href: card.href } : {})}
                {...(card.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className={`group relative overflow-hidden rounded-2xl border border-line bg-white p-5 shadow-sm transition ${
                  card.href
                    ? "hover:-translate-y-1 hover:border-signal/50 hover:shadow-lg hover:shadow-signal/10"
                    : ""
                }`}
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-signal-light/40 text-signal transition group-hover:bg-amber/20 group-hover:text-amber-deep">
                  <card.icon className="h-5 w-5" strokeWidth={2.25} />
                </span>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-steel">
                  {card.label}
                </p>
                <p
                  className={`mt-1 text-base font-semibold text-navy ${card.nowrap ? "overflow-x-auto whitespace-nowrap" : ""}`}
                >
                  {card.value}
                </p>
              </Wrapper>
            );
          })}
        </div>

        <div className="mt-10">
          <h2 className="font-display text-xl font-semibold text-navy">Send us a message</h2>
          <div className="mt-4">
            <ContactForm />
          </div>
          <p className="mt-4 text-sm text-steel">
            We usually reply within one business day. For time-sensitive events, calling
            directly is fastest.
          </p>
        </div>

        <div className="relative mt-10 h-80 overflow-hidden rounded-2xl border border-line bg-white shadow-sm sm:h-96">
          <ServiceAreaMap />
          <a
            href={DIRECTIONS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute top-3 right-3 z-[1000] inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-sm font-semibold text-navy shadow-md ring-1 ring-line transition hover:bg-paper"
          >
            <Navigation className="h-4 w-4 text-signal" strokeWidth={2.25} />
            Directions
          </a>
        </div>

        <div className="mt-6 rounded-2xl border border-line bg-white p-7 shadow-sm">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-signal-light/50 text-signal">
              <MessageSquareText className="h-4 w-4" strokeWidth={2.25} />
            </span>
            <div>
              <h2 className="font-display text-lg font-semibold text-navy">Planning an event?</h2>
              <p className="text-sm text-steel">
                The fastest way to hear back is our quote request form — it goes straight to our
                team.
              </p>
            </div>
          </div>
          <Link
            href="/quote"
            className="mt-5 inline-flex w-fit items-center gap-1.5 rounded-full bg-navy px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
          >
            Request a quote
          </Link>
        </div>
      </div>
    </div>
  );
}
