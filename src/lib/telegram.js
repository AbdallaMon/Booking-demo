/**
 * Telegram Bot API helpers
 */

const BASE = () =>
  `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

async function tgPost(method, body) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.error("[Telegram] TELEGRAM_BOT_TOKEN is not set!");
    return { ok: false, error: "TELEGRAM_BOT_TOKEN not set" };
  }
  const url = `https://api.telegram.org/bot${token}/${method}`;
  console.log(`[Telegram] POST ${method}`, JSON.stringify(body).slice(0, 200));
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!data.ok) {
    console.error(`[Telegram] ${method} failed:`, JSON.stringify(data));
  }
  return data;
}

export async function sendMessage(chatId, text, extra = {}) {
  return tgPost("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    ...extra,
  });
}

export async function editMessageText(chatId, messageId, text, extra = {}) {
  return tgPost("editMessageText", {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: "HTML",
    ...extra,
  });
}

export async function answerCallbackQuery(callbackQueryId, text = "") {
  return tgPost("answerCallbackQuery", {
    callback_query_id: callbackQueryId,
    text,
  });
}

export async function getFile(fileId) {
  const res = await fetch(
    `${BASE()}/getFile?file_id=${encodeURIComponent(fileId)}`,
  );
  return res.json();
}

/**
 * Returns a Response object for streaming the Telegram file content.
 */
export async function downloadTelegramFile(filePath) {
  const url = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${filePath}`;
  return fetch(url);
}

/**
 * Build an inline keyboard markup object.
 * @param {Array<Array<{text:string, callback_data:string}>>} rows
 */
export function inlineKeyboard(rows) {
  return { reply_markup: { inline_keyboard: rows } };
}

/**
 * Send notification to admin chat.
 */
export async function notifyAdmin(text) {
  const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (!adminChatId) {
    console.warn(
      "[Telegram] TELEGRAM_ADMIN_CHAT_ID not set, skipping admin notification",
    );
    return null;
  }
  return sendMessage(adminChatId, text);
}

/**
 * Register the webhook URL with Telegram.
 * Call this once during setup or via /api/setup-webhook.
 */
export async function setWebhook(webhookUrl) {
  return tgPost("setWebhook", { url: webhookUrl });
}
