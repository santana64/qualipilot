# QualiPilot

QualiPilot est une application SaaS française pour formateurs indépendants, petits organismes de formation, consultants et OF qui veulent piloter leur préparation Qualiopi/RNQ sans tableurs dispersés.

L'application aide à centraliser les preuves, suivre les 32 indicateurs RNQ, gérer les formations, produire des documents qualité, piloter les actions correctives et exporter un dossier préparatoire d'audit.

## Avertissement conformité

QualiPilot est un outil d'aide à l'organisation documentaire et au pilotage qualité. Il ne remplace pas le guide officiel du Référentiel National Qualité, un organisme certificateur, un consultant qualité ou un conseil juridique personnalisé. L'utilisation de QualiPilot ne garantit pas l'obtention ou le maintien de la certification Qualiopi.

## Stack

- Next.js App Router, TypeScript strict, TailwindCSS
- Prisma ORM 7 avec PostgreSQL
- Auth custom credentials avec bcrypt, cookie HttpOnly signé, tokens hachés
- Zod pour la validation serveur
- Stripe Checkout, portail client et webhook
- Resend ou SMTP/Nodemailer pour les emails
- Stockage local sécurisé des fichiers de preuves
- Vitest pour la logique métier
- Docker Compose pour PostgreSQL local

## Installation locale

```bash
npm install
docker compose up -d
npm run db:push
npm run db:seed
npm run dev
```

Application : `http://localhost:3000`

Compte de développement :

- Email : `demo@qualipilot.fr`
- Mot de passe : `QualiPilotDemo2026!`

## Scripts

```bash
npm run dev
npm run build
npm run typecheck
npm run test
npm run lint
npm run db:push
npm run db:migrate
npm run db:seed
```

Pour une base neuve en production :

```bash
npx prisma migrate deploy
npm run db:seed
```

## Variables d'environnement

Copiez `.env.example` vers `.env` puis adaptez :

- `DATABASE_URL`
- `AUTH_SECRET`
- `NEXT_PUBLIC_APP_URL`
- `EMAIL_FROM`
- `RESEND_API_KEY` ou `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_SECURE`
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_STARTER`, `STRIPE_PRICE_PRO`, `STRIPE_PRICE_CABINET`
- `LOCAL_FILE_STORAGE_DIR`, `MAX_EVIDENCE_UPLOAD_BYTES`
- `REMINDER_CRON_SECRET`, `ENABLE_INTERNAL_REMINDER_WORKER`
- `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_TRACES_SAMPLE_RATE`
- `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`
- `LEGAL_COMPANY_NAME`, `LEGAL_COMPANY_FORM`, `LEGAL_COMPANY_CAPITAL`, `LEGAL_COMPANY_SIREN`, `LEGAL_COMPANY_SIRET`, `LEGAL_COMPANY_ADDRESS`
- `LEGAL_PUBLISHER_NAME`, `LEGAL_HOST_NAME`, `LEGAL_HOST_ADDRESS`, `LEGAL_CONTACT_EMAIL`, `LEGAL_DPO_EMAIL`

Les services email et Stripe échouent explicitement s'ils ne sont pas configurés. L'application ne simule pas un succès d'envoi email ni un paiement.

## Stockage des fichiers

Les preuves peuvent recevoir un fichier réel. Par défaut, les fichiers sont stockés sous `.storage/evidence/<userId>/<evidenceId>/` et servis via une route protégée qui vérifie la session et le `userId`.

En production, définissez `LOCAL_FILE_STORAGE_DIR` vers un volume persistant. Les fichiers ne sont jamais servis depuis `public/`.

## Rappels email

QualiPilot planifie automatiquement :

- un rappel 3 jours avant l'échéance d'une action qualité ;
- un rappel 14 jours avant l'expiration d'une preuve ;
- un rappel 30 jours avant un audit.

Les rappels sont visibles dans `/app/rappels`. Pour une exécution planifiée, appelez :

```bash
curl -X POST "$NEXT_PUBLIC_APP_URL/api/reminders/run" \
  -H "Authorization: Bearer $REMINDER_CRON_SECRET"
