"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Check,
  Plus,
  Trash2,
  Calendar,
  CircleCheck,
  Circle,
} from "lucide-react";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import {
  createHomeworkItem,
  toggleHomeworkItem,
  deleteHomeworkItem,
} from "@/app/dashboard/clients/actions";
import type { HomeworkItem } from "@/components/clients/types";

interface HomeworkCardProps {
  clientId: string;
  items: HomeworkItem[];
}

export function HomeworkCard({ clientId, items }: HomeworkCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showAdd, setShowAdd] = useState(false);
  const [newDesc, setNewDesc] = useState("");
  const [newDue, setNewDue] = useState("");

  const pending = items.filter((i) => !i.completed_at);
  const completed = items.filter((i) => i.completed_at);

  function handleAdd() {
    if (!newDesc.trim()) return;
    startTransition(async () => {
      const result = await createHomeworkItem(clientId, newDesc, newDue || undefined);
      if (result.success) {
        toast.success("Temă adăugată.");
        setNewDesc("");
        setNewDue("");
        setShowAdd(false);
        router.refresh();
      } else {
        toast.error(result.error ?? "Nu am putut adăuga tema.");
      }
    });
  }

  function handleToggle(item: HomeworkItem) {
    startTransition(async () => {
      const result = await toggleHomeworkItem(item.id, clientId, !item.completed_at);
      if (result.success) {
        router.refresh();
      } else {
        toast.error(result.error ?? "Eroare la actualizare.");
      }
    });
  }

  function handleDelete(item: HomeworkItem) {
    startTransition(async () => {
      const result = await deleteHomeworkItem(item.id, clientId);
      if (result.success) {
        toast.success("Temă ștearsă.");
        router.refresh();
      } else {
        toast.error(result.error ?? "Eroare la ștergere.");
      }
    });
  }

  return (
    <section className="rounded-[1.75rem] border border-border/60 bg-card shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border/40">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-[0.75rem] bg-primary/10">
            <BookOpen className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight">Teme pentru acasă</p>
            <p className="text-[11px] text-muted-foreground">
              {pending.length} active
              {completed.length > 0 && ` · ${completed.length} finalizate`}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAdd((v) => !v)}
          className={cn(
            "h-8 w-8 p-0 rounded-xl",
            showAdd ? "text-primary bg-primary/10" : "text-muted-foreground",
          )}
          aria-label="Adaugă temă"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {showAdd && (
        <div className="px-5 py-4 border-b border-border/30 space-y-3 bg-muted/20">
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">
              Descriere temă
            </Label>
            <Input
              autoFocus
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              placeholder="Ex: Jurnal gânduri automate — 3 situații pe zi..."
              className="text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">
              Termen (opțional)
            </Label>
            <Input
              type="date"
              value={newDue}
              onChange={(e) => setNewDue(e.target.value)}
              className="text-sm"
            />
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleAdd}
              disabled={!newDesc.trim() || isPending}
              className="h-8 gap-1.5 rounded-xl text-xs font-bold"
            >
              <Check className="h-3.5 w-3.5" />
              Adaugă
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setShowAdd(false); setNewDesc(""); setNewDue(""); }}
              className="h-8 rounded-xl text-xs text-muted-foreground"
            >
              Anulează
            </Button>
          </div>
        </div>
      )}

      <div className="divide-y divide-border/30 px-5">
        {items.length === 0 && !showAdd ? (
          <div className="py-8 text-center">
            <p className="text-sm text-muted-foreground">Nicio temă adăugată.</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAdd(true)}
              className="mt-2 text-primary hover:text-primary"
            >
              Adaugă prima temă
            </Button>
          </div>
        ) : (
          <>
            {pending.map((item) => (
              <HomeworkRow
                key={item.id}
                item={item}
                onToggle={() => handleToggle(item)}
                onDelete={() => handleDelete(item)}
                isPending={isPending}
              />
            ))}
            {completed.length > 0 && (
              <details className="group">
                <summary className="flex cursor-pointer items-center gap-2 py-3 text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground select-none">
                  <CircleCheck className="h-3.5 w-3.5" />
                  Finalizate ({completed.length})
                </summary>
                {completed.map((item) => (
                  <HomeworkRow
                    key={item.id}
                    item={item}
                    onToggle={() => handleToggle(item)}
                    onDelete={() => handleDelete(item)}
                    isPending={isPending}
                  />
                ))}
              </details>
            )}
          </>
        )}
      </div>
    </section>
  );
}

function HomeworkRow({
  item,
  onToggle,
  onDelete,
  isPending,
}: {
  item: HomeworkItem;
  onToggle: () => void;
  onDelete: () => void;
  isPending: boolean;
}) {
  const done = !!item.completed_at;
  return (
    <div className={cn("flex items-start gap-3 py-3", done && "opacity-60")}>
      <button
        type="button"
        onClick={onToggle}
        disabled={isPending}
        className="mt-0.5 shrink-0 text-muted-foreground hover:text-primary transition-colors"
        aria-label={done ? "Marchează ca nefinalizat" : "Marchează ca finalizat"}
      >
        {done ? (
          <CircleCheck className="h-4 w-4 text-green-600" />
        ) : (
          <Circle className="h-4 w-4" />
        )}
      </button>
      <div className="min-w-0 flex-1">
        <p className={cn("text-sm", done && "line-through text-muted-foreground")}>
          {item.description}
        </p>
        {item.due_date && (
          <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {format(new Date(item.due_date), "d MMM yyyy", { locale: ro })}
          </p>
        )}
        {done && item.completed_at && (
          <p className="mt-0.5 text-[11px] text-green-600">
            Finalizat {format(new Date(item.completed_at), "d MMM", { locale: ro })}
          </p>
        )}
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onDelete}
        disabled={isPending}
        className="h-7 w-7 p-0 rounded-xl text-muted-foreground hover:text-destructive shrink-0"
        aria-label="Șterge tema"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
