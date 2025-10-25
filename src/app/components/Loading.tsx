"use client";
import React from "react";

import clsx from "clsx";

interface LoadingProps {
  fullScreen?: boolean;
  label?: string;
}

export default function Loading({ fullScreen = true, label }: LoadingProps) {
  const text = "InvestHub";

  const containerClasses = clsx(
    "flex flex-col items-center justify-center space-y-8",
    fullScreen
      ? "min-h-screen bg-gray-50"
      : "py-10 min-h-[200px]"
  );

  return (
    <div className={containerClasses}>
      <h1
        className={clsx(
          "flex space-x-1 font-extrabold tracking-tight",
          fullScreen ? "text-4xl" : "text-3xl"
        )}
      >
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

      <div className="relative h-2 w-64 overflow-hidden rounded-full bg-gray-200">
        <div className="animate-fill absolute left-0 h-full bg-gradient-to-r from-emerald-500 to-green-400" />
      </div>

      {label && (
        <p className="text-sm font-medium text-gray-500">
          {label}
        </p>
      )}

      <style jsx>{`
        @keyframes fill {
          0% {
            width: 0%;
          }
          50% {
            width: 100%;
          }
          100% {
            width: 0%;
          }
        }
        .animate-fill {
          animation: fill 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
