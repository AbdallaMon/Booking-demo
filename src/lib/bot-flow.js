/**
 * Telegram bot conversation flow handler.
 *
 * State machine:
 *   idle → choosing_place → choosing_booking_type → choosing_date
 *     → choosing_time → [if multiday: choosing_end_date]
 *     → showing_units → awaiting_receipt → done
 *
 * State + payload are persisted in BotState so the flow survives
 * serverless restarts between messages.
 */

import { prisma } from "./prisma.js";
import {
  sendMessage,
  answerCallbackQuery,
  getFile,
  downloadTelegramFile,
  inlineKeyboard,
  notifyAdmin,
} from "./telegram.js";
import {
  computeEndTime,
  computeTotalPrice,
  getAvailableUnits,
  bookingTypeLabel,
  formatDateTime,
} from "./availability.js";
import { put } from "@vercel/blob";

// ─── Entry point ────────────────────────────────────────

export async function handleUpdate(update) {
  try {
    if (update.message) {
      await handleMessage(update.message);
    } else if (update.callback_query) {
      await handleCallback(update.callback_query);
    }
  } catch (err) {
    console.error("[BotFlow] Unhandled error:", err);
  }
}

// ─── Helpers ────────────────────────────────────────────

async function getState(telegramUserId) {
  return prisma.botState.findUnique({ where: { telegramUserId } });
}

async function setState(telegramUserId, state, payload = {}) {
  return prisma.botState.upsert({
    where: { telegramUserId },
    create: { telegramUserId, state, payload },
    update: { state, payload, updatedAt: new Date() },
  });
}

async function upsertCustomer(from) {
  return prisma.customer.upsert({
    where: { telegramUserId: String(from.id) },
    create: {
      telegramUserId: String(from.id),
      telegramUsername: from.username ?? null,
      fullName:
        [from.first_name, from.last_name].filter(Boolean).join(" ") || null,
    },
    update: {
      telegramUsername: from.username ?? null,
      fullName:
        [from.first_name, from.last_name].filter(Boolean).join(" ") || null,
    },
  });
}

// Next 7 days as inline buttons (2 per row)
function buildDateButtons(fromDate = new Date()) {
  const buttons = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(fromDate);
    d.setDate(d.getDate() + i);
    const label = d.toLocaleDateString("en-GB", {
      weekday: "short",
      day: "2-digit",
      month: "short",
    });
    const value = d.toISOString().slice(0, 10); // YYYY-MM-DD
    buttons.push({ text: label, callback_data: `date:${value}` });
  }
  // Group into rows of 2
  const rows = [];
  for (let i = 0; i < buttons.length; i += 2)
    rows.push(buttons.slice(i, i + 2));
  return rows;
}

// Next 14 days for end-date picker, starting from day after startDate
function buildEndDateButtons(startDateStr) {
  const start = new Date(startDateStr);
  const buttons = [];
  for (let i = 1; i <= 14; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const label = d.toLocaleDateString("en-GB", {
      weekday: "short",
      day: "2-digit",
      month: "short",
    });
    const value = d.toISOString().slice(0, 10);
    buttons.push({ text: label, callback_data: `edate:${value}` });
  }
  const rows = [];
  for (let i = 0; i < buttons.length; i += 2)
    rows.push(buttons.slice(i, i + 2));
  return rows;
}

const TIME_SLOTS = [
  "06:00",
  "08:00",
  "10:00",
  "12:00",
  "14:00",
  "16:00",
  "18:00",
  "20:00",
  "22:00",
  "00:00",
];

function buildTimeButtons() {
  const buttons = TIME_SLOTS.map((t) => ({
    text: t,
    callback_data: `time:${t}`,
  }));
  const rows = [];
  for (let i = 0; i < buttons.length; i += 3)
    rows.push(buttons.slice(i, i + 3));
  return rows;
}

