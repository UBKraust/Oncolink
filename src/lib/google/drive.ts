/**
 * Google Drive REST API client — fetch-only, edge-compatible.
 */

const GDRIVE_UPLOAD_BASE = "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart";
const GDRIVE_BASE = "https://www.googleapis.com/drive/v3/files";

export async function uploadDocumentToDrive(
  accessToken: string,
  fileBlob: Blob,
  fileName: string,
  mimeType: string
): Promise<{ id: string; webViewLink: string }> {
  
  // Multipart form data boundary
  const boundary = '-------314159265358979323846';
  const delimiter = "\r\n--" + boundary + "\r\n";
  const close_delim = "\r\n--" + boundary + "--";

  // Form metadata
  const metadata = {
    name: fileName,
    mimeType: mimeType
  };

  // Convert Blob to Base64 to construct the payload
  const buffer = await fileBlob.arrayBuffer();
  const base64Data = Buffer.from(buffer).toString('base64');

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: ' + mimeType + '\r\n' +
    'Content-Transfer-Encoding: base64\r\n\r\n' +
    base64Data +
    close_delim;

  const res = await fetch(GDRIVE_UPLOAD_BASE, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": `multipart/related; boundary=${boundary}`,
    },
    body: multipartRequestBody
  });

  if (!res.ok) {
    throw new Error(`Google Drive upload failed: ${res.status} ${res.statusText}`);
  }

  const result = await res.json() as { id: string };

  // Fetch exactly the webViewLink
  const linkRes = await fetch(`${GDRIVE_BASE}/${result.id}?fields=webViewLink`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${accessToken}`
    }
  });

  const linkData = await linkRes.json() as { webViewLink: string };

  return { id: result.id, webViewLink: linkData.webViewLink };
}
