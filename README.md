# Potachill 🌱

Application de gestion des parties extérieures de l'internat de l'hôpital de la Timone (Marseille) : potager, terrain de pétanque, petit jardin et cour intérieure.

## Pages

- **Accueil** (`index.html`) : présentation sobre, couleurs du potager (vert, marron, orange), clin d'œil à Marseille avec le signe Jul.
- **To-Do** (`todo.html`) : propositions de choses à faire avec titre, description, budget estimé et priorité (*Urgent*, *Normal*, *Ça peut attendre*).
- **Participer** (menu déroulant) : lien vers la cagnotte Lydia.

## Lien de la cagnotte Lydia

La cagnotte est accessible ici : https://pots.lydia.me/collect/pots?id=86480-pepouziniere

Elle est branchée sur tous les liens « Participer » (menu déroulant, bouton d'accueil et carte). Pour la changer, remplacez l'URL dans `index.html` et `todo.html`.

## Données

Les propositions To-Do sont stockées localement (`localStorage`) en attendant un backend partagé.

## Backend partagé (Supabase)

Pour que les propositions et les likes soient partagés entre tous les internes :

1. Créez un projet gratuit sur [supabase.com](https://supabase.com).
2. Dans le **SQL Editor** du projet, exécutez le contenu de [`supabase/schema.sql`](supabase/schema.sql).
3. Dans **Settings → API**, copiez l'URL du projet et la clé `anon`.
4. Collez-les dans [`js/config.js`](js/config.js) (`SUPABASE_URL` et `SUPABASE_ANON_KEY`) et commitez.

Le site utilise automatiquement Supabase dès que ces deux valeurs sont renseignées ; sinon il retombe sur le stockage local. La clé `anon` est publique par conception (Row Level Security activé dans le schéma) : il faut la traiter comme une clé d'accès public en lecture/écriture sur les tables `todos` et `todo_likes`.

### Authentification obligatoire

L'inscription (Nom, Prénom, pseudo, mot de passe) et la connexion sont gérées par **Supabase Auth** ; le pseudo sert d'identifiant (pas d'email nécessaire, il est converti en `pseudo@potachill.local`).

Après avoir créé le projet, dans **Authentication → Providers → Email**, désactivez **Confirm email** (sinon personne ne pourra se connecter, les adresses étant fictives).

Tant que `js/config.js` n'est pas renseigné, le site reste accessible sans authentification (mode local).
