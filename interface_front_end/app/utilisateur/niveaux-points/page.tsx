import { PageBlock } from "@/components/page-block";
import { SimpleTable } from "@/components/simple-table";
import { fetchLevels } from "@/lib/backend-api";
import { UserLevelActions } from "@/components/action-forms";
import { levelProgress, levelRules, userTracking } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

export default async function UserLevelsPointsPage() {
  const { current, next } = await fetchLevels();
  const suiviDynamique = [
    { metric: "Nombre d'accès", value: String(current.access_count) },
    { metric: "Nombre d'actions", value: String(current.actions_count) },
    { metric: "Rôle actuel", value: `${current.role} (${current.level})` },
    { metric: "Points", value: String(current.points) },
  ];
  return (
    <PageBlock
      title="Niveaux & Points"
      description="Suivi des niveaux et points calculés dynamiquement par le backend."
    >
      <SimpleTable
        caption="Niveaux et points"
        columns={[
          { key: "level", label: "Niveau" },
          { key: "points", label: "Plage de points" }
        ]}
        rows={levelProgress.map((level) => ({
          level: level.level,
          points: level.points
        }))}
      />
      <SimpleTable
        caption="Règles de points"
        columns={[
          { key: "action", label: "Action" },
          { key: "points", label: "Points" }
        ]}
        rows={levelRules.map((rule) => ({
          action: rule.action,
          points: rule.points
        }))}
      />
      <SimpleTable
        caption="Suivi utilisateur"
        columns={[
          { key: "metric", label: "Indicateur" },
          { key: "value", label: "Valeur" }
        ]}
        rows={[...suiviDynamique, ...userTracking].map((indicateur) => ({
          metric: indicateur.metric,
          value: indicateur.value
        }))}
      />
      <UserLevelActions
        niveauActuel={String(current.level)}
        points={Number(current.points)}
        prochainNiveau={next?.level ?? null}
        pointsRequisProchainNiveau={next?.required_points ?? null}
      />
    </PageBlock>
  );
}
