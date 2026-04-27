package com.tonprojet.repository;  // ⚠️ CHANGE CE PACKAGE

import com.tonprojet.model.Utilisateur;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface UtilisateurRepository extends JpaRepository<Utilisateur, Long> {
    Optional<Utilisateur> findByEmail(String email);
    Optional<Utilisateur> findByToken(String token);
    boolean existsByEmail(String email);
}
