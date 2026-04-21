"use client";

import { useRef, useState, useTransition } from "react";
import {
  AlertTriangle,
  Award,
  Building2,
  CheckCircle2,
  File,
  FileText,
  GraduationCap,
  Loader2,
  Shield,
  Trash2,
  Upload,
  X,
  Zap,
  ZoomIn,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { VaultCategory, VaultDoc } from "@/app/dashboard/vault/vault-actions";
import {
  deleteVaultDocument,
  uploadVaultDocument,
} from "@/app/dashboard/vault/vault-actions";

const CATEGORIES: { value: VaultCategory; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: "DIPLOME", label: "Diplome & Studii", icon: GraduationCap },
  { value: "CERTIFICARI", label: "Certificări CPR", icon: Award },
  { value: "CABINET_ACTE", label: "Acte Cabinet", icon: Building2 },
  { value: "UTILITATI", label: "Utilități & Facturi", icon: Zap },
  { value: "CONTRACTE", label: "Contracte", icon: FileText },
  { value: "ASIGURARE", label: "Asigurare Malpraxis", icon: Shield },
  { value: "ALTE", label: "Alte documente", icon: File },
];

const categoryMeta = Object.fromEntries(
  CATEGORIES.map((c) => [c.value, c]),
) as Record<VaultCategory, (typeof CATEGORIES)[0]>;

function daysUntil(dateStr: string): number {
  const d = new Date(dateStr);
  const now = new Date();
  return Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function ExpiryBadge({ date }: { date: string }) {
  const days = daysUntil(date);
  const formatted = new Date(date).toLocaleDateString("ro-RO");

  if (days < 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 dark:bg-red-950/40 dark:text-red-300">
        <AlertTriangle className="h-3 w-3" />
        Expirat ({formatted})
      </span>
    );
  }
  if (days <= 30) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 dark:bg-red-950/40 dark:text-red-300">
        <AlertTriangle className="h-3 w-3" />
        Expiră în {days} zile
      </span>
    );
  }
  if (days <= 90) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
        <AlertTriangle className="h-3 w-3" />
        Expiră {formatted}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-950/40 dark:text-green-300">
      Valabil până {formatted}
    </span>
  );
}

interface VaultClientProps {
  initialDocs: VaultDoc[];
}

