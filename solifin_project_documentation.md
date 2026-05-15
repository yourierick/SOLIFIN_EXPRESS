# Documentation du Projet: SOLIFIN EXPRESS

## 1. Vue d'ensemble du Projet

**SOLIFIN EXPRESS** est une plateforme web complexe multiservices. Elle regroupe des fonctionnalités de réseau social professionnel, de commerce électronique (produits numériques et physiques avec livreurs), de e-learning (formations), et de marketing de réseau (MLM) avec un système poussé de portefeuilles virtuels (wallets) et de packs d'investissement.

## 2. Architecture Technique

Le projet adopte une architecture découplée (Headless) :

- **Frontend** : Application Single Page (SPA) développée avec **React.js** et buildée via **Vite**.
- **Backend** : API RESTful développée avec le framework **Laravel (PHP)**.

### 2.1. Stack Frontend

- **Cœur** : React 18, Vite.
- **Routage** : React Router DOM v7 (avec configurations différées `lazy loading` via Suspense).
- **Stylisation & UI** : Tailwind CSS, Styled Components, Material UI (MUI), Bootstrap 5, Headless UI.
- **Gestion d'état** : Zustand & Redux (probablement pour différentes parties de l'app).
- **Requêtes API** : Axios.
- **Graphiques & Data** : Chart.js, Recharts, React-D3-Tree (pour visualiser la hiérarchie MLM/Réseau).
- **Multimédia** : FFmpeg (traitement vidéo client), React Player, React Quill (éditeur de texte riche).

### 2.2. Stack Backend

