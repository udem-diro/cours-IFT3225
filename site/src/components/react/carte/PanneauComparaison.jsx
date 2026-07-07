import { useRecharts } from "./useRecharts.js";
import { TYPES, JOURS, niveauLibelle, uniteDe } from "./carteDonnees.js";

export const PALETTE = ["#0d9488", "#6366f1", "#dc2626", "#d97706", "#0ea5e9", "#7c3aed"];

/**
 * Panneau de comparaison : plusieurs stations sélectionnées côte à côte. Un tableau
 * récapitule leur état courant, et un graphique superpose leurs historiques 30 jours.
 * Chaque station reçoit une couleur stable (par position dans la sélection).
 */
export default function PanneauComparaison({ stations, onRetirer, onVider }) {
  const rc = useRecharts();
  const donnees = JOURS.map((jour, t) => {
    const row = { jour };
    stations.forEach((st) => (row[st.id] = st.historique[t]));
    return row;
  });

  return (
    <aside className="cv-panneau cv-panneau--large">
      <div className="cv-cmp__hd">
        <h4 className="cv-panneau__titre">Comparer ({stations.length})</h4>
        <button className="cv-lien" onClick={onVider}>Tout retirer</button>
      </div>

      <table className="cv-cmp__table">
        <tbody>
          {stations.map((st, i) => (
            <tr key={st.id}>
              <td><span className="cv-dot" style={{ background: PALETTE[i % PALETTE.length] }} /> {st.nom}</td>
              <td>{TYPES[st.type].glyphe}</td>
              <td>{st.valeur} {uniteDe(st.type)}</td>
              <td>{niveauLibelle(st.type, st.categorie)}</td>
              <td><button className="cv-cmp__x" onClick={() => onRetirer(st.id)} aria-label={`Retirer ${st.nom}`}>×</button></td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="cv-cmp__graph">
        {rc ? (
          (() => {
            const { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } = rc;
            return (
              <ResponsiveContainer width="100%" height={190}>
                <LineChart data={donnees} margin={{ top: 8, right: 10, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="jour" tick={{ fontSize: 10 }} interval="preserveStartEnd" minTickGap={28} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  {stations.map((st, i) => (
                    <Line key={st.id} type="monotone" dataKey={st.id} name={st.nom} stroke={PALETTE[i % PALETTE.length]} dot={false} strokeWidth={2} isAnimationActive={false} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            );
          })()
        ) : (
          <div className="cv-cmp__attente">Chargement du graphique…</div>
        )}
      </div>

      <style>{CSS}</style>
    </aside>
  );
}

const CSS = `
.cv-panneau--large { width: 320px; }
.cv-cmp__hd { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.cv-cmp__table { width: 100%; border-collapse: collapse; font-size: 0.8rem; color: #44445a; margin-bottom: 10px; }
.cv-cmp__table td { padding: 4px 4px; border-bottom: 1px solid #f0eeea; }
.cv-dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-right: 5px; vertical-align: middle; }
.cv-cmp__x { border: 0; background: transparent; color: #b3b3c0; font-size: 1rem; line-height: 1; cursor: pointer; }
.cv-cmp__graph { margin-top: 4px; }
.cv-cmp__attente { height: 190px; display: flex; align-items: center; justify-content: center; color: #9898ab; font-size: 0.85rem; background: #f5f7fa; border-radius: 8px; }
`;