"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, Send, User, Loader2, AlertCircle, Trash2, Sparkles, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

const uid = () => Math.random().toString(36).substring(2, 10);

// ── Starter prompts ───────────────────────────────────────────────────────────

const QUICK_PROMPTS = [
  "Redactează o notă de ședință pentru pacient cu anxietate moderată, sesiune de 50 min CBT.",
  "Interpretează un scor PHQ-9 de 16. Ce înseamnă clinic?",
  "Care sunt criteriile ICD-10 pentru tulburarea depresivă episod moderat?",
  "Scrie o scrisoare de trimitere către psihiatru pentru un pacient cu simptome disociative.",
];

// ── Chat Component ────────────────────────────────────────────────────────────

export default function AiChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ollamaOnline, setOllamaOnline] = useState<boolean | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ── Check Ollama status silently on mount ────────────────────────────────────

  useEffect(() => {
    const ollamaUrl = process.env.NEXT_PUBLIC_OLLAMA_URL ?? "http://localhost:11434";
    fetch(`${ollamaUrl}/api/tags`, { signal: AbortSignal.timeout(2000) })
      .then((r) => setOllamaOnline(r.ok))
      .catch(() => setOllamaOnline(false));
  }, []);

  // ── Auto-scroll ───────────────────────────────────────────────────────────────

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Auto-resize textarea ──────────────────────────────────────────────────────

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
  }, [input]);

  // ── Send message ─────────────────────────────────────────────────────────────

  async function handleSend(text?: string) {
    const content = (text ?? input).trim();
    if (!content || isLoading) return;

    setInput("");
    setError(null);

    const userMsg: Message = { id: uid(), role: "user", content };
    const assistantId = uid();
    const assistantMsg: Message = { id: assistantId, role: "assistant", content: "", isStreaming: true };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setIsLoading(true);

    try {
      const history = [...messages, userMsg].map(({ role, content }) => ({ role, content }));

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });

      if (!res.ok) {
        throw new Error(`Server error ${res.status}`);
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") break;
          try {
            const { token } = JSON.parse(data) as { token: string };
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId ? { ...m, content: m.content + token } : m
              )
            );
          } catch {
            // skip
          }
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Eroare necunoscută";
      setError(
        msg.includes("fetch") || msg.includes("Failed")
          ? "Ollama nu este pornit. Rulează `ollama serve` în terminal."
          : msg
      );
      setMessages((prev) => prev.filter((m) => m.id !== assistantId));
    } finally {
      setMessages((prev) =>
        prev.map((m) => (m.id === assistantId ? { ...m, isStreaming: false } : m))
      );
      setIsLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h1 className="text-base font-semibold leading-none">Asistent Clinic AI</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Gemma · exclusiv local · datele nu părăsesc calculatorul
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={cn(
            "flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-medium",
            ollamaOnline === true  && "border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
            ollamaOnline === false && "border-rose-300 bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-400",
            ollamaOnline === null  && "border-muted text-muted-foreground"
          )}>
            <span className={cn(
              "h-1.5 w-1.5 rounded-full",
              ollamaOnline === true  && "bg-emerald-500",
              ollamaOnline === false && "bg-rose-500",
              ollamaOnline === null  && "bg-muted-foreground/50"
            )} />
            {ollamaOnline === true ? "Ollama Online" : ollamaOnline === false ? "Ollama Offline" : "Verificare..."}
          </div>
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => { setMessages([]); setError(null); }}
              title="Șterge conversația"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-6 text-center pb-10">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <Bot className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-lg">Cum te pot ajuta?</h2>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                Sunt antrenat să te sprijin cu redactare clinică, interpretare scoruri și documentație psihologică.
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 max-w-xl w-full">
              {QUICK_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => handleSend(p)}
                  className="text-left text-xs border rounded-lg px-3 py-2.5 hover:bg-accent hover:border-primary/30 transition-colors leading-snug"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <div
            key={m.id}
            className={cn("flex gap-3", m.role === "user" ? "justify-end" : "justify-start")}
          >
            {m.role === "assistant" && (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 mt-0.5">
                <Bot className="h-4 w-4 text-primary" />
              </div>
            )}

            <div
              className={cn(
                "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap leading-relaxed",
                m.role === "user"
                  ? "bg-primary text-primary-foreground rounded-tr-sm"
                  : "bg-muted rounded-tl-sm"
              )}
            >
              {m.content}
              {m.isStreaming && (
                <span className="inline-block w-1.5 h-4 ml-0.5 bg-current animate-pulse rounded-sm align-middle" />
              )}
            </div>

            {m.role === "user" && (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary mt-0.5">
                <User className="h-4 w-4 text-primary-foreground" />
              </div>
            )}
          </div>
        ))}

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50/80 px-4 py-3 text-sm text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">{error}</p>
              {error.includes("Ollama") && (
                <button
                  className="text-xs underline mt-1 opacity-70 hover:opacity-100"
                  onClick={() => {
                    setOllamaOnline(null);
                    const ollamaUrl = process.env.NEXT_PUBLIC_OLLAMA_URL || "http://localhost:11434";
                    fetch(`${ollamaUrl}/api/tags`, { signal: AbortSignal.timeout(2000) })
                      .then((r) => setOllamaOnline(r.ok))
                      .catch(() => setOllamaOnline(false));
                  }}
                >
                  <RefreshCw className="h-3 w-3 inline mr-1" />
                  Verifică din nou
                </button>
              )}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="border-t p-4 shrink-0">
        <div className="flex items-end gap-2 rounded-xl border bg-background px-3 py-2 focus-within:ring-1 focus-within:ring-primary/50 transition-shadow">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Scrie un mesaj... (Enter pentru trimite, Shift+Enter pentru linie nouă)"
            className="flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground min-h-[24px] max-h-[160px] py-1"
            disabled={isLoading}
          />
          <Button
            size="icon"
            className="h-8 w-8 shrink-0 rounded-lg"
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground mt-2 text-center">
          AI-ul rulează local pe calculatorul tău. Niciun mesaj nu este trimis pe internet.
        </p>
      </div>
    </div>
  );
}
