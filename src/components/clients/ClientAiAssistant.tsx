"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, Send, Loader2, Sparkles, Trash2, User, AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useOverlayA11y } from "@/components/ui/use-overlay-a11y";

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
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const contextString = buildClientContext(clientContext);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
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
      const msg = err instanceof Error ? err.message : "Nu am putut procesa răspunsul AI.";
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

  useOverlayA11y({
    open,
    onClose: () => setOpen(false),
    containerRef: panelRef,
    initialFocusRef: textareaRef,
  });

  return (
    <>
      {/* Floating Toggle Button */}
      <Button
        onClick={() => setOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 z-[100] h-14 w-14 rounded-2xl shadow-lg transition-all hover:scale-105 active:scale-95",
          open && "scale-0 opacity-0"
        )}
      >
        <Sparkles className="h-6 w-6" />
        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-black text-white ring-2 ring-background">
          AI
        </span>
      </Button>

      {/* Drawer Overlay */}
      <div className={cn(
        "fixed inset-0 z-[120] flex justify-end transition-opacity duration-300",
        open ? "opacity-100" : "opacity-0 pointer-events-none"
      )}>
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" 
          onClick={() => setOpen(false)}
        />

        {/* Panel */}
        <div
          ref={panelRef}
          className={cn(
          "relative flex h-full w-full max-w-md flex-col bg-background shadow-2xl transition-transform duration-500 ease-out",
          open ? "translate-x-0" : "translate-x-full"
          )}
          role="dialog"
          aria-modal="true"
          aria-labelledby="client-ai-assistant-title"
          tabIndex={-1}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/60 bg-muted/20 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h2 id="client-ai-assistant-title" className="text-sm font-black tracking-tight text-foreground">Asistent AI contextual</h2>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{clientContext.name ?? "Pacient"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="hidden sm:inline-flex">
                Local
              </Badge>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                aria-label="Închide asistentul AI"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Messages area */}
          <div className="custom-scrollbar flex-1 space-y-4 overflow-y-auto bg-background p-5">
            {messages.length === 0 && (
              <div className="space-y-4 py-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="rounded-[1.75rem] border border-border/60 bg-card p-4 shadow-sm">
                  <p className="text-xs font-bold leading-relaxed text-muted-foreground">
                    Salut. Am analizat fișa lui <span className="text-foreground">{clientContext.name ?? "pacientului"}</span>. Pot ajuta cu obiective terapeutice, sumarizări de ședințe sau strategii clinice.
                  </p>
                </div>
                <div className="grid gap-2">
                  {CLIENT_QUICK_PROMPTS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => handleSend(p)}
                      className="text-left text-[11px] rounded-xl border border-border/60 bg-card px-4 py-3 font-medium shadow-sm transition-colors hover:border-primary/20 hover:bg-muted/40"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m) => (
              <div key={m.id} className={cn("flex gap-3", m.role === "user" ? "flex-row-reverse" : "flex-row")}>
                <div className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl font-black text-[10px]",
                  m.role === "assistant" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                )}>
                  {m.role === "assistant" ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                </div>
                <div className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm",
                  m.role === "user" 
                    ? "rounded-tr-none border border-border/60 bg-muted/40 text-foreground" 
                    : "rounded-tl-none border border-border/60 bg-card text-foreground"
                )}>
                  {m.content}
                  {m.isStreaming && (
                    <span className="inline-block w-1.5 h-4 ml-1 bg-primary animate-pulse rounded-full align-middle" />
                  )}
                </div>
              </div>
            ))}

            {error && (
              <div className="animate-in zoom-in-95 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50/80 px-4 py-3 text-xs text-rose-700 shadow-sm duration-200 dark:border-rose-900 dark:bg-rose-950/20 dark:text-rose-200">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <p className="font-semibold leading-relaxed">{error}</p>
              </div>
            )}

            <div ref={bottomRef} className="h-2" />
          </div>

          {/* Footer Input */}
          <div className="border-t border-border/60 bg-muted/10 p-5">
            <div className="group relative flex items-end gap-3 rounded-[1.75rem] border border-border/60 bg-card px-4 py-3 transition-all focus-within:border-primary/30 focus-within:ring-2 focus-within:ring-primary/10">
              <textarea
                ref={textareaRef}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ex: Sugerează obiective terapeutice..."
                className="min-h-[24px] max-h-[150px] flex-1 resize-none bg-transparent py-1 text-sm font-medium outline-none placeholder:text-muted-foreground"
                disabled={isLoading}
                aria-label="Mesaj pentru asistentul AI"
              />
              <div className="flex items-center gap-2">
                {messages.length > 0 && (
                  <button
                    type="button"
                    onClick={() => { setMessages([]); setError(null); }}
                    className="p-1.5 text-muted-foreground transition-colors hover:text-rose-500"
                    title="Șterge conversația"
                    aria-label="Șterge conversația"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
                <Button
                  size="icon"
                  className="h-10 w-10 shrink-0 rounded-2xl active:scale-90 transition-transform"
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isLoading}
                >
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                </Button>
              </div>
            </div>
            <p className="mt-3 text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Securizat • Date anonimizate • AI local
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
