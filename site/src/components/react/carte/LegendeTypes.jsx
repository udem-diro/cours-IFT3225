import { TYPES, couleurCategorie } from "./carteDonnees.js";

/**
 * Légende par type : chaque mesure (air, eau, bruit) affiche son icône, son unité,
 * et ses trois niveaux nommés selon sa propre sémantique, avec la couleur de gravité.
 * Montre directement que les niveaux sont liés au type.
 */
const NIVEAUX = ["faible", "moyen", "eleve"];

export default function LegendeTypes() {
  return (
    <div className="cv-legende2">
      <span className="cv-legende-titre">Icône = mesure · couleur = niveau (selon la mesure)</span>
      <ul className="cv-legende2__liste">
        {Object.entries(TYPES).map(([cle, t]) => (
          <li key={cle} className="cv-legende2__ligne">
            <span className="cv-glyphe" aria-hidden="true">{t.glyphe}</span>
            <span className="cv-legende2__type">{t.libelle} <em>({t.unite})</em></span>
            <span className="cv-legende2__niveaux">
              {NIVEAUX.map((n) => (
                <span key={n} className="cv-chip" style={{ background: couleurCategorie(n) }}>{t.niveaux[n]}</span>
              ))}
            </span>
          </li>
        ))}
      </ul>
      <style>{CSS}</style>
    </div>
  );
}

const CSS = `
.cv-legende2 { margin-top: 10px; font-family: 'DM Sans', system-ui, sans-serif; }
.cv-legende-titre { font-size: 0.66rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #9aa1ad; }
.cv-legende2__liste { list-style: none; margin: 6px 0 0; padding: 0; display: flex; flex-direction: column; gap: 7px; }
.cv-legende2__ligne { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; font-size: 0.84rem; color: #44445a; }
.cv-legende2__ligne .cv-glyphe { font-size: 1.15rem; line-height: 1; }
.cv-legende2__type { min-width: 158px; }
.cv-legende2__type em { color: #9aa1ad; font-style: normal; }
.cv-legende2__niveaux { display: flex; gap: 6px; flex-wrap: wrap; }
.cv-chip { color: #fff; font-size: 0.72rem; font-weight: 600; padding: 2px 9px; border-radius: 999px; }
`;