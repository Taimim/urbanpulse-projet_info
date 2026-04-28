const ENV_BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL?.trim();
const BACKEND_URL = ENV_BACKEND_URL ?? "/api";

function resolveBackendUrl(): string {
  if (ENV_BACKEND_URL) return ENV_BACKEND_URL;
  if (typeof window !== "undefined") return `${window.location.origin}/api`;
  return "http://127.0.0.1:3000/api";
}

type ApiResponse<T> = {
  ok: boolean;
  error?: string;
} & T;

async function readJson<T>(response: Response): Promise<ApiResponse<T>> {
  const donnees = (await response.json()) as ApiResponse<T>;
  if (!response.ok || !donnees.ok) {
    throw new Error(donnees.error ?? `Erreur API (${response.status})`);
  }
  return donnees;
}

async function apiGet<T>(chemin: string, jeton?: string): Promise<ApiResponse<T>> {
  const reponse = await fetch(`${resolveBackendUrl()}${chemin}`, {
    method: "GET",
    headers: jeton ? { Authorization: `Bearer ${jeton}` } : undefined,
    cache: "no-store",
  });
  return readJson<T>(reponse);
}

export async function adminToken(): Promise<string> {
  const reponse = await fetch(`${resolveBackendUrl()}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ login: "admin", password: "admin123" }),
    cache: "no-store",
  });
  const donnees = await readJson<{ token: string }>(reponse);
  return donnees.token;
}

async function currentToken(): Promise<string> {
  if (typeof window !== "undefined") {
    const token = sessionStorage.getItem("auth_token");
    if (!token) throw new Error("Authentification requise.");
    return token;
  }
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) throw new Error("Authentification requise.");
  return token;
}

export async function fetchFreeTour() {
  return apiGet<{ items: Array<{ title: string; info_type: string; city: string; status: string; description: string }> }>(
    "/information/free-tour"
  );
}

export async function fetchPublicSearch(filters: {
  query?: string;
  type?: string;
  city?: string;
  status?: string;
}) {
  const parametres = new URLSearchParams();
  if (filters.query) parametres.set("query", filters.query);
  if (filters.type) parametres.set("type", filters.type);
  if (filters.city) parametres.set("city", filters.city);
  if (filters.status) parametres.set("status", filters.status);
  return apiGet<{ items: Array<{ title: string; info_type: string; city: string; status: string }> }>(
    `/information/search?${parametres.toString()}`
  );
}

export async function fetchMyProfile() {
  const token = await currentToken();
  return apiGet<{ profile: Record<string, string | number> }>("/users/me", token);
}

export async function fetchMembers() {
  const token = await currentToken();
  return apiGet<{ members: Array<{ login: string; age: number | null; genre: string | null; birth_date: string | null; member_type: string | null; photo_url: string | null }> }>("/users/members", token);
}

export async function fetchServiceConfigurations() {
  const token = await currentToken();
  return apiGet<{
    configurations: Array<{
      id: number;
      zone: string;
      object_name: string | null;
      service_name: string | null;
      reglage: string;
    }>;
  }>("/service-configurations", token);
}

export async function updateServiceConfiguration(token: string, id: number, reglage: string) {
  return apiPatch<{ message: string }>(`/service-configurations/${id}`, { reglage }, token);
}

export async function deleteServiceConfiguration(token: string, id: number) {
  return apiDelete<{ message: string }>(`/service-configurations/${id}`, token);
}

export async function fetchMemberProfile(login: string) {
  const token = await currentToken();
  return apiGet<{ member: { login: string; age: number | null; genre: string | null; birth_date: string | null; member_type: string | null; photo_url: string | null; first_name: string | null; last_name: string | null } }>(`/users/members/${encodeURIComponent(login)}`, token);
}

export async function fetchObjects(filters?: { query?: string; brand?: string; type?: string; status?: string }) {
  const jeton = await currentToken();
  const parametres = new URLSearchParams();
  const filtresSurs = filters ?? { query: "Thermostat", brand: "Philips" };
  if (filtresSurs.query) parametres.set("query", filtresSurs.query);
  if (filtresSurs.brand) parametres.set("brand", filtresSurs.brand);
  if (filtresSurs.type) parametres.set("type", filtresSurs.type);
  if (filtresSurs.status) parametres.set("status", filtresSurs.status);
  return apiGet<{ items: Array<Record<string, string | number>> }>(
    `/visualization/objects?${parametres.toString()}`,
    jeton
  );
}

export async function fetchServices(filters?: { query?: string; category?: string; status?: string }) {
  const jeton = await currentToken();
  const parametres = new URLSearchParams();
  const filtresSurs = filters ?? { query: "parking", status: "Actif" };
  if (filtresSurs.query) parametres.set("query", filtresSurs.query);
  if (filtresSurs.category) parametres.set("category", filtresSurs.category);
  if (filtresSurs.status) parametres.set("status", filtresSurs.status);
  return apiGet<{ items: Array<{ name: string; description: string; status: string; category_name: string }> }>(
    `/visualization/services?${parametres.toString()}`,
    jeton
  );
}

export async function fetchLevels() {
  const token = await currentToken();
  return apiGet<{
    current: { role: string; level: string; points: number; access_count: number; actions_count: number };
    next: { level: string; required_points: number } | null;
  }>(
    "/visualization/levels/me",
    token
  );
}

export async function fetchManagementObjects() {
  const token = await currentToken();
  return apiGet<{
    items: Array<{
      id: number;
      name: string;
      description: string;
      object_type: string;
      zone: string;
      status: string;
      mode: string | null;
      temperature_target: number | null;
      energy_kwh: number;
      last_interaction: string;
    }>;
  }>(
    "/management/objects",
    token
  );
}

export async function fetchManagementReports() {
  const token = await currentToken();
  return apiGet<{
    stats: { total_objects: number; total_energy: number; avg_energy: number };
    inefficient_objects: Array<{ id: number; name: string; energy_kwh: number }>;
    deletion_requests: Array<{ id: number; status: string; reason: string }>;
    object_history: Array<{ created_at: string; action_type: string; details: string }>;
  }>("/management/reports", token);
}

export async function fetchAdminUsers() {
  const token = await currentToken();
  return apiGet<{
    users: Array<{
      id: number;
      login: string;
      role: string;
      level: string;
      points: number;
      age: number;
      genre: string;
      birth_date: string;
      member_type: string;
      photo_url: string;
      first_name: string;
      last_name: string;
    }>;
  }>("/admin/users", token);
}

export async function fetchAdminPendingValidations() {
  const token = await currentToken();
  return apiGet<{ pending: Array<{ id: number; login: string; email: string; created_at: string }> }>(
    "/admin/validation/pending",
    token
  );
}

export async function fetchAdminDeletionRequests() {
  const token = await currentToken();
  return apiGet<{
    requests: Array<{
      id: number;
      object_name: string | null;
      requested_by_login: string | null;
      reason: string;
      status: string;
      created_at: string;
    }>;
  }>("/admin/deletion-requests", token);
}

export async function fetchAdminCategories() {
  const token = await currentToken();
  return apiGet<{ categories: Array<{ id: number; name: string; category_type: string }> }>("/admin/categories", token);
}

export async function fetchAdminServices() {
  const token = await currentToken();
  return apiGet<{
    services: Array<{ id: number; name: string; description: string; status: string; category_id: number; category_name: string }>;
  }>("/admin/services", token);
}

export async function fetchAdminRules() {
  const token = await currentToken();
  return apiGet<{ rules: Array<{ id: number; title: string; description: string; is_active: number }> }>("/admin/rules", token);
}

export async function fetchAdminLogs() {
  const token = await currentToken();
  return apiGet<{ logs: Array<{ login: string; action_type: string; details: string; created_at: string }> }>("/admin/logs", token);
}

export async function fetchAdminSummary() {
  const token = await currentToken();
  return apiGet<{
    summary: {
      users_count: number;
      objects_count: number;
      services_count: number;
      total_energy: number;
      total_logins: number;
    };
    most_used_services: Array<{ details: string; uses: number }>;
  }>("/admin/reports/summary", token);
}

export async function fetchIntegrity() {
  const token = await currentToken();
  return apiGet<{ integrity: string }>("/admin/integrity", token);
}

// ============ ACTION FUNCTIONS (POST/PATCH/DELETE) ============

async function apiPost<T>(chemin: string, corps: object, jeton?: string): Promise<ApiResponse<T>> {
  const reponse = await fetch(`${resolveBackendUrl()}${chemin}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(jeton ? { Authorization: `Bearer ${jeton}` } : {}),
    },
    body: JSON.stringify(corps),
  });
  return readJson<T>(reponse);
}

