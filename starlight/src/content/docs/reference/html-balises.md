---
title: Balises HTML essentielles
description: Référence rapide des balises HTML les plus utilisées
---

## Structure du document

| Balise | Rôle |
|--------|------|
| `<!DOCTYPE html>` | Déclaration du type de document |
| `<html>` | Racine du document |
| `<head>` | Métadonnées (non affichées) |
| `<body>` | Contenu visible |

## Texte

| Balise | Rôle | Exemple |
|--------|------|---------|
| `<h1>` à `<h6>` | Titres hiérarchiques | `<h1>Mon titre</h1>` |
| `<p>` | Paragraphe | `<p>Un texte.</p>` |
| `<strong>` | Importance forte | `<strong>important</strong>` |
| `<em>` | Emphase | `<em>souligné</em>` |
| `<code>` | Code en ligne | `<code>let x = 5;</code>` |

## Sectionnement

| Balise | Rôle |
|--------|------|
| `<header>` | En-tête de section ou de page |
| `<nav>` | Navigation principale |
| `<main>` | Contenu principal (unique par page) |
| `<section>` | Section thématique |
| `<article>` | Contenu autonome |
| `<aside>` | Contenu tangentiel |
| `<footer>` | Pied de section ou de page |

## Liens et médias

| Balise | Rôle |
|--------|------|
| `<a href="…">` | Hyperlien |
| `<img src="…" alt="…">` | Image |
| `<video>` | Vidéo |
| `<audio>` | Audio |

## Listes

```html
<!-- Liste non ordonnée -->
<ul>
  <li>Élément</li>
</ul>

<!-- Liste ordonnée -->
<ol>
  <li>Premier</li>
  <li>Deuxième</li>
</ol>
```
