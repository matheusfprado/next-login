"use client";
import React from "react";

export default function Loading() {
  const text = "InvestHub";

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 space-y-10">
      
      {/* Logo animada letra por letra */}
      <h1 className="text-4xl font-extrabold tracking-tight flex space-x-1">
        {text.split("").map((letter, index) => (
          <span
            key={index}
            className="inline-block bg-gradient-to-r from-emerald-500 to-green-400 bg-clip-text text-transparent animate-bounce"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            {letter}
          </span>
        ))}
      </h1>

      {/* Barra de progresso animada */}
      <div className="w-64 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden relative">
        <div className="h-full bg-gradient-to-r from-emerald-500 to-green-400 absolute left-0 animate-fill"></div>
      </div>

      <style jsx>{`
        @keyframes fill {
          0% { width: 0%; }
          50% { width: 100%; }
          100% { width: 0%; }
        }
        .animate-fill {
          animation: fill 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
