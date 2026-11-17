# Potachill 🌱

Application de gestion des parties extérieures de l'internat de l'hôpital de la Timone (Marseille) : potager, terrain de pétanque, petit jardin et cour intérieure.

## Pages

- **Accueil** (`index.html`) : présentation sobre, couleurs du potager (vert, marron, orange), clin d'œil à Marseille avec le signe Jul.
- **To-Do** (`todo.html`) : propositions de choses à faire avec titre, description, budget estimé et priorité (*Urgent*, *Normal*, *Ça peut attendre*).
- **Participer** (menu déroulant) : lien vers la cagnotte Lydia.

## Lien de la cagnotte Lydia

Le lien Lydia est un placeholder pour l'instant. Pour le configurer, exécutez dans la console du navigateur (une seule fois, par appareil) :

```js
localStorage.setItem("potachill-lydia-url", "https://lydia-app.com/lien-de-votre-cagnotte");
```

Ou remplacez directement les URL `https://lydia-app.com/placeholder` dans `index.html` et `todo.html`.

## Données

Les propositions To-Do sont stockées localement (`localStorage`) en attendant un backend partagé.
