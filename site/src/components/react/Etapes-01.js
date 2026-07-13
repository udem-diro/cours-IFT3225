/**
 * Données du panneau flottant pour l'exercice 1 (service, hook, Page).
 *
 * Deux exports :
 *
 *   - `projet` : l'arborescence complète du projet, dans l'ordre d'affichage.
 *     Le panneau n'affiche que les fichiers qui existent à l'étape courante.
 *
 *   - `etapes` : une entrée par section de la page (l'identifiant doit
 *     correspondre à l'attribut id passé au composant <Etape>). Chaque étape
 *     déclare, pour les fichiers qu'elle touche, un état, un commentaire et le
 *     code du fichier À CE MOMENT du refactoring.
 *
 * Champs d'un fichier :
 *   chemin      le chemin complet, tel qu'il figure dans `projet`
 *   etat        probleme, nouveau, modifie, allege, inchange
 *   role        une phrase : ce que le fichier fait (affichée au clic sur le nom)
 *   commentaire l'explication pédagogique, affichée AU-DESSUS du code et non
 *               dans le code, pour que le code reste lisible tel quel
 *   code        le contenu du fichier à cette étape
 *   langage     facultatif, pour l'affichage
 *
 * Le code, le commentaire et le rôle d'un fichier non redéclaré à une étape
 * sont repris de la dernière étape qui l'a déclaré : le panneau remonte les
 * étapes pour les retrouver.
 */

export const projet = [
  { chemin: "public/lignes.json", role: "La source de données." },
  { chemin: "src/main.jsx", role: "Le point d'entrée de l'application." },
  { chemin: "src/App.jsx", role: "La racine de l'application : elle choisit ce qui est affiché." },
  { chemin: "src/api/bus.js", role: "Passerelle vers les données : le seul module qui connait l'URL et fetch." },
  { chemin: "src/hooks/useLignes.js", role: "Le cycle de vie du chargement, réutilisable par n'importe quelle Page." },
  { chemin: "src/pages/LignesPage.jsx", role: "L'orchestration : déclenche le chargement et tient l'état d'interface." },
  { chemin: "src/components/FiltreBarre.jsx", role: "La politique du filtre : minimum de caractères et temporisation. Sans état propre." },
  { chemin: "src/components/LignesList.jsx", role: "L'affichage des lignes, et rien d'autre." }
];

// ---------------------------------------------------------------------------
// Codes stables, déclarés une fois et repris ensuite.
// ---------------------------------------------------------------------------

const CODE_LIGNES_JSON = `[
  { "id": "l1", "numero": "18", "nom": "Beaubien", "arrets": 42 },
  { "id": "l2", "numero": "51", "nom": "Édouard-Montpetit", "arrets": 35 },
  { "id": "l3", "numero": "80", "nom": "Avenue du Parc", "arrets": 29 },
  { "id": "l4", "numero": "24", "nom": "Sherbrooke", "arrets": 58 }
]`;

const CODE_MAIN = `import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`;

const CODE_APP_DEPART = `import LignesList from "./components/LignesList.jsx";

export default function App() {
  return (
    <main className="app">
      <LignesList />
    </main>
  );
}`;

const CODE_LIGNESLIST_DEPART = `import { useEffect, useState } from "react";

export default function LignesList() {
  const [lignes, setLignes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtre, setFiltre] = useState("");

  useEffect(() => {
    let annule = false;
    setLoading(true);

    fetch("/lignes.json")
      .then((result) => {
        if (!result.ok) throw new Error(\`HTTP \${result.status}\`);
        return result.json();
      })
      .then((data) => {
        if (!annule) {
          setLignes(data);
          setError(null);
        }
      })
      .catch((err) => {
        if (!annule) setError(err.message);
      })
      .finally(() => {
        if (!annule) setLoading(false);
      });

    return () => {
      annule = true;
    };
  }, []);

  if (loading) return <p>Chargement…</p>;
  if (error) return <p>Erreur : {error}</p>;

  const visibles = lignes.filter((ligne) =>
    ligne.nom.toLowerCase().includes(filtre.toLowerCase())
  );

  return (
    <section>
      <input
        value={filtre}
        onChange={(event) => setFiltre(event.target.value)}
        placeholder="Filtrer une ligne"
      />
      <ul>
        {visibles.map((ligne) => (
          <li key={ligne.id}>
            <strong>{ligne.numero}</strong> {ligne.nom} ({ligne.arrets} arrêts)
          </li>
        ))}
      </ul>
    </section>
  );
}`;

