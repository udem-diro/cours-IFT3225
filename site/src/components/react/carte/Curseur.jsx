/**
 * Curseur (range) étiqueté et réutilisable. La valeur affichée suit le curseur ;
 * l'appelant décide de son effet.
 */
export default function Curseur({ libelle, min = 0, max = 100, pas = 1, valeur, onChange, suffixe = "" }) {
  return (
    <label className="cv-curseur">
      {libelle} : <strong>{valeur}{suffixe}</strong>
      <input
        type="range"
        min={min}
        max={max}
        step={pas}
        value={valeur}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <style>{CSS}</style>
    </label>
  );
}

const CSS = `
.cv-curseur { display: flex; align-items: center; gap: 8px; font-size: 0.85rem; color: #44445a; }
.cv-curseur input { cursor: pointer; }
`;