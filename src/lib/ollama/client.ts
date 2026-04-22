/**
 * Browser-side Ollama client.
 *
 * Runs in the therapist's browser, calls `localhost:11434` directly.
 * Note text is decrypted in-browser and sent only to the local Ollama
 * daemon — it never transits an Ce`ai Pățit? server, never leaves the machine.
 *
 * Env:
 *   NEXT_PUBLIC_OLLAMA_URL   default http://localhost:11434
 *   NEXT_PUBLIC_OLLAMA_MODEL default gemma2:9b-instruct
 */

export interface OllamaRunOptions {
  signal?: AbortSignal;
  onChunk?: (partial: string) => void;
}

const DEFAULT_URL = "http://localhost:11434";
const DEFAULT_MODEL = "gemma2:9b-instruct";

function ollamaUrl(): string {
  return (
    process.env.NEXT_PUBLIC_OLLAMA_URL?.replace(/\/+$/, "") ?? DEFAULT_URL
  );
}

function ollamaModel(): string {
  return process.env.NEXT_PUBLIC_OLLAMA_MODEL ?? DEFAULT_MODEL;
}

export async function isOllamaReachable(): Promise<boolean> {
  try {
    const res = await fetch(`${ollamaUrl()}/api/tags`, { method: "GET" });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Streams a single-prompt generation. Resolves with the full concatenated
 * response once the stream ends. The optional `onChunk` callback receives
 * the cumulative response so the UI can render progressively.
 */
export async function runOllama(
  prompt: string,
  { signal, onChunk }: OllamaRunOptions = {},
): Promise<string> {
  const res = await fetch(`${ollamaUrl()}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: ollamaModel(),
      prompt,
      stream: true,
    }),
    signal,
  });

  if (!res.ok || !res.body) {
    throw new Error(
      `Ollama nu răspunde (${res.status}). Verifică dacă rulează local.`,
    );
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let full = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let newline = buffer.indexOf("\n");
    while (newline !== -1) {
      const line = buffer.slice(0, newline).trim();
      buffer = buffer.slice(newline + 1);
      if (line) {
        try {
          const json = JSON.parse(line) as { response?: string; done?: boolean };
          if (json.response) {
            full += json.response;
            onChunk?.(full);
          }
        } catch {
        }
      }
      newline = buffer.indexOf("\n");
    }
  }

  // deepseek-r1 wraps chain-of-thought in <think>…</think> — strip it
  return full.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
}

export type AiAction = "SOAP" | "PROGRES" | "TEME";

export function buildPrompt(action: AiAction, noteText: string): string {
  const guard =
    "Ești asistent clinic pentru un psihoterapeut român. Răspunzi EXCLUSIV în limba română, concis, profesional. Nu inventa date care nu apar în notă.";

  if (action === "SOAP") {
    return `${guard}\n\nReformatează următoarea notă clinică în format SOAP (Subiectiv, Obiectiv, Analiză, Plan). Păstrează formulările clinice relevante. Nu adăuga diagnostice suplimentare.\n\nNOTĂ:\n${noteText}\n\nSOAP:`;
  }
  if (action === "PROGRES") {
    return `${guard}\n\nGenerează un raport scurt de progres (3-5 bullets) pe baza notei de mai jos. Concentrează-te pe schimbări observabile, obiective îndeplinite și priorități pentru ședințele următoare.\n\nNOTĂ:\n${noteText}\n\nRAPORT DE PROGRES:`;
  }
  return `${guard}\n\nExtrage lista de teme / sarcini propuse clientului din nota de mai jos. Returnează o listă numerotată, fiecare temă pe o singură linie, fără comentarii.\n\nNOTĂ:\n${noteText}\n\nTEME:`;
}
