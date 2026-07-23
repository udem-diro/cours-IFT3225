import { useState } from "react";

/**
 * SimulateurEnTetes.jsx
 *
 * Simulateur d'en-têtes de cache HTTP. On choisit une politique (les en-têtes
 * que le serveur renvoie) et un scénario de visite ; le composant montre ce
 * qui se passe : requête complète, revalidation (304), ou lecture du cache
 * sans aucune requête.
 *
 * DOM pur, aucun réseau : tout est simulé. Île client:visible.
 */

const POLITIQUES = [
  {
    id: "no-store",
    nom: "no-store",
    entetes: ["Cache-Control: no-store"],
    description: "Ne jamais conserver de copie. Chaque visite retélécharge tout.",
  },
  {
    id: "no-cache",
    nom: "no-cache + ETag",
    entetes: ['Cache-Control: no-cache', 'ETag: "v42"'],
    description: "Conserver une copie, mais revalider auprès du serveur avant chaque usage.",
  },
  {
    id: "max-age",
    nom: "max-age=300",
    entetes: ["Cache-Control: max-age=300", 'ETag: "v42"'],
    description: "La copie fait foi pendant 5 minutes. Après, on revalide.",
  },
  {
    id: "immutable",
    nom: "max-age=31536000, immutable",
    entetes: ["Cache-Control: max-age=31536000, immutable"],
    description: "La copie fait foi un an : le fichier ne changera jamais (son nom contient une empreinte).",
  },
];

const SCENARIOS = [
  { id: "premiere", nom: "Première visite" },
  { id: "revisite", nom: "Revisite immédiate" },
  { id: "apres", nom: "Revisite après expiration" },
];

/**
 * Calcule le déroulement pour une politique et un scénario.
 * Renvoie { etapes: [...], bilan, verdict } où chaque étape est
 * { de, vers, texte } et verdict est "plein" | "leger" | "instant".
 */
function derouler(politique, scenario) {
  if (scenario === "premiere") {
    return {
      etapes: [
        { de: "Navigateur", vers: "Serveur", texte: "GET /app.js" },
        { de: "Serveur", vers: "Navigateur", texte: "200 + corps complet" },
      ],
      bilan:
        politique === "no-store"
          ? "Le fichier est téléchargé, et aucune copie n'est conservée."
          : "Le fichier est téléchargé, et une copie est rangée dans le cache avec ses en-têtes.",
      verdict: "plein",
    };
  }

  if (politique === "no-store") {
    return {
      etapes: [
        { de: "Navigateur", vers: "Serveur", texte: "GET /app.js" },
        { de: "Serveur", vers: "Navigateur", texte: "200 + corps complet" },
      ],
      bilan: "Pas de copie : chaque visite paie le téléchargement entier.",
      verdict: "plein",
    };
  }

  if (politique === "no-cache") {
    return {
      etapes: [
        { de: "Navigateur", vers: "Serveur", texte: 'GET /app.js + If-None-Match: "v42"' },
        { de: "Serveur", vers: "Navigateur", texte: "304 Not Modified (aucun corps)" },
        { de: "Cache", vers: "Navigateur", texte: "la copie locale est utilisée" },
      ],
      bilan:
        "Un aller-retour a lieu, mais il est minuscule : le serveur confirme que la copie est encore bonne, sans renvoyer le corps.",
      verdict: "leger",
    };
  }

  if (politique === "max-age") {
    if (scenario === "revisite") {
      return {
        etapes: [{ de: "Cache", vers: "Navigateur", texte: "copie servie, aucune requête" }],
        bilan:
          "La copie est encore fraiche (moins de 5 minutes) : le serveur n'est même pas contacté. C'est le cas le plus rapide, et aussi le plus risqué si le fichier a changé entre-temps.",
        verdict: "instant",
      };
    }
    return {
      etapes: [
        { de: "Navigateur", vers: "Serveur", texte: 'GET /app.js + If-None-Match: "v42"' },
        { de: "Serveur", vers: "Navigateur", texte: "304 Not Modified, ou 200 si le fichier a changé" },
      ],
      bilan:
        "La copie a expiré : le navigateur revalide. Si le fichier n'a pas changé, 304 et la copie repart pour 5 minutes ; sinon, 200 et la nouvelle version remplace l'ancienne.",
      verdict: "leger",
    };
  }

  // immutable
  return {
    etapes: [{ de: "Cache", vers: "Navigateur", texte: "copie servie, aucune requête" }],
    bilan:
      scenario === "apres"
        ? "Un an de fraicheur : même « plus tard », la copie fait foi. Pour livrer une nouvelle version, on ne modifie pas ce fichier, on en publie un autre sous un nouveau nom (nouvelle empreinte), référencé par le HTML."
        : "Aucune requête : la copie fait foi. C'est la politique des fichiers au nom haché produits par le build.",
    verdict: "instant",
  };
}

const VERDICTS = {
  plein: { texte: "téléchargement complet", classe: "se-plein" },
  leger: { texte: "revalidation légère", classe: "se-leger" },
  instant: { texte: "aucune requête", classe: "se-instant" },
};

