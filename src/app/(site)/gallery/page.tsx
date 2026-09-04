import type { Metadata } from "next";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { Camera } from "lucide-react";
import GalleryGrid from "@/components/GalleryGrid";

export const metadata: Metadata = {
  title: "Photo Gallery — Studio Melissa Rental",
  description:
    "A look at our PA and audio equipment set up for real events across the Greater Austin area — backyard parties, halls, and festival-scale productions.",
  alternates: { canonical: "/gallery" },
};

export const dynamic = "force-dynamic";

export default async function GalleryPage() {
  const images = await prisma.galleryImage.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  return (
    <div>
      <section className="relative isolate overflow-hidden bg-navy-dark">
        <Image
          src="/images/hero-stage.jpg"
          alt="Line-array PA stacks lit up on stage at dusk"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-navy-dark via-navy-dark/85 to-navy-dark/40" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-navy-dark/95 via-navy-dark/50 to-transparent" />

        <div className="relative mx-auto max-w-6xl px-6 py-16">
          <div className="max-w-2xl">
            <p className="tier-pill bg-white/10 text-amber ring-1 ring-inset ring-white/15">
              <Camera className="mr-1.5 -ml-0.5 h-3.5 w-3.5" strokeWidth={2.5} />
              Gallery
            </p>
            <h1 className="mt-4 font-display text-4xl font-semibold text-white sm:text-5xl">
              See it in action
            </h1>
            <p className="mt-3 text-lg leading-relaxed text-signal-light/80">
              A look at our equipment set up for real events — backyard parties, community halls,
              and festival-scale productions across Central Texas.
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6 py-12">
        {images.length > 0 ? (
          <GalleryGrid
            images={images.map((img) => ({
              id: img.id,
              imageUrl: img.imageUrl,
              caption: img.caption,
            }))}
          />
        ) : (
          <p className="py-16 text-center text-steel">
            Photos are on the way — check back soon.
          </p>
        )}
      </div>
    </div>
  );
}
