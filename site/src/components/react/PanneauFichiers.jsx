import { useEffect, useMemo, useState } from "react";

/**
 * PanneauFichiers.jsx
 *
 * Panneau flottant qui suit la lecture. Il observe les sections de la page
 * (marquées par <Etape id="...">) et affiche, pour la section courante :
 *
 *   - l'arborescence imbriquée des fichiers qui EXISTENT à cette étape ;
 *   - l'état de chacun (à refactorer, nouveau, modifié, allégé, inchangé) ;
 *   - son rôle, au clic sur le nom ;
 *   - son code, au clic sur l'icône de code, qui élargit le panneau. Le
 *     commentaire pédagogique est affiché au-dessus du code, hors du code,
 *     pour que celui-ci reste lisible tel qu'il serait écrit.
 *
 * Générique : réutilisable pour les six exercices, les données sont injectées.
 *
 * Usage (dans MDX) :
 *   import PanneauFichiers from "../../components/refactor/PanneauFichiers.jsx";
 *   import { projet, etapes } from "../../components/refactor/etapes-01.js";
 *   <PanneauFichiers client:visible projet={projet} etapes={etapes} titre="Exercice 1" />
 *
 * Sans dépendance, DOM pur, sûr en rendu serveur : tout l'observateur vit dans
 * un effet, donc n'est jamais exécuté côté serveur.
 */

const ETATS = {
  probleme: { libelle: "à refactorer", classe: "pf-probleme" },
  nouveau: { libelle: "nouveau", classe: "pf-nouveau" },
  modifie: { libelle: "modifié", classe: "pf-modifie" },
  allege: { libelle: "allégé", classe: "pf-allege" },
  inchange: { libelle: "inchangé", classe: "pf-inchange" }
};

/**
 * Résout l'état d'un fichier à l'étape donnée. On remonte les étapes jusqu'à
 * la dernière qui a déclaré ce fichier : un fichier jamais déclaré jusqu'ici
 * n'existe pas encore, et n'est pas affiché.
 */
function resoudre(etapes, indexEtape, chemin) {
  const courant = etapes[indexEtape].fichiers.find((f) => f.chemin === chemin);

  let code = courant?.code;
  let langage = courant?.langage;
  let role = courant?.role;
  let commentaire = courant?.commentaire;
  let existe = Boolean(courant);

  for (let i = indexEtape - 1; i >= 0; i -= 1) {
    const precedent = etapes[i].fichiers.find((f) => f.chemin === chemin);
    if (!precedent) continue;

    existe = true;
    if (code === undefined) code = precedent.code;
    if (langage === undefined) langage = precedent.langage;
    if (role === undefined) role = precedent.role;
    if (commentaire === undefined) commentaire = precedent.commentaire;
  }

  return {
    existe,
    etat: courant?.etat ?? "inchange",
    code,
    langage,
    role,
    commentaire
  };
}

/** Construit un arbre imbriqué à partir d'une liste de chemins. */
function construireArbre(chemins) {
  const racine = { nom: "", dossiers: new Map(), fichiers: [] };

  for (const chemin of chemins) {
    const segments = chemin.split("/");
    const nomFichier = segments.pop();

    let noeud = racine;
    for (const segment of segments) {
      if (!noeud.dossiers.has(segment)) {
        noeud.dossiers.set(segment, { nom: segment, dossiers: new Map(), fichiers: [] });
      }
      noeud = noeud.dossiers.get(segment);
    }

    noeud.fichiers.push({ nom: nomFichier, chemin });
  }

  return racine;
}

