import { handleUpdate } from "@/lib/bot-flow";

/**
 * POST /api/telegram/webhook
 * Receives updates from Telegram and delegates to the bot flow handler.
 * Must respond with 200 quickly to avoid Telegram retries.
 */
export async function POST(request) {
  let update;
  try {
    update = await request.json();
    console.log(
      "[Webhook] Received update type:",
      update.message
        ? `message("${update.message.text ?? "<media>"}" from ${update.message.from?.id})`
        : update.callback_query
          ? `callback("${update.callback_query.data}" from ${update.callback_query.from?.id})`
          : JSON.stringify(Object.keys(update)),
    );
    await handleUpdate(update);
    console.log("[Webhook] Update handled successfully");
  } catch (err) {
    console.error("[Webhook] Error processing update:", err);
  }

  return new Response("OK", { status: 200 });
}

/**
 * GET /api/telegram/webhook
 * Helper: register the webhook URL with Telegram.
 * Call this once after deployment: GET /api/telegram/webhook
 */
export async function GET(request) {
  // Simple guard — only allow if APP_URL is configured (proof you own the server)
  if (!process.env.APP_URL) {
    return Response.json({ error: "APP_URL not set" }, { status: 400 });
  }

  const webhookUrl = `${process.env.APP_URL}/api/telegram/webhook`;

  const res = await fetch(
    `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/setWebhook`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: webhookUrl }),
    },
  );
  const data = await res.json();
  return Response.json(data);
}
