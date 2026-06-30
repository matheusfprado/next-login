// components/OTPInput.tsx
"use client";

import React, { useRef } from "react";
import { Input } from "@/src/components/ui/input";

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
        <Input
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
          className="size-12 text-center text-lg"
        />
      ))}
    </div>
  );
};
