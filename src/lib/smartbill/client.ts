/**
 * SmartBill Cloud API client — Romanian e-Factura.
 *
 * Auth: HTTP Basic (username + token from env).
 * Base: https://ws.smartbill.ro/SBORO/api
 *
 * This file uses only `fetch` — edge runtime compatible.
 * Never import from client components.
 */

const BASE = "https://ws.smartbill.ro/SBORO/api";

function authHeader(): string {
  const user = process.env.SMARTBILL_USERNAME ?? "";
  const token = process.env.SMARTBILL_TOKEN ?? "";
  return "Basic " + Buffer.from(`${user}:${token}`).toString("base64");
}

function cif(): string {
  return process.env.SMARTBILL_CIF ?? "";
}

function series(): string {
  return process.env.SMARTBILL_SERIES ?? "PSIH";
}

export function isSmartBillConfigured(): boolean {
  return !!(
    process.env.SMARTBILL_USERNAME &&
    process.env.SMARTBILL_TOKEN &&
    process.env.SMARTBILL_CIF
  );
}

export interface SmartBillClient {
  name: string;
  vatCode: string;       // CNP or CIF (RO prefix optional)
  address: string;
  isTaxPayer: boolean;   // false for individuals
  city?: string;
  county?: string;
  country?: string;
}

export interface CreateInvoiceParams {
  client: SmartBillClient;
  issueDate: string;        // YYYY-MM-DD
  amountRON: number;        // unit price per session, VAT-inclusive
  sessionLabel?: string;    // defaults to "Ședință psihoterapie"
  isDraft?: boolean;
}

export interface SmartBillInvoiceResult {
  series: string;
  number: string;
  url: string;             // PDF download URL
  paymentLink: string;
}

export async function createSmartBillInvoice(
  params: CreateInvoiceParams,
): Promise<SmartBillInvoiceResult> {
  const productName = params.sessionLabel ?? "Ședință psihoterapie";

  const body = {
    companyVatCode: cif(),
    client: {
      name: params.client.name,
      vatCode: params.client.vatCode,
      address: params.client.address,
      isTaxPayer: params.client.isTaxPayer,
      city: params.client.city ?? "",
      county: params.client.county ?? "",
      country: params.client.country ?? "Romania",
      saveToDb: false,
    },
    issueDate: params.issueDate,
    seriesName: series(),
    language: "RO",
    currency: "RON",
    isDraft: params.isDraft ?? false,
    useStock: false,
    products: [
      {
        name: productName,
        code: "SEDINTA",
        isService: true,
        um: "ședință",
        quantity: 1,
        price: params.amountRON,
        isTaxIncluded: true,
        taxName: "Scutit",
        taxPercentage: 0,
        isDiscount: false,
      },
    ],
  };

  const res = await fetch(`${BASE}/invoice`, {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`SmartBill error ${res.status}: ${text}`);
  }

  const data = (await res.json()) as {
    series?: string;
    number?: string;
    errorText?: string;
  };

  if (data.errorText) throw new Error(`SmartBill: ${data.errorText}`);
  if (!data.series || !data.number)
    throw new Error("SmartBill: răspuns incomplet (lipsă series/number)");

  const seriesName = data.series;
  const number = data.number;

  const pdfUrl = `${BASE}/invoice/pdf?cif=${encodeURIComponent(cif())}&seriesname=${encodeURIComponent(seriesName)}&number=${encodeURIComponent(number)}`;
  const paymentLink = await fetchPaymentLink(seriesName, number);

  return { series: seriesName, number, url: pdfUrl, paymentLink };
}

async function fetchPaymentLink(
  seriesName: string,
  number: string,
): Promise<string> {
  try {
    const res = await fetch(
      `${BASE}/invoice/paymentlink?cif=${encodeURIComponent(cif())}&seriesname=${encodeURIComponent(seriesName)}&number=${encodeURIComponent(number)}`,
      {
        headers: {
          Authorization: authHeader(),
          Accept: "application/json",
        },
      },
    );
    if (!res.ok) return "";
    const data = (await res.json()) as { paymentLink?: string };
    return data.paymentLink ?? "";
  } catch {
    return "";
  }
}

export interface SmartBillWebhookPayload {
  companyVatCode: string;
  seriesName: string;
  number: string;
  eventType: "invoice.paid" | string;
}
