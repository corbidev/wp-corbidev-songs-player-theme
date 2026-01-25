# RAG – Spécification fonctionnelle et technique

## 1. Contexte général

- **Nom du thème** : `wp-corbidev-songs-player-theme`
- **CMS** : WordPress
- **Plugin source des données** : `wp-corbidev-songs-player`
- **Objectif** : Fournir une page web de lecture audio moderne, sombre, responsive, orientée musique (albums, playlists, favoris, lecteur audio).
- **Public cible** : utilisateurs desktop, tablette et mobile

---

## 2. Architecture WordPress attendue

### 2.1 Fichiers obligatoires du thème

``` plaintext
wp-corbidev-songs-player-theme/
├── style.css
├── functions.php
├── header.php
├── footer.php
├── index.php
├── page-player.php
├── assets/
│   ├── css/
│   │   └── tailwind.css
│   ├── js/
│   │   └── player.js
│   └── images/
└── templates/
    ├── block-albums.php
    ├── block-tracks.php
    └── block-lyrics.php
```

### 2.2 Responsabilités

- `header.php` :

  - Balise `<header>`
  - Logo / titre du site
  - Navigation minimale

- `footer.php` :
  - Lecteur audio global
  - Contrôles playback
  - Barre de progression
  - Bouton afficher / masquer le lecteur

---

## 3. Stack technique

- **HTML5** : templates WordPress
- **CSS** : Tailwind CSS (aucun CSS inline)
- **JS** : Vanilla JavaScript (ES6)
- **PHP** : WordPress API
- **Données** : récupérées exclusivement via le plugin `wp-corbidev-songs-player`

---

## 4. Structure de la page Player

### 4.1 Layout général (desktop)

```
┌──────────────────────────────────────────────┐
│ Header                                       │
├──────────────┬──────────────┬───────────────┤
│ Bloc 1       │ Bloc 2       │ Bloc 3        │
│ Albums       │ Liste MP3    │ Jaquette +    │
│ Playlists    │              │ Paroles       │
├──────────────────────────────────────────────┤
│ Lecteur Audio (collant, masquable)           │
└──────────────────────────────────────────────┘
```

---

## 5. Bloc 1 – Albums & Playlists

### 5.1 Contenu

- Albums (basés sur les tags MP3)
- Playlists personnelles
- Playlists publiques (autres utilisateurs)
- Favoris utilisateur

### 5.2 Comportement

- Scroll vertical indépendant
- Sélection active mise en évidence
- Chargement dynamique du Bloc 2

### 5.3 Données attendues

- ID album / playlist
- Titre
- Image (jaquette)
- Type (album, playlist, favoris)

---

## 6. Bloc 2 – Liste des MP3

### 6.1 Colonnes

- Numéro
- Titre
- Artiste
- Durée
- Actions

### 6.2 Actions par piste

- ❤️ Ajouter / retirer des favoris
- ⬇️ Télécharger (si autorisé)
- 🔗 Partager (lien public)
- ⋮ Menu contextuel (ajout playlist, infos)

### 6.3 Comportement

- Hover : affichage des actions
- Clic piste : lecture immédiate
- Piste active mise en surbrillance

---

## 7. Bloc 3 – Jaquette & Paroles

### 7.1 Jaquette

- Image carrée
- Ombre douce
- Animation légère au changement de piste

### 7.2 Paroles

- Affichage si disponibles
- Scroll vertical
- Synchronisation optionnelle (future évolution)

---

## 8. Lecteur Audio Global (Footer)

### 8.1 Fonctions

- Play / Pause
- Précédent / Suivant
- Barre de progression cliquable
- Volume
- Bouton favoris
- Bouton masquer / afficher

### 8.2 Contraintes

- Toujours présent (sticky)
- Masquable par l'utilisateur
- Continue la lecture entre pages

---

## 9. Responsive Design

### 9.1 Desktop

- 3 colonnes visibles

### 9.2 Tablette

- Bloc 1 repliable
- Bloc 2 principal
- Bloc 3 en dessous

### 9.3 Mobile

- Navigation par onglets :
  - Albums
  - Titres
  - Lecture

---

## 10. Accessibilité & UX

- Contrastes élevés (dark mode)
- Navigation clavier
- Zones cliquables larges
- Animations discrètes

---

## 11. Règles de développement (Copilot)

