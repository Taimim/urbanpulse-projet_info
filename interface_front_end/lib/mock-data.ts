export type NavItem = {
  label: string;
  href: string;
};

export type Stat = {
  label: string;
  value: string;
};

export type TableColumn<T> = {
  key: keyof T;
  label: string;
};

export const navigationGroups: Array<{ title: string; items: NavItem[] }> = [
  {
    title: "Navigation publique",
    items: [
      { label: "Authentification", href: "/authentification" }
    ]
  }
];

export const homeStats: Stat[] = [
  { label: "Membres actifs", value: "5" },
  { label: "Objets connectés", value: "5" },
  { label: "Rapports ouverts", value: "3" }
];

export const freeTourCards = [
  { title: "Actualités locales", description: "Événements, marchés, concerts et annonces de quartier à Cergy." },
  { title: "Lieux d'intérêt", description: "Parcs, bibliothèques, espaces culturels et services publics de Cergy." },
  { title: "Transports", description: "Horaires et localisation des lignes de RER, bus et navettes de Cergy." }
];

export const informationModuleChecklist = [
  "Free tour disponible sans connexion",
  "Recherche avec au moins deux filtres",
  "Inscription proposée depuis l'interface publique"
];

export const searchFilters = ["Mot-clé", "Catégorie", "Statut", "Ville"];

export const publicSearchExamples = [
  {
    nom: "Parc du Peuple de l'Herbe",
    type: "Lieu d'intérêt",
    ville: "Cergy le Haut",
    statut: "Ouvert"
  },
  {
    nom: "Cinéma Gaumont Cergy",
    type: "Cinéma",
    ville: "Cergy le Haut",
    statut: "Ouvert"
  },
  {
    nom: "Les 12 Colonnes",
    type: "Art public",
    ville: "Cergy Saint-Christophe",
    statut: "Accessible"
  },
  {
    nom: "Centre Commercial des 3 Fontaines",
    type: "Commerce",
    ville: "Cergy Préfecture",
    statut: "Ouvert"
  }
];

export const authOptions = [
  "Se connecter avec email",
  "Créer un compte",
  "Réinitialiser le mot de passe",
  "Vérification à deux facteurs"
];

export const registrationFlow = [
  "Vérification de l'appartenance à la plateforme",
  "Envoi d'un email de validation",
  "Validation de l'inscription",
  "Connexion avec contrôle login / mot de passe"
];

export const dashboardStats: Stat[] = [
  { label: "Activité hebdomadaire", value: "18 actions" },
  { label: "Niveau actuel", value: "Intermédiaire" },
  { label: "Solde de points", value: "620 pts" }
];

export const profileDetails = {
  login: "sofia.amari",
  fullName: "Sofia Amari",
  role: "Utilisateur",
  age: "24",
  genre: "Femme",
  birthDate: "2001-03-15",
  city: "Cergy",
  memberType: "Résidente",
  photo: "https://placehold.co/96x96",
  firstName: "Sofia",
  lastName: "Amari",
  bio: "Passionnée par les services urbains connectés et la mobilité durable."
};

export const memberColumns: TableColumn<(typeof members)[number]>[] = [
  { key: "name", label: "Nom" },
  { key: "role", label: "Rôle" },
  { key: "status", label: "Statut" }
];

export const members = [
  { name: "Isabelle Renard", role: "Administrateur", status: "Actif" },
  { name: "Marc Moulin", role: "Gestionnaire", status: "Actif" },
  { name: "Sofia Amari", role: "Utilisateur", status: "Actif" },
  { name: "Karim Benali", role: "Utilisateur", status: "Actif" },
  { name: "Lucie Petit", role: "Utilisateur", status: "Actif" }
];

export const itemsServices = [
  { title: "Vélo en libre-service", category: "Mobilité", status: "En ligne" },
  { title: "Alerte qualité de l'air", category: "Environnement", status: "En ligne" },
  { title: "Surveillance de quartier", category: "Sécurité", status: "En ligne" }
];

export const connectedObjects = [
  {
    id: "CAP-AIR-001",
    nom: "Capteur Air Préfecture",
    type: "capteur",
    marque: "Bosch",
    etat: "Actif",
    connectivite: "Wi-Fi (signal fort)",
    energie: "Secteur",
    capteur: "Qualité air : Bonne",
    usage: "Mode automatique",
    derniereInteraction: "Aujourd'hui 08:30"
  },
  {
    id: "CAM-GAR-001",
    nom: "Caméra Gare Cergy",
    type: "camera",
    marque: "Axis",
    etat: "Actif",
    connectivite: "Wi-Fi (signal fort)",
    energie: "Secteur",
    capteur: "Détection mouvement ON",
    usage: "Surveillance continue",
    derniereInteraction: "Aujourd'hui 09:15"
  }
];

