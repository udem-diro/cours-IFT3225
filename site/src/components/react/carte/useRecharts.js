import { useState, useEffect } from "react";

/**
 * Charge Recharts côté client uniquement. Recharts n'est pas importé au niveau du
 * module (l'import serait évalué au rendu serveur), mais dans un effet.
 * Retourne le module Recharts, ou null tant qu'il n'est pas prêt.
 */
export function useRecharts() {
  const [rc, setRc] = useState(null);
  useEffect(() => {
    let actif = true;
    (async () => {
      const m = await import("recharts");
      if (actif) setRc(m);
    })();
    return () => {
      actif = false;
    };
  }, []);
  return rc;
}