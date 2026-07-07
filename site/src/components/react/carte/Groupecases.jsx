/**
 * Groupe de cases à cocher réutilisable. Chaque item : { cle, libelle, couleur?, glyphe? }.
 * `actifs` est un objet { cle: booleen } ; `onBasculer(cle)` inverse une case.
 */
export default function GroupeCases({ titre, items, actifs, onBasculer }) {
  return (
    <div className="cv-groupe-cases" role="group" aria-label={titre}>
      {titre && <span className="cv-groupe-titre">{titre}</span>}
      <div className="cv-cases">
        {items.map((it) => (
          <label key={it.cle} className="cv-case">
            <input type="checkbox" checked={!!actifs[it.cle]} onChange={() => onBasculer(it.cle)} />
            {it.couleur && <span className="cv-pastille" style={{ background: it.couleur }} />}
            {it.glyphe && <span className="cv-glyphe" aria-hidden="true">{it.glyphe}</span>}
            {it.libelle}
          </label>
        ))}
      </div>
      <style>{CSS}</style>
    </div>
  );
}

const CSS = `
.cv-groupe-cases { display: flex; flex-direction: column; gap: 5px; }
.cv-groupe-titre { font-size: 0.66rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #9aa1ad; }
.cv-cases { display: flex; gap: 12px; flex-wrap: wrap; }
.cv-case { display: flex; align-items: center; gap: 5px; cursor: pointer; font-size: 0.83rem; color: #44445a; }
.cv-case input { cursor: pointer; }
.cv-case .cv-pastille { display: inline-block; width: 12px; height: 12px; border-radius: 50%; border: 2px solid #fff; box-shadow: 0 0 0 1px rgba(0,0,0,0.12); }
.cv-case .cv-glyphe { font-size: 1rem; line-height: 1; }
`;