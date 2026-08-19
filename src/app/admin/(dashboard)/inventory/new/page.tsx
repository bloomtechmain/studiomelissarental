import { prisma } from "@/lib/prisma";
import NewItemForm from "./NewItemForm";

export const dynamic = "force-dynamic";

export default async function NewItemPage() {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-navy">New item</h1>
      <NewItemForm categories={categories} />
    </div>
  );
}
