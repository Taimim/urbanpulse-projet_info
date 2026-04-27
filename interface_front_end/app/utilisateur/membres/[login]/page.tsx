import { PageBlock } from "@/components/page-block";
import { fetchMemberProfile } from "@/lib/backend-api";
import { GenderAvatar } from "@/components/gender-avatar";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function MemberProfilePage({ params }: { params: Promise<{ login: string }> }) {
  const { login } = await params;
  const decodedLogin = decodeURIComponent(login);

  let member: {
    login: string;
    age: number | null;
    genre: string | null;
    birth_date: string | null;
    member_type: string | null;
    photo_url: string | null;
    first_name: string | null;
    last_name: string | null;
  };

  try {
    const result = await fetchMemberProfile(decodedLogin);
    member = result.member;
  } catch {
    notFound();
  }

  const displayName =
    member.first_name || member.last_name
      ? [member.first_name, member.last_name].filter(Boolean).join(" ")
      : member.login;

  return (
    <PageBlock title={`Profil de ${member.login}`} description="Profil public du membre">
      <div className="card" style={{ maxWidth: "480px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.25rem" }}>
          <GenderAvatar genre={member.genre} size={96} />
          <div>
            <div style={{ fontSize: "1.25rem", fontWeight: 700 }}>{displayName}</div>
            {displayName !== member.login && (
              <div style={{ color: "var(--color-muted)", fontSize: "0.875rem" }}>@{member.login}</div>
            )}
          </div>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            <tr>
              <td style={{ color: "var(--color-muted)", paddingBottom: "0.5rem", width: "40%" }}>Type de membre</td>
              <td style={{ paddingBottom: "0.5rem" }}>{member.member_type ?? "—"}</td>
            </tr>
            <tr>
              <td style={{ color: "var(--color-muted)", paddingBottom: "0.5rem" }}>Genre</td>
              <td style={{ paddingBottom: "0.5rem" }}>{member.genre ?? "—"}</td>
            </tr>
            <tr>
              <td style={{ color: "var(--color-muted)", paddingBottom: "0.5rem" }}>Âge</td>
              <td style={{ paddingBottom: "0.5rem" }}>{member.age != null ? `${member.age} ans` : "—"}</td>
            </tr>
            <tr>
              <td style={{ color: "var(--color-muted)" }}>Date de naissance</td>
              <td>{member.birth_date ?? "—"}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: "1rem" }}>
        <Link href="/utilisateur/membres">← Retour à la liste des membres</Link>
      </div>
    </PageBlock>
  );
}
