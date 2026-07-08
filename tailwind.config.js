/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Paleta propia del RMS: azul-tinta (confianza/finanzas) + ámbar (comercio/efectivo).
        // Evitamos deliberadamente el crema+terracota y el negro+verde-ácido genéricos de IA.
        ink: {
          50: '#F4F6F9',
          100: '#E8ECF2',
          200: '#C9D3E0',
          300: '#9FADC4',
          400: '#6B7FA0',
          500: '#3F5678',
          600: '#2C405C',
          700: '#20304A',
          800: '#16233A',
          900: '#0D1626',
        },
        amber: {
          50: '#FFF8EC',
          100: '#FEEACB',
          200: '#FCD592',
          300: '#F9BB56',
          400: '#F2A030',
          500: '#DC841A',
          600: '#B36613',
          700: '#8A4D12',
        },
        success: {
          50: '#EBF7F1',
          500: '#1B8354',
          600: '#146A43',
        },
        danger: {
          50: '#FBEDEC',
          500: '#C1382E',
          600: '#9E2D25',
        },
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        display: ['"Lexend"', '"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(13, 22, 38, 0.06), 0 1px 3px rgba(13, 22, 38, 0.08)',
      },
    },
  },
  plugins: [],
};
