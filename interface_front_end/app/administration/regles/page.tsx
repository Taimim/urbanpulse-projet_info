import { PageBlock } from "@/components/page-block";
import { fetchAdminRules } from "@/lib/backend-api";
import { RuleForms } from "@/components/action-forms";

export const dynamic = "force-dynamic";

export default async function AdminRulesPage() {
  const { rules } = await fetchAdminRules();
  return (
    <PageBlock title="Admin • Règles" description="Ajoutez et gérez les règles de fonctionnement de la plateforme.">
      <RuleForms rules={rules} />
    </PageBlock>
  );
}
