"use client";
import { useState, InputHTMLAttributes, useEffect } from "react";

interface FloatingInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  validate?: "email" | "password";
  minLength?: number;
}

export default function FloatingInput({
  label,
  validate,
  minLength = 6,
  ...props
}: FloatingInputProps) {
  const [focused, setFocused] = useState(false);
  const [value, setValue] = useState<string>(
    typeof props.value === "string" ? props.value : ""
  );
  const [error, setError] = useState("");

  useEffect(() => {
    if (!value) {
      setError("");
      return;
    }

    if (validate === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      setError(emailRegex.test(value) ? "" : "Email inválido");
    }

    if (validate === "password") {
      setError(
        value.length >= minLength
          ? ""
          : `Senha deve ter pelo menos ${minLength} caracteres`
      );
    }
  }, [value, validate, minLength]);

  return (
    <div className="relative w-full">
      <input
        {...props}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={`peer w-full h-12 px-3 pt-6 pb-2 rounded-lg bg-white border border-primary-100 text-gray-700 placeholder-transparent transition
          ${error ? "text-red-500" : "text-gray-700"}`}
      />
      <label
        className={`absolute left-3 px-1 transition-all duration-200 bg-white rounded-lg 
          ${focused || value
            ? "-top-2 text-xs text-primary-700 font-semibold"
            : "top-4 text-primary-400 text-sm"
          }
          ${error ? "text-red-500" : ""}`}
      >
        {label}
      </label>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}
