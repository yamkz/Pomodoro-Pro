import type { Config } from "tailwindcss";
import { heroui } from "@heroui/theme";

const config: Config = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [heroui()],
};

export default config;
