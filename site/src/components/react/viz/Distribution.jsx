import { useState } from "react";
import Onglets from "./Onglets.jsx";

const DATA = [52,48,61,55,43,58,67,50,54,49,62,57,45,53,60,51,66,47,56,59,41,64,53,50,58,55,70,44,52,63,48,57,54,61,46,55];
const teal = "#0d9488";
const W = 340, H = 180, PAD = 26, BASE = 150;
const xp = (v) => PAD + (v / 100) * (W - 2 * PAD);

const trie = [...DATA].sort((a, b) => a - b);
const quantile = (q) => {
  const pos = (trie.length - 1) * q;
  const b = Math.floor(pos);
  return trie[b] + (trie[b + 1] - trie[b] || 0) * (pos - b);
};
const stats = { min: trie[0], q1: quantile(0.25), med: quantile(0.5), q3: quantile(0.75), max: trie[trie.length - 1] };

const NBINS = 10;
const bins = Array.from({ length: NBINS }, (_, i) => DATA.filter((v) => v >= i * 10 && v < (i + 1) * 10).length);
const maxBin = Math.max(...bins);
const hy = (c) => BASE - (c / maxBin) * (BASE - 16);

export default function Distribution() {
  const [cas, setCas] = useState("histogramme");
  return (
    <div className="viz">
      <Onglets
        options={[
          { cle: "histogramme", libelle: "Histogramme" },
          { cle: "densite", libelle: "Densité" },
          { cle: "boite", libelle: "Boîte à moustaches" },
          { cle: "points", libelle: "Points (strip)" },
        ]}
        valeur={cas}
        onChange={setCas}
      />
      <svg viewBox={`0 0 ${W} ${H}`} className="viz-svg" role="img">
        <line x1={PAD} y1={BASE} x2={W - PAD} y2={BASE} stroke="#d8d6d0" />

        {cas === "histogramme" && bins.map((c, i) => (
          <rect key={i} x={xp(i * 10)} y={hy(c)} width={xp(10) - xp(0) - 1} height={BASE - hy(c)} fill={teal} opacity="0.85" />
        ))}

        {cas === "densite" && (
          <polyline
            points={bins.map((c, i) => `${xp(i * 10 + 5)},${hy(c)}`).join(" ")}
            fill="none" stroke={teal} strokeWidth="2.5" strokeLinejoin="round"
          />
        )}

        {cas === "boite" && (() => {
          const yb = 82, h = 34;
          return <g>
            <line x1={xp(stats.min)} y1={yb + h / 2} x2={xp(stats.q1)} y2={yb + h / 2} stroke="#6b6b80" />
            <line x1={xp(stats.q3)} y1={yb + h / 2} x2={xp(stats.max)} y2={yb + h / 2} stroke="#6b6b80" />
            <line x1={xp(stats.min)} y1={yb + 6} x2={xp(stats.min)} y2={yb + h - 6} stroke="#6b6b80" />
            <line x1={xp(stats.max)} y1={yb + 6} x2={xp(stats.max)} y2={yb + h - 6} stroke="#6b6b80" />
            <rect x={xp(stats.q1)} y={yb} width={xp(stats.q3) - xp(stats.q1)} height={h} fill={teal} opacity="0.25" stroke={teal} />
            <line x1={xp(stats.med)} y1={yb} x2={xp(stats.med)} y2={yb + h} stroke={teal} strokeWidth="2.5" />
          </g>;
        })()}

        {cas === "points" && DATA.map((v, i) => (
          <circle key={i} cx={xp(v)} cy={92 + (((i * 37) % 22) - 11)} r="3.5" fill={teal} opacity="0.7" />
        ))}

        {[0, 25, 50, 75, 100].map((t) => (
          <text key={t} x={xp(t)} y={BASE + 14} textAnchor="middle" fontSize="10" fill="#9aa1ad">{t}</text>
        ))}
      </svg>
      <p className="viz-note">
        {cas === "histogramme" && "L'histogramme découpe l'axe en tranches et compte : on voit la forme d'ensemble."}
        {cas === "densite" && "La densité lisse l'histogramme en une courbe continue."}
        {cas === "boite" && "La boîte résume cinq nombres (min, Q1, médiane, Q3, max) et repère les extrêmes."}
        {cas === "points" && "Le strip plot montre chaque observation : utile quand elles sont peu nombreuses."}
      </p>
      <style>{CSS}</style>
    </div>
  );
}
const CSS = `
.viz { margin: 14px 0; font-family: 'DM Sans', system-ui, sans-serif; }
.viz-svg { width: 100%; max-width: 380px; height: auto; background: #f7f6f3; border: 1px solid #ebe9e4; border-radius: 10px; padding: 6px; }
.viz-note { margin: 8px 0 0; font-size: 0.8rem; color: #6b6b80; }
`;