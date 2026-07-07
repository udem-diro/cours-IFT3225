import { useRef, useEffect } from "react";
import { TYPES, couleurCategorie } from "./carteDonnees.js";

/**
 * Filtre par niveau, mesure par mesure, servant aussi de légende.
 * Chaque niveau nommé (selon la sémantique du type) est une puce cliquable ; une case
 * par mesure sélectionne ou désélectionne ses trois niveaux ; une case générale fait
 * de même pour toutes les mesures. Les cases partiellement cochées sont indéterminées.
 *
 * `actifs` : { "type:severite": booleen }. `onBasculer(cle)` inverse une puce ;
 * `onBasculerMesure(type)` inverse une ligne ; `onTout(valeur)` fixe tout.
 */
export const NIVEAUX = ["faible", "moyen", "eleve"];

function Case({ checked, indeterminate, onChange, label }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = !!indeterminate;
  }, [indeterminate]);
  return <input ref={ref} type="checkbox" checked={checked} onChange={onChange} aria-label={label} />;
}

export default function FiltreNiveaux({ actifs, onBasculer, onBasculerMesure, onTout }) {
  const types = Object.keys(TYPES);
  const toutesCles = types.flatMap((t) => NIVEAUX.map((n) => `${t}:${n}`));
  const nbOn = toutesCles.filter((k) => actifs[k]).length;
  const tout = nbOn === toutesCles.length;
  const aucun = nbOn === 0;

  const etatMesure = (type) => {
    const cles = NIVEAUX.map((n) => `${type}:${n}`);
    const on = cles.filter((k) => actifs[k]).length;
    return { checked: on === cles.length, indeterminate: on > 0 && on < cles.length };
  };

  return (
    <div className="cv-fniv" role="group" aria-label="Filtrer par mesure et niveau">
      <label className="cv-fniv__tout">
        <Case checked={tout} indeterminate={!tout && !aucun} onChange={() => onTout(!tout)} label="Tout afficher ou masquer" />
        <span className="cv-groupe-titre">Mesures et niveaux (cliquez pour filtrer)</span>
      </label>
      <ul className="cv-fniv__liste">
        {types.map((type) => {
          const t = TYPES[type];
          const em = etatMesure(type);
          return (
            <li key={type} className="cv-fniv__ligne">
              <label className="cv-fniv__mesure">
                <Case checked={em.checked} indeterminate={em.indeterminate} onChange={() => onBasculerMesure(type)} label={`Basculer ${t.libelle}`} />
                <span className="cv-glyphe" aria-hidden="true">{t.glyphe}</span>
                <span>{t.libelle} <em>({t.unite})</em></span>
              </label>
              <span className="cv-fniv__chips">
                {NIVEAUX.map((n) => {
                  const cle = `${type}:${n}`;
                  const on = !!actifs[cle];
                  return (
                    <button
                      key={n}
                      className={`cv-chipf ${on ? "on" : "off"}`}
                      style={on ? { background: couleurCategorie(n), borderColor: couleurCategorie(n) } : undefined}
                      aria-pressed={on}
                      onClick={() => onBasculer(cle)}
                    >
                      {t.niveaux[n]}
                    </button>
                  );
                })}
              </span>
            </li>
          );
        })}
      </ul>
      <style>{CSS}</style>
    </div>
  );
}

const CSS = `
.cv-fniv { font-family: 'DM Sans', system-ui, sans-serif; }
.cv-fniv .cv-groupe-titre { font-size: 0.66rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #9aa1ad; }
.cv-fniv__tout { display: inline-flex; align-items: center; gap: 7px; cursor: pointer; }
.cv-fniv__tout input { cursor: pointer; }
.cv-fniv__liste { list-style: none; margin: 6px 0 0; padding: 0; display: flex; flex-direction: column; gap: 7px; }
.cv-fniv__ligne { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; font-size: 0.84rem; color: #44445a; }
.cv-fniv__mesure { display: flex; align-items: center; gap: 7px; font: inherit; font-size: 0.84rem; color: #44445a; cursor: pointer; min-width: 168px; }
.cv-fniv__mesure input { cursor: pointer; }
.cv-fniv__mesure .cv-glyphe { font-size: 1.15rem; line-height: 1; }
.cv-fniv__mesure em { color: #9aa1ad; font-style: normal; }
.cv-fniv__chips { display: flex; gap: 6px; flex-wrap: wrap; }
.cv-chipf { color: #fff; font: inherit; font-size: 0.72rem; font-weight: 600; padding: 2px 10px; border-radius: 999px; border: 1.5px solid transparent; cursor: pointer; }
.cv-chipf.off { background: #fff; color: #b3b3c0; border-color: #e0ded8; text-decoration: line-through; }
`;