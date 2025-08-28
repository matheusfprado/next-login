/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{ts,tsx,js,jsx}",
    "./components/**/*.{ts,tsx,js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        // PRIMARY - Preto
        primary: {
          100: "#f5f5f5",
          200: "#e5e5e5",
          300: "#d4d4d4",
          400: "#a3a3a3",
          500: "#737373", // cor base escura
          600: "#525252",
          700: "#404040",
          800: "#262626",
          900: "#111111",
        },

        // SECONDARY - Cinza escuro
        secondary: {
          100: "#fafafa",
          200: "#f4f4f5",
          300: "#e4e4e7",
          400: "#d4d4d8",
          500: "#a1a1aa", // cor base secundária
          600: "#71717a",
          700: "#52525b",
          800: "#3f3f46",
          900: "#27272a",
        },

        // ACCENT - para destaques
        accent: {
          100: "#d1fae5",
          200: "#a7f3d0",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#10b981", // cor base do accent
          600: "#059669",
          700: "#047857",
          800: "#065f46",
          900: "#064e3b",
        },

        // TEXTOS
        text: {
          primary: "#f9fafb",
          secondary: "#9ca3af",
          accent: "#14b8a6",
          error: "#ef4444",
        },
      },
    },
  },
  plugins: [],
};
