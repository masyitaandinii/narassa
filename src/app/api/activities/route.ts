import { json } from "@/lib/api";
import { getDB } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const type = searchParams.get("type");
  const q = searchParams.get("q")?.toLowerCase();
  const sort = searchParams.get("sort") || "date_asc";
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? Math.max(1, parseInt(limitParam, 10) || 100) : 100;

  const db = await getDB();
  let items = [...db.activities];

  if (category && category !== "Semua") {
    items = items.filter(
      (a) => a.category.toLowerCase() === category.toLowerCase()
    );
  }

  if (type && type !== "Semua") {
    items = items.filter((a) => a.type === type);
  }

  if (q) {
    items = items.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.location.toLowerCase().includes(q)
    );
  }

  if (sort === "date_desc") {
    items.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  } else if (sort === "created_desc") {
    items.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  } else {
    // date_asc (default)
    items.sort((a, b) => (a.date || "").localeCompare(b.date || ""));
  }

  if (limit > 0 && items.length > limit) {
    items = items.slice(0, limit);
  }

  return json({
    ok: true,
    jumlah: items.length,
    items,
    activities: items,
  });
}
