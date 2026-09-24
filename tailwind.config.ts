import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f5fafa",
          100: "#e3f2f1",
          200: "#c0e2e0",
          300: "#90cbc7",
          400: "#63b6b1",
          500: "#479893",
          600: "#3a7d79",
          700: "#2f6561",
          800: "#25504d",
          900: "#1c3b39",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
