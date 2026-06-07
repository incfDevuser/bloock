/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./utils/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        display: ["Syne_700Bold", "sans-serif"],
        body: ["DMSans_400Regular", "sans-serif"],
        bodyMedium: ["DMSans_500Medium", "sans-serif"],
        mono: ["JetBrainsMono_400Regular", "monospace"],
      },
      colors: {
        paper: "#f7f6ef",
        ink: "#0f0f0f",
        lime: {
          50: "#f8ffe4",
          100: "#eefcc0",
          200: "#e1f57f",
          300: "#c8f135",
          400: "#b6dd24",
          500: "#8ebd11",
        },
      },
    },
  },
  plugins: [],
}