async function apiPatch<T>(chemin: string, corps: object, jeton: string): Promise<ApiResponse<T>> {
  const reponse = await fetch(`${resolveBackendUrl()}${chemin}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jeton}`,
    },
    body: JSON.stringify(corps),
  });
  return readJson<T>(reponse);
}

async function apiDelete<T>(chemin: string, jeton: string): Promise<ApiResponse<T>> {
  const reponse = await fetch(`${resolveBackendUrl()}${chemin}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${jeton}` },
  });
  return readJson<T>(reponse);
}

// Auth actions
export async function registerUser(
  login: string,
  email: string,
  password: string,
  profile?: {
    age?: number;
    genre?: string;
    birth_date?: string;
    member_type?: string;
    first_name?: string;
    last_name?: string;
    photo_url?: string;
  }
) {
  return apiPost<{ message: string; validation_token: string }>("/auth/register", {
    login,
    email,
    password,
    ...(profile ?? {}),
  });
}

export async function validateUser(token: string) {
  return apiPost<{ message: string }>("/auth/validate", { token });
}

export async function loginUser(login: string, password: string) {
  return apiPost<{ token: string; user: { id: number; login: string; role: string; level: string; points: number } }>("/auth/login", { login, password });
}

// Profile actions
export async function updateProfile(token: string, updates: Record<string, string | number>) {
  return apiPatch<{ profile: Record<string, string | number> }>("/users/me", updates, token);
}

