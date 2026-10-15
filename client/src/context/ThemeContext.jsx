import { useEffect, useState } from "react";
import { ThemeContext } from "./themeContextValue";

const STORAGE_KEY = "amade-theme";
const THEMES = new Set(["light", "dark", "system"]);
const SYSTEM_DARK_QUERY = "(prefers-color-scheme: dark)";

function getInitialTheme() {
  try {
    const storedTheme = window.localStorage.getItem(STORAGE_KEY);
    return THEMES.has(storedTheme) ? storedTheme : "system";
  } catch {
    return "system";
  }
}

function getSystemTheme() {
  return window.matchMedia(SYSTEM_DARK_QUERY).matches ? "dark" : "light";
}

function applyTheme(theme, resolvedTheme) {
  const root = document.documentElement;
  root.dataset.theme = resolvedTheme;
  root.dataset.themePreference = theme;
  root.classList.toggle("dark", resolvedTheme === "dark");
  root.style.colorScheme = resolvedTheme;
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme);
  const [systemTheme, setSystemTheme] = useState(getSystemTheme);
  const resolvedTheme = theme === "system" ? systemTheme : theme;
  const darkMode = resolvedTheme === "dark";

  useEffect(() => {
    const mediaQuery = window.matchMedia(SYSTEM_DARK_QUERY);
    const updateSystemTheme = (event) => {
      setSystemTheme(event.matches ? "dark" : "light");
    };

    mediaQuery.addEventListener("change", updateSystemTheme);
    return () => mediaQuery.removeEventListener("change", updateSystemTheme);
  }, []);

  useEffect(() => {
    applyTheme(theme, resolvedTheme);
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Keep the current choice active for this session if storage is unavailable.
    }
  }, [theme, resolvedTheme]);

  useEffect(() => {
    const syncThemeFromStorage = (event) => {
      if (event.key === STORAGE_KEY) {
        setTheme(THEMES.has(event.newValue) ? event.newValue : "system");
      }
    };

    window.addEventListener("storage", syncThemeFromStorage);
    return () => window.removeEventListener("storage", syncThemeFromStorage);
  }, []);

  const toggleTheme = () => {
    setTheme(darkMode ? "light" : "dark");
  };
  const changeTheme = (nextTheme) => {
    if (THEMES.has(nextTheme)) {
      setTheme(nextTheme);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, darkMode, setTheme: changeTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
