import { PageBlock } from "@/components/page-block";
import { AuthForms } from "@/components/action-forms";

export default function AuthPage() {
  return (
    <PageBlock
      title="S'inscrire / Se connecter"
      description="Accédez à la plateforme UrbanPulse avec votre compte membre."
    >
      <AuthForms />
    </PageBlock>
  );
}
