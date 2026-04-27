import { PageBlock } from "@/components/page-block";
import Link from "next/link";
import Image from "next/image";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

export const dynamic = "force-dynamic";

function getLiveStats() {
  try {
    const dbPath = path.resolve(process.cwd(), "..", "arriere-plan_back_end", "backend.db");
    const db = new DatabaseSync(dbPath);
    const membres = (db.prepare("SELECT COUNT(*) as n FROM users WHERE is_validated=1").get() as { n: number }).n;
    const objets = (db.prepare("SELECT COUNT(*) as n FROM objects").get() as { n: number }).n;
    const services = (db.prepare("SELECT COUNT(*) as n FROM services WHERE status='Actif'").get() as { n: number }).n;
    db.close();
    return { membres, objets, services };
  } catch {
    return { membres: 0, objets: 0, services: 0 };
  }
}

export default async function HomePage() {
  const stats = getLiveStats();

  return (
    <PageBlock
      title="Bienvenue sur UrbanPulse"
      description="Plateforme intelligente en collaboration avec la ville de Cergy pour visualiser les services urbains, suivre les objets connectés et simplifier la vie des habitants."
    >
      <section className="hero-card" aria-label="Présentation de la plateforme UrbanPulse">
        <div>
          <h3>Ville connectée, services unifiés</h3>
          <p>
            Avec UrbanPulse, retrouvez les informations publiques, les objets connectés et les services de votre quartier réunis dans une interface claire et intuitive.
          </p>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <Link className="nav-link" href="/recherche">
              Découvrir Cergy
            </Link>
          </div>
        </div>
        <Image
          src="/cergy-accueil.jpeg"
          alt="Vue du centre-ville de Cergy"
          width={560}
          height={340}
          className="hero-image"
          unoptimized
          loading="lazy"
        />
      </section>

      <div className="card-grid" role="list" aria-label="Indicateurs clés">
        <article className="card" role="listitem">
          <h3>Membres actifs</h3>
          <p className="badge">{stats.membres}</p>
        </article>
        <article className="card" role="listitem">
          <h3>Objets connectés</h3>
          <p className="badge">{stats.objets}</p>
        </article>
        <article className="card" role="listitem">
          <h3>Services actifs</h3>
          <p className="badge">{stats.services}</p>
        </article>
      </div>

      <section aria-label="Actualités de la ville">
        <h3 style={{ marginBottom: "0.75rem" }}>Actualités &amp; Événements</h3>
        <div className="card-grid">
          <article className="card">
            <p style={{ fontSize: "0.75rem", color: "var(--color-muted)", marginBottom: "0.25rem" }}>📅 12 mai 2026 · Événement</p>
            <h4 style={{ margin: "0 0 0.4rem" }}>Fête de quartier — Saint-Christophe</h4>
            <p style={{ fontSize: "0.875rem" }}>Grande fête de quartier place des Arts avec animations, concerts et marché artisanal. Entrée libre pour tous les habitants.</p>
          </article>
          <article className="card">
            <p style={{ fontSize: "0.75rem", color: "var(--color-muted)", marginBottom: "0.25rem" }}>📅 18 mai 2026 · Travaux</p>
            <h4 style={{ margin: "0 0 0.4rem" }}>Rénovation de l&apos;Axe Majeur</h4>
            <p style={{ fontSize: "0.875rem" }}>Travaux de réfection des allées piétonnes entre les 12 Colonnes et la Tour Belvédère. Circulation perturbée jusqu&apos;au 2 juin.</p>
          </article>
          <article className="card">
            <p style={{ fontSize: "0.75rem", color: "var(--color-muted)", marginBottom: "0.25rem" }}>📅 25 mai 2026 · Sport</p>
            <h4 style={{ margin: "0 0 0.4rem" }}>Course solidaire de Cergy</h4>
            <p style={{ fontSize: "0.875rem" }}>5 km et 10 km ouverts à tous autour du lac de la Base de Loisirs. Inscriptions en mairie ou en ligne jusqu&apos;au 20 mai.</p>
          </article>
          <article className="card">
            <p style={{ fontSize: "0.75rem", color: "var(--color-muted)", marginBottom: "0.25rem" }}>📅 1 juin 2026 · Environnement</p>
            <h4 style={{ margin: "0 0 0.4rem" }}>Journée nettoyage des berges de l&apos;Oise</h4>
            <p style={{ fontSize: "0.875rem" }}>La ville organise une collecte citoyenne des déchets le long des berges. Matériel fourni, rendez-vous à 9h au parc de l&apos;Herbe.</p>
          </article>
          <article className="card">
            <p style={{ fontSize: "0.75rem", color: "var(--color-muted)", marginBottom: "0.25rem" }}>📅 7 juin 2026 · Culture</p>
            <h4 style={{ margin: "0 0 0.4rem" }}>Nuit des musées à Cergy</h4>
            <p style={{ fontSize: "0.875rem" }}>Ouverture nocturne gratuite des espaces culturels de Cergy-Pontoise avec visites guidées, performances et expositions temporaires.</p>
          </article>
        </div>
      </section>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "1rem 1.25rem 0.75rem" }}>
          <h3 style={{ margin: 0 }}>Explorer Cergy</h3>
          <p style={{ margin: "0.25rem 0 0", fontSize: "0.875rem", color: "var(--color-muted)" }}>
            Naviguez sur la carte interactive de la ville de Cergy-Pontoise.
          </p>
        </div>
        <iframe
          title="Carte interactive de Cergy"
          src="https://www.openstreetmap.org/export/embed.html?bbox=1.9200%2C49.0100%2C2.1200%2C49.0750&layer=mapnik&marker=49.0359%2C2.0678"
          style={{ width: "100%", height: "450px", border: "none", display: "block" }}
          loading="lazy"
          allowFullScreen
        />
        <div style={{ padding: "0.5rem 1.25rem", borderTop: "1px solid var(--color-border)" }}>
          <a
            href="https://www.openstreetmap.org/?mlat=49.0359&mlon=2.0678#map=13/49.0359/2.0678"
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: "0.8rem", color: "var(--color-muted)" }}
          >
            Ouvrir en plein écran sur OpenStreetMap ↗
          </a>
        </div>
      </div>
    </PageBlock>
  );
}
