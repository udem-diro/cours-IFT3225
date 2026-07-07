import { useState } from "react";
import { useLeaflet } from "./useLeaflet.js";
import CoucheMarqueurs from "./CoucheMarqueurs.jsx";
import RechercheAuto from "./RechercheAuto.jsx";
import FiltreNiveaux, { NIVEAUX } from "./FiltreNiveaux.jsx";
import Curseur from "./Curseur.jsx";
import SegmenteControle from "./SegmenteControle.jsx";
import LecteurTemporel from "./LecteurTemporel.jsx";
import VueGraphique from "./VueGraphique.jsx";
import { STATIONS, TYPES, QUARTIERS, CENTRE, JOURS, categorieDe, NB_PAS } from "./carteDonnees.js";

/**
 * Niveau 4 — cumulatif : tout le niveau 3, plus le temps. L'historique couvre les 30
 * derniers jours (1 pas = 1 jour). En vue carte, une barre de lecture posée en bas
 * de la carte rejoue les jours ; couleur et taille suivent la valeur du jour. En vue
 * graphique (lignes, aires ou barres), toute l'évolution est visible d'un coup, donc
 * pas de lecture. L'échelle de taille reste globale et fixe.
 */
const CRITERES = {
  valeur: { libelle: "Valeur", lire: (st) => st.valeur },
  fraicheur: { libelle: "Fraîcheur", lire: (st) => 180 - st.minutesDepuis },
  observations: { libelle: "Observations", lire: (st) => st.nbObservations },
};
const T_MIN = 22;
const T_MAX = 44;

function niveauxTous() {
  const o = {};
  for (const type of Object.keys(TYPES)) for (const n of NIVEAUX) o[`${type}:${n}`] = true;
  return o;
}

export default function CarteDynamique() {
  const lib = useLeaflet();
  const [recherche, setRecherche] = useState("");
  const [niveaux, setNiveaux] = useState(niveauxTous);
  const [quartier, setQuartier] = useState("tous");
  const [seuil, setSeuil] = useState(0);
  const [critere, setCritere] = useState("valeur");
  const [paliers, setPaliers] = useState(4);
  const [vue, setVue] = useState("carte");
  const [typeGraphe, setTypeGraphe] = useState("ligne");
  const [pas, setPas] = useState(NB_PAS - 1);
  const [lecture, setLecture] = useState(false);
  const [carte, setCarte] = useState(null);

  const basculer = (cle) => setNiveaux((p) => ({ ...p, [cle]: !p[cle] }));
  const basculerMesure = (type) =>
    setNiveaux((p) => {
      const actif = NIVEAUX.some((n) => p[`${type}:${n}`]);
      const suivant = { ...p };
      NIVEAUX.forEach((n) => (suivant[`${type}:${n}`] = !actif));
      return suivant;
    });
  const toutNiveaux = (valeur) =>
    setNiveaux(() => {
      const o = {};
      for (const type of Object.keys(TYPES)) for (const n of NIVEAUX) o[`${type}:${n}`] = valeur;
      return o;
    });

  const filtrees = STATIONS.filter(
    (st) =>
      niveaux[`${st.type}:${st.categorie}`] &&
      (quartier === "tous" || st.quartier === quartier) &&
      st.valeur >= seuil
  );
  const q = recherche.trim().toLowerCase();
  const visibles =
    q === ""
      ? filtrees
      : filtrees.filter((st) => st.nom.toLowerCase().includes(q) || st.quartier.toLowerCase().includes(q));

  const suggestions = filtrees.map((st) => ({
    cle: st.id,
    libelle: st.nom,
    sousTitre: `${TYPES[st.type].libelle} · ${st.quartier}`,
    glyphe: TYPES[st.type].glyphe,
  }));
  const selectionner = (s) => {
    const st = STATIONS.find((x) => x.id === s.cle);
    if (!st) return;
    setRecherche(st.nom);
    if (carte) carte.flyTo(st.position, 15);
  };

  // état au jour courant
  const etat = visibles.map((st) => {
    const v = st.historique[pas];
    return { ...st, valeur: v, categorie: categorieDe(v) };
  });

  // pondération : échelle globale et fixe (valeurs de base)
  const lire = CRITERES[critere].lire;
  const poids = STATIONS.map(lire);
  const min = Math.min(...poids);
  const max = Math.max(...poids);
  const tailleDe = (st) => {
    const t = max === min ? 0.5 : (lire(st) - min) / (max - min);
    const palier = Math.min(paliers - 1, Math.floor(t * paliers));
    return Math.round(T_MIN + (palier / (paliers - 1)) * (T_MAX - T_MIN));
  };

  // séries pour la vue graphique : moyenne par mesure, chaque jour
  const donnees = JOURS.map((jour, t) => {
    const row = { jour };
    for (const type of Object.keys(TYPES)) {
      const grp = visibles.filter((st) => st.type === type);
      row[type] = grp.length ? Math.round(grp.reduce((s, st) => s + st.historique[t], 0) / grp.length) : null;
    }
    return row;
  });

  if (!lib) {
    return (
      <div className="cv">
        <div className="cv-map cv-attente">Chargement de la carte…</div>
        <style>{CSS}</style>
      </div>
    );
  }

  const { MapContainer, TileLayer } = lib;

  return (
    <div className="cv">
      <div className="cv-controles">
        <div className="cv-ligne-controles">
          <SegmenteControle
            titre="Vue"
            options={[{ cle: "carte", libelle: "Carte" }, { cle: "graphique", libelle: "Graphique" }]}
            valeur={vue}
            onChange={setVue}
          />
          {vue === "graphique" && (
            <SegmenteControle
              titre="Graphique"
              options={[{ cle: "ligne", libelle: "Lignes" }, { cle: "aire", libelle: "Aires" }, { cle: "barres", libelle: "Barres" }]}
              valeur={typeGraphe}
              onChange={setTypeGraphe}
            />
          )}
        </div>
        <div className="cv-ligne-controles">
          <RechercheAuto valeur={recherche} onChange={setRecherche} onSelectionner={selectionner} suggestions={suggestions} placeholder="Nom d'un capteur ou quartier..." />
          <label className="cv-select">
            Quartier :
            <select value={quartier} onChange={(e) => setQuartier(e.target.value)}>
              <option value="tous">Tous</option>
              {QUARTIERS.map((qz) => (<option key={qz} value={qz}>{qz}</option>))}
            </select>
          </label>
          <Curseur libelle="Valeur min" valeur={seuil} onChange={setSeuil} />
          {vue === "carte" && (
            <>
              <SegmenteControle
                titre="Taille selon"
                options={[{ cle: "valeur", libelle: "Valeur" }, { cle: "fraicheur", libelle: "Fraîcheur" }, { cle: "observations", libelle: "Observations" }]}
                valeur={critere}
                onChange={setCritere}
              />
              <SegmenteControle
                titre="Paliers"
                options={[{ cle: 3, libelle: "3" }, { cle: 4, libelle: "4" }, { cle: 5, libelle: "5" }]}
                valeur={paliers}
                onChange={setPaliers}
              />
            </>
          )}
        </div>
        <FiltreNiveaux actifs={niveaux} onBasculer={basculer} onBasculerMesure={basculerMesure} onTout={toutNiveaux} />
      </div>

      {vue === "carte" ? (
        <div className="cv-carte-wrap">
          <MapContainer ref={setCarte} center={CENTRE} zoom={13} scrollWheelZoom={false} className="cv-map">
            <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <CoucheMarqueurs lib={lib} stations={etat} tailleDe={tailleDe} />
          </MapContainer>
          <div className="cv-lecteur-carte">
            <LecteurTemporel pas={pas} nbPas={NB_PAS} lecture={lecture} onLecture={setLecture} onPas={setPas} libelle={JOURS[pas]} />
          </div>
        </div>
      ) : (
        <VueGraphique donnees={donnees} type={typeGraphe} />
      )}

      <p className="cv-compte">
        {visibles.length} stations ·{" "}
        {vue === "carte"
          ? `jour affiché : ${JOURS[pas]} · taille = ${CRITERES[critere].libelle.toLowerCase()}`
          : "moyenne par mesure sur les 30 derniers jours"}
      </p>

      <style>{CSS}</style>
    </div>
  );
}