export const levelProgress = [
  { level: "Débutant", points: "0 - 499" },
  { level: "Intermédiaire", points: "500 - 1 499" },
  { level: "Avancé", points: "1 500 - 2 999" },
  { level: "Expert", points: "3 000+" }
];

export const levelRules = [
  { action: "Connexion", points: "+0.25 pt" },
  { action: "Consultation objet/service", points: "+0.50 pt" },
  { action: "Mise à jour profil", points: "+0.20 pt" }
];

export const userTracking = [
  { metric: "Nombre d'accès", value: "27" },
  { metric: "Nombre d'actions", value: "64" },
  { metric: "Dernière mise à jour", value: "2026-04-20 14:35" }
];

export const managementItems = [
  { item: "CAP-AIR-001", owner: "Exploitation", health: "Bon" },
  { item: "THER-UNI-001", owner: "Maintenance", health: "À vérifier" },
  { item: "CAM-GAR-001", owner: "Sécurité", health: "Bon" }
];

export const managementObjectActions = [
  "Ajouter un objet connecté",
  "Modifier attributs et paramètres",
  "Demander suppression à l'administrateur",
  "Activer / désactiver un objet"
];

export const managementServiceConfig = [
  { zone: "Préfecture de Cergy", objet: "Capteur Air Préfecture", reglage: "Seuil alerte PM2.5 : 25 µg/m³" },
  { zone: "Gare Cergy-le-Haut", objet: "Caméra Gare Cergy", reglage: "Détection mouvement renforcée" },
  { zone: "Université CY Cergy", objet: "Thermostat Université", reglage: "Température cible 21°C" }
];

export const managementReports = [
  { report: "Vue d'ensemble des usages", date: "2026-04-03", status: "Publié" },
  { report: "Synthèse maintenance", date: "2026-04-10", status: "Brouillon" },
  { report: "Analyse des incidents", date: "2026-04-18", status: "Publié" }
];

export const resourceMonitoring = [
  { indicateur: "Consommation énergétique hebdo", valeur: "38 kWh", tendance: "↘ -6%" },
  { indicateur: "Objets inefficaces détectés", valeur: "1", tendance: "Stable" },
  { indicateur: "Maintenances requises", valeur: "2", tendance: "↗ +1" }
];

export const adminUsers = [
  { username: "admin", role: "Administrateur", state: "Activé" },
  { username: "marc.moulin", role: "Gestionnaire", state: "Activé" },
  { username: "sofia.amari", role: "Utilisateur", state: "Activé" },
  { username: "karim.benali", role: "Utilisateur", state: "Activé" },
  { username: "lucie.petit", role: "Utilisateur", state: "Activé" }
];

export const adminCategories = ["Énergie", "Environnement", "Mobilité", "Sécurité"];

export const adminUserActions = [
  "Ajouter, modifier, supprimer des utilisateurs",
  "Attribuer ou révoquer les niveaux d'accès",
  "Ajuster manuellement les niveaux selon les points",
  "Consulter les historiques de connexion et d'actions"
];

export const adminRules = [
  "Les objets hors ligne pendant 24h déclenchent un ticket de maintenance.",
  "Les rapports nécessitent une validation gestionnaire avant publication.",
  "Les changements de rôle sont historisés et audités."
];

export const adminCustomization = [
  { setting: "Thème", value: "Bleu océan" },
  { setting: "Langue", value: "Français / Anglais" },
  { setting: "Densité du tableau de bord", value: "Confortable" }
];

export const adminSecurityMaintenance = [
  "Mise à jour des mots de passe administrateurs",
  "Vérification d'intégrité des données",
  "Plan de sauvegarde régulier de la base",
  "Alertes globales de surconsommation"
];

export const adminReports = [
  { title: "Activité utilisateur", format: "PDF" },
  { title: "État de l'inventaire", format: "CSV" },
  { title: "Audit de gouvernance", format: "PDF" }
];

export const frontendCompliancePoints = [
  "Module Information: free tour, recherche multi-filtres, inscription visible",
  "Module Visualisation: dashboard utilisateur, profil, membres, objets/services, niveaux/points",
  "Module Gestion: inventaire objets, configuration services, rapports et optimisation",
  "Module Administration: utilisateurs, catégories, règles globales, personnalisation, exports",
  "Responsive: grilles fluides, navigation adaptable, tables scrollables sur petits écrans",
  "Accessibilité: structure sémantique, skip-link, focus visibles, légendes de tableaux"
];
