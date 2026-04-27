"use client";

import { Fragment, useState } from "react";
import { useRouter } from "next/navigation";
import { addObject, updateObject, toggleObject, requestDeleteObject, updateServiceConfiguration } from "@/lib/backend-api";
import { BoiteMessage, exigerJetonSession } from "./auth-profile";

type MessageRetour = { type: "success" | "error"; text: string } | null;

const btnSecondaire: React.CSSProperties = {
  fontSize: "0.78rem",
  padding: "0.25rem 0.6rem",
  background: "var(--color-bg-subtle)",
  color: "var(--color-text)",
  border: "1px solid var(--color-border)",
  fontWeight: 500,
};

export const ZONES_CERGY = [
  "Préfecture de Cergy",
  "Gare de Cergy-le-Haut",
  "Université CY Cergy Paris",
  "Axe Majeur de Cergy",
  "Centre commercial des 3 Fontaines",
  "Quartier Saint-Christophe",
  "Résidence Les Hauts de Cergy",
  "Base de Loisirs",
];

// ── ObjectManagementForms ──────────────────────────────────────────────────

type ObjetGestion = {
  id: number;
  name: string;
  description?: string;
  object_type?: string;
  status: string;
  zone?: string;
  energy_kwh?: number;
  temperature_target?: number | null;
  mode?: string | null;
};

