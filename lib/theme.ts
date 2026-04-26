import { DarkTheme, DefaultTheme, type Theme } from "@react-navigation/native";

export const THEME = {
  light: {
    background: "hsl(0 0% 100%)",
    foreground: "#212121",
    card: "hsl(240 5% 96%)",
    cardForeground: "#212121",
    popover: "hsl(0 0% 100%)",
    popoverForeground: "#212121",
    /** Brand CTA (industrial orange). */
    primary: "#FF5C00",
    primaryForeground: "#ffffff",
    /** Optional second brand accent (aqua) — use where you need it explicitly, not as `secondary` UI token. */
    brandAccent: "#00D1C1",
    secondary: "hsl(0 0% 96.1%)",
    secondaryForeground: "hsl(0 0% 9%)",
    muted: "hsl(0 0% 96.1%)",
    mutedForeground: "#6E6E6E",
    accent: "hsl(0 0% 96.1%)",
    accentForeground: "hsl(0 0% 9%)",
    destructive: "hsl(0 84.2% 60.2%)",
    border: "hsl(0 0% 89.8%)",
    input: "hsl(0 0% 89.8%)",
    ring: "#FF5C00",
    radius: "0.625rem",
    chart1: "hsl(12 76% 61%)",
    chart2: "hsl(173 58% 39%)",
    chart3: "hsl(197 37% 24%)",
    chart4: "hsl(43 74% 66%)",
    chart5: "hsl(27 87% 67%)",
  },
  dark: {
    background: "hsl(0 0% 0%)",
    foreground: "#FAFAFA",
    card: "hsl(240 5% 10%)",
    cardForeground: "#FAFAFA",
    popover: "hsl(240 5% 10%)",
    popoverForeground: "#FAFAFA",
    primary: "#FF5C00",
    primaryForeground: "#ffffff",
    brandAccent: "#00D1C1",
    secondary: "hsl(0 0% 14.9%)",
    secondaryForeground: "hsl(0 0% 98%)",
    muted: "hsl(0 0% 14.9%)",
    mutedForeground: "#B0B0B0",
    accent: "hsl(0 0% 14.9%)",
    accentForeground: "hsl(0 0% 98%)",
    destructive: "hsl(0 70.9% 59.4%)",
    border: "hsl(0 0% 14.9%)",
    input: "hsl(0 0% 14.9%)",
    ring: "hsl(300 0% 45%)",
    radius: "0.625rem",
    chart1: "hsl(220 70% 50%)",
    chart2: "hsl(160 60% 45%)",
    chart3: "hsl(30 80% 55%)",
    chart4: "hsl(280 65% 60%)",
    chart5: "hsl(340 75% 55%)",
  },
};

/** Hex accent for `Ionicons`, `ActivityIndicator`, and other RN color props — matches `THEME.*.primary`. */
export function appAccentHex(isDark: boolean): string {
  return THEME[isDark ? "dark" : "light"].primary;
}

/**
 * Solid hex for the native root window / gesture area (Android edge-to-edge, iOS home indicator).
 * Must match app `background` tokens — avoids a mismatched “transparent” band in light mode when
 * the system draws behind translucent UI.
 */
export const ROOT_WINDOW_BACKGROUND = {
  light: "#ffffff",
  dark: "#000000",
} as const;

/**
 * React Navigation often paints scene/card layers with these colors. Use opaque **hex** here:
 * `hsl(...)` strings are not reliably parsed on native, which can leave layers **transparent**
 * and show a mismatched strip under the floating tab bar (especially in light mode).
 */
export const NAV_THEME: Record<"light" | "dark", Theme> = {
  light: {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: ROOT_WINDOW_BACKGROUND.light,
      card: ROOT_WINDOW_BACKGROUND.light,
    },
  },
  dark: {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: ROOT_WINDOW_BACKGROUND.dark,
      card: ROOT_WINDOW_BACKGROUND.dark,
    },
  },
};

