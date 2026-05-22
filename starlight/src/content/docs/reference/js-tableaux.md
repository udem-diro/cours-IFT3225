---
title: Méthodes de tableau JavaScript
description: Référence des méthodes Array les plus utilisées
---

## Transformation

### `map(callback)` — transformer chaque élément

```js
const noms = ['alice', 'bob', 'charlie'];
const majuscules = noms.map(n => n.toUpperCase());
// ['ALICE', 'BOB', 'CHARLIE']
```

### `filter(callback)` — garder les éléments qui passent le test

```js
const notes = [45, 78, 92, 33, 88];
const reussites = notes.filter(n => n >= 60);
// [78, 92, 88]
```

### `reduce(callback, initial)` — accumuler en une seule valeur

```js
const prix = [12.50, 8.99, 23.00];
const total = prix.reduce((acc, p) => acc + p, 0);
// 44.49
```

## Recherche

### `find(callback)` — premier élément qui correspond

```js
const cafes = [
  { nom: 'Pikolo', quartier: 'Mile End' },
  { nom: 'Névé', quartier: 'Villeray' },
];
const trouve = cafes.find(c => c.quartier === 'Villeray');
// { nom: 'Névé', quartier: 'Villeray' }
```

### `includes(valeur)` — vérifier la présence

```js
['html', 'css', 'js'].includes('css'); // true
```

### `some(callback)` / `every(callback)`

```js
[80, 55, 92].some(n => n < 60);  // true (au moins un)
[80, 75, 92].every(n => n >= 60); // true (tous)
```

## Modification

### `push()` / `pop()` — fin du tableau

```js
const pile = [1, 2, 3];
pile.push(4);  // [1, 2, 3, 4]
pile.pop();    // retourne 4, pile = [1, 2, 3]
```

### `unshift()` / `shift()` — début du tableau

```js
const file = [2, 3];
file.unshift(1); // [1, 2, 3]
file.shift();    // retourne 1, file = [2, 3]
```

### `splice(index, count, ...items)` — insérer/supprimer

```js
const mois = ['jan', 'mar', 'avr'];
mois.splice(1, 0, 'fév'); // insère 'fév' à l'index 1
// ['jan', 'fév', 'mar', 'avr']
```

## Itération

### `forEach(callback)` — exécuter sans retour

```js
['HTML', 'CSS', 'JS'].forEach((tech, i) => {
  console.log(`${i + 1}. ${tech}`);
});
```

## Tri

### `sort(compareFn)` — trier en place

```js
// Tri numérique (le tri par défaut est lexicographique !)
[10, 2, 30].sort((a, b) => a - b); // [2, 10, 30]

// Tri alphabétique français
['école', 'arbre', 'été'].sort((a, b) => a.localeCompare(b, 'fr'));
```

## Déstructuration et spread

```js
const [premier, ...reste] = [1, 2, 3, 4];
// premier = 1, reste = [2, 3, 4]

const copie = [...original]; // copie superficielle
const fusion = [...a, ...b]; // concaténation
```
