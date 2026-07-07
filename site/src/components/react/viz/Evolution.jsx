import { useState, useEffect } from "react";
import Onglets from "./Onglets.jsx";

const SERIES = [
  { n: "Air", col: "#6366f1", v: [30, 34, 40, 38, 45, 52, 49, 58, 60, 55, 63, 68] },
  { n: "Eau", col: "#0ea5e9", v: [50, 48, 46, 44, 43, 41, 42, 40, 39, 41, 38, 37] },
  { n: "Bruit", col: "#d97706", v: [20, 24, 22, 28, 30, 27, 33, 31, 36, 40, 38, 42] },
];
const N = 12, W = 340, H = 190, PAD = 28, BASE = 156, TOP = 16;
const xp = (i) => PAD + (i / (N - 1)) * (W - 2 * PAD);
const yp = (v) => BASE - (v / 100) * (BASE - TOP);
const ligne = (v, n = N) => v.slice(0, n).map((val, i) => `${xp(i)},${yp(val)}`).join(" ");

export default function Evolution() {
  const [cas, setCas] = useState("ligne");
  const [t, setT] = useState(N);
  const [joue, setJoue] = useState(false);

  useEffect(() => {
    if (cas !== "animation" || !joue) return;
    const id = setInterval(() => setT((x) => (x >= N ? 1 : x + 1)), 450);
    return () => clearInterval(id);
  }, [cas, joue]);

  useEffect(() => { if (cas === "animation") { setT(1); setJoue(true); } }, [cas]);

  return (
    <div className="viz">
      <Onglets
        options={[
          { cle: "ligne", libelle: "Lignes" },
          { cle: "aires", libelle: "Aires empilées" },
          { cle: "multiples", libelle: "Petits multiples" },
          { cle: "animation", libelle: "Animation" },
        ]}
        valeur={cas}
        onChange={setCas}
      />

      {cas === "multiples" ? (
        <div className="viz-multiples">
          {SERIES.map((s) => (
            <svg key={s.n} viewBox={`0 0 120 90`} className="viz-mini" role="img">
              <line x1="8" y1="78" x2="112" y2="78" stroke="#d8d6d0" />
              <polyline points={s.v.map((val, i) => `${8 + (i / (N - 1)) * 104},${78 - (val / 100) * 66}`).join(" ")} fill="none" stroke={s.col} strokeWidth="2" />
              <text x="10" y="14" fontSize="10" fill="#6b6b80" fontWeight="700">{s.n}</text>
            </svg>
          ))}
        </div>
      ) : (
        <svg viewBox={`0 0 ${W} ${H}`} className="viz-svg" role="img">
          <line x1={PAD} y1={BASE} x2={W - PAD} y2={BASE} stroke="#d8d6d0" />

          {cas === "aires" && (() => {
            let cumul = new Array(N).fill(0);
            return SERIES.map((s) => {
              const bas = cumul.map((c) => c);
              const haut = cumul.map((c, i) => c + s.v[i]);
              cumul = haut;
              const pts = haut.map((v, i) => `${xp(i)},${yp(v)}`).concat(bas.map((v, i) => `${xp(N - 1 - i)},${yp(bas[N - 1 - i])}`)).join(" ");
              return <polygon key={s.n} points={pts} fill={s.col} opacity="0.55" />;
            });
          })()}

          {cas === "ligne" && SERIES.map((s) => (
            <polyline key={s.n} points={ligne(s.v)} fill="none" stroke={s.col} strokeWidth="2.5" strokeLinejoin="round" />
          ))}

          {cas === "animation" && (
            <g>
              {SERIES.map((s) => (
                <polyline key={s.n} points={ligne(s.v, t)} fill="none" stroke={s.col} strokeWidth="2.5" strokeLinejoin="round" />
              ))}
              <line x1={xp(t - 1)} y1={TOP} x2={xp(t - 1)} y2={BASE} stroke="#0d9488" strokeDasharray="3 3" opacity="0.6" />
            </g>
          )}
        </svg>
      )}

      <div className="viz-pied">
        {cas === "animation" && (
          <button className="viz-play" onClick={() => setJoue((j) => !j)}>{joue ? "Pause" : "Lecture"}</button>
        )}
        <span className="viz-legende">
          {SERIES.map((s) => (
            <span key={s.n} className="viz-cle"><span className="viz-pt" style={{ background: s.col }} />{s.n}</span>
          ))}
        </span>
      </div>

      <p className="viz-note">
        {cas === "ligne" && "Les lignes comparent les séries et se lisent en un coup d'œil sur toute la période."}
        {cas === "aires" && "Les aires empilées montrent aussi le total, au prix de la lecture des séries du haut."}
        {cas === "multiples" && "Les petits multiples évitent l'enchevêtrement : une série par panneau, même échelle."}
        {cas === "animation" && "L'animation donne l'impression du mouvement, mais oblige à mémoriser : moins bonne pour comparer des moments."}
      </p>
      <style>{CSS}</style>
    </div>
  );
}
const CSS = `
.viz { margin: 14px 0; font-family: 'DM Sans', system-ui, sans-serif; }
.viz-svg { width: 100%; max-width: 380px; height: auto; background: #f7f6f3; border: 1px solid #ebe9e4; border-radius: 10px; padding: 6px; }
.viz-multiples { display: flex; gap: 8px; flex-wrap: wrap; }
.viz-mini { width: 120px; height: auto; background: #f7f6f3; border: 1px solid #ebe9e4; border-radius: 8px; padding: 4px; }
.viz-pied { display: flex; align-items: center; gap: 14px; margin-top: 8px; }
.viz-play { border: 0; background: #0d9488; color: #fff; font: inherit; font-size: 0.8rem; font-weight: 600; padding: 5px 14px; border-radius: 8px; cursor: pointer; }
.viz-legende { display: inline-flex; gap: 12px; }
.viz-cle { display: inline-flex; align-items: center; gap: 5px; font-size: 0.8rem; color: #44445a; }
.viz-pt { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
.viz-note { margin: 8px 0 0; font-size: 0.8rem; color: #6b6b80; }
`;