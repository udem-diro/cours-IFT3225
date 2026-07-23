/**
 * Etapes-02.js
 *
 * Données du panneau flottant pour la démo 8, exercice 2 (le contexte).
 *
 * Deux exports :
 *
 *   - `projet` : l'arborescence complète du projet, dans l'ordre d'affichage.
 *     Le panneau n'affiche que les fichiers qui existent à l'étape courante.
 *
 *   - `etapes` : une entrée par section de la page. L'identifiant doit
 *     correspondre à l'attribut id passé au composant <Etape>. Ici :
 *     depart, diagnostic, p1, p2, p3, p4, recap.
 *
 * Champs d'un fichier :
 *   chemin      le chemin complet, tel qu'il figure dans `projet`
 *   etat        probleme, nouveau, modifie, allege, inchange
 *   role        une phrase : ce que le fichier fait (au clic sur le nom)
 *   commentaire l'explication, affichée AU-DESSUS du code et non dans le code
 *   code        le contenu du fichier à cette étape
 *   langage     facultatif
 *
 * Le code, le commentaire et le rôle d'un fichier non redéclaré à une étape
 * sont repris de la dernière étape qui l'a déclaré.
 */

export const projet = [
  { chemin: "src/main.jsx", role: "Le point d'entrée. Il ne change pas dans cet exercice." },
  { chemin: "src/App.jsx", role: "La racine : elle fournit l'utilisateur et compose la mise en page." },
  { chemin: "src/context/UserContext.js", role: "La création du contexte, sans JSX : évite les imports circulaires." },
  { chemin: "src/context/UserProvider.jsx", role: "La portée et la valeur : qui possède l'utilisateur, et sous quel sous-arbre." },
  { chemin: "src/hooks/useUser.js", role: "Option stricte : accès unique au contexte, avec garde hors fournisseur." },
  { chemin: "src/components/Layout.jsx", role: "La mise en page. Ne devrait rien savoir de l'utilisateur." },
  { chemin: "src/components/Header.jsx", role: "L'entête. Ne devrait rien savoir de l'utilisateur." },
  { chemin: "src/components/UserMenu.jsx", role: "Le groupement des éléments du menu. Ne lit pas l'utilisateur." },
  { chemin: "src/components/UserBadge.jsx", role: "Affiche le nom et le rôle : un vrai consommateur." },
  { chemin: "src/components/AdminLink.jsx", role: "Affiche le lien d'administration selon le rôle : un vrai consommateur." },
  { chemin: "src/pages/AccueilPage.jsx", role: "Le contenu de la page. Étranger à toute cette affaire." }
];

// ---------------------------------------------------------------------------
// Codes stables, déclarés une fois et repris ensuite.
// ---------------------------------------------------------------------------

const CODE_MAIN = `import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`;

const CODE_ACCUEIL = `export default function AccueilPage() {
  return (
    <section>
      <h1>Accueil</h1>
      <p>Le menu affiche l'utilisateur connecté et, s'il est admin, un lien d'administration.</p>
    </section>
  );
}`;

const CODE_BADGE_PROPS = `export default function UserBadge({ user }) {
  return (
    <span>
      {user.name} <em>({user.role})</em>
    </span>
  );
}`;

const CODE_ADMINLINK_PROPS = `export default function AdminLink({ user }) {
  if (user.role !== "admin") return null;
  return <a href="#admin">Administration</a>;
}`;

const CODE_BADGE_CONTEXTE = `import { useUser } from "../hooks/useUser.js";

export default function UserBadge() {
  const { user } = useUser();

  return (
    <span>
      {user.name} <em>({user.role})</em>
    </span>
  );
}`;

const CODE_ADMINLINK_CONTEXTE = `import { useUser } from "../hooks/useUser.js";

export default function AdminLink() {
  const { user } = useUser();

  if (user.role !== "admin") return null;
  return <a href="#admin">Administration</a>;
}`;

// ---------------------------------------------------------------------------

