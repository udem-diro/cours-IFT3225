// Construction des icônes de marqueurs. On reçoit L en paramètre (chargé côté
// client par useLeaflet) : ce module ne dépend donc pas de Leaflet à l'import.

// Icône « épingle » colorée par la catégorie, portant le glyphe du type.
export function iconeStation(L, glyphe, couleur, taille = 30) {
  const g = taille * 0.5;
  return L.divIcon({
    className: "cv-icone",
    html: `<span class="cv-icone__pin" style="background:${couleur};width:${taille}px;height:${taille}px"><span class="cv-icone__glyphe" style="font-size:${g}px">${glyphe}</span></span>`,
    iconSize: [taille, taille],
    iconAnchor: [taille / 2, taille / 2],
    popupAnchor: [0, -taille / 2],
    tooltipAnchor: [0, -taille / 2],
  });
}