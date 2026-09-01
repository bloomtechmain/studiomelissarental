import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { SITE_URL } from "@/lib/seo";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [packages, categories] = await Promise.all([
    prisma.package.findMany({ where: { active: true }, select: { id: true } }),
    prisma.category.findMany({
      select: { id: true, items: { where: { active: true }, select: { id: true } } },
    }),
  ]);
  const items = categories.flatMap((c) => c.items);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/services`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/products`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/quote`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/contact`, changeFrequency: "monthly", priority: 0.6 },
  ];

  const packageRoutes: MetadataRoute.Sitemap = packages.map((pkg) => ({
    url: `${SITE_URL}/packages/${pkg.id}`,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const categoryRoutes: MetadataRoute.Sitemap = categories
    .filter((c) => c.items.length > 0)
    .map((cat) => ({
      url: `${SITE_URL}/products/${cat.id}`,
      changeFrequency: "daily",
      priority: 0.7,
    }));

  const itemRoutes: MetadataRoute.Sitemap = items.map((item) => ({
    url: `${SITE_URL}/items/${item.id}`,
    changeFrequency: "daily",
    priority: 0.5,
  }));

  return [...staticRoutes, ...packageRoutes, ...categoryRoutes, ...itemRoutes];
}
