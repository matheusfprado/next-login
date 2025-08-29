"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiHome, FiBookOpen, FiUser, FiSettings } from "react-icons/fi";

export default function Sidebar() {
  const pathname = usePathname();

  const links = [
    { label: "Visão Geral", href: "/dashboard/overview", icon: <FiHome /> },
    { label: "Notícias", href: "/dashboard/news", icon: <FiBookOpen /> },
    { label: "Perfil", href: "/dashboard/profile", icon: <FiUser /> },
    { label: "Configurações", href: "/dashboard/settings", icon: <FiSettings /> },
  ];

  return (
    <aside className="w-64 bg-white h-screen shadow-lg rounded-r-xl p-6 flex flex-col">
      {/* Logo / Título */}
      <div className="mb-8 flex items-center gap-2">
        <div className="bg-blue-600 w-10 h-10 flex items-center justify-center rounded-lg text-white font-bold text-lg">
          I
        </div>
        <h1 className="text-2xl font-bold text-gray-800">InvestHub</h1>
      </div>

      {/* Navegação */}
      <nav className="flex-1 flex flex-col gap-2">
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg transition
                ${isActive ? "bg-blue-600 text-white shadow-md" : "text-gray-700 hover:bg-gray-100"}
              `}
            >
              <span className="w-5 h-5">{link.icon}</span>
              <span className="font-medium">{link.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Rodapé */}
      <div className="mt-auto pt-4 border-t border-gray-200">
        <p className="text-gray-500 text-sm">&copy; 2025 InvestHub</p>
      </div>
    </aside>
  );
}
