import { useState } from "react";
import Onglets from "./Onglets.jsx";

const DATA = [
  { c: "Alpha", v: 45 },
  { c: "Bravo", v: 78 },
  { c: "Charlie", v: 33 },
  { c: "Delta", v: 90 },
  { c: "Echo", v: 61 },
];
const teal = "#0d9488";
const ambre = "#d97706";
const W = 340, H = 180, PAD = 26, BASE = H - 26;
const moyenne = Math.round(DATA.reduce((s, d) => s + d.v, 0) / DATA.length);
const y = (v) => BASE - (v / 100) * (BASE - 12);

export default function CompareValeurs() {
  const [cas, setCas] = useState("barres");
  const bw = (W - 2 * PAD) / DATA.length;

  return (
    <div className="viz">
      <Onglets
        options={[
          { cle: "barres", libelle: "Barres" },
          { cle: "points", libelle: "Points" },
          { cle: "reference", libelle: "Valeur + référence" },
          { cle: "tableau", libelle: "Tableau" },
        ]}
        valeur={cas}
        onChange={setCas}
      />

      {cas === "tableau" ? (
        <table className="viz-table">
          <thead><tr><th>Catégorie</th><th>Valeur</th><th></th></tr></thead>
          <tbody>
            {DATA.map((d) => (
              <tr key={d.c}>
                <td>{d.c}</td>
                <td>{d.v}</td>
                <td><span className="viz-barre" style={{ width: `${d.v}%` }} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <svg viewBox={`0 0 ${W} ${H}`} className="viz-svg" role="img">
          <line x1={PAD} y1={BASE} x2={W - PAD + 4} y2={BASE} stroke="#d8d6d0" />
          {cas === "reference" && (
            <g>
              <line x1={PAD} y1={y(moyenne)} x2={W - PAD} y2={y(moyenne)} stroke={ambre} strokeDasharray="4 3" />
              <text x={W - PAD} y={y(moyenne) - 4} textAnchor="end" fontSize="10" fill={ambre}>moyenne {moyenne}</text>
            </g>
          )}
          {DATA.map((d, i) => {
            const cx = PAD + i * bw + bw / 2;
            if (cas === "barres") {
              return <g key={d.c}>
                <rect x={cx - bw / 3} y={y(d.v)} width={(2 * bw) / 3} height={BASE - y(d.v)} fill={teal} rx="2" />
                <text x={cx} y={BASE + 14} textAnchor="middle" fontSize="10" fill="#6b6b80">{d.c}</text>
              </g>;
            }
            if (cas === "points") {
              return <g key={d.c}>
                <line x1={cx} y1={BASE} x2={cx} y2={y(d.v)} stroke="#d8d6d0" />
                <circle cx={cx} cy={y(d.v)} r="6" fill={teal} />
                <text x={cx} y={BASE + 14} textAnchor="middle" fontSize="10" fill="#6b6b80">{d.c}</text>
              </g>;
            }
            // reference
            const couleur = d.v >= moyenne ? teal : "#c2410c";
            return <g key={d.c}>
              <rect x={cx - bw / 3} y={y(d.v)} width={(2 * bw) / 3} height={BASE - y(d.v)} fill={couleur} opacity="0.9" rx="2" />
              <text x={cx} y={BASE + 14} textAnchor="middle" fontSize="10" fill="#6b6b80">{d.c}</text>
            </g>;
          })}
        </svg>
      )}

      <p className="viz-note">
        {cas === "barres" && "Longueur = valeur, sur une échelle commune : la comparaison est directe."}
        {cas === "points" && "Un diagramme de points allège l'encre et se lit aussi bien pour comparer."}
        {cas === "reference" && "Comparées à une référence (ici la moyenne), les valeurs se lisent comme écarts."}
        {cas === "tableau" && "Le tableau donne les valeurs exactes, mais la comparaison visuelle est plus lente."}
      </p>
      <style>{CSS}</style>
    </div>
  );
}
const CSS = `
.viz { margin: 14px 0; font-family: 'DM Sans', system-ui, sans-serif; }
.viz-svg { width: 100%; max-width: 380px; height: auto; background: #f7f6f3; border: 1px solid #ebe9e4; border-radius: 10px; padding: 6px; }
.viz-note { margin: 8px 0 0; font-size: 0.8rem; color: #6b6b80; }
.viz-table { border-collapse: collapse; font-size: 0.85rem; color: #44445a; width: 100%; max-width: 380px; }
.viz-table th, .viz-table td { text-align: left; padding: 5px 10px; border-bottom: 1px solid #ebe9e4; }
.viz-table td:nth-child(3) { width: 45%; }
.viz-barre { display: inline-block; height: 10px; background: #0d9488; border-radius: 3px; }
`;