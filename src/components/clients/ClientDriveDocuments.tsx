"use client";

import { useRef, useState } from "react";
import { UploadCloud, File, FileText, ExternalLink, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { uploadClientDocument } from "@/app/dashboard/clients/actions";
import { toast } from "@/components/ui/toast";
import type { ClientDocument } from "./types";

export function ClientDriveDocuments({ 
  clientId, 
  folderId, 
  documents = [] 
}: { 
  clientId: string;
  folderId?: string;
  documents?: ClientDocument[] 
}) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !folderId) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await uploadClientDocument(clientId, folderId, formData);
      if (res.success) {
        toast.success(`Fișierul "${file.name}" a fost încărcat.`);
      } else {
        toast.error(res.error || "Eroare la încărcare.");
      }
    } catch {
      toast.error("Eroare neprevăzută la încărcare.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <UploadCloud className="h-4 w-4 text-blue-500" />
              Documente (Google Drive)
            </CardTitle>
            <CardDescription>Fișiere atașate & analize medicale</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleUpload}
            />
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || !folderId}
            >
              {isUploading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <UploadCloud className="mr-2 h-4 w-4" />
              )}
              {isUploading ? "Se încarcă..." : "Upload"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {documents.length === 0 ? (
          <div className="mt-2 flex flex-col items-center justify-center rounded-md border border-dashed p-6 text-center">
            <div className="rounded-full bg-primary/10 p-3">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mt-4 text-sm font-semibold">Niciun document</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Documentele încărcate vor fi salvate securizat în contul tău de Google Drive.
            </p>
            <Button 
              variant="secondary" 
              size="sm" 
              className="mt-4"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || !folderId}
            >
              <UploadCloud className="mr-2 h-4 w-4" />
              Încarcă Primul Fișier
            </Button>
          </div>
        ) : (
          <div className="mt-2 space-y-3">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between rounded-md border p-3 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-blue-100 dark:bg-blue-900/40">
                    <File className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium leading-none">{doc.file_name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Adăugat la {new Date(doc.created_at ?? new Date().toISOString()).toLocaleDateString("ro-RO")} • {(doc.document_type ?? "Fișier").replace('_', ' ')}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" asChild className="shrink-0 h-8 w-8">
                  <a href={doc.drive_link ?? doc.document_url ?? "#"} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </a>
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
