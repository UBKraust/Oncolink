/**
 * Google Drive REST API client — fetch-only, node-compatible.
 * Functions:
 *  - uploadDocumentToDrive       — upload file (no specific parent)
 *  - uploadFileToDriveFolder     — upload file into a parent folder
 *  - createClientFolder          — create a subfolder inside a parent
 *  - getOrCreateRootFolder       — idempotent root cabinet folder
 *  - uploadTemplateToDriveFolder — upload a Blob template to a folder
 */

const GDRIVE_UPLOAD_BASE = "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart";
const GDRIVE_BASE = "https://www.googleapis.com/drive/v3/files";

interface DriveTemplateTherapistProfile {
  fullName?: string | null;
  practiceName?: string | null;
}

// ── Shared upload helper ──────────────────────────────────────────────────────

async function _upload(
  accessToken: string,
  fileBlob: Blob,
  metadata: Record<string, unknown>
): Promise<{ id: string }> {
  const boundary = "-------314159265358979323846";
  const delimiter = "\r\n--" + boundary + "\r\n";
  const closeDelim = "\r\n--" + boundary + "--";

  const buffer = await fileBlob.arrayBuffer();
  const base64Data = Buffer.from(buffer).toString("base64");

  const mimeType = fileBlob.type || "application/octet-stream";
  const body =
    delimiter +
    "Content-Type: application/json\r\n\r\n" +
    JSON.stringify(metadata) +
    delimiter +
    `Content-Type: ${mimeType}\r\nContent-Transfer-Encoding: base64\r\n\r\n` +
    base64Data +
    closeDelim;

  const res = await fetch(GDRIVE_UPLOAD_BASE, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": `multipart/related; boundary=${boundary}`,
    },
    body,
  });

  if (!res.ok) {
    throw new Error(`Google Drive upload failed: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<{ id: string }>;
}

// ── Get webViewLink for a file id ─────────────────────────────────────────────

async function _getWebViewLink(accessToken: string, fileId: string): Promise<string> {
  const res = await fetch(`${GDRIVE_BASE}/${fileId}?fields=webViewLink`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json() as { webViewLink?: string };
  return data.webViewLink ?? `https://drive.google.com/file/d/${fileId}/view`;
}

// ── Public: upload without parent (legacy) ────────────────────────────────────

export async function uploadDocumentToDrive(
  accessToken: string,
  fileBlob: Blob,
  fileName: string,
  mimeType: string
): Promise<{ id: string; webViewLink: string }> {
  const result = await _upload(accessToken, new Blob([await fileBlob.arrayBuffer()], { type: mimeType }), {
    name: fileName,
    mimeType,
  });
  const webViewLink = await _getWebViewLink(accessToken, result.id);
  return { id: result.id, webViewLink };
}

// ── Public: upload into a specific folder ─────────────────────────────────────

export async function uploadFileToDriveFolder(
  accessToken: string,
  fileBlob: Blob,
  fileName: string,
  parentFolderId: string
): Promise<{ id: string; webViewLink: string }> {
  const result = await _upload(accessToken, fileBlob, {
    name: fileName,
    mimeType: fileBlob.type || "application/octet-stream",
    parents: [parentFolderId],
  });
  const webViewLink = await _getWebViewLink(accessToken, result.id);
  return { id: result.id, webViewLink };
}

// ── Public: create a folder ───────────────────────────────────────────────────

export async function createDriveFolder(
  accessToken: string,
  folderName: string,
  parentFolderId?: string
): Promise<{ id: string; webViewLink: string }> {
  const metadata: Record<string, unknown> = {
    name: folderName,
    mimeType: "application/vnd.google-apps.folder",
  };
  if (parentFolderId) metadata.parents = [parentFolderId];

  const res = await fetch(GDRIVE_BASE, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(metadata),
  });

  if (!res.ok) {
    throw new Error(`Google Drive folder creation failed: ${res.status} ${res.statusText}`);
  }

  const data = await res.json() as { id: string };
  const webViewLink = `https://drive.google.com/drive/folders/${data.id}`;
  return { id: data.id, webViewLink };
}

// ── Public: get-or-create the root cabinet folder ─────────────────────────────
// Looks for a folder named "Cabinet Psihoterapie — Ce`ai Pățit?"; creates if absent.

