"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";

import { cn } from "@/src/lib/utils";

type ButtonVariant = "default" | "secondary" | "outline" | "ghost" | "destructive";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  variant?: ButtonVariant;
}

const variants: Record<ButtonVariant, string> = {
  default: "bg-gray-950 text-white hover:bg-gray-800 focus-visible:ring-gray-400",
  secondary: "bg-emerald-500 text-white hover:bg-emerald-600 focus-visible:ring-emerald-400",
  outline:
    "border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 focus-visible:ring-gray-300",
  ghost: "text-gray-700 hover:bg-gray-100 focus-visible:ring-gray-300",
  destructive: "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-400",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, disabled, isLoading, children, variant = "default", ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      className={cn(
        "inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium shadow-sm transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        className
      )}
      {...props}
    >
      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
      {children}
    </button>
  )
);

Button.displayName = "Button";
