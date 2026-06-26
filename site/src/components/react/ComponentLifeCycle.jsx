import { useState, useEffect, useCallback, useRef } from "react";

/**
 * CycleDeVie : démonstration live des trois phases d'un composant via useEffect.
 * - Montage / démontage : un effet à dépendances vides [] et sa fonction de nettoyage.
 * - Mise à jour : un effet à dépendance [ligne], relancé quand la ligne change.
 * Le journal est tenu par le parent pour survivre au démontage de l'enfant.
 */
function SuiviLigne({ ligne, onLog }) {
  // Montage et démontage : s'exécute une fois à l'insertion, nettoyage au retrait.
  useEffect(() => {
    onLog("montage", "Montage : composant inséré, abonnement ouvert");
    return () => onLog("demontage", "Démontage : nettoyage, abonnement fermé");
  }, [onLog]);

  // Mise à jour : au montage, puis chaque fois que `ligne` change.
  useEffect(() => {
    onLog("maj", `Mise à jour : ligne suivie = ${ligne}`);
  }, [ligne, onLog]);

  return (
    <div className="cv__suivi">
      <span className="cv__pulse" />
      Suivi de la ligne <strong>&nbsp;{ligne}</strong>…
    </div>
  );
}

export default function CycleDeVie() {
  const [visible, setVisible] = useState(true);
  const [ligne, setLigne] = useState("11");
  const [journal, setJournal] = useState([]);
  const compteur = useRef(0);

  const log = useCallback((phase, texte) => {
    setJournal((j) => [...j, { id: ++compteur.current, phase, texte }]);
  }, []);

  const etiquette = (phase) =>
    phase === "montage" ? "Montage" : phase === "maj" ? "Mise à jour" : "Démontage";

  return (
    <div className="cv">
      <div className="cv__barre">
        <button className="cv__btn" onClick={() => setVisible((v) => !v)}>
          {visible ? "Masquer le suivi" : "Afficher le suivi"}
        </button>
        <label className="cv__lab">
          Ligne suivie
          <select
            className="cv__sel"
            value={ligne}
            disabled={!visible}
            onChange={(e) => setLigne(e.target.value)}
          >
            <option value="11">11</option>
            <option value="80">80</option>
            <option value="747">747</option>
          </select>
        </label>
        <button className="cv__btn cv__btn--sec" onClick={() => setJournal([])}>
          Vider le journal
        </button>
      </div>

      <div className="cv__scene">
        {visible ? (
          <SuiviLigne ligne={ligne} onLog={log} />
        ) : (
          <div className="cv__absent">Composant démonté.</div>
        )}
      </div>

      <ul className="cv__journal" aria-live="polite">
        {journal.length === 0 && (
          <li className="cv__vide">Le journal des effets s'affichera ici.</li>
        )}
        {journal.map((e) => (
          <li key={e.id} className={`cv__ligne cv__ligne--${e.phase}`}>
            <span className="cv__tag">{etiquette(e.phase)}</span>
            {e.texte}
          </li>
        ))}
      </ul>
      <style>{CSS}</style>
    </div>
  );
}

const CSS = `
.cv{font-family:'DM Sans',system-ui,sans-serif;border:1px solid #e2e0db;border-radius:14px;
  padding:18px 20px;max-width:520px;margin:1.5rem auto;background:#fff;color:#1a1a2e}
.cv__barre{display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-bottom:14px}
.cv__btn{font:inherit;font-weight:600;font-size:.85rem;padding:8px 14px;border:1px solid #0d9488;
  background:#0d9488;color:#fff;border-radius:9px;cursor:pointer;transition:background .15s}
.cv__btn:hover{background:#0b8276}
.cv__btn:focus-visible{outline:2px solid #0d9488;outline-offset:2px}
.cv__btn--sec{background:#fff;color:#0d9488}
.cv__btn--sec:hover{background:#f0fdfa}
.cv__lab{display:flex;align-items:center;gap:7px;font-size:.85rem;font-weight:600;color:#44485a}
.cv__sel{font:inherit;padding:6px 9px;border:1px solid #cfd4dd;border-radius:7px;background:#fff;color:#1a1a2e}
.cv__sel:disabled{opacity:.5}
.cv__scene{min-height:52px;display:flex;align-items:center;justify-content:center;
  border:1px dashed #d9d6d0;border-radius:10px;padding:12px;margin-bottom:12px}
.cv__suivi{display:flex;align-items:center;gap:9px;font-size:.95rem;color:#0d9488;font-weight:600}
.cv__pulse{width:10px;height:10px;border-radius:50%;background:#0d9488;animation:cvpulse 1.2s ease-in-out infinite}
@keyframes cvpulse{0%,100%{opacity:.3;transform:scale(.85)}50%{opacity:1;transform:scale(1.1)}}
.cv__absent{font-size:.9rem;color:#9a978f;font-style:italic}
.cv__journal{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:5px;
  max-height:190px;overflow:auto}
.cv__vide{font-size:.82rem;color:#9a978f;font-style:italic;padding:4px 0}
.cv__ligne{font-size:.83rem;display:flex;align-items:baseline;gap:9px;padding:5px 9px;border-radius:7px;
  background:#f6f5f2;line-height:1.4}
.cv__tag{font-size:.68rem;font-weight:700;text-transform:uppercase;letter-spacing:.04em;
  padding:2px 7px;border-radius:999px;flex-shrink:0;color:#fff}
.cv__ligne--montage{background:#ecfdf5}
.cv__ligne--montage .cv__tag{background:#0d9488}
.cv__ligne--maj{background:#eff6ff}
.cv__ligne--maj .cv__tag{background:#2563eb}
.cv__ligne--demontage{background:#fffbeb}
.cv__ligne--demontage .cv__tag{background:#d97706}
[data-theme="dark"] .cv{background:#10141d;border-color:#2a3142;color:#e8e8f0}
[data-theme="dark"] .cv__btn{color:#0b0f16}
[data-theme="dark"] .cv__btn--sec{background:#10141d;color:#5eead4;border-color:#2a8a80}
[data-theme="dark"] .cv__lab{color:#aab4c4}
[data-theme="dark"] .cv__sel{background:#0b0f16;color:#e8e8f0;border-color:#2a3142}
[data-theme="dark"] .cv__scene{border-color:#2a3142}
[data-theme="dark"] .cv__ligne{background:#161b25}
[data-theme="dark"] .cv__ligne--montage{background:#0e2620}
[data-theme="dark"] .cv__ligne--maj{background:#0f1d33}
[data-theme="dark"] .cv__ligne--demontage{background:#2a2410}
`;