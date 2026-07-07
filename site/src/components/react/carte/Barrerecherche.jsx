/**
 * Barre de recherche contrôlée, réutilisable. Ne fait qu'émettre le texte saisi ;
 * c'est l'appelant qui décide comment filtrer.
 */
export default function BarreRecherche({ valeur, onChange, placeholder = "Rechercher..." }) {
  return (
    <label className="cv-recherche">
      <span className="cv-recherche__icone" aria-hidden="true">🔎</span>
      <input
        type="search"
        value={valeur}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label="Rechercher"
      />
      {valeur && (
        <button className="cv-recherche__x" onClick={() => onChange("")} aria-label="Effacer la recherche">×</button>
      )}
      <style>{CSS}</style>
    </label>
  );
}

const CSS = `
.cv-recherche { display: inline-flex; align-items: center; gap: 6px; background: #fff; border: 1px solid #d8d6d0; border-radius: 9px; padding: 5px 9px; }
.cv-recherche__icone { opacity: 0.6; font-size: 0.9rem; }
.cv-recherche input { border: 0; outline: 0; font: inherit; font-size: 0.84rem; min-width: 150px; background: transparent; color: #1a1a2e; }
.cv-recherche__x { border: 0; background: transparent; cursor: pointer; color: #9898ab; font-size: 1.15rem; line-height: 1; }
`;