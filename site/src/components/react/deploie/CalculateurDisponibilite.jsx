import { useState } from "react";
import SegmenteControle from "../carte/SegmenteControle.jsx";

/**
 * Calculateur des « neuf » : on choisit un niveau de disponibilité et l'on voit la
 * durée d'indisponibilité tolérée par an, par mois, par semaine et par jour.
 * Île React pure, sûre au rendu serveur.
 */
const NIVEAUX = [
  { v: 90, surnom: "un neuf" },
  { v: 99, surnom: "deux neuf" },
  { v: 99.9, surnom: "trois neuf" },
  { v: 99.99, surnom: "quatre neuf" },
  { v: 99.999, surnom: "cinq neuf" },
];
const PERIODES = [
  { nom: "Par an", jours: 365 },
  { nom: "Par mois", jours: 30 },
  { nom: "Par semaine", jours: 7 },
  { nom: "Par jour", jours: 1 },
];

function formatDuree(min) {
  const s = min * 60;
  if (s < 60) return `${s < 10 ? s.toFixed(1) : Math.round(s)} s`;
  if (min < 60) {
    const m = Math.floor(min);
    const sec = Math.round((min - m) * 60);
    return sec ? `${m} min ${sec} s` : `${m} min`;
  }
  const h = min / 60;
  if (h < 24) {
    const hh = Math.floor(h);
    const mm = Math.round((h - hh) * 60);
    return mm ? `${hh} h ${mm} min` : `${hh} h`;
  }
  const d = h / 24;
  const dd = Math.floor(d);
  const hh = Math.round((d - dd) * 24);
  return hh ? `${dd} j ${hh} h` : `${dd} j`;
}

export default function CalculateurDisponibilite() {
  const [niveau, setNiveau] = useState(99.9);
  const info = NIVEAUX.find((n) => n.v === niveau);
  const indispo = 1 - niveau / 100;

  return (
    <div className="dispo">
      <SegmenteControle
        titre="Niveau de disponibilité"
        options={NIVEAUX.map((n) => ({ cle: n.v, libelle: `${String(n.v).replace(".", ",")} %` }))}
        valeur={niveau}
        onChange={setNiveau}
      />

      <p className="dispo-surnom">
        {String(niveau).replace(".", ",")} % de disponibilité, souvent appelé « {info.surnom} » : le service peut être indisponible au plus…
      </p>

      <table className="dispo-table">
        <thead><tr><th>Période</th><th>Indisponibilité tolérée</th></tr></thead>
        <tbody>
          {PERIODES.map((p) => (
            <tr key={p.nom}>
              <td>{p.nom}</td>
              <td className="dispo-val">{formatDuree(p.jours * 1440 * indispo)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="dispo-note">Chaque « neuf » supplémentaire divise l'indisponibilité tolérée par dix, et coûte généralement bien plus cher à atteindre. Viser un niveau explicite et réaliste vaut mieux que promettre 100 %.</p>
      <style>{CSS}</style>
    </div>
  );
}

const CSS = `
.dispo { margin: 16px 0; font-family: 'DM Sans', system-ui, sans-serif; }
.dispo-surnom { margin: 12px 0 8px; font-size: 0.88rem; color: #44445a; }
.dispo-table { border-collapse: collapse; font-size: 0.88rem; color: #44445a; width: 100%; max-width: 420px; }
.dispo-table th, .dispo-table td { text-align: left; padding: 7px 12px; border-bottom: 1px solid #ebe9e4; }
.dispo-table th { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.04em; color: #9aa1ad; }
.dispo-val { font-weight: 700; color: #1a1a2e; font-variant-numeric: tabular-nums; }
.dispo-note { margin: 12px 0 0; font-size: 0.82rem; color: #6b6b80; }
`;
