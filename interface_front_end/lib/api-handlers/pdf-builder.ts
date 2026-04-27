import { PDFDocument, StandardFonts } from "pdf-lib";
import { dateLisible, LigneBDD } from "./core";

export async function genererPdfObjets(rows: LigneBDD[], dateGen: string): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const page = doc.addPage([842, 595]);
  let y = 560;
  page.drawText("UrbanPulse - Rapport objets connectes", { x: 40, y, size: 16, font: fontBold });
  y -= 24;
  page.drawText(`Genere le: ${dateGen}`, { x: 40, y, size: 10, font });
  y -= 20;
  page.drawText("ID | Nom | Statut | Energie (kWh) | Derniere interaction", { x: 40, y, size: 10, font });
  y -= 14;
  for (const r of rows) {
    if (y < 20) break;
    const line = `${r.id} | ${String(r.name ?? "")} | ${String(r.status ?? "")} | ${String(r.energy_kwh ?? "")} | ${String(r.last_interaction ?? "")}`;
    page.drawText(line.slice(0, 140), { x: 40, y, size: 9, font });
    y -= 12;
  }
  return new Uint8Array(await doc.save());
}

export async function genererPdfMembresNonInscrits(rows: LigneBDD[]): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const page = doc.addPage([595, 842]);
  let y = 790;
  page.drawText("UrbanPulse - Habitants non inscrits", { x: 40, y, size: 20, font: fontBold });
  y -= 22;
  page.drawText(`Genere le ${dateLisible()} — ${rows.length} personne(s)`, { x: 40, y, size: 10, font });
  y -= 8;
  page.drawLine({ start: { x: 40, y }, end: { x: 555, y }, thickness: 1 });
  y -= 20;
  page.drawText("Login (Prenom.Nom)", { x: 40, y, size: 11, font: fontBold });
  y -= 8;
  page.drawLine({ start: { x: 40, y }, end: { x: 555, y }, thickness: 0.5 });
  y -= 18;
  for (const r of rows) {
    if (y < 50) break;
    page.drawText(String(r.login ?? "—"), { x: 40, y, size: 11, font });
    y -= 18;
  }
  return new Uint8Array(await doc.save());
}

export async function genererPdfUtilisateurs(rows: LigneBDD[]): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const page = doc.addPage([595, 842]);
  let y = 790;
  page.drawText("UrbanPulse - Liste des utilisateurs", { x: 40, y, size: 20, font: fontBold });
  y -= 22;
  page.drawText(`Genere le ${dateLisible()}`, { x: 40, y, size: 10, font });
  y -= 8;
  page.drawLine({ start: { x: 40, y }, end: { x: 555, y }, thickness: 1 });
  y -= 20;
  page.drawText("Prenom", { x: 40, y, size: 11, font: fontBold });
  page.drawText("Nom", { x: 175, y, size: 11, font: fontBold });
  page.drawText("Age", { x: 310, y, size: 11, font: fontBold });
  page.drawText("Role", { x: 380, y, size: 11, font: fontBold });
  y -= 8;
  page.drawLine({ start: { x: 40, y }, end: { x: 555, y }, thickness: 0.5 });
  y -= 18;
  for (const u of rows) {
    if (y < 50) break;
    page.drawText(String(u.first_name ?? "—").slice(0, 22), { x: 40, y, size: 11, font });
    page.drawText(String(u.last_name ?? "—").slice(0, 22), { x: 175, y, size: 11, font });
    page.drawText(String(u.age ?? "—"), { x: 310, y, size: 11, font });
    page.drawText(String(u.role ?? "—"), { x: 380, y, size: 11, font });
    y -= 18;
  }
  return new Uint8Array(await doc.save());
}

export async function genererPdfObjetsConnectes(rows: LigneBDD[]): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const page = doc.addPage([595, 842]);
  let y = 790;
  page.drawText("UrbanPulse - Objets connectes", { x: 40, y, size: 20, font: fontBold });
  y -= 22;
  page.drawText(`Genere le ${dateLisible()}`, { x: 40, y, size: 10, font });
  y -= 8;
  page.drawLine({ start: { x: 40, y }, end: { x: 555, y }, thickness: 1 });
  y -= 20;
  page.drawText("Nom", { x: 40, y, size: 11, font: fontBold });
  page.drawText("Zone / Emplacement", { x: 175, y, size: 11, font: fontBold });
  page.drawText("kWh", { x: 420, y, size: 11, font: fontBold });
  page.drawText("Statut", { x: 470, y, size: 11, font: fontBold });
  y -= 8;
  page.drawLine({ start: { x: 40, y }, end: { x: 555, y }, thickness: 0.5 });
  y -= 18;
  for (const o of rows) {
    if (y < 50) break;
    page.drawText(String(o.name ?? "—").slice(0, 22), { x: 40, y, size: 11, font });
    page.drawText(String(o.zone ?? "—").slice(0, 30), { x: 175, y, size: 11, font });
    page.drawText(String(o.energy_kwh ?? "—"), { x: 420, y, size: 11, font });
    page.drawText(String(o.status ?? "—"), { x: 470, y, size: 11, font });
    y -= 18;
  }
  return new Uint8Array(await doc.save());
}