function buildPeopleButtons() {
  const counts = [1, 2, 3, 4, 5, 6];
  const buttons = counts.map((n) => ({
    text: String(n),
    callback_data: `people:${n}`,
  }));
  buttons.push({ text: "7+", callback_data: "people:7" });
  buttons.push({ text: "Skip", callback_data: "people:skip" });
  const rows = [];
  for (let i = 0; i < buttons.length; i += 4)
    rows.push(buttons.slice(i, i + 4));
  return rows;
}

function cancelButton() {
  return [[{ text: "❌ Cancel & Start Over", callback_data: "cancel" }]];
}

// ─── Message handler ────────────────────────────────────

async function handleMessage(message) {
  const userId = String(message.from.id);
  const text = (message.text || "").trim();

  await upsertCustomer(message.from);

  // /start always resets the flow
  if (text === "/start") {
    await resetFlow(userId, message.chat.id);
    return;
  }

  const botState = await getState(userId);
  if (!botState) {
    await resetFlow(userId, message.chat.id);
    return;
  }

  const chatId = message.chat.id;
  const state = botState.state;
  const payload =
    typeof botState.payload === "string"
      ? JSON.parse(botState.payload)
      : botState.payload;

  // Handle photo/document for receipt
  if (state === "awaiting_receipt") {
    await handleReceiptUpload(userId, chatId, message, payload);
    return;
  }

  // For any other state, prompt the user to use the buttons
  await sendMessage(
    chatId,
    "Please use the buttons above. Send /start to restart.",
    inlineKeyboard(cancelButton()),
  );
}

// ─── Callback handler ────────────────────────────────────

async function handleCallback(callbackQuery) {
  const userId = String(callbackQuery.from.id);
  const chatId = callbackQuery.message.chat.id;
  const data = callbackQuery.data || "";

  await answerCallbackQuery(callbackQuery.id);

  const botState = await getState(userId);
  const payload = botState
    ? typeof botState.payload === "string"
      ? JSON.parse(botState.payload)
      : botState.payload
    : {};

  if (data === "cancel") {
    await setState(userId, "idle", {});
    await sendMessage(
      chatId,
      "❌ Cancelled. Send /start to begin a new booking.",
    );
    return;
  }

  const [prefix, ...rest] = data.split(":");
  const value = rest.join(":");

  if (prefix === "place")
    return stepBookingType(userId, chatId, value, payload);
  if (prefix === "type") return stepDate(userId, chatId, value, payload);
  if (prefix === "date") return stepTime(userId, chatId, value, payload);
  if (prefix === "time") return stepAfterTime(userId, chatId, value, payload);
  if (prefix === "edate")
    return stepAfterEndDate(userId, chatId, value, payload);
  if (prefix === "people") return stepShowUnits(userId, chatId, value, payload);
  if (prefix === "unit")
    return stepConfirmBooking(userId, chatId, value, payload);
  if (data === "confirm") return stepAskReceipt(userId, chatId, payload);
  if (data === "back_to_start") return resetFlow(userId, chatId);
}

// ─── Flow steps ─────────────────────────────────────────

async function resetFlow(userId, chatId) {
  await setState(userId, "idle", {});

  const places = await prisma.place.findMany({ orderBy: { name: "asc" } });

  if (!places.length) {
    await sendMessage(
      chatId,
      "⚠️ No places available right now. Please check back later.",
    );
    return;
  }

  const rows = places.map((p) => [
    { text: p.name, callback_data: `place:${p.id}` },
  ]);

  await sendMessage(
    chatId,
    "🏠 <b>Welcome to Apartment Rental Booking!</b>\n\nPlease choose a location:",
    inlineKeyboard(rows),
  );
  await setState(userId, "choosing_place", {});
}

