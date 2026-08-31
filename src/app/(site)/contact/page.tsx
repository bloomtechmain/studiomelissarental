import Image from "next/image";
import Link from "next/link";
import { Mail, MapPin, MessageSquareText, Navigation, Phone, Share2 } from "lucide-react";
import ServiceAreaMap from "@/components/ServiceAreaMapLoader";
import ContactForm from "@/components/ContactForm";

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
    icon: Share2,
    label: "Social",
    value: "Coming soon",
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
