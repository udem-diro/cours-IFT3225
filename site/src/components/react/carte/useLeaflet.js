import { useState, useEffect } from "react";

/**
 * Charge, côté client uniquement, tout ce dont les cartes ont besoin :
 * react-leaflet, l'objet L de Leaflet, react-leaflet-cluster, et les CSS.
 *
 * Leaflet et markercluster accèdent à `window` dès leur import : on ne les importe
 * donc jamais au niveau module (l'import serait évalué au rendu serveur, même pour
 * une île client:only, d'où « window is not defined »). On les charge dans un effet.
 *
 * Retourne un objet regroupant les exports de react-leaflet + { L, MarkerClusterGroup },
 * ou null tant que le chargement n'est pas terminé.
 */
export function useLeaflet() {
  const [lib, setLib] = useState(null);

  useEffect(() => {
    let actif = true;
    (async () => {
      const rl = await import("react-leaflet");
      const modL = await import("leaflet");
      const cluster = await import("react-leaflet-cluster");
      await import("leaflet/dist/leaflet.css");
      await import("leaflet.markercluster/dist/MarkerCluster.css");
      await import("leaflet.markercluster/dist/MarkerCluster.Default.css");
      if (actif) {
        setLib({ ...rl, L: modL.default ?? modL, MarkerClusterGroup: cluster.default });
      }
    })();
    return () => {
      actif = false;
    };
  }, []);

  return lib;
}