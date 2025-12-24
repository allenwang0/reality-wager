import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        protocol: {
          black: "#0a0a0a",
          dark: "#111111",
          gray: "#222222",
          light: "#eeeeee",
          white: "#ffffff",
          signal: "#00ff33", // Green (Success)
          noise: "#ff3333",  // Red (Error)
          highlight: "#ffffff",
        },
      },
      fontFamily: {
        mono: ["Menlo", "Monaco", "Courier New", "monospace"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      animation: {
        'scan': 'scan 2s linear infinite',
        'blink': 'blink 1s step-end infinite',
        'fade-in': 'fadeIn 0.5s ease-out forwards',
      },
      keyframes: {
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        }
      }
    },
  },
  plugins: [],
};
export default config;