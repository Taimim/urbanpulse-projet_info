"use client";

import Link from "next/link";

type AdminErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function AdminError({ error, reset }: AdminErrorProps) {
  const messageErreur = String(error?.message ?? "Erreur inconnue");
  const accesInterdit = messageErreur.includes("Accès refusé");
  const nonAuthentifie = messageErreur.includes("Authentification requise");

  return (
    <section className="page" aria-labelledby="admin-error-title">
      <header>
        <h2 id="admin-error-title">Administration indisponible</h2>
        <p>
          {accesInterdit
            ? "Vous êtes connecté, mais ce compte n'a pas les droits administrateur."
            : nonAuthentifie
              ? "Votre session a expiré ou vous n'êtes pas connecté."
              : "Une erreur est survenue lors du chargement du module administration."}
        </p>
      </header>

      <div className="card" style={{ display: "grid", gap: "0.75rem" }}>
        <p style={{ margin: 0 }}>
          Détail: <strong>{messageErreur}</strong>
        </p>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button type="button" onClick={reset}>
            Réessayer
          </button>
          <Link className="nav-link" href="/authentification">
            Aller à la connexion
          </Link>
        </div>
      </div>
    </section>
  );
}
