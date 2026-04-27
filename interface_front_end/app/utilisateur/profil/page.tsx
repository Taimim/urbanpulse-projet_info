import { PageBlock } from "@/components/page-block";
import { fetchMyProfile } from "@/lib/backend-api";
import { ProfileForm } from "@/components/action-forms";
import { GenderAvatar } from "@/components/gender-avatar";

export const dynamic = "force-dynamic";

export default async function UserProfilePage() {
  const { profile } = await fetchMyProfile();
  const nomComplet = `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() || String(profile.login);
  return (
    <PageBlock title="Mon profil" description="Consultez et modifiez vos informations personnelles.">
      <div className="card">
        <GenderAvatar genre={profile.genre ? String(profile.genre) : null} size={96} />
        <p>
          <strong>Login :</strong> {String(profile.login)}
        </p>
        <p>
          <strong>Nom complet :</strong> {nomComplet}
        </p>
        <p>
          <strong>Rôle :</strong> {String(profile.role)}
        </p>
        <p>
          <strong>Niveau :</strong> {String(profile.level)}
        </p>
        <p>
          <strong>Points :</strong> {String(profile.points)}
        </p>
      </div>
      <ProfileForm profile={profile} />
    </PageBlock>
  );
}
