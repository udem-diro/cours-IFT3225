import { useState } from "react";

/**
 * Compteur : la démo canonique de useState pour le guide React.
 * Configurable par valeurInitiale et pas, comme à l'étape 4 du guide.
 */
export default function Compteur({ valeurInitiale = 0, pas = 1 }) {
  const [compteur, setCompteur] = useState(valeurInitiale);

  return (
    <div className="cpt">
      <span className="cpt__val">{compteur}</span>
      <button className="cpt__btn" onClick={() => setCompteur(compteur + pas)}>
        Incrémenter (+{pas})
      </button>
      <style>{CSS}</style>
    </div>
  );
}

const CSS = `
.cpt{font-family:'DM Sans',system-ui,sans-serif;display:flex;align-items:center;gap:18px;
  border:1px solid #e2e0db;border-radius:14px;padding:18px 22px;max-width:360px;margin:1.5rem auto;
  background:#fff;color:#1a1a2e}
.cpt__val{font-size:2.1rem;font-weight:800;color:#0d9488;
  min-width:2.5ch;text-align:center;font-variant-numeric:tabular-nums}
.cpt__btn{font:inherit;font-weight:600;font-size:.9rem;padding:9px 16px;border:1px solid #0d9488;
  background:#0d9488;color:#fff;border-radius:9px;cursor:pointer;transition:background .15s}
.cpt__btn:hover{background:#0b8276}
.cpt__btn:focus-visible{outline:2px solid #0d9488;outline-offset:2px}
[data-theme="dark"] .cpt{background:#10141d;border-color:#2a3142;color:#e8e8f0}
[data-theme="dark"] .cpt__btn{color:#0b0f16}
`;