- Respect strict de la séparation : PHP / JS / CSS
- Aucun framework JS externe
- Tailwind uniquement pour le style
- Données jamais codées en dur
- Utilisation des hooks WordPress

---

## 12. Évolutions futures prévues

- Recherche instantanée
- Paroles synchronisées
- Mode hors-ligne
- Historique d'écoute

---

## 13. Résultat attendu

Un thème WordPress moderne, performant, sombre, musical, centré utilisateur, parfaitement intégré au plugin `wp-corbidev-songs-player`, prêt pour production.

---

## 14. PROMPT COPILOT – MODE ULTRA-STRICT (PRÊT À COPIER)

> **Rôle** : Tu es un développeur senior WordPress spécialisé en thèmes modernes, audio players et Tailwind CSS.
>
> **Objectif** : Implémenter intégralement le thème `wp-corbidev-songs-player-theme` selon les règles ci-dessous, sans approximation.

---

### CONTEXTE TECHNIQUE

- CMS : WordPress
- Type : Theme
- Nom exact du thème : `wp-corbidev-songs-player-theme`
- Plugin fournisseur de données (obligatoire) : `wp-corbidev-songs-player`
- Aucune donnée mockée ou codée en dur

---

### CONTRAINTES STRICTES (NON NÉGOCIABLES)

- Utiliser **header.php** et **footer.php** (aucune duplication)
- Séparation stricte des responsabilités :
  - PHP = structure + données WordPress
  - JS = logique interactive (player, actions)
  - CSS = Tailwind uniquement
- Aucun framework JS (React, Vue, Alpine, jQuery interdits)
- Aucune balise `<style>` inline
- Aucun CSS custom hors Tailwind
- Utiliser les hooks WordPress standards (`wp_enqueue_scripts`, etc.)

---

### STACK AUTORISÉE

- PHP 8+
- HTML5 sémantique
- Tailwind CSS
- JavaScript ES6 (Vanilla)

---

### STRUCTURE DE FICHIERS À CRÉER

```
wp-corbidev-songs-player-theme/
├── header.php
├── footer.php
├── functions.php
├── index.php
├── page-player.php
├── style.css
├── assets/
│   ├── css/tailwind.css
│   └── js/player.js
└── templates/
    ├── block-albums.php
    ├── block-tracks.php
    └── block-lyrics.php
```

---

### PAGE PRINCIPALE : PLAYER

- Template dédié : `page-player.php`
- Layout 3 colonnes en desktop :
  1. Albums & playlists
  2. Liste des MP3
  3. Jaquette + paroles
- Dark mode par défaut

---

### BLOC 1 – ALBUMS & PLAYLISTS

- Afficher :
  - Albums basés sur tags MP3
  - Playlists personnelles
  - Playlists publiques
  - Favoris utilisateur
- Scroll indépendant
- Sélection déclenche chargement Bloc 2

---

### BLOC 2 – LISTE DES MP3

Pour chaque piste afficher :

- Numéro
- Titre
- Artiste
- Durée
- Actions interactives :
  - ❤️ Favoris (toggle)
  - ⬇️ Télécharger (si autorisé)
  - 🔗 Partager (lien)
  - ⋮ Menu contextuel

Comportement :

- Hover = afficher actions
- Clic = lecture immédiate
- Piste active surlignée

---

### BLOC 3 – JAQUETTE & PAROLES

- Jaquette carrée responsive
- Paroles si disponibles
- Scroll vertical

---

### LECTEUR AUDIO GLOBAL (FOOTER)

Fonctions obligatoires :

- Play / Pause
- Next / Previous
- Barre de progression cliquable
- Volume
- Bouton Favoris
- Bouton afficher / masquer lecteur

Contraintes :

- Sticky bottom
- Lecture persistante

---

### RESPONSIVE

- Desktop : 3 colonnes
- Tablette : Bloc 1 repliable, Bloc 3 sous Bloc 2
- Mobile : navigation par onglets (Albums / Titres / Lecture)

---

### ACCESSIBILITÉ & UX

- Contraste élevé
- Zones cliquables larges
- Navigation clavier
- Animations discrètes

---

### RÈGLE FINALE

👉 Génère le code **fichier par fichier**, complet, prêt à être copié dans un thème WordPress fonctionnel, sans explication inutile, sans pseudo-code.
