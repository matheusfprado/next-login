"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

import Brand from "../components/Brand";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    const response = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await response.json().catch(() => null);
    setMessage(data?.message ?? "Verifique seu e-mail.");
    setLoading(false);
  };

  return (
    <main className="flex min-h-dvh items-center justify-center bg-muted p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-center"><Brand /></div>
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl">Recuperar senha</CardTitle>
            <CardDescription>Enviaremos um link válido por uma hora.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="forgot-email">E-mail</Label>
                <Input id="forgot-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="min-h-11" />
              </div>
              {message && <p role="status" className="rounded-lg border border-primary/20 bg-primary/10 p-3 text-sm text-emerald-800">{message}</p>}
              <Button type="submit" disabled={loading} className="min-h-11 w-full">
                {loading ? "Enviando..." : "Enviar link"}
              </Button>
              <Button asChild variant="link" className="w-full text-emerald-700">
                <Link href="/login">Voltar ao login</Link>
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
