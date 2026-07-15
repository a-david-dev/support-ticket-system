"use client";

import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  function toggleTheme() {
    const currentTheme = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
    const nextTheme = currentTheme === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem("theme", nextTheme);
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="fixed bottom-5 right-5 z-50 inline-flex size-11 items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-900 shadow-lg transition hover:bg-zinc-50"
      aria-label="Cambiar entre modo claro y oscuro"
      title="Cambiar tema"
    >
      <Moon className="theme-icon-moon" size={19} />
      <Sun className="theme-icon-sun hidden" size={19} />
    </button>
  );
}
