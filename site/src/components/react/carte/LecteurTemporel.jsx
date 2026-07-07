import { useEffect } from "react";

/**
 * Lecteur temporel réutilisable : bouton Lecture/Pause et curseur de pas. Fait
 * avancer le pas en boucle pendant la lecture ; le curseur reste réglable à la main
 * (et met en pause). `libelle` affiche le repère courant (ex. une date) au lieu du
 * numéro de pas. Prévu pour être posé en bas de la carte (pleine largeur).
 * `onPas` accepte une valeur ou une fonction (comme un setState).
 */
export default function LecteurTemporel({ pas, nbPas, lecture, onLecture, onPas, libelle, vitesse = 650 }) {
  useEffect(() => {
    if (!lecture) return;
    const id = setInterval(() => onPas((p) => (p + 1) % nbPas), vitesse);
    return () => clearInterval(id);
  }, [lecture, nbPas, vitesse, onPas]);

  return (
    <div className="cv-lecteur">
      <button className="cv-bouton" onClick={() => onLecture(!lecture)}>{lecture ? "Pause" : "Lecture"}</button>
      <span className="cv-lecteur__repere">{libelle ?? `${pas + 1} / ${nbPas}`}</span>
      <input
        className="cv-lecteur__curseur"
        type="range"
        min="0"
        max={nbPas - 1}
        value={pas}
        onChange={(e) => { onLecture(false); onPas(Number(e.target.value)); }}
        aria-label="Position temporelle"
      />
      <style>{CSS}</style>
    </div>
  );
}

const CSS = `
.cv-lecteur { display: flex; align-items: center; gap: 12px; width: 100%; font-family: 'DM Sans', system-ui, sans-serif; }
.cv-bouton { border: 0; background: #0d9488; color: #fff; font: inherit; font-size: 0.82rem; font-weight: 600; padding: 6px 14px; border-radius: 8px; cursor: pointer; flex-shrink: 0; }
.cv-bouton:hover { background: #0b7d72; }
.cv-lecteur__repere { font-size: 0.82rem; font-weight: 600; color: #1a1a2e; min-width: 62px; flex-shrink: 0; }
.cv-lecteur__curseur { flex: 1; cursor: pointer; }
`;