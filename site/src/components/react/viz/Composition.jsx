import { useState } from "react";
import Onglets from "./Onglets.jsx";

const PARTS = [
  { n: "A", g1: 32, g2: 40, col: "#0d9488" },
  { n: "B", g1: 20, g2: 36, col: "#d97706" },
  { n: "C", g1: 16, g2: 24, col: "#6366f1" },
  { n: "D", g1: 12, g2: 20, col: "#0ea5e9" },
];
const T1 = 80, T2 = 120, MAXT = 120;
const W = 340, H = 190, BASE = 160, TOP = 18;
const hArea = BASE - TOP;

function arc(cx, cy, r, a0, a1) {
  const p = (a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  const [x0, y0] = p(a0), [x1, y1] = p(a1);
  const large = a1 - a0 > Math.PI ? 1 : 0;
  return `M${cx},${cy} L${x0.toFixed(1)},${y0.toFixed(1)} A${r},${r} 0 ${large} 1 ${x1.toFixed(1)},${y1.toFixed(1)} Z`;
}

export default function Composition() {
  const [cas, setCas] = useState("empile");

  const barres = (x, valeurs, total, plein) => {
    const hauteurTot = plein ? hArea : (total / MAXT) * hArea;
    let acc = 0;
    return valeurs.map((p) => {
      const part = p.v / total;
      const h = part * hauteurTot;
      const yTop = BASE - hauteurTot + acc;
      acc += h;
      return <rect key={p.n} x={x} y={yTop} width="46" height={h} fill={p.col} />;
    });
  };

  return (
    <div className="viz">
      <Onglets
        options={[
          { cle: "empile", libelle: "Barres empilées" },
          { cle: "cent", libelle: "Empilées à 100 %" },
          { cle: "treemap", libelle: "Treemap" },
          { cle: "camembert", libelle: "Camembert" },
        ]}
        valeur={cas}
        onChange={setCas}
      />
      <svg viewBox={`0 0 ${W} ${H}`} className="viz-svg" role="img">
        {(cas === "empile" || cas === "cent") && (
          <g>
            <line x1={40} y1={BASE} x2={W - 40} y2={BASE} stroke="#d8d6d0" />
            {barres(90, PARTS.map((p) => ({ n: p.n, v: p.g1, col: p.col })), T1, cas === "cent")}
            {barres(200, PARTS.map((p) => ({ n: p.n, v: p.g2, col: p.col })), T2, cas === "cent")}
            <text x={113} y={BASE + 14} textAnchor="middle" fontSize="10" fill="#6b6b80">Groupe 1</text>
            <text x={223} y={BASE + 14} textAnchor="middle" fontSize="10" fill="#6b6b80">Groupe 2</text>
          </g>
        )}

        {cas === "treemap" && (() => {
          const tot = T2, ox = 70, oy = TOP, w0 = 200, h0 = hArea;
          const tri = [...PARTS].sort((a, b) => b.g2 - a.g2);
          const grand = tri[0];
          const wg = (grand.g2 / tot) * w0;
          const reste = tri.slice(1);
          const totReste = reste.reduce((s, p) => s + p.g2, 0);
          let accY = 0;
          return <g>
            <rect x={ox} y={oy} width={wg - 2} height={h0} fill={grand.col} />
            <text x={ox + wg / 2} y={oy + h0 / 2} textAnchor="middle" fontSize="12" fill="#fff" fontWeight="700">{grand.n}</text>
            {reste.map((p) => {
              const h = (p.g2 / totReste) * h0;
              const y = oy + accY; accY += h;
              return <g key={p.n}>
                <rect x={ox + wg} y={y} width={w0 - wg - 2} height={h - 2} fill={p.col} />
                <text x={ox + wg + (w0 - wg) / 2} y={y + h / 2} textAnchor="middle" fontSize="10" fill="#fff" fontWeight="700">{p.n}</text>
              </g>;
            })}
          </g>;
        })()}

        {cas === "camembert" && (() => {
          const cx = W / 2, cy = 96, r = 74;
          let a = -Math.PI / 2;
          return <g>
            {PARTS.map((p) => {
              const ang = (p.g2 / T2) * Math.PI * 2;
              const d = arc(cx, cy, r, a, a + ang);
              const mid = a + ang / 2; a += ang;
              return <g key={p.n}>
                <path d={d} fill={p.col} />
                <text x={cx + (r * 0.62) * Math.cos(mid)} y={cy + (r * 0.62) * Math.sin(mid) + 3} textAnchor="middle" fontSize="11" fill="#fff" fontWeight="700">{p.n}</text>
              </g>;
            })}
          </g>;
        })()}
      </svg>
      <p className="viz-note">
        {cas === "empile" && "Empilées, les barres gardent les totaux (groupe 2 plus grand), mais comparer les parts internes est plus dur."}
        {cas === "cent" && "Normalisées à 100 %, on compare les parts entre groupes, mais on perd les totaux."}
        {cas === "treemap" && "Le treemap remplit l'espace : bon pour beaucoup de parts, moins précis pour les petites."}
        {cas === "camembert" && "Le camembert se lit bien pour deux ou trois parts, mal au-delà."}
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