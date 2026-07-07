// Jeu de données neutre et enrichi pour l'exemple « une carte, cinq niveaux ».
// 48 stations de mesure réparties autour d'un centre, chacune d'un type (air, eau,
// bruit, trafic, sol), avec une catégorie (faible / moyen / élevé), une valeur, un
// nombre d'observations, une fraîcheur, une tendance, une fiabilité, un quartier et
// un historique de 24 pas. Le tout est généré de façon déterministe (aucun aléatoire
// à l'exécution), pour rester stable d'un rendu à l'autre.

export const CENTRE = [48.8566, 2.3522];
export const NB_PAS = 30; // 30 derniers jours, 1 pas = 1 jour

export const CATEGORIES = {
  faible: { libelle: "Faible", couleur: "#2d8a4e" },
  moyen: { libelle: "Moyen", couleur: "#d97706" },
  eleve: { libelle: "Élevé", couleur: "#dc2626" },
};

// Trois types de mesure. Chaque type porte sa propre sémantique : une unité et
// des libellés de niveau (le même gradient de gravité faible/moyen/élevé, mais
// nommé selon ce qui est mesuré).
export const TYPES = {
  air: { libelle: "Qualité de l'air", glyphe: "🌫️", unite: "AQI", niveaux: { faible: "Bon", moyen: "Modéré", eleve: "Mauvais" } },
  eau: { libelle: "Eau", glyphe: "💧", unite: "indice", niveaux: { faible: "Bonne", moyen: "Moyenne", eleve: "Dégradée" } },
  bruit: { libelle: "Bruit", glyphe: "🔊", unite: "dB", niveaux: { faible: "Calme", moyen: "Modéré", eleve: "Bruyant" } },
};

// Étiquettes des 30 derniers jours (déterministes, jusqu'à une date de référence).
const MOIS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
const REFERENCE = new Date(Date.UTC(2026, 5, 21));
export const JOURS = Array.from({ length: NB_PAS }, (_, t) => {
  const d = new Date(REFERENCE);
  d.setUTCDate(d.getUTCDate() - (NB_PAS - 1 - t));
  return `${d.getUTCDate()} ${MOIS[d.getUTCMonth()]}`;
});

export const QUARTIERS = ["Centre", "Nord", "Est", "Sud", "Ouest", "Port", "Parc", "Gare"];

export const couleurCategorie = (cat) => CATEGORIES[cat]?.couleur ?? "#9898ab";
export const glypheType = (type) => TYPES[type]?.glyphe ?? "•";
export const libelleType = (type) => TYPES[type]?.libelle ?? type;
export const uniteDe = (type) => TYPES[type]?.unite ?? "";
// Libellé de niveau selon la sémantique du type (ex. bruit élevé => "Bruyant").
export const niveauLibelle = (type, severite) => TYPES[type]?.niveaux?.[severite] ?? severite;

export function categorieDe(valeur) {
  if (valeur < 34) return "faible";
  if (valeur < 67) return "moyen";
  return "eleve";
}

// Générateur pseudo-aléatoire déterministe (mulberry32).
function generateur(graine) {
  let a = graine >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const alea = generateur(20260621);
const TYPES_LISTE = Object.keys(TYPES);

function historiqueDe(base, phase, amplitude) {
  return Array.from({ length: NB_PAS }, (_, i) => {
    const v =
      base +
      amplitude * Math.sin((i / (NB_PAS - 1)) * Math.PI * 2 + phase) +
      6 * Math.sin(i * 1.3 + phase * 2);
    return Math.max(0, Math.min(100, Math.round(v)));
  });
}

function tendanceDe(historique) {
  const n = historique.length;
  const ecart = historique[n - 1] - historique[n - 4];
  if (ecart > 6) return "hausse";
  if (ecart < -6) return "baisse";
  return "stable";
}

export const STATIONS = Array.from({ length: 100 }, (_, i) => {
  const type = TYPES_LISTE[Math.floor(alea() * TYPES_LISTE.length)];
  const angle = alea() * Math.PI * 2;
  const rayon = 0.008 + alea() * 0.055;
  const position = [
    CENTRE[0] + Math.sin(angle) * rayon,
    CENTRE[1] + Math.cos(angle) * rayon * 1.5,
  ];
  const base = 15 + alea() * 70;
  const historique = historiqueDe(base, alea() * Math.PI * 2, 18 + alea() * 14);
  const valeur = historique[historique.length - 1];
  const minutesDepuis = Math.floor(alea() * 180);
  return {
    id: `st${String(i + 1).padStart(2, "0")}`,
    nom: `Capteur ${String.fromCharCode(65 + (i % 26))}${Math.floor(i / 26) + 1}`,
    type,
    quartier: QUARTIERS[Math.floor(alea() * QUARTIERS.length)],
    position,
    valeur,
    categorie: categorieDe(valeur),
    nbObservations: 4 + Math.floor(alea() * 90),
    minutesDepuis,
    horodatage: Date.UTC(2026, 5, 21, 12, 0, 0) - minutesDepuis * 60000,
    fiabilite: 60 + Math.floor(alea() * 40),
    tendance: tendanceDe(historique),
    historique,
  };
});

// Zones de surveillance initiales (le niveau 5 permet d'en ajouter).
export const ZONES = [
  { id: "z1", nom: "Secteur portuaire", centre: [CENTRE[0] - 0.028, CENTRE[1] + 0.03], rayon: 900, niveau: "eleve" },
  { id: "z2", nom: "Corridor nord", centre: [CENTRE[0] + 0.035, CENTRE[1] - 0.01], rayon: 750, niveau: "moyen" },
];