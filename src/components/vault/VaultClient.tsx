"use client";

import { useRef, useState, useTransition } from "react";
import {
  AlertTriangle,
  Award,
  Building2,
  CheckCircle2,
  File,
  FileText,
  Filter,
  GraduationCap,
  History,
  LayoutGrid,
  Loader2,
  Lock,
  Plus,
  Shield,
  Trash2,
  Upload,
  X,
  Zap,
  ZoomIn,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { VaultCategory, VaultDoc } from "@/app/dashboard/vault/vault-actions";
import {
  deleteVaultDocument,
  uploadVaultDocument,
} from "@/app/dashboard/vault/vault-actions";
import { cn } from "@/lib/utils";
import { useOverlayA11y } from "@/components/ui/use-overlay-a11y";
import { EmptyState, PageHeader, SectionCard, SetupBanner } from "@/components/app/page-shell";
import { StatCard as DashboardStatCard } from "@/components/dashboard/stat-card";

type VaultGroup = "PROFESIONAL" | "CABINET" | "ADMIN_FISCAL";

const GROUPS: {
  value: VaultGroup | "ALL";
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  categories: VaultCategory[];
}[] = [
  {
    value: "ALL",
    label: "Toate",
    description: "Toate documentele din seif",
    icon: LayoutGrid,
    categories: [],
  },
  {
    value: "PROFESIONAL",
    label: "Profesional",
    description: "Diplome, Certificări CPR, Cursuri",
    icon: GraduationCap,
    categories: ["DIPLOME", "CERTIFICARI"],
  },
  {
    value: "CABINET",
    label: "Cabinet & Legal",
    description: "CUI/CIF, Avize DSP, Acte Cabinet",
    icon: Building2,
    categories: ["CABINET_ACTE"],
  },
  {
    value: "ADMIN_FISCAL",
    label: "Admin & Fiscal",
    description: "Facturi, Contracte, Malpraxis",
    icon: FileText,
    categories: ["UTILITATI", "CONTRACTE", "ASIGURARE", "ALTE"],
  },
];

const CATEGORIES: {
  value: VaultCategory;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { value: "DIPLOME", label: "Diplomă Licență/Master", icon: GraduationCap },
  { value: "CERTIFICARI", label: "Certificat Liberă Practică", icon: Award },
  { value: "CABINET_ACTE", label: "Acte Înființare / DSP", icon: Building2 },
  { value: "UTILITATI", label: "Factură Utilități", icon: Zap },
  { value: "CONTRACTE", label: "Contract Închiriere / Alte", icon: FileText },
  { value: "ASIGURARE", label: "Asigurare Malpraxis", icon: Shield },
  { value: "ALTE", label: "Alte documente", icon: File },
];

const categoryMeta = Object.fromEntries(
  CATEGORIES.map((c) => [c.value, c]),
) as Record<VaultCategory, (typeof CATEGORIES)[0]>;

function daysUntil(dateStr: string): number {
  const d = new Date(dateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function ExpiryBadge({ date }: { date: string }) {
  const days = daysUntil(date);
  const formatted = new Date(date).toLocaleDateString("ro-RO");

  if (days < 0) {
    return (
      <Badge variant="destructive" className="gap-1 px-2 py-0">
        <AlertTriangle className="h-3 w-3" />
        Expirat ({formatted})
      </Badge>
    );
  }
  if (days <= 30) {
    return (
      <Badge variant="destructive" className="bg-orange-600 hover:bg-orange-700 gap-1 px-2 py-0">
        <AlertTriangle className="h-3 w-3" />
        Expiră în {days} zile
      </Badge>
    );
  }
  if (days <= 90) {
    return (
      <Badge variant="outline" className="border-orange-500 text-orange-600 bg-orange-50 gap-1 px-2 py-0">
        <AlertTriangle className="h-3 w-3" />
        Expiră {formatted}
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-100 gap-1 px-2 py-0">
      Valabil până {formatted}
    </Badge>
  );
}

interface VaultClientProps {
  initialDocs: VaultDoc[];
}

export function VaultClient({ initialDocs }: VaultClientProps) {
  const [docs, setDocs] = useState<VaultDoc[]>(initialDocs);
  const [activeGroup, setActiveGroup] = useState<VaultGroup | "ALL">("ALL");
  const [showUpload, setShowUpload] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<VaultDoc | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadDialogRef = useRef<HTMLDivElement>(null);
  const uploadCloseButtonRef = useRef<HTMLButtonElement>(null);
  const previewDialogRef = useRef<HTMLDivElement>(null);
  const previewCloseButtonRef = useRef<HTMLButtonElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const groupInfo = GROUPS.find((g) => g.value === activeGroup)!;
  const filtered =
    activeGroup === "ALL"
      ? docs
      : docs.filter((d) => groupInfo.categories.includes(d.category));

  // Urgent expiry alerts (within 30 days or expired)
  const urgentDocs = docs.filter(
    (d) => d.expiry_date && daysUntil(d.expiry_date) <= 30,
  );

  function handleFileSelect(file: File) {
    setSelectedFile(file);
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

  function handleDeleteConfirm() {
    if (!deleteTargetId) return;
    const id = deleteTargetId;
    setDeleteTargetId(null);
    startTransition(async () => {
      const result = await deleteVaultDocument(id);
      if (result.ok) {
        setDocs((prev) => prev.filter((d) => d.id !== id));
      }
    });
  }

  const isPdf = (url: string) =>
    url.toLowerCase().split("?")[0].endsWith(".pdf");
  const isImage = (url: string) =>
    /\.(png|jpe?g|gif|webp|svg)(\?|$)/i.test(url);

  useOverlayA11y({
    open: showUpload,
    onClose: () => setShowUpload(false),
    containerRef: uploadDialogRef,
    initialFocusRef: uploadCloseButtonRef,
  });

  useOverlayA11y({
    open: Boolean(previewDoc),
    onClose: () => setPreviewDoc(null),
    containerRef: previewDialogRef,
    initialFocusRef: previewCloseButtonRef,
  });

  return (
    <div className="space-y-8">
      <PageHeader
        title="Seif digital"
        description="Arhivator profesional pentru diplome, acte de cabinet și documente administrative urmărite centralizat."
        action={
          <Button onClick={() => setShowUpload(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Încarcă document
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardStatCard label="Status seif" value="Securizat" icon={Lock} />
        <DashboardStatCard
          label="Alerte expirare"
          value={urgentDocs.length > 0 ? String(urgentDocs.length) : "0"}
          hint={urgentDocs.length > 0 ? "documente necesită atenție" : "nicio alertă activă"}
          icon={urgentDocs.length > 0 ? AlertTriangle : Shield}
          tone={urgentDocs.length > 0 ? "danger" : "success"}
        />
        <DashboardStatCard label="Total fișiere" value={String(docs.length)} icon={FileText} />
        <DashboardStatCard label="Categorii active" value={String(new Set(docs.map((doc) => doc.category)).size)} icon={LayoutGrid} />
      </div>

      {urgentDocs.length > 0 ? (
        <SetupBanner
          title="Documente cu valabilitate apropiată"
          description={`${urgentDocs.length} document${urgentDocs.length === 1 ? "" : "e"} expiră în curând sau sunt deja expirate. Verifică-le înainte de raportările administrative.`}
        />
      ) : null}

      {/* Main Navigation Tabs */}
      <SectionCard
        title="Arhivă documente"
        description="Filtrează documentele pe zone profesionale și verifică rapid istoricul, valabilitatea și acțiunile disponibile."
        icon={FileText}
      >
        <Tabs
          value={activeGroup}
          onValueChange={(value) => {
            const nextGroup = value as VaultGroup | "ALL";
            setActiveGroup(nextGroup);
          }}
        >
          <div className="flex flex-col gap-4 border-b px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <TabsList className="bg-muted/50 p-1">
              {GROUPS.map((group) => {
                const Icon = group.icon;
                return (
                  <TabsTrigger key={group.value} value={group.value} className="gap-2 px-4">
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{group.label}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Filter className="h-3.5 w-3.5" />
              <span>Filtrare după categorie profesională</span>
            </div>
          </div>
          <div className="space-y-6 p-6">
            <div>
              <h2 className="text-lg font-black tracking-tight">{groupInfo.label}</h2>
              <p className="text-sm text-muted-foreground">{groupInfo.description}</p>
            </div>

            {filtered.length === 0 ? (
              <EmptyState
                title="Niciun document găsit"
                description="Nu ai încărcat încă documente în această secțiune. Primul upload va apărea aici împreună cu istoricul și valabilitatea."
                icon={File}
                action={{ label: "Adaugă primul document", onClick: () => setShowUpload(true) }}
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((doc) => {
                  const meta = categoryMeta[doc.category];
                  const CatIcon = meta?.icon ?? File;
                  return (
                    <Card
                      key={doc.id}
                      className="group overflow-hidden rounded-[1.75rem] border-border/60 transition-all hover:shadow-md hover:border-primary/30"
                    >
                      <CardContent className="p-0">
                        <div className="flex h-full flex-col">
                          <div className="flex items-start gap-4 p-5">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                              <CatIcon className="h-6 w-6" />
                            </div>
                            <div className="min-w-0 flex-1 space-y-1.5">
                              <h4 className="truncate text-sm font-semibold leading-none">{doc.name}</h4>
                              <p className="text-[11px] text-muted-foreground uppercase tracking-tight font-medium">
                                {meta?.label}
                              </p>
                              {doc.expiry_date && (
                                <div className="pt-1">
                                  <ExpiryBadge date={doc.expiry_date} />
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-between border-t bg-muted/10 px-4 py-3">
                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                              <History className="h-3 w-3" />
                              {new Date(doc.uploaded_at).toLocaleDateString("ro-RO")}
                            </div>
                            <div className="flex items-center gap-1">
                              {(isPdf(doc.file_url) || isImage(doc.file_url)) && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 text-muted-foreground hover:text-primary"
                                  onClick={() => setPreviewDoc(doc)}
                                  aria-label={`Previzualizează documentul ${doc.name}`}
                                >
                                  <ZoomIn className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-muted-foreground hover:text-primary"
                                asChild
                              >
                                <a href={doc.file_url} target="_blank" rel="noopener noreferrer" aria-label={`Deschide documentul ${doc.name} într-un tab nou`}>
                                  <Upload className="h-4 w-4 rotate-180" />
                                </a>
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={() => setDeleteTargetId(doc.id)}
                                disabled={isPending}
                                aria-label={`Șterge documentul ${doc.name}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </Tabs>
      </SectionCard>

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setShowUpload(false)}
          />
          <Card
            ref={uploadDialogRef}
            className="relative w-full max-w-lg border-primary/20 shadow-2xl animate-in fade-in zoom-in duration-200"
            role="dialog"
            aria-modal="true"
            aria-labelledby="vault-upload-title"
            tabIndex={-1}
          >
            <div className="flex items-center justify-between border-b p-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Upload className="h-4 w-4" />
                </div>
                <h2 id="vault-upload-title" className="text-lg font-semibold">Încarcă document nou</h2>
              </div>
              <Button ref={uploadCloseButtonRef} variant="ghost" size="icon" onClick={() => setShowUpload(false)} aria-label="Închide formularul de încărcare">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <CardContent className="p-6">
              {uploadSuccess ? (
                <div className="flex flex-col items-center gap-3 py-8 text-center text-emerald-600">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                    <CheckCircle2 className="h-10 w-10" />
                  </div>
                  <p className="text-lg font-semibold">Document salvat!</p>
                  <p className="text-sm text-muted-foreground">Fișierul a fost adăugat cu succes în seif.</p>
                </div>
              ) : (
                <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
                  {uploadError && (
                    <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      {uploadError}
                    </div>
                  )}

                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      "group cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all",
                      dragOver
                        ? "border-primary bg-primary/5"
                        : "border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/50"
                    )}
                  >
                    <div className="flex flex-col items-center gap-2">
                       <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground group-hover:text-primary transition-colors">
                        <Upload className="h-6 w-6" />
                      </div>
                      {selectedFile ? (
                        <p className="text-sm font-semibold text-primary">
                          {selectedFile.name}
                        </p>
                      ) : (
                        <>
                          <p className="text-sm font-medium">
                            Trage fișierul aici sau <span className="text-primary underline">selectează</span>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            PDF sau Imagini (maxim 20 MB)
                          </p>
                        </>
                      )}
                    </div>
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

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="vault-name">Nume document</Label>
                      <Input
                        id="vault-name"
                        name="name"
                        placeholder="ex: Diplomă licență psihologie"
                        required
                        className="bg-muted/30"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="vault-category">Categorie</Label>
                      <Select id="vault-category" name="category" required defaultValue="">
                        <option value="" disabled>— Alege —</option>
                        {CATEGORIES.map(({ value, label }) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="vault-expiry">Dată expirare</Label>
                      <Input
                        id="vault-expiry"
                        name="expiry_date"
                        type="date"
                        className="bg-muted/30"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setShowUpload(false)}
                    >
                      Anulează
                    </Button>
                    <Button type="submit" disabled={isPending || !selectedFile} className="px-8">
                      {isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Salvează în Seif"
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-background/90 backdrop-blur-md"
            onClick={() => setPreviewDoc(null)}
          />
          <div
            ref={previewDialogRef}
            className="relative flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border bg-background shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300"
            role="dialog"
            aria-modal="true"
            aria-labelledby="vault-preview-title"
            tabIndex={-1}
          >
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  {(() => {
                    const Icon = categoryMeta[previewDoc.category]?.icon;
                    return Icon ? <Icon className="h-5 w-5" /> : null;
                  })()}
                </div>
                <div>
                  <h3 id="vault-preview-title" className="text-sm font-semibold leading-none">{previewDoc.name}</h3>
                  <p className="mt-1 text-[11px] text-muted-foreground uppercase">{categoryMeta[previewDoc.category]?.label}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" asChild>
                  <a href={previewDoc.file_url} target="_blank" rel="noopener noreferrer">
                    Descarcă
                  </a>
                </Button>
                <Button ref={previewCloseButtonRef} variant="ghost" size="icon" onClick={() => setPreviewDoc(null)} aria-label="Închide previzualizarea documentului">
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden bg-muted/30">
              {isPdf(previewDoc.file_url) ? (
                <iframe
                  src={previewDoc.file_url}
                  className="h-full w-full"
                  title={previewDoc.name}
                />
              ) : (
                <div className="flex h-full items-center justify-center p-6">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewDoc.file_url}
                    alt={previewDoc.name}
                    className="max-h-full max-w-full rounded-lg object-contain shadow-lg"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <AlertDialog
        open={deleteTargetId !== null}
        onOpenChange={(open) => { if (!open) setDeleteTargetId(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ștergi acest document din seif?</AlertDialogTitle>
            <AlertDialogDescription>
              Acțiunea este ireversibilă. Documentul va fi eliminat definitiv din seiful cabinetului.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={handleDeleteConfirm}
            >
              Șterge documentul
            </AlertDialogAction>
            <AlertDialogCancel>Anulează</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
