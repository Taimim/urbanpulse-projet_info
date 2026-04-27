# Préparation soutenance (20 minutes max)

## Objectif
Présenter rapidement le rapport, puis démontrer le site en direct de manière fluide.

## Plan conseillé (20 min)

### 0:00 – 2:00 | Introduction
- Présenter le thème choisi.
- Présenter l’objectif : plateforme intelligente complète.
- Rappeler stack technique : Next.js + API routes + SQLite.

### 2:00 – 4:00 | Organisation projet
- Méthode SCRUM utilisée.
- Répartition des tâches + Gantt.
- Outil collaboratif utilisé (Trello/Jira/Notion).

### 4:00 – 15:00 | Démo live du site
Suivre cet ordre :
1. Module Information (visiteur)
   - free tour
   - recherche 2 filtres
2. Auth/Visualisation
   - inscription membre
   - validation
   - connexion
   - profil + membres + niveaux/points
3. Gestion
   - ajout objet
   - modification/toggle
   - demande suppression
   - génération de données aléatoires
4. Administration
   - utilisateurs (roles/points/suppression)
   - catégories/règles
   - backup/intégrité/export
   - rapports globaux

### 15:00 – 18:00 | Conformité PDF
- Montrer la matrice `docs/conformite_pdf.md`.
- Expliquer que les exigences fonctionnelles sont couvertes.
- Mentionner les tests réalisés (lint/build/API).

### 18:00 – 20:00 | Conclusion
- Résumer les points forts.
- Donner 2-3 perspectives d’amélioration.
- Ouvrir sur questions du jury.

## Checklist avant passage
- [ ] `npm run dev` fonctionne dans `interface_front_end`.
- [ ] API up sur `http://localhost:3000/api/health`.
- [ ] Frontend accessible.
- [ ] Données démo prêtes (utilisateur admin connu).
- [ ] Captures de secours disponibles si bug projecteur/réseau.

## Script court d’intro (exemple)
« Notre projet implémente une plateforme intelligente conforme au cahier des charges ING1.  
Nous avons réalisé les 4 modules demandés, avec gestion des rôles, système de niveaux/points, base de données réelle, et une interface responsive accessible. »

