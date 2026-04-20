"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, Send, Loader2, Sparkles, Trash2, ChevronDown, ChevronUp, User, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { MockSessionPayment } from "@/lib/mock/payments";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

const uid = () => Math.random().toString(36).substring(2, 10);

// ── Context builder ───────────────────────────────────────────────────────────

interface ClientContext {
  name: string | null;
  isMinor: boolean;
  parentName?: string | null;
  billingType: string | null;
  companyName?: string | null;
  sessionFrequency: string | null;
  sessionPrice: string | null;
  totalSessions: number;
  totalAmount: number;
  lastAssessments?: { type: string; date: string; scores: Record<string, unknown> }[];
  gdprSigned: boolean;
}

function buildClientContext(ctx: ClientContext): string {
  const lines: string[] = [
    `Context pacient (datele sunt confidențiale, vizibile doar în sesiunea curentă):`,
    `- Referință: ${ctx.name ?? "Client anonim"}`,
    `- Minor: ${ctx.isMinor ? "Da" : "Nu"}`,
    ...(ctx.isMinor && ctx.parentName ? [`- Tutore/Părinte: ${ctx.parentName}`] : []),
    `- Tip facturare: ${ctx.billingType === "B2B_COMPANY" ? `B2B (${ctx.companyName})` : "Individual"}`,
    `- Frecvență ședințe: ${ctx.sessionFrequency ?? "Nespecificată"}`,
    `- Preț per ședință: ${ctx.sessionPrice ? `${ctx.sessionPrice} RON` : "Negociat"}`,
    `- Total ședințe înregistrate: ${ctx.totalSessions}`,
    `- Total sume încasate: ${ctx.totalAmount} RON`,
    `- Acord GDPR: ${ctx.gdprSigned ? "Semnat" : "Nesemnat"}`,
  ];

  if (ctx.lastAssessments && ctx.lastAssessments.length > 0) {
    lines.push(`- Ultimele evaluări:`);
    ctx.lastAssessments.slice(0, 3).forEach((a) => {
      lines.push(`  • ${a.type} (${a.date}): ${JSON.stringify(a.scores)}`);
    });
  }

  lines.push(
    `\nFolosind acest context, răspunde la întrebările terapeutului despre acest pacient. ` +
    `Nu inventa informații care nu sunt date explicit. Ești concis și profesional.`
  );

  return lines.join("\n");
}

// ── Quick prompts per client ──────────────────────────────────────────────────

const CLIENT_QUICK_PROMPTS = [
  "Sugerează obiective terapeutice pentru ședința viitoare.",
  "Redactează o notă de progres clinică pentru dosarul pacientului.",
  "Ce strategii CBT sunt potrivite pe baza profilului de mai sus?",
  "Cum ar trebui structurată ședința de evaluare inițială?",
];

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  clientContext: ClientContext;
}

export function ClientAiAssistant({ clientContext }: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const contextString = buildClientContext(clientContext);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
  }, [input]);

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
        body: JSON.stringify({ messages: history, clientContext: contextString }),
      });

      if (!res.ok) throw new Error(`Server error ${res.status}`);

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
              prev.map((m) => m.id === assistantId ? { ...m, content: m.content + token } : m)
            );
          } catch { /* skip */ }
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Eroare";
      setError(
        msg.includes("fetch") || msg.includes("Failed")
          ? "Ollama nu este pornit. Rulează `ollama serve` în terminal."
          : msg
      );
      setMessages((prev) => prev.filter((m) => m.id !== assistantId));
    } finally {
      setMessages((prev) => prev.map((m) => m.id === assistantId ? { ...m, isStreaming: false } : m));
      setIsLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      {/* Toggle header */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium leading-none">Asistent AI — {clientContext.name ?? "Client"}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {messages.length === 0 ? "Context pacient pre-încărcat" : `${messages.length} mesaje`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => { e.stopPropagation(); setMessages([]); setError(null); }}
              className="text-muted-foreground hover:text-foreground p-1 rounded"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </span>
          )}
          {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>

      {/* Expanded chat */}
      {open && (
        <div className="border-t">
          {/* Messages area */}
          <div className="h-80 overflow-y-auto p-3 space-y-3">
            {messages.length === 0 && (
              <div className="space-y-2 pt-2">
                <p className="text-xs text-muted-foreground px-1">
                  Asistentul cunoaște deja datele pacientului. Poți întreba direct:
                </p>
                <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                  {CLIENT_QUICK_PROMPTS.map((p) => (
                    <button
                      key={p}
                      onClick={() => handleSend(p)}
                      className="text-left text-xs border rounded-lg px-2.5 py-2 hover:bg-accent hover:border-primary/30 transition-colors leading-snug"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m) => (
              <div key={m.id} className={cn("flex gap-2", m.role === "user" ? "justify-end" : "justify-start")}>
                {m.role === "assistant" && (
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 mt-0.5">
                    <Bot className="h-3 w-3 text-primary" />
                  </div>
                )}
                <div className={cn(
                  "max-w-[85%] rounded-xl px-3 py-2 text-xs whitespace-pre-wrap leading-relaxed",
                  m.role === "user" ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-muted rounded-tl-sm"
                )}>
                  {m.content}
                  {m.isStreaming && (
                    <span className="inline-block w-1 h-3.5 ml-0.5 bg-current animate-pulse rounded-sm align-middle" />
                  )}
                </div>
                {m.role === "user" && (
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary mt-0.5">
                    <User className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}
              </div>
            ))}

            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50/80 px-3 py-2 text-xs text-rose-700 dark:bg-rose-950/30 dark:text-rose-400">
                <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t p-3">
            <div className="flex items-end gap-2 rounded-lg border bg-background px-3 py-2 focus-within:ring-1 focus-within:ring-primary/40">
              <textarea
                ref={textareaRef}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Întreabă ceva despre acest pacient..."
                className="flex-1 resize-none bg-transparent text-xs outline-none placeholder:text-muted-foreground py-0.5 min-h-[20px] max-h-[120px]"
                disabled={isLoading}
              />
              <Button
                size="icon"
                className="h-7 w-7 shrink-0 rounded-md"
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
              >
                {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