const COMMENTAIRE_LIGNESLIST_DEPART =
  "Quatre responsabilités dans un seul fichier : la communication réseau, les états de chargement et d'erreur, le filtre, et l'affichage. Quatre raisons de changer, donc quatre raisons de casser.";

const CODE_LIGNESLIST_FINAL = `export default function LignesList({ lignes }) {
  if (lignes.length === 0) {
    return <p>Aucune ligne ne correspond.</p>;
  }

  return (
    <ul className="lignes">
      {lignes.map((ligne) => (
        <li key={ligne.id}>
          <strong>{ligne.numero}</strong> {ligne.nom} ({ligne.arrets} arrêts)
        </li>
      ))}
    </ul>
  );
}`;


// ---------------------------------------------------------------------------

export const etapes = [
  {
    id: "depart",
    titre: "Le point de départ",
    note: "Un seul fichier porte quatre responsabilités.",
    fichiers: [
      {
        chemin: "public/lignes.json",
        etat: "inchange",
        langage: "json",
        commentaire: "La source de données. Normalement, elle viendrait d'une véritable API.",
        code: CODE_LIGNES_JSON
      },
      {
        chemin: "src/main.jsx",
        etat: "inchange",
        commentaire: "Le point d'entrée de l'application.",
        code: CODE_MAIN
      },
      {
        chemin: "src/App.jsx",
        etat: "inchange",
        commentaire: "LignesList se débrouille seul : App ne lui passe rien, et ne sait rien de ce qu'il fait.",
        code: CODE_APP_DEPART
      },
      {
        chemin: "src/components/LignesList.jsx",
        etat: "probleme",
        role: "Appelle le réseau, gère le chargement et l'erreur, tient le filtre, et affiche.",
        commentaire: COMMENTAIRE_LIGNESLIST_DEPART,
        code: CODE_LIGNESLIST_DEPART
      }
    ]
  },

  {
    id: "diagnostic",
    titre: "Diagnostic",
    note: "Cinq faiblesses, cinq principes. Le refactoring suit.",
    fichiers: [
      {
        chemin: "src/components/LignesList.jsx",
        etat: "probleme",
        role: "Couplé à la source, gère le cycle de vie, s'occupe du chargement, et orchestre en plus d'exécuter."
      }
    ]
  },

  {
    id: "p1",
    titre: "1. Isoler la source",
    note: "Le composant ne connait plus l'URL.",
    fichiers: [
      {
        chemin: "src/api/bus.js",
        etat: "nouveau",
        role: "Passerelle vers les données. Seul module qui connait l'URL et fetch.",
        commentaire: "Couche d'accès aux données : le seul module qui connait les URL et fetch. Changer de source (fichier statique, API Express, faux de test) ne touchera que ce fichier, jamais les composants.",
        code: `export async function fetchLignes() {
  const result = await fetch("/lignes.json");

  if (!result.ok) {
    throw new Error(\`Impossible de charger les lignes (HTTP \${result.status}).\`);
  }

  return result.json();
}`
      },
      {
        chemin: "src/components/LignesList.jsx",
        etat: "allege",
        role: "Ne construit plus la requête : il appelle le service.",
        commentaire: "L'URL a disparu d'ici : le composant demande, il ne construit plus. Le reste (états, filtre, affichage) est encore là, et sera traité aux étapes suivantes.",
        code: `import { useEffect, useState } from "react";
import { fetchLignes } from "../api/bus.js";

export default function LignesList() {
  const [lignes, setLignes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtre, setFiltre] = useState("");

  useEffect(() => {
    let annule = false;
    setLoading(true);

    fetchLignes()
      .then((data) => {
        if (!annule) {
          setLignes(data);
          setError(null);
        }
      })
      .catch((err) => {
        if (!annule) setError(err.message);
      })
      .finally(() => {
        if (!annule) setLoading(false);
      });

    return () => {
      annule = true;
    };
  }, []);

  if (loading) return <p>Chargement…</p>;
  if (error) return <p>Erreur : {error}</p>;

  const visibles = lignes.filter((ligne) =>
    ligne.nom.toLowerCase().includes(filtre.toLowerCase())
  );

  return (
    <section>
      <input
        value={filtre}
        onChange={(event) => setFiltre(event.target.value)}
        placeholder="Filtrer une ligne"
      />
      <ul>
        {visibles.map((ligne) => (
          <li key={ligne.id}>
            <strong>{ligne.numero}</strong> {ligne.nom} ({ligne.arrets} arrêts)
          </li>
        ))}
      </ul>
    </section>
  );
}`
      }
    ]
  },

  {
    id: "p2",
    titre: "2. Extraire le cycle de vie du chargement de données",
    note: "Le chargement devient réutilisable.",
    fichiers: [
      { chemin: "src/api/bus.js", etat: "inchange" },
      {
        chemin: "src/hooks/useLignes.js",
        etat: "nouveau",
        role: "Encapsule les états de chargement et d'erreur, et leur enchainement.",
        commentaire: "La machine à états du chargement, extraite du composant. Elle ne dessine rien : elle renseigne sur l'état des données. N'importe quelle Page peut la réutiliser sans reproduire cette mécanique.",
        code: `import { useEffect, useState } from "react";
import { fetchLignes } from "../api/bus.js";

export function useLignes() {
  const [lignes, setLignes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let annule = false;
    setLoading(true);

    fetchLignes()
      .then((data) => {
        if (!annule) {
          setLignes(data);
          setError(null);
        }
      })
      .catch((err) => {
        if (!annule) setError(err.message);
      })
      .finally(() => {
        if (!annule) setLoading(false);
      });

    return () => {
      annule = true;
    };
  }, []);

  return { lignes, loading, error };
}`
      },
      {
        chemin: "src/components/LignesList.jsx",
        etat: "allege",
        role: "Ne gère plus loading ni error : il appelle le hook.",
        commentaire: "Trois useState et un useEffect remplacés par une ligne. Le composant affiche, et tient encore le filtre.",
        code: `import { useState } from "react";
import { useLignes } from "../hooks/useLignes.js";

export default function LignesList() {
  const { lignes, loading, error } = useLignes();
  const [filtre, setFiltre] = useState("");

  if (loading) return <p>Chargement…</p>;
  if (error) return <p>Erreur : {error}</p>;

  const visibles = lignes.filter((ligne) =>
    ligne.nom.toLowerCase().includes(filtre.toLowerCase())
  );

  return (
    <section>
      <input
        value={filtre}
        onChange={(event) => setFiltre(event.target.value)}
        placeholder="Filtrer une ligne"
      />
      <ul>
        {visibles.map((ligne) => (
          <li key={ligne.id}>
            <strong>{ligne.numero}</strong> {ligne.nom} ({ligne.arrets} arrêts)
          </li>
        ))}
      </ul>
    </section>
  );
}`
      }
    ]
  },

  {
    id: "p3",
    titre: "3. Rendre la vue passive",
    note: "La vue devient passive, mais l'orchestration retombe sur App, faute de mieux. L'étape 4 corrigera cela.",
    fichiers: [
      { chemin: "src/api/bus.js", etat: "inchange" },
      { chemin: "src/hooks/useLignes.js", etat: "inchange" },
      {
        chemin: "src/components/LignesList.jsx",
        etat: "allege",
        role: "Composant présentiel : il reçoit lignes en props et affiche.",
        commentaire: "Le composant déclare ses besoins en données par ses paramètres et laisse au parent le soin de les fournir. Fonction pure, hautement réutilisable, et même déchargée du filtre",
        code: CODE_LIGNESLIST_FINAL
      },
       {
        chemin: "src/components/FiltreBarre.jsx",
        etat: "nouveau",
        role: "La politique du filtre : minimum de caractères et temporisation.",
        commentaire: "Le composant ne détient plus d'état, mais il détient une politique : le minimum de caractères et la pause dans la frappe. Puisque le parent doit pouvoir réinitialiser le champ, la saisie est écrite par les deux, donc partagée, donc remontée. Deux états distincts subsistent chez le parent : la saisie (le texte tapé) et le filtre (le terme appliqué, dérivé du premier par la règle).",
        code: `import { useEffect } from "react";
 
export default function FiltreBarre({ saisie, surSaisie, surChangement, minimum = 2, delai = 250 }) {
  // Règles internes : on n'applique le filtre qu'après une pause dans la frappe,
  // et seulement au-dela d'un nombre minimal de caractères.
  useEffect(() => {
    const terme = saisie.trim();
    const effectif = terme.length >= minimum ? terme : "";
 
    const minuterie = setTimeout(() => surChangement(effectif), delai);
    return () => clearTimeout(minuterie);
  }, [saisie, minimum, delai, surChangement]);
 
  return (
    <input value={saisie} onChange={(event) => surSaisie(event.target.value)}
           placeholder="Filtrer une ligne" aria-label="Filtrer une ligne" />
  );
}`
      },
      {
        chemin: "src/App.jsx",
        etat: "modifie",
        role: "A hérité du chargement et du filtre.",
        commentaire: "Étape intermédiaire, volontairement imparfaite : la vue est enfin passive, mais c'est App qui a récupéré le chargement et le filtre. Un fourre-tout chasse l'autre. Il manque une pièce dont le rôle serait précisément d'orchestrer.",
        code: `import { useState } from "react";
import { useLignes } from "./hooks/useLignes.js";
import LignesList from "./components/LignesList.jsx";

export default function App() {
  const { lignes, loading, error } = useLignes();
  const [saisie, setSaisie] = useState("");
  const [filtre, setFiltre] = useState("");

  if (loading) return <p>Chargement…</p>;
  if (error) return <p>Erreur : {error}</p>;

  const visibles = lignes.filter((ligne) =>
    ligne.nom.toLowerCase().includes(filtre.toLowerCase())
  );

  return (
    <main className="app">
      <h1>Lignes de bus</h1>
      <FiltreBarre saisie={saisie} surSaisie={setSaisie} surChangement={setFiltre} />
      <LignesList lignes={visibles} />
    </main>
  );
}`
      }
    ]
  },

  {
    id: "p4",
    titre: "4. Confier l'orchestration",
    note: "État de données et état d'interface se séparent. App redevient une simple racine.",
    fichiers: [
      { chemin: "src/api/bus.js", etat: "inchange" },
      { chemin: "src/hooks/useLignes.js", etat: "inchange" },
      {
        chemin: "src/pages/LignesPage.jsx",
        etat: "nouveau",
        role: "Déclenche le chargement, tient l'état d'interface, et passe les données à la vue.",
        commentaire: "Le contrôleur de l'écran. Deux natures d'état, une ligne chacune : les données viennent du serveur et peuvent échouer, le filtre n'existe que dans cet écran et ne peut pas échouer.",
        code: `import { useMemo, useState } from "react";
import { useLignes } from "../hooks/useLignes.js";
import FiltreBarre from "../components/FiltreBarre.jsx";
import LignesList from "../components/LignesList.jsx";

export default function LignesPage() {
  const { lignes, loading, error } = useLignes(); // état de données
  const [saisie, setSaisie] = useState("");       // le texte tapé
  const [filtre, setFiltre] = useState("");       // le filtre appliqué

  const reinitialiser = () => {
    setSaisie("");
    setFiltre("");
  };
 
  const visibles = lignes.filter((ligne) =>
    ligne.nom.toLowerCase().includes(filtre.toLowerCase())
  );

  if (loading) return <p>Chargement des lignes…</p>;
  if (error) return <p role="alert">Erreur : {error}</p>;

  return (
    <section>
      <h1>Lignes de bus</h1>
      <FiltreBarre saisie={saisie} surSaisie={setSaisie} surChangement={setFiltre} />
      <button onClick={reinitialiser} disabled={!saisie}>Effacer</button>
      <LignesList lignes={visibles} />
    </section>
  );
}`
      },
      {
        chemin: "src/App.jsx",
        etat: "allege",
        role: "Redevient une simple racine : elle choisit la page.",
        commentaire: "App ne sait plus rien du chargement ni du filtre. Elle compose, et c'est tout ce qu'on lui demande.",
        code: `import LignesPage from "./pages/LignesPage.jsx";

export default function App() {
  return (
    <main className="app">
      <LignesPage />
    </main>
  );
}`
      },
      { chemin: "src/components/FiltreBarre.jsx", etat: "inchange" },
      { chemin: "src/components/LignesList.jsx", etat: "inchange" }
    ]
  },
  {
    id: "recap",
    titre: "Récapitulatif",
    note: "Cinq fichiers, cinq responsabilités. Chaque fichier n'a plus qu'une seule raison de changer..",
    fichiers: [
      { chemin: "src/api/bus.js", etat: "inchange", role: "Récupération de données, et rien d'autre." },
      { chemin: "src/hooks/useLignes.js", etat: "inchange", role: "Gestion du cycle de vie du chargement de données." },
      { chemin: "src/pages/LignesPage.jsx", etat: "inchange", role: "Orchestration des petits composants et état partagé." },
      { chemin: "src/components/FiltreBarre.jsx", etat: "inchange", role: "Politique du filtre : minimum et temporisation." },
      { chemin: "src/components/LignesList.jsx", etat: "inchange", role: "Affichage d'une liste de lignes." }
    ]
  }
];