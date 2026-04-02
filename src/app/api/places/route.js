import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/availability";

export async function GET() {
  try {
    const places = await prisma.place.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { units: true, bookings: true } } },
    });
    return Response.json(places);
  } catch (err) {
    console.error("[GET /api/places]", err);
    return Response.json({ error: "Failed to fetch places" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return Response.json({ error: "Name is required" }, { status: 400 });
    }

    const slug = slugify(name.trim());

    const existing = await prisma.place.findUnique({ where: { slug } });
    if (existing) {
      return Response.json(
        { error: "A place with this name already exists" },
        { status: 409 },
      );
    }

    const place = await prisma.place.create({
      data: { name: name.trim(), slug },
    });
    return Response.json(place, { status: 201 });
  } catch (err) {
    console.error("[POST /api/places]", err);
    return Response.json({ error: "Failed to create place" }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return Response.json({ error: "id is required" }, { status: 400 });

    await prisma.place.delete({ where: { id } });
    return Response.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/places]", err);
    return Response.json({ error: "Failed to delete place" }, { status: 500 });
  }
}
