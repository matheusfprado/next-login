import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return NextResponse.json({ error: "Usuário já existe" }, { status: 400 });

  const user = await prisma.user.create({ data: { email, password } });
  return NextResponse.json(user);
}
