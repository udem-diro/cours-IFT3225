import { useState } from "react";

/**
 * Visualiseur en cascade (waterfall) : on active des techniques d'optimisation et
 * l'on voit leur effet sur le chargement des ressources, sur le premier rendu et sur
 * le chargement complet. Le modèle partage une bande passante entre les
 * téléchargements simultanés (jusqu'à P en parallèle). Île React pure, sûre au SSR.
 */
const P = 4, LAT = 30, B = 1.5, MAX = 700;
const COUL = { doc: "#1a1a2e", css: "#0ea5e9", js: "#d97706", img: "#0d9488", font: "#6366f1" };
const RES = [
  { id: "html", nom: "index.html", type: "doc", ko: 12, crit: true, dep: null },
  { id: "css", nom: "style.css", type: "css", ko: 40, crit: true, dep: "html" },
  { id: "js", nom: "app.js", type: "js", ko: 180, crit: true, dep: "html" },
  { id: "hero", nom: "hero.jpg", type: "img", ko: 220, crit: true, dep: "html" },
  { id: "police", nom: "police.woff2", type: "font", ko: 30, crit: true, dep: "css" },
  { id: "galerie", nom: "galerie.jpg (hors écran)", type: "img", ko: 400, crit: false, dep: "html" },
];

const bytesOf = (r, o) => {
  let k = r.ko;
  if (o.compress && (r.type === "css" || r.type === "js" || r.type === "doc")) k *= 0.3;
  if (o.cache) k = Math.min(k, 4);
  return k;
};

function sim(list, o) {
  const rem = {}, start = {}, end = {};
  list.forEach((r) => (rem[r.id] = bytesOf(r, o)));
  const ready = (r) => {
    const base = r.dep ? (end[r.dep] !== undefined ? end[r.dep] : Infinity) : 0;
    return base + (o.cache ? 4 : LAT);
  };
  const Beff = o.cache ? 6 : B;
  let t = 0; const DT = 4; let g = 0;
  const done = () => list.every((r) => rem[r.id] <= 1e-6);
  while (!done() && g++ < 40000) {
    const el = list.filter((r) => ready(r) <= t && rem[r.id] > 1e-6).sort((a, b) => ready(a) - ready(b)).slice(0, P);
    if (!el.length) { t += DT; continue; }
    const share = Beff / el.length;
    for (const r of el) {
      if (start[r.id] === undefined) start[r.id] = t;
      rem[r.id] -= share * DT;
      if (rem[r.id] <= 1e-6 && end[r.id] === undefined) end[r.id] = t + DT;
    }
    t += DT;
  }
  return { start, end };
}

function calc(o) {
  const crit = RES.filter((r) => r.crit);
  if (o.differe) {
    const s = sim(crit, o);
    const fr = Math.max(...crit.map((r) => s.end[r.id]));
    const gb = bytesOf(RES.find((r) => r.id === "galerie"), o);
    const gs = fr + (o.cache ? 4 : LAT);
    const ge = gs + gb / (o.cache ? 6 : B);
    const tl = {};
    crit.forEach((r) => (tl[r.id] = { start: s.start[r.id], end: s.end[r.id] }));
    tl.galerie = { start: gs, end: ge };
    return { tl, fr, total: Math.max(fr, ge) };
  }
  const s = sim(RES, o);
  const fr = Math.max(...crit.map((r) => s.end[r.id]));
  const total = Math.max(...RES.map((r) => s.end[r.id]));
  const tl = {};
  RES.forEach((r) => (tl[r.id] = { start: s.start[r.id], end: s.end[r.id] }));
  return { tl, fr, total };
}

const x = (ms) => Math.min(100, (ms / MAX) * 100);

export default function CascadeChargement() {
  const [o, setO] = useState({ compress: false, differe: false, cache: false });
  const bascule = (cle) => setO((p) => ({ ...p, [cle]: !p[cle] }));
  const { tl, fr, total } = calc(o);

  return (
    <div className="wf">
      <div className="wf-opts">
        <label className="wf-opt"><input type="checkbox" checked={o.compress} onChange={() => bascule("compress")} /> Compression (texte)</label>
        <label className="wf-opt"><input type="checkbox" checked={o.differe} onChange={() => bascule("differe")} /> Chargement différé (image hors écran)</label>
        <label className="wf-opt"><input type="checkbox" checked={o.cache} onChange={() => bascule("cache")} /> Cache (visite répétée)</label>
      </div>

      <div className="wf-cascade">
        <div className="wf-repere" style={{ left: `calc(160px + (100% - 160px) * ${x(fr)} / 100)` }}><span>premier rendu</span></div>
        {RES.map((r) => {
          const b = tl[r.id];
          return (
            <div key={r.id} className="wf-ligne">
              <span className="wf-nom">{r.nom}</span>
              <div className="wf-piste">
                <span className="wf-barre" style={{ left: `${x(b.start)}%`, width: `${Math.max(1.5, x(b.end - b.start))}%`, background: COUL[r.type] }} />
              </div>
            </div>
          );
        })}
      </div>

      <p className="wf-stats">
        Premier rendu : <strong>{Math.round(fr)} ms</strong> · Chargement complet : <strong>{Math.round(total)} ms</strong>
      </p>
      <p className="wf-note">La compression raccourcit les ressources texte ; le chargement différé retire l'image hors écran du chemin critique, ce qui avance le premier rendu ; le cache rend une visite répétée quasi instantanée.</p>
      <style>{CSS}</style>
    </div>
  );
}

const CSS = `
.wf { margin: 16px 0; font-family: 'DM Sans', system-ui, sans-serif; }
.wf-opts { display: flex; flex-wrap: wrap; gap: 8px 18px; margin-bottom: 14px; }
.wf-opt { display: inline-flex; align-items: center; gap: 6px; font-size: 0.83rem; color: #44445a; cursor: pointer; }
.wf-cascade { position: relative; }
.wf-ligne { display: grid; grid-template-columns: 150px 1fr; align-items: center; gap: 10px; margin-bottom: 5px; }
.wf-nom { font-size: 0.78rem; color: #44445a; font-variant-numeric: tabular-nums; }
.wf-piste { position: relative; height: 16px; background: #f7f6f3; border: 1px solid #ebe9e4; border-radius: 4px; }
.wf-barre { position: absolute; top: 2px; bottom: 2px; border-radius: 3px; }
.wf-repere { position: absolute; top: -4px; bottom: -4px; width: 0; border-left: 2px dashed #0d9488; z-index: 2; }
.wf-repere span { position: absolute; top: -16px; left: 4px; font-size: 0.68rem; font-weight: 700; color: #0d7c70; white-space: nowrap; }
.wf-stats { margin: 16px 0 0; font-size: 0.9rem; color: #1a1a2e; }
.wf-note { margin: 6px 0 0; font-size: 0.8rem; color: #6b6b80; }
`;
