import { handleUpdate } from "@/lib/bot-flow";

/**
 * POST /api/telegram/webhook
 * Receives updates from Telegram and delegates to the bot flow handler.
 * Must respond with 200 quickly to avoid Telegram retries.
 */
export async function POST(request) {
  try {
    const update = await request.json();
    // Process asynchronously without awaiting to respond 200 immediately
    // Note: On Vercel, the function must complete before response returns,
    // so we await but keep handling fast.
    await handleUpdate(update);
  } catch (err) {
    console.error("[Telegram Webhook] Error:", err);
  }

  // Always return 200 to Telegram
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
