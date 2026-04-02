import { prisma } from "@/lib/prisma";

const BOOKING_INCLUDE = {
  customer: true,
  place: { select: { id: true, name: true } },
  unit: { select: { id: true, name: true, capacity: true } },
};

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const unitId = searchParams.get("unitId");
    const placeId = searchParams.get("placeId");

    const where = {};
    if (status) where.status = status;
    if (unitId) where.unitId = unitId;
    if (placeId) where.placeId = placeId;

    const bookings = await prisma.booking.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: BOOKING_INCLUDE,
    });
    return Response.json(bookings);
  } catch (err) {
    console.error("[GET /api/bookings]", err);
    return Response.json(
      { error: "Failed to fetch bookings" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      customerId,
      placeId,
      unitId,
      bookingType,
      startAt,
      endAt,
      peopleCount,
      adminNote,
    } = body;

    if (
      !customerId ||
      !placeId ||
      !unitId ||
      !bookingType ||
      !startAt ||
      !endAt
    ) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const booking = await prisma.booking.create({
      data: {
        customerId,
        placeId,
        unitId,
        bookingType,
        startAt: new Date(startAt),
        endAt: new Date(endAt),
        peopleCount: peopleCount ? parseInt(peopleCount, 10) : null,
        adminNote: adminNote ?? null,
        status: "pending",
      },
      include: BOOKING_INCLUDE,
    });
    return Response.json(booking, { status: 201 });
  } catch (err) {
    console.error("[POST /api/bookings]", err);
    return Response.json(
      { error: "Failed to create booking" },
      { status: 500 },
    );
  }
}
