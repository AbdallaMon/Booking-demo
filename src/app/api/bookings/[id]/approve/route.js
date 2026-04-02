import { prisma } from "@/lib/prisma";
import { sendMessage } from "@/lib/telegram";
import { formatDateTime, bookingTypeLabel } from "@/lib/availability";

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const adminNote = body.adminNote ?? null;

    const booking = await prisma.booking.update({
      where: { id },
      data: { status: "approved", adminNote },
      include: {
        customer: true,
        place: { select: { name: true } },
        unit: { select: { name: true } },
      },
    });

    // Notify customer via Telegram
    const text = [
      `✅ <b>Booking Approved!</b>`,
      ``,
      `📍 ${booking.place.name} — ${booking.unit.name}`,
      `⏱ ${bookingTypeLabel(booking.bookingType)}`,
      `📅 ${formatDateTime(booking.startAt)} → ${formatDateTime(booking.endAt)}`,
      adminNote ? `💬 Note: ${adminNote}` : null,
      ``,
      `Enjoy your stay! 🏠`,
    ]
      .filter(Boolean)
      .join("\n");

    await sendMessage(booking.customer.telegramUserId, text);

    await prisma.notificationLog.create({
      data: {
        bookingId: id,
        type: "customer_approved",
        target: booking.customer.telegramUserId,
        status: "sent",
        payload: { text },
      },
    });

    return Response.json(booking);
  } catch (err) {
    console.error("[POST /api/bookings/[id]/approve]", err);
    return Response.json(
      { error: "Failed to approve booking" },
      { status: 500 },
    );
  }
}
