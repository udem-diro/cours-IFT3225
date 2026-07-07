import { useState } from "react";
import Onglets from "../viz/Onglets.jsx";

/**
 * Explorateur interactif de la chaîne de confiance TLS. On choisit l'état du
 * certificat du site et l'on voit comment le navigateur réagit. Île React pure,
 * sûre au rendu serveur.
 */
const CAS = {
  valide: { libelle: "Valide" },
  expire: { libelle: "Expiré" },
  autosigne: { libelle: "Autosigné" },
  domaine: { libelle: "Mauvais domaine" },
};

const VERDICTS = {
  valide: {
    ton: "ok",
    icone: "🔒",
    texte: "Connexion sécurisée. Le navigateur a suivi la chaîne du certificat jusqu'à une autorité racine présente dans son magasin de confiance ; le nom et les dates concordent.",
  },
  expire: {
    ton: "ko",
    icone: "⚠",
    texte: "Certificat expiré. Sa période de validité est dépassée : le navigateur avertit, voire bloque l'accès. Un certificat a une durée limitée et doit être renouvelé, souvent de façon automatique.",
  },
  autosigne: {
    ton: "ko",
    icone: "⚠",
    texte: "Certificat autosigné. Aucune chaîne ne remonte à une autorité reconnue : le chiffrement fonctionne, mais l'identité n'est pas attestée par un tiers de confiance. Le navigateur avertit.",
  },
  domaine: {
    ton: "ko",
    icone: "⚠",
    texte: "Nom incorrect. Le certificat est signé, mais il n'a pas été émis pour ce domaine : le navigateur soupçonne une usurpation et avertit.",
  },
};

export default function ChaineConfiance() {
  const [cas, setCas] = useState("valide");
  const v = VERDICTS[cas];
  const chaineRompue = cas === "autosigne";

  return (
    <div className="cc">
      <Onglets
        options={Object.entries(CAS).map(([cle, c]) => ({ cle, libelle: c.libelle }))}
        valeur={cas}
        onChange={setCas}
      />

      <div className="cc-chaine">
        <div className={`cc-magasin ${chaineRompue ? "cc-inactif" : ""}`}>
          <span className="cc-etiq">Magasin de confiance du navigateur</span>
          <div className="cc-noeud cc-racine">Autorité racine</div>
        </div>
        <div className={`cc-lien ${chaineRompue ? "cc-rompu" : ""}`}>{chaineRompue ? "aucun lien de confiance" : "signe ↓"}</div>
        <div className={`cc-noeud cc-inter ${chaineRompue ? "cc-inactif" : ""}`}>Autorité intermédiaire</div>
        <div className={`cc-lien ${chaineRompue ? "cc-rompu" : ""}`}>{chaineRompue ? "✗" : "signe ↓"}</div>
        <div className={`cc-noeud cc-site cc-${cas}`}>
          <span className={cas === "domaine" ? "cc-alerte" : ""}>{cas === "domaine" ? "autre-site.com" : "exemple.com"}</span>
          <small className={cas === "expire" ? "cc-alerte" : ""}>
            {cas === "expire" ? "valide jusqu'au 12 mars 2025 (dépassé)" : "valide du 1 juin au 30 août 2026"}
          </small>
          {cas === "autosigne" && <small className="cc-alerte">signé par lui-même</small>}
        </div>
      </div>

      <div className={`cc-verdict cc-verdict--${v.ton}`}>
        <span className="cc-icone" aria-hidden="true">{v.icone}</span>
        <span>{v.texte}</span>
      </div>

      <style>{CSS}</style>
    </div>
  );
}

const CSS = `
.cc { margin: 16px 0; font-family: 'DM Sans', system-ui, sans-serif; }
.cc-chaine { display: flex; flex-direction: column; align-items: center; gap: 6px; }
.cc-magasin { border: 1px dashed #c9c7c1; border-radius: 12px; padding: 8px 14px 12px; display: flex; flex-direction: column; align-items: center; gap: 6px; }
.cc-etiq { font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.04em; color: #9aa1ad; font-weight: 700; }
.cc-noeud { border: 1.5px solid #0d9488; border-radius: 10px; padding: 8px 16px; font-size: 0.86rem; font-weight: 600; color: #1a1a2e; background: #fff; text-align: center; }
.cc-racine { border-color: #0d7c70; }
.cc-site { display: flex; flex-direction: column; gap: 2px; }
.cc-site small { font-weight: 400; font-size: 0.74rem; color: #6b6b80; }
.cc-lien { font-size: 0.78rem; color: #9aa1ad; }
.cc-rompu { color: #dc2626; font-weight: 700; }
.cc-inactif { opacity: 0.35; }
.cc-alerte { color: #dc2626; font-weight: 700; }
.cc-valide.cc-site { border-color: #2d8a4e; }
.cc-expire.cc-site, .cc-autosigne.cc-site, .cc-domaine.cc-site { border-color: #dc2626; }
.cc-verdict { display: flex; align-items: flex-start; gap: 10px; margin-top: 14px; padding: 11px 14px; border-radius: 10px; font-size: 0.86rem; }
.cc-icone { font-size: 1.15rem; line-height: 1.2; }
.cc-verdict--ok { background: #ecfdf5; color: #166534; border: 1px solid #bbf7d0; }
.cc-verdict--ko { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }
`;