export async function getOrCreateRootFolder(accessToken: string): Promise<string> {
  const ROOT_NAME = "Cabinet Psihoterapie — Ce`ai Pățit?";
  const query = encodeURIComponent(
    `name='${ROOT_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`
  );

  const searchRes = await fetch(`${GDRIVE_BASE}?q=${query}&fields=files(id)`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const searchData = await searchRes.json() as { files: { id: string }[] };

  if (searchData.files.length > 0) {
    return searchData.files[0].id;
  }

  // Create root folder
  const { id } = await createDriveFolder(accessToken, ROOT_NAME);
  return id;
}

// ── Public: provision a new client folder + template documents ─────────────────

export async function provisionClientDriveFolder(
  accessToken: string,
  clientName: string,
  clientId: string,
  therapistProfile?: DriveTemplateTherapistProfile,
): Promise<{ folderId: string; folderUrl: string }> {
  // 1. Ensure root cabinet folder exists
  const rootFolderId = await getOrCreateRootFolder(accessToken);

  // 2. Create subfolder => "Popescu Ana — c-001"
  const safeName = `${clientName} — ${clientId.slice(0, 8)}`;
  const folder = await createDriveFolder(accessToken, safeName, rootFolderId);

  // 3. Upload template: Contract Terapeutic (plain text placeholder)
  const contractTemplate = generateContractTemplate(clientName, therapistProfile);
  const contractBlob = new Blob([contractTemplate], { type: "text/plain;charset=utf-8" });
  await uploadFileToDriveFolder(
    accessToken,
    contractBlob,
    `Contract_Terapeutic_${clientName.replace(/\s+/g, "_")}.txt`,
    folder.id
  );

  // 4. Upload template: Acord GDPR
  const gdprTemplate = generateGdprTemplate(clientName, therapistProfile);
  const gdprBlob = new Blob([gdprTemplate], { type: "text/plain;charset=utf-8" });
  await uploadFileToDriveFolder(
    accessToken,
    gdprBlob,
    `Acord_GDPR_${clientName.replace(/\s+/g, "_")}.txt`,
    folder.id
  );

  return { folderId: folder.id, folderUrl: folder.webViewLink };
}

// ── Document templates (RO) ───────────────────────────────────────────────────

function generateContractTemplate(
  clientName: string,
  therapistProfile?: DriveTemplateTherapistProfile,
): string {
  const today = new Date().toLocaleDateString("ro-RO");
  const therapistName = therapistProfile?.fullName?.trim() || "Terapeut";
  return `CONTRACT DE PRESTĂRI SERVICII PSIHOLOGICE
════════════════════════════════════════════════

Data: ${today}

TERAPEUT: ${therapistName}
  Colegiul Psihologilor din România
  Nr. parafă: 123456

CLIENT: ${clientName}

OBIECT
Servicii de psihoterapie individuală, conform planului terapeutic convenit.

TARIF ȘI FRECVENȚĂ
Tariful per ședință și frecvența sunt stabilite la prima întâlnire.

CONFIDENȚIALITATE
Toate datele sunt confidențiale. Terapeutul nu dezvăluie informații fără acordul scris al clientului,
cu excepția situațiilor prevăzute de lege (risc iminent, obligativitate legală).

ANULARE PROGRAMARE
Ședința poate fi anulată cu minim 24h înainte, altfel se facturează.

SEMNĂTURI
Client: ____________________________    Data: ______________
Terapeut: __________________________    Data: ______________
`;
}

function generateGdprTemplate(
  clientName: string,
  therapistProfile?: DriveTemplateTherapistProfile,
): string {
  const today = new Date().toLocaleDateString("ro-RO");
  const operatorName =
    therapistProfile?.practiceName?.trim()
    || therapistProfile?.fullName?.trim()
    || "Cabinet";
  return `ACORD PRELUCRARE DATE CU CARACTER PERSONAL (GDPR)
════════════════════════════════════════════════════

Data: ${today}
Operator: ${operatorName}
Persoana vizată: ${clientName}

TEMEI LEGAL
Prelucrarea datelor se realizează în baza Art. 9, alin. (2), lit. (h) din Regulamentul (UE) 2016/679
— date necesare în scopul furnizării serviciilor medicale psihologice.

DATE PRELUCRATE
• Date de identificare (nume, CNP, date contact)
• Date de sănătate (notițe clinice, evaluări, evidența medicației)
• Date financiare (facturare, plăți)

SCOP
Furnizarea serviciilor de psihoterapie și gestionarea dosarului clinic.

STOCARE
Datele sunt stocate pe servere securizate (Supabase) și pe Google Drive privat al terapeutului.
Perioada de retenție: 10 ani de la ultima interacțiune (conform reglementărilor sanitare RO).

DREPTURI
Aveți dreptul la acces, rectificare, ștergere și portabilitate a datelor, conform GDPR.

Am luat la cunoștință și sunt de acord cu prelucrarea datelor mele personale.

Client: ____________________________    Data: ______________
Terapeut: __________________________    Data: ______________
`;
}

/**
 * Shares a file or folder with a specific email address.
 * Role can be 'reader', 'commenter', or 'writer'.
 */
export async function shareFile(
  accessToken: string,
  fileId: string,
  emailAddress: string,
  role: "reader" | "commenter" | "writer" = "reader"
): Promise<void> {
  const res = await fetch(`${GDRIVE_BASE}/${fileId}/permissions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      role,
      type: "user",
      emailAddress,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    console.error("[Drive Share Error]", errorData);
    throw new Error(`Failed to share Drive file: ${res.status} ${res.statusText}`);
  }
}
