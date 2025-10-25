"use client";

import { ReactNode } from "react";
import { Loader2 } from "lucide-react"; 

interface ButtonProps {
  children: ReactNode;
  type?: "button" | "submit" | "reset";
  variant?: "primary" | "secondary" | "danger" | "ghost";
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
}

export function Button({
  children,
  type = "button",
  variant = "primary",
  loading = false,
  disabled = false,
  className = "",
  onClick,
}: ButtonProps) {
  const baseStyles =
    "w-full rounded-xl px-4 py-2 font-medium shadow-sm focus:outline-none focus:ring-2 transition duration-200 flex justify-center items-center gap-2";

  const variants: Record<string, string> = {
    primary:
      "bg-black text-white hover:bg-gray-900 focus:ring-gray-400",
    secondary:
      "bg-emerald-500 text-white hover:bg-emerald-600 focus:ring-emerald-400",
    danger: "bg-red-500 text-white hover:bg-red-600 focus:ring-red-400",
    ghost: "bg-transparent text-gray-900 hover:bg-gray-100 focus:ring-gray-400",
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant]} ${
        disabled || loading ? "opacity-70 cursor-not-allowed" : ""
      } ${className}`}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}