const CSS = `
.cv { margin: 1.5rem 0; font-family: 'DM Sans', system-ui, sans-serif; }
.cv-carte-wrap { position: relative; }
.cv-map { height: 440px; width: 100%; border-radius: 14px; border: 1px solid #e0ded8; z-index: 0; }
.cv-lecteur-carte { position: absolute; left: 12px; right: 12px; bottom: 12px; z-index: 500; background: rgba(255,255,255,0.94); border: 1px solid #e0ded8; border-radius: 10px; padding: 7px 12px; box-shadow: 0 4px 16px rgba(15,23,42,0.18); }
.cv-attente { display: flex; align-items: center; justify-content: center; height: 380px; color: #9898ab; font-size: 0.9rem; background: #f5f7fa; border-radius: 14px; }
.cv-controles { margin-bottom: 12px; padding: 12px 14px; background: #f5f7fa; border: 1px solid #e8e6e1; border-radius: 12px; font-size: 0.85rem; color: #44445a; }
.cv-ligne-controles { display: flex; flex-wrap: wrap; gap: 14px 20px; align-items: center; margin-bottom: 12px; }
.cv-select { display: flex; align-items: center; gap: 6px; }
.cv-select select { font: inherit; font-size: 0.84rem; padding: 5px 8px; border: 1px solid #d8d6d0; border-radius: 8px; background: #fff; cursor: pointer; }
.cv-compte { margin: 10px 0 0; font-size: 0.82rem; color: #6b6b80; }
.cv-icone { background: none; border: 0; }
.cv-icone__pin { display: flex; align-items: center; justify-content: center; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 2px solid #fff; box-shadow: 0 2px 6px rgba(0,0,0,0.35); }
.cv-icone__glyphe { transform: rotate(45deg); line-height: 1; }
.cv-pop__titre { display: block; font-weight: 700; font-size: 0.95rem; margin-bottom: 4px; }
.cv-pop__ligne { display: block; font-size: 0.83rem; color: #44445a; }
`;