"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BACKEND_URL,
  registerUser,
  validateUser,
  loginUser,
  changeLevel,
  updateProfile,
} from "@/lib/backend-api";

type MessageRetour = { type: "success" | "error"; text: string } | null;

export function BoiteMessage({ message }: { message: MessageRetour }) {
  if (!message) return null;
  return (
    <div className={`feedback-box feedback-${message.type}`} role="alert" aria-live="assertive">
      {message.text}
    </div>
  );
}

export function exigerJetonSession(): string {
  const jeton = sessionStorage.getItem("auth_token");
  if (!jeton) throw new Error("Session expirée. Reconnectez-vous.");
  return jeton;
}

// ── AuthForms ──────────────────────────────────────────────────────────────

export function AuthForms() {
  const router = useRouter();
  const [modeFormulaire, setModeFormulaire] = useState<"login" | "register">("login");
  const [login, setLogin] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [age, setAge] = useState("");
  const [genre, setGenre] = useState("Non spécifié");
  const [birthDate, setBirthDate] = useState("");
  const [memberType, setMemberType] = useState("Résident");
  const [validationToken, setValidationToken] = useState("");
  const [messageRetour, setMessageRetour] = useState<MessageRetour>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [submittingLogin, setSubmittingLogin] = useState(false);
  const [inscriptionTerminee, setInscriptionTerminee] = useState(false);
  const [compteValide, setCompteValide] = useState(false);

  useEffect(() => { setIsHydrated(true); }, []);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setMessageRetour(null);
    try {
      const resultat = await registerUser(login, email, password, {
        first_name: firstName.trim() || login,
        last_name: lastName.trim() || "",
        age: age ? Number(age) : undefined,
        genre,
        birth_date: birthDate || undefined,
        member_type: memberType,
      });
      setValidationToken(resultat.validation_token);
      setInscriptionTerminee(true);
      setMessageRetour({ type: "success", text: "Compte créé avec succès !" });
    } catch (err) {
      setMessageRetour({ type: "error", text: String(err) });
    }
  }

  async function handleValidate() {
    setMessageRetour(null);
    try {
      await validateUser(validationToken);
      setMessageRetour({ type: "success", text: "Compte validé ! Vous pouvez maintenant vous connecter." });
      setValidationToken("");
      setInscriptionTerminee(false);
      setModeFormulaire("login");
    } catch (err) {
      setMessageRetour({ type: "error", text: String(err) });
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (submittingLogin) return;
    setSubmittingLogin(true);
    setMessageRetour(null);
    try {
      const resultat = await loginUser(login, password);
      if (typeof window !== "undefined") {
        sessionStorage.setItem("auth_token", resultat.token);
        sessionStorage.setItem("user_info", JSON.stringify(resultat.user));
        document.cookie = `auth_token=${encodeURIComponent(resultat.token)}; path=/; samesite=lax`;
        document.cookie = `user_role=${encodeURIComponent(resultat.user.role)}; path=/; samesite=lax`;
      }
      if (resultat.newly_validated) {
        setCompteValide(true);
        setTimeout(() => {
          window.location.href = "/";
        }, 2500);
        return;
      }
      window.location.href = "/";
    } catch (err) {
      setMessageRetour({ type: "error", text: String(err) });
    } finally {
      setSubmittingLogin(false);
    }
  }

  if (compteValide) {
    return (
      <div className="card" style={{ textAlign: "center", padding: "2rem" }}>
        <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>✓</div>
        <h3 style={{ margin: "0 0 0.5rem" }}>Compte validé !</h3>
        <p style={{ color: "var(--color-muted)" }}>Bienvenue sur UrbanPulse. Redirection en cours...</p>
      </div>
    );
  }

  if (modeFormulaire === "login") {
    return (
      <div className="card">
        <h3>Connexion</h3>
        <BoiteMessage message={messageRetour} />
        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <label>Login<input type="text" value={login} onChange={(e) => setLogin(e.target.value)} required placeholder="ex : sofia.amari" /></label>
          <label>Mot de passe<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
          <button type="submit" disabled={!isHydrated || submittingLogin}>
            {submittingLogin ? "Connexion..." : "Se connecter"}
          </button>
        </form>
        <p style={{ marginTop: "1rem", fontSize: "0.9rem" }}>
          Pas encore de compte ?{" "}
          <button onClick={() => { setModeFormulaire("register"); setMessageRetour(null); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-accent)", textDecoration: "underline", padding: 0, fontSize: "inherit" }}>
            Créer un compte
          </button>
        </p>
      </div>
    );
  }

  if (inscriptionTerminee) {
    return (
      <div className="card" style={{ textAlign: "center", padding: "2rem" }}>
        <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>⏳</div>
        <h3 style={{ margin: "0 0 0.5rem" }}>Demande envoyée</h3>
        <p style={{ color: "var(--color-muted)", marginBottom: "1.5rem" }}>
          Votre compte est en attente de validation par l&apos;administrateur.<br />
          Vous serez notifié lors de votre prochaine connexion.
        </p>
        <button onClick={() => { setModeFormulaire("login"); setInscriptionTerminee(false); setMessageRetour(null); }} style={{ background: "none", border: "1px solid var(--color-border)", cursor: "pointer", padding: "0.5rem 1.25rem", borderRadius: "0.375rem" }}>
          Retour à la connexion
        </button>
      </div>
    );
  }

  return (
    <div className="card">
      <p style={{ fontSize: "0.85rem", color: "var(--color-muted)", margin: "0 0 1rem", padding: "0.5rem 0.75rem", background: "var(--color-surface, #f5f5f5)", borderLeft: "3px solid var(--color-accent)", borderRadius: "0 0.25rem 0.25rem 0" }}>
        Seuls les habitants enregistrés de Cergy peuvent créer un compte.
      </p>
      <button onClick={() => { setModeFormulaire("login"); setMessageRetour(null); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-accent)", fontSize: "0.9rem", padding: 0, marginBottom: "1rem" }}>
        ← Retour à la connexion
      </button>
      <BoiteMessage message={messageRetour} />
      <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <div style={{ display: "grid", gap: "0.75rem", gridTemplateColumns: "1fr 1fr" }}>
          <label>Prénom<input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Sofia" /></label>
          <label>Nom<input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Amari" /></label>
          <label>Âge<input type="number" min={0} max={120} value={age} onChange={(e) => setAge(e.target.value)} placeholder="24" /></label>
          <label>Genre
            <select value={genre} onChange={(e) => setGenre(e.target.value)}>
              <option value="Non spécifié">Non spécifié</option>
              <option value="Homme">Homme</option>
              <option value="Femme">Femme</option>
              <option value="Autre">Autre</option>
            </select>
          </label>
          <label>Date de naissance<input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} /></label>
          <label>Type de membre
            <select value={memberType} onChange={(e) => setMemberType(e.target.value)}>
              <option value="Résident">Résident</option>
              <option value="Technicien">Technicien</option>
              <option value="Administrateur">Administrateur</option>
            </select>
          </label>
        </div>
        <label>Login<input type="text" value={login} onChange={(e) => setLogin(e.target.value)} required placeholder="ex : sofia.amari" /></label>
        <label>Adresse email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="email@exemple.com" /></label>
        <label>Mot de passe<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
        <button type="submit">Créer mon compte</button>
      </form>
    </div>
  );
}

// ── ProfileForm ────────────────────────────────────────────────────────────

export function ProfileForm({ profile }: { profile: Record<string, string | number> }) {
  const [formData, setFormData] = useState({
    first_name: String(profile.first_name || ""),
    last_name: String(profile.last_name || ""),
    age: String(profile.age || ""),
    genre: String(profile.genre || ""),
    birth_date: String(profile.birth_date || ""),
    member_type: String(profile.member_type || ""),
    photo_url: String(profile.photo_url || ""),
    password: "",
  });
  const [messageRetour, setMessageRetour] = useState<MessageRetour>(null);

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const resultat = typeof reader.result === "string" ? reader.result : "";
      setFormData((prev) => ({ ...prev, photo_url: resultat }));
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessageRetour(null);
    const updates = Object.fromEntries(
      Object.entries(formData).filter(([key, value]) => key !== "password" || String(value).trim())
    ) as Record<string, string | number>;
    try {
      const jeton = exigerJetonSession();
      await updateProfile(jeton, updates);
      setFormData((prev) => ({ ...prev, password: "" }));
      setMessageRetour({ type: "success", text: "Profil mis à jour avec succès ! (+0.20 points)" });
    } catch (err) {
      setMessageRetour({ type: "error", text: String(err) });
    }
  }

  return (
    <div className="card">
      <h3>Modifier le profil</h3>
      <BoiteMessage message={messageRetour} />
      <form onSubmit={handleSubmit}>
        <div style={{ display: "grid", gap: "0.5rem", gridTemplateColumns: "1fr 1fr" }}>
          <label>Prénom :<input type="text" value={formData.first_name} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} /></label>
          <label>Nom :<input type="text" value={formData.last_name} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} /></label>
          <label>Âge :<input type="number" value={formData.age} onChange={(e) => setFormData({ ...formData, age: e.target.value })} /></label>
          <label>Genre :
            <select value={formData.genre} onChange={(e) => setFormData({ ...formData, genre: e.target.value })}>
              <option value="Non spécifié">Non spécifié</option>
              <option value="Homme">Homme</option>
              <option value="Femme">Femme</option>
              <option value="Autre">Autre</option>
            </select>
          </label>
          <label>Date de naissance :<input type="date" value={formData.birth_date} onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })} /></label>
          <label>Type de membre :
            <select value={formData.member_type} onChange={(e) => setFormData({ ...formData, member_type: e.target.value })}>
              <option value="Résident">Résident</option>
              <option value="Employé">Employé</option>
              <option value="Gestionnaire">Gestionnaire</option>
              <option value="Technicien">Technicien</option>
            </select>
          </label>
          <label>Changer photo (fichier) :<input type="file" accept="image/*" onChange={handlePhotoUpload} /></label>
          <label>Nouveau mot de passe :<input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder="Laisser vide pour ne pas changer" /></label>
        </div>
        <button type="submit" style={{ marginTop: "1rem" }}>Enregistrer les modifications</button>
      </form>
    </div>
  );
}

