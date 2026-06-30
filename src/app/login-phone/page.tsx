"use client";

import { useRouter } from "next/navigation";

import Brand from "../components/Brand";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";

export default function PhoneLoginPage() {
  const router = useRouter();

  return (
    <main className="flex min-h-dvh items-center justify-center bg-muted p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-center"><Brand /></div>
        <Card className="text-center shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl">Login por telefone indisponível</CardTitle>
            <CardDescription>Esta forma de acesso está temporariamente bloqueada.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button type="button" onClick={() => router.replace("/login")} className="min-h-11 w-full">
              Voltar para login
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
