import { PageBlock } from "@/components/page-block";
import { SimpleTable } from "@/components/simple-table";
import { fetchManagementReports } from "@/lib/backend-api";

export const dynamic = "force-dynamic";

export default async function ManagementReportsPage() {
  const rapports = await fetchManagementReports();
  const lignesRapportsGestion = [
    {
      report: "Synthèse objets",
      date: new Date().toISOString().slice(0, 10),
      status: "Publié",
    },
    {
      report: "Demandes suppression",
      date: new Date().toISOString().slice(0, 10),
      status: rapports.deletion_requests.length > 0 ? "Publié" : "Aucun",
    },
  ];
  const lignesSurveillance = [
    { indicateur: "Nombre objets", valeur: String(rapports.stats.total_objects), tendance: "-" },
    { indicateur: "Énergie totale", valeur: `${rapports.stats.total_energy ?? 0} kWh`, tendance: "-" },
    { indicateur: "Énergie moyenne", valeur: `${rapports.stats.avg_energy ?? 0} kWh`, tendance: "-" },
    { indicateur: "Objets inefficaces", valeur: String(rapports.inefficient_objects.length), tendance: "-" },
  ];
  const lignesObjetsInefficaces = rapports.inefficient_objects.map((objet) => ({
    id: String(objet.id),
    name: objet.name,
    energy_kwh: `${objet.energy_kwh} kWh`,
  }));
  const lignesHistorique = rapports.object_history.map((ligne) => ({
    created_at: ligne.created_at,
    action_type: ligne.action_type,
    details: ligne.details,
  }));
  return (
    <PageBlock
      title="Gestion • Rapports"
      description="Rapports de gestion calculés depuis les données des objets connectés."
    >
      <SimpleTable
        caption="Rapports de gestion"
        columns={[
          { key: "report", label: "Rapport" },
          { key: "date", label: "Date" },
          { key: "status", label: "Statut" }
        ]}
        rows={lignesRapportsGestion.map((rapport) => ({
          report: rapport.report,
          date: rapport.date,
          status: rapport.status
        }))}
      />
      <SimpleTable
        caption="Surveillance et optimisation"
        columns={[
          { key: "indicateur", label: "Indicateur" },
          { key: "valeur", label: "Valeur" },
          { key: "tendance", label: "Tendance" }
        ]}
        rows={lignesSurveillance.map((ligne) => ({
          indicateur: ligne.indicateur,
          valeur: ligne.valeur,
          tendance: ligne.tendance
        }))}
      />
      <SimpleTable
        caption="Objets à surveiller (inefficaces)"
        columns={[
          { key: "id", label: "ID" },
          { key: "name", label: "Objet" },
          { key: "energy_kwh", label: "Consommation" },
        ]}
        rows={lignesObjetsInefficaces}
      />
      <SimpleTable
        caption="Historique des actions sur objets connectés"
        columns={[
          { key: "created_at", label: "Date" },
          { key: "action_type", label: "Action" },
          { key: "details", label: "Détails" },
        ]}
        rows={lignesHistorique}
      />
    </PageBlock>
  );
}
