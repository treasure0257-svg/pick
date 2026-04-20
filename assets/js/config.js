// Shared Tailwind config for The Concierge
// Inject after the Tailwind CDN script tag on every page.
window.tailwind && (tailwind.config = {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "on-tertiary": "#f9f8ff",
        "surface-container-high": "#e5e9eb",
        "on-primary-container": "#1e5469",
        "on-secondary-fixed": "#264350",
        "surface-container-lowest": "#ffffff",
        "surface-bright": "#f8f9fa",
        "on-primary-fixed": "#004155",
        "on-primary-fixed-variant": "#2a5e73",
        "primary-container": "#b1e4fd",
        "primary": "#32657a",
        "surface-dim": "#d5dbdd",
        "tertiary-fixed-dim": "#b1c0ec",
        "tertiary-fixed": "#becefa",
        "surface-container": "#ebeef0",
        "on-error": "#fff7f6",
        "on-surface": "#2d3335",
        "on-tertiary-fixed-variant": "#3f4e73",
        "on-secondary": "#f3faff",
        "error-dim": "#67040d",
        "inverse-on-surface": "#9b9d9e",
        "primary-fixed": "#b1e4fd",
        "surface-variant": "#dee3e6",
        "background": "#f8f9fa",
        "tertiary-dim": "#435278",
        "surface-container-low": "#f1f4f5",
        "secondary-fixed-dim": "#bbd9e9",
        "primary-fixed-dim": "#a4d6ef",
        "tertiary-container": "#becefa",
        "primary-dim": "#24596e",
        "secondary": "#466370",
        "on-tertiary-container": "#354569",
        "error": "#a83836",
        "secondary-container": "#c9e7f7",
        "surface-tint": "#32657a",
        "on-error-container": "#6e0a12",
        "tertiary": "#4f5e84",
        "outline": "#767c7e",
        "on-primary": "#f3faff",
        "inverse-surface": "#0c0f10",
        "surface-container-highest": "#dee3e6",
        "secondary-dim": "#3a5764",
        "on-tertiary-fixed": "#213155",
        "inverse-primary": "#b1e4fd",
        "error-container": "#fa746f",
        "on-background": "#2d3335",
        "outline-variant": "#adb3b5",
        "secondary-fixed": "#c9e7f7",
        "surface": "#f8f9fa",
        "on-secondary-fixed-variant": "#435f6d",
        "on-surface-variant": "#5a6062",
        "on-secondary-container": "#395663"
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
        xl: "0.75rem",
        full: "9999px"
      },
      fontFamily: {
        headline: ["Manrope", "sans-serif"],
        body: ["Inter", "sans-serif"],
        label: ["Inter", "sans-serif"]
      }
    }
  }
});
