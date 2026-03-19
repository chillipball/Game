import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "jarvis-dark": "#0a0a0f",
        "jarvis-panel": "#111118",
      },
    },
  },
} satisfies Config;
