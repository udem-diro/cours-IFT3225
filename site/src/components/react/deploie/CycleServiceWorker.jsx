import { useState } from "react";
import Onglets from "../viz/Onglets.jsx";

/**
 * Cycle de vie d'un service worker : on parcourt ses états et leur rôle. Île React
 * pure, sûre au rendu serveur.
 */
const ETATS = [
  { cle: "enregistrement", titre: "Enregistrement", texte: "La page demande au navigateur d'enregistrer un script comme service worker. Il s'exécute à part de la page, en arrière-plan." },
  { cle: "installation", titre: "Installation", texte: "À la première visite, le service worker s'installe et met en cache les ressources de base de l'application (sa coquille)." },
  { cle: "activation", titre: "Activation", texte: "Une fois installé, il s'active et prend le contrôle des pages. C'est le moment de nettoyer les anciens caches devenus inutiles." },
  { cle: "interception", titre: "Interception (fetch)", texte: "Activé, il intercepte les requêtes de l'application et décide, selon la stratégie choisie, de répondre depuis le cache, depuis le réseau, ou les deux. C'est ce qui rend le hors ligne possible." },
  { cle: "miseajour", titre: "Mise à jour", texte: "Quand le script change, une nouvelle version s'installe en arrière-plan et attend, souvent, que les anciens onglets soient fermés avant de prendre le relais." },
];

export default function CycleServiceWorker() {
  const [cle, setCle] = useState("enregistrement");
  const i = ETATS.findIndex((e) => e.cle === cle);
  const etat = ETATS[i];

  return (
    <div className="sw">
      <Onglets options={ETATS.map((e, n) => ({ cle: e.cle, libelle: `${n + 1}. ${e.titre}` }))} valeur={cle} onChange={setCle} />
      <div className="sw-carte">
        <div className="sw-fil">
          {ETATS.map((e, n) => (
            <span key={e.cle} className={`sw-point ${n === i ? "on" : ""} ${n < i ? "passe" : ""}`} />
          ))}
        </div>
        <h4 className="sw-titre">{etat.titre}</h4>
        <p className="sw-texte">{etat.texte}</p>
      </div>
      <style>{CSS}</style>
    </div>
  );
}

const CSS = `
.sw { margin: 16px 0; font-family: 'DM Sans', system-ui, sans-serif; }
.sw-carte { border: 1px solid #ebe9e4; border-radius: 12px; padding: 14px 16px; background: #fff; }
.sw-fil { display: flex; gap: 8px; margin-bottom: 10px; }
.sw-point { width: 26px; height: 4px; border-radius: 2px; background: #e5e7eb; }
.sw-point.passe { background: #a7f3d0; }
.sw-point.on { background: #0d9488; }
.sw-titre { margin: 0 0 6px; font-family: 'Fraunces', Georgia, serif; font-size: 1.05rem; color: #1a1a2e; }
.sw-texte { margin: 0; font-size: 0.88rem; color: #44445a; }
`;
