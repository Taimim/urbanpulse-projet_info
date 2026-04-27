import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { ThemeToggle } from "@/components/theme-toggle";
import { Sidebar } from "@/components/sidebar";
import "./globals.css";

export const metadata: Metadata = {
  title: "UrbanPulse",
  description: "Plateforme intelligente urbaine pour visualiser, gérer et administrer les services connectés."
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const magasinCookies = await cookies();
  const jeton = magasinCookies.get("auth_token")?.value;
  const roleUtilisateur = magasinCookies.get("user_role")?.value?.toLowerCase();
  const estAdmin = roleUtilisateur === "administrateur";
  const estComplexe = roleUtilisateur === "complexe";
  const estConnecte = Boolean(jeton);

  return (
    <html lang="fr" suppressHydrationWarning>
      <body>
        <a href="#main-content" className="skip-link">
          Aller au contenu principal
        </a>
        <div className="app-shell">
          <Sidebar
            estConnecte={estConnecte}
            roleUtilisateur={roleUtilisateur}
            estAdmin={estAdmin}
            estComplexe={estComplexe}
          />
          <div className="main-wrapper">
            <header className="topbar">
              <span className="topbar-title">
                {estConnecte ? `Connecté · ${roleUtilisateur}` : "Plateforme urbaine connectée"}
              </span>
              <ThemeToggle />
            </header>
            <main id="main-content" className="main-content">
              {children}
            </main>
            <footer className="site-footer">
              <small>UrbanPulse • Expérience web intelligente et responsive</small>
            </footer>
          </div>
        </div>
      </body>
    </html>
  );
}
