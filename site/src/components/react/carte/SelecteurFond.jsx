import SegmenteControle from "./SegmenteControle.jsx";

/**
 * Fonds de carte disponibles (tuiles libres, sans clé). Le niveau 5 laisse
 * l'utilisateur choisir : un fond clair met les couleurs des marqueurs en valeur, un
 * fond sombre inverse le contraste, le fond standard donne le plus de repères.
 */
export const FONDS = {
  clair: { libelle: "Clair", url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", attribution: "&copy; OpenStreetMap, &copy; CARTO" },
  standard: { libelle: "Standard", url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", attribution: "&copy; OpenStreetMap" },
  sombre: { libelle: "Sombre", url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", attribution: "&copy; OpenStreetMap, &copy; CARTO" },
};

export default function SelecteurFond({ valeur, onChange }) {
  return (
    <SegmenteControle
      titre="Fond de carte"
      options={Object.entries(FONDS).map(([cle, f]) => ({ cle, libelle: f.libelle }))}
      valeur={valeur}
      onChange={onChange}
    />
  );
}