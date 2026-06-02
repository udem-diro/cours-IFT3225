/**
 * nav.ts — Structure de navigation du site.
 *
 * Source unique de vérité pour la sidebar. Modifie ici pour
 * ajouter/réordonner des pages. Le layout lit cette structure.
 *
 * `href` correspond au chemin de la page (sans extension).
 */

export interface NavItem {
  label: string;
  href: string;
}

export interface NavGroup {
  titre: string;
  items: NavItem[];
}

export const navigation: NavGroup[] = [
  {
    titre: "Le cours",
    items: [
      { label: "Accueil", href: "/" }
    ],
  },
  // {
  //   titre: "Notes de cours",
  //   items: [
  //     { label: "Séance 1", href: "/sessions/seance-01" },
  //     { label: "Séance 2", href: "/sessions/seance-02" },
  //     { label: "Séance 3", href: "/sessions/seance-03" },
  //     { label: "Séance 4", href: "/sessions/seance-04" },
  //     { label: "Séance 5", href: "/sessions/seance-05" },
  //   ],
  // },
  {
    titre: "Guide",
    items: [
      { label: "Intro à Node.js et npm", href: "/guides/tuto-nodejs" },
      { label: "Intro à JavaScript (partie 1)", href: "/guides/tuto-javascript-1" },
      { label: "Intro à JavaScript (partie 2)", href: "/guides/tuto-javascript-2" },
      // { label: "Les bases du DOM", href: "/guides/tuto-dom" },
      { label: "Concevoir une API", href: "/guides/tuto-conception-api" },
      { label: "Prise en main d'Express", href: "/guides/tuto-express" },
    ],
  },
  // {
  //   titre: "Activités",
  //   items: [
  //     { label: "Comparer trois systèmes", href: "/activites/comparer-systemes" },
  //   ],
  // },
  {
    titre: "Projet",
    items: [
      { label: "Phase 1 — Collecte", href: "/projets/phase-01" },
    ],
  },
];