export default function SimulateurEnTetes() {
  const [politique, setPolitique] = useState("max-age");
  const [scenario, setScenario] = useState("revisite");

  const pol = POLITIQUES.find((p) => p.id === politique);
  const resultat = derouler(politique, scenario);
  const verdict = VERDICTS[resultat.verdict];

  return (
    <div className="se">
      <style>{STYLE}</style>

      <div className="se__bloc">
        <p className="se__etiquette">1. La politique du serveur (les en-têtes de la réponse)</p>
        <div className="se__choix" role="group" aria-label="Politique de cache">
          {POLITIQUES.map((p) => (
            <button
              key={p.id}
              className={`se__bouton ${politique === p.id ? "on" : ""}`}
              onClick={() => setPolitique(p.id)}
              aria-pressed={politique === p.id}
            >
              {p.nom}
            </button>
          ))}
        </div>

        <pre className="se__entetes">
          <code>
            {"HTTP/1.1 200 OK\n" + pol.entetes.join("\n")}
          </code>
        </pre>
        <p className="se__description">{pol.description}</p>
      </div>

      <div className="se__bloc">
        <p className="se__etiquette">2. Le scénario</p>
        <div className="se__choix" role="group" aria-label="Scénario de visite">
          {SCENARIOS.map((s) => (
            <button
              key={s.id}
              className={`se__bouton ${scenario === s.id ? "on" : ""}`}
              onClick={() => setScenario(s.id)}
              aria-pressed={scenario === s.id}
            >
              {s.nom}
            </button>
          ))}
        </div>
      </div>

      <div className="se__bloc">
        <p className="se__etiquette">
          3. Ce qui se passe
          <span className={`se__verdict ${verdict.classe}`}>{verdict.texte}</span>
        </p>

        <ol className="se__etapes">
          {resultat.etapes.map((etape, index) => (
            <li key={index} className="se__etape">
              <span className={`se__acteur ${etape.de === "Cache" ? "se__acteur--cache" : ""}`}>
                {etape.de}
              </span>
              <span className="se__fleche" aria-hidden="true">&#8594;</span>
              <span className={`se__acteur ${etape.vers === "Cache" ? "se__acteur--cache" : ""}`}>
                {etape.vers}
              </span>
              <span className="se__texte">{etape.texte}</span>
            </li>
          ))}
        </ol>

        <p className="se__bilan">{resultat.bilan}</p>
      </div>
    </div>
  );
}

const STYLE = `
.se {
  margin: 1.5rem 0;
  border: 1px solid var(--se-bordure, #e5e7eb);
  border-radius: 14px;
  padding: 14px 16px;
  font-size: 0.9rem;
  background: var(--se-surface, #fff);
}
.se__bloc + .se__bloc { margin-top: 14px; }
.se__etiquette {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 8px;
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #9aa1ad;
}
.se__choix { display: flex; flex-wrap: wrap; gap: 6px; }
.se__bouton {
  font: inherit;
  font-size: 0.8rem;
  font-weight: 600;
  padding: 6px 11px;
  border: 1.5px solid #e5e7eb;
  border-radius: 999px;
  background: transparent;
  color: inherit;
  cursor: pointer;
}
.se__bouton:hover { border-color: #0d7c70; }
.se__bouton.on { background: #0d7c70; border-color: #0d7c70; color: #fff; }
.se__entetes {
  margin: 10px 0 6px;
  padding: 9px 12px;
  background: #0f172a;
  border-radius: 10px;
  overflow-x: auto;
}
.se__entetes code {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.78rem;
  color: #a5f3e8;
  background: none;
  white-space: pre;
}
.se__description { margin: 0; color: #6b7280; font-size: 0.84rem; }
.se__verdict {
  font-size: 0.7rem;
  letter-spacing: normal;
  text-transform: none;
  padding: 2px 9px;
  border-radius: 999px;
}
.se-plein { background: #fee2e2; color: #991b1b; }
.se-leger { background: #fef3c7; color: #92400e; }
.se-instant { background: #dcfce7; color: #166534; }
.se__etapes {
  list-style: none;
  margin: 0 0 10px;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.se__etape {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}
.se__acteur {
  font-size: 0.76rem;
  font-weight: 700;
  padding: 3px 9px;
  border-radius: 8px;
  background: #eef2f7;
  color: #334155;
}
.se__acteur--cache { background: #e9f7f5; color: #0d7c70; }
.se__fleche { color: #94a3b8; }
.se__texte {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.78rem;
  color: #475569;
}
.se__bilan {
  margin: 0;
  padding: 9px 11px;
  background: #f8fafc;
  border-left: 3px solid #0d7c70;
  border-radius: 8px;
  color: #475569;
  font-size: 0.84rem;
}

[data-theme="dark"] .se { --se-surface: #161b25; --se-bordure: #2a3142; }
[data-theme="dark"] .se__acteur { background: #1c2230; color: #cbd5e1; }
[data-theme="dark"] .se__acteur--cache { background: #10241f; color: #7fdccf; }
[data-theme="dark"] .se__texte { color: #b6bccb; }
[data-theme="dark"] .se__bilan { background: #10141c; color: #b6bccb; }
[data-theme="dark"] .se__bouton { border-color: #2a3142; }
`;