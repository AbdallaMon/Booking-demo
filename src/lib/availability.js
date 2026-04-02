/**
 * Booking availability helpers
 */

/**
 * Compute end datetime from start + booking type.
 * For multi-day, pass endDate as an ISO string or Date.
 */
export function computeEndTime(startAt, bookingType, endDate = null) {
  const start = new Date(startAt);

  if (bookingType === "6h")
    return new Date(start.getTime() + 6 * 60 * 60 * 1000);
  if (bookingType === "12h")
    return new Date(start.getTime() + 12 * 60 * 60 * 1000);
  if (bookingType === "24h")
    return new Date(start.getTime() + 24 * 60 * 60 * 1000);
  if (bookingType === "multiday" && endDate) return new Date(endDate);

  throw new Error(
    `Invalid bookingType "${bookingType}" or missing endDate for multiday`,
  );
}

/**
 * Compute total price for a booking based on unit pricing and booking type.
 * Returns null if the unit has no price configured for this type.
 * @param {object} unit  – Prisma Unit record
 * @param {string} bookingType
 * @param {Date|string} startAt
 * @param {Date|string} endAt
 */
export function computeTotalPrice(unit, bookingType, startAt, endAt) {
  if (bookingType === "6h") return unit.price6h ?? null;
  if (bookingType === "12h") return unit.price12h ?? null;
  if (bookingType === "24h") return unit.price24h ?? null;
  if (bookingType === "multiday" && unit.pricePerDay != null) {
    const start = new Date(startAt);
    const end = new Date(endAt);
    const diffMs = end.getTime() - start.getTime();
    const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return unit.pricePerDay * Math.max(days, 1);
  }
  return null;
}

/**
 * Returns true if time range A overlaps with time range B.
 */
export function hasOverlap(startA, endA, startB, endB) {
  return startA < endB && endA > startB;
}

/**
 * Returns all units in a place that:
 *  - support the requested booking type
 *  - are active
 *  - have no accepted/pending booking overlapping the time range
 */
export async function getAvailableUnits(
  prisma,
  { placeId, bookingType, startAt, endAt },
) {
  const typeFilter = {
    "6h": { supports6h: true },
    "12h": { supports12h: true },
    "24h": { supports24h: true },
    multiday: { supportsMultiDay: true },
  }[bookingType];

  if (!typeFilter) return [];

  const units = await prisma.unit.findMany({
    where: { placeId, isActive: true, ...typeFilter },
    include: { place: true },
  });

  const start = new Date(startAt);
  const end = new Date(endAt);

  const available = [];
  for (const unit of units) {
    const conflict = await prisma.booking.findFirst({
      where: {
        unitId: unit.id,
        status: { in: ["pending", "approved"] },
        startAt: { lt: end },
        endAt: { gt: start },
      },
    });
    if (!conflict) available.push(unit);
  }

  return available;
}

/**
 * Human-readable label for a booking type.
 */
export function bookingTypeLabel(type) {
  return (
    {
      "6h": "6 Hours",
      "12h": "12 Hours",
      "24h": "24 Hours",
      multiday: "Multiple Days",
    }[type] ?? type
  );
}

/**
 * Format a Date to "DD/MM/YYYY HH:MM" for display.
 */
export function formatDateTime(date) {
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Simple slug generator.
 */
export function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "")
    .replace(/--+/g, "-");
}