export function ObjectManagementForms({ objects: objets, lectureSeule = false }: { objects: ObjetGestion[]; lectureSeule?: boolean }) {
  const router = useRouter();
  const [messageRetour, setMessageRetour] = useState<MessageRetour>(null);
  const [afficherFormulaireAjout, setAfficherFormulaireAjout] = useState(false);
  const [idConfiguration, setIdConfiguration] = useState<number | null>(null);
  const [config, setConfig] = useState({ mode: "Automatique" });
  const [idSuppressionModal, setIdSuppressionModal] = useState<number | null>(null);
  const [raisonsSupp, setRaisonsSupp] = useState<Record<number, string>>({});
  const [nouvelObjet, setNouvelObjet] = useState({ name: "", description: "", brand: "", status: "Actif", zone: ZONES_CERGY[0], energy_kwh: 0 });

  function ouvrirConfiguration(objet: ObjetGestion) {
    setIdConfiguration(objet.id);
    setConfig({ mode: String(objet.mode ?? "Automatique") });
  }

  async function gererAjoutObjet(e: React.FormEvent) {
    e.preventDefault();
    setMessageRetour(null);
    try {
      const jeton = exigerJetonSession();
      await addObject(jeton, { ...nouvelObjet, unique_id: `OBJ-${Date.now()}`, object_type: "autre" } as Parameters<typeof addObject>[1]);
      setMessageRetour({ type: "success", text: "Objet ajouté avec succès !" });
      setAfficherFormulaireAjout(false);
      setNouvelObjet({ name: "", description: "", brand: "", status: "Actif", zone: ZONES_CERGY[0], energy_kwh: 0 });
      router.refresh();
    } catch (err) {
      setMessageRetour({ type: "error", text: String(err) });
    }
  }

  async function gererBasculeEtat(id: number) {
    setMessageRetour(null);
    try {
      const jeton = exigerJetonSession();
      const resultat = await toggleObject(jeton, id);
      setMessageRetour({ type: "success", text: `État changé : ${resultat.status}` });
      router.refresh();
    } catch (err) {
      setMessageRetour({ type: "error", text: String(err) });
    }
  }

  async function gererConfiguration(e: React.FormEvent, id: number) {
    e.preventDefault();
    setMessageRetour(null);
    try {
      const jeton = exigerJetonSession();
      await updateObject(jeton, id, { mode: config.mode });
      setMessageRetour({ type: "success", text: "Mode mis à jour." });
      setIdConfiguration(null);
      router.refresh();
    } catch (err) {
      setMessageRetour({ type: "error", text: String(err) });
    }
  }

  async function gererDemandeSuppression(id: number) {
    const raison = (raisonsSupp[id] ?? "").trim() || "Demande de suppression.";
    setMessageRetour(null);
    try {
      const jeton = exigerJetonSession();
      await requestDeleteObject(jeton, id, raison);
      setMessageRetour({ type: "success", text: "Demande envoyée à l'administrateur." });
    } catch (err) {
      setMessageRetour({ type: "error", text: String(err) });
    }
  }

  const MODES = ["Automatique", "Manuel", "Eco", "Nuit", "Surveillance continue"];

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h3 style={{ margin: 0 }}>Objets connectés</h3>
        {!lectureSeule && (
          <button onClick={() => setAfficherFormulaireAjout(!afficherFormulaireAjout)}>
            {afficherFormulaireAjout ? "Annuler" : "+ Ajouter un objet"}
          </button>
        )}
      </div>
      <BoiteMessage message={messageRetour} />
      {afficherFormulaireAjout && (
        <form onSubmit={gererAjoutObjet} style={{ padding: "1rem", background: "var(--color-bg-subtle)", borderRadius: "0.5rem", marginBottom: "1rem" }}>
          <h4 style={{ marginTop: 0 }}>Nouvel objet connecté</h4>
          <div className="form-grid-two">
            <label>Nom :<input type="text" value={nouvelObjet.name} onChange={(e) => setNouvelObjet({ ...nouvelObjet, name: e.target.value })} required placeholder="Capteur Air Préfecture" /></label>
            <label>Description :<input type="text" value={nouvelObjet.description} onChange={(e) => setNouvelObjet({ ...nouvelObjet, description: e.target.value })} required placeholder="Capteur qualité de l'air" /></label>
            <label>Marque :<input type="text" value={nouvelObjet.brand} onChange={(e) => setNouvelObjet({ ...nouvelObjet, brand: e.target.value })} required placeholder="Bosch, Siemens, Axis..." /></label>
            <label>Zone :
              <select value={nouvelObjet.zone} onChange={(e) => setNouvelObjet({ ...nouvelObjet, zone: e.target.value })}>
                {ZONES_CERGY.map((z) => <option key={z}>{z}</option>)}
              </select>
            </label>
            <label>Énergie (kWh) :<input type="number" step="0.1" value={nouvelObjet.energy_kwh} onChange={(e) => setNouvelObjet({ ...nouvelObjet, energy_kwh: parseFloat(e.target.value) || 0 })} /></label>
          </div>
          <button type="submit" style={{ marginTop: "1rem" }}>Créer l&apos;objet</button>
        </form>
      )}
      {objets.length === 0 ? (
        <p style={{ color: "var(--color-muted)" }}>Aucun objet connecté pour le moment.</p>
      ) : (
        <div className="table-scroll">
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Nom", "Zone", "État", "kWh", "Mode", ...(!lectureSeule ? ["Actions"] : [])].map((col) => (
                  <th key={col} scope="col" style={{ textAlign: "left", padding: "0.5rem 0.75rem", borderBottom: "2px solid var(--color-border)", whiteSpace: "nowrap" }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {objets.map((objet) => (
                <Fragment key={objet.id}>
                  <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                    <td style={{ padding: "0.6rem 0.75rem", fontWeight: 500 }}>{objet.name}</td>
                    <td style={{ padding: "0.6rem 0.75rem" }}>{objet.zone ?? "—"}</td>
                    <td style={{ padding: "0.6rem 0.75rem" }}>
                      <span style={{ display: "inline-block", padding: "0.15rem 0.55rem", borderRadius: "999px", fontSize: "0.78rem", fontWeight: 500, background: objet.status === "Actif" ? "var(--color-accent-soft)" : "var(--color-bg-subtle)", color: "var(--color-muted)", border: "1px solid var(--color-border)" }}>
                        {objet.status}
                      </span>
                    </td>
                    <td style={{ padding: "0.6rem 0.75rem" }}>{objet.energy_kwh ?? "—"}</td>
                    <td style={{ padding: "0.6rem 0.75rem", color: "var(--color-muted)" }}>{objet.mode ?? "—"}</td>
                    {!lectureSeule && (
                      <td style={{ padding: "0.6rem 0.75rem" }}>
                        <div className="btn-action-group">
                          <button onClick={() => gererBasculeEtat(objet.id)} aria-label={objet.status === "Actif" ? `Désactiver ${objet.name}` : `Activer ${objet.name}`} style={btnSecondaire}>{objet.status === "Actif" ? "Désactiver" : "Activer"}</button>
                          <button onClick={() => idConfiguration === objet.id ? setIdConfiguration(null) : ouvrirConfiguration(objet)} aria-label={`Configurer ${objet.name}`} style={btnSecondaire}>{idConfiguration === objet.id ? "Fermer" : "Configurer"}</button>
                          <button onClick={() => setIdSuppressionModal(idSuppressionModal === objet.id ? null : objet.id)} aria-label={`Demander la suppression de ${objet.name}`} style={btnSecondaire}>{idSuppressionModal === objet.id ? "Annuler" : "Demander suppression"}</button>
                        </div>
                      </td>
                    )}
                  </tr>
                  {idConfiguration === objet.id && (
                    <tr key={`config-${objet.id}`}>
                      <td colSpan={6} style={{ padding: "0.75rem 1rem", background: "var(--color-bg-subtle)", borderBottom: "1px solid var(--color-border)" }}>
                        <form onSubmit={(e) => gererConfiguration(e, objet.id)}>
                          <strong style={{ display: "block", marginBottom: "0.5rem" }}>Mode — {objet.name}</strong>
                          <div style={{ display: "flex", gap: "1rem", alignItems: "flex-end" }}>
                            <label>Mode :<select value={config.mode} onChange={(e) => setConfig({ mode: e.target.value })}>{MODES.map((m) => <option key={m}>{m}</option>)}</select></label>
                            <button type="submit" style={{ alignSelf: "flex-end" }}>Enregistrer</button>
                          </div>
                        </form>
                      </td>
                    </tr>
                  )}
                  {idSuppressionModal === objet.id && (
                    <tr key={`supp-${objet.id}`}>
                      <td colSpan={6} style={{ padding: "0.75rem 1rem", background: "var(--color-bg-subtle)", borderBottom: "1px solid var(--color-border)" }}>
                        <strong style={{ display: "block", marginBottom: "0.5rem" }}>Demande de suppression — {objet.name}</strong>
                        <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-end" }}>
                          <label style={{ flex: 1, marginBottom: 0 }}>Raison :<input type="text" value={raisonsSupp[objet.id] ?? ""} onChange={(e) => setRaisonsSupp({ ...raisonsSupp, [objet.id]: e.target.value })} placeholder="Panne, maintenance..." autoFocus /></label>
                          <button onClick={() => { gererDemandeSuppression(objet.id); setIdSuppressionModal(null); }} style={{ alignSelf: "flex-end" }}>Confirmer</button>
                          <button onClick={() => setIdSuppressionModal(null)} style={{ ...btnSecondaire, alignSelf: "flex-end" }}>Annuler</button>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── ServiceConfigurationsTable ─────────────────────────────────────────────

export function ServiceConfigurationsTable({
  configurations,
  lectureSeule = false,
}: {
  configurations: Array<{ id: number; zone: string; object_name: string | null; service_name: string | null; reglage: string }>;
  lectureSeule?: boolean;
}) {
  const router = useRouter();
  const [messageRetour, setMessageRetour] = useState<MessageRetour>(null);
  const [idEdition, setIdEdition] = useState<number | null>(null);
  const [reglageEdit, setReglageEdit] = useState("");

  async function sauvegarder(e: React.FormEvent, id: number) {
    e.preventDefault();
    setMessageRetour(null);
    try {
      const jeton = exigerJetonSession();
      await updateServiceConfiguration(jeton, id, reglageEdit);
      setMessageRetour({ type: "success", text: "Réglage mis à jour." });
      setIdEdition(null);
      router.refresh();
    } catch (err) {
      setMessageRetour({ type: "error", text: String(err) });
    }
  }

  return (
    <div className="card">
      <h3>Configuration des services</h3>
      <BoiteMessage message={messageRetour} />
      <div className="table-scroll">
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["Zone", "Objet associé", "Service", "Réglage actuel", ...(!lectureSeule ? ["Action"] : [])].map((col) => (
                <th key={col} scope="col" style={{ textAlign: "left", padding: "0.5rem 0.75rem", borderBottom: "2px solid var(--color-border)", whiteSpace: "nowrap" }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {configurations.map((config) => (
              <Fragment key={config.id}>
                <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                  <td style={{ padding: "0.6rem 0.75rem", fontWeight: 500 }}>{config.zone}</td>
                  <td style={{ padding: "0.6rem 0.75rem", color: "var(--color-muted)" }}>{config.object_name ?? "—"}</td>
                  <td style={{ padding: "0.6rem 0.75rem" }}>{config.service_name ?? "—"}</td>
                  <td style={{ padding: "0.6rem 0.75rem" }}>{config.reglage}</td>
                  {!lectureSeule && (
                    <td style={{ padding: "0.6rem 0.75rem" }}>
                      <button onClick={() => { if (idEdition === config.id) { setIdEdition(null); } else { setIdEdition(config.id); setReglageEdit(config.reglage); } }} style={btnSecondaire}>
                        {idEdition === config.id ? "Annuler" : "Modifier"}
                      </button>
                    </td>
                  )}
                </tr>
                {idEdition === config.id && (
                  <tr key={`edit-${config.id}`}>
                    <td colSpan={5} style={{ padding: "0.75rem 1rem", background: "var(--color-bg-subtle)", borderBottom: "1px solid var(--color-border)" }}>
                      <form onSubmit={(e) => sauvegarder(e, config.id)} style={{ display: "flex", gap: "0.75rem", alignItems: "flex-end" }}>
                        <label style={{ flex: 1, marginBottom: 0 }}>Nouveau réglage :<input type="text" value={reglageEdit} onChange={(e) => setReglageEdit(e.target.value)} required autoFocus /></label>
                        <button type="submit" style={{ alignSelf: "flex-end" }}>Enregistrer</button>
                      </form>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
