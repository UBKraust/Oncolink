"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, Send, Loader2, Sparkles, Trash2, User, AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
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
          "fixed bottom-6 right-6 z-[100] h-14 w-14 rounded-2xl shadow-2xl transition-all hover:scale-105 active:scale-95",
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
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
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
          <div className="flex items-center justify-between border-b px-5 py-4 bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/20">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h2 id="client-ai-assistant-title" className="text-sm font-black text-slate-900 uppercase tracking-tight">Asistent AI Contextual</h2>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{clientContext.name ?? "Pacient"}</p>
              </div>
            </div>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full p-2 hover:bg-slate-200 transition-colors"
              aria-label="Închide asistentul AI"
            >
              <X className="h-5 w-5 text-slate-500" />
            </button>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar bg-slate-50/30">
            {messages.length === 0 && (
              <div className="space-y-4 py-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="rounded-2xl bg-white border border-slate-100 p-4 shadow-sm">
                  <p className="text-xs font-bold text-slate-600 leading-relaxed">
                    Salut! Am analizat fișa lui <span className="text-primary">{clientContext.name ?? "pacientului"}</span>. Sunt gata să te ajut cu obiective terapeutice, sumarizări de ședințe sau strategii clinice.
                  </p>
                </div>
                <div className="grid gap-2">
                  {CLIENT_QUICK_PROMPTS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => handleSend(p)}
                      className="group text-left text-[11px] border bg-white rounded-xl px-4 py-3 hover:bg-primary hover:text-white hover:border-primary transition-all duration-200 font-medium shadow-sm active:scale-[0.98]"
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
                  m.role === "assistant" ? "bg-primary text-white" : "bg-slate-200 text-slate-600"
                )}>
                  {m.role === "assistant" ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                </div>
                <div className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm",
                  m.role === "user" 
                    ? "bg-slate-100 text-slate-800 rounded-tr-none" 
                    : "bg-white border text-slate-800 rounded-tl-none"
                )}>
                  {m.content}
                  {m.isStreaming && (
                    <span className="inline-block w-1.5 h-4 ml-1 bg-primary animate-pulse rounded-full align-middle" />
                  )}
                </div>
              </div>
            ))}

            {error && (
              <div className="flex items-start gap-3 rounded-2xl border-2 border-rose-100 bg-rose-50 px-4 py-3 text-xs text-rose-700 shadow-sm animate-in zoom-in-95 duration-200">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <p className="font-bold leading-relaxed">{error}</p>
              </div>
            )}

            <div ref={bottomRef} className="h-2" />
          </div>

          {/* Footer Input */}
          <div className="p-5 border-t bg-white">
            <div className="relative flex items-end gap-3 rounded-[2rem] border bg-slate-50 px-4 py-3 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all group">
              <textarea
                ref={textareaRef}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ex: Sugerează obiective terapeutice..."
                className="flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-slate-400 py-1 min-h-[24px] max-h-[150px] font-medium"
                disabled={isLoading}
                aria-label="Mesaj pentru asistentul AI"
              />
              <div className="flex items-center gap-2">
                {messages.length > 0 && (
                  <button
                    type="button"
                    onClick={() => { setMessages([]); setError(null); }}
                    className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"
                    title="Șterge conversația"
                    aria-label="Șterge conversația"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
                <Button
                  size="icon"
                  className="h-10 w-10 shrink-0 rounded-2xl shadow-lg shadow-primary/20 active:scale-90 transition-transform"
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isLoading}
                >
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                </Button>
              </div>
            </div>
            <p className="mt-3 text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest">
              Securizat • Date Anonimizate • Powered by AI
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
