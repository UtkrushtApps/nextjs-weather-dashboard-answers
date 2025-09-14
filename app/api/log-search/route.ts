import { NextRequest, NextResponse } from 'next/server';

// In-memory log (shared for hot reloading sessions only - resets between server restarts)
const logs: { city: string; timestamp: string }[] = [];

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    if (typeof data.city !== 'string' || typeof data.timestamp !== 'string') {
      return NextResponse.json({ error: "Malformed payload." }, { status: 400 });
    }
    logs.push({ city: data.city, timestamp: data.timestamp });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
}

// (Optional) for testing/log viewing: you could add a GET endpoint.
// export async function GET() {
//   return NextResponse.json(logs);
// }
