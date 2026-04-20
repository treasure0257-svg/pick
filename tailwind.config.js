/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        body: ['Inter', 'sans-serif'],
        headline: ['Manrope', 'sans-serif'],
        label: ['Manrope', 'sans-serif'],
      },
      colors: {
        background: '#FAF9F6',
        onBackground: '#1A1C1E',
        surface: '#FFFFFF',
        surfaceVariant: '#E1E2E4',
        surfaceContainerLowest: '#FFFFFF',
        surfaceContainerLow: '#F7F6F3',
        surfaceContainer: '#EAEBE8',
        surfaceContainerHighest: '#E3E4E1',
        onSurface: '#1A1C1E',
        onSurfaceVariant: '#444749',
        primary: '#436B53',
        onPrimary: '#FFFFFF',
        primaryContainer: '#C4F1D4',
        onPrimaryContainer: '#002111',
        primaryFixed: '#C4F1D4',
        primaryFixedDim: '#A8D5B8',
        secondaryContainer: '#E2E3E0',
        onSecondaryContainer: '#1A1C1E',
        secondaryFixedDim: '#C6C7C4',
        tertiaryFixed: '#F2DFE2',
        onTertiaryContainer: '#3B0716',
      }
    },
  },
  plugins: [],
}
