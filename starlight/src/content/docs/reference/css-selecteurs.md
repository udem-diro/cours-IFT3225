---
title: Sélecteurs CSS
description: Guide de référence des sélecteurs CSS courants
---

## Sélecteurs de base

| Sélecteur | Cible | Spécificité |
|-----------|-------|-------------|
| `*` | Tous les éléments | 0-0-0 |
| `p` | Éléments `<p>` | 0-0-1 |
| `.classe` | Éléments avec cette classe | 0-1-0 |
| `#id` | Élément avec cet ID | 1-0-0 |

## Combinateurs

| Sélecteur | Signification |
|-----------|---------------|
| `A B` | B descendant de A |
| `A > B` | B enfant direct de A |
| `A + B` | B frère adjacent après A |
| `A ~ B` | B frère général après A |

## Pseudo-classes courantes

```css
a:hover { }      /* au survol */
a:focus { }      /* au focus clavier */
a:visited { }    /* lien visité */
li:first-child { }
li:last-child { }
li:nth-child(2n) { }  /* pairs */
input:required { }
input:valid { }
```

## Pseudo-éléments

```css
p::first-line { }
p::first-letter { }
div::before { content: "→ "; }
div::after { content: " ←"; }
```

## Calcul de spécificité

La spécificité se calcule sur trois niveaux : **ID — classe — élément**.

```
#nav .item a       → 1-1-1
.menu .item.active → 0-3-0
div > p            → 0-0-2
```

En cas d'égalité, la dernière règle déclarée l'emporte.
