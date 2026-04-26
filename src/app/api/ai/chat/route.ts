import { NextResponse } from "next/server";
import { CHAT_SYSTEM_PROMPT } from "@/lib/ai/prompts";

export const runtime = "nodejs";

const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export async function POST(req: Request) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "Server is missing GEMINI_API_KEY. Add it to .env.local." },
      { status: 500 },
    );
  }

  try {
    const body = await req.json();
    const { messages, context } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid messages array" }, { status: 400 });
    }

    const contextStr = context
      ? `Current Section: ${context.section}\nDraft Context: ${JSON.stringify(context.draftData, null, 2)}`
      : "No context provided.";

    const systemInstruction = `${CHAT_SYSTEM_PROMPT}\n\nContext:\n${contextStr}`;

    const formattedMessages = messages.map((m: any) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    }));

    const r = await fetch(`${GEMINI_URL}?key=${process.env.GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents: formattedMessages,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000,
        },
      }),
    });

    const data = await r.json();
    if (!r.ok) {
      throw new Error(data.error?.message ?? `Gemini request failed (${r.status})`);
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    if (!text) {
      throw new Error("Gemini returned an empty response");
    }

    return NextResponse.json({ text });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
