import { NextResponse } from "next/server";
import { CHAT_SYSTEM_PROMPT, INTERVIEW_SYSTEM_PROMPT } from "@/lib/ai/prompts";

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
    const { messages, context, interview } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid messages array" }, { status: 400 });
    }

    const contextStr = context
      ? [
          `Current pathname: ${context.pathname ?? "unknown"}`,
          `Current section: ${context.section ?? "unknown"}`,
          `Current page title: ${context.pageTitle ?? "unknown"}`,
          `User is currently looking at: ${context.userLookingAt ?? "unknown"}`,
          `Assistant focus on this page: ${context.assistantFocus ?? "unknown"}`,
          `Visible fields on this page: ${Array.isArray(context.visibleFields) ? context.visibleFields.join(", ") : "unknown"}`,
          `Draft Context: ${JSON.stringify(context.draftData ?? {}, null, 2)}`,
        ].join("\n")
      : "No context provided.";

    const basePrompt = interview ? INTERVIEW_SYSTEM_PROMPT : CHAT_SYSTEM_PROMPT;
    const sectionNote = interview && context?.section
      ? `\nYou are interviewing for the "${context.section}" section. The available fields and their current values are shown in the Draft Context above. Ask about the next empty field.`
      : "";
    const systemInstruction = `${basePrompt}${sectionNote}

You must automatically use the current page context below in every answer.
Do not answer as if the user is on a generic page when a current page is provided.
Prefer guidance that helps the user continue the form or task they are currently viewing.

Context:
${contextStr}`;

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
          temperature: interview ? 0.3 : 0.7,
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
