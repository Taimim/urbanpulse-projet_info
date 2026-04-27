"use client";

import { useState } from "react";
import { PageBlock } from "@/components/page-block";
import { fetchObjects, fetchServices, recordConsultation } from "@/lib/backend-api";

type ObjectRow = Record<string, string | number>;
type ServiceRow = { name: string; description: string; status: string; category_name: string };

export default function UserItemsServicesPage() {
  const [motCleObjet, setMotCleObjet] = useState("Thermostat");
  const [marqueObjet, setMarqueObjet] = useState("Philips");
  const [typeObjet, setTypeObjet] = useState("");
  const [etatObjet, setEtatObjet] = useState("Actif");
  const [motCleService, setMotCleService] = useState("parking");
  const [statutService, setStatutService] = useState("Actif");
  const [objetsTrouves, setObjetsTrouves] = useState<ObjectRow[]>([]);
  const [servicesTrouves, setServicesTrouves] = useState<ServiceRow[]>([]);
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);

  async function rechercherTout() {
    setErreur(null);
    setChargement(true);
    try {
      const [{ items: objets }, { items: services }] = await Promise.all([
        fetchObjects({
          query: motCleObjet || undefined,
          brand: marqueObjet || undefined,
          type: typeObjet || undefined,
          status: etatObjet || undefined,
        }),
        fetchServices({
          query: motCleService || undefined,
          status: statutService || undefined,
        }),
      ]);
      setObjetsTrouves(objets);
      setServicesTrouves(services);
    } catch (erreurCapturee) {
      setObjetsTrouves([]);
      setServicesTrouves([]);
      setErreur(erreurCapturee instanceof Error ? erreurCapturee.message : String(erreurCapturee));
    } finally {
      setChargement(false);
    }
  }

  async function consulterObjet(objet: ObjectRow) {
    const jeton = sessionStorage.getItem("auth_token");
    if (!jeton) return;
    await recordConsultation(jeton, "objet", String(objet.unique_id ?? objet.id ?? "n/a"));
  }

  async function consulterService(service: ServiceRow) {
    const jeton = sessionStorage.getItem("auth_token");
    if (!jeton) return;
    await recordConsultation(jeton, "service", `${service.name}:${service.category_name}`);
  }

  return (
    <PageBlock
      title="Objets & Services"
      description="Recherche et consultation d'objets/services avec attributs connectivité, énergie, capteurs et usage."
    >
      <div className="card">
        <h3>Recherche d&apos;objets connectés (2 filtres minimum)</h3>
        <div className="form-grid-two">
          <label>
            Mot-clé
            <input value={motCleObjet} onChange={(e) => setMotCleObjet(e.target.value)} placeholder="Thermostat Salon" />
          </label>
          <label>
            Marque
            <input value={marqueObjet} onChange={(e) => setMarqueObjet(e.target.value)} placeholder="Philips" />
          </label>
          <label>
            Type
            <input value={typeObjet} onChange={(e) => setTypeObjet(e.target.value)} placeholder="thermostat, camera..." />
          </label>
          <label>
            État
            <input value={etatObjet} onChange={(e) => setEtatObjet(e.target.value)} placeholder="Actif" />
          </label>
        </div>
        <h3 style={{ marginTop: "1rem" }}>Recherche de services (2 filtres minimum)</h3>
        <div className="form-grid-two">
          <label>
            Mot-clé service
            <input value={motCleService} onChange={(e) => setMotCleService(e.target.value)} placeholder="parking" />
          </label>
          <label>
            Statut service
            <input value={statutService} onChange={(e) => setStatutService(e.target.value)} placeholder="Actif" />
          </label>
        </div>
        <button onClick={rechercherTout} disabled={chargement} style={{ marginTop: "1rem" }}>
          {chargement ? "Recherche..." : "Rechercher"}
        </button>
        {erreur ? <p role="alert">Erreur : {erreur}</p> : null}
      </div>

      <div className="card">
        <h3>Objets trouvés</h3>
        {objetsTrouves.length === 0 ? (
          <p>Aucun objet.</p>
        ) : (
          <div className="card-grid">
            {objetsTrouves.map((objet) => (
              <article className="card" key={String(objet.unique_id ?? objet.id)} onClick={() => consulterObjet(objet)}>
                <p><strong>ID unique :</strong> {String(objet.unique_id ?? "")}</p>
                <p><strong>Nom :</strong> {String(objet.name ?? "")}</p>
                <p><strong>Température actuelle :</strong> {String(objet.temperature_current ?? "N/A")}°C</p>
                <p><strong>Température cible :</strong> {String(objet.temperature_target ?? "N/A")}°C</p>
                <p><strong>Usage / mode :</strong> {String(objet.mode ?? "N/A")}</p>
                <p><strong>Connectivité :</strong> {String(objet.connectivity ?? "N/A")}</p>
                <p><strong>Énergie :</strong> {String(objet.battery_state ?? "N/A")} • {String(objet.energy_kwh ?? "0")} kWh</p>
                <p><strong>Dernière interaction :</strong> {String(objet.last_interaction ?? "N/A")}</p>
              </article>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <h3>Services trouvés</h3>
        {servicesTrouves.length === 0 ? (
          <p>Aucun service.</p>
        ) : (
          <ul>
            {servicesTrouves.map((service) => (
              <li key={`${service.name}-${service.category_name}`} onClick={() => consulterService(service)}>
                <strong>{service.name}</strong> ({service.category_name}) - {service.status} - {service.description}
              </li>
            ))}
          </ul>
        )}
      </div>
    </PageBlock>
  );
}
