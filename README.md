# Sécurité Taxis-Motos — Registre syndical

## Déploiement (GitHub mobile → Vercel, comme d'habitude)

1. Créez un nouveau repo GitHub, poussez ce dossier dedans.
2. Importez le repo dans Vercel.
3. Dans Vercel → Settings → Environment Variables, ajoutez les deux valeurs
   du fichier `.env.example` (`NEXT_PUBLIC_SUPABASE_URL` et
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
4. Déployez.

## Créer votre compte admin (à faire une seule fois)

1. Ouvrez l'app déployée → **Demander un accès** → créez votre compte avec
   votre propre email.
2. Dans le dashboard Supabase → **Table Editor** → table `profiles`, trouvez
   la ligne avec votre email/nom, et modifiez :
   - `role` → `admin`
   - `actif` → `true`
3. Reconnectez-vous : vous avez maintenant les onglets Gares et Agents.

## Ce qui est déjà en place

- Inscription / connexion (email + mot de passe)
- Comptes créés inactifs par défaut — un admin doit activer chaque agent et
  lui assigner une gare
- Formulaire d'enregistrement chauffeur + moto (statut "en attente" à la
  création)
- File de validation pour responsables (leur gare) et admin (toutes gares) —
  Valider / Rejeter
- Gestion des gares et des comptes (admin)
- QR code généré automatiquement pour chaque fiche

## Prochaines étapes possibles

- Upload de photos (chauffeur, moto, pièces d'identité)
- Intégration Traccar + boîtiers GPS (Phase 3 du dossier technique)
- Alertes SMS en cas de vol confirmé