export default function PanneauFichiers({ projet = [], etapes = [], titre = "Structure du projet" }) {
  const [indexActif, setIndexActif] = useState(0);
  const [ouvert, setOuvert] = useState(true);
  const [fichierChoisi, setFichierChoisi] = useState(null);
  const [fichierCode, setFichierCode] = useState(null);

  const ids = useMemo(() => etapes.map((etape) => etape.id), [etapes]);

  useEffect(() => {
    if (typeof window === "undefined" || ids.length === 0) return;

    const sections = ids
      .map((id) => document.querySelector(`[data-etape="${id}"]`))
      .filter(Boolean);

    if (sections.length === 0) return;

    const observateur = new IntersectionObserver(
      (entrees) => {
        const visibles = entrees
          .filter((entree) => entree.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visibles.length === 0) return;

        const id = visibles[0].target.getAttribute("data-etape");
        const index = ids.indexOf(id);
        if (index !== -1) {
          setIndexActif(index);
          setFichierChoisi(null);
        }
      },
      { rootMargin: "-25% 0px -55% 0px", threshold: 0 }
    );

    sections.forEach((section) => observateur.observe(section));
    return () => observateur.disconnect();
  }, [ids]);

  useEffect(() => {
    if (!fichierCode) return;

    const surTouche = (evenement) => {
      if (evenement.key === "Escape") setFichierCode(null);
    };

    window.addEventListener("keydown", surTouche);
    return () => window.removeEventListener("keydown", surTouche);
  }, [fichierCode]);

  if (etapes.length === 0 || projet.length === 0) return null;

  const etape = etapes[indexActif];

  // Seuls les fichiers déjà créés à cette étape sont affichés.
  const existants = projet.filter((fichier) => resoudre(etapes, indexActif, fichier.chemin).existe);
  const arbre = construireArbre(existants.map((fichier) => fichier.chemin));

  // Le code affiché ferme sa vue si le fichier disparait de l'étape courante.
  const codeAffiche = fichierCode ? resoudre(etapes, indexActif, fichierCode) : null;
  const codeVisible = codeAffiche?.existe && codeAffiche.code ? codeAffiche : null;

  const roleProjet = (chemin) => projet.find((f) => f.chemin === chemin)?.role;

  const allerA = (index) => {
    const cible = document.querySelector(`[data-etape="${etapes[index].id}"]`);
    if (cible) cible.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const rendreNoeud = (noeud, profondeur) => (
    <>
      {[...noeud.dossiers.values()].map((sousDossier) => (
        <div key={sousDossier.nom} className="pf__branche">
          <p className="pf__dossier" style={{ paddingLeft: `${profondeur * 12}px` }}>
            {sousDossier.nom}/
          </p>
          {rendreNoeud(sousDossier, profondeur + 1)}
        </div>
      ))}

      {noeud.fichiers.map((fichier) => {
        const resolu = resoudre(etapes, indexActif, fichier.chemin);
        const etatVisuel = ETATS[resolu.etat] ?? ETATS.inchange;
        const choisi = fichierChoisi === fichier.chemin;
        const role = resolu.role ?? roleProjet(fichier.chemin);

        return (
          <div
            key={fichier.chemin}
            className="pf__item"
            style={{ paddingLeft: `${profondeur * 12}px` }}
          >
            <div className={`pf__ligne ${etatVisuel.classe} ${choisi ? "choisi" : ""}`}>
              <button
                className="pf__nom"
                onClick={() => setFichierChoisi(choisi ? null : fichier.chemin)}
                aria-expanded={choisi}
              >
                <code>{fichier.nom}</code>
                <span className="pf__badge">{etatVisuel.libelle}</span>
              </button>

              {resolu.code && (
                <button
                  className={`pf__voir ${fichierCode === fichier.chemin ? "on" : ""}`}
                  onClick={() =>
                    setFichierCode(fichierCode === fichier.chemin ? null : fichier.chemin)
                  }
                  title={`Voir le code de ${fichier.nom}`}
                  aria-label={`Voir le code de ${fichier.nom}`}
                  aria-pressed={fichierCode === fichier.chemin}
                >
                  <IconeCode />
                </button>
              )}
            </div>

            {choisi && role && <p className="pf__role">{role}</p>}
          </div>
        );
      })}
    </>
  );

  return (
    <>
      <style>{STYLE}</style>

      <aside
        className={`pf ${ouvert ? "" : "pf--replie"} ${codeVisible ? "pf--large" : ""}`}
        aria-label={titre}
      >
        <button
          className="pf__bascule"
          onClick={() => {
            setOuvert((valeur) => !valeur);
            setFichierCode(null);
          }}
          aria-expanded={ouvert}
        >
          {ouvert ? "Réduire" : "Fichiers"}
          <span className="pf__compte">
            {indexActif + 1}/{etapes.length}
          </span>
        </button>

        {ouvert && (
          <div className="pf__corps">
            <div className="pf__colonne">
              <p className="pf__titre">{titre}</p>

              <ol className="pf__jalons" aria-label="Progression">
                {etapes.map((item, index) => (
                  <li key={item.id}>
                    <button
                      className={`pf__jalon ${index === indexActif ? "on" : ""} ${index < indexActif ? "vu" : ""}`}
                      onClick={() => allerA(index)}
                      aria-current={index === indexActif ? "step" : undefined}
                      title={item.titre}
                    >
                      <span className="pf__sr">{item.titre}</span>
                    </button>
                  </li>
                ))}
              </ol>

              <p className="pf__etape">{etape.titre}</p>

              <div className="pf__arbre">{rendreNoeud(arbre, 0)}</div>

              {etape.note && <p className="pf__note">{etape.note}</p>}
            </div>

            {codeVisible && (
              <div className="pf__code">
                <div className="pf__codeEntete">
                  <code className="pf__codeChemin">{fichierCode}</code>
                  <span className={`pf__badge ${ETATS[codeVisible.etat]?.classe ?? ""}`}>
                    {ETATS[codeVisible.etat]?.libelle}
                  </span>
                  <button
                    className="pf__fermer"
                    onClick={() => setFichierCode(null)}
                    aria-label="Fermer le code"
                  >
                    ×
                  </button>
                </div>

                {codeVisible.commentaire && (
                  <p className="pf__commentaire">{codeVisible.commentaire}</p>
                )}

                <pre className="pf__pre">
                  <code>{codeVisible.code}</code>
                </pre>

                <p className="pf__codePied">
                  Le fichier à l'étape « {etape.titre} ».
                </p>
              </div>
            )}
          </div>
        )}
      </aside>
    </>
  );
}

function IconeCode() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}

