import { PageBlock } from "@/components/page-block";
import { SimpleTable } from "@/components/simple-table";
import { fetchAdminLogs, fetchAdminSummary } from "@/lib/backend-api";
import { AdminActions } from "@/components/action-forms";

export const dynamic = "force-dynamic";

function formaterDate(iso: string): string {
  try {
    const d = new Date(iso);
    const date = d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
    const heure = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    return `${date} à ${heure}`;
  } catch {
    return iso;
  }
}

export default async function AdminReportsPage() {
  const [{ logs }, donneesSynthese] = await Promise.all([fetchAdminLogs(), fetchAdminSummary()]);

  const lignesSynthese = [
    { metric: "Utilisateurs", value: String(donneesSynthese.summary.users_count) },
    { metric: "Objets", value: String(donneesSynthese.summary.objects_count) },
    { metric: "Services", value: String(donneesSynthese.summary.services_count) },
    { metric: "Consommation totale", value: `${donneesSynthese.summary.total_energy} kWh` },
    { metric: "Connexions", value: String(donneesSynthese.summary.total_logins) },
  ];

  const dernieresConnexions: Record<string, string> = {};
  for (const log of logs) {
    if (log.action_type === "connexion") {
      const login = String(log.login);
      const date = String(log.created_at);
      if (!dernieresConnexions[login] || date > dernieresConnexions[login]) {
        dernieresConnexions[login] = date;
      }
    }
  }
  const lignesHistorique = Object.entries(dernieresConnexions)
    .sort(([, a], [, b]) => b.localeCompare(a))
    .map(([login, date]) => ({ utilisateur: login, derniere_connexion: formaterDate(date) }));

  return (
    <PageBlock
      title="Admin • Rapports"
      description="Historique de connexions et pilotage des exports admin."
    >
      <AdminActions />
      <SimpleTable
        caption="Synthèse globale"
        columns={[
          { key: "metric", label: "Indicateur" },
          { key: "value", label: "Valeur" },
        ]}
        rows={lignesSynthese}
      />
      <SimpleTable
        caption="Historique de connexions"
        columns={[
          { key: "utilisateur", label: "Utilisateur" },
          { key: "derniere_connexion", label: "Dernière connexion" },
        ]}
        rows={lignesHistorique}
      />
    </PageBlock>
  );
}
