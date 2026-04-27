package com.tonprojet.services;  // ⚠️ CHANGE CE PACKAGE

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    // ⚠️ CHANGE CES VALEURS
    private static final String EMAIL_EXPEDITEUR = "Mon App <ton_email@gmail.com>";
    private static final String BASE_URL = "http://localhost:8080";

    public void envoyerEmailConfirmation(String destinataire, String prenom, String token) {
        new Thread(() -> {
            try {
                String lien = BASE_URL + "/verification?token=" + token;
                String corps = "Bonjour " + prenom + ",\n\n" +
                        "Cliquez sur ce lien pour valider votre compte :\n" + lien + "\n\n" +
                        "À bientôt !";

                SimpleMailMessage message = new SimpleMailMessage();
                message.setTo(destinataire);
                message.setSubject("Confirmation d'inscription");
                message.setText(corps);
                message.setFrom(EMAIL_EXPEDITEUR);
                mailSender.send(message);
            } catch (Exception e) {
                System.err.println("❌ Erreur envoi email : " + e.getMessage());
            }
        }).start();
    }

    public void envoyerEmailResetPassword(String destinataire, String prenom, String token) {
        new Thread(() -> {
            try {
                String lien = BASE_URL + "/reinitialisation?token=" + token;
                String corps = "Bonjour " + prenom + ",\n\n" +
                        "Cliquez ici pour réinitialiser votre mot de passe :\n" + lien;

                SimpleMailMessage message = new SimpleMailMessage();
                message.setTo(destinataire);
                message.setSubject("Réinitialisation mot de passe");
                message.setText(corps);
                message.setFrom(EMAIL_EXPEDITEUR);
                mailSender.send(message);
            } catch (Exception e) {
                System.err.println("❌ Erreur envoi email : " + e.getMessage());
            }
        }).start();
    }
}
