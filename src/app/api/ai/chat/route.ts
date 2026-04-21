// Next.js Route Handler — streams Ollama responses back to the browser
// POST /api/ai/chat
// Body: { messages: [{role, content}][], model?: string }

import { NextRequest } from "next/server";

export const runtime = "nodejs"; // needs streaming

const SYSTEM_PROMPT = `Ești un asistent clinic inteligent integrat în sistemul ERP al unui cabinet de psihoterapie din România.
Rolul tău este să sprijini terapeutul (nu pacientul) cu:
- Redactare clinică: rapoarte, notițe de sedință, scrisori medicale în română corectă și profesională.
- Interpretare scoruri psihologice (PHQ-9, GAD-7, DASS-21, BDI etc.) pe baza valorilor numerice oferite.
- Sugestii terapeutice bazate pe dovezi (CBT, ACT, DBT) — FĂRĂ să înlocuiești judecata clinică.
- Răspunsuri la întrebări despre codificări ICD-10, legislație (Codul Etic CPR), facturare psihologică.

REGULI STRICTE:
1. Vorbești mereu în română, formal-clinic, la persoana a treia sau impersonal.
2. Nu oferi diagnostic! Poți descrie simptomatologie și pattern-uri.  
3. Când ești incert, spune explicit "Recomand consultarea unui specialist / sursă primară."
4. Nu procesezi date medicale identificabile — dacă ți se dau CNP-uri sau nume reale de pacienți, atenționează că nu trebuie shared cu AI.
5. Ești succint și precis. Paragrafele lungi sunt ok dacă contextul o cere (ex: rapoarte), altfel răspunde concis.`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      messages: { role: "user" | "assistant" | "system"; content: string }[];
      model?: string;
      clientContext?: string; // optional — injected on per-client chat
    };

    const ollamaUrl = process.env.OLLAMA_URL || process.env.NEXT_PUBLIC_OLLAMA_URL || "http://localhost:11434";
    const model = body.model ?? process.env.NEXT_PUBLIC_OLLAMA_MODEL ?? "gemma2:9b-instruct";

    // Build message array: base system prompt + optional client context
    const messages: { role: string; content: string }[] = [
      { role: "system", content: SYSTEM_PROMPT },
    ];

    if (body.clientContext) {
      messages.push({ role: "system", content: body.clientContext });
    }

    messages.push(...body.messages);

    const ollamaRes = await fetch(`${ollamaUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages, stream: true }),
    });

    if (!ollamaRes.ok || !ollamaRes.body) {
      return new Response(
        JSON.stringify({ error: `Ollama error: ${ollamaRes.status}` }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    // Pipe Ollama NDJSON stream → client as text/event-stream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const reader = ollamaRes.body!.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n").filter(Boolean);

          for (const line of lines) {
            try {
              const json = JSON.parse(line) as { message?: { content?: string }; done?: boolean };
              const token = json.message?.content ?? "";
              if (token) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token })}\n\n`));
              }
              if (json.done) {
                controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              }
            } catch {
              // skip malformed line
            }
          }
        }

        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
