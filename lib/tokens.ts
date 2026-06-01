// lib/tokens.ts — Bliss design token constants as JS values.
// Used in React Native StyleSheet and anywhere CSS variables can't reach.
// Keep in sync with app/+html.tsx CSS vars.

export const T = {
  // Surfaces
  bg: "#FAF7F2",
  bgRaised: "#FFFFFF",
  bgSunken: "#F2EDE4",
  bgChip: "#F4F0E8",

  // Foreground
  fg: "#16110E",
  fgMuted: "#7A716A",
  fgSubtle: "#9B9289",

  // Borders
  border: "#DCD6CD",
  borderSubtle: "#ECE7DE",

  // Accent (coral)
  accent: "#E5634A",
  accentHover: "#C84F36",
  accentSoft: "#FFF1EB",

  // Semantic
  positive: "#1F8A5B",
  positiveSoft: "#E6F1EA",
  negative: "#C0382B",
  negativeSoft: "#FAE7E3",
  invest: "#3C8C7E",
  investSoft: "#E4F0ED",
  gold: "#D99A22",

  // Fonts
  fontSans: '"Noto Sans JP", system-ui, -apple-system, sans-serif',
  fontMono: '"Geist Mono", "SF Mono", ui-monospace, monospace',

  // Radii
  radiusSm: 6,
  radiusMd: 10,
  radiusLg: 14,
  radiusPill: 999,

  // Spacing
  sp1: 4,
  sp2: 8,
  sp3: 12,
  sp4: 16,
  sp5: 20,
  sp6: 24,

  // Shadows (web only — strings)
  shadowSm: "0 1px 2px rgba(22,17,14,.04), 0 0 0 1px rgba(22,17,14,.04)",

  // Breakpoint
  narrowBreak: 880,

  // Institution colors
  chaseBlue: "#117ACA",
  msNavy: "#00264C",

  // Member colors
  kevinColor: "#E5634A",
  floraColor: "#3C8C7E",
} as const;
