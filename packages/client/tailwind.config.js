/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        arena: {
          cyan: '#00f0ff',
          'cyan-glow': 'rgba(0, 240, 255, 0.4)',
          blue: '#0066ff',
          'blue-glow': 'rgba(0, 102, 255, 0.4)',
          void: '#030712',
          deep: '#050b14',
          charcoal: '#0b1220',
          panel: '#0f172a',
          silver: '#e2e8f0',
          gold: '#ffd700',
          'gold-glow': 'rgba(255, 215, 0, 0.4)',
          red: '#ff3b30',
          orange: '#ff6b00',
        },
      },
      fontFamily: {
        display: ['Cinzel', 'serif'],
        sans: ['Rajdhani', 'sans-serif'],
      },
      keyframes: {
        radarSweep: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        shimmerHolo: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        cardFloat: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-10px) rotate(1.5deg)' },
        },
        turnBannerReveal: {
          '0%': { transform: 'scale(0.8) translateY(-20px)', opacity: '0', filter: 'blur(8px)' },
          '50%': { transform: 'scale(1.05) translateY(0)', opacity: '1', filter: 'blur(0)' },
          '100%': { transform: 'scale(1) translateY(0)', opacity: '1', filter: 'blur(0)' },
        },
        screenShake: {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '20%': { transform: 'translate(-4px, 4px)' },
          '40%': { transform: 'translate(4px, -4px)' },
          '60%': { transform: 'translate(-3px, 2px)' },
          '80%': { transform: 'translate(3px, -2px)' },
        },
      },
      animation: {
        'radar-sweep': 'radarSweep 3s linear infinite',
        'holo-shimmer': 'shimmerHolo 3.5s linear infinite',
        'card-float': 'cardFloat 4s ease-in-out infinite',
        'turn-reveal': 'turnBannerReveal 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'screen-shake': 'screenShake 0.35s ease-in-out',
      },
    },
  },
  plugins: [],
}
