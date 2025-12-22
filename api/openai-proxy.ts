export const config = { runtime: "deno" };

const DEFAULT_MODEL = "gpt-4o-mini";

const json = (status: number, data: unknown) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return json(405, { error: "Method Not Allowed" });
  }

  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) {
    return json(500, { error: "OPENAI_API_KEY is not set on the server" });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { messages, temperature = 0.7, model = DEFAULT_MODEL } = body ?? {};

    if (!messages || !Array.isArray(messages)) {
      return json(400, { error: "messages array is required" });
    }

    const upstream = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model, messages, temperature }),
    });

    if (!upstream.ok) {
      const text = await upstream.text();
      return json(upstream.status, { error: text });
    }

    const data = await upstream.json();
    const content = data?.choices?.[0]?.message?.content;

    if (!content || typeof content !== "string") {
      return json(502, { error: "Invalid response format from OpenAI" });
    }

    return json(200, { content });
  } catch (err) {
    console.error("openai-proxy error", err);
    return json(500, { error: "Unexpected server error" });
  }
}
