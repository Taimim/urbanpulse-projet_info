import { PageBlock } from "@/components/page-block";
import { fetchAdminCategories, fetchAdminDeletionRequests } from "@/lib/backend-api";
import { CategoryForms } from "@/components/action-forms";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const [{ categories }, { requests }] = await Promise.all([
    fetchAdminCategories(),
    fetchAdminDeletionRequests(),
  ]);

  return (
    <PageBlock
      title="Admin • Catégories"
      description="Gérez les catégories et les demandes de suppression d'objets."
    >
      {requests.length > 0 && (
        <div className="card" style={{ borderLeft: "4px solid var(--color-accent)" }}>
          <h3 style={{ margin: "0 0 0.75rem" }}>
            Demandes de suppression en attente
            <span style={{ marginLeft: "0.5rem", background: "var(--color-accent)", color: "white", borderRadius: "999px", padding: "0.1rem 0.5rem", fontSize: "0.78rem", fontWeight: 700 }}>
              {requests.length}
            </span>
          </h3>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {requests.map((req) => (
              <li key={req.id} style={{ padding: "0.5rem 0.75rem", background: "var(--color-bg-subtle)", borderRadius: "0.375rem", fontSize: "0.875rem" }}>
                <strong>{req.requested_by_login ?? "?"}</strong> demande la suppression de l&apos;objet <strong>{req.object_name ?? `#${req.id}`}</strong>
                {req.reason ? ` — ${req.reason}` : ""}
              </li>
            ))}
          </ul>
        </div>
      )}
      <CategoryForms categories={categories} />
    </PageBlock>
  );
}
