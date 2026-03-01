import { checkLeaseExpirations } from "@/lib/actions/lease-alerts";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // Verify cron secret from header for security (if configured)
  const authHeader = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await checkLeaseExpirations();
  return NextResponse.json({ ok: true, ...result });
}
