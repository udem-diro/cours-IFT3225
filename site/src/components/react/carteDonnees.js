// Jeu de données neutre pour l'exemple « une carte, cinq niveaux ».
// Des stations de mesure réparties autour d'un centre. Chaque station porte une
// catégorie (faible / moyen / élevé), une valeur, un nombre d'observations, une
// fraîcheur et une petite série temporelle déterministe (pour les niveaux
// dynamiques). Tout est calculé une fois, sans aléatoire, pour rester stable.

export const CENTRE = [48.8566, 2.3522];

export const CATEGORIES = {
  faible: { libelle: "Faible", couleur: "#2d8a4e" },
  moyen: { libelle: "Moyen", couleur: "#d97706" },
  eleve: { libelle: "Élevé", couleur: "#dc2626" },
};

export const couleurCategorie = (cat) => CATEGORIES[cat]?.couleur ?? "#9898ab";

export function categorieDe(valeur) {
  if (valeur < 34) return "faible";
  if (valeur < 67) return "moyen";
  return "eleve";
}

// Série temporelle déterministe (12 pas) : utile au niveau dynamique.
function serie(base, phase) {
  return Array.from({ length: 12 }, (_, i) => {
    const v = base + 28 * Math.sin((i / 11) * Math.PI * 2 + phase) + 8 * Math.sin(i * 1.7 + phase);
    return Math.max(0, Math.min(100, Math.round(v)));
  });
}

const BRUTS = [
  { nom: "Station 01", d: [0.012, -0.018], base: 22, nb: 41 },
  { nom: "Station 02", d: [0.026, 0.009], base: 78, nb: 17 },
  { nom: "Station 03", d: [-0.020, 0.022], base: 55, nb: 63 },
  { nom: "Station 04", d: [-0.030, -0.012], base: 12, nb: 9 },
  { nom: "Station 05", d: [0.038, 0.030], base: 88, nb: 52 },
  { nom: "Station 06", d: [0.004, 0.040], base: 47, nb: 28 },
  { nom: "Station 07", d: [-0.041, 0.006], base: 33, nb: 75 },
  { nom: "Station 08", d: [0.020, -0.038], base: 64, nb: 22 },
  { nom: "Station 09", d: [-0.010, -0.030], base: 91, nb: 38 },
  { nom: "Station 10", d: [0.045, -0.006], base: 27, nb: 14 },
  { nom: "Station 11", d: [-0.034, 0.038], base: 70, nb: 49 },
  { nom: "Station 12", d: [0.014, 0.024], base: 40, nb: 31 },
];

// Repère temporel fixe (déterministe), pour calculer les fraîcheurs.
const MAINTENANT = Date.UTC(2026, 5, 21, 12, 0, 0);

export const STATIONS = BRUTS.map((s, i) => {
  const historique = serie(s.base, i * 0.6);
  const valeur = historique[historique.length - 1];
  const minutesDepuis = (i * 17) % 90;
  return {
    id: `st${i + 1}`,
    nom: s.nom,
    position: [CENTRE[0] + s.d[0], CENTRE[1] + s.d[1]],
    valeur,
    categorie: categorieDe(valeur),
    nbObservations: s.nb,
    minutesDepuis,
    horodatage: MAINTENANT - minutesDepuis * 60000,
    historique,
  };
});
