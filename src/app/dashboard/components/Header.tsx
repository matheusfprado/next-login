"use client";

import { signOut } from "next-auth/react";
import { FiBell, FiUser } from "react-icons/fi";

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export default function Header({ title = "Dashboard", subtitle }: HeaderProps) {
  return (
    <header className="flex flex-col sm:flex-row justify-between items-center bg-white p-6 rounded-xl shadow-md mb-6">
      <div className="text-center sm:text-left mb-4 sm:mb-0">
        <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="text-gray-500 mt-1">{subtitle}</p>}
      </div>
      <div className="flex items-center space-x-4">
        <button className="relative p-2 rounded-full hover:bg-gray-100 transition">
          <FiBell className="text-gray-600 w-6 h-6" />
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
            3
          </span>
        </button>
        <button className="p-2 rounded-full hover:bg-gray-100 transition">
          <FiUser className="text-gray-600 w-6 h-6" />
        </button>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="relative px-6 py-2 rounded-lg font-semibold text-white bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg hover:from-indigo-600 hover:to-blue-500 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0.5"
        >
          Sair
          <span className="absolute -inset-px rounded-lg border border-white opacity-25"></span>
        </button>
      </div>
    </header>
  );
}
