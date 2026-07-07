import { useState } from "react";

/**
 * Résolution DNS pas à pas : on déroule les échanges d'une résolution récursive, du
 * navigateur au serveur faisant autorité. Une case montre l'effet du cache (réponse
 * immédiate, sans reparcourir la hiérarchie). Île React pure, sûre au rendu serveur.
 */
const ETAPES = [
  { de: "Navigateur", a: "Résolveur DNS", q: "Quelle est l'adresse de exemple.com ?", r: "" },
  { de: "Résolveur", a: "Serveur racine", q: "Où trouver le domaine .com ?", r: "Voici les serveurs responsables de la zone .com." },
  { de: "Résolveur", a: "Serveur TLD .com", q: "Où trouver exemple.com ?", r: "Voici le serveur faisant autorité pour exemple.com." },
  { de: "Résolveur", a: "Serveur faisant autorité", q: "Quelle est l'adresse de exemple.com ?", r: "exemple.com pointe vers 203.0.113.10 (enregistrement A), TTL de 3600 s." },
  { de: "Résolveur", a: "Navigateur", q: "", r: "L'adresse est 203.0.113.10. Je la garde en cache pour la durée du TTL." },
];
const CACHE = [
  { de: "Navigateur", a: "Résolveur DNS", q: "Quelle est l'adresse de exemple.com ?", r: "Déjà en cache : 203.0.113.10. Réponse immédiate." },
];

export default function ResolutionDNS() {
  const [n, setN] = useState(0);
  const [cache, setCache] = useState(false);
  const liste = cache ? CACHE : ETAPES;
  const total = liste.length;
  const revele = cache ? total : n;

  return (
    <div className="dns">
      <div className="dns-barre">
        {!cache && (
          <button className="dns-btn" onClick={() => setN((x) => Math.min(x + 1, total))} disabled={n >= total}>
            {n === 0 ? "Résoudre" : n >= total ? "Terminé" : "Étape suivante"}
          </button>
        )}
        {!cache && (
          <button className="dns-btn dns-btn--fant" onClick={() => setN(0)} disabled={n === 0}>Réinitialiser</button>
        )}
        <label className="dns-check">
          <input type="checkbox" checked={cache} onChange={(e) => { setCache(e.target.checked); setN(0); }} />
          Réponse déjà en cache
        </label>
      </div>

      <ol className="dns-liste">
        {liste.slice(0, revele).map((e, i) => (
          <li key={i} className="dns-ech">
            <div className="dns-flux">
              <span className="dns-de">{e.de}</span>
              <span className="dns-arr">→</span>
              <span className="dns-a">{e.a}</span>
            </div>
            {e.q && <div className="dns-q">« {e.q} »</div>}
            {e.r && <div className="dns-r">{e.r}</div>}
          </li>
        ))}
      </ol>

      {!cache && n >= total && (
        <p className="dns-fin">Adresse résolue : <strong>203.0.113.10</strong>. Le résolveur la conserve en cache selon le TTL, pour éviter de refaire ce trajet à la requête suivante.</p>
      )}
      {cache && (
        <p className="dns-fin">Grâce au cache, la résolution est immédiate : ni la racine, ni le TLD, ni le serveur faisant autorité ne sont interrogés.</p>
      )}

      <style>{CSS}</style>
    </div>
  );
}

const CSS = `
.dns { margin: 16px 0; font-family: 'DM Sans', system-ui, sans-serif; }
.dns-barre { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; margin-bottom: 14px; }
.dns-btn { border: 0; background: #0d9488; color: #fff; font: inherit; font-size: 0.85rem; font-weight: 600; padding: 8px 16px; border-radius: 9px; cursor: pointer; }
.dns-btn:disabled { opacity: 0.55; cursor: default; }
.dns-btn--fant { background: #fff; color: #44445a; border: 1px solid #d8d6d0; }
.dns-check { display: inline-flex; align-items: center; gap: 6px; font-size: 0.83rem; color: #44445a; cursor: pointer; }
.dns-liste { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
.dns-ech { border: 1px solid #ebe9e4; border-left: 3px solid #0d9488; border-radius: 8px; padding: 8px 12px; background: #fff; }
.dns-flux { font-size: 0.82rem; font-weight: 700; color: #1a1a2e; }
.dns-arr { color: #0d9488; margin: 0 6px; }
.dns-q { font-size: 0.84rem; color: #44445a; margin-top: 3px; }
.dns-r { font-size: 0.84rem; color: #0d7c70; margin-top: 3px; }
.dns-fin { margin: 14px 0 0; font-size: 0.86rem; color: #166534; background: #ecfdf5; border: 1px solid #bbf7d0; border-radius: 9px; padding: 10px 12px; }
`;
