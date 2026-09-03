import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        star: {
          DEFAULT: "#A62899",
          dark: "#8C0378",
          light: "#E8CDE4",
        },
      },
    },
  },
  plugins: [],
};
export default config;
