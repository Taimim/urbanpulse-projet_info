# Projet ING1 – Plateforme intelligente (Next.js full stack)

Ce dépôt contient une plateforme web complète conforme au sujet **Projet ING1 Dev Web 25-26** :
- Frontend + Backend : **Next.js 16 (TypeScript, App Router + API Routes)**
- Base de données réelle : **SQLite**

## Structure du dépôt

- `interface_front_end/` : application Next.js (UI + API)
- `arriere-plan_back_end/` : base SQLite (`backend.db`), backups et exports
- `docs/` : documents de conformité PDF et préparation soutenance
- `Projet ING1 Dev Web 25 26.pdf` : cahier des charges officiel

## Lancement rapide (recommandé)

```bash
python .\run_site.py
```

Le script lance automatiquement Next.js (frontend + API) et ouvre le navigateur.

## Lancement

```bash
cd .\interface_front_end
npm install
npm run dev
```

Application : `http://localhost:3000`  
API : `http://localhost:3000/api`

## Documentation projet

Voir le dossier `docs/` :
- `docs/README.md` : index des documents
- `docs/conformite_pdf.md` : matrice de conformité PDF
- `docs/rapport_guide.md` : guide de rédaction du rapport (15 pages max)
- `docs/soutenance_preparation.md` : plan de soutenance (20 min max)
- `docs/gestion_projet_scrum.md` : organisation projet (SCRUM + Gantt)
