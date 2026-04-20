"use client";

import { useRef, useState } from "react";
import {
  Upload, FileText, CheckCircle2, AlertCircle,
  Loader2, ExternalLink, X, FileScan
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CIM10_COMMON } from "@/lib/mock/cas";

interface UploadedDoc {
  id: string;
  fileName: string;
  documentUrl: string | null;
  storedInDrive: boolean;
}

interface Props {
  clientId: string;
  appointmentId?: string;
  /** pre-fill from existing CAS session data */
  initialReferralNumber?: string;
  initialDoctorCode?: string;
  initialDiagnosisCode?: string;
  onUploaded?: (doc: UploadedDoc) => void;
}

export function ReferralUploader({
  clientId,
  appointmentId,
  initialReferralNumber = "",
  initialDoctorCode = "",
  initialDiagnosisCode = "",
  onUploaded,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [referralNumber, setReferralNumber] = useState(initialReferralNumber);
  const [referralDate, setReferralDate] = useState("");
  const [doctorCode, setDoctorCode] = useState(initialDoctorCode);
  const [diagnosisCode, setDiagnosisCode] = useState(initialDiagnosisCode);
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [result, setResult] = useState<UploadedDoc | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function handleFileSelect(file: File) {
    const ALLOWED = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    if (!ALLOWED.includes(file.type)) {
      setErrorMsg("Tip neacceptat. Acceptăm: PDF, JPG, PNG.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg("Fișierul depășește 10MB.");
      return;
    }
    setErrorMsg(null);
    setSelectedFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }

  async function handleUpload() {
    if (!selectedFile) return;

    setStatus("uploading");
    setErrorMsg(null);

    const fd = new FormData();
    fd.append("file", selectedFile);
    fd.append("clientId", clientId);
    if (appointmentId) fd.append("appointmentId", appointmentId);
    fd.append("referralNumber", referralNumber);
    fd.append("referralDate", referralDate);
    fd.append("doctorCode", doctorCode);
    fd.append("diagnosisCode", diagnosisCode);

    try {
      const res = await fetch("/api/uploads/referral", { method: "POST", body: fd });
      const json = await res.json() as {
        success?: boolean;
        error?: string;
        id?: string;
        document_url?: string;
        stored_in_drive?: boolean;
        demo?: boolean;
      };

      if (!res.ok || !json.success) {
        throw new Error(json.error ?? "Upload eșuat.");
      }

      const doc: UploadedDoc = {
        id: json.id ?? "demo",
        fileName: selectedFile.name,
        documentUrl: json.document_url ?? null,
        storedInDrive: json.stored_in_drive ?? false,
      };

      setResult(doc);
      setStatus("success");
      onUploaded?.(doc);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Eroare necunoscută.");
      setStatus("error");
    }
  }

  function reset() {
    setSelectedFile(null);
    setStatus("idle");
    setResult(null);
    setErrorMsg(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <FileScan className="h-4 w-4 text-primary" />
          Încarcă Bilet de Trimitere
        </CardTitle>
        <CardDescription>
          Scanează sau fotografiază biletul fizic și salvează-l în dosarul digital al pacientului.
          Fișierul va fi arhivat pe Google Drive.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">

        {/* Success state */}
        {status === "success" && result && (
          <div className="rounded-lg border border-emerald-300 bg-emerald-50/60 p-4 dark:bg-emerald-950/20 dark:border-emerald-900">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-emerald-800 dark:text-emerald-300">
                  Bilet încărcat cu succes!
                </p>
                <p className="text-xs text-emerald-700/80 dark:text-emerald-400/80 mt-0.5 truncate">{result.fileName}</p>
                {result.storedInDrive ? (
                  <p className="text-xs mt-1 text-emerald-700 dark:text-emerald-400">
                    ✓ Arhivat pe Google Drive
                  </p>
                ) : (
                  <p className="text-xs mt-1 text-amber-700 dark:text-amber-400">
                    ⚠ Metadate salvate (Google Drive neconectat)
                  </p>
                )}
              </div>
              {result.documentUrl && (
                <Button asChild variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                  <a href={result.documentUrl} target="_blank" rel="noopener noreferrer" title="Deschide pe Drive">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              )}
            </div>
            <Button variant="outline" size="sm" className="mt-3 w-full" onClick={reset}>
              Încarcă alt bilet
            </Button>
          </div>
        )}

        {status !== "success" && (
          <>
            {/* Drop zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              className={`relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 cursor-pointer transition-colors text-center ${
                dragOver
                  ? "border-primary bg-primary/5"
                  : selectedFile
                  ? "border-emerald-400 bg-emerald-50/40 dark:border-emerald-700 dark:bg-emerald-950/20"
                  : "border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/30"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                className="sr-only"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
              />

              {selectedFile ? (
                <>
                  <FileText className="h-8 w-8 text-emerald-500 mb-2" />
                  <p className="text-sm font-medium truncate max-w-xs">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {(selectedFile.size / 1024).toFixed(0)} KB · Click pentru a schimba
                  </p>
                  <button
                    className="absolute top-2 right-2 rounded-full p-1 hover:bg-muted"
                    onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm font-medium">Drag & drop sau click pentru selectare</p>
                  <p className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG · max 10MB</p>
                </>
              )}
            </div>

            {/* Metadata fields */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Număr Bilet Trimitere</Label>
                <Input
                  value={referralNumber}
                  onChange={(e) => setReferralNumber(e.target.value)}
                  placeholder="ex: BT-2025-001234"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Data Emiterii Biletului</Label>
                <Input
                  type="date"
                  value={referralDate}
                  onChange={(e) => setReferralDate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Parafă Medic Trimițător</Label>
                <Input
                  value={doctorCode}
                  onChange={(e) => setDoctorCode(e.target.value)}
                  placeholder="ex: PSH-B-00456"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Cod Diagnostic CIM-10</Label>
                <select
                  value={diagnosisCode}
                  onChange={(e) => setDiagnosisCode(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">Selectează...</option>
                  {CIM10_COMMON.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} — {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Error */}
            {errorMsg && (
              <div className="flex items-center gap-2 rounded-md border border-rose-200 bg-rose-50/60 px-3 py-2 text-xs text-rose-700 dark:bg-rose-950/20 dark:text-rose-400">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {errorMsg}
              </div>
            )}

            {/* Upload button */}
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || status === "uploading"}
              className="w-full"
            >
              {status === "uploading" ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Se încarcă...</>
              ) : (
                <><Upload className="h-4 w-4 mr-2" />Salvează Biletul de Trimitere</>
              )}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
