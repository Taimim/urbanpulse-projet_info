"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

export function ThemeToggle() {
  const [themeActuel, setThemeActuel] = useState<Theme>("light");

  useEffect(() => {
    const themeSauvegarde = localStorage.getItem("theme") as Theme | null;
    const themePrefere: Theme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    const prochainTheme = themeSauvegarde ?? themePrefere;
    // Initialisation du thème au chargement (évite un mauvais thème visuel).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setThemeActuel(prochainTheme);
    document.documentElement.setAttribute("data-theme", prochainTheme);
  }, []);

  const basculerTheme = () => {
    const prochainTheme: Theme = themeActuel === "light" ? "dark" : "light";
    setThemeActuel(prochainTheme);
    localStorage.setItem("theme", prochainTheme);
    document.documentElement.setAttribute("data-theme", prochainTheme);
  };

  return (
    <button type="button" className="theme-toggle" onClick={basculerTheme} aria-label="Basculer le thème">
      {themeActuel === "light" ? "Mode sombre" : "Mode clair"}
    </button>
  );
}
