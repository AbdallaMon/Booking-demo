import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/availability";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const placeId = searchParams.get("placeId");

    const where = placeId ? { placeId } : {};

    const units = await prisma.unit.findMany({
      where,
      orderBy: { name: "asc" },
      include: {
        place: { select: { id: true, name: true } },
        _count: { select: { bookings: true } },
      },
    });
    return Response.json(units);
  } catch (err) {
    console.error("[GET /api/units]", err);
    return Response.json({ error: "Failed to fetch units" }, { status: 500 });
  }
}

/** Parse optional float — returns null for empty/undefined. */
function parseFloat_(v) {
  if (v === "" || v == null) return null;
  const n = parseFloat(v);
  return isNaN(n) ? null : n;
}

/** Parse optional int — returns fallback for empty/undefined. */
function parseInt_(v, fallback = 1) {
  if (v === "" || v == null) return fallback;
  const n = parseInt(v, 10);
  return isNaN(n) ? fallback : n;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      name,
      placeId,
      description,
      capacity,
      rooms,
      bathrooms,
      floor,
      amenities,
      basePriceNotes,
      price6h,
      price12h,
      price24h,
      pricePerDay,
      supports6h,
      supports12h,
      supports24h,
      supportsMultiDay,
      isActive,
    } = body;

    if (!name || !placeId) {
      return Response.json(
        { error: "name and placeId are required" },
        { status: 400 },
      );
    }

    const slug = slugify(`${name}-${placeId.slice(0, 6)}`);

    const unit = await prisma.unit.create({
      data: {
        name: name.trim(),
        slug,
        placeId,
        description: description?.trim() ?? null,
        capacity: parseInt_(capacity),
        rooms: parseInt_(rooms),
        bathrooms: parseInt_(bathrooms),
        floor: floor != null && floor !== "" ? parseInt_(floor, null) : null,
        amenities: amenities?.trim() ?? null,
        basePriceNotes: basePriceNotes?.trim() ?? null,
        price6h: parseFloat_(price6h),
        price12h: parseFloat_(price12h),
        price24h: parseFloat_(price24h),
        pricePerDay: parseFloat_(pricePerDay),
        supports6h: Boolean(supports6h ?? true),
        supports12h: Boolean(supports12h ?? true),
        supports24h: Boolean(supports24h ?? true),
        supportsMultiDay: Boolean(supportsMultiDay ?? false),
        isActive: Boolean(isActive ?? true),
      },
      include: { place: true },
    });
    return Response.json(unit, { status: 201 });
  } catch (err) {
    console.error("[POST /api/units]", err);
    return Response.json({ error: "Failed to create unit" }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) return Response.json({ error: "id is required" }, { status: 400 });

    const unit = await prisma.unit.update({
      where: { id },
      data: {
        ...(data.name != null && { name: data.name.trim() }),
        ...(data.description != null && {
          description: data.description.trim(),
        }),
        ...(data.capacity != null && { capacity: parseInt_(data.capacity) }),
        ...(data.rooms != null && { rooms: parseInt_(data.rooms) }),
        ...(data.bathrooms != null && { bathrooms: parseInt_(data.bathrooms) }),
        ...("floor" in data && {
          floor: data.floor !== "" ? parseInt_(data.floor, null) : null,
        }),
        ...("amenities" in data && {
          amenities: data.amenities?.trim() ?? null,
        }),
        ...(data.basePriceNotes != null && {
          basePriceNotes: data.basePriceNotes.trim(),
        }),
        ...("price6h" in data && { price6h: parseFloat_(data.price6h) }),
        ...("price12h" in data && { price12h: parseFloat_(data.price12h) }),
        ...("price24h" in data && { price24h: parseFloat_(data.price24h) }),
        ...("pricePerDay" in data && {
          pricePerDay: parseFloat_(data.pricePerDay),
        }),
        ...(data.supports6h != null && {
          supports6h: Boolean(data.supports6h),
        }),
        ...(data.supports12h != null && {
          supports12h: Boolean(data.supports12h),
        }),
        ...(data.supports24h != null && {
          supports24h: Boolean(data.supports24h),
        }),
        ...(data.supportsMultiDay != null && {
          supportsMultiDay: Boolean(data.supportsMultiDay),
        }),
        ...(data.isActive != null && { isActive: Boolean(data.isActive) }),
      },
      include: { place: true },
    });
    return Response.json(unit);
  } catch (err) {
    console.error("[PUT /api/units]", err);
    return Response.json({ error: "Failed to update unit" }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return Response.json({ error: "id is required" }, { status: 400 });

    await prisma.unit.delete({ where: { id } });
    return Response.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/units]", err);
    return Response.json({ error: "Failed to delete unit" }, { status: 500 });
  }
}