```

En local ou sur un serveur Node persistant, vous pouvez aussi activer `ENABLE_INTERNAL_REMINDER_WORKER=true`.
Le worker interne envoie les rappels toutes les 15 minutes au demarrage de Next.js. En serverless, preferez le cron externe.

Si l'email n'est pas configuré, le rappel passe en échec avec un message clair.

## Fonctionnalités

- Landing page SaaS QualiPilot
- Inscription, connexion, déconnexion
- Mot de passe oublié et réinitialisation
- Vérification email et renvoi
- Routes `/app/*` protégées
- Profil organisme complet
- Référentiel RNQ centralisé dans `src/domain/rnq/default-referential.ts`
- Suivi des statuts d'indicateurs
- Gestion des programmes de formation
- Bibliothèque de preuves avec fichiers réels, liens indicateurs/formations et rattachement Cabinet
- Plan d'action avec échéances, priorités, clôture et rappels automatiques
- Génération de documents qualité sauvegardés
- Cockpit audit et export imprimable
- Abonnements et limites d'offres côté serveur
- Mode Cabinet : portefeuille clients et rattachement des formations, preuves, actions, documents, audits et rappels
- Export JSON des données utilisateur
- Suppression de compte
- Pages légales françaises alimentées par configuration éditeur

## Durcissement premium

- Email verifie obligatoire avant connexion et acces `/app`.
- Templates documents reels et exports PDF pour documents/audit.
- Onboarding guide, recherche referentiel, drill-down dashboard et historique quotidien du score.
- Import CSV formations, suppression formation et apercu image/PDF des preuves.
- Scoping Cabinet cote serveur avec vue client dediee.
- RBAC serveur applique aux actions sensibles : OWNER, ADMIN, QUALITY_MANAGER, TRAINER, VIEWER.
- Avancement RNQ scinde par client Cabinet pour eviter les melanges de scores/preuves.
- Invitations equipe avec roles.
- Detection des depassements apres downgrade Stripe.
- Lien auditeur lecture seule, temporaire et revocable.
- Desinscription des emails de rappel via en-tetes `List-Unsubscribe` et route signee `/unsubscribe`.
- Monitoring Sentry optionnel.
- Assistant IA optionnel via Anthropic, sans faux succes si la cle n'est pas configuree.
- Pricing landing avec bascule mensuel/annuel.
- Smoke tests E2E Playwright pour landing, protection `/app` et 404 brandee.

## Pages légales

Les pages légales publiques sont alimentées par les variables `LEGAL_*`. Les valeurs de démonstration du `.env` local doivent être remplacées par l'identité réelle de l'éditeur avant mise en production.

## Points à vérifier avant production

- Remplacer toutes les variables `LEGAL_*` par les informations réelles de l'éditeur.
- Monter `LOCAL_FILE_STORAGE_DIR` sur un volume persistant ou remplacer l'adaptateur local par un stockage objet.
- Configurer un cron externe vers `/api/reminders/run` si l'environnement est serverless.
- Configurer Stripe et Resend/SMTP avec des clés de production.
- Configurer Sentry si vous voulez le monitoring d'erreurs.
- Configurer Anthropic uniquement si l'assistant IA doit etre active.

## Déploiement

1. Créer une base PostgreSQL.
2. Définir toutes les variables d'environnement.
3. Lancer `npx prisma migrate deploy`.
4. Lancer `npm run build`.
5. Configurer le webhook Stripe vers `/api/stripe/webhook`.
6. Configurer Resend ou SMTP.
7. Configurer le cron de rappels vers `/api/reminders/run`.

Ne versionnez jamais `.env`. Utilisez `.env.example` comme référence sans secret.
