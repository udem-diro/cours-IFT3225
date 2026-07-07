import { useState } from "react";
import SegmenteControle from "../carte/SegmenteControle.jsx";

/**
 * Visualiseur de stratégies de cache : on choisit une stratégie, on peut passer hors
 * ligne, et chaque requête indique si la réponse vient du réseau ou du cache, avec sa
 * latence. Île React pure, sûre au rendu serveur.
 */
const NET = 210, HIT = 6;

function requete(strat, enLigne, cache) {
  if (strat === "cache") {
    if (cache) return { source: "cache", latence: HIT, note: "Servi depuis le cache, sans toucher au réseau.", cache: true };
    if (enLigne) return { source: "reseau", latence: NET, note: "Cache vide : requête réseau, puis mise en cache.", cache: true };
    return { source: "echec", latence: 0, note: "Cache vide et hors ligne : échec.", cache: false };
  }
  if (strat === "reseau") {
    if (enLigne) return { source: "reseau", latence: NET, note: "Requête réseau, le cache est mis à jour.", cache: true };
    if (cache) return { source: "cache", latence: HIT, note: "Réseau indisponible : repli sur le cache.", cache: true };
    return { source: "echec", latence: 0, note: "Hors ligne et cache vide : échec.", cache: false };
  }
  if (cache) return { source: "cache", latence: HIT, note: enLigne ? "Servi depuis le cache aussitôt, puis revalidé en arrière-plan." : "Servi depuis le cache (hors ligne, sans revalidation).", cache: true };
  if (enLigne) return { source: "reseau", latence: NET, note: "Cache vide : requête réseau, puis mise en cache.", cache: true };
  return { source: "echec", latence: 0, note: "Cache vide et hors ligne : échec.", cache: false };
}

const LIBELLE_SRC = { reseau: "Réseau", cache: "Cache", echec: "Échec" };

export default function VisualiseurCache() {
  const [strat, setStrat] = useState("swr");
  const [enLigne, setEnLigne] = useState(true);
  const [cache, setCache] = useState(false);
  const [journal, setJournal] = useState([]);

  const faire = () => {
    const r = requete(strat, enLigne, cache);
    setCache(r.cache);
    setJournal((j) => [{ id: Date.now(), ...r }, ...j].slice(0, 6));
  };
  const vider = () => { setCache(false); setJournal([]); };

  return (
    <div className="vc">
      <SegmenteControle
        titre="Stratégie"
        options={[{ cle: "reseau", libelle: "Réseau d'abord" }, { cle: "cache", libelle: "Cache d'abord" }, { cle: "swr", libelle: "Stale-while-revalidate" }]}
        valeur={strat}
        onChange={setStrat}
      />

      <div className="vc-barre">
        <button className="vc-btn" onClick={faire}>Faire une requête</button>
        <button className="vc-btn vc-btn--fant" onClick={vider}>Vider le cache</button>
        <label className="vc-check"><input type="checkbox" checked={!enLigne} onChange={(e) => setEnLigne(!e.target.checked)} /> Hors ligne</label>
        <span className={`vc-etat ${cache ? "vc-etat--ok" : ""}`}>Cache : {cache ? "rempli" : "vide"}</span>
      </div>

      {journal.length === 0 ? (
        <p className="vc-vide">Aucune requête pour l'instant. Faites-en une, videz le cache, passez hors ligne, et comparez les stratégies.</p>
      ) : (
        <ul className="vc-journal">
          {journal.map((e) => (
            <li key={e.id} className={`vc-ligne vc-${e.source}`}>
              <span className="vc-badge">{LIBELLE_SRC[e.source]}</span>
              <span className="vc-note">{e.note}</span>
              <span className="vc-lat">{e.source === "echec" ? "—" : `${e.latence} ms`}</span>
            </li>
          ))}
        </ul>
      )}
      <style>{CSS}</style>
    </div>
  );
}

const CSS = `
.vc { margin: 16px 0; font-family: 'DM Sans', system-ui, sans-serif; }
.vc-barre { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; margin: 12px 0 14px; }
.vc-btn { border: 0; background: #0d9488; color: #fff; font: inherit; font-size: 0.85rem; font-weight: 600; padding: 8px 16px; border-radius: 9px; cursor: pointer; }
.vc-btn--fant { background: #fff; color: #44445a; border: 1px solid #d8d6d0; }
.vc-check { display: inline-flex; align-items: center; gap: 6px; font-size: 0.83rem; color: #44445a; cursor: pointer; }
.vc-etat { font-size: 0.8rem; color: #9aa1ad; font-weight: 600; }
.vc-etat--ok { color: #0d7c70; }
.vc-vide { font-size: 0.83rem; color: #9aa1ad; }
.vc-journal { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
.vc-ligne { display: grid; grid-template-columns: 74px 1fr auto; align-items: center; gap: 10px; padding: 8px 12px; border: 1px solid #ebe9e4; border-radius: 8px; background: #fff; }
.vc-badge { font-size: 0.74rem; font-weight: 700; text-align: center; padding: 3px 6px; border-radius: 6px; color: #fff; }
.vc-reseau .vc-badge { background: #0ea5e9; }
.vc-cache .vc-badge { background: #2d8a4e; }
.vc-echec .vc-badge { background: #dc2626; }
.vc-note { font-size: 0.83rem; color: #44445a; }
.vc-lat { font-size: 0.82rem; font-weight: 700; color: #1a1a2e; font-variant-numeric: tabular-nums; }
`;