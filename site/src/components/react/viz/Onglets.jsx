/** Barre d'onglets partagée par les illustrateurs interactifs. */
export default function Onglets({ options, valeur, onChange }) {
  return (
    <div className="viz-onglets" role="tablist">
      {options.map((o) => (
        <button
          key={o.cle}
          role="tab"
          aria-selected={valeur === o.cle}
          className={`viz-onglet ${valeur === o.cle ? "on" : ""}`}
          onClick={() => onChange(o.cle)}
        >
          {o.libelle}
        </button>
      ))}
      <style>{CSS}</style>
    </div>
  );
}
const CSS = `
.viz-onglets { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; }
.viz-onglet { border: 1px solid #d8d6d0; background: #fff; color: #44445a; font: inherit; font-size: 0.8rem; font-weight: 600; padding: 5px 12px; border-radius: 999px; cursor: pointer; }
.viz-onglet:hover { background: #f5f7fa; }
.viz-onglet.on { background: #0d9488; border-color: #0d9488; color: #fff; }
`;