import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Input = { prompt: string; count: number };

export const generateQuotes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: Input) => ({
    prompt: String(input.prompt ?? "").slice(0, 500),
    count: Math.min(50, Math.max(1, Math.round(Number(input.count) || 1))),
  }))
  .handler(async ({ data }) => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("AI is not configured for this project.");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "You write short, punchy overlay captions for photos. Reply with ONLY the lines, one per line, no numbering, no quotes, no extra commentary. Each line must be under 90 characters.",
          },
          {
            role: "user",
            content: `Write exactly ${data.count} distinct line(s) about: ${data.prompt}`,
          },
        ],
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      if (res.status === 429) throw new Error("AI is rate limited right now. Try again in a moment.");
      if (res.status === 402) throw new Error("AI credits are exhausted for this workspace.");
      if (res.status === 403) throw new Error("AI access is blocked by workspace policy.");
      throw new Error(`AI request failed (${res.status}): ${body.slice(0, 200)}`);
    }

    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = json.choices?.[0]?.message?.content ?? "";
    const lines = text
      .split("\n")
      .map((l) => l.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").replace(/^["“']|["”']$/g, "").trim())
      .filter(Boolean)
      .slice(0, data.count);

    if (!lines.length) throw new Error("AI returned no sentences. Try a different prompt.");
    return { lines };
  });
