import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'float-delayed': 'float 6s ease-in-out 3s infinite',
        'orb-move': 'orb-move 20s linear infinite',
        'orb-move-reverse': 'orb-move-reverse 25s linear infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'flow-line': 'flow-line 3s linear infinite',
        'fade-in-up': 'fade-in-up 1s cubic-bezier(0.16, 1, 0.3, 1) both',
        'number-count': 'number-count 2s ease-out forwards',
        'bounce-subtle': 'bounce-subtle 2s ease-in-out infinite',
        'dash-line': 'dash-line 3s linear infinite',
        'dash-broken': 'dash-broken 10s linear infinite',
        'flash-warning': 'flash-warning 2s ease-in-out infinite',
        'slide-down': 'slide-down 0.8s cubic-bezier(0.16, 1, 0.3, 1) both',
        'scale-up-fade': 'scale-up-fade 1.2s cubic-bezier(0.16, 1, 0.3, 1) both',
        'fade-in': 'fade-in 1s ease-out both',
      },
      keyframes: {
        'slide-down': {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'scale-up-fade': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-15px)' },
        },
        'orb-move': {
          '0%': { transform: 'rotate(0deg) translateX(50px) rotate(0deg)' },
          '100%': { transform: 'rotate(360deg) translateX(50px) rotate(-360deg)' },
        },
        'orb-move-reverse': {
          '0%': { transform: 'rotate(360deg) translateX(70px) rotate(-360deg)' },
          '100%': { transform: 'rotate(0deg) translateX(70px) rotate(0deg)' },
        },
        'flow-line': {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'dash-broken': {
          '0%': { strokeDashoffset: '100' },
          '100%': { strokeDashoffset: '0' },
        },
        'flash-warning': {
          '0%, 100%': { opacity: '0.4', backgroundColor: 'rgba(239, 68, 68, 0.1)' },
          '50%': { opacity: '1', backgroundColor: 'rgba(239, 68, 68, 0.3)' },
        },
        'bounce-subtle': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(8px)' },
        },
        'dash-line': {
          '0%': { strokeDashoffset: '1000' },
          '100%': { strokeDashoffset: '0' },
        }
      }
    },
  },
  plugins: [],
};

export default config;