export function VaultClient({ initialDocs }: VaultClientProps) {
  const [docs, setDocs] = useState<VaultDoc[]>(initialDocs);
  const [activeCategory, setActiveCategory] = useState<VaultCategory | "ALL">(
    "ALL",
  );
  const [showUpload, setShowUpload] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<VaultDoc | null>(null);
  const [isPending, startTransition] = useTransition();
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const filtered =
    activeCategory === "ALL"
      ? docs
      : docs.filter((d) => d.category === activeCategory);

  // Urgent expiry alerts (within 30 days or expired)
  const urgentDocs = docs.filter(
    (d) => d.expiry_date && daysUntil(d.expiry_date) <= 30,
  );

  function handleFileSelect(file: File) {
    setSelectedFile(file);
    // Auto-fill name from filename (without extension)
    const nameInput = formRef.current?.querySelector<HTMLInputElement>(
      '[name="name"]',
    );
    if (nameInput && !nameInput.value) {
      nameInput.value = file.name.replace(/\.[^.]+$/, "");
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedFile) {
      setUploadError("Selectează un fișier.");
      return;
    }

    const fd = new FormData(e.currentTarget);
    fd.set("file", selectedFile);
    setUploadError(null);

    startTransition(async () => {
      const result = await uploadVaultDocument(fd);
      if (result.ok && result.doc) {
        setDocs((prev) => [result.doc!, ...prev]);
        setUploadSuccess(true);
        setSelectedFile(null);
        formRef.current?.reset();
        setTimeout(() => {
          setShowUpload(false);
          setUploadSuccess(false);
        }, 1500);
      } else {
        setUploadError(result.error ?? "Eroare necunoscută.");
      }
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Ștergi definitiv acest document?")) return;
    startTransition(async () => {
      const result = await deleteVaultDocument(id);
      if (result.ok) {
        setDocs((prev) => prev.filter((d) => d.id !== id));
      }
    });
  }

  const isPdf = (url: string) =>
    url.toLowerCase().includes(".pdf") ||
    url.toLowerCase().includes("pdf");
  const isImage = (url: string) =>
    /\.(png|jpe?g|gif|webp|svg)(\?|$)/i.test(url);

  return (
    <div className="space-y-6">
      {/* Urgent expiry alerts banner */}
      {urgentDocs.length > 0 && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/30">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
            <div>
              <p className="text-sm font-semibold text-red-800 dark:text-red-300">
                {urgentDocs.length} document
                {urgentDocs.length > 1 ? "e" : ""} expiră curând
              </p>
              <ul className="mt-1 space-y-0.5">
                {urgentDocs.map((d) => (
                  <li key={d.id} className="text-xs text-red-700 dark:text-red-400">
                    · {d.name} —{" "}
                    {daysUntil(d.expiry_date!) < 0
                      ? "EXPIRAT"
                      : `în ${daysUntil(d.expiry_date!)} zile`}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Category filter tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveCategory("ALL")}
          className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
            activeCategory === "ALL"
              ? "border-primary bg-primary text-primary-foreground"
              : "border-input bg-background text-muted-foreground hover:border-primary/50"
          }`}
        >
          Toate ({docs.length})
        </button>
        {CATEGORIES.map(({ value, label, icon: Icon }) => {
          const count = docs.filter((d) => d.category === value).length;
          if (count === 0) return null;
          return (
            <button
              key={value}
              onClick={() => setActiveCategory(value)}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                activeCategory === value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-input bg-background text-muted-foreground hover:border-primary/50"
              }`}
            >
              <Icon className="h-3 w-3" />
              {label} ({count})
            </button>
          );
        })}
      </div>

      {/* Document grid */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <Shield className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">
            {activeCategory === "ALL"
              ? "Niciun document în Seif. Încarcă primul document."
              : "Niciun document în această categorie."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((doc) => {
            const meta = categoryMeta[doc.category];
            const CatIcon = meta?.icon ?? File;
            return (
              <div
                key={doc.id}
                className="group relative flex flex-col gap-2 rounded-lg border bg-card p-4 transition-shadow hover:shadow-md"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <CatIcon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{doc.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {meta?.label}
                    </p>
                  </div>
                </div>

                {doc.expiry_date && (
                  <ExpiryBadge date={doc.expiry_date} />
                )}

                <p className="text-xs text-muted-foreground">
                  Încărcat{" "}
                  {new Date(doc.uploaded_at).toLocaleDateString("ro-RO")}
                </p>

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  {(isPdf(doc.file_url) || isImage(doc.file_url)) && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => setPreviewDoc(doc)}
                    >
                      <ZoomIn className="mr-1.5 h-3.5 w-3.5" />
                      Preview
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    asChild
                  >
                    <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                      Descarcă
                    </a>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => handleDelete(doc.id)}
                    disabled={isPending}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Modal */}
      {showUpload && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40"
            onClick={() => setShowUpload(false)}
          />
          <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-background p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold">Încarcă document nou</h2>
              <button
                onClick={() => setShowUpload(false)}
                className="rounded-sm p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {uploadSuccess ? (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <CheckCircle2 className="h-12 w-12 text-green-500" />
                <p className="font-medium text-green-700">Document salvat!</p>
              </div>
            ) : (
              <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
                {uploadError && (
                  <div className="rounded-md border border-rose-300 bg-rose-50 p-3 text-xs text-rose-900">
                    {uploadError}
                  </div>
                )}

                {/* Drag-drop zone */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
                    dragOver
                      ? "border-primary bg-primary/5"
                      : "border-input hover:border-primary/50"
                  }`}
                >
                  <Upload className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                  {selectedFile ? (
                    <p className="text-sm font-medium text-primary">
                      {selectedFile.name}
                    </p>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground">
                        Trage fișierul aici sau{" "}
                        <span className="text-primary">selectează</span>
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        PDF, imagini — max 20 MB
                      </p>
                    </>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.gif,.webp"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleFileSelect(f);
                    }}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="vault-name">
                    Nume document <span className="text-rose-600">*</span>
                  </Label>
                  <Input
                    id="vault-name"
                    name="name"
                    placeholder="ex: Diplomă licență psihologie"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="vault-category">
                    Categorie <span className="text-rose-600">*</span>
                  </Label>
                  <Select
                    id="vault-category"
                    name="category"
                    defaultValue=""
                    required
                  >
                    <option value="" disabled>
                      — Selectează categoria —
                    </option>
                    {CATEGORIES.map(({ value, label }) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="vault-expiry">
                    Dată expirare{" "}
                    <span className="text-xs text-muted-foreground">
                      (opțional, pentru alerte)
                    </span>
                  </Label>
                  <Input
                    id="vault-expiry"
                    name="expiry_date"
                    type="date"
                  />
                </div>

                <div className="flex justify-end gap-3 border-t pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowUpload(false)}
                  >
                    Anulează
                  </Button>
                  <Button type="submit" disabled={isPending || !selectedFile}>
                    {isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Se încarcă…
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Salvează
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </>
      )}

      {/* Preview Modal */}
      {previewDoc && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/70"
            onClick={() => setPreviewDoc(null)}
          />
          <div className="fixed inset-4 z-50 flex flex-col overflow-hidden rounded-xl border bg-background shadow-2xl md:inset-12">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <p className="text-sm font-medium">{previewDoc.name}</p>
              <button
                onClick={() => setPreviewDoc(null)}
                className="rounded-sm p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              {isPdf(previewDoc.file_url) ? (
                <iframe
                  src={previewDoc.file_url}
                  className="h-full w-full"
                  title={previewDoc.name}
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-muted/20 p-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewDoc.file_url}
                    alt={previewDoc.name}
                    className="max-h-full max-w-full rounded object-contain"
                  />
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Floating upload button */}
      <Button
        onClick={() => setShowUpload(true)}
        className="fixed bottom-6 right-6 z-30 gap-2 shadow-lg"
      >
        <Upload className="h-4 w-4" />
        Adaugă document
      </Button>
    </div>
  );
}
