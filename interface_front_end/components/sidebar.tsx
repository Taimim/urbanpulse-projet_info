"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface SidebarProps {
  estConnecte: boolean;
  roleUtilisateur?: string;
  estAdmin: boolean;
  estComplexe: boolean;
}

interface NavLink {
  href: string;
  label: string;
  abbr: string;
}

export function Sidebar({ estConnecte, roleUtilisateur, estAdmin, estComplexe }: SidebarProps) {
  const [expanded, setExpanded] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const saved = localStorage.getItem("up_sidebar");
    if (saved !== null) setExpanded(saved === "1");
  }, []);

  // Ferme le menu mobile à chaque changement de page
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  function toggle() {
    setExpanded((prev) => {
      const next = !prev;
      localStorage.setItem("up_sidebar", next ? "1" : "0");
      return next;
    });
  }

  const links: NavLink[] = [
    { href: "/", label: "Accueil", abbr: "AC" },
  ];

  if (!estConnecte) {
    links.push({ href: "/authentification", label: "Se connecter", abbr: "CO" });
  }

  if (estConnecte) {
    links.push({ href: "/utilisateur/profil", label: "Mon profil", abbr: "PR" });
    links.push({ href: "/utilisateur/membres", label: "Membres", abbr: "MB" });
    links.push({ href: "/gestion/objets", label: "Objets", abbr: "OB" });
    if (estAdmin) {
      links.push({ href: "/administration/utilisateurs", label: "Administration", abbr: "AD" });
    }
  }

  function handleDeconnexion() {
    sessionStorage.removeItem("auth_token");
    sessionStorage.removeItem("user_info");
    window.location.href = "/authentification/logout";
  }

  const asideClass = [
    "sidebar",
    !expanded ? "sidebar--collapsed" : "",
    mobileOpen ? "sidebar--mobile-open" : "",
  ].filter(Boolean).join(" ");

  return (
    <>
      {/* Bouton hamburger — affiché uniquement sur mobile via CSS */}
      <button
        className="hamburger-btn"
        onClick={() => setMobileOpen(true)}
        aria-label="Ouvrir le menu de navigation"
        aria-expanded={mobileOpen}
        aria-controls="sidebar-nav"
      >
        <span aria-hidden="true">☰</span>
      </button>

      {/* Fond assombri derrière le menu mobile */}
      <div
        className={`sidebar-backdrop${mobileOpen ? " sidebar-backdrop--visible" : ""}`}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />

      <aside id="sidebar-nav" className={asideClass} aria-label="Menu de navigation">
        <div className="sidebar-top">
          {expanded && <span className="sidebar-brand-name">UrbanPulse</span>}
          <button
            className="sidebar-toggle"
            onClick={toggle}
            aria-label={expanded ? "Réduire le menu" : "Agrandir le menu"}
          >
            {expanded ? "‹" : "›"}
          </button>
          <button
            className="sidebar-close-mobile"
            onClick={() => setMobileOpen(false)}
            aria-label="Fermer le menu"
          >
            ✕
          </button>
        </div>

        {expanded && roleUtilisateur && (
          <div className="sidebar-role">{roleUtilisateur}</div>
        )}

        <nav className="sidebar-nav" aria-label="Navigation principale">
          <ul>
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  className="sidebar-link"
                  href={link.href}
                  title={link.label}
                  onClick={() => setMobileOpen(false)}
                >
                  <span className="sidebar-link-abbr">{link.abbr}</span>
                  {expanded && <span className="sidebar-link-label">{link.label}</span>}
                </Link>
              </li>
            ))}
            {estConnecte && (
              <li>
                <button
                  className="sidebar-link"
                  onClick={handleDeconnexion}
                  title="Déconnexion"
                  style={{ width: "100%", textAlign: "left", background: "none", border: "none", cursor: "pointer" }}
                >
                  <span className="sidebar-link-abbr">DC</span>
                  {expanded && <span className="sidebar-link-label">Déconnexion</span>}
                </button>
              </li>
            )}
          </ul>
        </nav>

        <div className="sidebar-footer">
          {expanded && <small className="sidebar-footer-text">v1.0 • Cergy</small>}
        </div>
      </aside>
    </>
  );
}
