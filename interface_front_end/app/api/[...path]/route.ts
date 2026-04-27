import { copyFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

import {
  DOSSIER_DONNEES,
  SEUILS_NIVEAUX,
  LigneBDD,
  dateIsoActuelle,
  genererJetonHex,
  ouvrirBase,
  reponseJson,
  reponseHtml,
  bddLireUn,
  bddLireTous,
  authentifierUtilisateur,
  exigerRole,
  enregistrerAction,
  attribuerPoints,
  lireCorps,
  cheminRoute,
} from "@/lib/api-handlers/core";
import { envoyerEmailValidation } from "@/lib/api-handlers/email";
import {
  genererPdfObjets,
  genererPdfMembresNonInscrits,
  genererPdfUtilisateurs,
  genererPdfObjetsConnectes,
} from "@/lib/api-handlers/pdf-builder";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const URL_BASE_VERIFICATION_EMAIL =
  process.env.EMAIL_VERIFICATION_BASE_URL ?? "http://localhost:3000/api/auth/verify";

async function traiterRequete(req: NextRequest, parts: string[]): Promise<NextResponse> {
  const method = req.method.toUpperCase();
  const p = cheminRoute(parts);
  const q = req.nextUrl.searchParams;
  const db = ouvrirBase();
  db.prepare(`
    CREATE TABLE IF NOT EXISTS service_configurations (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      zone       TEXT NOT NULL,
      object_id  INTEGER REFERENCES objects(id) ON DELETE SET NULL,
      service_id INTEGER REFERENCES services(id) ON DELETE SET NULL,
      reglage    TEXT NOT NULL
    )
  `).run();

  try {
    // ── Santé ──────────────────────────────────────────────────────────────
    if (p === "/health" && method === "GET") {
      return reponseJson(200, { ok: true, service: "next-api", time: dateIsoActuelle() });
    }

    // ── Module Information ─────────────────────────────────────────────────
    if (p === "/information/free-tour" && method === "GET") {
      return reponseJson(200, { ok: true, items: bddLireTous(db, "SELECT * FROM public_info ORDER BY id") });
    }

    if (p === "/information/search" && method === "GET") {
      const query = q.get("query") ?? "";
      const type = q.get("type") ?? "";
      const city = q.get("city") ?? "";
      const status = q.get("status") ?? "";
      const provided = [query && "query", type && "type", city && "city", status && "status"].filter(Boolean);
      let sql = "SELECT * FROM public_info WHERE 1=1";
      const args: unknown[] = [];
      if (query) { sql += " AND (title LIKE ? OR description LIKE ?)"; args.push(`%${query}%`, `%${query}%`); }
      if (type) { sql += " AND info_type = ?"; args.push(type); }
      if (city) { sql += " AND city LIKE ?"; args.push(`%${city}%`); }
      if (status) { sql += " AND status LIKE ?"; args.push(`%${status}%`); }
      return reponseJson(200, { ok: true, items: bddLireTous(db, sql, ...args), filters: provided });
    }

    // ── Authentification ───────────────────────────────────────────────────
    if (p === "/auth/register" && method === "POST") {
      const body = await lireCorps(req);
      const login = String(body.login ?? "").trim();
      const email = String(body.email ?? "").trim();
      const password = String(body.password ?? "");
      if (!login || !email || !password)
        return reponseJson(400, { ok: false, error: "login, email et password sont requis." });
      const member = bddLireUn(db, "SELECT 1 FROM allowed_members WHERE login=?", login);
      if (!member)
        return reponseJson(403, { ok: false, error: "Ce nom n'est pas reconnu comme habitant de la ville de Cergy. Votre inscription ne peut pas être traitée." });
      const now = dateIsoActuelle();
      db.prepare(
        `INSERT INTO users(login,email,password,role,level,points,is_member,is_validated,age,genre,birth_date,member_type,photo_url,first_name,last_name,created_at,updated_at)
         VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
      ).run(
        login, email, await bcrypt.hash(password, 10),
        "simple", "debutant", 0, 1, 0,
        body.age ?? null, body.genre ?? null, body.birth_date ?? null,
        body.member_type ?? "Résident",
        body.photo_url ?? "https://placehold.co/96x96",
        body.first_name ?? login, body.last_name ?? "", now, now
      );
      const user = bddLireUn(db, "SELECT id FROM users WHERE login=?", login);
      const token = genererJetonHex(16);
      db.prepare("INSERT INTO validation_tokens(token,user_id,created_at) VALUES(?,?,?)").run(token, user?.id, now);
      const verificationUrl = `${URL_BASE_VERIFICATION_EMAIL}?token=${token}`;
      const emailSent = await envoyerEmailValidation(email, login, verificationUrl);
      return reponseJson(201, {
        ok: true,
        message: emailSent
          ? "Inscription créée. Email de validation envoyé."
          : "Inscription créée. Email de validation simulé.",
        validation_token: token,
        verification_url: verificationUrl,
        email_sent: emailSent,
      });
    }

    if (p === "/auth/verify" && method === "GET") {
      const token = q.get("token") ?? "";
      if (!token) return reponseHtml(400, "<h1>Token manquant</h1><p>Le token de validation est requis.</p>");
      const row = bddLireUn(db, "SELECT user_id FROM validation_tokens WHERE token=?", token);
      if (!row) return reponseHtml(404, "<h1>Lien invalide</h1><p>Ce lien est invalide ou expiré.</p>");
      db.prepare("UPDATE users SET is_validated=1, updated_at=? WHERE id=?").run(dateIsoActuelle(), row.user_id);
      db.prepare("DELETE FROM validation_tokens WHERE token=?").run(token);
      return reponseHtml(200, "<h1>Compte validé</h1><p>Votre inscription est confirmée.</p>");
    }

    if (p === "/auth/validate" && method === "POST") {
      const body = await lireCorps(req);
      const token = String(body.token ?? "");
      if (!token) return reponseJson(400, { ok: false, error: "token requis." });
      const row = bddLireUn(db, "SELECT user_id FROM validation_tokens WHERE token=?", token);
      if (!row) return reponseJson(404, { ok: false, error: "Token invalide." });
      db.prepare("UPDATE users SET is_validated=1, updated_at=? WHERE id=?").run(dateIsoActuelle(), row.user_id);
      db.prepare("DELETE FROM validation_tokens WHERE token=?").run(token);
      return reponseJson(200, { ok: true, message: "Inscription validée." });
    }

    if (p === "/auth/login" && method === "POST") {
      const body = await lireCorps(req);
      const loginStr = String(body.login ?? "");
      const candidate = bddLireUn(db, "SELECT * FROM users WHERE login=?", loginStr);
      const passwordOk = candidate
        ? await bcrypt.compare(String(body.password ?? ""), String(candidate.password ?? ""))
        : false;
      const user = passwordOk ? candidate : undefined;
      if (!user) return reponseJson(401, { ok: false, error: "Login/mot de passe incorrect." });
      if (Number(user.is_validated ?? 0) !== 1)
        return reponseJson(403, { ok: false, error: "Votre compte est en attente de validation par l'administrateur." });
      const token = genererJetonHex(24);
      db.prepare("INSERT INTO sessions(token,user_id,created_at) VALUES(?,?,?)").run(token, user.id, dateIsoActuelle());
      const updated = attribuerPoints(db, user, 0.25, true, false);
      enregistrerAction(db, Number(updated.id), "connexion", "Connexion utilisateur");
      const newlyValidated = Number(user.newly_validated ?? 0) === 1;
      if (newlyValidated) db.prepare("UPDATE users SET newly_validated=0 WHERE id=?").run(user.id);
      return reponseJson(200, {
        ok: true, token, newly_validated: newlyValidated,
        user: { id: updated.id, login: updated.login, role: updated.role, level: updated.level, points: updated.points },
      });
    }

    // ── Utilisateurs ───────────────────────────────────────────────────────
    if (p === "/users/me" && method === "GET") {
      const user = authentifierUtilisateur(db, req);
      if (!user) return reponseJson(401, { ok: false, error: "Authentification requise." });
      const { password, ...profile } = user;
      return reponseJson(200, { ok: true, profile });
    }

    if (p === "/users/me" && method === "PATCH") {
      const user = authentifierUtilisateur(db, req);
      if (!user) return reponseJson(401, { ok: false, error: "Authentification requise." });
      const body = await lireCorps(req);
      const allowed = new Set(["age", "genre", "birth_date", "member_type", "photo_url", "first_name", "last_name", "password"]);
      const updates: [string, unknown][] = [];
      for (const [k, v] of Object.entries(body).filter(([k]) => allowed.has(k))) {
        updates.push([k, k === "password" ? await bcrypt.hash(String(v), 10) : v]);
      }
      if (updates.length === 0)
        return reponseJson(400, { ok: false, error: "Aucun champ profil à mettre à jour." });
      const setClause = updates.map(([k]) => `${k}=?`).join(", ");
      db.prepare(`UPDATE users SET ${setClause}, updated_at=? WHERE id=?`).run(
        ...updates.map(([, v]) => v), dateIsoActuelle(), user.id
      );
      const refreshed = attribuerPoints(
        db, bddLireUn(db, "SELECT * FROM users WHERE id=?", user.id) as LigneBDD, 0.2, false, true
      );
      enregistrerAction(db, Number(user.id), "profil_update", "Mise à jour profil");
      const { password, ...profile } = refreshed;
      return reponseJson(200, { ok: true, profile });
    }

    if (p.startsWith("/users/members/") && method === "GET") {
      const rr = exigerRole(db, req, "simple");
      if (rr.error) return rr.error;
      const memberLogin = parts[2];
      const member = bddLireUn(
        db,
        "SELECT login, age, genre, birth_date, member_type, photo_url, first_name, last_name FROM users WHERE login=? AND is_validated=1",
        memberLogin
      );
      if (!member) return reponseJson(404, { ok: false, error: "Membre introuvable." });
      return reponseJson(200, { ok: true, member });
    }

    if (p === "/users/members" && method === "GET") {
      const rr = exigerRole(db, req, "simple");
      if (rr.error) return rr.error;
      const members = bddLireTous(
        db, "SELECT login, age, genre, birth_date, member_type, photo_url FROM users WHERE is_validated=1 ORDER BY login"
      );
      return reponseJson(200, { ok: true, members });
    }

    // ── Visualisation ──────────────────────────────────────────────────────
    if (p === "/visualization/objects" && method === "GET") {
      const rr = exigerRole(db, req, "simple");
      if (rr.error) return rr.error;
      const query = q.get("query") ?? "";
      const brand = q.get("brand") ?? "";
      const type = q.get("type") ?? "";
      const status = q.get("status") ?? "";
      const provided = [query && "query", brand && "brand", type && "type", status && "status"].filter(Boolean);
      if (provided.length < 2)
        return reponseJson(400, { ok: false, error: "La recherche d'objets exige au moins deux filtres." });
      let sql = "SELECT * FROM objects WHERE 1=1";
      const args: unknown[] = [];
      if (query) { sql += " AND (name LIKE ? OR description LIKE ?)"; args.push(`%${query}%`, `%${query}%`); }
      if (brand) { sql += " AND brand LIKE ?"; args.push(`%${brand}%`); }
      if (type) { sql += " AND object_type LIKE ?"; args.push(`%${type}%`); }
      if (status) { sql += " AND status LIKE ?"; args.push(`%${status}%`); }
      return reponseJson(200, { ok: true, items: bddLireTous(db, sql, ...args), filters: provided });
    }

    if (p === "/visualization/services" && method === "GET") {
      const rr = exigerRole(db, req, "simple");
      if (rr.error) return rr.error;
      const query = q.get("query") ?? "";
      const category = q.get("category") ?? "";
      const status = q.get("status") ?? "";
      const provided = [query && "query", category && "category", status && "status"].filter(Boolean);
      if (provided.length < 2)
        return reponseJson(400, { ok: false, error: "La recherche de services exige au moins deux filtres." });
      let sql = `SELECT s.*, c.name AS category_name FROM services s LEFT JOIN categories c ON c.id=s.category_id WHERE 1=1`;
      const args: unknown[] = [];
      if (query) { sql += " AND (s.name LIKE ? OR s.description LIKE ?)"; args.push(`%${query}%`, `%${query}%`); }
      if (category) { sql += " AND c.name LIKE ?"; args.push(`%${category}%`); }
      if (status) { sql += " AND s.status LIKE ?"; args.push(`%${status}%`); }
      return reponseJson(200, { ok: true, items: bddLireTous(db, sql, ...args), filters: provided });
    }

    if (p === "/visualization/consultation" && method === "POST") {
      const rr = exigerRole(db, req, "simple");
      if (rr.error) return rr.error;
      const body = await lireCorps(req);
      const detail = `${String(body.kind ?? "objet")}:${String(body.id ?? "n/a")}`;
      const refreshed = attribuerPoints(
        db, bddLireUn(db, "SELECT * FROM users WHERE id=?", rr.user?.id) as LigneBDD, 0.5, false, true
      );
      enregistrerAction(db, Number(rr.user?.id), "consultation", detail);
      return reponseJson(200, { ok: true, message: "Consultation enregistrée.", points: refreshed.points, level: refreshed.level, role: refreshed.role });
    }

    if (p === "/visualization/levels/me" && method === "GET") {
      const rr = exigerRole(db, req, "simple");
      if (rr.error) return rr.error;
      const user = rr.user as LigneBDD;
      let next: { level: string; required_points: number } | null = null;
      for (const name of ["intermediaire", "avance", "expert"]) {
        if (Number(user.points ?? 0) < SEUILS_NIVEAUX[name]) {
          next = { level: name, required_points: SEUILS_NIVEAUX[name] };
          break;
        }
      }
      return reponseJson(200, {
        ok: true,
        current: { role: user.role, level: user.level, points: user.points, access_count: user.access_count, actions_count: user.actions_count },
        next,
      });
    }

    if (p === "/visualization/levels/change" && method === "POST") {
      const rr = exigerRole(db, req, "simple");
      if (rr.error) return rr.error;
      const user = rr.user as LigneBDD;
      const body = await lireCorps(req);
      const target = String(body.target_level ?? "");
      if (!(target in SEUILS_NIVEAUX))
        return reponseJson(400, { ok: false, error: "target_level invalide." });
      const needed = SEUILS_NIVEAUX[target];
      if (Number(user.points ?? 0) < needed)
        return reponseJson(400, { ok: false, error: "Points insuffisants pour ce niveau." });
      let role = String(user.role);
      if (target === "expert") role = "administrateur";
      else if (target === "avance" && role === "simple") role = "complexe";
      db.prepare("UPDATE users SET level=?, role=?, updated_at=? WHERE id=?").run(target, role, dateIsoActuelle(), user.id);
      enregistrerAction(db, Number(user.id), "niveau_change", `${String(user.level)}->${target}`);
      const refreshed = bddLireUn(db, "SELECT * FROM users WHERE id=?", user.id) as LigneBDD;
      return reponseJson(200, { ok: true, role: refreshed.role, level: refreshed.level, points: refreshed.points });
    }

    // ── Configurations de services ─────────────────────────────────────────
    if (p === "/service-configurations" && method === "GET") {
      const rr = exigerRole(db, req, "simple");
      if (rr.error) return rr.error;
      const configurations = bddLireTous(db, `
        SELECT sc.id, sc.zone, sc.reglage,
               o.name AS object_name, s.name AS service_name
        FROM service_configurations sc
        LEFT JOIN objects o ON o.id = sc.object_id
        LEFT JOIN services s ON s.id = sc.service_id
        ORDER BY sc.id
      `);
      return reponseJson(200, { ok: true, configurations });
    }

    if (p.startsWith("/service-configurations/") && method === "PATCH") {
      const rr = exigerRole(db, req, "complexe");
      if (rr.error) return rr.error;
      const configId = Number(parts[1]);
      const body = await lireCorps(req);
      const reglage = String(body.reglage ?? "").trim();
      if (!reglage) return reponseJson(400, { ok: false, error: "reglage requis." });
      const existing = bddLireUn(db, "SELECT id FROM service_configurations WHERE id=?", configId);
      if (!existing) return reponseJson(404, { ok: false, error: "Configuration introuvable." });
      db.prepare("UPDATE service_configurations SET reglage=? WHERE id=?").run(reglage, configId);
      enregistrerAction(db, Number(rr.user?.id), "service_config_update", String(configId));
      return reponseJson(200, { ok: true, message: "Configuration mise à jour." });
    }

    // ── Module Gestion ─────────────────────────────────────────────────────
    if (p === "/management/objects" && method === "GET") {
      const rr = exigerRole(db, req, "simple");
      if (rr.error) return rr.error;
      return reponseJson(200, { ok: true, items: bddLireTous(db, "SELECT * FROM objects ORDER BY id") });
    }

    if (p === "/management/objects" && method === "POST") {
      const rr = exigerRole(db, req, "complexe");
      if (rr.error) return rr.error;
      const body = await lireCorps(req);
      const required = ["unique_id", "name", "description", "brand", "status", "zone"];
      if (required.some((k) => !body[k]))
        return reponseJson(400, { ok: false, error: "Champs objet obligatoires manquants." });
      if (!body.object_type) body.object_type = "autre";
      db.prepare(
        `INSERT INTO objects(unique_id,name,description,brand,object_type,status,zone,temperature_current,temperature_target,mode,connectivity,battery_state,energy_kwh,last_interaction)
         VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
      ).run(
        body.unique_id, body.name, body.description, body.brand, body.object_type, body.status, body.zone,
        body.temperature_current ?? null, body.temperature_target ?? null, body.mode ?? null,
        body.connectivity ?? "Wi-Fi", body.battery_state ?? "N/A",
        Number(body.energy_kwh ?? 0), dateIsoActuelle()
      );
      enregistrerAction(db, Number(rr.user?.id), "objet_add", String(body.unique_id));
      return reponseJson(201, { ok: true, message: "Objet ajouté." });
    }

    if (p.startsWith("/management/objects/") && p.endsWith("/toggle") && method === "POST") {
      const rr = exigerRole(db, req, "complexe");
      if (rr.error) return rr.error;
      const objectId = Number(parts[2]);
      const obj = bddLireUn(db, "SELECT status FROM objects WHERE id=?", objectId);
      if (!obj) return reponseJson(404, { ok: false, error: "Objet introuvable." });
      const nextStatus = String(obj.status).toLowerCase() === "actif" ? "Inactif" : "Actif";
      db.prepare("UPDATE objects SET status=?, last_interaction=? WHERE id=?").run(nextStatus, dateIsoActuelle(), objectId);
      enregistrerAction(db, Number(rr.user?.id), "objet_toggle", `${objectId}:${nextStatus}`);
      return reponseJson(200, { ok: true, status: nextStatus });
    }

    if (p.startsWith("/management/objects/") && p.endsWith("/request-delete") && method === "POST") {
      const rr = exigerRole(db, req, "complexe");
      if (rr.error) return rr.error;
      const objectId = Number(parts[2]);
      const body = await lireCorps(req);
      const reason = String(body.reason ?? "Suppression demandée");
      db.prepare("INSERT INTO deletion_requests(object_id,requested_by,reason,status,created_at) VALUES(?,?,?,?,?)").run(
        objectId, rr.user?.id, reason, "en_attente", dateIsoActuelle()
      );
      enregistrerAction(db, Number(rr.user?.id), "objet_delete_request", `${objectId}:${reason}`);
      return reponseJson(201, { ok: true, message: "Demande de suppression envoyée." });
    }

    if (p.startsWith("/management/objects/") && method === "PATCH") {
      const rr = exigerRole(db, req, "complexe");
      if (rr.error) return rr.error;
      const objectId = Number(parts[2]);
      const body = await lireCorps(req);
      const allowed = new Set(["name", "description", "brand", "object_type", "status", "zone", "temperature_current", "temperature_target", "mode", "connectivity", "battery_state", "energy_kwh"]);
      const updates = Object.entries(body).filter(([k]) => allowed.has(k));
      if (updates.length === 0)
        return reponseJson(400, { ok: false, error: "Aucune mise à jour fournie." });
      const setClause = updates.map(([k]) => `${k}=?`).join(", ");
      db.prepare(`UPDATE objects SET ${setClause}, last_interaction=? WHERE id=?`).run(
        ...updates.map(([, v]) => v), dateIsoActuelle(), objectId
      );
      enregistrerAction(db, Number(rr.user?.id), "objet_update", String(objectId));
      return reponseJson(200, { ok: true, message: "Objet mis à jour." });
    }

    if (p === "/management/reports" && method === "GET") {
      const rr = exigerRole(db, req, "complexe");
      if (rr.error) return rr.error;
      const stats = bddLireUn(db, "SELECT COUNT(*) AS total_objects, COALESCE(SUM(energy_kwh),0) AS total_energy, COALESCE(AVG(energy_kwh),0) AS avg_energy FROM objects");
      const inefficient = bddLireTous(db, "SELECT id,name,energy_kwh FROM objects WHERE energy_kwh > 10");
      const requests = bddLireTous(db, "SELECT * FROM deletion_requests ORDER BY id DESC");
      const objectHistory = bddLireTous(db,
        `SELECT ua.created_at, ua.action_type, ua.details FROM user_actions ua
         WHERE ua.action_type IN ('objet_add','objet_update','objet_toggle','objet_delete_request')
         ORDER BY ua.created_at DESC LIMIT 100`
      );
      return reponseJson(200, { ok: true, stats, inefficient_objects: inefficient, deletion_requests: requests, object_history: objectHistory });
    }

    // ── Module Administration — Utilisateurs ───────────────────────────────
    if (p === "/admin/users" && method === "GET") {
      const rr = exigerRole(db, req, "administrateur");
      if (rr.error) return rr.error;
      return reponseJson(200, {
        ok: true,
        users: bddLireTous(db,
          `SELECT id, login, email, role, level, points, is_validated, access_count, actions_count, age, genre, birth_date, member_type, photo_url, first_name, last_name FROM users ORDER BY id`
        ),
      });
    }

    if (p === "/admin/users" && method === "POST") {
      const rr = exigerRole(db, req, "administrateur");
      if (rr.error) return rr.error;
      const body = await lireCorps(req);
      const login = String(body.login ?? "").trim();
      const email = String(body.email ?? "").trim();
      const password = String(body.password ?? "").trim();
      if (!login || !email || !password)
        return reponseJson(400, { ok: false, error: "login, email et password sont requis." });
      const exists = bddLireUn(db, "SELECT id FROM users WHERE login=? OR email=?", login, email);
      if (exists) return reponseJson(409, { ok: false, error: "Utilisateur déjà existant." });
      const points = Number(body.points ?? 0);
      const level = String(body.level ?? (points >= 3000 ? "expert" : points >= 1500 ? "avance" : points >= 500 ? "intermediaire" : "debutant"));
      const role = String(body.role ?? (level === "expert" ? "administrateur" : level === "avance" ? "complexe" : "simple"));
      db.prepare(
        `INSERT INTO users(login,email,password,role,level,points,is_member,is_validated,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?)`
      ).run(login, email, await bcrypt.hash(password, 10), role, level, points, 1, Number(body.is_validated ?? 1) ? 1 : 0, dateIsoActuelle(), dateIsoActuelle());
      enregistrerAction(db, Number(rr.user?.id), "admin_user_add", login);
      return reponseJson(201, { ok: true, message: "Utilisateur créé." });
    }

    if (p.startsWith("/admin/users/") && method === "PATCH") {
      const rr = exigerRole(db, req, "administrateur");
      if (rr.error) return rr.error;
      const userId = Number(parts[2]);
      const body = await lireCorps(req);
      const allowed = new Set(["role", "level", "points", "is_validated", "password"]);
      const rawEntries = Object.entries(body).filter(([k]) => allowed.has(k));
      const updates: [string, unknown][] = [];
      for (const [k, v] of rawEntries) {
        updates.push([k, k === "password" ? await bcrypt.hash(String(v), 10) : v]);
      }
      if (updates.length === 0)
        return reponseJson(400, { ok: false, error: "Aucune mise à jour admin fournie." });
      const setClause = updates.map(([k]) => `${k}=?`).join(", ");
      db.prepare(`UPDATE users SET ${setClause}, updated_at=? WHERE id=?`).run(
        ...updates.map(([, v]) => v), dateIsoActuelle(), userId
      );
      enregistrerAction(db, Number(rr.user?.id), "admin_user_update", String(userId));
      return reponseJson(200, { ok: true, message: "Utilisateur mis à jour." });
    }

    if (p.startsWith("/admin/users/") && method === "DELETE") {
      const rr = exigerRole(db, req, "administrateur");
      if (rr.error) return rr.error;
      const userId = Number(parts[2]);
      db.prepare("DELETE FROM users WHERE id=?").run(userId);
      enregistrerAction(db, Number(rr.user?.id), "admin_user_delete", String(userId));
      return reponseJson(200, { ok: true, message: "Utilisateur supprimé." });
    }

    // ── Administration — Validation ────────────────────────────────────────
    if (p === "/admin/validation/pending" && method === "GET") {
      const rr = exigerRole(db, req, "administrateur");
      if (rr.error) return rr.error;
      return reponseJson(200, { ok: true, pending: bddLireTous(db, "SELECT id,login,email,created_at FROM users WHERE is_validated=0 ORDER BY created_at") });
    }

    if (p.startsWith("/admin/validation/approve/") && method === "POST") {
      const rr = exigerRole(db, req, "administrateur");
      if (rr.error) return rr.error;
      const userId = Number(parts[3]);
      db.prepare("UPDATE users SET is_validated=1, newly_validated=1, updated_at=? WHERE id=?").run(dateIsoActuelle(), userId);
      enregistrerAction(db, Number(rr.user?.id), "admin_validation_approve", String(userId));
      return reponseJson(200, { ok: true, message: "Utilisateur validé par administrateur." });
    }

    // ── Administration — Catégories & Services & Objets ────────────────────
    if (p === "/admin/deletion-requests" && method === "GET") {
      const rr = exigerRole(db, req, "administrateur");
      if (rr.error) return rr.error;
      const requests = bddLireTous(db,
        `SELECT dr.id, dr.reason, dr.status, dr.created_at,
                o.name AS object_name, u.login AS requested_by_login
         FROM deletion_requests dr
         LEFT JOIN objects o ON o.id = dr.object_id
         LEFT JOIN users u ON u.id = dr.requested_by
         WHERE dr.status = 'en_attente'
         ORDER BY dr.created_at DESC`
      );
      return reponseJson(200, { ok: true, requests });
    }

    if (p === "/admin/categories" && method === "GET") {
      const rr = exigerRole(db, req, "administrateur");
      if (rr.error) return rr.error;
      return reponseJson(200, { ok: true, categories: bddLireTous(db, "SELECT * FROM categories ORDER BY id") });
    }

    if (p === "/admin/categories" && method === "POST") {
      const rr = exigerRole(db, req, "administrateur");
      if (rr.error) return rr.error;
      const body = await lireCorps(req);
      db.prepare("INSERT INTO categories(name,category_type) VALUES(?,?)").run(
        String(body.name ?? ""), String(body.category_type ?? "objet")
      );
      enregistrerAction(db, Number(rr.user?.id), "admin_category_add", String(body.name ?? ""));
      return reponseJson(201, { ok: true, message: "Catégorie ajoutée." });
    }

    if (p.startsWith("/admin/categories/") && method === "DELETE") {
      const rr = exigerRole(db, req, "administrateur");
      if (rr.error) return rr.error;
      const categoryId = Number(parts[2]);
      db.prepare("DELETE FROM categories WHERE id=?").run(categoryId);
      enregistrerAction(db, Number(rr.user?.id), "admin_category_delete", String(categoryId));
      return reponseJson(200, { ok: true, message: "Catégorie supprimée." });
    }

    if (p === "/admin/services" && method === "GET") {
      const rr = exigerRole(db, req, "administrateur");
      if (rr.error) return rr.error;
      const services = bddLireTous(db,
        `SELECT s.id, s.name, s.description, s.status, s.category_id, c.name AS category_name
         FROM services s LEFT JOIN categories c ON c.id = s.category_id ORDER BY s.id`
      );
      return reponseJson(200, { ok: true, services });
    }

    if (p === "/admin/services" && method === "POST") {
      const rr = exigerRole(db, req, "administrateur");
      if (rr.error) return rr.error;
      const body = await lireCorps(req);
      const name = String(body.name ?? "").trim();
      const description = String(body.description ?? "").trim();
      const status = String(body.status ?? "Actif").trim() || "Actif";
      const categoryId = Number(body.category_id ?? 0);
      if (!name || !description || !categoryId)
        return reponseJson(400, { ok: false, error: "Champs service obligatoires manquants." });
      db.prepare("INSERT INTO services(name,description,category_id,status) VALUES(?,?,?,?)").run(name, description, categoryId, status);
      enregistrerAction(db, Number(rr.user?.id), "admin_service_add", name);
      return reponseJson(201, { ok: true, message: "Service ajouté." });
    }

    if (p.startsWith("/admin/services/") && method === "DELETE") {
      const rr = exigerRole(db, req, "administrateur");
      if (rr.error) return rr.error;
      const serviceId = Number(parts[2]);
      db.prepare("DELETE FROM services WHERE id=?").run(serviceId);
      enregistrerAction(db, Number(rr.user?.id), "admin_service_delete", String(serviceId));
      return reponseJson(200, { ok: true, message: "Service supprimé." });
    }

    if (p.startsWith("/admin/objects/") && method === "DELETE") {
      const rr = exigerRole(db, req, "administrateur");
      if (rr.error) return rr.error;
      const objectId = Number(parts[2]);
      db.prepare("DELETE FROM objects WHERE id=?").run(objectId);
      enregistrerAction(db, Number(rr.user?.id), "admin_object_delete", String(objectId));
      return reponseJson(200, { ok: true, message: "Objet supprimé." });
    }

    // ── Administration — Règles ────────────────────────────────────────────
    if (p === "/admin/rules" && method === "GET") {
      const rr = exigerRole(db, req, "administrateur");
      if (rr.error) return rr.error;
      return reponseJson(200, { ok: true, rules: bddLireTous(db, "SELECT * FROM rules ORDER BY id") });
    }

    if (p === "/admin/rules" && method === "POST") {
      const rr = exigerRole(db, req, "administrateur");
      if (rr.error) return rr.error;
      const body = await lireCorps(req);
      db.prepare("INSERT INTO rules(title,description,is_active) VALUES(?,?,?)").run(
        String(body.title ?? ""), String(body.description ?? ""), Number(body.is_active ?? 1) ? 1 : 0
      );
      enregistrerAction(db, Number(rr.user?.id), "admin_rule_add", String(body.title ?? ""));
      return reponseJson(201, { ok: true, message: "Règle ajoutée." });
    }

    if (p.startsWith("/admin/rules/") && method === "PATCH") {
      const rr = exigerRole(db, req, "administrateur");
      if (rr.error) return rr.error;
      const ruleId = Number(parts[2]);
      const body = await lireCorps(req);
      const updates = Object.entries(body).filter(([k]) => ["title", "description", "is_active"].includes(k));
      if (updates.length === 0)
        return reponseJson(400, { ok: false, error: "Aucune mise à jour de règle." });
      const setClause = updates.map(([k]) => `${k}=?`).join(", ");
      db.prepare(`UPDATE rules SET ${setClause} WHERE id=?`).run(...updates.map(([, v]) => v), ruleId);
      enregistrerAction(db, Number(rr.user?.id), "admin_rule_update", String(ruleId));
      return reponseJson(200, { ok: true, message: "Règle mise à jour." });
    }

    // ── Administration — Logs & Intégrité & Sauvegarde ─────────────────────
    if (p === "/admin/logs" && method === "GET") {
      const rr = exigerRole(db, req, "administrateur");
      if (rr.error) return rr.error;
      return reponseJson(200, {
        ok: true,
        logs: bddLireTous(db,
          `SELECT a.id, u.login, a.action_type, a.details, a.created_at FROM user_actions a JOIN users u ON u.id=a.user_id ORDER BY a.id DESC LIMIT 200`
        ),
      });
    }

    if (p === "/admin/integrity" && method === "GET") {
      const rr = exigerRole(db, req, "administrateur");
      if (rr.error) return rr.error;
      const row = bddLireUn(db, "PRAGMA integrity_check");
      return reponseJson(200, { ok: true, integrity: row ? String(Object.values(row)[0]) : "unknown" });
    }

    if (p === "/admin/backup" && method === "POST") {
      const rr = exigerRole(db, req, "administrateur");
      if (rr.error) return rr.error;
      const backupDir = path.resolve(DOSSIER_DONNEES, "backups");
      if (!existsSync(backupDir)) mkdirSync(backupDir, { recursive: true });
      const backupFile = path.join(backupDir, `backup-${new Date().toISOString().replace(/[:.]/g, "-")}.db`);
      copyFileSync(CHEMIN_BDD, backupFile);
      enregistrerAction(db, Number(rr.user?.id), "admin_backup", path.basename(backupFile));
      return reponseJson(201, { ok: true, backup_file: backupFile });
    }

    // ── Administration — Rapports & Résumé ─────────────────────────────────
    if (p === "/admin/reports/summary" && method === "GET") {
      const rr = exigerRole(db, req, "administrateur");
      if (rr.error) return rr.error;
      const summary = bddLireUn(db,
        `SELECT
          (SELECT COUNT(*) FROM users) AS users_count,
          (SELECT COUNT(*) FROM objects) AS objects_count,
          (SELECT COUNT(*) FROM services) AS services_count,
          (SELECT COALESCE(SUM(energy_kwh),0) FROM objects) AS total_energy,
          (SELECT COALESCE(SUM(access_count),0) FROM users) AS total_logins`
      );
      const mostUsed = bddLireTous(db,
        `SELECT details, COUNT(*) AS uses FROM user_actions
         WHERE action_type='consultation' AND details LIKE 'service:%'
         GROUP BY details ORDER BY uses DESC LIMIT 5`
      );
      return reponseJson(200, { ok: true, summary, most_used_services: mostUsed });
    }

    if (p === "/admin/reports/export" && method === "GET") {
      const rr = exigerRole(db, req, "administrateur");
      if (rr.error) return rr.error;
      const format = (q.get("format") ?? "csv").toLowerCase();
      const exportDir = path.resolve(DOSSIER_DONNEES, "exports");
      if (!existsSync(exportDir)) mkdirSync(exportDir, { recursive: true });
      const rows = bddLireTous(db, "SELECT id,name,status,energy_kwh,last_interaction FROM objects ORDER BY id");
      let output = "";
      if (format === "pdf") {
        output = path.join(exportDir, `objects-${new Date().toISOString().replace(/[:.]/g, "-")}.pdf`);
        const buf = await genererPdfObjets(rows, dateIsoActuelle());
        writeFileSync(output, buf);
      } else {
        output = path.join(exportDir, `objects-${new Date().toISOString().replace(/[:.]/g, "-")}.csv`);
        const lines = ["id,name,status,energy_kwh,last_interaction"];
        for (const r of rows)
          lines.push(`${r.id},"${String(r.name ?? "").replace(/"/g, '""')}",${r.status},${r.energy_kwh},${r.last_interaction}`);
        writeFileSync(output, lines.join("\n"), "utf-8");
      }
      enregistrerAction(db, Number(rr.user?.id), "admin_export", `${format}:${path.basename(output)}`);
      return reponseJson(200, { ok: true, export_file: output });
    }

    // ── Administration — Exports directs ───────────────────────────────────
    if (p === "/admin/export/pending-members" && method === "GET") {
      const rr = exigerRole(db, req, "administrateur");
      if (rr.error) return rr.error;
      const format = (q.get("format") ?? "pdf").toLowerCase();
      const rows = bddLireTous(db,
        `SELECT am.login FROM allowed_members am LEFT JOIN users u ON u.login = am.login WHERE u.login IS NULL ORDER BY am.login`
      );
      if (format === "pdf") {
        const buf = await genererPdfMembresNonInscrits(rows);
        return new NextResponse(buf, {
          status: 200,
          headers: { "Content-Type": "application/pdf", "Content-Disposition": 'attachment; filename="habitants-non-inscrits.pdf"' },
        });
      }
      const lines = ["Login"];
      for (const r of rows) lines.push(String(r.login ?? ""));
      return new NextResponse(lines.join("\n"), {
        status: 200,
        headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="habitants-non-inscrits.csv"' },
      });
    }

    if (p === "/admin/export/users" && method === "GET") {
      const rr = exigerRole(db, req, "administrateur");
      if (rr.error) return rr.error;
      const format = (q.get("format") ?? "csv").toLowerCase();
      const rows = bddLireTous(db, "SELECT first_name, last_name, age, role FROM users WHERE is_validated=1 ORDER BY last_name, first_name");
      if (format === "pdf") {
        const buf = await genererPdfUtilisateurs(rows);
        return new NextResponse(buf, {
          status: 200,
          headers: { "Content-Type": "application/pdf", "Content-Disposition": 'attachment; filename="utilisateurs.pdf"' },
        });
      }
      const lines = ["Prenom,Nom,Age,Role"];
      for (const u of rows)
        lines.push(`"${String(u.first_name ?? "").replace(/"/g, '""')}","${String(u.last_name ?? "").replace(/"/g, '""')}",${u.age ?? ""},${u.role ?? ""}`);
      return new NextResponse(lines.join("\n"), {
        status: 200,
        headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="utilisateurs.csv"' },
      });
    }

    if (p === "/admin/export/objects" && method === "GET") {
      const rr = exigerRole(db, req, "administrateur");
      if (rr.error) return rr.error;
      const format = (q.get("format") ?? "csv").toLowerCase();
      const rows = bddLireTous(db, "SELECT name, zone, energy_kwh, status FROM objects ORDER BY zone, name");
      if (format === "pdf") {
        const buf = await genererPdfObjetsConnectes(rows);
        return new NextResponse(buf, {
          status: 200,
          headers: { "Content-Type": "application/pdf", "Content-Disposition": 'attachment; filename="objets-connectes.pdf"' },
        });
      }
      const lines = ["Nom,Zone,kWh,Statut"];
      for (const o of rows)
        lines.push(`"${String(o.name ?? "").replace(/"/g, '""')}","${String(o.zone ?? "").replace(/"/g, '""')}",${o.energy_kwh ?? ""},${o.status ?? ""}`);
      return new NextResponse(lines.join("\n"), {
        status: 200,
        headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="objets-connectes.csv"' },
      });
    }

    return reponseJson(404, { ok: false, error: "Route introuvable." });
  } catch (error) {
    return reponseJson(500, { ok: false, error: `Erreur interne: ${String(error)}` });
  } finally {
    db.close();
  }
}

export async function GET(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path: parts = [] } = await context.params;
  return traiterRequete(req, parts);
}
export async function POST(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path: parts = [] } = await context.params;
  return traiterRequete(req, parts);
}
export async function PATCH(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path: parts = [] } = await context.params;
  return traiterRequete(req, parts);
}
export async function DELETE(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path: parts = [] } = await context.params;
  return traiterRequete(req, parts);
}
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Authorization, Content-Type",
      "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    },
  });
}
