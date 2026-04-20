"use client";

import { useState, useRef } from "react";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import {
  FileText, Upload, Trash2, ExternalLink, AlertTriangle,
  FileImage, FileScan, Plus, ShieldAlert, Baby
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  MockPatientDocument, DocumentType,
  DOCUMENT_TYPE_CONFIG
} from "@/lib/mock/patientFiles";

const MINOR_REQUIRED_DOCS: DocumentType[] = ["SENTINTA_CUSTODIE", "ACORD_PARINTI"];

function FileIcon({ mime }: { mime: string }) {
  if (mime === "application/pdf") return <FileText className="h-5 w-5 text-rose-500" />;
  return <FileImage className="h-5 w-5 text-blue-500" />;
}

interface Props {
  clientId: string;
  isMinor: boolean;
  documents: MockPatientDocument[];
}

export function PatientDocuments({ clientId, isMinor, documents }: Props) {
  const [docs, setDocs] = useState<MockPatientDocument[]>(documents);
  const [selectedType, setSelectedType] = useState<DocumentType>("SCRISOARE_MEDICALA");
  const [notes, setNotes] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Check missing minor documents
  const missingMinorDocs = isMinor
    ? MINOR_REQUIRED_DOCS.filter(
        (type) => !docs.some((d) => d.document_type === type)
      )
    : [];

  // Group documents by type
  const byType = docs.reduce<Partial<Record<DocumentType, MockPatientDocument[]>>>(
    (acc, doc) => {
      acc[doc.document_type] = [...(acc[doc.document_type] ?? []), doc];
      return acc;
    },
    {}
  );

  async function handleUpload() {
    if (!selectedFile) return;
    setUploading(true);

    try {
      const fd = new FormData();
      fd.append("file", selectedFile);
      fd.append("clientId", clientId);
      fd.append("documentType", selectedType);
      if (notes.trim()) fd.append("notes", notes.trim());

      const res = await fetch("/api/uploads/document", { method: "POST", body: fd });
      const json = await res.json() as { success?: boolean; error?: string; id?: string };

      if (!res.ok || !json.success) throw new Error(json.error ?? "Upload eșuat.");
    } catch {
      // fallback: add locally in demo mode
    }

    const newDoc: MockPatientDocument = {
      id: `doc-${Date.now()}`,
      client_id: clientId,
      file_name: selectedFile.name,
      file_size_kb: Math.round(selectedFile.size / 1024),
      mime_type: selectedFile.type as MockPatientDocument["mime_type"],
      document_url: null,
      document_type: selectedType,
      notes: notes.trim() || null,
      uploaded_at: new Date().toISOString(),
    };

    setDocs((prev) => [newDoc, ...prev]);
    setSelectedFile(null);
    setNotes("");
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  }


  function handleRemove(id: string) {
    setDocs((prev) => prev.filter((d) => d.id !== id));
  }

  return (
    <div className="space-y-5">
      {/* Minor alert — missing docs */}
      {isMinor && missingMinorDocs.length > 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50/60 p-4 dark:bg-rose-950/20 dark:border-rose-900">
          <ShieldAlert className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm text-rose-800 dark:text-rose-300">Documente obligatorii lipsă pentru minor</p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {missingMinorDocs.map((type) => (
                <Badge key={type} className={DOCUMENT_TYPE_CONFIG[type].color}>
                  {DOCUMENT_TYPE_CONFIG[type].label}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Upload panel */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Plus className="h-4 w-4" /> Adaugă Document
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Tip Document</Label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as DocumentType)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {Object.entries(DOCUMENT_TYPE_CONFIG).map(([type, cfg]) => (
                  <option key={type} value={type}>{cfg.label}</option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">{DOCUMENT_TYPE_CONFIG[selectedType].description}</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Note (opțional)</Label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="ex: Prescrisă de Dr. Ionescu pe 12.04"
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
          </div>

          {/* Drop zone */}
          <div
            onClick={() => fileRef.current?.click()}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) setSelectedFile(f); }}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-5 cursor-pointer transition-colors text-center ${
              dragOver ? "border-primary bg-primary/5"
              : selectedFile ? "border-emerald-400 bg-emerald-50/40 dark:border-emerald-700 dark:bg-emerald-950/20"
              : "border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/20"
            }`}
          >
            <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="sr-only"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) setSelectedFile(f); }} />
            {selectedFile ? (
              <>
                <FileScan className="h-6 w-6 text-emerald-500 mb-1" />
                <p className="text-sm font-medium truncate max-w-xs">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">{(selectedFile.size / 1024).toFixed(0)} KB</p>
              </>
            ) : (
              <>
                <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                <p className="text-sm font-medium">Drag & drop sau click</p>
                <p className="text-xs text-muted-foreground">PDF, JPG, PNG · max 10MB</p>
              </>
            )}
          </div>

          <Button onClick={handleUpload} disabled={!selectedFile || uploading} className="w-full">
            {uploading ? "Se încarcă..." : "Salvează Documentul"}
          </Button>
        </CardContent>
      </Card>

      {/* Documents by type */}
      {Object.keys(byType).length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">Niciun document încărcat.</p>
      ) : (
        Object.entries(byType).map(([type, typeDocs]) => {
          const cfg = DOCUMENT_TYPE_CONFIG[type as DocumentType];
          return (
            <div key={type} className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Badge className={`${cfg.color} font-normal`}>{cfg.label}</Badge>
                <span>{typeDocs!.length}</span>
              </h4>
              <div className="space-y-1.5">
                {typeDocs!.map((doc) => (
                  <div key={doc.id} className="flex items-start gap-3 rounded-lg border bg-card px-3 py-2.5 hover:bg-muted/30 transition-colors group">
                    <FileIcon mime={doc.mime_type} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{doc.file_name}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {format(new Date(doc.uploaded_at), "d MMM yyyy", { locale: ro })}
                        {" · "}{doc.file_size_kb} KB
                        {doc.notes && ` · ${doc.notes}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {doc.document_url && (
                        <Button asChild variant="ghost" size="icon" className="h-7 w-7">
                          <a href={doc.document_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-rose-500"
                        onClick={() => handleRemove(doc.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
