import { useState, useEffect } from "react";

/**
 * Simulation d'un pipeline de déploiement : on lance, les étapes s'exécutent l'une
 * après l'autre. En activant « échec aux tests », le pipeline s'arrête avant la mise
 * en service et la version précédente reste en place (retour en arrière).
 * Île React pure (aucun accès à window), sûre au rendu serveur.
 */
const ETAPES = [
  { cle: "sources", nom: "Récupération des sources" },
  { cle: "build", nom: "Construction (build)" },
  { cle: "tests", nom: "Tests automatisés" },
  { cle: "artefact", nom: "Publication de l'artefact" },
  { cle: "deploiement", nom: "Déploiement sur l'infrastructure" },
  { cle: "service", nom: "Mise en service" },
];
const I_TESTS = 2;

export default function PipelineDeploiement() {
  const [statuts, setStatuts] = useState(() => ETAPES.map(() => "attente"));
  const [idx, setIdx] = useState(-1);
  const [actif, setActif] = useState(false);
  const [echecTests, setEchecTests] = useState(false);
  const [resultat, setResultat] = useState(null);

  useEffect(() => {
    if (!actif || idx < 0) return;
    const id = setTimeout(() => {
      const echoue = idx === I_TESTS && echecTests;
      setStatuts((s) => { const c = [...s]; c[idx] = echoue ? "echec" : "ok"; return c; });
      if (echoue) { setActif(false); setResultat("echec"); return; }
      if (idx >= ETAPES.length - 1) { setActif(false); setResultat("succes"); return; }
      setIdx(idx + 1);
    }, 650);
    return () => clearTimeout(id);
  }, [actif, idx, echecTests]);

  const lancer = () => {
    setStatuts(ETAPES.map(() => "attente"));
    setResultat(null);
    setIdx(0);
    setActif(true);
  };
  const reinitialiser = () => {
    setActif(false); setIdx(-1); setResultat(null);
    setStatuts(ETAPES.map(() => "attente"));
  };

  const etatDe = (i) => (actif && i === idx && statuts[i] === "attente" ? "encours" : statuts[i]);
  const symbole = { ok: "✓", echec: "✗", encours: "•", attente: "" };

  return (
    <div className="pl">
      <div className="pl-barre">
        <button className="pl-btn" onClick={lancer} disabled={actif}>
          {actif ? "Déploiement en cours…" : "Lancer le déploiement"}
        </button>
        <button className="pl-btn pl-btn--fant" onClick={reinitialiser} disabled={actif}>Réinitialiser</button>
        <label className="pl-check">
          <input type="checkbox" checked={echecTests} onChange={(e) => setEchecTests(e.target.checked)} disabled={actif} />
          Simuler un échec aux tests
        </label>
      </div>

      <ol className="pl-liste">
        {ETAPES.map((e, i) => {
          const st = etatDe(i);
          return (
            <li key={e.cle} className={`pl-etape pl-${st}`}>
              <span className="pl-puce">{symbole[st]}</span>
              <span className="pl-nom">{e.nom}</span>
              <span className="pl-etat">
                {st === "ok" && "terminé"}
                {st === "echec" && "échec"}
                {st === "encours" && "en cours…"}
              </span>
            </li>
          );
        })}
      </ol>

      {resultat === "succes" && (
        <p className="pl-msg pl-msg--ok">Déploiement réussi : la nouvelle version est en service.</p>
      )}
      {resultat === "echec" && (
        <p className="pl-msg pl-msg--ko">Échec aux tests : le déploiement est interrompu avant la mise en service. La version précédente reste en place, les utilisateurs ne voient pas la régression.</p>
      )}

      <style>{CSS}</style>
    </div>
  );
}

const CSS = `
.pl { margin: 16px 0; font-family: 'DM Sans', system-ui, sans-serif; }
.pl-barre { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; margin-bottom: 14px; }
.pl-btn { border: 0; background: #0d9488; color: #fff; font: inherit; font-size: 0.85rem; font-weight: 600; padding: 8px 16px; border-radius: 9px; cursor: pointer; }
.pl-btn:disabled { opacity: 0.55; cursor: default; }
.pl-btn--fant { background: #fff; color: #44445a; border: 1px solid #d8d6d0; }
.pl-check { display: inline-flex; align-items: center; gap: 6px; font-size: 0.83rem; color: #44445a; cursor: pointer; }
.pl-liste { list-style: none; margin: 0; padding: 0; border-left: 2px solid #e5e7eb; }
.pl-etape { display: flex; align-items: center; gap: 12px; padding: 8px 0 8px 16px; margin-left: -1px; position: relative; }
.pl-puce { position: absolute; left: -13px; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: 700; background: #fff; border: 2px solid #d8d6d0; color: #9aa1ad; }
.pl-nom { font-size: 0.9rem; color: #44445a; }
.pl-etat { font-size: 0.78rem; color: #9aa1ad; margin-left: auto; }
.pl-ok .pl-puce { border-color: #2d8a4e; background: #2d8a4e; color: #fff; }
.pl-ok .pl-nom { color: #1a1a2e; }
.pl-echec .pl-puce { border-color: #dc2626; background: #dc2626; color: #fff; }
.pl-echec .pl-nom { color: #b91c1c; font-weight: 600; }
.pl-encours .pl-puce { border-color: #0d9488; color: #0d9488; animation: pl-pulse 0.9s ease-in-out infinite; }
.pl-encours .pl-nom { color: #0d7c70; font-weight: 600; }
@keyframes pl-pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.18); } }
.pl-msg { margin: 14px 0 0; font-size: 0.86rem; padding: 10px 12px; border-radius: 9px; }
.pl-msg--ok { background: #ecfdf5; color: #166534; border: 1px solid #bbf7d0; }
.pl-msg--ko { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }
`;
