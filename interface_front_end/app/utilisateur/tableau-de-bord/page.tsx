import { PageBlock } from "@/components/page-block";
import { StatsGrid } from "@/components/stats-grid";
import { fetchLevels } from "@/lib/backend-api";

export const dynamic = "force-dynamic";

export default async function UserDashboardPage() {
  const { current } = await fetchLevels();
  const statistiquesTableauBord = [
    { label: "Nombre d'accès", value: String(current.access_count) },
    { label: "Niveau actuel", value: `${current.level}` },
    { label: "Solde de points", value: `${current.points} pts` },
  ];
  return (
    <PageBlock
      title="Tableau de bord utilisateur"
      description="Aperçu dynamique de l'activité et progression utilisateur."
    >
      <StatsGrid stats={statistiquesTableauBord} />
    </PageBlock>
  );
}
