"use client";

import { useEffect, useState } from "react";
import { PageBlock } from "@/components/page-block";
import { SimpleTable } from "@/components/simple-table";
import { fetchPublicSearch } from "@/lib/backend-api";
import { publicSearchExamples } from "@/lib/mock-data";

const QUARTIERS = ["Cergy Préfecture", "Cergy Saint-Christophe", "Cergy le Haut"] as const;
const TYPES = ["Administration", "Art public", "Cinéma", "Commerce", "Enseignement", "Événement local", "Lieu d'intérêt", "Sport", "Transport"] as const;

type PublicRow = {
  title: string;
  info_type: string;
  city: string;
};

export default function SearchPage() {
  const [motCle, setMotCle] = useState("");
  const [quartier, setQuartier] = useState<string>("Cergy le Haut");
  const [typeFiltre, setTypeFiltre] = useState<string>("");
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [lignes, setLignes] = useState<PublicRow[]>([]);

  async function lancerRecherche() {
    setErreur(null);
    setChargement(true);
    try {
      const resultat = await fetchPublicSearch({
        query: motCle.trim() || undefined,
        city: quartier || undefined,
        type: typeFiltre || undefined,
      });
      setLignes(resultat.items);
    } catch {
      setLignes(
        publicSearchExamples.map((exemple) => ({
          title: exemple.nom,
          info_type: exemple.type,
          city: exemple.ville,
          status: exemple.statut,
        }))
      );
      setErreur("Le backend est temporairement indisponible. Affichage d'exemples locaux.");
    } finally {
      setChargement(false);
    }
  }

  useEffect(() => {
    lancerRecherche();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <PageBlock title="Recherche" description="Explorer Cergy">
      <div className="card">
        <h3>Filtres de recherche</h3>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            lancerRecherche();
          }}
        >
          <div className="form-grid-two">
            <label>
              Mot-clé
              <input
                value={motCle}
                onChange={(e) => setMotCle(e.target.value)}
                placeholder="Parc, cinéma, université..."
              />
            </label>
            <label>
              Quartier
              <select value={quartier} onChange={(e) => setQuartier(e.target.value)}>
                <option value="">-- Tous les quartiers --</option>
                {QUARTIERS.map((q) => (
                  <option key={q} value={q}>{q}</option>
                ))}
              </select>
            </label>
            <label>
              Type
              <select value={typeFiltre} onChange={(e) => setTypeFiltre(e.target.value)}>
                <option value="">-- Tous les types --</option>
                {TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </label>
          </div>
          <button type="submit" disabled={chargement}>
            {chargement ? "Recherche en cours..." : "Lancer la recherche"}
          </button>
        </form>
        {erreur ? <p role="alert">Erreur : {erreur}</p> : null}
      </div>

      <SimpleTable
        caption="Résultats de recherche publics"
        columns={[
          { key: "title", label: "Nom" },
          { key: "type", label: "Type" },
          { key: "city", label: "Quartier" },
        ]}
        rows={lignes.map((ligne) => ({
          title: ligne.title,
          type: ligne.info_type,
          city: ligne.city,
        }))}
      />
    </PageBlock>
  );
}
