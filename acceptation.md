# Scraper configurable — Critères d'acceptation

Ce document définit les critères d'acceptation du projet. Chaque critère correspond à un comportement attendu vérifiable par un test. Les tests sont organisés par module.

---

## 1. Chargement de la configuration YAML

### CA-01 — Parsing valide
**Étant donné** un fichier `scraper.config.yaml` bien formé,  
**quand** l'application démarre,  
**alors** la configuration est chargée sans erreur et le nombre de scrapers correspond au nombre de blocs définis dans le fichier.

### CA-02 — Valeur par défaut de la concurrence
**Étant donné** un fichier YAML sans champ `concurrency`,  
**quand** l'orchestrateur est initialisé,  
**alors** la concurrence est fixée à 5 par défaut.

### CA-03 — Valeur par défaut du dossier de sortie
**Étant donné** un fichier YAML sans champ `output_dir`,  
**quand** le stockage est initialisé,  
**alors** le dossier de sortie est `./results`.

### CA-04 — Rejet si aucun scraper défini
**Étant donné** un fichier YAML avec un tableau `scrapers` vide,  
**quand** l'application démarre,  
**alors** une erreur explicite est affichée et le processus s'arrête avec un code de sortie non nul.

### CA-05 — Rejet si un champ obligatoire est manquant
**Étant donné** un scraper sans champ `url` ou sans champ `name`,  
**quand** la configuration est validée,  
**alors** une erreur de validation précise quel champ est manquant et pour quel scraper.

---

## 2. Actions individuelles

### CA-06 — Action `navigate` : chargement réussi
**Étant donné** une URL valide et accessible,  
**quand** l'action `navigate` est exécutée,  
**alors** la page est chargée et son titre est non vide.

### CA-07 — Action `navigate` : timeout respecté
**Étant donné** une URL qui ne répond pas dans le délai imparti,  
**quand** l'action `navigate` est exécutée avec un `timeout` défini,  
**alors** une erreur de timeout est levée après exactement ce délai.

### CA-08 — Action `wait` : attente par sélecteur
**Étant donné** un sélecteur CSS qui apparaît dans le DOM après un délai,  
**quand** l'action `wait` est exécutée avec ce sélecteur,  
**alors** l'exécution reprend dès que l'élément devient visible.

### CA-09 — Action `wait` : attente par durée fixe
**Étant donné** un champ `duration` de 1000 ms,  
**quand** l'action `wait` est exécutée,  
**alors** l'exécution est suspendue d'au moins 1000 ms.

