/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  // Dark mode toggled via `.dark` class on <html> (set by main.js)
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        body: ['Inter', 'sans-serif'],
        headline: ['Manrope', 'sans-serif'],
        label: ['Manrope', 'sans-serif'],
      },
      // Color tokens are CSS variables — light/dark palette defined in src/style.css.
      // 단일 토큰 set → :root / :root.dark 에서 값만 교체 → 모든 컴포넌트 자동 적용.
      colors: {
        background:               'rgb(var(--c-background)              / <alpha-value>)',
        onBackground:             'rgb(var(--c-onBackground)            / <alpha-value>)',
        surface:                  'rgb(var(--c-surface)                 / <alpha-value>)',
        surfaceVariant:           'rgb(var(--c-surfaceVariant)          / <alpha-value>)',
        surfaceContainerLowest:   'rgb(var(--c-surfaceContainerLowest)  / <alpha-value>)',
        surfaceContainerLow:      'rgb(var(--c-surfaceContainerLow)     / <alpha-value>)',
        surfaceContainer:         'rgb(var(--c-surfaceContainer)        / <alpha-value>)',
        surfaceContainerHighest:  'rgb(var(--c-surfaceContainerHighest) / <alpha-value>)',
        onSurface:                'rgb(var(--c-onSurface)               / <alpha-value>)',
        onSurfaceVariant:         'rgb(var(--c-onSurfaceVariant)        / <alpha-value>)',
        primary:                  'rgb(var(--c-primary)                 / <alpha-value>)',
        onPrimary:                'rgb(var(--c-onPrimary)               / <alpha-value>)',
        primaryContainer:         'rgb(var(--c-primaryContainer)        / <alpha-value>)',
        onPrimaryContainer:       'rgb(var(--c-onPrimaryContainer)      / <alpha-value>)',
        primaryFixed:             'rgb(var(--c-primaryFixed)            / <alpha-value>)',
        primaryFixedDim:          'rgb(var(--c-primaryFixedDim)         / <alpha-value>)',
        secondaryContainer:       'rgb(var(--c-secondaryContainer)      / <alpha-value>)',
        onSecondaryContainer:     'rgb(var(--c-onSecondaryContainer)    / <alpha-value>)',
        secondaryFixedDim:        'rgb(var(--c-secondaryFixedDim)       / <alpha-value>)',
        tertiaryFixed:            'rgb(var(--c-tertiaryFixed)           / <alpha-value>)',
        onTertiaryContainer:      'rgb(var(--c-onTertiaryContainer)     / <alpha-value>)',
        // 'primary-dim' 별칭 (기존 클래스 호환)
        'primary-dim':            'rgb(var(--c-primaryFixedDim)         / <alpha-value>)'
      }
    },
  },
  plugins: [],
}
