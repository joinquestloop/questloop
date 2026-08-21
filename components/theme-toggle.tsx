"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";
const choices: { value: Theme; icon: string; label: string }[] = [
  { value: "light", icon: "☀", label: "Light" },
  { value: "dark", icon: "☾", label: "Dark" },
  { value: "system", icon: "◐", label: "System" },
];

function applyTheme(theme: Theme) {
  const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.theme = isDark ? "dark" : "light";
  document.documentElement.dataset.themePreference = theme;
  document.documentElement.style.colorScheme = isDark ? "dark" : "light";
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof document === "undefined") return "system";
    const saved = document.documentElement.dataset.themePreference;
    return saved === "light" || saved === "dark" || saved === "system" ? saved : "system";
  });

  useEffect(() => {
    applyTheme(theme);
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const updateSystem = () => {
      if ((localStorage.getItem("questloop-theme") || "system") === "system") applyTheme("system");
    };
    media.addEventListener("change", updateSystem);
    return () => media.removeEventListener("change", updateSystem);
  }, [theme]);

  function chooseTheme(next: Theme) {
    setTheme(next);
    localStorage.setItem("questloop-theme", next);
  }

  return (
    <div className="theme-toggle" role="group" aria-label="Appearance" suppressHydrationWarning>
      {choices.map((choice) => (
        <button key={choice.value} type="button" className={theme === choice.value ? "active" : ""} onClick={() => chooseTheme(choice.value)} aria-pressed={theme === choice.value} title={`${choice.label} appearance`}>
          <span aria-hidden="true">{choice.icon}</span><span className="theme-label">{choice.label}</span>
        </button>
      ))}
    </div>
  );
}
