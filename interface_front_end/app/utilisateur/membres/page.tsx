import { PageBlock } from "@/components/page-block";
import { fetchMembers } from "@/lib/backend-api";
import { GenderAvatar } from "@/components/gender-avatar";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function UserMembersPage() {
  const { members } = await fetchMembers();
  return (
    <PageBlock
      title="Membres"
      description="Profils publics des membres validés de la plateforme."
    >
      <div className="card-grid" role="list" aria-label="Liste des membres">
        {members.map((member) => (
          <article className="card" key={member.login} role="listitem">
            <Link href={`/utilisateur/membres/${encodeURIComponent(member.login)}`} style={{ textDecoration: "none", color: "inherit" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
                <GenderAvatar genre={member.genre} size={56} />
                <strong style={{ fontSize: "1rem" }}>{member.login}</strong>
              </div>
              <p><span style={{ color: "var(--color-muted)" }}>Type</span> — {member.member_type ?? "—"}</p>
              <p><span style={{ color: "var(--color-muted)" }}>Genre</span> — {member.genre ?? "—"}</p>
              <p><span style={{ color: "var(--color-muted)" }}>Âge</span> — {member.age != null ? `${member.age} ans` : "—"}</p>
            </Link>
          </article>
        ))}
      </div>
    </PageBlock>
  );
}
