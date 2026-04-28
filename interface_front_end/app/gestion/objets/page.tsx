import { cookies } from "next/headers";
import { PageBlock } from "@/components/page-block";
import { fetchManagementObjects, fetchServiceConfigurations, fetchAdminServices, fetchAdminCategories } from "@/lib/backend-api";
import { ObjectManagementForms, ServiceConfigurationsTable, AdminServicesSection } from "@/components/action-forms";

export const dynamic = "force-dynamic";

export default async function ManagementItemsPage() {
  const cookieStore = await cookies();
  const role = cookieStore.get("user_role")?.value?.toLowerCase() ?? "";
  const estAdmin = role === "administrateur";
  const lectureSeule = !["complexe", "administrateur"].includes(role);

  const [{ items }, { configurations }, adminServices, adminCategories] = await Promise.all([
    fetchManagementObjects(),
    fetchServiceConfigurations(),
    estAdmin ? fetchAdminServices() : Promise.resolve({ services: [] }),
    estAdmin ? fetchAdminCategories() : Promise.resolve({ categories: [] }),
  ]);

  return (
    <PageBlock
      title="Objets connectés"
      description={lectureSeule ? "Consultez les objets connectés de Cergy." : "Gérez, configurez et supervisez les objets connectés."}
    >
      <ObjectManagementForms
        objects={items.map((objet) => ({
          id: objet.id,
          name: objet.name,
          description: objet.description,
          object_type: objet.object_type,
          status: objet.status,
          zone: objet.zone,
          energy_kwh: objet.energy_kwh,
          temperature_target: objet.temperature_target,
          mode: objet.mode,
        }))}
        lectureSeule={lectureSeule}
        suppressionDirecte={estAdmin}
      />
      <ServiceConfigurationsTable configurations={configurations} lectureSeule={lectureSeule} />
      {estAdmin && (
        <AdminServicesSection
          services={adminServices.services}
          categories={adminCategories.categories}
        />
      )}
    </PageBlock>
  );
}
