"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  addCategory, addAdminService, deleteAdminService, deleteCategory,
  addRule, updateUser, createAdminUser, deleteUser,
  approvePendingUser, addObject, deleteManagedObject,
} from "@/lib/backend-api";
import { BoiteMessage, exigerJetonSession } from "./auth-profile";

type MessageRetour = { type: "success" | "error"; text: string } | null;

const btnSecondaire: React.CSSProperties = {
  fontSize: "0.78rem",
  padding: "0.25rem 0.6rem",
  background: "var(--color-bg-subtle)",
  color: "var(--color-text)",
  border: "1px solid var(--color-border)",
  fontWeight: 500,
};

// ── CategoryForms ──────────────────────────────────────────────────────────

export function CategoryForms({ categories }: { categories: Array<{ id: number; name: string; category_type: string }> }) {
  const router = useRouter();
  const [messageRetour, setMessageRetour] = useState<MessageRetour>(null);
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("objet");

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setMessageRetour(null);
    try {
      const jeton = exigerJetonSession();
      await addCategory(jeton, newName, newType);
      setMessageRetour({ type: "success", text: `Catégorie "${newName}" ajoutée !` });
      setNewName("");
      router.refresh();
    } catch (err) {
      setMessageRetour({ type: "error", text: String(err) });
    }
  }

  async function handleDelete(id: number, name: string) {
    if (!confirm(`Supprimer la catégorie "${name}" ?`)) return;
    setMessageRetour(null);
    try {
      const jeton = exigerJetonSession();
      await deleteCategory(jeton, id);
      setMessageRetour({ type: "success", text: `Catégorie "${name}" supprimée.` });
      router.refresh();
    } catch (err) {
      setMessageRetour({ type: "error", text: String(err) });
    }
  }

  return (
    <div className="card">
      <h3>Gestion des catégories</h3>
      <BoiteMessage message={messageRetour} />
      <div style={{ marginBottom: "1rem" }}>
        <button type="button" onClick={() => setShowForm(!showForm)}>{showForm ? "Masquer le formulaire" : "Ajouter une catégorie"}</button>
        {showForm && (
          <form onSubmit={handleAdd} style={{ marginTop: "1rem" }}>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end", flexWrap: "wrap" }}>
              <label>Nom :<input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} required placeholder="Nouvelle catégorie" /></label>
              <label>Type :
                <select value={newType} onChange={(e) => setNewType(e.target.value)}>
                  <option value="objet">Objet</option>
                  <option value="service">Service</option>
                </select>
              </label>
              <button type="submit">Ajouter</button>
            </div>
          </form>
        )}
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse" }} aria-label="Liste des catégories">
        <caption className="sr-only">Catégories existantes avec option de suppression</caption>
        <thead>
          <tr>
            <th scope="col" style={{ textAlign: "left", padding: "0.5rem", borderBottom: "1px solid var(--color-border)" }}>Catégorie</th>
            <th scope="col" style={{ textAlign: "left", padding: "0.5rem", borderBottom: "1px solid var(--color-border)" }}>Type</th>
            <th scope="col" style={{ textAlign: "left", padding: "0.5rem", borderBottom: "1px solid var(--color-border)" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((cat) => (
            <tr key={cat.id}>
              <td scope="row" style={{ padding: "0.5rem" }}>{cat.name}</td>
              <td style={{ padding: "0.5rem" }}>{cat.category_type}</td>
              <td style={{ padding: "0.5rem" }}><button onClick={() => handleDelete(cat.id, cat.name)} aria-label={`Supprimer la catégorie ${cat.name}`}>Supprimer</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── ServiceManagementForms ─────────────────────────────────────────────────

export function ServiceManagementForms({
  categories, services: servicesGeres, objects: objetsGeres,
}: {
  categories: Array<{ id: number; name: string; category_type: string }>;
  services: Array<{ id: number; name: string; description: string; status: string; category_name: string; category_id: number }>;
  objects: Array<{ id: number; name: string; status: string }>;
}) {
  const router = useRouter();
  const [messageRetour, setMessageRetour] = useState<MessageRetour>(null);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [showObjectForm, setShowObjectForm] = useState(false);
  const [nouvelObjet, setNouvelObjet] = useState({ name: "", description: "", brand: "Philips", object_type: "camera", status: "Actif", zone: "Salon", energy_kwh: "0" });
  const [nouveauService, setNouveauService] = useState({
    name: "", description: "", status: "Actif",
    category_id: categories.find((c) => c.category_type === "service")?.id ?? categories[0]?.id ?? 1,
  });

  async function gererAjoutService(e: React.FormEvent) {
    e.preventDefault();
    setMessageRetour(null);
    try {
      const jeton = exigerJetonSession();
      await addAdminService(jeton, nouveauService);
      setMessageRetour({ type: "success", text: `Service "${nouveauService.name}" ajouté.` });
      setNouveauService((p) => ({ ...p, name: "", description: "" }));
      router.refresh();
    } catch (err) {
      setMessageRetour({ type: "error", text: String(err) });
    }
  }

  async function gererSuppressionService(id: number, nom: string) {
    if (!confirm(`Supprimer le service "${nom}" ?`)) return;
    setMessageRetour(null);
    try {
      const jeton = exigerJetonSession();
      await deleteAdminService(jeton, id);
      setMessageRetour({ type: "success", text: `Service "${nom}" supprimé.` });
      router.refresh();
    } catch (err) {
      setMessageRetour({ type: "error", text: String(err) });
    }
  }

  async function gererSuppressionObjet(id: number, nom: string) {
    if (!confirm(`Supprimer l'objet "${nom}" ?`)) return;
    setMessageRetour(null);
    try {
      const jeton = exigerJetonSession();
      await deleteManagedObject(jeton, id);
      setMessageRetour({ type: "success", text: `Objet "${nom}" supprimé.` });
      router.refresh();
    } catch (err) {
      setMessageRetour({ type: "error", text: String(err) });
    }
  }

  async function gererAjoutObjet(e: React.FormEvent) {
    e.preventDefault();
    setMessageRetour(null);
    try {
      const jeton = exigerJetonSession();
      await addObject(jeton, { unique_id: `ADMIN-OBJ-${Date.now()}`, name: nouvelObjet.name, description: nouvelObjet.description, brand: nouvelObjet.brand, object_type: nouvelObjet.object_type, status: nouvelObjet.status, zone: nouvelObjet.zone, energy_kwh: Number(nouvelObjet.energy_kwh || 0) });
      setMessageRetour({ type: "success", text: `Objet "${nouvelObjet.name}" ajouté.` });
      setNouvelObjet((p) => ({ ...p, name: "", description: "", energy_kwh: "0" }));
      router.refresh();
    } catch (err) {
      setMessageRetour({ type: "error", text: String(err) });
    }
  }

  return (
    <div className="card">
      <h3>Gestion des services</h3>
      <BoiteMessage message={messageRetour} />
      <div style={{ marginBottom: "1rem" }}>
        <button type="button" onClick={() => setShowServiceForm(!showServiceForm)}>{showServiceForm ? "Masquer le formulaire" : "Ajouter un service"}</button>
        {showServiceForm && (
          <form onSubmit={gererAjoutService} style={{ marginTop: "1rem" }}>
            <div style={{ display: "grid", gap: "0.5rem", gridTemplateColumns: "1fr 1fr" }}>
              <label>Nom du service :<input type="text" value={nouveauService.name} onChange={(e) => setNouveauService({ ...nouveauService, name: e.target.value })} required /></label>
              <label>Catégorie :
                <select value={nouveauService.category_id} onChange={(e) => setNouveauService({ ...nouveauService, category_id: Number(e.target.value) })}>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </label>
              <label>Description :<input type="text" value={nouveauService.description} onChange={(e) => setNouveauService({ ...nouveauService, description: e.target.value })} required /></label>
              <label>Statut :
                <select value={nouveauService.status} onChange={(e) => setNouveauService({ ...nouveauService, status: e.target.value })}>
                  <option>Actif</option><option>Maintenance</option><option>Inactif</option>
                </select>
              </label>
            </div>
            <button type="submit" style={{ marginTop: "1rem" }}>Ajouter un service</button>
          </form>
        )}
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "1rem" }} aria-label="Liste des services">
        <caption className="sr-only">Services connectés avec option de suppression</caption>
        <thead>
          <tr>
            {["Service", "Description", "Catégorie", "Statut", "Action"].map((col) => (
              <th key={col} scope="col" style={{ textAlign: "left", padding: "0.5rem", borderBottom: "1px solid var(--color-border)" }}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {servicesGeres.map((s) => (
            <tr key={s.id}>
              <td scope="row" style={{ padding: "0.5rem" }}>{s.name}</td>
              <td style={{ padding: "0.5rem" }}>{s.description}</td>
              <td style={{ padding: "0.5rem" }}>{s.category_name ?? "-"}</td>
              <td style={{ padding: "0.5rem" }}>{s.status}</td>
              <td style={{ padding: "0.5rem" }}><button onClick={() => gererSuppressionService(s.id, s.name)} aria-label={`Supprimer le service ${s.name}`}>Supprimer</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <h4>Gestion des objets</h4>
      <div style={{ marginBottom: "1rem" }}>
        <button type="button" onClick={() => setShowObjectForm(!showObjectForm)}>{showObjectForm ? "Masquer le formulaire" : "Ajouter un objet"}</button>
        {showObjectForm && (
          <form onSubmit={gererAjoutObjet} style={{ marginTop: "1rem" }}>
            <div style={{ display: "grid", gap: "0.5rem", gridTemplateColumns: "1fr 1fr" }}>
              <label>Nom :<input type="text" value={nouvelObjet.name} onChange={(e) => setNouvelObjet({ ...nouvelObjet, name: e.target.value })} required /></label>
              <label>Description :<input type="text" value={nouvelObjet.description} onChange={(e) => setNouvelObjet({ ...nouvelObjet, description: e.target.value })} required /></label>
              <label>Marque :
                <select value={nouvelObjet.brand} onChange={(e) => setNouvelObjet({ ...nouvelObjet, brand: e.target.value })}>
                  <option>Philips</option><option>Samsung</option><option>Xiaomi</option><option>Bosch</option><option>Siemens</option>
                </select>
              </label>
              <label>Type :
                <select value={nouvelObjet.object_type} onChange={(e) => setNouvelObjet({ ...nouvelObjet, object_type: e.target.value })}>
                  <option value="thermostat">Thermostat</option><option value="camera">Caméra</option><option value="capteur">Capteur</option><option value="lumiere">Lumière</option><option value="serrure">Serrure</option><option value="compteur">Compteur</option>
                </select>
              </label>
              <label>Zone :
                <select value={nouvelObjet.zone} onChange={(e) => setNouvelObjet({ ...nouvelObjet, zone: e.target.value })}>
                  <option>Salon</option><option>Cuisine</option><option>Chambre</option><option>Entrée</option><option>Garage</option><option>Jardin</option><option>Bureau</option>
                </select>
              </label>
              <label>Statut :
                <select value={nouvelObjet.status} onChange={(e) => setNouvelObjet({ ...nouvelObjet, status: e.target.value })}>
                  <option>Actif</option><option>Maintenance</option><option>Inactif</option>
                </select>
              </label>
              <label>Énergie (kWh) :<input type="number" step="0.1" value={nouvelObjet.energy_kwh} onChange={(e) => setNouvelObjet({ ...nouvelObjet, energy_kwh: e.target.value })} /></label>
            </div>
            <button type="submit" style={{ marginTop: "1rem" }}>Ajouter un objet</button>
          </form>
        )}
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            {["Objet", "Statut", "Action"].map((col) => (
              <th key={col} style={{ textAlign: "left", padding: "0.5rem", borderBottom: "1px solid var(--color-border)" }}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {objetsGeres.map((o) => (
            <tr key={o.id}>
              <td style={{ padding: "0.5rem" }}>{o.name}</td>
              <td style={{ padding: "0.5rem" }}>{o.status}</td>
              <td style={{ padding: "0.5rem" }}><button onClick={() => gererSuppressionObjet(o.id, o.name)}>Supprimer</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── RuleForms ──────────────────────────────────────────────────────────────

export function RuleForms({ rules }: { rules: Array<{ id: number; title: string; description: string; is_active: number }> }) {
  const router = useRouter();
  const [messageRetour, setMessageRetour] = useState<MessageRetour>(null);
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setMessageRetour(null);
    try {
      const jeton = exigerJetonSession();
      await addRule(jeton, newTitle, newDescription);
      setMessageRetour({ type: "success", text: `Règle "${newTitle}" ajoutée !` });
      setNewTitle(""); setNewDescription("");
      router.refresh();
    } catch (err) {
      setMessageRetour({ type: "error", text: String(err) });
    }
  }

  return (
    <div className="card">
      <h3>Gestion des règles</h3>
      <BoiteMessage message={messageRetour} />
      <div style={{ marginBottom: "1rem" }}>
        <button type="button" onClick={() => setShowForm(!showForm)}>{showForm ? "Masquer le formulaire" : "Ajouter une règle"}</button>
        {showForm && (
          <form onSubmit={handleAdd} style={{ marginTop: "1rem" }}>
            <div style={{ display: "flex", gap: "0.5rem", flexDirection: "column" }}>
              <label>Titre :<input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} required placeholder="Alerte consommation élevée" style={{ width: "100%" }} /></label>
              <label>Description :<textarea value={newDescription} onChange={(e) => setNewDescription(e.target.value)} required placeholder="Décrire la règle..." style={{ width: "100%", minHeight: "60px" }} /></label>
              <button type="submit">Ajouter la règle</button>
            </div>
          </form>
        )}
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            {["Règle", "Description", "Actif"].map((col) => (
              <th key={col} style={{ textAlign: "left", padding: "0.5rem", borderBottom: "1px solid var(--color-border)" }}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rules.map((rule) => (
            <tr key={rule.id}>
              <td style={{ padding: "0.5rem" }}>{rule.title}</td>
              <td style={{ padding: "0.5rem" }}>{rule.description}</td>
              <td style={{ padding: "0.5rem" }}>{rule.is_active ? "Oui" : "Non"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── UserManagementForms ────────────────────────────────────────────────────

export function UserManagementForms({ users }: { users: Array<{ id: number; login: string; role: string; level: string; points: number }> }) {
  const router = useRouter();
  const [messageRetour, setMessageRetour] = useState<MessageRetour>(null);
  const [roleDrafts, setRoleDrafts] = useState<Record<number, string>>(() => Object.fromEntries(users.map((u) => [u.id, u.role])));
  const [showAddUser, setShowAddUser] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<number | null>(null);
  const [resetPasswordId, setResetPasswordId] = useState<number | null>(null);
  const [newPasswordValue, setNewPasswordValue] = useState("");
  const [newUser, setNewUser] = useState({ login: "", email: "", password: "", role: "simple", points: "0" });

  function niveauDepuisPoints(points: number): string {
    if (points >= 1000) return "expert";
    if (points >= 600) return "avance";
    if (points >= 200) return "intermediaire";
    return "debutant";
  }

  async function handleUpdateRole(userId: number, login: string) {
    const newRole = roleDrafts[userId];
    if (!newRole || !["simple", "complexe", "administrateur"].includes(newRole)) {
      setMessageRetour({ type: "error", text: "Rôle invalide. Choisir: simple, complexe, administrateur." });
      return;
    }
    setMessageRetour(null);
    try {
      const jeton = exigerJetonSession();
      await updateUser(jeton, userId, { role: newRole });
      setMessageRetour({ type: "success", text: `Rôle de ${login} changé en ${newRole}` });
      router.refresh();
    } catch (err) {
      setMessageRetour({ type: "error", text: String(err) });
    }
  }

  async function handleAddPoints(userId: number, login: string) {
    const points = parseFloat(prompt(`Points à ajouter pour ${login} :`, "100") || "0");
    if (points <= 0) return;
    setMessageRetour(null);
    try {
      const jeton = exigerJetonSession();
      const utilisateurActuel = users.find((u) => u.login === login);
      await updateUser(jeton, userId, { points: (utilisateurActuel?.points || 0) + points });
      setMessageRetour({ type: "success", text: `${points} points ajoutés à ${login}` });
      router.refresh();
    } catch (err) {
      setMessageRetour({ type: "error", text: String(err) });
    }
  }

  async function handleDelete(userId: number, login: string) {
    if (login === "admin") { alert("Impossible de supprimer l'administrateur principal."); return; }
    if (!confirm(`Supprimer l'utilisateur "${login}" ?`)) return;
    setMessageRetour(null);
    try {
      const jeton = exigerJetonSession();
      await deleteUser(jeton, userId);
      setMessageRetour({ type: "success", text: `Utilisateur ${login} supprimé.` });
      router.refresh();
    } catch (err) {
      setMessageRetour({ type: "error", text: String(err) });
    }
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setMessageRetour(null);
    try {
      const jeton = exigerJetonSession();
      const pts = Number(newUser.points || 0);
      await createAdminUser(jeton, { login: newUser.login.trim(), email: newUser.email.trim(), password: newUser.password, role: newUser.role, level: niveauDepuisPoints(pts), points: pts, is_validated: 1 });
      setMessageRetour({ type: "success", text: `Utilisateur ${newUser.login} créé.` });
      setNewUser({ login: "", email: "", password: "", role: "simple", points: "0" });
      router.refresh();
    } catch (err) {
      setMessageRetour({ type: "error", text: String(err) });
    }
  }

  async function handleResetPassword(userId: number, login: string) {
    if (newPasswordValue.trim().length < 4) { setMessageRetour({ type: "error", text: "Mot de passe invalide (minimum 4 caractères)." }); return; }
    setMessageRetour(null);
    try {
      const jeton = exigerJetonSession();
      await updateUser(jeton, userId, { password: newPasswordValue.trim() });
      setMessageRetour({ type: "success", text: `Mot de passe mis à jour pour ${login}.` });
      setResetPasswordId(null); setNewPasswordValue("");
    } catch (err) {
      setMessageRetour({ type: "error", text: String(err) });
    }
  }

  return (
    <div className="card">
      <h3>Gestion des utilisateurs</h3>
      <BoiteMessage message={messageRetour} />
      <div style={{ marginBottom: "1rem" }}>
        <button type="button" onClick={() => setShowAddUser(!showAddUser)}>{showAddUser ? "Masquer le formulaire" : "Ajouter un utilisateur"}</button>
        {showAddUser && (
          <form onSubmit={handleCreateUser} style={{ marginTop: "1rem" }}>
            <h4>Ajouter un utilisateur</h4>
            <div style={{ display: "grid", gap: "0.5rem", gridTemplateColumns: "1fr 1fr" }}>
              <label>Login :<input value={newUser.login} onChange={(e) => setNewUser({ ...newUser, login: e.target.value })} required /></label>
              <label>Email :<input type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} required /></label>
              <label>Mot de passe :<input type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} required /></label>
              <label>Rôle :
                <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}>
                  <option value="simple">simple</option><option value="complexe">complexe</option><option value="administrateur">administrateur</option>
                </select>
              </label>
              <label>Points :<input type="number" min={0} value={newUser.points} onChange={(e) => setNewUser({ ...newUser, points: e.target.value })} />
                <small style={{ color: "var(--color-muted)", fontSize: "0.78rem" }}>0–199 = débutant · 200–599 = intermédiaire · 600–999 = avancé · 1000+ = expert</small>
              </label>
            </div>
            <button type="submit" style={{ marginTop: "1rem" }}>Créer l&apos;utilisateur</button>
          </form>
        )}
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse" }} aria-label="Gestion des utilisateurs">
        <caption className="sr-only">Liste des utilisateurs avec leurs rôles, niveaux et actions de gestion</caption>
        <thead>
          <tr>
            {["Login", "Rôle", "Niveau", "Points", "Actions"].map((col) => (
              <th key={col} scope="col" style={{ textAlign: "left", padding: "0.5rem", borderBottom: "1px solid var(--color-border)" }}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.login}>
              <td scope="row" style={{ padding: "0.5rem" }}>{user.login}</td>
              <td style={{ padding: "0.5rem" }}>{user.role}</td>
              <td style={{ padding: "0.5rem" }}>{user.level}</td>
              <td style={{ padding: "0.5rem" }}>{parseFloat(user.points.toFixed(2))}</td>
              <td style={{ padding: "0.5rem" }}>
                {editingRoleId === user.id ? (
                  <>
                    <label className="sr-only" htmlFor={`role-select-${user.id}`}>Nouveau rôle pour {user.login}</label>
                    <select id={`role-select-${user.id}`} value={roleDrafts[user.id] ?? user.role} onChange={(e) => setRoleDrafts((prev) => ({ ...prev, [user.id]: e.target.value }))} style={{ marginRight: "0.25rem" }}>
                      <option value="simple">simple</option><option value="complexe">complexe</option><option value="administrateur">administrateur</option>
                    </select>
                    <button onClick={() => { handleUpdateRole(user.id, user.login); setEditingRoleId(null); }} style={{ marginRight: "0.25rem" }}>Confirmer</button>
                    <button onClick={() => setEditingRoleId(null)} style={{ marginRight: "0.25rem" }}>Annuler</button>
                  </>
                ) : (
                  <button onClick={() => setEditingRoleId(user.id)} aria-label={`Changer le rôle de ${user.login}`} style={{ marginRight: "0.25rem" }}>Changer rôle</button>
                )}
                <button onClick={() => handleAddPoints(user.id, user.login)} aria-label={`Ajouter des points à ${user.login}`} style={{ marginRight: "0.25rem" }}>+ Points</button>
                <button onClick={() => handleDelete(user.id, user.login)} aria-label={`Supprimer l'utilisateur ${user.login}`}>Supprimer</button>
                {resetPasswordId === user.id ? (
                  <>
                    <input type="password" value={newPasswordValue} onChange={(e) => setNewPasswordValue(e.target.value)} placeholder="Nouveau mot de passe" style={{ marginLeft: "0.25rem", fontSize: "0.85rem", padding: "0.2rem 0.4rem", width: "160px" }} autoFocus />
                    <button onClick={() => handleResetPassword(user.id, user.login)} style={{ marginLeft: "0.25rem" }}>Confirmer</button>
                    <button onClick={() => { setResetPasswordId(null); setNewPasswordValue(""); }} style={{ marginLeft: "0.25rem" }}>Annuler</button>
                  </>
                ) : (
                  <button onClick={() => { setResetPasswordId(user.id); setNewPasswordValue(""); }} aria-label={`Réinitialiser le mot de passe de ${user.login}`} style={{ marginLeft: "0.25rem" }}>Mot de passe</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── AdminActions ───────────────────────────────────────────────────────────

export function AdminActions() {
  const [messageRetour, setMessageRetour] = useState<MessageRetour>(null);
  const [telechargement, setTelechargement] = useState<string | null>(null);

  async function telecharger(type: "users" | "objects" | "pending-members", format: "pdf" | "csv") {
    const cle = `${type}-${format}`;
    setTelechargement(cle);
    setMessageRetour(null);
    try {
      const jeton = exigerJetonSession();
      const reponse = await fetch(`/api/admin/export/${type}?format=${format}`, { headers: { Authorization: `Bearer ${jeton}` } });
      if (!reponse.ok) throw new Error("Erreur lors du téléchargement.");
      const blob = await reponse.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = type === "users" ? `utilisateurs.${format}` : type === "objects" ? `objets-connectes.${format}` : `habitants-non-inscrits.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setMessageRetour({ type: "error", text: String(err) });
    } finally {
      setTelechargement(null);
    }
  }

  const btnSec: React.CSSProperties = btnSecondaire;

  return (
    <div className="card">
      <h3>Exports</h3>
      <BoiteMessage message={messageRetour} />
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {([ ["users", "Télécharger liste des utilisateurs"], ["objects", "Télécharger liste des objets connectés"], ["pending-members", "Télécharger habitants non inscrits"] ] as const).map(([type, label]) => (
          <div key={type} style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
            <span style={{ minWidth: "240px", fontWeight: 500, fontSize: "0.9rem" }}>{label}</span>
            <button onClick={() => telecharger(type, "pdf")} disabled={telechargement === `${type}-pdf`} style={btnSec}>{telechargement === `${type}-pdf` ? "…" : "PDF"}</button>
            <button onClick={() => telecharger(type, "csv")} disabled={telechargement === `${type}-csv`} style={btnSec}>{telechargement === `${type}-csv` ? "…" : "CSV"}</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── PendingValidationForms ─────────────────────────────────────────────────

export function PendingValidationForms({ pending }: { pending: Array<{ id: number; login: string; email: string; created_at: string }> }) {
  const router = useRouter();
  const [messageRetour, setMessageRetour] = useState<MessageRetour>(null);

  async function approve(id: number, login: string) {
    setMessageRetour(null);
    try {
      const jeton = exigerJetonSession();
      await approvePendingUser(jeton, id);
      setMessageRetour({ type: "success", text: `Compte ${login} validé.` });
      router.refresh();
    } catch (err) {
      setMessageRetour({ type: "error", text: String(err) });
    }
  }

  return (
    <div className="card">
      <h3>Validations d&apos;inscription en attente</h3>
      <BoiteMessage message={messageRetour} />
      {pending.length === 0 && <p>Aucune inscription en attente.</p>}
      {pending.length > 0 && (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["Login", "Email", "Créé le", "Action"].map((col) => (
                <th key={col} style={{ textAlign: "left", padding: "0.5rem", borderBottom: "1px solid var(--color-border)" }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pending.map((user) => (
              <tr key={user.id}>
                <td style={{ padding: "0.5rem" }}>{user.login}</td>
                <td style={{ padding: "0.5rem" }}>{user.email}</td>
                <td style={{ padding: "0.5rem" }}>{user.created_at}</td>
                <td style={{ padding: "0.5rem" }}><button onClick={() => approve(user.id, user.login)}>Valider</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ── PersonnalisationForms ──────────────────────────────────────────────────

const COULEURS_THEME = [
  { label: "Bleu", value: "blue", hex: "#1d4ed8" },
  { label: "Vert", value: "green", hex: "#15803d" },
  { label: "Violet", value: "purple", hex: "#7c3aed" },
];

export function PersonnalisationForms() {
  const [couleur, setCouleur] = useState("blue");
  const [langue, setLangue] = useState("fr");

  useEffect(() => {
    const c = localStorage.getItem("site_couleur") ?? "blue";
    const l = localStorage.getItem("site_langue") ?? "fr";
    setCouleur(c); setLangue(l);
    appliquerCouleur(c);
  }, []);

  function appliquerCouleur(val: string) {
    if (typeof window === "undefined") return;
    const found = COULEURS_THEME.find((c) => c.value === val);
    if (found) document.documentElement.style.setProperty("--color-primary", found.hex);
  }

  function choisirCouleur(val: string) { setCouleur(val); localStorage.setItem("site_couleur", val); appliquerCouleur(val); }
  function choisirLangue(val: string) { setLangue(val); localStorage.setItem("site_langue", val); }

  const couleurActive = COULEURS_THEME.find((c) => c.value === couleur);

  return (
    <div className="card">
      <h3>Personnalisation</h3>
      <div style={{ marginBottom: "1.5rem" }}>
        <h4>Couleur du site</h4>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "0.5rem" }}>
          {COULEURS_THEME.map((c) => (
            <button key={c.value} type="button" onClick={() => choisirCouleur(c.value)} style={{ padding: "0.5rem 1.25rem", background: c.hex, color: "white", border: couleur === c.value ? "3px solid #000" : "3px solid transparent", borderRadius: "0.375rem", cursor: "pointer", fontWeight: couleur === c.value ? "bold" : "normal" }}>
              {c.label}
            </button>
          ))}
        </div>
        {couleurActive && <p style={{ fontSize: "0.875rem" }}>Couleur active : <strong>{couleurActive.label}</strong></p>}
      </div>
      <div>
        <h4>Langue du site</h4>
        <div style={{ display: "flex", gap: "0.75rem", marginBottom: "0.5rem" }}>
          {[{ val: "fr", label: "Français" }, { val: "en", label: "English" }].map(({ val, label }) => (
            <button key={val} type="button" onClick={() => choisirLangue(val)} style={{ padding: "0.5rem 1.25rem", border: langue === val ? "2px solid #1d4ed8" : "2px solid var(--color-border)", borderRadius: "0.375rem", cursor: "pointer", fontWeight: langue === val ? "bold" : "normal", background: langue === val ? "#eff6ff" : "transparent" }}>
              {label}
            </button>
          ))}
        </div>
        <p style={{ fontSize: "0.875rem" }}>Langue active : <strong>{langue === "fr" ? "Français" : "English"}</strong></p>
      </div>
    </div>
  );
}
