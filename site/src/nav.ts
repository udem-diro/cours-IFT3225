export interface NavItem {
  label: string;
  href: string;
  children?: NavItem[];
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
  {
    titre: "Notes",
    items: [
      { label: "Conception d'API", href: "/notes/conception-api" },
      { label: "Stratégie de persistance", href: "/notes/persistance" },
      { label: "Identité et Authentification", href: "/notes/identite" },
      { label: "Interface réactive", href: "/notes/interface-reactive" },
      { label: "Développement coté client", href: "/notes/outils-frontend" },
      // { label: "Visualisation", href: "/notes/visualisation" },
      { label: "Déploiement", href: "/notes/deploiement" },
      
      { label: "Performance", href: "/notes/performance" },
      // { label: "Cache et PWA ⭐", href: "/notes/cache-pwa" },
    ],
  },
  {
    titre: "Guides",
    items: [
      { label: "Intro à Node.js et npm", href: "/guides/tuto-nodejs" },
      { label: "Intro à JavaScript (partie 1)", href: "/guides/tuto-javascript-1" },
      { label: "Intro à JavaScript (partie 2)", href: "/guides/tuto-javascript-2" },
      { label: "Prise en main d'Express", href: "/guides/tuto-express" },
      { label: "Prise en main de MongoDB", href: "/guides/tuto-mongo" },
      // { label: "Les middlewares dans Express", href: "/guides/tuto-express-middleware" },
      { label: "Les bases du DOM", href: "/guides/tuto-dom-1" },
      { label: "Manipulation du DOM", href: "/guides/tuto-dom-2" },
      { label: "Création d'une TodoList", href: "/guides/tuto-todolist" },
      // { label: "Persister une TodoList ⭐", href: "/guides/tuto-todolist-2" },
      { label: "Prise en main de React", href: "/guides/tuto-react-1" },
      { label: "Les hooks dans React", href: "/guides/tuto-react-2" },
      { label: "Application complexe React", href: "/guides/tuto-react-3" },
      { label: "Personnalisation avec React", href: "/guides/tuto-react-4" },
      // { label: "Mise en ligne de Bus en Vue ⭐", href: "/guides/mise-en-ligne" },
      // { label: "Création d'une TodoList avec React ⭐", href: "/guides/tuto-todolist-react" },
      // { label: "Visualisation avec carte ⭐", href: "/guides/visualisation-carte" },
    ],
  },
  {
    titre: "Tutos & Demos",
    items: [
      { 
        label: "Démo 8 : Réusinage React", href: "/exams/revision", 
        children: [
          { label: "Sortir la logique d'un composant", href: "/tutos/refactor-react-01" },
          { label: "De la chaine de props au contexte", href: "/tutos/refactor-react-02" },
        ]
      }
    ]
  },
  // {
  //   titre: "Réflexions",
  //   items: [
  //     { label: "Le protocole comme interaction", href: "/notes/protocole" },
  //   ],
  // },
  {
    titre: "Révision",
    items: [
      {
        label: "Récapitulatif pour l'intra", href: "/exams/revision-intra", 
        children: [
          { label: "Formatif pour l'intra", href: "/exams/formatif-intra" },
          { label: "Formatif pour l'intra (corrigé)", href: "/exams/formatif-intra-corrige" },
        ]
      },
      {
        label: "Récapitulatif pour le final", href: "/exams/revision-final", 
        children: [
          { label: "Formatif pour le final", href: "/exams/formatif-final" },
          // { label: "Formatif pour l'intra (corrigé)", href: "/exams/formatif-intra-corrige" },
        ]
      },
    ],
  },
  {
    titre: "Projet",
    items: [
      { label: "Phase 1 : Collecte", href: "/projets/phase-01" },
      // { label: "Phase 1 : Collecte (Retour)", href: "/projets/phase-01-re" },
      { label: "Phase 2 : Visualisation", href: "/projets/phase-02" },
    ],
  },
];
