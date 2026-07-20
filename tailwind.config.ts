import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#8e93ff",
        fg: "#1a1a1a",
        accent: "#47f654",
        surface: "#898ef6",
        muted: "#5a5d98",
        border: "#7e82df",
      },
      fontFamily: {
        body: ["var(--font-poppins)", "system-ui", "sans-serif"],
        display: ["var(--font-bitsand)", "var(--font-poppins)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "8px",
        lg: "16px",
      },
    },
  },
  plugins: [],
};

export default config;
