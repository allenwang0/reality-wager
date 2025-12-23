/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        neon: {
          green: "#00ff41",
          red: "#ff003c",
          blue: "#00f3ff",
          yellow: "#ffee00",
        },
        cyber: {
          black: "#050505",
          gray: "#121212",
          border: "#333333",
        },
      },
      fontFamily: {
        mono: ["var(--font-roboto-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};