### CA-10 — Action `click` : élément présent
**Étant donné** un sélecteur pointant vers un bouton visible,  
**quand** l'action `click` est exécutée,  
**alors** l'élément est cliqué et l'effet associé (navigation, changement d'état) se produit.

### CA-11 — Action `click` : élément absent (tolérance)
**Étant donné** un sélecteur qui ne correspond à aucun élément dans la page,  
**quand** l'action `click` est exécutée,  
**alors** aucune erreur n'est levée et l'exécution du parcours continue normalement.

### CA-12 — Action `fill` : remplissage réussi
**Étant donné** un sélecteur pointant vers un champ de formulaire et une valeur,  
**quand** l'action `fill` est exécutée,  
**alors** le champ contient exactement la valeur spécifiée.

### CA-13 — Action `fill` : champ inexistant
**Étant donné** un sélecteur qui ne correspond à aucun champ,  
**quand** l'action `fill` est exécutée,  
**alors** une erreur explicite est levée et propagée au runner.

### CA-14 — Action `extract` : données extraites correctement
**Étant donné** une page contenant 5 éléments correspondant au sélecteur conteneur, chacun avec les sous-éléments définis dans `fields`,  
**quand** l'action `extract` est exécutée,  
**alors** le résultat contient exactement 5 enregistrements, chacun avec tous les champs renseignés.

### CA-15 — Action `extract` : champ absent dans un élément
**Étant donné** un élément qui ne contient pas l'un des sous-sélecteurs définis dans `fields`,  
**quand** l'action `extract` est exécutée,  
**alors** le champ manquant a la valeur `null` dans l'enregistrement correspondant, et les autres champs sont correctement renseignés.
.
### CA-16 — Action `extract` : page vide
**Étant donné** une page où aucun élément ne correspond au sélecteur conteneur,  
**quand** l'action `extract` est exécutée,  
**alors** le résultat est un tableau vide sans erreur.

### CA-17 — Action `paginate` : navigation multi-pages
**Étant donné** une page avec un bouton "page suivante" et `max_pages` fixé à 3,  
**quand** l'action `paginate` est exécutée,  
**alors** l'extraction est répétée sur 3 pages et le résultat final est la concaténation des données de toutes les pages.

### CA-18 — Action `paginate` : arrêt quand le bouton disparaît
**Étant donné** une séquence de pages dont la dernière ne contient pas le sélecteur de pagination,  
**quand** l'action `paginate` est exécutée,  
**alors** la pagination s'arrête à la dernière page disponible sans erreur, même si `max_pages` n'est pas atteint.

### CA-19 — Action `paginate` : `max_pages` respecté
**Étant donné** un site avec 10 pages disponibles et `max_pages` fixé à 4,  
**quand** l'action `paginate` est exécutée,  
**alors** seules 4 pages sont visitées.

### CA-20 — Action `paginate` : requiert une étape `extract` préalable
**Étant donné** un parcours où `paginate` est défini sans étape `extract` précédente,  
**quand** le runner tente d'exécuter cette étape,  
**alors** une erreur explicite est levée indiquant que `paginate` requiert une étape `extract`.

---

## 3. Runner

### CA-21 — Exécution séquentielle des étapes
**Étant donné** un scraper avec 4 étapes définies dans l'ordre,  
**quand** le runner exécute le parcours,  
**alors** les étapes sont exécutées dans l'ordre défini, sans en sauter aucune.

### CA-22 — Résultat structuré en succès
**Étant donné** un scraper dont toutes les étapes s'exécutent sans erreur,  
**quand** le runner termine,  
**alors** le `ScraperResult` retourné contient : le nom du scraper, l'URL, les enregistrements, le nombre de pages, la durée, et `error` à `null`.

### CA-23 — Résultat structuré en erreur
**Étant donné** un scraper dont une étape lève une erreur fatale,  
**quand** le runner termine,  
**alors** le `ScraperResult` retourné contient le champ `error` renseigné avec le message d'erreur, et les données partiellement collectées avant l'erreur sont préservées.

### CA-24 — La page est toujours fermée après exécution
**Étant donné** un scraper qui se termine normalement ou en erreur,  
**quand** le runner termine,  
**alors** la page Playwright associée est fermée, quel que soit le résultat.

### CA-25 — Viewport configuré si défini
**Étant donné** un scraper avec un `viewport` de 1280x800,  
**quand** la page est ouverte,  
**alors** la fenêtre du navigateur a exactement ces dimensions.

---

## 4. Orchestrateur

### CA-26 — Un seul browser pour toute l'exécution
**Étant donné** une configuration avec 5 scrapers,  
**quand** l'orchestrateur s'exécute,  
**alors** un seul processus navigateur est lancé et partagé entre tous les scrapers.

### CA-27 — Contextes Playwright isolés
**Étant donné** deux scrapers s'exécutant en parallèle,  
**quand** l'un d'eux définit un cookie,  
**alors** ce cookie n'est pas visible dans le contexte de l'autre scraper.

### CA-28 — Concurrence respectée
**Étant donné** une configuration avec 10 scrapers et `concurrency` fixé à 3,  
**quand** l'orchestrateur s'exécute,  
**alors** au maximum 3 scrapers tournent simultanément à tout moment.

### CA-29 — Erreur isolée par scraper
**Étant donné** un scraper qui échoue (URL inaccessible, erreur fatale),  
**quand** l'orchestrateur s'exécute,  
**alors** les autres scrapers terminent normalement et produisent leurs résultats.

### CA-30 — Contexte toujours fermé après chaque scraper
**Étant donné** un scraper qui se termine normalement ou en erreur,  
**quand** le scraper est terminé,  
**alors** son `BrowserContext` est fermé immédiatement, libérant les ressources.

### CA-31 — Browser fermé en fin d'exécution
**Étant donné** tous les scrapers terminés,  
**quand** l'orchestrateur finalise,  
**alors** le browser Playwright est fermé proprement et aucun processus navigateur ne reste actif.

### CA-32 — Résumé global affiché
**Étant donné** une exécution complète avec plusieurs scrapers,  
**quand** l'orchestrateur finalise,  
**alors** un résumé est affiché indiquant le nombre de scrapers exécutés, le total d'enregistrements collectés, et le nombre d'erreurs.

---

## 5. Stockage

### CA-33 — Création du dossier de sortie
**Étant donné** un `output_dir` qui n'existe pas encore sur le système de fichiers,  
**quand** la première sauvegarde est déclenchée,  
**alors** le dossier est créé automatiquement.

### CA-34 — Fichier JSON valide
**Étant donné** un `ScraperResult` avec des données,  
**quand** la sauvegarde est effectuée,  
**alors** le fichier produit est un JSON valide parsable sans erreur.

### CA-35 — Nom de fichier unique
**Étant donné** deux scrapers portant des noms différents,  
**quand** leurs résultats sont sauvegardés,  
**alors** chacun produit un fichier distinct et aucun fichier n'est écrasé.

### CA-36 — Métadonnées présentes dans le fichier
**Étant donné** un résultat sauvegardé,  
**quand** le fichier JSON est lu,  
**alors** il contient un objet `metadata` avec les champs : `scraper`, `url`, `pages_scraped`, `total_records`, `duration_ms`, `scraped_at`, et `error`.

### CA-37 — Cohérence entre `total_records` et `data`
**Étant donné** un résultat contenant 42 enregistrements,  
**quand** le fichier JSON est lu,  
**alors** `metadata.total_records` vaut 42 et le tableau `data` contient exactement 42 éléments.

---

## 6. Robustesse globale

### CA-38 — Retry en cas d'erreur réseau transitoire
**Étant donné** une URL qui échoue les deux premières fois puis réussit,  
**quand** le runner tente de naviguer vers cette URL avec la stratégie de retry activée,  
**alors** le scraper réussit à la troisième tentative sans lever d'erreur.

### CA-39 — Timeout global par scraper
**Étant donné** un scraper dont l'exécution dépasse le timeout global configuré,  
**quand** ce timeout est atteint,  
**alors** le scraper est interrompu, son résultat partiel est sauvegardé, et les autres scrapers ne sont pas affectés.

### CA-40 — Aucune donnée codée en dur
**Étant donné** le code source du projet,  
**quand** une revue est effectuée,  
**alors** aucune URL, sélecteur, ou valeur de configuration n'est inscrite directement dans le code : tout provient du fichier YAML.