async function stepBookingType(userId, chatId, placeId, _payload) {
  const place = await prisma.place.findUnique({ where: { id: placeId } });
  if (!place) {
    await sendMessage(chatId, "❌ Place not found. /start to restart.");
    return;
  }

  const rows = [
    [
      { text: "⏱ 6 Hours", callback_data: "type:6h" },
      { text: "⏰ 12 Hours", callback_data: "type:12h" },
    ],
    [
      { text: "🌙 24 Hours", callback_data: "type:24h" },
      { text: "📅 Multiple Days", callback_data: "type:multiday" },
    ],
    ...cancelButton(),
  ];

  await sendMessage(
    chatId,
    `📍 <b>${place.name}</b>\n\nChoose booking duration:`,
    inlineKeyboard(rows),
  );
  await setState(userId, "choosing_booking_type", {
    placeId,
    placeName: place.name,
  });
}

async function stepDate(userId, chatId, bookingType, payload) {
  const rows = [...buildDateButtons(), ...cancelButton()];

  await sendMessage(
    chatId,
    `📅 Choose your <b>check-in date</b>:\n(Booking: ${bookingTypeLabel(bookingType)})`,
    inlineKeyboard(rows),
  );
  await setState(userId, "choosing_date", { ...payload, bookingType });
}

async function stepTime(userId, chatId, dateStr, payload) {
  const rows = [...buildTimeButtons(), ...cancelButton()];

  await sendMessage(
    chatId,
    `🕐 Choose <b>check-in time</b> for ${dateStr}:`,
    inlineKeyboard(rows),
  );
  await setState(userId, "choosing_time", { ...payload, startDate: dateStr });
}

async function stepAfterTime(userId, chatId, time, payload) {
  const { startDate, bookingType } = payload;
  const startAt = new Date(`${startDate}T${time}:00.000Z`);
  // Use local timezone assumption by parsing without Z for display but store UTC
  // For the demo we store as given; in production you'd convert to UTC properly

  if (bookingType === "multiday") {
    const rows = [...buildEndDateButtons(startDate), ...cancelButton()];
    await sendMessage(
      chatId,
      `📅 Choose the <b>check-out date</b>:`,
      inlineKeyboard(rows),
    );
    await setState(userId, "choosing_end_date", {
      ...payload,
      time,
      startAt: `${startDate}T${time}:00.000Z`,
    });
    return;
  }

  // For fixed-duration bookings, ask people count then show units
  const rows = [...buildPeopleButtons(), ...cancelButton()];
  await sendMessage(chatId, `👥 How many guests?`, inlineKeyboard(rows));
  await setState(userId, "choosing_people", {
    ...payload,
    time,
    startAt: `${startDate}T${time}:00.000Z`,
    endAt: computeEndTime(
      `${startDate}T${time}:00.000Z`,
      bookingType,
    ).toISOString(),
  });
}

async function stepAfterEndDate(userId, chatId, endDateStr, payload) {
  const { startAt } = payload;
  const endAt = `${endDateStr}T${payload.time}:00.000Z`;

  const rows = [...buildPeopleButtons(), ...cancelButton()];
  await sendMessage(chatId, `👥 How many guests?`, inlineKeyboard(rows));
  await setState(userId, "choosing_people", { ...payload, endAt });
}

async function stepShowUnits(userId, chatId, peopleValue, payload) {
  const { placeId, placeName, bookingType, startAt, endAt } = payload;
  const peopleCount = peopleValue === "skip" ? null : parseInt(peopleValue, 10);

  const units = await getAvailableUnits(prisma, {
    placeId,
    bookingType,
    startAt,
    endAt,
  });

  if (!units.length) {
    await sendMessage(
      chatId,
      `😔 No units available in <b>${placeName}</b> for your selected time.\n\nPlease try a different date/time or booking type.`,
      inlineKeyboard([
        [{ text: "🔄 Start Over", callback_data: "back_to_start" }],
      ]),
    );
    return;
  }

  // Build a descriptive list of units with price info
  const lines = [`🏠 <b>Available units in ${placeName}:</b>\n`];
  for (const u of units) {
    const price = computeTotalPrice(u, bookingType, startAt, endAt);
    const priceStr = price != null ? `💰 ${price} EGP` : "💰 Price on request";
    const amenitiesList = u.amenities ? `\n   🏷 ${u.amenities}` : "";
    lines.push(
      `<b>${u.name}</b>\n` +
        `   🛏 ${u.rooms} room(s) · 🚿 ${u.bathrooms} bath · 👥 Cap. ${u.capacity}` +
        (u.floor != null ? ` · Floor ${u.floor}` : "") +
        `\n   ${priceStr}` +
        (u.description ? `\n   📝 ${u.description}` : "") +
        amenitiesList,
    );
  }

  const rows = units.map((u) => {
    const price = computeTotalPrice(u, bookingType, startAt, endAt);
    const label =
      price != null
        ? `${u.name} — ${price} EGP`
        : `${u.name} (cap. ${u.capacity})`;
    return [{ text: label, callback_data: `unit:${u.id}` }];
  });
  rows.push(...cancelButton());

  await sendMessage(chatId, lines.join("\n\n"), inlineKeyboard(rows));
  await setState(userId, "choosing_unit", { ...payload, peopleCount });
}

