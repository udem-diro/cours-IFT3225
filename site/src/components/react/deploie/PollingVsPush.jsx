import { useState, useEffect } from "react";

/**
 * Démo en direct : sur une même ligne de temps, on compare l'interrogation régulière
 * (polling) et l'envoi poussé par le serveur (SSE). Les évènements du serveur
 * surviennent aux mêmes instants ; le polling ne les voit qu'au prochain sondage
 * (requêtes inutiles + latence), le push les délivre aussitôt.
 * Île React pure (horloge locale), sûre au rendu serveur.
 */
const DUREE = 8;
const EVENTS = [1.3, 2.9, 4.2, 6.6];
const POLLS = [1, 2, 3, 4, 5, 6, 7, 8];
const pct = (t) => (t / DUREE) * 100;
const ceilPoll = (e) => Math.min(DUREE, Math.ceil(e));

export default function PollingVsPush() {
  const [clock, setClock] = useState(0);
  const [actif, setActif] = useState(false);

  useEffect(() => {
    if (!actif) return;
    const id = setInterval(() => {
      setClock((c) => {
        if (c >= DUREE) { return c; }
        return Math.round((c + 0.1) * 10) / 10;
      });
    }, 90);
    return () => clearInterval(id);
  }, [actif]);

  useEffect(() => { if (clock >= DUREE) setActif(false); }, [clock]);

  const eventsVus = EVENTS.filter((e) => e <= clock);
  const pollsFaits = POLLS.filter((p) => p <= clock);
  const livresPolling = EVENTS.filter((e) => ceilPoll(e) <= clock);
  const reqs = pollsFaits.length;
  const vides = pollsFaits.filter((p) => !EVENTS.some((e) => ceilPoll(e) === p)).length;
  const latPoll = livresPolling.map((e) => ceilPoll(e) - e);
  const latPollMoy = latPoll.length ? (latPoll.reduce((a, b) => a + b, 0) / latPoll.length) : 0;

  const demarrer = () => { if (clock >= DUREE) setClock(0); setActif(true); };
  const reinit = () => { setActif(false); setClock(0); };

  return (
    <div className="pv">
      <div className="pv-barre">
        <button className="pv-btn" onClick={actif ? () => setActif(false) : demarrer}>
          {actif ? "Pause" : clock >= DUREE ? "Rejouer" : clock > 0 ? "Reprendre" : "Démarrer"}
        </button>
        <button className="pv-btn pv-btn--fant" onClick={reinit} disabled={clock === 0 && !actif}>Réinitialiser</button>
        <span className="pv-horloge">t = {clock.toFixed(1)} s</span>
      </div>

      <div className="pv-piste">
        <span className="pv-titre">Serveur</span>
        <div className="pv-rail">
          <div className="pv-curseur" style={{ left: `${pct(clock)}%` }} />
          {eventsVus.map((e, i) => (
            <span key={i} className="pv-pt pv-pt--evt" style={{ left: `${pct(e)}%` }} title={`évènement à ${e}s`} />
          ))}
        </div>
        <span className="pv-info">{eventsVus.length} évènement(s)</span>
      </div>

      <div className="pv-piste">
        <span className="pv-titre">Polling</span>
        <div className="pv-rail">
          <div className="pv-curseur" style={{ left: `${pct(clock)}%` }} />
          {POLLS.map((p) => {
            const fait = p <= clock;
            const livre = EVENTS.some((e) => ceilPoll(e) === p);
            return <span key={p} className={`pv-tick ${fait ? (livre ? "pv-tick--data" : "pv-tick--vide") : ""}`} style={{ left: `${pct(p)}%` }} title={`sondage à ${p}s`} />;
          })}
        </div>
        <span className="pv-info">{reqs} requête(s), dont {vides} vide(s) · latence ~{latPollMoy.toFixed(1)} s</span>
      </div>

      <div className="pv-piste">
        <span className="pv-titre">Push (SSE)</span>
        <div className="pv-rail">
          <div className="pv-curseur" style={{ left: `${pct(clock)}%` }} />
          {eventsVus.map((e, i) => (
            <span key={i} className="pv-pt pv-pt--push" style={{ left: `${pct(e)}%` }} title={`livré à ${e}s`} />
          ))}
        </div>
        <span className="pv-info">{eventsVus.length} message(s) · latence ~0 s</span>
      </div>

      <p className="pv-note">Le polling multiplie les requêtes (dont certaines vides) et livre les nouveautés avec un retard, jusqu'au prochain sondage. Le push délivre chaque évènement au moment où il survient.</p>
      <style>{CSS}</style>
    </div>
  );
}

const CSS = `
.pv { margin: 16px 0; font-family: 'DM Sans', system-ui, sans-serif; }
.pv-barre { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
.pv-btn { border: 0; background: #0d9488; color: #fff; font: inherit; font-size: 0.85rem; font-weight: 600; padding: 8px 16px; border-radius: 9px; cursor: pointer; }
.pv-btn--fant { background: #fff; color: #44445a; border: 1px solid #d8d6d0; }
.pv-btn:disabled { opacity: 0.55; cursor: default; }
.pv-horloge { font-size: 0.82rem; color: #6b6b80; font-variant-numeric: tabular-nums; }
.pv-piste { display: grid; grid-template-columns: 74px 1fr; align-items: center; gap: 10px; margin-bottom: 6px; }
.pv-titre { font-size: 0.8rem; font-weight: 700; color: #1a1a2e; }
.pv-rail { position: relative; height: 34px; background: #f7f6f3; border: 1px solid #ebe9e4; border-radius: 8px; }
.pv-info { grid-column: 2; font-size: 0.76rem; color: #6b6b80; margin-bottom: 4px; }
.pv-curseur { position: absolute; top: 0; bottom: 0; width: 2px; background: rgba(13,148,136,0.35); }
.pv-pt { position: absolute; top: 50%; width: 13px; height: 13px; border-radius: 50%; transform: translate(-50%, -50%); border: 2px solid #fff; }
.pv-pt--evt { background: #1a1a2e; }
.pv-pt--push { background: #2d8a4e; }
.pv-tick { position: absolute; top: 6px; bottom: 6px; width: 2px; background: #d8d6d0; transform: translateX(-50%); }
.pv-tick--vide { background: #c9c7c1; }
.pv-tick--data { width: 6px; background: #d97706; border-radius: 2px; }
.pv-note { margin: 12px 0 0; font-size: 0.82rem; color: #6b6b80; }
`;
