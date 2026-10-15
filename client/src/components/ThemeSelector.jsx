import { MonitorCog, Moon, Sun } from "lucide-react";
import { useTheme } from "../context/themeContextValue";

function ThemeSelector() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const ThemeIcon = theme === "system" ? MonitorCog : resolvedTheme === "dark" ? Moon : Sun;

  return (
    <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
      <ThemeIcon aria-hidden="true" size={17} />
      <span className="sr-only">Color theme</span>
      <select
        aria-label="Color theme"
        className="cursor-pointer bg-transparent text-sm font-semibold outline-none"
        value={theme}
        onChange={(event) => setTheme(event.target.value)}
      >
        <option value="light">Light</option>
        <option value="dark">Dark</option>
        <option value="system">System</option>
      </select>
    </label>
  );
}

export default ThemeSelector;
