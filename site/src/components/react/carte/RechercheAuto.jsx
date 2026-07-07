import { useState, useRef, useEffect } from "react";

/**
 * Barre de recherche avec auto-complétion. Affiche une liste de suggestions
 * filtrées au fil de la saisie, navigable au clavier (flèches, Entrée, Échap) et à
 * la souris. Réutilisable : l'appelant fournit les `suggestions`
 * ({ cle, libelle, sousTitre?, glyphe? }) et réagit à `onChange` (texte) et
 * `onSelectionner` (suggestion choisie).
 */
export default function RechercheAuto({ valeur, onChange, onSelectionner, suggestions, placeholder = "Rechercher...", maxItems = 8 }) {
  const [ouvert, setOuvert] = useState(false);
  const [index, setIndex] = useState(-1);
  const conteneur = useRef(null);

  useEffect(() => {
    const surClicExterne = (e) => {
      if (conteneur.current && !conteneur.current.contains(e.target)) setOuvert(false);
    };
    document.addEventListener("mousedown", surClicExterne);
    return () => document.removeEventListener("mousedown", surClicExterne);
  }, []);

  const q = valeur.trim().toLowerCase();
  const liste =
    q === ""
      ? []
      : suggestions
          .filter((s) => s.libelle.toLowerCase().includes(q) || (s.sousTitre ?? "").toLowerCase().includes(q))
          .slice(0, maxItems);

  const choisir = (s) => {
    onSelectionner(s);
    setOuvert(false);
    setIndex(-1);
  };

  const surTouche = (e) => {
    if (!ouvert || liste.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIndex((i) => Math.min(i + 1, liste.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && index >= 0) {
      e.preventDefault();
      choisir(liste[index]);
    } else if (e.key === "Escape") {
      setOuvert(false);
    }
  };

  return (
    <div className="cv-auto" ref={conteneur}>
      <div className="cv-recherche">
        <span className="cv-recherche__icone" aria-hidden="true">🔎</span>
        <input
          type="search"
          value={valeur}
          onChange={(e) => { onChange(e.target.value); setOuvert(true); setIndex(-1); }}
          onFocus={() => setOuvert(true)}
          onKeyDown={surTouche}
          placeholder={placeholder}
          aria-label="Rechercher"
          role="combobox"
          aria-expanded={ouvert}
          aria-autocomplete="list"
        />
        {valeur && (
          <button className="cv-recherche__x" onMouseDown={(e) => { e.preventDefault(); onChange(""); }} aria-label="Effacer la recherche">×</button>
        )}
      </div>

      {ouvert && liste.length > 0 && (
        <ul className="cv-auto__liste" role="listbox">
          {liste.map((s, i) => (
            <li
              key={s.cle}
              role="option"
              aria-selected={i === index}
              className={`cv-auto__item ${i === index ? "on" : ""}`}
              onMouseDown={(e) => { e.preventDefault(); choisir(s); }}
              onMouseEnter={() => setIndex(i)}
            >
              {s.glyphe && <span className="cv-glyphe" aria-hidden="true">{s.glyphe}</span>}
              <span className="cv-auto__libelle">{s.libelle}</span>
              {s.sousTitre && <span className="cv-auto__sous">{s.sousTitre}</span>}
            </li>
          ))}
        </ul>
      )}

      <style>{CSS}</style>
    </div>
  );
}

const CSS = `
.cv-auto { position: relative; font-family: 'DM Sans', system-ui, sans-serif; }
.cv-recherche { display: inline-flex; align-items: center; gap: 6px; background: #fff; border: 1px solid #d8d6d0; border-radius: 9px; padding: 6px 10px; min-width: 240px; }
.cv-recherche__icone { opacity: 0.6; font-size: 0.9rem; }
.cv-recherche input { border: 0; outline: 0; font: inherit; font-size: 0.86rem; flex: 1; min-width: 0; background: transparent; color: #1a1a2e; }
.cv-recherche__x { border: 0; background: transparent; cursor: pointer; color: #9898ab; font-size: 1.15rem; line-height: 1; }
.cv-auto__liste { position: absolute; z-index: 500; top: calc(100% + 4px); left: 0; right: 0; margin: 0; padding: 4px; list-style: none; background: #fff; border: 1px solid #e0ded8; border-radius: 10px; box-shadow: 0 14px 34px rgba(15,23,42,0.16); max-height: 260px; overflow: auto; }
.cv-auto__item { display: flex; align-items: center; gap: 8px; padding: 7px 9px; border-radius: 7px; cursor: pointer; font-size: 0.85rem; color: #1a1a2e; }
.cv-auto__item.on { background: #ecfdf9; }
.cv-auto__item .cv-glyphe { font-size: 1rem; line-height: 1; }
.cv-auto__libelle { font-weight: 600; }
.cv-auto__sous { margin-left: auto; font-size: 0.76rem; color: #9aa1ad; }
`;