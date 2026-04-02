import { put } from "@vercel/blob";

/**
 * POST /api/upload/receipt
 * Accepts multipart/form-data with a "file" field.
 * Used only as an alternative direct upload path.
 * The Telegram bot uses its own upload logic in bot-flow.js.
 */
export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return Response.json(
        { error: "File exceeds 10MB limit" },
        { status: 400 },
      );
    }

    const ext = file.name.split(".").pop() ?? "bin";
    const blobName = `receipts/manual_${Date.now()}.${ext}`;

    const blob = await put(blobName, file.stream(), {
      access: "public",
      contentType: file.type,
    });

    return Response.json({ url: blob.url }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/upload/receipt]", err);
    return Response.json({ error: "Upload failed" }, { status: 500 });
  }
}
