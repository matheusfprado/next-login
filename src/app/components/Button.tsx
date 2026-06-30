"use client";

import { ReactNode } from "react";
import { Loader2 } from "lucide-react";

import { Button as ShadcnButton } from "@/src/components/ui/button";
import { cn } from "@/src/lib/utils";

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
  className,
  onClick,
}: ButtonProps) {
  return (
    <ShadcnButton
      type={type}
      variant={variant === "danger" ? "destructive" : variant === "ghost" ? "ghost" : "default"}
      disabled={disabled || loading}
      aria-busy={loading}
      onClick={onClick}
      className={cn(
        "w-full rounded-xl",
        variant === "primary" && "bg-gray-950 text-white hover:bg-gray-800",
        variant === "secondary" && "bg-primary font-semibold text-white hover:bg-primary/90",
        className
      )}
    >
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
      {children}
    </ShadcnButton>
  );
}
