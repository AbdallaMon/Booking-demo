import { prisma } from "@/lib/prisma";

/**
 * GET /api/stats
 * Returns dashboard overview statistics.
 */
export async function GET() {
  try {
    const now = new Date();
    const soonThreshold = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours from now

    const [
      totalBookings,
      pendingBookings,
      approvedBookings,
      activeNow,
      endingSoon,
      totalPlaces,
      totalUnits,
      recentBookings,
    ] = await Promise.all([
      prisma.booking.count(),
      prisma.booking.count({ where: { status: "pending" } }),
      prisma.booking.count({ where: { status: "approved" } }),
      // Active now: approved bookings where startAt <= now <= endAt
      prisma.booking.count({
        where: {
          status: "approved",
          startAt: { lte: now },
          endAt: { gte: now },
        },
      }),
      // Ending soon: approved bookings ending within 2h
      prisma.booking.count({
        where: {
          status: "approved",
          endAt: { gte: now, lte: soonThreshold },
        },
      }),
      prisma.place.count(),
      prisma.unit.count({ where: { isActive: true } }),
      prisma.booking.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          customer: { select: { fullName: true, telegramUsername: true } },
          place: { select: { name: true } },
          unit: { select: { name: true } },
        },
      }),
    ]);

    return Response.json({
      totalBookings,
      pendingBookings,
      approvedBookings,
      activeNow,
      endingSoon,
      totalPlaces,
      totalUnits,
      recentBookings,
    });
  } catch (err) {
    console.error("[GET /api/stats]", err);
    return Response.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
