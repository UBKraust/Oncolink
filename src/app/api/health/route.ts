export const runtime = "edge";

export async function GET() {
  return Response.json({
    status: "ok",
    app: "cepaipatit",
    timestamp: new Date().toISOString(),
  });
}
