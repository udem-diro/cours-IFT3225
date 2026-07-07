import { useState } from "react";
import Onglets from "./Onglets.jsx";

const teal = "#0d9488";
const W = 340, H = 190, PAD = 26;
const NUAGE = [[20,78],[28,70],[34,74],[41,58],[47,63],[52,49],[58,55],[63,41],[70,46],[76,33],[82,38],[45,66],[66,60],[88,28]];
const NOEUDS = [
  { id: "A", x: 0.5, y: 0.15 }, { id: "B", x: 0.2, y: 0.45 }, { id: "C", x: 0.8, y: 0.45 },
  { id: "D", x: 0.32, y: 0.82 }, { id: "E", x: 0.68, y: 0.82 }, { id: "F", x: 0.5, y: 0.52 },
];
const LIENS = [["A","B"],["A","C"],["A","F"],["B","D"],["B","F"],["C","E"],["C","F"],["D","E"]];
const idx = Object.fromEntries(NOEUDS.map((n, i) => [n.id, i]));
const px = (nx) => PAD + nx * (W - 2 * PAD);
const py = (ny) => 16 + ny * (H - 40);

export default function Relation() {
  const [cas, setCas] = useState("nuage");
  return (
    <div className="viz">
      <Onglets
        options={[
          { cle: "nuage", libelle: "Nuage de points" },
          { cle: "reseau", libelle: "Réseau" },
          { cle: "matrice", libelle: "Matrice" },
        ]}
        valeur={cas}
        onChange={setCas}
      />
      <svg viewBox={`0 0 ${W} ${H}`} className="viz-svg" role="img">
        {cas === "nuage" && (
          <g>
            <line x1={PAD} y1={H - 24} x2={W - PAD} y2={H - 24} stroke="#d8d6d0" />
            <line x1={PAD} y1={16} x2={PAD} y2={H - 24} stroke="#d8d6d0" />
            {NUAGE.map(([x, y], i) => (
              <circle key={i} cx={PAD + (x / 100) * (W - 2 * PAD)} cy={16 + (y / 100) * (H - 40)} r="4.5" fill={teal} opacity="0.8" />
            ))}
          </g>
        )}
        {cas === "reseau" && (
          <g>
            {LIENS.map(([a, b], i) => (
              <line key={i} x1={px(NOEUDS[idx[a]].x)} y1={py(NOEUDS[idx[a]].y)} x2={px(NOEUDS[idx[b]].x)} y2={py(NOEUDS[idx[b]].y)} stroke="#c9c7c1" strokeWidth="1.5" />
            ))}
            {NOEUDS.map((n) => (
              <g key={n.id}>
                <circle cx={px(n.x)} cy={py(n.y)} r="12" fill={teal} />
                <text x={px(n.x)} y={py(n.y) + 4} textAnchor="middle" fontSize="11" fill="#fff" fontWeight="700">{n.id}</text>
              </g>
            ))}
          </g>
        )}
        {cas === "matrice" && (() => {
          const n = NOEUDS.length, cell = 22, ox = (W - n * cell) / 2, oy = 20;
          const lie = (i, j) => LIENS.some(([a, b]) => (idx[a] === i && idx[b] === j) || (idx[a] === j && idx[b] === i));
          const cells = [];
          for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
            cells.push(<rect key={`${i}-${j}`} x={ox + j * cell} y={oy + i * cell} width={cell - 1} height={cell - 1}
              fill={i === j ? "#ebe9e4" : lie(i, j) ? teal : "#fff"} stroke="#e0ded8" />);
          }
          return <g>
            {cells}
            {NOEUDS.map((nn, i) => <text key={`c${i}`} x={ox + i * cell + cell / 2} y={oy - 4} textAnchor="middle" fontSize="9" fill="#9aa1ad">{nn.id}</text>)}
            {NOEUDS.map((nn, i) => <text key={`r${i}`} x={ox - 5} y={oy + i * cell + cell / 2 + 3} textAnchor="end" fontSize="9" fill="#9aa1ad">{nn.id}</text>)}
          </g>;
        })()}
      </svg>
      <p className="viz-note">
        {cas === "nuage" && "Le nuage montre une relation entre deux mesures continues (ici, décroissante)."}
        {cas === "reseau" && "Le réseau montre des connexions entre entités : la structure prime sur les valeurs."}
        {cas === "matrice" && "La matrice d'adjacence encode les mêmes liens sans croisements : lisible quand le graphe est dense."}
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