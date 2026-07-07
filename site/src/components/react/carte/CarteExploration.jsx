import { useState, useEffect } from "react";
import { useLeaflet } from "./useLeaflet.js";
import CoucheMarqueurs from "./CoucheMarqueurs.jsx";
import RechercheAuto from "./RechercheAuto.jsx";
import FiltreNiveaux, { NIVEAUX } from "./FiltreNiveaux.jsx";
import Curseur from "./Curseur.jsx";
import SegmenteControle from "./SegmenteControle.jsx";
import LecteurTemporel from "./LecteurTemporel.jsx";
import VueGraphique from "./VueGraphique.jsx";
import PanneauDetail from "./PanneauDetail.jsx";
import PanneauComparaison from "./PanneauComparaison.jsx";
import SelecteurFond, { FONDS } from "./SelecteurFond.jsx";
import { STATIONS, CATEGORIES, TYPES, QUARTIERS, CENTRE, JOURS, ZONES, categorieDe, couleurCategorie, NB_PAS } from "./carteDonnees.js";

/**
 * Niveau 5 — exploration à plusieurs niveaux, cumulatif et complet. Reprend tout le
 * niveau 4 et ajoute : la sélection multiple de stations (clic) avec panneau de détail
 * enrichi (une station) ou de comparaison (plusieurs), l'ajout de zones à surveiller
 * (clic sur la carte), et le choix du fond de carte. Illustre « une carte capable de
 * tout montrer ne montre presque rien » : on ouvre sobre, on révèle à la demande.
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

export default function CarteExploration() {
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
  const [selection, setSelection] = useState([]);
  const [fond, setFond] = useState("clair");
  const [modeZone, setModeZone] = useState(false);
  const [pinceauZone, setPinceauZone] = useState("moyen");
  const [zonesAjoutees, setZonesAjoutees] = useState([]);
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

  const basculerSelection = (st) =>
    setSelection((prev) => (prev.includes(st.id) ? prev.filter((id) => id !== st.id) : [...prev, st.id]));
  const retirer = (id) => setSelection((prev) => prev.filter((x) => x !== id));
  const viderSelection = () => setSelection([]);

  // ajout de zones à surveiller au clic (quand le mode est actif)
  useEffect(() => {
    if (!carte || !modeZone) return;
    const onClick = (e) => {
      setZonesAjoutees((prev) => [
        ...prev,
        { id: `zaj-${Date.now()}`, nom: `Zone ${ZONES.length + prev.length + 1}`, centre: [e.latlng.lat, e.latlng.lng], rayon: 700, niveau: pinceauZone },
      ]);
    };
    carte.on("click", onClick);
    return () => carte.off("click", onClick);
  }, [carte, modeZone, pinceauZone]);

  const etatDe = (st) => {
    const v = st.historique[pas];
    return { ...st, valeur: v, categorie: categorieDe(v) };
  };

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
  const visiblesEtat = visibles.map(etatDe);
  const selSet = new Set(selection);
  const selectionObjets = selection
    .map((id) => {
      const st = STATIONS.find((x) => x.id === id);
      return st ? etatDe(st) : null;
    })
    .filter(Boolean);

  const suggestions = filtrees.map((st) => ({
    cle: st.id,
    libelle: st.nom,
    sousTitre: `${TYPES[st.type].libelle} · ${st.quartier}`,
    glyphe: TYPES[st.type].glyphe,
  }));
  const allerA = (s) => {
    const st = STATIONS.find((x) => x.id === s.cle);
    if (!st) return;
    setRecherche(st.nom);
    if (carte) carte.flyTo(st.position, 15);
  };

  const lire = CRITERES[critere].lire;
  const poids = STATIONS.map(lire);
  const min = Math.min(...poids);
  const max = Math.max(...poids);
  const tailleDe = (st) => {
    const t = max === min ? 0.5 : (lire(st) - min) / (max - min);
    const palier = Math.min(paliers - 1, Math.floor(t * paliers));
    return Math.round(T_MIN + (palier / (paliers - 1)) * (T_MAX - T_MIN));
  };

  const donnees = JOURS.map((jour, t) => {
    const row = { jour };
    for (const type of Object.keys(TYPES)) {
      const grp = visibles.filter((st) => st.type === type);
      row[type] = grp.length ? Math.round(grp.reduce((s, st) => s + st.historique[t], 0) / grp.length) : null;
    }
    return row;
  });

  const zones = [...ZONES, ...zonesAjoutees];

  if (!lib) {
    return (
      <div className="cv">
        <div className="cv-map cv-attente">Chargement de la carte…</div>
        <style>{CSS}</style>
      </div>
    );
  }

  const { MapContainer, TileLayer, Circle, Tooltip } = lib;

  return (
    <div className="cv">
      <div className="cv-controles">
        <div className="cv-ligne-controles">
          <SegmenteControle titre="Vue" options={[{ cle: "carte", libelle: "Carte" }, { cle: "graphique", libelle: "Graphique" }]} valeur={vue} onChange={setVue} />
          {vue === "graphique" && (
            <SegmenteControle titre="Graphique" options={[{ cle: "ligne", libelle: "Lignes" }, { cle: "aire", libelle: "Aires" }, { cle: "barres", libelle: "Barres" }]} valeur={typeGraphe} onChange={setTypeGraphe} />
          )}
          {vue === "carte" && <SelecteurFond valeur={fond} onChange={setFond} />}
        </div>
        <div className="cv-ligne-controles">
          <RechercheAuto valeur={recherche} onChange={setRecherche} onSelectionner={allerA} suggestions={suggestions} placeholder="Nom d'un capteur ou quartier..." />
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
              <SegmenteControle titre="Taille selon" options={[{ cle: "valeur", libelle: "Valeur" }, { cle: "fraicheur", libelle: "Fraîcheur" }, { cle: "observations", libelle: "Observations" }]} valeur={critere} onChange={setCritere} />
              <SegmenteControle titre="Paliers" options={[{ cle: 3, libelle: "3" }, { cle: 4, libelle: "4" }, { cle: 5, libelle: "5" }]} valeur={paliers} onChange={setPaliers} />
            </>
          )}
        </div>
        {vue === "carte" && (
          <div className="cv-ligne-controles">
            <button className={`cv-bouton ${modeZone ? "actif" : ""}`} aria-pressed={modeZone} onClick={() => setModeZone((v) => !v)}>
              {modeZone ? "Cliquez la carte pour poser une zone" : "Ajouter une zone à surveiller"}
            </button>
            {modeZone && (
              <div className="cv-pinceau" role="group" aria-label="Niveau de la zone">
                {Object.entries(CATEGORIES).map(([cle, c]) => (
                  <button key={cle} className={`cv-puce ${pinceauZone === cle ? "on" : ""}`} title={c.libelle} onClick={() => setPinceauZone(cle)}>
                    <span className="cv-pastille" style={{ background: c.couleur }} />
                  </button>
                ))}
              </div>
            )}
            {zonesAjoutees.length > 0 && (
              <button className="cv-lien" onClick={() => setZonesAjoutees([])}>Effacer les zones ({zonesAjoutees.length})</button>
            )}
            <span className="cv-astuce">Cliquez un capteur pour le sélectionner, plusieurs pour comparer.</span>
          </div>
        )}
        <FiltreNiveaux actifs={niveaux} onBasculer={basculer} onBasculerMesure={basculerMesure} onTout={toutNiveaux} />
      </div>

      {vue === "carte" ? (
        <div className="cv-explo">
          <div className="cv-explo__carte">
            <MapContainer ref={setCarte} center={CENTRE} zoom={13} scrollWheelZoom={false} className="cv-map">
              <TileLayer key={fond} attribution={FONDS[fond].attribution} url={FONDS[fond].url} />
              {zones.map((z) => (
                <Circle key={z.id} center={z.centre} radius={z.rayon} pathOptions={{ color: couleurCategorie(z.niveau), fillColor: couleurCategorie(z.niveau), fillOpacity: 0.12, weight: 2 }}>
                  <Tooltip>{z.nom} · zone {CATEGORIES[z.niveau].libelle.toLowerCase()}</Tooltip>
                </Circle>
              ))}
              <CoucheMarqueurs lib={lib} stations={visiblesEtat} tailleDe={tailleDe} onSelectionner={basculerSelection} selection={selSet} />
            </MapContainer>
            <div className="cv-lecteur-carte">
              <LecteurTemporel pas={pas} nbPas={NB_PAS} lecture={lecture} onLecture={setLecture} onPas={setPas} libelle={JOURS[pas]} />
            </div>
          </div>

          {selectionObjets.length === 0 && (
            <aside className="cv-panneau cv-panneau--vide">Cliquez un capteur pour voir son détail. Sélectionnez-en plusieurs pour les comparer.</aside>
          )}
          {selectionObjets.length === 1 && <PanneauDetail station={selectionObjets[0]} onFermer={viderSelection} />}
          {selectionObjets.length >= 2 && <PanneauComparaison stations={selectionObjets} onRetirer={retirer} onVider={viderSelection} />}
        </div>
      ) : (
        <VueGraphique donnees={donnees} type={typeGraphe} />
      )}

      <p className="cv-compte">
        {visibles.length} stations · {selection.length} sélectionnée{selection.length > 1 ? "s" : ""} · {zones.length} zones ·{" "}
        {vue === "carte" ? `jour : ${JOURS[pas]}` : "moyenne par mesure sur 30 jours"}
      </p>

      <style>{CSS}</style>
    </div>
  );
}

const CSS = `
.cv { margin: 1.5rem 0; font-family: 'DM Sans', system-ui, sans-serif; }
.cv-map { height: 460px; width: 100%; border-radius: 14px; border: 1px solid #e0ded8; z-index: 0; }
.cv-attente { display: flex; align-items: center; justify-content: center; height: 380px; color: #9898ab; font-size: 0.9rem; background: #f5f7fa; border-radius: 14px; }
.cv-controles { margin-bottom: 12px; padding: 12px 14px; background: #f5f7fa; border: 1px solid #e8e6e1; border-radius: 12px; font-size: 0.85rem; color: #44445a; }
.cv-ligne-controles { display: flex; flex-wrap: wrap; gap: 14px 20px; align-items: center; margin-bottom: 12px; }
.cv-select { display: flex; align-items: center; gap: 6px; }
.cv-select select { font: inherit; font-size: 0.84rem; padding: 5px 8px; border: 1px solid #d8d6d0; border-radius: 8px; background: #fff; cursor: pointer; }
.cv-bouton { border: 1px solid #d8d6d0; background: #fff; color: #44445a; font: inherit; font-size: 0.84rem; font-weight: 600; padding: 7px 14px; border-radius: 9px; cursor: pointer; }
.cv-bouton:hover { background: #f5f7fa; }
.cv-bouton.actif { background: #0d9488; border-color: #0d9488; color: #fff; }
.cv-pinceau { display: inline-flex; gap: 6px; }
.cv-puce { border: 1.5px solid #e5e7eb; background: #fff; border-radius: 8px; padding: 5px; cursor: pointer; line-height: 0; }
.cv-puce.on { border-color: #134e4a; }
.cv-lien { border: 0; background: transparent; color: #0d7c70; font: inherit; font-size: 0.82rem; font-weight: 600; cursor: pointer; text-decoration: underline; }
.cv-astuce { font-size: 0.8rem; color: #9aa1ad; }
.cv-pastille { display: inline-block; width: 13px; height: 13px; border-radius: 50%; border: 2px solid #fff; box-shadow: 0 0 0 1px rgba(0,0,0,0.12); }
.cv-compte { margin: 10px 0 0; font-size: 0.82rem; color: #6b6b80; }
.cv-explo { display: flex; gap: 14px; align-items: stretch; }
.cv-explo__carte { flex: 1; min-width: 0; position: relative; }
.cv-lecteur-carte { position: absolute; left: 12px; right: 12px; bottom: 12px; z-index: 500; background: rgba(255,255,255,0.94); border: 1px solid #e0ded8; border-radius: 10px; padding: 7px 12px; box-shadow: 0 4px 16px rgba(15,23,42,0.18); }
.cv-panneau--vide { display: flex; align-items: center; width: 250px; flex-shrink: 0; background: #fff; border: 1px solid #e0ded8; border-radius: 14px; padding: 16px; font-size: 0.86rem; color: #9898ab; }
.cv-icone { background: none; border: 0; }
.cv-icone__pin { display: flex; align-items: center; justify-content: center; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 2px solid #fff; box-shadow: 0 2px 6px rgba(0,0,0,0.35); }
.cv-icone__pin--sel { border-color: #134e4a; box-shadow: 0 0 0 3px rgba(19,78,74,0.55), 0 2px 6px rgba(0,0,0,0.35); }
.cv-icone__glyphe { transform: rotate(45deg); line-height: 1; }
.cv-pop__titre { display: block; font-weight: 700; font-size: 0.95rem; margin-bottom: 4px; }
.cv-pop__ligne { display: block; font-size: 0.83rem; color: #44445a; }
@media (max-width: 820px) { .cv-explo { flex-direction: column; } .cv-panneau, .cv-panneau--vide, .cv-panneau--large { width: auto; } }
`;