"use client";

import { useState, useTransition } from "react";
import {
  BookMarked,
  Plus,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  Trash2,
} from "lucide-react";
import { format, startOfWeek, addWeeks } from "date-fns";
import { ro } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { upsertDbtDiaryCard } from "@/app/dashboard/clients/actions";
import type { DbtDiaryCard } from "@/components/clients/types";
import { cn } from "@/lib/utils";

interface DbtDiaryCardsPanelProps {
  clientId: string;
  cards: DbtDiaryCard[];
}

function isoMonday(date: Date): string {
  const d = startOfWeek(date, { weekStartsOn: 1 });
  return d.toISOString().slice(0, 10);
}

export function DbtDiaryCardsPanel({ clientId, cards }: DbtDiaryCardsPanelProps) {
  const [isPending, startTransition] = useTransition();
  const [cardsState, setCardsState] = useState(cards);
  const [expanded, setExpanded] = useState<string | null>(cards[0]?.id ?? null);

  const thisWeek = isoMonday(new Date());
  const hasCurrentWeek = cardsState.some((c) => c.week_start === thisWeek);

  function handleAddThisWeek() {
    startTransition(async () => {
      const result = await upsertDbtDiaryCard(clientId, thisWeek, {});
      if (result.success && result.card) {
        setCardsState((prev) =>
          [result.card!, ...prev].sort((a, b) => b.week_start.localeCompare(a.week_start)),
        );
        setExpanded(result.card.id);
      } else {
        toast.error(result.error ?? "Eroare la creare.");
      }
    });
  }

  return (
    <section className="rounded-[1.75rem] border border-border/60 bg-card shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border/40">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-[0.75rem] bg-primary/10">
            <BookMarked className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight">Diary Cards DBT</p>
            <p className="text-[11px] text-muted-foreground">
              {cardsState.length} înregistrări
            </p>
          </div>
        </div>
        {!hasCurrentWeek && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddThisWeek}
            disabled={isPending}
            className="h-8 gap-1.5 rounded-xl text-xs font-bold"
          >
            <Plus className="h-3.5 w-3.5" />
            Săptămâna aceasta
          </Button>
        )}
      </div>

      {cardsState.length === 0 ? (
        <div className="px-5 py-8 text-center">
          <p className="text-sm text-muted-foreground">Niciun diary card adăugat.</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleAddThisWeek}
            disabled={isPending}
            className="mt-2 text-primary hover:text-primary"
          >
            Adaugă pentru săptămâna curentă
          </Button>
        </div>
      ) : (
        <div className="divide-y divide-border/30">
          {cardsState.map((card) => (
            <DiaryCardRow
              key={card.id}
              clientId={clientId}
              card={card}
              onSaved={(nextCard) =>
                setCardsState((prev) =>
                  prev.map((entry) => (entry.id === nextCard.id ? nextCard : entry)),
                )
              }
              expanded={expanded === card.id}
              onToggle={() => setExpanded(expanded === card.id ? null : card.id)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function DiaryCardRow({
  clientId,
  card,
  onSaved,
  expanded,
  onToggle,
}: {
  clientId: string;
  card: DbtDiaryCard;
  onSaved: (card: DbtDiaryCard) => void;
  expanded: boolean;
  onToggle: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [notes, setNotes] = useState(card.therapist_notes ?? "");
  const [skillsText, setSkillsText] = useState(
    (card.skills_used ?? []).join(", "),
  );
  const [behaviors, setBehaviors] = useState<Array<{ name: string; count: number }>>(
    card.target_behaviors ?? [],
  );
  const [newBehaviorName, setNewBehaviorName] = useState("");

  function handleSave() {
    startTransition(async () => {
      const skills = skillsText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const result = await upsertDbtDiaryCard(clientId, card.week_start, {
        therapist_notes: notes || undefined,
        skills_used: skills,
        target_behaviors: behaviors.filter((b) => b.name),
      });
      if (result.success && result.card) {
        toast.success("Diary card salvat.");
        onSaved(result.card);
        setEditing(false);
      } else {
        toast.error(result.error ?? "Eroare la salvare.");
      }
    });
  }

  function handleCancel() {
    setNotes(card.therapist_notes ?? "");
    setSkillsText((card.skills_used ?? []).join(", "));
    setBehaviors(card.target_behaviors ?? []);
    setEditing(false);
  }

  const weekLabel = (() => {
    const d = new Date(card.week_start + "T00:00:00");
    const end = addWeeks(d, 1);
    return `${format(d, "d MMM", { locale: ro })} – ${format(end, "d MMM yyyy", { locale: ro })}`;
  })();

  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-muted/30 transition-colors"
      >
        <div>
          <p className="text-sm font-semibold">{weekLabel}</p>
          {card.skills_used && card.skills_used.length > 0 && (
            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
              Abilități: {card.skills_used.slice(0, 3).join(", ")}
              {card.skills_used.length > 3 && " ..."}
            </p>
          )}
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-border/30">
          <div className="flex justify-end gap-1 pt-3">
            {!editing ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditing(true)}
                className="h-7 gap-1 rounded-xl text-xs text-muted-foreground"
              >
                Editează
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancel}
                  disabled={isPending}
                  className="h-7 w-7 p-0 rounded-xl text-muted-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={isPending}
                  className="h-7 w-7 p-0 rounded-xl"
                >
                  <Check className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
          </div>

          {/* Comportamente țintă */}
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">
              Comportamente țintă (frecvență săptămânală)
            </Label>
            {editing ? (
              <div className="space-y-1.5">
                {behaviors.map((b, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input
                      value={b.name}
                      onChange={(e) => {
                        const next = [...behaviors];
                        next[i] = { ...b, name: e.target.value };
                        setBehaviors(next);
                      }}
                      placeholder="Comportament"
                      className="text-sm flex-1 h-8"
                    />
                    <Input
                      type="number"
                      min={0}
                      max={7}
                      value={b.count}
                      onChange={(e) => {
                        const next = [...behaviors];
                        next[i] = { ...b, count: Number(e.target.value) };
                        setBehaviors(next);
                      }}
                      className="text-sm w-16 h-8 text-center"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setBehaviors(behaviors.filter((_, j) => j !== i))}
                      className="h-8 w-8 p-0 rounded-xl text-muted-foreground hover:text-destructive shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input
                    value={newBehaviorName}
                    onChange={(e) => setNewBehaviorName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newBehaviorName.trim()) {
                        setBehaviors([...behaviors, { name: newBehaviorName.trim(), count: 0 }]);
                        setNewBehaviorName("");
                      }
                    }}
                    placeholder="Adaugă comportament..."
                    className="text-sm h-8 flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (newBehaviorName.trim()) {
                        setBehaviors([...behaviors, { name: newBehaviorName.trim(), count: 0 }]);
                        setNewBehaviorName("");
                      }
                    }}
                    disabled={!newBehaviorName.trim()}
                    className="h-8 rounded-xl"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ) : behaviors.length > 0 ? (
              <div className="space-y-1">
                {behaviors.map((b, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <span className="flex-1">{b.name}</span>
                    <span className={cn(
                      "text-xs font-bold rounded-xl px-2 py-0.5",
                      b.count === 0 ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary",
                    )}>
                      {b.count}× / săpt.
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">Nicio înregistrare</p>
            )}
          </div>

          {/* Abilități folosite */}
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">
              Abilități DBT folosite
            </Label>
            {editing ? (
              <Input
                value={skillsText}
                onChange={(e) => setSkillsText(e.target.value)}
                placeholder="Mindfulness, TIP, TIPP, ACCEPTS, PLEASE... (separate prin virgulă)"
                className="text-sm"
              />
            ) : card.skills_used && card.skills_used.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {card.skills_used.map((s, i) => (
                  <span
                    key={i}
                    className="rounded-xl bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                  >
                    {s}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">Nicio abilitate înregistrată</p>
            )}
          </div>

          {/* Note terapeut */}
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">
              Note terapeut
            </Label>
            {editing ? (
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observații clinice, patternuri observate, pași următori..."
                rows={3}
                className="text-sm"
              />
            ) : card.therapist_notes ? (
              <p className="text-sm text-foreground whitespace-pre-line">{card.therapist_notes}</p>
            ) : (
              <p className="text-sm text-muted-foreground italic">Nicio notă</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
