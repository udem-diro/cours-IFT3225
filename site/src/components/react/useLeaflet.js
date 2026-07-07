import { useState, useEffect } from "react";

/**
 * Charge react-leaflet (et le CSS de Leaflet) côté client uniquement.
 *
 * Leaflet accède à `window` dès son import : si on importe react-leaflet au
 * niveau module, cet import s'exécute aussi au rendu serveur (même pour une île
 * client:only, dont le module est tout de même évalué par MDX), ce qui provoque
 * « window is not defined ». On charge donc react-leaflet dans un effet, qui ne
 * s'exécute jamais sur le serveur.
 *
 * Retourne le module react-leaflet une fois chargé, ou null en attendant.
 */
export function useLeaflet() {
  const [moduleLeaflet, setModuleLeaflet] = useState(null);

  useEffect(() => {
    let actif = true;
    (async () => {
      const rl = await import("react-leaflet");
      await import("leaflet/dist/leaflet.css");
      if (actif) setModuleLeaflet(rl);
    })();
    return () => {
      actif = false;
    };
  }, []);

  return moduleLeaflet;
}