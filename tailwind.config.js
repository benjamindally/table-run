/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        // Primary font - Antonio (1950s bowling alley + genius vibe)
        sans: ['Antonio', 'system-ui', 'sans-serif'],
        // You can add more fonts here in the future:
        // heading: ['SomeOtherFont', 'sans-serif'],
        // body: ['AnotherFont', 'sans-serif'],
      },
      colors: {
        // Primary: Turquoise Blue - Main action color for CTAs and primary actions
        primary: {
          DEFAULT: '#26A69A',
          50: '#E0F2F1',
          100: '#B2DFDB',
          200: '#80CBC4',
          300: '#4DB6AC',
          400: '#26A69A',
          500: '#26A69A',
          600: '#00897B',
          700: '#00796B',
          800: '#00695C',
          900: '#004D40',
        },
        // Secondary: Mustard Yellow - Alternative actions, highlights, moments of delight
        secondary: {
          DEFAULT: '#FBC02D',
          50: '#FFFDE7',
          100: '#FFF9C4',
          200: '#FFF59D',
          300: '#FFF176',
          400: '#FFEE58',
          500: '#FBC02D',
          600: '#F9A825',
          700: '#F57F17',
          800: '#F57C00',
          900: '#E65100',
        },
        // Neutral Dark: Charcoal - Text and navigation
        dark: {
          DEFAULT: '#37474F',
          50: '#ECEFF1',
          100: '#CFD8DC',
          200: '#B0BEC5',
          300: '#90A4AE',
          400: '#78909C',
          500: '#37474F',
          600: '#546E7A',
          700: '#455A64',
          800: '#37474F',
          900: '#263238',
        },
        // Neutral Light: Warm White - Backgrounds and cards
        cream: {
          DEFAULT: '#FFFBF5',
          50: '#FFFFFF',
          100: '#FFFBF5',
          200: '#FFF8ED',
          300: '#FFF4E1',
          400: '#FFECB3',
          500: '#FFE082',
          600: '#FFD54F',
          700: '#FFCA28',
          800: '#FFC107',
          900: '#FFB300',
        },
        // Accent: Cherry Red - Notifications, destructive actions, error states
        accent: {
          DEFAULT: '#D32F2F',
          50: '#FFEBEE',
          100: '#FFCDD2',
          200: '#EF9A9A',
          300: '#E57373',
          400: '#EF5350',
          500: '#D32F2F',
          600: '#F44336',
          700: '#E53935',
          800: '#D32F2F',
          900: '#C62828',
        },
      },
    },
  },
  plugins: [],
};