// ── UserLevelActions ───────────────────────────────────────────────────────

export function UserLevelActions({
  niveauActuel,
  points,
  prochainNiveau,
  pointsRequisProchainNiveau,
}: {
  niveauActuel: string;
  points: number;
  prochainNiveau: string | null;
  pointsRequisProchainNiveau: number | null;
}) {
  const router = useRouter();
  const [niveauCible, setNiveauCible] = useState<"debutant" | "intermediaire" | "avance" | "expert">("intermediaire");
  const [messageRetour, setMessageRetour] = useState<MessageRetour>(null);

  async function handleChangeLevel(e: React.FormEvent) {
    e.preventDefault();
    setMessageRetour(null);
    try {
      const jeton = sessionStorage.getItem("auth_token");
      if (!jeton) throw new Error("Session expirée. Reconnectez-vous.");
      const resultat = await changeLevel(jeton, niveauCible);
      document.cookie = `user_role=${encodeURIComponent(resultat.role)}; path=/; samesite=lax`;
      setMessageRetour({ type: "success", text: `Niveau mis à jour: ${resultat.level}. Rôle actuel: ${resultat.role}.` });
      router.refresh();
    } catch (err) {
      setMessageRetour({ type: "error", text: String(err) });
    }
  }

  return (
    <div className="card">
      <h3>Changer de niveau</h3>
      <BoiteMessage message={messageRetour} />
      <p>Niveau actuel : <strong>{niveauActuel}</strong> — Points : <strong>{points.toFixed(2)}</strong></p>
      {prochainNiveau && pointsRequisProchainNiveau !== null ? (
        <p>Prochain niveau possible : <strong>{prochainNiveau}</strong> (minimum {pointsRequisProchainNiveau} points)</p>
      ) : (
        <p>Vous avez déjà atteint le niveau maximal.</p>
      )}
      <form onSubmit={handleChangeLevel} style={{ display: "flex", gap: "0.5rem", alignItems: "end", flexWrap: "wrap" }}>
        <label>Niveau cible :
          <select value={niveauCible} onChange={(e) => setNiveauCible(e.target.value as "debutant" | "intermediaire" | "avance" | "expert")}>
            <option value="intermediaire">intermédiaire</option>
            <option value="avance">avancé</option>
            <option value="expert">expert</option>
          </select>
        </label>
        <button type="submit">Appliquer le niveau</button>
      </form>
    </div>
  );
}