async function stepConfirmBooking(userId, chatId, unitId, payload) {
  const { placeId, placeName, bookingType, startAt, endAt, peopleCount } =
    payload;

  const unit = await prisma.unit.findUnique({ where: { id: unitId } });
  if (!unit) {
    await sendMessage(chatId, "❌ Unit not found. Please /start again.");
    return;
  }

  const start = formatDateTime(startAt);
  const end = formatDateTime(endAt);
  const price = computeTotalPrice(unit, bookingType, startAt, endAt);
  const priceStr = price != null ? `💰 Total Price: <b>${price} EGP</b>` : null;

  const unitDetails = [
    `🛏 ${unit.rooms} room(s) · 🚿 ${unit.bathrooms} bath · 👥 Capacity ${unit.capacity}`,
    unit.floor != null ? `🏢 Floor ${unit.floor}` : null,
    unit.amenities ? `🏷 ${unit.amenities}` : null,
    unit.description ? `📝 ${unit.description}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const summary = [
    `📋 <b>Booking Summary</b>`,
    ``,
    `📍 Place: ${placeName}`,
    `🏠 Unit: ${unit.name}`,
    unitDetails,
    ``,
    `⏱ Duration: ${bookingTypeLabel(bookingType)}`,
    `📅 Check-in: ${start}`,
    `🔴 Check-out: ${end}`,
    peopleCount ? `👥 Guests: ${peopleCount}` : null,
    priceStr,
    ``,
    `Please confirm to proceed with payment upload:`,
  ]
    .filter(Boolean)
    .join("\n");

  const rows = [
    [{ text: "✅ Confirm & Upload Receipt", callback_data: "confirm" }],
    ...cancelButton(),
  ];

  await sendMessage(chatId, summary, inlineKeyboard(rows));
  await setState(userId, "confirming", {
    ...payload,
    unitId,
    unitName: unit.name,
    totalPrice: price,
  });
}

async function stepAskReceipt(userId, chatId, payload) {
  await sendMessage(
    chatId,
    "💳 Please upload your <b>payment receipt</b> as a photo or document.\n\n" +
      "(Max size: 10MB. Supported: JPG, PNG, PDF)",
    inlineKeyboard(cancelButton()),
  );
  await setState(userId, "awaiting_receipt", payload);
}

async function handleReceiptUpload(userId, chatId, message, payload) {
  // Accept photo or document
  let fileId = null;
  let fileName = "receipt";
  let mimeType = "image/jpeg";

  if (message.photo && message.photo.length > 0) {
    // Use largest photo
    const photo = message.photo[message.photo.length - 1];
    fileId = photo.file_id;
    fileName = `receipt_${userId}_${Date.now()}.jpg`;
    mimeType = "image/jpeg";
  } else if (message.document) {
    fileId = message.document.file_id;
    fileName = message.document.file_name ?? `receipt_${userId}_${Date.now()}`;
    mimeType = message.document.mime_type ?? "application/octet-stream";
  }

  if (!fileId) {
    await sendMessage(
      chatId,
      "⚠️ Please send a photo or document file as your receipt.",
    );
    return;
  }

  await sendMessage(chatId, "⏳ Processing your receipt...");

  try {
    // Download from Telegram
    const fileInfo = await getFile(fileId);
    if (!fileInfo.ok) throw new Error("Failed to get file info from Telegram");

    const fileResponse = await downloadTelegramFile(fileInfo.result.file_path);
    if (!fileResponse.ok)
      throw new Error("Failed to download file from Telegram");

    // Upload to Vercel Blob
    const blob = await put(`receipts/${fileName}`, fileResponse.body, {
      access: "public",
      contentType: mimeType,
    });

    const {
      placeId,
      unitId,
      bookingType,
      startAt,
      endAt,
      peopleCount,
      totalPrice,
    } = payload;

    // Upsert customer (already exists but ensure we have latest)
    const customer = await prisma.customer.findUnique({
      where: { telegramUserId: userId },
    });

    // Create the booking
    const booking = await prisma.booking.create({
      data: {
        customerId: customer.id,
        placeId,
        unitId,
        bookingType,
        startAt: new Date(startAt),
        endAt: new Date(endAt),
        peopleCount: peopleCount ?? null,
        totalPrice: totalPrice ?? null,
        status: "pending",
        receiptBlobUrl: blob.url,
      },
      include: {
        place: true,
        unit: true,
        customer: true,
      },
    });

    // Reset bot state
    await setState(userId, "idle", {});

    // Status page link
    const statusUrl = process.env.APP_URL
      ? `${process.env.APP_URL}/booking/${booking.id}`
      : null;

    // Notify customer
    await sendMessage(
      chatId,
      `✅ <b>Booking submitted successfully!</b>\n\n` +
        `Your booking is <b>pending admin review</b>.\n` +
        `You will be notified here once it is approved or rejected.\n\n` +
        (statusUrl ? `🔗 Track your booking: ${statusUrl}\n\n` : "") +
        `Booking ID: <code>${booking.id}</code>`,
    );

    // Notify admin
    const adminText = buildAdminNotification(booking);
    await notifyAdmin(adminText);

    // Log notification
    if (process.env.TELEGRAM_ADMIN_CHAT_ID) {
      await prisma.notificationLog.create({
        data: {
          bookingId: booking.id,
          type: "admin_new_booking",
          target: process.env.TELEGRAM_ADMIN_CHAT_ID,
          status: "sent",
          payload: { adminText },
        },
      });
    }
  } catch (err) {
    console.error("[BotFlow] Receipt upload error:", err);
    await sendMessage(
      chatId,
      "❌ Failed to process your receipt. Please try again or contact support.\n\nSend /start to retry.",
    );
  }
}

function buildAdminNotification(booking) {
  const { customer, place, unit } = booking;
  const appUrl = process.env.APP_URL ?? "";
  return [
    `🔔 <b>New Booking Request</b>`,
    ``,
    `👤 Customer: ${customer.fullName ?? "Unknown"} (@${customer.telegramUsername ?? customer.telegramUserId})`,
    `🆔 Telegram ID: <code>${customer.telegramUserId}</code>`,
    `📍 Place: ${place.name}`,
    `🏠 Unit: ${unit.name}`,
    `⏱ Type: ${bookingTypeLabel(booking.bookingType)}`,
    `📅 Check-in: ${formatDateTime(booking.startAt)}`,
    `🔴 Check-out: ${formatDateTime(booking.endAt)}`,
    booking.peopleCount ? `👥 Guests: ${booking.peopleCount}` : null,
    booking.totalPrice != null ? `💰 Total: ${booking.totalPrice} EGP` : null,
    `💳 Receipt: ${booking.receiptBlobUrl}`,
    ``,
    `👉 Review: ${appUrl}/dashboard/bookings/${booking.id}`,
  ]
    .filter(Boolean)
    .join("\n");
}
