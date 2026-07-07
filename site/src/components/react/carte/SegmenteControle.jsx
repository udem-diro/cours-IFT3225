/**
 * Contrôle segmenté générique : une rangée de boutons exclusifs.
 * `options` : [{ cle, libelle }]. `valeur` = cle sélectionnée. `onChange(cle)`.
 */
export default function SegmenteControle({ titre, options, valeur, onChange }) {
  return (
    <div className="cv-seg-groupe">
      {titre && <span className="cv-groupe-titre">{titre}</span>}
      <div className="cv-segmente" role="group" aria-label={titre}>
        {options.map((o) => (
          <button
            key={String(o.cle)}
            className={`cv-seg ${valeur === o.cle ? "on" : ""}`}
            aria-pressed={valeur === o.cle}
            onClick={() => onChange(o.cle)}
          >
            {o.libelle}
          </button>
        ))}
      </div>
      <style>{CSS}</style>
    </div>
  );
}

const CSS = `
.cv-seg-groupe { display: flex; flex-direction: column; gap: 5px; }
.cv-seg-groupe .cv-groupe-titre { font-size: 0.66rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #9aa1ad; }
.cv-segmente { display: inline-flex; border: 1px solid #d8d6d0; border-radius: 9px; overflow: hidden; width: fit-content; }
.cv-seg { border: 0; background: #fff; color: #44445a; font: inherit; font-size: 0.84rem; font-weight: 600; padding: 7px 13px; cursor: pointer; border-right: 1px solid #e8e6e1; }
.cv-seg:last-child { border-right: 0; }
.cv-seg:hover { background: #f5f7fa; }
.cv-seg.on { background: #0d9488; color: #fff; }
`;