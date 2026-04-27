import { randomBytes } from "node:crypto";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { NextRequest, NextResponse } from "next/server";

export const DOSSIER_DONNEES = path.resolve(process.cwd(), "..", "arriere-plan_back_end");
export const CHEMIN_BDD = path.resolve(DOSSIER_DONNEES, "backend.db");

export const SMTP_HOST = process.env.SMTP_HOST ?? "";
export const SMTP_PORT = Number(process.env.SMTP_PORT ?? 587);
export const SMTP_USER = process.env.SMTP_USER ?? "";
export const SMTP_PASS = process.env.SMTP_PASS ?? "";
export const SMTP_FROM = process.env.SMTP_FROM ?? SMTP_USER;
export const URL_BASE_VERIFICATION_EMAIL =
  process.env.EMAIL_VERIFICATION_BASE_URL ?? "http://localhost:3000/api/auth/verify";

export const SEUILS_NIVEAUX: Record<string, number> = {
  debutant: 0,
  intermediaire: 500,
  avance: 1500,
  expert: 3000,
};

export const RANG_ROLES: Record<string, number> = {
  visiteur: 0,
  simple: 1,
  complexe: 2,
  administrateur: 3,
};

export type LigneBDD = Record<string, string | number | null>;

export function dateIsoActuelle(): string {
  return new Date().toISOString();
}

export function dateLisible(): string {
  const d = new Date();
  const date = d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
  const heure = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  return `${date} a ${heure}`;
}

export function genererJetonHex(size = 16): string {
  return randomBytes(size).toString("hex");
}

export function ouvrirBase(): DatabaseSync {
  return new DatabaseSync(CHEMIN_BDD);
}

export function reponseJson(status: number, payload: Record<string, unknown>): NextResponse {
  return NextResponse.json(payload, {
    status,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Authorization, Content-Type",
      "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    },
  });
}

export function reponseHtml(status: number, payload: string): NextResponse {
  return new NextResponse(payload, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Authorization, Content-Type",
      "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    },
  });
}

export function niveauDepuisPoints(points: number): string {
  if (points >= SEUILS_NIVEAUX.expert) return "expert";
  if (points >= SEUILS_NIVEAUX.avance) return "avance";
  if (points >= SEUILS_NIVEAUX.intermediaire) return "intermediaire";
  return "debutant";
}

export function bddLireUn(db: DatabaseSync, sql: string, ...params: unknown[]): LigneBDD | undefined {
  return (db.prepare(sql).get(...params) as LigneBDD | undefined) ?? undefined;
}

export function bddLireTous(db: DatabaseSync, sql: string, ...params: unknown[]): LigneBDD[] {
  return (db.prepare(sql).all(...params) as LigneBDD[]) ?? [];
}

export function authentifierUtilisateur(db: DatabaseSync, req: NextRequest): LigneBDD | undefined {
  const auth = req.headers.get("authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return undefined;
  const token = auth.slice(7).trim();
  return bddLireUn(db, `SELECT u.* FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token=?`, token);
}

export function exigerRole(
  db: DatabaseSync,
  req: NextRequest,
  minRole: string
): { user?: LigneBDD; error?: NextResponse } {
  const user = authentifierUtilisateur(db, req);
  if (!user) return { error: reponseJson(401, { ok: false, error: "Authentification requise." }) };
  if ((RANG_ROLES[String(user.role)] ?? -1) < (RANG_ROLES[minRole] ?? 99)) {
    return { error: reponseJson(403, { ok: false, error: "Accès refusé pour ce rôle." }) };
  }
  return { user };
}

export function enregistrerAction(db: DatabaseSync, userId: number, actionType: string, details = ""): void {
  db.prepare("INSERT INTO user_actions(user_id,action_type,details,created_at) VALUES(?,?,?,?)").run(
    userId,
    actionType,
    details,
    dateIsoActuelle()
  );
}

export function attribuerPoints(
  db: DatabaseSync,
  user: LigneBDD,
  pointsToAdd: number,
  incrementAccess: boolean,
  incrementActions: boolean
): LigneBDD {
  const points = Number(user.points ?? 0) + pointsToAdd;
  const level = niveauDepuisPoints(points);
  let role = String(user.role);
  if (level === "expert") role = "administrateur";
  else if (level === "avance" && role === "simple") role = "complexe";
  const accessCount = Number(user.access_count ?? 0) + (incrementAccess ? 1 : 0);
  const actionsCount = Number(user.actions_count ?? 0) + (incrementActions ? 1 : 0);
  db.prepare(
    `UPDATE users SET points=?, level=?, role=?, access_count=?, actions_count=?, updated_at=? WHERE id=?`
  ).run(points, level, role, accessCount, actionsCount, dateIsoActuelle(), user.id);
  return bddLireUn(db, "SELECT * FROM users WHERE id=?", user.id as number) as LigneBDD;
}

export async function lireCorps(req: NextRequest): Promise<Record<string, unknown>> {
  try {
    return (await req.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export function cheminRoute(parts: string[]): string {
  return `/${parts.join("/")}`;
}
