import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      message:
        "Processamento de alertas movido para worker independente.",
    },
    { status: 202 }
  );
}
