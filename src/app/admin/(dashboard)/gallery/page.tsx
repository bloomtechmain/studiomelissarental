import { prisma } from "@/lib/prisma";
import GalleryClient from "./GalleryClient";

export const dynamic = "force-dynamic";

export default async function AdminGalleryPage() {
  const images = await prisma.galleryImage.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-navy">Gallery</h1>
      <p className="mt-1 text-sm text-steel">
        Photos uploaded here appear on the public{" "}
        <a href="/gallery" target="_blank" rel="noopener noreferrer" className="text-signal hover:underline">
          /gallery
        </a>{" "}
        page, in this order.
      </p>
      <div className="mt-6">
        <GalleryClient
          images={images.map((img) => ({
            id: img.id,
            imageUrl: img.imageUrl,
            caption: img.caption,
          }))}
        />
      </div>
    </div>
  );
}