// Management actions
export async function addObject(token: string, obj: {
  unique_id: string;
  name: string;
  description: string;
  brand: string;
  object_type: string;
  status: string;
  zone: string;
  energy_kwh?: number;
}) {
  return apiPost<{ message: string }>("/management/objects", obj, token);
}

export async function updateObject(token: string, id: number, updates: Record<string, string | number>) {
  return apiPatch<{ message: string }>(`/management/objects/${id}`, updates, token);
}

export async function toggleObject(token: string, id: number) {
  return apiPost<{ status: string }>(`/management/objects/${id}/toggle`, {}, token);
}

export async function requestDeleteObject(token: string, id: number, reason: string) {
  return apiPost<{ message: string }>(`/management/objects/${id}/request-delete`, { reason }, token);
}

export async function deleteManagedObject(token: string, id: number) {
  return apiDelete<{ message: string }>(`/admin/objects/${id}`, token);
}

// Admin actions
export async function addCategory(token: string, name: string, category_type: string) {
  return apiPost<{ message: string }>("/admin/categories", { name, category_type }, token);
}

export async function deleteCategory(token: string, id: number) {
  return apiDelete<{ message: string }>(`/admin/categories/${id}`, token);
}

export async function addAdminService(
  token: string,
  service: { name: string; description: string; status: string; category_id: number }
) {
  return apiPost<{ message: string }>("/admin/services", service, token);
}

