import { NextResponse } from "next/server";

import { getCurrentSession } from "@/lib/supabase";
import { prisma } from "@/lib/prisma";
import { profileAvatarUrl } from "@/src/modules/auth/avatar";

const MAX_AVATAR_SIZE = 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function hasValidSignature(bytes: Uint8Array, type: string) {
  if (type === "image/jpeg") {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (type === "image/png") {
    return [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every(
      (byte, index) => bytes[index] === byte
    );
  }
  return (
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  );
}

export async function GET() {
  const session = await getCurrentSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { avatar: true },
  });
  const match = user?.avatar?.match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/);

  if (!match) {
    return NextResponse.json({ error: "Avatar não encontrado" }, { status: 404 });
  }

  const body = Buffer.from(match[2], "base64");
  return new Response(body, {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Length": String(body.length),
      "Content-Type": match[1],
    },
  });
}

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("avatar");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Selecione uma imagem." }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type) || file.size > MAX_AVATAR_SIZE || file.size === 0) {
    return NextResponse.json(
      { error: "Use uma imagem JPEG, PNG ou WebP de até 1 MB." },
      { status: 400 }
    );
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!hasValidSignature(bytes, file.type)) {
    return NextResponse.json({ error: "O arquivo não é uma imagem válida." }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: { avatar: `data:${file.type};base64,${Buffer.from(bytes).toString("base64")}` },
    select: { updatedAt: true },
  });

  return NextResponse.json({ avatar: profileAvatarUrl(updated.updatedAt) });
}

export async function DELETE() {
  const session = await getCurrentSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { avatar: null },
  });

  return new Response(null, { status: 204 });
}


