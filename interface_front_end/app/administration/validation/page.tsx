import { PageBlock } from "@/components/page-block";
import { PendingValidationForms } from "@/components/action-forms";
import { fetchAdminPendingValidations } from "@/lib/backend-api";

export const dynamic = "force-dynamic";

export default async function AdminValidationPage() {
  const { pending } = await fetchAdminPendingValidations();

  return (
    <PageBlock
      title="Admin • Validation"
      description="Validation des inscriptions en attente pour contrôler l'accès à la plateforme."
    >
      <PendingValidationForms pending={pending} />
    </PageBlock>
  );
}
