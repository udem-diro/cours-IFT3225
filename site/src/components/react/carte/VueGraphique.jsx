import { useRecharts } from "./useRecharts.js";
import { TYPES } from "./carteDonnees.js";

const COULEURS = { air: "#6366f1", eau: "#0ea5e9", bruit: "#f59e0b" };

/**
 * Vue graphique : alternative de visionnement à la carte. Trace la valeur moyenne de
 * chaque mesure (air, eau, bruit) sur les 30 derniers jours, pour les stations
 * affichées. Le type de graphique est réglable : lignes, aires (empilées) ou barres.
 * Recharts est chargé côté client (useRecharts). Le graphique montre toute l'évolution,
 * donc il n'a pas besoin de la lecture temporelle.
 */
export default function VueGraphique({ donnees, type = "ligne" }) {
  const rc = useRecharts();
  if (!rc) return <div className="cv-map cv-attente">Chargement du graphique…</div>;

  const {
    ResponsiveContainer, LineChart, Line, AreaChart, Area, BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  } = rc;

  const mesures = Object.keys(TYPES);
  const axes = (
    <>
      <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
      <XAxis dataKey="jour" tick={{ fontSize: 11 }} interval="preserveStartEnd" minTickGap={26} />
      <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
      <Tooltip />
      <Legend />
    </>
  );

  let graphe;
  if (type === "aire") {
    graphe = (
      <AreaChart data={donnees} margin={{ top: 12, right: 22, left: -8, bottom: 0 }}>
        {axes}
        {mesures.map((m) => (
          <Area key={m} type="monotone" dataKey={m} name={TYPES[m].libelle} stackId="1" stroke={COULEURS[m]} fill={COULEURS[m]} fillOpacity={0.5} isAnimationActive={false} connectNulls />
        ))}
      </AreaChart>
    );
  } else if (type === "barres") {
    graphe = (
      <BarChart data={donnees} margin={{ top: 12, right: 22, left: -8, bottom: 0 }}>
        {axes}
        {mesures.map((m) => (
          <Bar key={m} dataKey={m} name={TYPES[m].libelle} fill={COULEURS[m]} isAnimationActive={false} />
        ))}
      </BarChart>
    );
  } else {
    graphe = (
      <LineChart data={donnees} margin={{ top: 12, right: 22, left: -8, bottom: 0 }}>
        {axes}
        {mesures.map((m) => (
          <Line key={m} type="monotone" dataKey={m} name={TYPES[m].libelle} stroke={COULEURS[m]} dot={false} strokeWidth={2} isAnimationActive={false} connectNulls />
        ))}
      </LineChart>
    );
  }

  return (
    <div className="cv-graph">
      <ResponsiveContainer width="100%" height={380}>{graphe}</ResponsiveContainer>
      <style>{CSS}</style>
    </div>
  );
}

const CSS = `
.cv-graph { height: 380px; border: 1px solid #e0ded8; border-radius: 14px; padding: 8px 8px 4px; background: #fff; }
`;