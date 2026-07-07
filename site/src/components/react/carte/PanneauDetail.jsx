import { TYPES, niveauLibelle, uniteDe, couleurCategorie } from "./carteDonnees.js";

function Spark({ valeurs, couleur }) {
  const w = 220, h = 46, pad = 3;
  const pts = valeurs
    .map((v, i) => {
      const x = pad + (i / (valeurs.length - 1)) * (w - 2 * pad);
      const y = h - pad - (Math.max(0, Math.min(100, v)) / 100) * (h - 2 * pad);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg className="cv-spark" viewBox={`0 0 ${w} ${h}`} role="img" aria-label="Historique 30 jours">
      <polyline points={pts} fill="none" stroke={couleur} stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />
    </svg>
  );
}

/**
 * Panneau de détail enrichi d'une station : type, gravité nommée, valeur et unité,
 * quartier, tendance, fiabilité, nombre d'observations, et l'historique 30 jours.
 */
export default function PanneauDetail({ station, onFermer }) {
  const t = TYPES[station.type];
  const couleur = couleurCategorie(station.categorie);
  return (
    <aside className="cv-panneau">
      <button className="cv-fermer" onClick={onFermer} aria-label="Fermer">×</button>
      <h4 className="cv-panneau__titre">{station.nom}</h4>
      <p className="cv-ligne"><span className="cv-glyphe" aria-hidden="true">{t.glyphe}</span> {t.libelle} · {station.quartier}</p>
      <p className="cv-ligne">
        <span className="cv-pastille" style={{ background: couleur }} /> {niveauLibelle(station.type, station.categorie)} · <strong>{station.valeur}</strong> {uniteDe(station.type)}
      </p>
      <p className="cv-ligne">Tendance : {station.tendance} · fiabilité {station.fiabilite}%</p>
      <p className="cv-ligne">Observations : {station.nbObservations}</p>
      <div className="cv-spark-titre">30 derniers jours</div>
      <Spark valeurs={station.historique} couleur={couleur} />
      <style>{CSS}</style>
    </aside>
  );
}

const CSS = `
.cv-panneau { position: relative; width: 250px; flex-shrink: 0; background: #fff; border: 1px solid #e0ded8; border-radius: 14px; padding: 16px; font-family: 'DM Sans', system-ui, sans-serif; font-size: 0.86rem; color: #44445a; }
.cv-panneau__titre { font-family: 'Fraunces', Georgia, serif; font-size: 1.1rem; color: #1a1a2e; margin: 0 0 10px; }
.cv-panneau .cv-ligne { display: flex; align-items: center; gap: 7px; margin: 0 0 6px; }
.cv-panneau .cv-glyphe { font-size: 1.05rem; line-height: 1; }
.cv-panneau .cv-pastille { display: inline-block; width: 12px; height: 12px; border-radius: 50%; border: 2px solid #fff; box-shadow: 0 0 0 1px rgba(0,0,0,0.12); }
.cv-fermer { position: absolute; top: 10px; right: 12px; border: 0; background: transparent; font-size: 1.3rem; line-height: 1; color: #9898ab; cursor: pointer; }
.cv-spark-titre { margin-top: 10px; font-size: 0.66rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #9aa1ad; }
.cv-spark { width: 100%; height: auto; margin-top: 4px; background: #f5f7fa; border-radius: 8px; }
`;