export const etapes = [
  {
    id: "depart",
    titre: "Point de départ",
    note: "Trois composants transportent une donnée qu'ils n'utilisent pas.",
    fichiers: [
      {
        chemin: "src/main.jsx",
        etat: "inchange",
        commentaire: "Le point d'entrée. Il ne bougera pas de tout l'exercice.",
        code: CODE_MAIN
      },
      {
        chemin: "src/App.jsx",
        etat: "probleme",
        role: "Possède l'utilisateur et le confie à Layout, qui n'en veut pas.",
        commentaire: "L'utilisateur est simulé pour l'instant. Le vrai flux d'authentification viendra à l'exercice 3, et remplira ce même point d'ancrage.",
        code: `import Layout from "./components/Layout.jsx";
import AccueilPage from "./pages/AccueilPage.jsx";

const utilisateurConnecte = { id: "u1", name: "Alex", role: "admin" };

export default function App() {
  return (
    <Layout user={utilisateurConnecte}>
      <AccueilPage />
    </Layout>
  );
}`
      },
      {
        chemin: "src/components/Layout.jsx",
        etat: "probleme",
        role: "Met en page, et transporte un utilisateur dont il n'a que faire.",
        commentaire: "Premier maillon de la chaine. Layout met en page : il n'a aucune raison de savoir qu'il existe un utilisateur. Et pourtant, sa signature l'exige désormais, ce qui le rend inutilisable sur une page publique.",
        code: `import Header from "./Header.jsx";

export default function Layout({ user, children }) {
  return (
    <div className="app">
      <Header user={user} />
      <main>{children}</main>
    </div>
  );
}`
      },
      {
        chemin: "src/components/Header.jsx",
        etat: "probleme",
        role: "Compose une entête, et transporte l'utilisateur au maillon suivant.",
        commentaire: "Deuxième maillon. Même constat : Header ne lit jamais `user`, il le fait suivre.",
        code: `import UserMenu from "./UserMenu.jsx";

export default function Header({ user }) {
  return (
    <header className="header">
      <strong>Bus en vue</strong>
      <UserMenu user={user} />
    </header>
  );
}`
      },
      {
        chemin: "src/components/UserMenu.jsx",
        etat: "probleme",
        role: "Groupe les éléments du menu, et distribue l'utilisateur à ses deux enfants.",
        commentaire: "Troisième et dernier maillon. UserMenu porte le nom de la donnée, ce qui trompe : lui non plus ne la lit pas, il ne fait que la répartir.",
        code: `import UserBadge from "./UserBadge.jsx";
import AdminLink from "./AdminLink.jsx";

export default function UserMenu({ user }) {
  return (
    <nav className="menu">
      <AdminLink user={user} />
      <UserBadge user={user} />
    </nav>
  );
}`
      },
      {
        chemin: "src/components/UserBadge.jsx",
        etat: "inchange",
        role: "Affiche le nom et le rôle. Un vrai consommateur.",
        commentaire: "Le premier des deux seuls composants qui utilisent réellement l'utilisateur.",
        code: CODE_BADGE_PROPS
      },
      {
        chemin: "src/components/AdminLink.jsx",
        etat: "inchange",
        role: "Affiche le lien d'administration selon le rôle. Un vrai consommateur.",
        commentaire: "Le second consommateur légitime. Deux composants ont besoin de la donnée, trois autres la transportent : le rapport est mauvais.",
        code: CODE_ADMINLINK_PROPS
      },
      {
        chemin: "src/pages/AccueilPage.jsx",
        etat: "inchange",
        commentaire: "Le contenu de la page, étranger à toute cette affaire. Il est là pour rappeler que Layout sert aussi à autre chose.",
        code: CODE_ACCUEIL
      }
    ]
  },

  {
    id: "diagnostic",
    titre: "Le diagnostic",
    note: "La donnée est partagée, le mécanisme de transmission est local. D'où le désaccord.",
    fichiers: [
      {
        chemin: "src/components/Layout.jsx",
        etat: "probleme",
        role: "En sait plus que nécessaire, et ne peut plus servir sans utilisateur."
      },
      {
        chemin: "src/components/Header.jsx",
        etat: "probleme",
        role: "Chaque changement de la forme de l'utilisateur oblige à ouvrir ce fichier."
      },
      {
        chemin: "src/components/UserMenu.jsx",
        etat: "probleme",
        role: "Le point de vérité est implicite : la donnée se passe de main en main."
      }
    ]
  },

  {
    id: "p1",
    titre: "1. Mettre une donnée partagée à disposition",
    note: "Une portée délimitée par l'arbre, et non une variable globale.",
    fichiers: [
      {
        chemin: "src/context/UserContext.js",
        etat: "nouveau",
        role: "La création du contexte, sans JSX.",
        commentaire: "Créer le contexte dans son propre fichier, sans JSX, évite les imports circulaires et permet à plusieurs modules d'y accéder sans dépendre du fournisseur. La valeur par défaut undefined servira de marqueur d'absence à l'étape suivante.",
        code: `import { createContext } from "react";

export const UserContext = createContext(undefined);`
      },
      {
        chemin: "src/context/UserProvider.jsx",
        etat: "nouveau",
        role: "La portée et la valeur : qui possède l'utilisateur, et sous quel sous-arbre.",
        commentaire: "Le fournisseur ouvre la portée : tout ce qui est rendu en dessous pourra lire la valeur, et rien au-dessus. Ce n'est donc pas une variable globale. Depuis React 19, le contexte se rend directement, sans le suffixe .Provider (qui reste toléré mais sera déprécié). La valeur sera stabilisée à l'étape 3.",
        code: `import { useState } from "react";
import { UserContext } from "./UserContext.js";

const UTILISATEUR_DEMO = { id: "u1", name: "Alex", role: "admin" };

export default function UserProvider({ children }) {
  const [user] = useState(UTILISATEUR_DEMO);

  // Depuis React 19, le contexte se rend directement comme fournisseur.
  return <UserContext value={{ user }}>{children}</UserContext>;
}`
      }
    ]
  },

  {
    id: "p2",
    titre: "2. Le contrat de consommation (option)",
    note: "Facultatif : la lecture directe suffit. Le hook ajoute une garde et un point d'accès unique.",
    fichiers: [
      { chemin: "src/context/UserContext.js", etat: "inchange" },
      { chemin: "src/context/UserProvider.jsx", etat: "inchange" },
      {
        chemin: "src/hooks/useUser.js",
        etat: "nouveau",
        role: "Option stricte : accès unique au contexte, avec garde.",
        commentaire: "Étape facultative. Sans elle, les composants liraient directement use(UserContext), et la chaine serait déjà rompue. Le hook ajoute deux protections : la garde, qui transforme un fournisseur oublié en erreur explicite plutôt qu'en valeur par défaut plausible, et le point d'accès unique, qui permettra de changer la source (un store, par exemple) sans toucher aux consommateurs. Le prix : un fichier et une indirection de plus.",
        code: `import { use } from "react";
import { UserContext } from "../context/UserContext.js";

export function useUser() {
  const contexte = use(UserContext);

  if (contexte === undefined) {
    throw new Error("useUser doit être utilisé à l'intérieur d'un <UserProvider>.");
  }

  return contexte;
}`
      }
    ]
  },

  {
    id: "p3",
    titre: "3. Stabilité et évolution de la valeur",
    note: "La valeur mémoïsée, et une forme qui prévoit sa croissance.",
    fichiers: [
      { chemin: "src/context/UserContext.js", etat: "inchange" },
      {
        chemin: "src/context/UserProvider.jsx",
        etat: "modifie",
        role: "Mémoïse la valeur pour ne pas redessiner tous les consommateurs à chaque rendu.",
        commentaire: "Sans useMemo, l'objet est reconstruit à chaque rendu du fournisseur : une nouvelle référence, donc tous les consommateurs se redessinent, alors que rien n'a changé. La valeur est un objet, et non l'utilisateur seul, exprès : l'exercice 3 y ajoutera login et logout sans casser un seul consommateur.",
        code: `import { useMemo, useState } from "react";
import { UserContext } from "./UserContext.js";

const UTILISATEUR_DEMO = { id: "u1", name: "Alex", role: "admin" };

export default function UserProvider({ children }) {
  const [user] = useState(UTILISATEUR_DEMO);

  const valeur = useMemo(() => ({ user }), [user]);

  return <UserContext value={valeur}>{children}</UserContext>;
}`
      },
      { chemin: "src/hooks/useUser.js", etat: "inchange" }
    ]
  },

  {
    id: "p4",
    titre: "4. La chaine dénouée",
    note: "Les intermédiaires sont libérés. Les consommateurs vont chercher eux-mêmes.",
    fichiers: [
      { chemin: "src/context/UserContext.js", etat: "inchange" },
      { chemin: "src/context/UserProvider.jsx", etat: "inchange" },
      { chemin: "src/hooks/useUser.js", etat: "inchange" },
      {
        chemin: "src/App.jsx",
        etat: "modifie",
        role: "Monte le fournisseur, et ne passe plus rien à Layout.",
        commentaire: "La racine ouvre la portée et compose. L'utilisateur n'est plus une prop qui descend, c'est une valeur disponible dans le sous-arbre.",
        code: `import UserProvider from "./context/UserProvider.jsx";
import Layout from "./components/Layout.jsx";
import AccueilPage from "./pages/AccueilPage.jsx";

export default function App() {
  return (
    <UserProvider>
      <Layout>
        <AccueilPage />
      </Layout>
    </UserProvider>
  );
}`
      },
      {
        chemin: "src/components/Layout.jsx",
        etat: "allege",
        role: "Ne connait plus que sa mise en page.",
        commentaire: "Plus aucune trace de `user`. Layout redevient réutilisable, y compris sur une page publique.",
        code: `import Header from "./Header.jsx";

export default function Layout({ children }) {
  return (
    <div className="app">
      <Header />
      <main>{children}</main>
    </div>
  );
}`
      },
      {
        chemin: "src/components/Header.jsx",
        etat: "allege",
        role: "Ne compose plus qu'une entête.",
        commentaire: "Deuxième maillon libéré. Sa signature ne ment plus sur ce dont il a besoin.",
        code: `import UserMenu from "./UserMenu.jsx";

export default function Header() {
  return (
    <header className="header">
      <strong>Bus en vue</strong>
      <UserMenu />
    </header>
  );
}`
      },
      {
        chemin: "src/components/UserMenu.jsx",
        etat: "allege",
        role: "Ne fait plus que grouper ses deux enfants.",
        commentaire: "Troisième maillon libéré. La chaine est rompue : plus rien ne transite par des composants indifférents.",
        code: `import UserBadge from "./UserBadge.jsx";
import AdminLink from "./AdminLink.jsx";

export default function UserMenu() {
  return (
    <nav className="menu">
      <AdminLink />
      <UserBadge />
    </nav>
  );
}`
      },
      {
        chemin: "src/components/UserBadge.jsx",
        etat: "modifie",
        role: "Va chercher lui-même la donnée dont il a besoin.",
        commentaire: "Le renversement est là : au lieu qu'on lui pousse la donnée, le composant la tire. Sa dépendance devient implicite, ce qui est le prix à payer.",
        code: CODE_BADGE_CONTEXTE
      },
      {
        chemin: "src/components/AdminLink.jsx",
        etat: "modifie",
        role: "Va chercher lui-même la donnée dont il a besoin.",
        commentaire: "Second consommateur. Notez que ces deux composants sont les seuls, dans toute l'application, à mentionner l'utilisateur.",
        code: CODE_ADMINLINK_CONTEXTE
      },
      { chemin: "src/pages/AccueilPage.jsx", etat: "inchange" }
    ]
  },

  {
    id: "recap",
    titre: "Récapitulatif",
    note: "Deux consommateurs connaissent l'utilisateur. Plus personne ne le transporte.",
    fichiers: [
      { chemin: "src/context/UserContext.js", etat: "inchange", role: "Création du contexte." },
      { chemin: "src/context/UserProvider.jsx", etat: "inchange", role: "Portée et valeur stable. Futur point d'ancrage de la session." },
      { chemin: "src/hooks/useUser.js", etat: "inchange", role: "Option stricte : accès unique, avec garde." },
      { chemin: "src/components/Layout.jsx", etat: "inchange", role: "Mise en page, et rien d'autre." },
      { chemin: "src/components/Header.jsx", etat: "inchange", role: "Entête, et rien d'autre." },
      { chemin: "src/components/UserMenu.jsx", etat: "inchange", role: "Groupement, et rien d'autre." },
      { chemin: "src/components/UserBadge.jsx", etat: "inchange", role: "Consommateur du contexte." },
      { chemin: "src/components/AdminLink.jsx", etat: "inchange", role: "Consommateur du contexte." }
    ]
  }
];