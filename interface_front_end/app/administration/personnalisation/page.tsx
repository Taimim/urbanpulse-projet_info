import { PageBlock } from "@/components/page-block";
import { PersonnalisationForms } from "@/components/action-forms";

export const dynamic = "force-dynamic";

export default function AdminCustomizationPage() {
  return (
    <PageBlock
      title="Admin • Personnalisation"
      description="Personnalisez la couleur et la langue du site."
    >
      <PersonnalisationForms />
    </PageBlock>
  );
}
