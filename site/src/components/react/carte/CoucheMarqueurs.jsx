import { iconeStation } from "./marqueurs.js";
import { TYPES, couleurCategorie, niveauLibelle, uniteDe } from "./carteDonnees.js";

/**
 * Couche de marqueurs réutilisable : clusters + icônes + portrait. `lib` vient de
 * useLeaflet. `tailleDe(st)` donne une taille d'icône optionnelle.
 * Si `onSelectionner` est fourni, le clic sélectionne la station (au lieu d'ouvrir un
 * popup) et `selection` (un Set d'identifiants) met les stations retenues en évidence.
 */
export default function CoucheMarqueurs({ lib, stations, tailleDe, onSelectionner, selection }) {
  const { Marker, Tooltip, Popup, MarkerClusterGroup, L } = lib;
  const estSel = (id) => (selection ? selection.has(id) : false);
  return (
    <MarkerClusterGroup chunkedLoading maxClusterRadius={50}>
      {stations.map((st) => (
        <Marker
          key={st.id}
          position={st.position}
          icon={iconeStation(L, TYPES[st.type].glyphe, couleurCategorie(st.categorie), tailleDe ? tailleDe(st) : 30, estSel(st.id))}
          eventHandlers={onSelectionner ? { click: () => onSelectionner(st) } : undefined}
        >
          <Tooltip>{st.nom}</Tooltip>
          {!onSelectionner && (
            <Popup>
              <span className="cv-pop__titre">{st.nom}</span>
              <span className="cv-pop__ligne">{TYPES[st.type].libelle} · {st.quartier}</span>
              <span className="cv-pop__ligne">{niveauLibelle(st.type, st.categorie)} · {st.valeur} {uniteDe(st.type)}</span>
              <span className="cv-pop__ligne">Tendance : {st.tendance} · fiabilité {st.fiabilite}%</span>
            </Popup>
          )}
        </Marker>
      ))}
    </MarkerClusterGroup>
  );
}