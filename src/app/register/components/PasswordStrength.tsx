"use client";

import { useEffect, useState } from "react";
import { CheckCircleIcon, XCircleIcon } from "lucide-react"; // ícones bonitos

interface PasswordStrengthProps {
  password: string;
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const [strength, setStrength] = useState(0);

  const criteria = [
    { regex: /[A-Z]/, label: "Uma letra maiúscula" },
    { regex: /[a-z]/, label: "Uma letra minúscula" },
    { regex: /[0-9]/, label: "Um número" },
    { regex: /[^A-Za-z0-9]/, label: "Um caractere especial" },
    { regex: /.{6,}/, label: "Mínimo 6 caracteres" },
  ];

  const fulfilled = criteria.filter(c => c.regex.test(password));

  useEffect(() => {
    setStrength((fulfilled.length / criteria.length) * 100);
  }, [password]);

  const getGradient = () => {
    if (strength < 40) return "bg-gradient-to-r from-red-400 to-red-600";
    if (strength < 80) return "bg-gradient-to-r from-yellow-400 to-yellow-600";
    return "bg-gradient-to-r from-green-400 to-green-600";
  };

  return (
    <div className="mt-3">
      {/* Barra de progresso */}
      <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-3 transition-all duration-500 ${getGradient()}`}
          style={{ width: `${strength}%` }}
        />
      </div>

      {/* Lista de critérios com ícones */}
      <ul className="mt-2 grid grid-cols-1 gap-1 text-sm">
        {criteria.map(c => {
          const valid = c.regex.test(password);
          return (
            <li
              key={c.label}
              className={`flex items-center gap-2 transition-colors ${
                valid ? "text-green-500" : "text-red-400"
              }`}
            >
              {valid ? (
                <CheckCircleIcon className="w-4 h-4 animate-bounce" />
              ) : (
                <XCircleIcon className="w-4 h-4 animate-pulse" />
              )}
              {c.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
