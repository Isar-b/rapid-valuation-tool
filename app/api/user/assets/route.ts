import { NextRequest } from "next/server";

export async function GET() {
  // Stub - will be implemented in Phase 8
  return Response.json({ assets: [], selected: null });
}

export async function POST(request: NextRequest) {
  // Stub - will be implemented in Phase 8
  const body = await request.json();
  return Response.json({ success: true, assets: body.assets });
}
