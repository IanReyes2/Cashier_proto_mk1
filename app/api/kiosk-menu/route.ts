// app/api/kiosk-menu/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch("http://localhost:3000/api/menu");
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("❌ Failed to fetch menu via proxy:", err);
    return NextResponse.json({ error: "Failed to fetch menu" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { id, days } = await req.json();

    if (!id || !Array.isArray(days)) {
      return NextResponse.json(
        { error: "Invalid payload" },
        { status: 400 }
      );
    }

    const res = await fetch(
      `http://localhost:3000/api/menu/${id}/availability`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days }),
      }
    );

    const text = await res.text();
    return new Response(text, { status: res.status });
  } catch (err) {
    console.error("❌ PATCH proxy failed:", err);
    return NextResponse.json(
      { error: "Failed to update availability" },
      { status: 500 }
    );
  }
}

