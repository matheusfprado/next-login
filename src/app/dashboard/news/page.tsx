"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Sidebar from "./page";
import Header from "../components/Header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p className="text-gray-500 text-lg animate-pulse">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Apenas renderiza o sidebar, sem passar children */}
      <Sidebar>
        <div>Algum conteúdo extra</div>
      </Sidebar>
      <div className="flex-1 p-6">
        <div className="p-6 bg-gray-50 min-h-screen">
          <Header />
        </div>

        {/* Conteúdo da página */}
        <div>{children}</div>
      </div>
    </div>
  );
}
