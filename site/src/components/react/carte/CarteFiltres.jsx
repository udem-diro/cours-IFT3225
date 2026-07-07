import { useState } from "react";
import { useLeaflet } from "./useLeaflet.js";
import { iconeStation } from "./marqueurs.js";
import RechercheAuto from "./RechercheAuto.jsx";
import FiltreNiveaux, { NIVEAUX } from "./FiltreNiveaux.jsx";
import Curseur from "./Curseur.jsx";
import { STATIONS, TYPES, QUARTIERS, CENTRE, couleurCategorie, niveauLibelle, uniteDe } from "./carteDonnees.js";

/**
 * Niveau 2 — cumulatif : tout le niveau 1, plus des filtres ET une recherche.
 * Le filtre principal est le couple (mesure, niveau) : chaque niveau nommé de chaque
 * mesure est une puce cliquable (widget FiltreNiveaux, qui sert aussi de légende).
 * S'y ajoutent un filtre par quartier, une valeur minimale, et une recherche à
 * auto-complétion dont les suggestions respectent les filtres actifs.
 */
function niveauxTous() {
  const o = {};
  for (const type of Object.keys(TYPES)) for (const n of NIVEAUX) o[`${type}:${n}`] = true;
  return o;
}

export default function CarteFiltres() {
  const lib = useLeaflet();
  const [recherche, setRecherche] = useState("");
  const [niveaux, setNiveaux] = useState(niveauxTous);
  const [quartier, setQuartier] = useState("tous");
  const [seuil, setSeuil] = useState(0);
  const [carte, setCarte] = useState(null);

  const basculer = (cle) => setNiveaux((p) => ({ ...p, [cle]: !p[cle] }));
  const basculerMesure = (type) =>
    setNiveaux((p) => {
      const actif = NIVEAUX.some((n) => p[`${type}:${n}`]);
      const suivant = { ...p };
      NIVEAUX.forEach((n) => (suivant[`${type}:${n}`] = !actif));
      return suivant;
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

  if (!lib) {
    return (
      <div className="cv">
        <div className="cv-map cv-attente">Chargement de la carte…</div>
        <style>{CSS}</style>
      </div>
    );
  }

  const { MapContainer, TileLayer, Marker, Tooltip, Popup, MarkerClusterGroup, L } = lib;

  return (
    <div className="cv">
      <div className="cv-controles">
        <div className="cv-ligne-controles">
          <RechercheAuto
            valeur={recherche}
            onChange={setRecherche}
            onSelectionner={selectionner}
            suggestions={suggestions}
            placeholder="Nom d'un capteur ou quartier..."
          />
          <label className="cv-select">
            Quartier :
            <select value={quartier} onChange={(e) => setQuartier(e.target.value)}>
              <option value="tous">Tous</option>
              {QUARTIERS.map((qz) => (
                <option key={qz} value={qz}>{qz}</option>
              ))}
            </select>
          </label>
          <Curseur libelle="Valeur min" valeur={seuil} onChange={setSeuil} />
        </div>
        <FiltreNiveaux actifs={niveaux} onBasculer={basculer} onBasculerMesure={basculerMesure} />
      </div>

      <MapContainer ref={setCarte} center={CENTRE} zoom={13} scrollWheelZoom={false} className="cv-map">
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MarkerClusterGroup chunkedLoading maxClusterRadius={50}>
          {visibles.map((st) => (
            <Marker
              key={st.id}
              position={st.position}
              icon={iconeStation(L, TYPES[st.type].glyphe, couleurCategorie(st.categorie))}
            >
              <Tooltip>{st.nom}</Tooltip>
              <Popup>
                <span className="cv-pop__titre">{st.nom}</span>
                <span className="cv-pop__ligne">{TYPES[st.type].libelle} · {st.quartier}</span>
                <span className="cv-pop__ligne">{niveauLibelle(st.type, st.categorie)} · {st.valeur} {uniteDe(st.type)}</span>
                <span className="cv-pop__ligne">Tendance : {st.tendance} · fiabilité {st.fiabilite}%</span>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>

      <p className="cv-compte">{visibles.length} stations affichées sur {STATIONS.length}</p>

      <style>{CSS}</style>
    </div>
  );
}

const CSS = `
.cv { margin: 1.5rem 0; font-family: 'DM Sans', system-ui, sans-serif; }
.cv-map { height: 420px; width: 100%; border-radius: 14px; border: 1px solid #e0ded8; z-index: 0; }
.cv-attente { display: flex; align-items: center; justify-content: center; color: #9898ab; font-size: 0.9rem; background: #f5f7fa; }
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