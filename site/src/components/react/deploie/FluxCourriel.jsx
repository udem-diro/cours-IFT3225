import { useState } from "react";
import SegmenteControle from "../carte/SegmenteControle.jsx";

/**
 * Flux d'un courriel : l'envoi passe par SMTP, la relève par IMAP ou POP3. Le
 * sélecteur montre la différence entre IMAP et POP3. Île React pure, sûre au SSR.
 */
const RELEVE = {
  imap: {
    titre: "IMAP",
    points: [
      "Les messages restent sur le serveur ; le client en affiche une vue.",
      "Les dossiers et les états (lu, non lu, déplacé) sont synchronisés entre tous les appareils.",
      "Adapté à une consultation depuis plusieurs appareils.",
    ],
  },
  pop3: {
    titre: "POP3",
    points: [
      "Les messages sont téléchargés sur l'appareil, puis souvent supprimés du serveur.",
      "Peu ou pas de synchronisation entre appareils.",
      "Adapté à un usage sur un seul appareil, ou à un archivage local.",
    ],
  },
};

export default function FluxCourriel() {
  const [proto, setProto] = useState("imap");
  const r = RELEVE[proto];

  return (
    <div className="mail">
      <div className="mail-flux">
        <div className="mail-noeud">Expéditeur</div>
        <div className="mail-fleche"><small>SMTP</small><span>→</span></div>
        <div className="mail-noeud">Serveur d'envoi</div>
        <div className="mail-fleche"><small>SMTP</small><span>→</span></div>
        <div className="mail-noeud">Serveur de réception</div>
        <div className="mail-fleche mail-fleche--releve"><small>{r.titre}</small><span>→</span></div>
        <div className="mail-noeud">Destinataire</div>
      </div>

      <p className="mail-legende">
        L'acheminement (de l'expéditeur au serveur du destinataire) se fait par <strong>SMTP</strong>. La relève (du serveur vers le logiciel du destinataire) se fait par <strong>IMAP</strong> ou <strong>POP3</strong>.
      </p>

      <SegmenteControle
        titre="Protocole de relève"
        options={[{ cle: "imap", libelle: "IMAP" }, { cle: "pop3", libelle: "POP3" }]}
        valeur={proto}
        onChange={setProto}
      />

      <ul className="mail-points">
        {r.points.map((p, i) => (<li key={i}>{p}</li>))}
      </ul>
      <style>{CSS}</style>
    </div>
  );
}

const CSS = `
.mail { margin: 16px 0; font-family: 'DM Sans', system-ui, sans-serif; }
.mail-flux { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.mail-noeud { border: 1.5px solid #0d9488; border-radius: 10px; padding: 8px 12px; font-size: 0.82rem; font-weight: 600; color: #1a1a2e; background: #fff; text-align: center; }
.mail-fleche { display: flex; flex-direction: column; align-items: center; color: #9aa1ad; font-size: 1.1rem; line-height: 1; }
.mail-fleche small { font-size: 0.66rem; font-weight: 700; letter-spacing: 0.03em; color: #6b6b80; margin-bottom: 2px; }
.mail-fleche--releve small { color: #0d7c70; }
.mail-legende { margin: 12px 0; font-size: 0.84rem; color: #44445a; }
.mail-points { margin: 10px 0 0; padding-left: 20px; font-size: 0.86rem; color: #44445a; }
.mail-points li { margin-bottom: 4px; }
`;