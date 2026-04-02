import { prisma } from "@/lib/prisma";
import { sendMessage } from "@/lib/telegram";

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const adminNote = body.adminNote ?? null;

    const booking = await prisma.booking.update({
      where: { id },
      data: { status: "rejected", adminNote },
      include: {
        customer: true,
        place: { select: { name: true } },
        unit: { select: { name: true } },
      },
    });

    const text = [
      `❌ <b>Booking Rejected</b>`,
      ``,
      `Your booking request for <b>${booking.unit.name}</b> at <b>${booking.place.name}</b> was not approved.`,
      adminNote ? `💬 Reason: ${adminNote}` : null,
      ``,
      `Please send /start to try a new booking.`,
    ]
      .filter(Boolean)
      .join("\n");

    await sendMessage(booking.customer.telegramUserId, text);

    await prisma.notificationLog.create({
      data: {
        bookingId: id,
        type: "customer_rejected",
        target: booking.customer.telegramUserId,
        status: "sent",
        payload: { text },
      },
    });

    return Response.json(booking);
  } catch (err) {
    console.error("[POST /api/bookings/[id]/reject]", err);
    return Response.json(
      { error: "Failed to reject booking" },
      { status: 500 },
    );
  }
}