const STYLE = `
.pf {
  position: fixed;
  right: 18px;
  bottom: 18px;
  z-index: 40;
  width: 310px;
  max-width: calc(100vw - 36px);
  font-size: 0.82rem;
  background: var(--pf-surface, #fff);
  border: 1px solid var(--pf-bordure, #e5e7eb);
  border-radius: 14px;
  box-shadow: 0 16px 44px rgba(15, 23, 42, 0.16);
  overflow: hidden;
  transition: width 0.18s ease;
}
.pf--large { width: 840px; }
.pf--replie { width: auto; }

.pf__bascule {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  width: 100%;
  padding: 9px 12px;
  font: inherit;
  font-weight: 600;
  color: #fff;
  background: #0d7c70;
  border: 0;
  cursor: pointer;
}
.pf__bascule:hover { background: #0f9b8e; }
.pf__compte {
  font-variant-numeric: tabular-nums;
  font-size: 0.74rem;
  padding: 1px 7px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.22);
}

.pf__corps { display: flex; align-items: stretch; }
.pf__colonne {
  flex: none;
  width: 310px;
  padding: 10px 12px 12px;
  max-height: 66vh;
  overflow-y: auto;
}
.pf--large .pf__colonne { border-right: 1px solid var(--pf-bordure, #e5e7eb); }

.pf__titre {
  margin: 0 0 8px;
  font-size: 0.72rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #9aa1ad;
}
.pf__jalons {
  display: flex;
  gap: 5px;
  list-style: none;
  margin: 0 0 10px;
  padding: 0;
}
.pf__jalon {
  width: 100%;
  height: 5px;
  min-width: 10px;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: #e5e7eb;
  cursor: pointer;
}
.pf__jalon.vu { background: #9fd8d1; }
.pf__jalon.on { background: #0d7c70; }
.pf__sr {
  position: absolute;
  width: 1px; height: 1px;
  padding: 0; margin: -1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}
.pf__etape {
  margin: 0 0 10px;
  font-weight: 700;
  color: #1a1a2e;
}

.pf__arbre {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}
.pf__branche { position: relative; }
.pf__dossier {
  margin: 6px 0 4px;
  font-size: 0.74rem;
  font-weight: 600;
  color: #6b7280;
}
.pf__dossier::before {
  content: "";
  display: inline-block;
  width: 0;
  height: 0;
  margin-right: 5px;
  border-left: 5px solid #9aa1ad;
  border-top: 3.5px solid transparent;
  border-bottom: 3.5px solid transparent;
  transform: rotate(90deg);
  vertical-align: middle;
}
.pf__item { margin-bottom: 4px; }
.pf__ligne {
  display: flex;
  align-items: stretch;
  background: #f8fafc;
  border: 1px solid #eef1f5;
  border-left: 3px solid #cbd5e1;
  border-radius: 8px;
  overflow: hidden;
}
.pf__ligne:hover { background: #f1f5f9; }
.pf__ligne.choisi { border-color: #0d7c70; }
.pf__nom {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
  padding: 6px 4px 6px 8px;
  font: inherit;
  text-align: left;
  background: none;
  border: 0;
  cursor: pointer;
}
.pf__nom code {
  font-size: 0.75rem;
  color: #1a1a2e;
  background: none;
  padding: 0;
  word-break: break-all;
}
.pf__voir {
  flex: none;
  display: grid;
  place-items: center;
  width: 30px;
  padding: 0;
  color: #64748b;
  background: none;
  border: 0;
  border-left: 1px solid #eef1f5;
  cursor: pointer;
}
.pf__voir:hover { color: #0d7c70; background: #e9f7f5; }
.pf__voir.on { color: #fff; background: #0d7c70; }

.pf__badge {
  flex: none;
  font-family: var(--pf-police, system-ui, sans-serif);
  font-size: 0.66rem;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 999px;
  color: #475569;
  background: #e2e8f0;
}
.pf-probleme { border-left-color: #dc2626; }
.pf-probleme .pf__badge { color: #991b1b; background: #fee2e2; }
.pf-nouveau { border-left-color: #16a34a; }
.pf-nouveau .pf__badge { color: #166534; background: #dcfce7; }
.pf-modifie { border-left-color: #f0a500; }
.pf-modifie .pf__badge { color: #92400e; background: #fef3c7; }
.pf-allege { border-left-color: #0d7c70; }
.pf-allege .pf__badge { color: #0d7c70; background: #e9f7f5; }
.pf-inchange { border-left-color: #cbd5e1; }

.pf__role {
  margin: 4px 0 2px 10px;
  padding-left: 8px;
  border-left: 2px solid #e9f7f5;
  font-family: var(--pf-police, system-ui, sans-serif);
  color: #6b7280;
  font-size: 0.78rem;
}
.pf__note {
  margin: 10px 0 0;
  padding: 8px 9px;
  background: #e9f7f5;
  border-radius: 8px;
  color: #0d5c54;
  font-size: 0.78rem;
}

.pf__code {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  max-height: 66vh;
}
.pf__codeEntete {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-bottom: 1px solid var(--pf-bordure, #e5e7eb);
}
.pf__codeChemin {
  flex: 1;
  min-width: 0;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.75rem;
  font-weight: 600;
  color: #1a1a2e;
  background: none;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.pf__fermer {
  flex: none;
  width: 24px; height: 24px;
  font: inherit;
  font-size: 1.1rem;
  line-height: 1;
  color: #64748b;
  background: none;
  border: 1px solid #e5e7eb;
  border-radius: 7px;
  cursor: pointer;
}
.pf__fermer:hover { color: #dc2626; border-color: #dc2626; }

.pf__commentaire {
  margin: 0;
  padding: 9px 12px;
  background: #e9f7f5;
  border-bottom: 1px solid var(--pf-bordure, #e5e7eb);
  color: #0d5c54;
  font-size: 0.79rem;
  line-height: 1.5;
}

.pf__pre {
  flex: 1;
  margin: 0;
  padding: 10px 12px;
  overflow: auto;
  background: #f8fafc;
  font-size: 0.75rem;
  line-height: 1.55;
}
.pf__pre code {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  color: #1a1a2e;
  background: none;
  white-space: pre;
}
.pf__codePied {
  margin: 0;
  padding: 6px 10px;
  border-top: 1px solid var(--pf-bordure, #e5e7eb);
  color: #9aa1ad;
  font-size: 0.72rem;
}

[data-theme="dark"] .pf {
  --pf-surface: #161b25;
  --pf-bordure: #2a3142;
}
[data-theme="dark"] .pf__etape,
[data-theme="dark"] .pf__nom code,
[data-theme="dark"] .pf__codeChemin,
[data-theme="dark"] .pf__pre code { color: #e8e8f0; }
[data-theme="dark"] .pf__ligne {
  background: #1c2230;
  border-color: #2a3142;
}
[data-theme="dark"] .pf__ligne:hover { background: #222a3a; }
[data-theme="dark"] .pf__voir { border-left-color: #2a3142; }
[data-theme="dark"] .pf__jalon { background: #2a3142; }
[data-theme="dark"] .pf__note,
[data-theme="dark"] .pf__commentaire { background: #10241f; color: #7fdccf; }
[data-theme="dark"] .pf__pre { background: #10141c; }

@media (max-width: 1360px) {
  .pf--large { width: calc(100vw - 36px); }
}

@media (max-width: 900px) {
  .pf { right: 12px; bottom: 12px; width: 270px; }
  .pf__corps { flex-direction: column; }
  .pf__colonne { width: 100%; max-height: 42vh; }
  .pf--large .pf__colonne { border-right: 0; border-bottom: 1px solid var(--pf-bordure, #e5e7eb); }
  .pf__code { max-height: 42vh; }
}

@media (prefers-reduced-motion: reduce) {
  .pf { transition: none; }
}
`;