import { useState } from "react";
import Onglets from "../viz/Onglets.jsx";

/**
 * Trajet complet d'une requête, du nom saisi jusqu'à la page : résolution DNS,
 * connexion, poignée de main TLS avec validation du certificat, requête HTTP et
 * éventuelles redirections, selon plusieurs cas d'utilisation. On déroule les étapes.
 * Île React pure, sûre au rendu serveur.
 */
const SCEN = {
  http: {
    libelle: "http:// vers https", url: "http://exemple.com",
    etapes: [
      { ph: "dns", t: "Résolution DNS de exemple.com : réponse 203.0.113.10 (A) et 2001:db8::10 (AAAA)." },
      { ph: "tcp", t: "Connexion TCP au serveur sur le port 80 (HTTP en clair)." },
      { ph: "redirect", t: "GET http://exemple.com : le serveur répond 301 et redirige vers https://exemple.com." },
      { ph: "tls", t: "Nouvelle connexion sur le port 443 : poignée de main TLS et validation du certificat de exemple.com (valide)." },
      { ph: "ok", t: "GET https://exemple.com : 200 OK, la page est servie sur une connexion chiffrée." },
    ],
  },
  apex: {
    libelle: "apex vers www", url: "https://exemple.com",
    etapes: [
      { ph: "dns", t: "Résolution DNS de exemple.com vers son adresse IP." },
      { ph: "tls", t: "Poignée de main TLS sur le port 443 et validation du certificat (valide)." },
      { ph: "redirect", t: "GET https://exemple.com : 301 vers https://www.exemple.com (le site regroupe tout sur le sous-domaine www)." },
      { ph: "dns", t: "Résolution de www.exemple.com : un CNAME renvoie vers l'hôte de la plateforme, résolu en adresse IP." },
      { ph: "tls", t: "Poignée de main TLS et validation du certificat de www.exemple.com (valide)." },
      { ph: "ok", t: "GET https://www.exemple.com : 200 OK, la page est servie." },
    ],
  },
  www: {
    libelle: "www direct", url: "https://www.exemple.com",
    etapes: [
      { ph: "dns", t: "Résolution de www.exemple.com : un CNAME pointe vers l'hôte de la plateforme, résolu en adresse IP." },
      { ph: "tls", t: "Poignée de main TLS et validation du certificat (valide)." },
      { ph: "ok", t: "GET https://www.exemple.com : 200 OK, la page est servie directement, sans redirection." },
    ],
  },
  cert: {
    libelle: "certificat expiré", url: "https://exemple.com",
    etapes: [
      { ph: "dns", t: "Résolution de exemple.com vers son adresse IP." },
      { ph: "tls", t: "Poignée de main TLS : le certificat présenté est expiré." },
      { ph: "echec", t: "La validation échoue : le navigateur interrompt la connexion et avertit. Aucune requête HTTP n'est envoyée." },
    ],
  },
};
const PH = {
  dns: { lib: "DNS", coul: "#6366f1" },
  tcp: { lib: "TCP", coul: "#0ea5e9" },
  tls: { lib: "TLS", coul: "#0d9488" },
  redirect: { lib: "301", coul: "#7c3aed" },
  ok: { lib: "200", coul: "#2d8a4e" },
  echec: { lib: "✗", coul: "#dc2626" },
};

export default function TrajetRequete() {
  const [cas, setCas] = useState("http");
  const [n, setN] = useState(0);
  const sc = SCEN[cas];
  const total = sc.etapes.length;

  const changer = (c) => { setCas(c); setN(0); };

  return (
    <div className="tr">
      <Onglets options={Object.entries(SCEN).map(([cle, s]) => ({ cle, libelle: s.libelle }))} valeur={cas} onChange={changer} />

      <div className="tr-barre">
        <span className="tr-url">{sc.url}</span>
        <button className="tr-btn" onClick={() => setN((x) => Math.min(x + 1, total))} disabled={n >= total}>
          {n === 0 ? "Lancer" : n >= total ? "Terminé" : "Étape suivante"}
        </button>
        <button className="tr-btn tr-btn--fant" onClick={() => setN(0)} disabled={n === 0}>Réinitialiser</button>
      </div>

      <ol className="tr-liste">
        {sc.etapes.slice(0, n).map((e, i) => (
          <li key={i} className="tr-etape">
            <span className="tr-badge" style={{ background: PH[e.ph].coul }}>{PH[e.ph].lib}</span>
            <span className="tr-txt">{e.t}</span>
          </li>
        ))}
      </ol>

      {n >= total && (
        <p className={`tr-fin ${sc.etapes[total - 1].ph === "echec" ? "tr-fin--ko" : "tr-fin--ok"}`}>
          {sc.etapes[total - 1].ph === "echec" ? "Connexion refusée : la page n'est pas servie." : "Page servie sur une connexion sécurisée."}
        </p>
      )}
      <style>{CSS}</style>
    </div>
  );
}

const CSS = `
.tr { margin: 16px 0; font-family: 'DM Sans', system-ui, sans-serif; }
.tr-barre { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; margin: 10px 0 14px; }
.tr-url { font-family: 'JetBrains Mono', monospace; font-size: 0.82rem; color: #1a1a2e; background: #f1efe9; padding: 4px 8px; border-radius: 6px; }
.tr-btn { border: 0; background: #0d9488; color: #fff; font: inherit; font-size: 0.85rem; font-weight: 600; padding: 8px 16px; border-radius: 9px; cursor: pointer; }
.tr-btn--fant { background: #fff; color: #44445a; border: 1px solid #d8d6d0; }
.tr-btn:disabled { opacity: 0.55; cursor: default; }
.tr-liste { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 7px; }
.tr-etape { display: grid; grid-template-columns: 46px 1fr; align-items: center; gap: 10px; border: 1px solid #ebe9e4; border-radius: 8px; padding: 8px 12px; background: #fff; }
.tr-badge { font-size: 0.72rem; font-weight: 700; color: #fff; text-align: center; padding: 3px 4px; border-radius: 6px; }
.tr-txt { font-size: 0.84rem; color: #44445a; }
.tr-fin { margin: 14px 0 0; font-size: 0.86rem; padding: 10px 12px; border-radius: 9px; }
.tr-fin--ok { background: #ecfdf5; color: #166534; border: 1px solid #bbf7d0; }
.tr-fin--ko { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }
`;