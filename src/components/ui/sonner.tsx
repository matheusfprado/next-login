"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"

export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      theme="light"
      position="top-right"
      closeButton
      toastOptions={{
        classNames: {
          toast: "!border-gray-200 !bg-white !font-sans !text-gray-900 !shadow-lg",
          title: "!text-gray-900",
          description: "!text-gray-600",
          closeButton: "!border-gray-200 !bg-white !text-gray-600",
        },
      }}
      {...props}
    />
  )
}
