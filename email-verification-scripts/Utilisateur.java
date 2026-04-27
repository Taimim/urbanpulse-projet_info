package com.tonprojet.model;  // ⚠️ CHANGE CE PACKAGE

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "Utilisateur")
public class Utilisateur {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nom;
    private String prenom;

    @Column(unique = true)
    private String email;

    private String motDePasse;

    // Champs pour la vérification email
    private String token;
    private Boolean verifie = false;

    private LocalDateTime dateInscription;

    public Utilisateur() {
        this.dateInscription = LocalDateTime.now();
        this.verifie = false;
    }

    // Getters & Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getNom() { return nom; }
    public void setNom(String nom) { this.nom = nom; }

    public String getPrenom() { return prenom; }
    public void setPrenom(String prenom) { this.prenom = prenom; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getMotDePasse() { return motDePasse; }
    public void setMotDePasse(String motDePasse) { this.motDePasse = motDePasse; }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public Boolean getVerifie() { return verifie; }
    public void setVerifie(Boolean verifie) { this.verifie = verifie; }

    public LocalDateTime getDateInscription() { return dateInscription; }
    public void setDateInscription(LocalDateTime dateInscription) { this.dateInscription = dateInscription; }
}