export async function deleteAdminService(token: string, id: number) {
  return apiDelete<{ message: string }>(`/admin/services/${id}`, token);
}

export async function addRule(token: string, title: string, description: string) {
  return apiPost<{ message: string }>("/admin/rules", { title, description, is_active: 1 }, token);
}

export async function updateRule(token: string, id: number, updates: { title?: string; description?: string; is_active?: number }) {
  return apiPatch<{ message: string }>(`/admin/rules/${id}`, updates, token);
}

export async function updateUser(
  token: string,
  id: number,
  updates: { role?: string; level?: string; points?: number; password?: string }
) {
  return apiPatch<{ message: string }>(`/admin/users/${id}`, updates, token);
}

export async function createAdminUser(
  token: string,
  user: { login: string; email: string; password: string; role: string; level: string; points: number; is_validated?: number }
) {
  return apiPost<{ message: string }>("/admin/users", user, token);
}

export async function approvePendingUser(token: string, id: number) {
  return apiPost<{ message: string }>(`/admin/validation/approve/${id}`, {}, token);
}

export async function deleteUser(token: string, id: number) {
  return apiDelete<{ message: string }>(`/admin/users/${id}`, token);
}

export async function createBackup(token: string) {
  return apiPost<{ backup_file: string }>("/admin/backup", {}, token);
}

export async function exportData(token: string, format: "csv" | "json" | "pdf") {
  return apiGet<{ export_file: string }>(`/admin/reports/export?format=${format}`, token);
}

// Consultation action (awards points)
export async function recordConsultation(token: string, kind: string, id: string) {
  return apiPost<{ points: number; level: string; role: string }>("/visualization/consultation", { kind, id }, token);
}

export async function changeLevel(token: string, target_level: "debutant" | "intermediaire" | "avance" | "expert") {
  return apiPost<{ role: string; level: string; points: number }>("/visualization/levels/change", { target_level }, token);
}

// Generate random data
export async function generateRandomObjects(token: string, count: number) {
  const marques = ["Philips", "Samsung", "Xiaomi", "Bosch", "Siemens", "LG", "Sony"];
  const typesObjets = ["thermostat", "camera", "capteur", "lumiere", "serrure", "compteur"];
  const zones = ["Salon", "Cuisine", "Chambre", "Entrée", "Garage", "Jardin", "Bureau"];
  const modes = ["Automatique", "Manuel", "Eco", "Nuit"];

  const resultats = [];
  for (let i = 0; i < count; i++) {
    const typeObjet = typesObjets[Math.floor(Math.random() * typesObjets.length)];
    const zoneChoisie = zones[Math.floor(Math.random() * zones.length)];
    const objetGenere = {
      unique_id: `${typeObjet.substring(0, 4).toUpperCase()}-${Date.now()}-${i}`,
      name: `${typeObjet.charAt(0).toUpperCase() + typeObjet.slice(1)} ${zoneChoisie}`,
      description: `${typeObjet} connecté installé dans ${zoneChoisie.toLowerCase()}`,
      brand: marques[Math.floor(Math.random() * marques.length)],
      object_type: typeObjet,
      status: Math.random() > 0.2 ? "Actif" : "Inactif",
      zone: zoneChoisie,
      energy_kwh: Math.round(Math.random() * 20 * 10) / 10,
      mode: modes[Math.floor(Math.random() * modes.length)],
      connectivity: Math.random() > 0.3 ? "Wi-Fi fort" : "Wi-Fi moyen",
      battery_state: Math.random() > 0.5 ? `${Math.floor(Math.random() * 100)}%` : "Secteur",
    };
    try {
      await addObject(token, objetGenere);
      resultats.push({ success: true, name: objetGenere.name });
    } catch (erreur) {
      resultats.push({ success: false, name: objetGenere.name, error: String(erreur) });
    }
  }
  return resultats;
}

export { BACKEND_URL };
