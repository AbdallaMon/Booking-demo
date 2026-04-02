import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import BookingStatusClient from "./BookingStatusClient";

export default async function BookingStatusPage({ params }) {
  const { id } = await params;

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      place: { select: { name: true } },
      unit: {
        select: {
          name: true,
          description: true,
          capacity: true,
          rooms: true,
          bathrooms: true,
          floor: true,
          amenities: true,
        },
      },
      customer: {
        select: { fullName: true, telegramUsername: true },
      },
    },
  });

  if (!booking) notFound();

  // Serialize dates to strings for client component
  return (
    <BookingStatusClient
      booking={{
        ...booking,
        startAt: booking.startAt.toISOString(),
        endAt: booking.endAt.toISOString(),
        createdAt: booking.createdAt.toISOString(),
        updatedAt: booking.updatedAt.toISOString(),
      }}
    />
  );
}
