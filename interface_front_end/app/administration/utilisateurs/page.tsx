import { PageBlock } from "@/components/page-block";
import { fetchAdminUsers } from "@/lib/backend-api";
import { UserManagementForms } from "@/components/action-forms";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const { users } = await fetchAdminUsers();
  return (
    <PageBlock title="Admin • Utilisateurs" description="Gérez les comptes et les rôles utilisateurs.">
      <UserManagementForms users={users} />
    </PageBlock>
  );
}
