# 📧 Vérification Email - Spring Boot

Guide rapide pour ajouter la vérification d'email à ton projet Spring Boot.

---

## 1️⃣ Dépendance Maven (pom.xml)

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-mail</artifactId>
</dependency>
```

---

## 2️⃣ Configuration (application.properties)

```properties
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=TON_EMAIL@gmail.com
spring.mail.password=TON_MOT_DE_PASSE_APPLICATION
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
```

### Comment obtenir le mot de passe Gmail :
1. Va sur https://myaccount.google.com/security
2. Active la "Vérification en 2 étapes"
3. Va dans "Mots de passe des applications"
4. Génère un mot de passe → copie les 16 caractères

---

## 3️⃣ Table SQL

```sql
CREATE TABLE Utilisateur (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nom VARCHAR(50),
    prenom VARCHAR(50),
    email VARCHAR(191) UNIQUE,
    motDePasse VARCHAR(255),
    token VARCHAR(255),              -- Token de vérification
    verifie BOOLEAN DEFAULT FALSE    -- FALSE = non vérifié
);
```

Si tu as déjà la table :
```sql
ALTER TABLE Utilisateur ADD COLUMN token VARCHAR(255);
ALTER TABLE Utilisateur ADD COLUMN verifie BOOLEAN DEFAULT FALSE;
```

---

## 4️⃣ Fichiers Java à copier

Copie les 4 fichiers `.java` de ce dossier dans ton projet :

| Fichier | Destination |
|---------|-------------|
| `EmailService.java` | `src/main/java/com/tonprojet/services/` |
| `Utilisateur.java` | `src/main/java/com/tonprojet/model/` |
| `UtilisateurRepository.java` | `src/main/java/com/tonprojet/repository/` |
| `InscriptionController.java` | `src/main/java/com/tonprojet/controller/` |

⚠️ **N'oublie pas de changer les `package` en haut de chaque fichier !**

---

## 5️⃣ Fonctionnement

```
Inscription → Token UUID généré → Email envoyé → Clic sur lien → verifie = true → Connexion OK
```

---

## 🔧 Personnalisation

Dans `EmailService.java`, change :
- `EMAIL_EXPEDITEUR` : ton email
- `BASE_URL` : ton domaine (ou localhost:8080)

---

## ✅ C'est tout !

L'utilisateur recevra un email avec un lien comme :
```
http://localhost:8080/verification?token=abc123-def456-...
```
