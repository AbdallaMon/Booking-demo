/**
 * Seed script — run with:  npx prisma db seed
 *
 * Creates:
 *  - 3 places
 *  - 2-3 units per place with full pricing details
 *  - 1 demo customer
 *  - sample bookings in various statuses
 */

import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapterFactory = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter: adapterFactory });

async function main() {
  console.log("🌱  Seeding database…");

  // ── Places ────────────────────────────────────────────
  const placeData = [
    { name: "Nasr City", slug: "nasr-city" },
    { name: "Maadi", slug: "maadi" },
    { name: "Alexandria", slug: "alexandria" },
  ];

  const places = [];
  for (const p of placeData) {
    const place = await prisma.place.upsert({
      where: { slug: p.slug },
      create: p,
      update: {},
    });
    places.push(place);
    console.log(`  ✓ Place: ${place.name}`);
  }

  const [nasrCity, maadi, alex] = places;

  // ── Units ────────────────────────────────────────────
  const unitsData = [
    // Nasr City
    {
      name: "Studio A1",
      slug: "studio-a1-nasr",
      placeId: nasrCity.id,
      description: "Cozy studio with city view, perfect for short stays",
      capacity: 2,
      rooms: 1,
      bathrooms: 1,
      floor: 3,
      amenities: "WiFi, AC, Smart TV, Kitchen",
      price6h: 200,
      price12h: 350,
      price24h: 550,
      pricePerDay: 500,
      supports6h: true,
      supports12h: true,
      supports24h: true,
      supportsMultiDay: true,
      isActive: true,
    },
    {
      name: "Deluxe Suite B2",
      slug: "deluxe-b2-nasr",
      placeId: nasrCity.id,
      description: "Spacious 2-bedroom suite with balcony",
      capacity: 5,
      rooms: 2,
      bathrooms: 2,
      floor: 7,
      amenities: "WiFi, AC, Balcony, Kitchen, Parking",
      basePriceNotes: "Includes parking",
      price6h: 400,
      price12h: 650,
      price24h: 900,
      pricePerDay: 850,
      supports6h: true,
      supports12h: true,
      supports24h: true,
      supportsMultiDay: true,
      isActive: true,
    },
    {
      name: "Economy Room C3",
      slug: "economy-c3-nasr",
      placeId: nasrCity.id,
      description: "Affordable clean room, 6h and 12h only",
      capacity: 2,
      rooms: 1,
      bathrooms: 1,
      floor: 1,
      amenities: "WiFi, AC, Fan",
      price6h: 120,
      price12h: 200,
      price24h: null,
      pricePerDay: null,
      supports6h: true,
      supports12h: true,
      supports24h: false,
      supportsMultiDay: false,
      isActive: true,
    },

    // Maadi
    {
      name: "Garden View Unit",
      slug: "garden-view-maadi",
      placeId: maadi.id,
      description: "Beautiful apartment overlooking the garden",
      capacity: 4,
      rooms: 2,
      bathrooms: 1,
      floor: 2,
      amenities: "WiFi, AC, Garden Access, Kitchen",
      price6h: 300,
      price12h: 500,
      price24h: 750,
      pricePerDay: 700,
      supports6h: true,
      supports12h: true,
      supports24h: true,
      supportsMultiDay: true,
      isActive: true,
    },
    {
      name: "Premium Penthouse",
      slug: "penthouse-maadi",
      placeId: maadi.id,
      description: "Luxury penthouse with panoramic views",
      capacity: 6,
      rooms: 3,
      bathrooms: 2,
      floor: 10,
      amenities: "WiFi, AC, Rooftop Terrace, Jacuzzi, Kitchen, Parking",
      price6h: 800,
      price12h: 1400,
      price24h: 2000,
      pricePerDay: 1800,
      supports6h: true,
      supports12h: true,
      supports24h: true,
      supportsMultiDay: true,
      isActive: true,
    },

    // Alexandria
    {
      name: "Sea View Apartment",
      slug: "sea-view-alex",
      placeId: alex.id,
      description: "Stunning sea view apartment in the heart of Alexandria",
      capacity: 6,
      rooms: 3,
      bathrooms: 2,
      floor: 8,
      amenities: "WiFi, AC, Sea View, Kitchen, Balcony",
      price6h: 500,
      price12h: 900,
      price24h: 1400,
      pricePerDay: 1300,
      supports6h: true,
      supports12h: true,
      supports24h: true,
      supportsMultiDay: true,
      isActive: true,
    },
    {
      name: "Corniche Budget Room",
      slug: "budget-room-alex",
      placeId: alex.id,
      description: "Budget-friendly near the corniche",
      capacity: 3,
      rooms: 1,
      bathrooms: 1,
      floor: null,
      amenities: "WiFi, Fan",
      price6h: 150,
      price12h: 250,
      price24h: 400,
      pricePerDay: 380,
      supports6h: true,
      supports12h: true,
      supports24h: true,
      supportsMultiDay: true,
      isActive: true,
    },
  ];

  const units = [];
  for (const u of unitsData) {
    const unit = await prisma.unit.upsert({
      where: { slug: u.slug },
      create: u,
      update: {
        price6h: u.price6h,
        price12h: u.price12h,
        price24h: u.price24h,
        pricePerDay: u.pricePerDay,
        rooms: u.rooms,
        bathrooms: u.bathrooms,
        floor: u.floor,
        amenities: u.amenities,
      },
    });
    units.push(unit);
    console.log(
      `  ✓ Unit: ${unit.name} (${places.find((p) => p.id === unit.placeId)?.name})`,
    );
  }

  // ── Demo customer ────────────────────────────────────
  const customer = await prisma.customer.upsert({
    where: { telegramUserId: "999000001" },
    create: {
      telegramUserId: "999000001",
      telegramUsername: "demo_customer",
      fullName: "Ahmed Hassan",
    },
    update: {},
  });
  console.log(`  ✓ Customer: ${customer.fullName}`);

  // ── Sample bookings ──────────────────────────────────
  const now = new Date();

  const bookingsData = [
    {
      customerId: customer.id,
      placeId: nasrCity.id,
      unitId: units[0].id, // Studio A1
      bookingType: "6h",
      startAt: new Date(now.getTime() + 2 * 60 * 60 * 1000), // 2h from now
      endAt: new Date(now.getTime() + 8 * 60 * 60 * 1000), // 8h from now
      peopleCount: 2,
      totalPrice: 200,
      status: "pending",
      receiptBlobUrl: null,
    },
    {
      customerId: customer.id,
      placeId: maadi.id,
      unitId: units[3].id, // Garden View
      bookingType: "24h",
      startAt: new Date(now.getTime() - 6 * 60 * 60 * 1000), // started 6h ago
      endAt: new Date(now.getTime() + 18 * 60 * 60 * 1000), // ends in 18h
      peopleCount: 3,
      totalPrice: 750,
      status: "approved",
      receiptBlobUrl: null,
    },
    {
      customerId: customer.id,
      placeId: alex.id,
      unitId: units[5].id, // Sea View
      bookingType: "multiday",
      startAt: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      endAt: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000), // 6 days from now
      peopleCount: 5,
      totalPrice: 3900,
      status: "pending",
      receiptBlobUrl: null,
    },
    {
      customerId: customer.id,
      placeId: nasrCity.id,
      unitId: units[1].id, // Deluxe Suite
      bookingType: "12h",
      startAt: new Date(now.getTime() - 48 * 60 * 60 * 1000),
      endAt: new Date(now.getTime() - 36 * 60 * 60 * 1000),
      peopleCount: 4,
      totalPrice: 650,
      status: "rejected",
      adminNote: "Receipt unclear, please resubmit",
      receiptBlobUrl: null,
    },
  ];

  for (const bData of bookingsData) {
    const b = await prisma.booking.create({ data: bData });
    console.log(`  ✓ Booking: ${b.bookingType} — ${b.status}`);
  }

  console.log("\n✅  Seed complete!");
}

main()
  .catch((e) => {
    console.error("❌  Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
