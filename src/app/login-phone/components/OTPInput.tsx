// components/OTPInput.tsx
"use client";

import React, { useRef } from "react";

type OTPInputProps = {
  code: string[];
  setCode: (code: string[]) => void;
  length?: number;
};

export const OTPInput: React.FC<OTPInputProps> = ({
  code,
  setCode,
  length = 6,
}) => {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const handleChange = (value: string, index: number) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <div className="flex justify-center gap-2">
      {Array.from({ length }).map((_, idx) => (
        <input
          key={idx}
          ref={(el) => {
            inputRefs.current[idx] = el; // <-- só atribui, não retorna nada
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={code[idx] || ""}
          onChange={(e) => handleChange(e.target.value, idx)}
          onKeyDown={(e) => handleKeyDown(e, idx)}
          className="w-12 h-12 text-center rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-lg focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500"
        />
      ))}
    </div>
  );
};
