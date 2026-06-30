# Guide de déploiement — District Scout

Tout est gratuit. Compte ~45 minutes la première fois.

## 1. Créer le projet Supabase (base de données + auth + stockage photos)

1. Va sur supabase.com, crée un compte gratuit, puis "New project".
2. Choisis un nom, un mot de passe de base de données (note-le), et une région proche (Europe).
3. Une fois le projet créé, va dans **SQL Editor** (menu de gauche), colle tout le contenu du fichier
   `supabase/schema.sql` et clique sur "Run". Cela crée toutes les tables, la sécurité (RLS), et le
   bucket de stockage des photos.
4. Va dans **Project Settings > API**. Note les 3 valeurs suivantes, tu en auras besoin à l'étape 3 :
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ secrète, ne jamais la mettre côté client)
5. Optionnel mais recommandé : va dans **Authentication > Providers > Email** et désactive
   "Confirm email" pour simplifier les inscriptions de tes chefs (sinon ils doivent valider leur email).

## 2. Créer ton compte admin

1. Une fois le site déployé (étape 4), inscris-toi normalement avec ton email sur la page de connexion.
2. Reviens dans Supabase > **SQL Editor**, et exécute (remplace par ton email) :
   ```sql
   update profiles set role = 'admin' where email = 'tonemail@example.com';
   ```
3. Reconnecte-toi sur le site : tu as maintenant accès à Paramètres et à tous les boutons d'édition.
4. Ensuite, pour chaque chef de troupe : il s'inscrit lui-même (page "S'inscrire"), et toi tu peux le
   promouvoir admin si besoin depuis Paramètres > Comptes (sinon il reste "chef", lecture + son propre profil).

## 3. Générer les clés de notifications push

Sur ton ordinateur, dans le dossier du projet :
```bash
npm install
npx web-push generate-vapid-keys
```
Tu obtiens une clé publique et une clé privée — garde-les pour l'étape suivante.

## 4. Déployer sur Vercel

1. Crée un compte gratuit sur vercel.com (connecte-toi avec GitHub).
2. Crée un nouveau dépôt GitHub et pousse ce projet dedans :
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/TON-COMPTE/district-scout.git
   git push -u origin main
   ```
3. Sur Vercel : "Add New Project" → importe ton dépôt GitHub `district-scout`.
4. Avant de cliquer sur "Deploy", ouvre la section **Environment Variables** et ajoute toutes les
   variables du fichier `.env.example` avec tes vraies valeurs :
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (étape 1)
   - `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (étape 3, mets ton email pour SUBJECT)
   - `RESEND_API_KEY`, `EMAIL_FROM` (étape 5)
   - `CRON_SECRET` : invente une longue phrase aléatoire
5. Clique sur "Deploy". Au bout d'une minute, ton site est en ligne sur une URL `*.vercel.app`.

## 5. Activer l'envoi d'email (Resend, gratuit)

1. Crée un compte gratuit sur resend.com.
2. Dans **API Keys**, crée une clé et mets-la dans `RESEND_API_KEY` sur Vercel.
3. Par défaut tu peux envoyer depuis `onboarding@resend.dev` (limité mais fonctionnel pour démarrer).
   Pour envoyer depuis ton propre nom de domaine plus tard, suis "Domains" dans Resend.

## 6. Activer le cron des rappels automatiques

Le fichier `vercel.json` programme déjà l'envoi quotidien à 7h (heure UTC) — rien à faire de plus,
Vercel l'active automatiquement au déploiement (plan gratuit : 1 exécution/jour, suffisant ici).
Vercel ajoute lui-même le header `Authorization: Bearer <CRON_SECRET>` à l'appel, donc assure-toi
d'avoir bien renseigné `CRON_SECRET` dans les variables d'environnement (étape 4).

## 7. Installer l'appli sur les téléphones des chefs

Une fois le site en ligne (URL Vercel, ou un nom de domaine personnalisé que tu peux brancher
gratuitement dans Vercel > Settings > Domains) :
- **Android (Chrome)** : ouvrir le site → menu ⋮ → "Ajouter à l'écran d'accueil".
- **iPhone (Safari)** : ouvrir le site → bouton Partager → "Sur l'écran d'accueil".

L'icône apparaît comme une vraie appli, et les notifications de rappel fonctionnent une fois activées
depuis la page d'accueil du site (bouton "Activer les notifications").

## Pour la suite

- Modifier le contenu/textes : directement dans le code (`app/*/page.js`) puis `git push` — Vercel
  redéploie automatiquement à chaque push.
- Ajouter du contenu (agenda, documents, organigramme, photos) : tout se fait depuis le site une fois
  connecté en admin, pas besoin de toucher au code.
- Limites du plan gratuit Supabase : 500 Mo de base de données et 1 Go de stockage — largement
  suffisant pour un district. Tu seras prévenu avant d'atteindre la limite.
