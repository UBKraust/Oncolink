"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, Send, User, Loader2, AlertCircle, Trash2, Sparkles, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { DashboardPage, PageHeader, SectionCard, SetupBanner } from "@/components/app/page-shell";

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
    <DashboardPage className="max-w-4xl">
      <PageHeader
        title="Asistent clinic AI"
        description="Gemma rulează local și te ajută cu redactare clinică, interpretare și suport operațional fără a trimite datele pe internet."
      />

      {ollamaOnline === false ? (
        <SetupBanner description="Ollama pare offline. Pornește `ollama serve` pentru a activa asistentul clinic local." />
      ) : null}

      <SectionCard
        title="Conversație clinică"
        description="Folosește întrebări rapide sau scrie direct în compozitor pentru a porni conversația."
        icon={Sparkles}
      >
        <div className="flex h-[calc(100vh-16rem)] flex-col">
          <div className="flex shrink-0 items-center justify-between border-b border-border/60 px-6 py-4">
            <Badge
              variant={
                ollamaOnline === true
                  ? "success"
                  : ollamaOnline === false
                    ? "destructive"
                    : "outline"
              }
              className="gap-2"
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  ollamaOnline === true && "bg-emerald-500",
                  ollamaOnline === false && "bg-rose-500",
                  ollamaOnline === null && "bg-muted-foreground/50",
                )}
              />
              {ollamaOnline === true ? "Ollama online" : ollamaOnline === false ? "Ollama offline" : "Verificare..."}
            </Badge>
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

          <div className="flex-1 space-y-4 overflow-y-auto p-6">
            {messages.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center gap-6 pb-10 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                  <Bot className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Cum te pot ajuta?</h2>
                  <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                    Sunt antrenat să te sprijin cu redactare clinică, interpretare scoruri și documentație psihologică.
                  </p>
                </div>
                <div className="grid w-full max-w-xl gap-2 sm:grid-cols-2">
                  {QUICK_PROMPTS.map((p) => (
                    <button
                      key={p}
                      onClick={() => handleSend(p)}
                      className="rounded-2xl border border-border/60 bg-card px-3 py-3 text-left text-xs leading-snug transition-colors hover:border-primary/20 hover:bg-muted/40"
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
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}

                <div
                  className={cn(
                    "max-w-[80%] whitespace-pre-wrap rounded-3xl px-4 py-3 text-sm leading-relaxed",
                    m.role === "user"
                      ? "rounded-tr-sm bg-primary text-primary-foreground"
                      : "rounded-tl-sm border border-border/60 bg-muted/40 text-foreground",
                  )}
                >
                  {m.content}
                  {m.isStreaming && (
                    <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse rounded-sm bg-current align-middle" />
                  )}
                </div>

                {m.role === "user" && (
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary">
                    <User className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
              </div>
            ))}

            {error && (
              <div className="rounded-3xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-foreground">
                <div className="flex items-start gap-2">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                  <div>
                    <p className="font-medium">{error}</p>
                    {error.includes("Ollama") && (
                      <button
                        className="mt-1 text-xs text-muted-foreground underline hover:text-foreground"
                        onClick={() => {
                          setOllamaOnline(null);
                          const ollamaUrl = process.env.NEXT_PUBLIC_OLLAMA_URL || "http://localhost:11434";
                          fetch(`${ollamaUrl}/api/tags`, { signal: AbortSignal.timeout(2000) })
                            .then((r) => setOllamaOnline(r.ok))
                            .catch(() => setOllamaOnline(false));
                        }}
                      >
                        <RefreshCw className="mr-1 inline h-3 w-3" />
                        Verifică din nou
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          <div className="shrink-0 border-t border-border/60 p-4">
            <div className="flex items-end gap-2 rounded-2xl border border-border/60 bg-background px-3 py-2 transition-shadow focus-within:ring-1 focus-within:ring-primary/50">
              <textarea
                ref={textareaRef}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Scrie un mesaj... (Enter pentru trimite, Shift+Enter pentru linie nouă)"
                className="min-h-[24px] max-h-[160px] flex-1 resize-none bg-transparent py-1 text-sm outline-none placeholder:text-muted-foreground"
                disabled={isLoading}
              />
              <Button
                size="icon"
                className="h-8 w-8 shrink-0 rounded-xl"
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
            <p className="mt-2 text-center text-[11px] text-muted-foreground">
              AI-ul rulează local pe calculatorul tău. Niciun mesaj nu este trimis pe internet.
            </p>
          </div>
        </div>
      </SectionCard>
    </DashboardPage>
  );
}
