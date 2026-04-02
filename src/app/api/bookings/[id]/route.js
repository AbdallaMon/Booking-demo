import { prisma } from "@/lib/prisma";

const BOOKING_INCLUDE = {
  customer: true,
  place: { select: { id: true, name: true } },
  unit: { select: { id: true, name: true, capacity: true } },
};

export async function GET(_request, { params }) {
  try {
    const { id } = await params;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: BOOKING_INCLUDE,
    });

    if (!booking)
      return Response.json({ error: "Booking not found" }, { status: 404 });
    return Response.json(booking);
  } catch (err) {
    console.error("[GET /api/bookings/[id]]", err);
    return Response.json({ error: "Failed to fetch booking" }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const booking = await prisma.booking.update({
      where: { id },
      data: {
        ...(body.status && { status: body.status }),
        ...(body.adminNote != null && { adminNote: body.adminNote }),
      },
      include: BOOKING_INCLUDE,
    });
    return Response.json(booking);
  } catch (err) {
    console.error("[PATCH /api/bookings/[id]]", err);
    return Response.json(
      { error: "Failed to update booking" },
      { status: 500 },
    );
  }
}
