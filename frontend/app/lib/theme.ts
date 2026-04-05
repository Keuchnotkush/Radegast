/* ─── Radegast Design Tokens ─── */

export const P = {
  bg: "#D8D2C8",
  surface: "#F0EDE8",
  jade: "#38A88A",
  jadeAccent: "#45BA9A",
  jadeDark: "#2D8E74",
  indigo: "#4B0082",
  terracotta: "#CC5A3A",
  safran: "#C8A415",
  roseAncien: "#B5506A",
  dark: "#2A2A2A",
  gray: "#6B6B6B",
  border: "#C4C4C4",
  gain: "#2E8B57",
  loss: "#C62828",
  white: "#FFFFFF",
  cream: "#D8D2C8",
} as const;

export const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const spring = {
  type: "spring" as const,
  stiffness: 400,
  damping: 20,
};