- **Cœur** : Laravel 11.x, PHP 8.2+.
- **Base de données** : ORM Eloquent (MySQL/PostgreSQL).
- **Authentification** : Laravel Sanctum (Authentification par Tokens d'API).
- **Paiements & SMS** : Intégration SerdiPay (passerelle tierce sécurisée), Twilio SDK (pour potentiels SMS).
- **Génération de documents** : DomPDF (génération de factures/reçus financiers).
- **Tests & Développement** : PHPUnit, Laravel Sail, Laravel Pint.

## 3. Topologie des Utilisateurs

L'application gère principalement deux grands ensembles via des layouts distincts :

- **Utilisateurs standards (UserDashboardLayout)** : Disposent de portefeuilles, achètent des packs, publient sur le réseau social, suivent des formations, etc.
- **Administrateurs (AdminDashboardLayout)** : Gestion du système, validation des annonces, monitoring financier, gestion des rôles/permissions avancés, audits globaux.

## 4. Modules Fonctionnels

### 4.1. Système Financier et MLM (Portefeuilles et Packs)

- **Packs d'adhésion** : Les utilisateurs achètent des packs qui leur octroient des avantages ou des rendements récurrents.
- **Portefeuilles (Wallets)** : Chaque utilisateur possède un portefeuille gérant les dépôts, les transferts de fonds internes, les historiques de transactions, et les requêtes de retraits.
- **Gains et Commissions** : Système de parrainage multiniveaux avec calcul des commissions, des bonus (jetons Esengo), et évolution en "Grades".
- **Audits Financiers** : L'admin dispose de tableaux de contrôle d'anomalies financières, audits de balance des utilisateurs/marchands, etc.

### 4.2. E-Learning (Formations)

- **Gestion des cours** : Les administrateurs ou formateurs peuvent créer des `Formations` composées de `Modules`.
- **Évaluation** : Intégration de Quiz avec suivi de la progression et de l'achèvement.
- **Achat** : Possibilité d'acquérir des formations contre des fonds du portefeuille.

### 4.3. Réseau Social & Communauté

- **Pages & Profils** : Les utilisateurs peuvent créer des pages (comme sur LinkedIn/Facebook).
- **Publications** : Annonces classiques, Opportunités d'affaires (`OpportuniteAffaire`) ou Offres d'emploi (`OffreEmploi`).
- **Interactions** : Likes, Commentaires, Partages (`SocialEvent`, `Likes`, `Shares`) et comptage du nombre de vues.
- **Chat** : Messagerie instantanée avec gestion de salles de chat, messages directs, et "Broadcasts" (diffusion de masse par les admins).

### 4.4. E-commerce / Produits Digitaux & Physique

- **Produits Numériques** : Vente, achat et téléchargement de produits immatériels.
- **Logistique/Livreurs** : Gestion de candidatures et approbation de "Livreurs" connectés à la plateforme pour des produits physiques (probablement liés à des `Cadeaux`).
- **Cadeaux et Tickets Gagnants** : Distribution de cadeaux ou tickets liés au système de "Jetons Esengo" obtenus via l'achat de packs.

### 4.5. Gestion de Contenu Globale (CMS intégré)

- **FAQ** : Foire aux questions avec classement par catégories, recherche et votes de pertinence.
- **Témoignages (Testimonials)** : Processus automatisé d'invitation au témoignage ("prompts"), soumission par les utilisateurs, et validation par l'administration avant affichage en page d'accueil.

## 5. Sécurité et Performances

- **PWA Ready** : Le frontend incorpore des Workbox (Service Worker) pour permettre un cache hors ligne poussé.
- **Protection des API** : Sécurisation "Rate limiting" (`throttle:api`) globale, cruciale pour les transactions ou envois de mails.
- **Middlewares Laravel** : Routage protégé extrêmement fin (ex: `permission:manage-finances`, `permission:manage-audits`).
- **Audit de la base de données** : Présence de modèles tels que `FinancialAuditLog`, reflétant un besoin de traçabilité absolue des mouvements d'argent.

## 6. Modélisation de la Base de Données

Le schéma entité-relation (ERD) ci-dessous illustre les interactions clés entre les principaux modèles de la base de données de SOLIFIN EXPRESS.

![Diagramme Mermaid](https://kroki.io/mermaid/svg/eJyVVEtu2zAQ3ecUAwEBHCDxAbRTXacwqsaBYrdLYiyNHaISSQwpFG3s-8T73kAXKyTL1s9xEy0Icfg4vzePxJ8lbhizKwCA5dM0gpfqt_ykciCT09Y6lmoDCjPq2yhDmZ6MK61TQgXSCkwyqToOrdHKahYyAS8q9utiz6RigpTAIDNKBaOlJb7xOtcMxj9FQsLkq1TG6KRWos5tV63VEs3D6fsLaF38EYThdPH21XKbW2LRsiUUywxTWGGKKqaBfc36DynRPt5dtaKJRRQ8PAWTxWz-cDnyL0xTcmJYivttCLyk2Jvir7sFJsco3S3EOsvG47E3yAkznSvXzuUxmHz9GOdHX4Zlq-oj6dahy22_v-VkiTOh-j09UT3MoeW4ygIdgck5fkZLotx1q_pyYRDeiqx0tmISuNJK0aCGx-WncDaZLf7j2OCGzoxmOPseTZcX5NW_2y-9w9r9PPoWXB6c44hIx53WXF9DRGmlINuofre9u9tuDwLyAZuD7eGgFogPRltbvCbUReiXw78PXq1iglEj9VrMffhhInzA-Ll4rQmsTGcwHllXAskV-_Kl8Nq6rfFndOUDKaaNtMcutIuqpsSH6pFqEJW19thw7kP19AwhR2J9YIo5d0NEQ1bZHtZGW4KRQV5raUGqRDLFjjJS7sb7B7yPhGY=)

### Explications des relations clés :

- **Structure MLM (Multi-Level Marketing)** : L'entité `User` est auto-référencée via `sponsor_id`, ce qui permet de créer des arbres généalogiques infinis de parrainages (générations).
- **Finances Multi-nœuds** : Chaque `User` possède exactement un `Wallet`. Les mouvements financiers génèrent des `WalletTransaction` (en flux "in", "out" ou "freeze").
- **Souscriptions croisées** : L'association `user_packs` permet de lier un utilisateur à de multiples `Pack` qu'il a pu acquérir. Ces packs débloquent les bonus et définissent via `CommissionRate` les pourcentages distribués sur le réseau.
- **Micro-Services intégrés** : Un `User` (Partisan, Marchand) gère une `Page` professionnelle. C’est cette dernière qui s'associe par la suite aux `Publicite`, aux `OffreEmploi`, aux `Livreur` ou aux potentiels `DigitalProduct`.

## 7. Architecture de Navigation Frontend

Le système de routage côté client est construit sur React Router. Il orchestre l'accès aux interfaces via un système de "Layouts" (gabarits) encadré par des middlewares d'authentification (`PublicRoute`, `PrivateRoute`).

![Diagramme Mermaid](https://kroki.io/mermaid/svg/eJyNlN1O20AQhe_7FCMQwZFIIb8Uq0KyEshFY9UNpVIVRdV6PUmmbHbD_hRo1ffB930Dv1hlm6RJcVFvLO3uOcez34w912y1gI-DVwAAISPpTSJF0kJyeCGtzlIEH4LV6vVXcz-tQ6NxDmPlLOofY2TcPi1g8D78WUQUj6fNXBy5WBCfFDumXN06NNO_ddcGdcTsYq28ylLuNJksRQM-XFsSZJhFp597g2RJ8gVzcU7GamZJyemfOg8OINCx0mg4So6b8orDsvLyEk0v4NwhCTiGq4W648xg_Zmq5QXOLlBamhEv3gU-jNSc5PEY52Qs6uemthdmKWeSzBINXCwZCahBOIjq_65zm0YhWNODRgP2ho7pZJcZ9JWUyG2Wgvc20vSNWSxYndf3SvxfRuxBOTuZ5FEDZhaxYjopN6clsrWmNDS9SxKQHDJuHRNks9TAMYyz1CBz9QpDyxuiKaAkDiKlLc7QkRAIlySZ5LSms2treyGbM0MSEoSI8RsD4SisUna8i8YImZYk5-BDXzltoAYfHH2vkne9TygtQg3WdYUMIjbHF8DvTlIh2QzfDvtx9kvsyPMmaLx1ZErgwQZ4IaomHmwXHDS9vso_yTw5QQMhLmON-RXffe7XKwwtL1SSrNI5kHAUQq0EWKVte4FLyBpAC4FUSyYIzboz2aPGSlfHC1WSpXo97IGUSvKipsjFlZauFzHNltmjzWu_ejA2e1zmXQjRGDZHTQhDoWImthth7IPA4v8EMxLC3291e22Mj4zV6gb9_SZ2Ttjsadm4o8Qu_Nbq_ogrobS_P5vNtmI2c1BGnXTPer2zTdRJ5_RN9_Q_o4LdqIS3eq3eJio-a_ImfynqN7Aexqs=)

### Mécanismes clés de navigation :

- **Lazy Loading (`Suspense`)** : Presque toutes les vues du tableau de bord sont chargées de façon fractionnée à la demande afin de garantir un chargement natif plus rapide (via `lazy()`).
- **Composants d'interception (Guards)** : Les composants `PublicRoute` et `PrivateRoute` vérifient l'état d'authentification lié au token Sanctum avant d'autoriser l'affichage de l'arbre DOM enfant en basculant dynamiquement selon le niveau d'autorisation (`user.is_admin` ou `role_id`).
- **Isolation d'interface** : L’administrateur et l’utilisateur n'emploient pas la même structure (Headers, Sidebars), ce qui sécurise et clarifie visuellement l'environnement.

## 8. Documentation de l'API REST

Le backend Laravel sert une architecture d'API RESTful complète et sécurisée. L'API est divisée en plusieurs segments avec des contrôles d'accès stricts (via `Sanctum` et des rôles d'utilisateurs).

Voici un aperçu des principaux groupes de terminaux (Endpoints) de l'API :

### 8.1. Endpoints Publics (Sans Authentification)

Ces routes servent les contenus publics de la plateforme (pages d'accueil) et les Webhooks.
- `GET /api/packs` : Liste les packs publics disponibles (ex: page d'accueil).
- `GET /api/publications/approved` : Récupère les publicités et posts publics validés.
- `GET /api/stats/home` : Statistiques publiques affichées sur la vitrine.
- `POST /api/payment/callback` : Webhook écoutant les callbacks de la passerelle *SerdiPay* pour valider dynamiquement les transactions externes.

### 8.2. Authentification et Accès

Protégées par une limitation de fréquence (`throttle:api`) pour contrer les attaques par force brute.
- `POST /api/login` & `POST /api/register` : Connexion et Inscription.
- `POST /api/auth/forgot-password` & `POST /api/auth/reset-password` : Flux d'oubli de mot de passe.
- `GET /api/email/verify/{id}/{hash}` : Validation sécurisée de l'adresse email.

### 8.3. Endpoints Protégés (Espace Utilisateur)

*Nécessitent un Bearer Token (`auth:sanctum`).*
- **Portefeuille et Finances**
  - `GET /api/userwallet/balance` : Récupérer le solde disponible et gelé.
  - `POST /api/withdrawal/request/{walletId}` : Initier une nouvelle demande de retrait financier.
  - `POST /api/funds-transfer` : Transférer des fonds en interne (Solifin Mobile/Wallet à Wallet).
- **Réseau Social et Chat**
  - `GET /api/social-events`, `POST /api/social-events/{id}/like` : Système de flux d'actualité, likes, commentaires, vues.
  - `GET /api/chat/rooms`, `POST /api/chat/rooms/{roomId}/messages` : Messagerie privée et WebSocket asynchrone / Polling.
- **E-Learning et Vente**
  - `POST /api/formations/purchase/{id}` : Acheter et débloquer une formation spécifique avec l'argent du Wallet.
  - `POST /api/digital-products` : Enregistrer un nouveau produit virtuel pour la vente.

### 8.4. Endpoints d'Administration (Espace Admin)

*Nécessitent un Bearer Token + Middleware `admin` ou un rôle spécifique (`permission:...`).*
- **Audit et Finance**
  - `GET /api/admin/audit-logs` : Vérification profonde automatisée pour la régulation financière.
  - `GET /api/admin/finances` : Consolidation de la caisse financière du système SOLIFIN.
- **Modération**
  - `POST /api/admin/publications/{id}/approve` : Validation d'annonces avant publication sur la page d'accueil (Workflow de modération manuelle).
  - `POST /api/admin/withdrawal/requests/{id}/approve` : Vérification et validation des retraits d'argent demandés par les utilisateurs.
- **Gestion des droits (Super-Admin)**
  - `GET`, `POST` `/api/admin/roles` & `/api/admin/permissions` : Contrôle granulaire des droits RBAC (Role-Based Access Control).

### Conventions de retour

Les réponses de l'API suivent généralement un standard JSON :
```json
{
  "status": "success",
  "message": "Transaction effectuée",
  "data": { ... }
}
```
