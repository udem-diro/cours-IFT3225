import { useLeaflet } from "./useLeaflet.js";
import { iconeStation } from "./marqueurs.js";
import LegendeTypes from "./LegendeTypes.jsx";
import { STATIONS, TYPES, CENTRE, couleurCategorie, niveauLibelle, uniteDe } from "./carteDonnees.js";

/**
 * Niveau 1 — carte statique enrichie : localiser et informer.
 * 48 stations typées, marquées par une icône (glyphe du type, couleur de la
 * catégorie), regroupées en clusters quand elles se chevauchent. Un survol donne
 * le nom, un clic ouvre un portrait. Aucun réglage : on lit la carte.
 * Les icônes sont des divIcon construits avec L (fourni par useLeaflet).
 */
export default function CarteStatique() {
  const lib = useLeaflet();

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
      <MapContainer center={CENTRE} zoom={13} scrollWheelZoom={false} className="cv-map">
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MarkerClusterGroup chunkedLoading maxClusterRadius={50}>
          {STATIONS.map((st) => (
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

      <LegendeTypes />

      <style>{CSS}</style>
    </div>
  );
}

const CSS = `
.cv { margin: 1.5rem 0; font-family: 'DM Sans', system-ui, sans-serif; }
.cv-map { height: 420px; width: 100%; border-radius: 14px; border: 1px solid #e0ded8; z-index: 0; }
.cv-attente { display: flex; align-items: center; justify-content: center; color: #9898ab; font-size: 0.9rem; background: #f5f7fa; }
.cv-icone { background: none; border: 0; }
.cv-icone__pin { display: flex; align-items: center; justify-content: center; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 2px solid #fff; box-shadow: 0 2px 6px rgba(0,0,0,0.35); }
.cv-icone__glyphe { transform: rotate(45deg); line-height: 1; }
.cv-pop__titre { display: block; font-weight: 700; font-size: 0.95rem; margin-bottom: 4px; }
.cv-pop__ligne { display: block; font-size: 0.83rem; color: #44445a; }
`;