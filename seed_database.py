"""
Script de réinitialisation de la base de données UrbanPulse.
Efface toutes les données existantes et insère les nouvelles données cohérentes.

Dépendance : pip install bcrypt
"""
import sqlite3
import os
import bcrypt
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), "arriere-plan_back_end", "backend.db")
NOW = datetime.now().isoformat()


def hash_pw(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def run():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    # --- Créer la table service_configurations si elle n'existe pas ---
    c.execute("""
        CREATE TABLE IF NOT EXISTS service_configurations (
            id      INTEGER PRIMARY KEY AUTOINCREMENT,
            zone    TEXT NOT NULL,
            object_id  INTEGER REFERENCES objects(id) ON DELETE SET NULL,
            service_id INTEGER REFERENCES services(id) ON DELETE SET NULL,
            reglage TEXT NOT NULL
        )
    """)

    # --- Ajouter la colonne newly_validated si elle n'existe pas ---
    try:
        c.execute("ALTER TABLE users ADD COLUMN newly_validated INTEGER DEFAULT 0")
    except Exception:
        pass

    # --- Vider les tables dans l'ordre (clés étrangères) ---
    tables = [
        "service_configurations",
        "user_actions", "deletion_requests", "sessions",
        "validation_tokens", "objects", "services", "categories",
        "rules", "public_info", "allowed_members", "users"
    ]
    for t in tables:
        c.execute(f"DELETE FROM {t}")

    # --- Réinitialiser les séquences auto-increment ---
    for t in tables:
        c.execute(f"DELETE FROM sqlite_sequence WHERE name='{t}'")

    # --- Catégories ---
    categories = [
        ("Énergie", "objet"),
        ("Environnement", "objet"),
        ("Mobilité", "service"),
        ("Sécurité", "objet"),
    ]
    c.executemany("INSERT INTO categories(name, category_type) VALUES(?, ?)", categories)

    # --- Services ---
    # category_id : 1=Énergie, 2=Environnement, 3=Mobilité, 4=Sécurité
    services = [
        ("Vélo en libre-service", "Stations de vélos partagés dans tout Cergy.", 3, "Actif"),
        ("Alerte qualité de l'air", "Notifications en temps réel sur la qualité de l'air à Cergy.", 2, "Actif"),
        ("Gestion énergie bâtiment", "Suivi et optimisation de la consommation énergétique des bâtiments publics.", 1, "En ligne"),
        ("Surveillance de quartier", "Réseau de caméras et capteurs pour la sécurité des quartiers.", 4, "Actif"),
        ("Éclairage public", "Gestion intelligente de l'éclairage public sur le territoire de Cergy.", 1, "Actif"),
    ]
    c.executemany(
        "INSERT INTO services(name, description, category_id, status) VALUES(?, ?, ?, ?)",
        services
    )

    # --- Règles ---
    rules = [
        ("Maintenance automatique", "Les objets hors ligne pendant 24h déclenchent un ticket de maintenance.", 1),
        ("Validation des rapports", "Les rapports nécessitent une validation gestionnaire avant publication.", 1),
        ("Audit des rôles", "Les changements de rôle sont historisés et audités.", 1),
    ]
    c.executemany(
        "INSERT INTO rules(title, description, is_active) VALUES(?, ?, ?)",
        rules
    )

    # --- Informations publiques (free tour) ---
    public_info = [
        # Cergy le Haut
        ("Parc du Peuple de l'Herbe",         "Lieu d'intérêt",  "Cergy le Haut",          "Ouvert",
         "Grand parc naturel en bord d'Oise, idéal pour les promenades et activités de plein air."),
        ("Gare de Cergy-le-Haut",             "Transport",        "Cergy le Haut",          "Temps réel disponible",
         "Terminus du RER A, dessert Paris en 40 minutes avec un trafic en temps réel."),
        ("Base de Loisirs de Cergy-Pontoise", "Lieu d'intérêt",  "Cergy le Haut",          "Ouvert",
         "Site de loisirs aquatiques et sportifs sur 300 hectares autour du lac."),
        ("Cinéma Gaumont Cergy",              "Cinéma",           "Cergy le Haut",          "Ouvert",
         "Multiplexe Gaumont avec 14 salles, situé à proximité immédiate de la gare Cergy-le-Haut."),
        ("Espace Nautique de Cergy",          "Sport",            "Cergy le Haut",          "Ouvert",
         "Complexe aquatique avec piscines intérieure et extérieure, toboggan et bassin sportif."),
        # Cergy Saint-Christophe
        ("Marché de Cergy Saint-Christophe",  "Événement local",  "Cergy Saint-Christophe", "Ce week-end",
         "Marché hebdomadaire avec producteurs locaux, fruits, légumes et artisanat."),
        ("Collégiale Saint-Christophe",       "Lieu d'intérêt",  "Cergy Saint-Christophe", "Ouvert",
         "Église historique du XIIe siècle classée monument historique, au cœur de Cergy."),
        ("Les 12 Colonnes",                   "Art public",       "Cergy Saint-Christophe", "Accessible",
         "Œuvre monumentale de Dani Karavan, point de repère emblématique de l'Axe Majeur de Cergy."),
        ("Place des Arts",                    "Lieu d'intérêt",  "Cergy Saint-Christophe", "Ouvert",
         "Esplanade centrale de Cergy Saint-Christophe, entourée de commerces et de restaurants."),
        # Cergy Préfecture
        ("Centre Commercial des 3 Fontaines", "Commerce",         "Cergy Préfecture",       "Ouvert",
         "Grand centre commercial avec plus de 130 enseignes, restaurants et cinéma, au cœur de Cergy."),
        ("Préfecture du Val-d'Oise",          "Administration",   "Cergy Préfecture",       "Ouvert",
         "Bâtiment administratif officiel du département du Val-d'Oise, accessible en semaine."),
        ("Hôtel de Ville de Cergy",           "Administration",   "Cergy Préfecture",       "Ouvert",
         "Mairie principale de Cergy, services aux habitants et démarches administratives."),
        ("CY Tech",                           "Enseignement",     "Cergy Préfecture",       "Accès public",
         "École d'ingénieurs et université polytechnique, campus principal à Cergy."),
        ("ESSEC Business School",             "Enseignement",     "Cergy Préfecture",       "Accès limité",
         "Grande école de commerce internationale, campus principal basé à Cergy."),
    ]
    c.executemany(
        "INSERT INTO public_info(title, info_type, city, status, description) VALUES(?, ?, ?, ?, ?)",
        public_info
    )

    # --- Membres autorisés (habitants de Cergy) ---
    allowed = [
        # Comptes existants
        ("admin",),
        ("marc.moulin",),
        ("sofia.amari",),
        ("karim.benali",),
        ("lucie.petit",),
        ("thomas.dupont",),
        ("emma.leblanc",),
        ("nicolas.martin",),
        ("alice.bernard",),
        ("pierre.thomas",),
        ("julie.garcia",),
        ("antoine.roux",),
        ("sarah.michel",),
        ("maxime.lefevre",),
        ("camille.simon",),
        # Nouveaux habitants de Cergy
        ("jean.lambert",),
        ("marie.fontaine",),
        ("david.chevalier",),
        ("claire.moreau",),
        ("hugo.girard",),
        ("lea.bonnet",),
        ("vincent.henry",),
        ("manon.rousseau",),
        ("alexis.morel",),
        ("pauline.fournier",),
        ("romain.giraud",),
        ("jessica.lemaire",),
        ("stephane.renard",),
        ("nathalie.dumont",),
        ("kevin.perrot",),
        ("aurelie.blanchard",),
        ("christophe.maillard",),
        ("isabelle.guerin",),
        ("sebastien.faure",),
        ("veronique.legrand",),
        ("florian.masson",),
        ("sandrine.marchand",),
        ("olivier.broussard",),
        ("agnes.carpentier",),
        ("julien.bourgeois",),
        ("emilie.lacroix",),
        ("mehdi.bensalem",),
        ("fatima.ouali",),
        ("youssef.hamdi",),
        ("nadia.khalil",),
        ("rafael.santos",),
        ("diana.costa",),
        ("luca.ferrari",),
        ("amina.traore",),
        ("ibrahim.diallo",),
        ("chloé.vasseur",),
        ("baptiste.perrin",),
        ("margot.aubert",),
        ("quentin.jacquot",),
        ("laetitia.bouchard",),
    ]
    c.executemany("INSERT INTO allowed_members(login) VALUES(?)", allowed)

    # --- Utilisateurs ---
    users = [
        (
            "admin", "admin@urbanpulse.fr", hash_pw("admin123"),
            "administrateur", "expert", 4200,
            1, 1,
            38, "Femme", "1987-06-22", "Administratrice",
            "https://placehold.co/96x96", "Isabelle", "Renard",
            NOW, NOW, 120, 340
        ),
        (
            "marc.moulin", "marc.moulin@urbanpulse.fr", hash_pw("marc123"),
            "complexe", "avance", 1650,
            1, 1,
            31, "Homme", "1994-11-08", "Gestionnaire",
            "https://placehold.co/96x96", "Marc", "Moulin",
            NOW, NOW, 45, 112
        ),
        (
            "sofia.amari", "sofia.amari@urbanpulse.fr", hash_pw("sofia123"),
            "simple", "intermediaire", 620,
            1, 1,
            24, "Femme", "2001-03-15", "Résidente",
            "https://placehold.co/96x96", "Sofia", "Amari",
            NOW, NOW, 27, 64
        ),
        (
            "karim.benali", "karim.benali@urbanpulse.fr", hash_pw("karim123"),
            "simple", "debutant", 120,
            1, 1,
            29, "Homme", "1996-07-04", "Résident",
            "https://placehold.co/96x96", "Karim", "Benali",
            NOW, NOW, 8, 18
        ),
        (
            "lucie.petit", "lucie.petit@urbanpulse.fr", hash_pw("lucie123"),
            "simple", "intermediaire", 800,
            1, 1,
            26, "Femme", "1999-12-20", "Résidente",
            "https://placehold.co/96x96", "Lucie", "Petit",
            NOW, NOW, 33, 78
        ),
        (
            "thomas.dupont", "thomas.dupont@urbanpulse.fr", hash_pw("thomas123"),
            "simple", "debutant", 45,
            1, 1,
            22, "Homme", "2003-05-14", "Résident",
            "https://placehold.co/96x96", "Thomas", "Dupont",
            NOW, NOW, 3, 7
        ),
        (
            "emma.leblanc", "emma.leblanc@urbanpulse.fr", hash_pw("emma123"),
            "simple", "debutant", 89,
            1, 1,
            20, "Femme", "2005-08-22", "Résidente",
            "https://placehold.co/96x96", "Emma", "Leblanc",
            NOW, NOW, 6, 12
        ),
        (
            "nicolas.martin", "nicolas.martin@urbanpulse.fr", hash_pw("nicolas123"),
            "simple", "debutant", 210,
            1, 1,
            34, "Homme", "1991-03-30", "Résident",
            "https://placehold.co/96x96", "Nicolas", "Martin",
            NOW, NOW, 14, 31
        ),
        (
            "alice.bernard", "alice.bernard@urbanpulse.fr", hash_pw("alice123"),
            "simple", "debutant", 55,
            1, 1,
            28, "Femme", "1997-11-05", "Résidente",
            "https://placehold.co/96x96", "Alice", "Bernard",
            NOW, NOW, 4, 9
        ),
        (
            "pierre.thomas", "pierre.thomas@urbanpulse.fr", hash_pw("pierre123"),
            "simple", "debutant", 330,
            1, 1,
            40, "Homme", "1985-07-19", "Résident",
            "https://placehold.co/96x96", "Pierre", "Thomas",
            NOW, NOW, 21, 48
        ),
        (
            "julie.garcia", "julie.garcia@urbanpulse.fr", hash_pw("julie123"),
            "simple", "debutant", 175,
            1, 1,
            25, "Femme", "2000-02-14", "Résidente",
            "https://placehold.co/96x96", "Julie", "Garcia",
            NOW, NOW, 11, 25
        ),
        (
            "antoine.roux", "antoine.roux@urbanpulse.fr", hash_pw("antoine123"),
            "simple", "debutant", 60,
            1, 1,
            33, "Homme", "1992-09-08", "Résident",
            "https://placehold.co/96x96", "Antoine", "Roux",
            NOW, NOW, 4, 10
        ),
        (
            "sarah.michel", "sarah.michel@urbanpulse.fr", hash_pw("sarah123"),
            "simple", "debutant", 420,
            1, 1,
            30, "Femme", "1995-06-27", "Résidente",
            "https://placehold.co/96x96", "Sarah", "Michel",
            NOW, NOW, 28, 55
        ),
        (
            "maxime.lefevre", "maxime.lefevre@urbanpulse.fr", hash_pw("maxime123"),
            "simple", "debutant", 95,
            1, 1,
            27, "Homme", "1998-12-03", "Résident",
            "https://placehold.co/96x96", "Maxime", "Lefèvre",
            NOW, NOW, 7, 15
        ),
        (
            "camille.simon", "camille.simon@urbanpulse.fr", hash_pw("camille123"),
            "simple", "debutant", 280,
            1, 1,
            23, "Femme", "2002-04-11", "Résidente",
            "https://placehold.co/96x96", "Camille", "Simon",
            NOW, NOW, 18, 40
        ),
    ]
    c.executemany(
        """INSERT INTO users(
            login, email, password, role, level, points,
            is_member, is_validated,
            age, genre, birth_date, member_type, photo_url,
            first_name, last_name, created_at, updated_at,
            access_count, actions_count
        ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
        users
    )

    # --- Objets connectés (10, Cergy) ---
    objects = [
        (
            "CAP-AIR-001", "Capteur Air Préfecture",
            "Capteur de qualité de l'air installé devant la préfecture de Cergy.",
            "Bosch", "capteur", "Actif", "Préfecture de Cergy",
            None, None, "Automatique", "Wi-Fi fort", "Secteur", 1.2, NOW
        ),
        (
            "LUM-AXE-001", "Lampadaire LED Axe Majeur",
            "Lampadaire intelligent sur l'Axe Majeur de Cergy.",
            "Philips", "lumiere", "Actif", "Axe Majeur de Cergy",
            None, None, "Automatique", "Wi-Fi fort", "Secteur", 0.8, NOW
        ),
        (
            "CAM-GAR-001", "Caméra Gare Cergy",
            "Caméra de surveillance à l'entrée de la gare de Cergy-le-Haut.",
            "Axis", "camera", "Actif", "Gare de Cergy-le-Haut",
            None, None, "Surveillance continue", "Wi-Fi fort", "Secteur", 2.1, NOW
        ),
        (
            "THER-UNI-001", "Thermostat Université",
            "Thermostat connecté du bâtiment principal de l'Université CY Cergy Paris.",
            "Siemens", "thermostat", "Actif", "Université CY Cergy Paris",
            19.0, 21.0, "Eco", "Wi-Fi fort", "Secteur", 3.4, NOW
        ),
        (
            "COMP-EAU-001", "Compteur Eau Résidence",
            "Compteur d'eau intelligent de la résidence Les Hauts de Cergy.",
            "Itron", "compteur", "Inactif", "Résidence Les Hauts de Cergy",
            None, None, "Manuel", "Wi-Fi moyen", "Secteur", 0.5, NOW
        ),
        (
            "CAP-PM-002", "Capteur Particules Saint-Christophe",
            "Capteur de particules fines PM2.5/PM10 installé place de Cergy Saint-Christophe.",
            "Bosch", "capteur", "Actif", "Cergy Saint-Christophe",
            None, None, "Automatique", "Wi-Fi fort", "Secteur", 0.9, NOW
        ),
        (
            "LUM-PAR-001", "Lampadaire LED Parc de l'Herbe",
            "Lampadaire solaire intelligent dans le Parc du Peuple de l'Herbe.",
            "Philips", "lumiere", "Actif", "Parc du Peuple de l'Herbe",
            None, None, "Crépuscule", "Zigbee", "Solaire", 0.3, NOW
        ),
        (
            "SERR-BIB-001", "Serrure Bibliothèque",
            "Serrure connectée de la bibliothèque municipale de Cergy.",
            "Bosch", "serrure", "Actif", "Bibliothèque de Cergy",
            None, None, "Automatique", "Bluetooth", "Secteur", 0.1, NOW
        ),
        (
            "CAM-3F-001", "Caméra Centre Commercial 3 Fontaines",
            "Caméra de surveillance du Centre Commercial des 3 Fontaines.",
            "Axis", "camera", "Maintenance", "Centre Commercial des 3 Fontaines",
            None, None, "Surveillance continue", "Wi-Fi fort", "Secteur", 2.4, NOW
        ),
        (
            "THER-ESS-001", "Thermostat ESSEC",
            "Thermostat connecté du campus ESSEC Business School.",
            "Siemens", "thermostat", "Actif", "ESSEC Business School",
            20.5, 22.0, "Confort", "Wi-Fi fort", "Secteur", 3.1, NOW
        ),
    ]
    c.executemany(
        """INSERT INTO objects(
            unique_id, name, description, brand, object_type, status, zone,
            temperature_current, temperature_target, mode,
            connectivity, battery_state, energy_kwh, last_interaction
        ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
        objects
    )

    # --- Configurations de services ---
    service_configs = [
        ("Préfecture de Cergy",       1, 2, "Seuil alerte PM2.5 : 25 µg/m³"),
        ("Gare de Cergy-le-Haut",     3, 4, "Détection mouvement renforcée"),
        ("Université CY Cergy Paris", 4, 3, "Température cible 21°C"),
        ("Axe Majeur de Cergy",       2, 5, "Allumage automatique 19h-7h"),
    ]
    c.executemany(
        "INSERT INTO service_configurations(zone, object_id, service_id, reglage) VALUES(?, ?, ?, ?)",
        service_configs
    )

    conn.commit()
    conn.close()

    print("Base de données réinitialisée avec succès.")
    print(f"  - 15 utilisateurs insérés (5 existants + 10 simples)")
    print(f"  - 10 objets connectés (Cergy)")
    print(f"  - 4 catégories")
    print(f"  - 5 services")
    print(f"  - 3 règles")
    print(f"  - 14 informations publiques (Cergy)")
    print(f"  - Mots de passe hashés avec bcrypt")


if __name__ == "__main__":
    run()
