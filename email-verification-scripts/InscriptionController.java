package com.tonprojet.controller;  // ⚠️ CHANGE CE PACKAGE

import com.tonprojet.model.Utilisateur;
import com.tonprojet.repository.UtilisateurRepository;
import com.tonprojet.services.EmailService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import java.util.Optional;
import java.util.UUID;

@Controller
public class InscriptionController {

    @Autowired
    private UtilisateurRepository utilisateurRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @GetMapping("/inscription")
    public String afficherInscription(Model model) {
        model.addAttribute("utilisateur", new Utilisateur());
        return "inscription";
    }

    @PostMapping("/inscription")
    public String enregistrerUtilisateur(@ModelAttribute("utilisateur") Utilisateur utilisateur, Model model) {
        try {
            // Hash mot de passe
            utilisateur.setMotDePasse(passwordEncoder.encode(utilisateur.getMotDePasse()));
            
            // Génère token + verifie = false
            String token = UUID.randomUUID().toString();
            utilisateur.setToken(token);
            utilisateur.setVerifie(false);

            utilisateurRepository.save(utilisateur);

            // Envoie email
            emailService.envoyerEmailConfirmation(utilisateur.getEmail(), utilisateur.getPrenom(), token);

            model.addAttribute("success", "Un email de confirmation a été envoyé !");
            return "inscription";
        } catch (DataIntegrityViolationException e) {
            model.addAttribute("erreur", "Cet email est déjà utilisé !");
            return "inscription";
        }
    }

    @GetMapping("/verification")
    public String verifierToken(@RequestParam("token") String token, Model model) {
        Optional<Utilisateur> user = utilisateurRepository.findByToken(token);

        if (user.isPresent()) {
            Utilisateur u = user.get();
            u.setVerifie(true);
            u.setToken(null);
            utilisateurRepository.save(u);
            model.addAttribute("message", "✅ Compte vérifié ! Vous pouvez vous connecter.");
        } else {
            model.addAttribute("message", "❌ Lien invalide ou expiré.");
        }
        return "verification";  // Crée cette page HTML
    }
}
