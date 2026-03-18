import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                neon: {
                    cyan: "#00f5ff",
                    green: "#00ff88",
                    red: "#ff3b6b",
                    amber: "#ffa500",
                    purple: "#a855f7",
                },
            },
            fontFamily: {
                sans: ["Inter", "system-ui", "sans-serif"],
                mono: ["JetBrains Mono", "monospace"],
                display: ["Space Grotesk", "sans-serif"],
            },
            animation: {
                "pulse-neon": "pulse-neon 2s ease-in-out infinite",
                "heartbeat": "heartbeat 1.5s ease-in-out infinite",
                "scan": "scanline 3s linear infinite",
                "float": "float 4s ease-in-out infinite",
            },
            backgroundImage: {
                "grid-pattern":
                    "linear-gradient(rgba(0,245,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,245,255,0.03) 1px, transparent 1px)",
            },
            backgroundSize: {
                grid: "50px 50px",
            },
        },
    },
    plugins: [],
};

export default config;
