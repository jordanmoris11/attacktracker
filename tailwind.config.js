/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: {
          primary: '#0a0a0f',   // Deep Space
          secondary: '#12121a', // Panel BG
          tertiary: '#1e1e2e',  // Card BG
        },
        brand: {
          blue: '#3b82f6',
          red: '#ef4444',
          orange: '#f97316',
          yellow: '#eab308',
          purple: '#a855f7',
        },
        // Attack Flow Semantics
        attack: {
          infection: '#ef4444',
          exfil: '#f97316',
          lateral: '#eab308',
          c2: '#a855f7',
        },
        // Trust Boundaries (Spec 10)
        boundary: {
          machine: '#64748b',
          kernel: '#8b5cf6',
          protected: '#ef4444',
          container: '#3b82f6',
          network: '#64748b',
        }
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', "Liberation Mono", "Courier New", 'monospace'],
      }
    },
  },
  plugins: [],
}
