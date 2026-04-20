import { Outlet } from "react-router-dom";
import { useEffect } from "react";
import { useThemeStore } from "../../store/theme";

export default function AppLayout(): JSX.Element {
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.style.colorScheme = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <div
      className={`min-h-screen transition-colors ${
        theme === "dark" ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"
      }`}
    >
      <header className="flex justify-end border-b px-4 py-3 opacity-90 transition-colors border-slate-800/20 dark:border-slate-100/10">
        <button
          type="button"
          onClick={() => toggleTheme()}
          className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
            theme === "dark"
              ? "border-slate-600 bg-slate-900 hover:bg-slate-800"
              : "border-slate-300 bg-white hover:bg-slate-100"
          }`}
        >
          {theme === "dark" ? "Light" : "Dark"} mode
        </button>
      </header>
      <Outlet />
    </div>
  );
}
