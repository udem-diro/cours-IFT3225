import { useState, useEffect, useMemo, createContext, useContext } from "react";
import { Sun, Moon, Monitor, Type, Bus } from "lucide-react";

/**
 * PreferencesPanel : île de démonstration pour la note « S'adapter à l'utilisateur ».
 * Montre, en isolé, l'adaptation comme un SERVICE PARTAGÉ par contexte :
 *   - un contexte de préférences (thème, taille du texte, niveau de guidage) ;
 *   - une valeur par défaut du THÈME issue des préférences système (prefers-color-scheme) ;
 *   - une persistance qui ne mémorise QUE les choix explicites (jamais une valeur
 *     héritée du système) ;
 *   - un aperçu qui consomme le contexte et se redessine quand un choix change.
 * Le thème est appliqué à l'aperçu seulement (classe locale), pour ne pas toucher au
 * thème global du site.
 */

const CLE = "bus-en-vue:apparence-demo:v1";

// Seul le thème est lu dans les préférences système ; la taille du texte et le
// guidage sont des réglages propres à l'application.
function lireThemeSysteme() {
  if (typeof window === "undefined" || !window.matchMedia) return "clair";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "sombre" : "clair";
}

const DEFAUTS = { taille: "normale", niveau: "standard" };

// On ne lit dans le stockage QUE les choix explicites de l'utilisateur.
function lireChoix() {
  if (typeof window === "undefined") return {};
  try {
    const brut = window.localStorage.getItem(CLE);
    return brut ? JSON.parse(brut) : {};
  } catch {
    return {};
  }
}

const PreferencesContext = createContext(null);
function usePreferences() {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error("usePreferences doit être utilisé dans <FournisseurPreferences>.");
  return ctx;
}

function FournisseurPreferences({ children }) {
  // On ne stocke que les choix explicites, jamais le thème hérité du système.
  const [choix, setChoix] = useState(lireChoix);
  const [themeSysteme] = useState(lireThemeSysteme);

  useEffect(() => {
    try {
      window.localStorage.setItem(CLE, JSON.stringify(choix));
    } catch {
      // stockage indisponible : les choix restent en mémoire
    }
  }, [choix]);

  const preferences = { theme: themeSysteme, ...DEFAUTS, ...choix };
  const definir = (cle, valeur) => setChoix((prev) => ({ ...prev, [cle]: valeur }));
  const reinitialiser = () => setChoix({});

  return (
    <PreferencesContext.Provider value={{ preferences, definir, reinitialiser }}>
      {children}
    </PreferencesContext.Provider>
  );
}

function Groupe({ etiquette, icone, children }) {
  return (
    <div className="pp-groupe">
      <span className="pp-lbl">{icone} {etiquette}</span>
      <div className="pp-opts">{children}</div>
    </div>
  );
}

function Option({ champ, valeur, children }) {
  const { preferences, definir } = usePreferences();
  const actif = preferences[champ] === valeur;
  return (
    <button className={`pp-opt ${actif ? "on" : ""}`} aria-pressed={actif} onClick={() => definir(champ, valeur)}>
      {children}
    </button>
  );
}

function Controles() {
  const { reinitialiser } = usePreferences();
  return (
    <div className="pp-controles">
      <Groupe etiquette="Thème" icone={<Monitor size={14} />}>
        <Option champ="theme" valeur="clair"><Sun size={13} /> Clair</Option>
        <Option champ="theme" valeur="sombre"><Moon size={13} /> Sombre</Option>
      </Groupe>
      <Groupe etiquette="Taille du texte" icone={<Type size={14} />}>
        <Option champ="taille" valeur="normale">Normale</Option>
        <Option champ="taille" valeur="grande">Grande</Option>
        <Option champ="taille" valeur="tres-grande">Très grande</Option>
      </Groupe>
      <Groupe etiquette="Guidage" icone={<Bus size={14} />}>
        <Option champ="niveau" valeur="standard">Standard</Option>
        <Option champ="niveau" valeur="guide">Guidé</Option>
      </Groupe>
      <button className="pp-reset" onClick={reinitialiser}>Revenir aux préférences système</button>
    </div>
  );
}

const ECHELLE = { normale: 1, grande: 1.15, "tres-grande": 1.32 };

function Apercu() {
  const { preferences } = usePreferences();
  const { theme, taille, niveau } = preferences;
  const guide = niveau === "guide";
  const style = { fontSize: `${ECHELLE[taille] ?? 1}rem` };

  return (
    <div className={`pp-apercu pp-theme-${theme}`} style={style}>
      <div className="pp-carte">
        <div className="pp-carte__hd"><Bus size={18} /> <span>Bus en vue</span></div>
        {guide && <p className="pp-aide">Choisissez une ligne, puis touchez le grand bouton pour signaler son arrivée.</p>}
        <div className="pp-lignes">
          {["11", "15", "80"].map((l) => (
            <button key={l} className={`pp-ligne ${guide ? "grand" : ""}`}>{guide ? `Ligne ${l}` : l}</button>
          ))}
        </div>
        <button className={`pp-cta ${guide ? "grand" : ""}`}>Signaler l'arrivée</button>
      </div>
    </div>
  );
}

export default function PreferencesPanel() {
  return (
    <FournisseurPreferences>
      <div className="pp">
        <Controles />
        <Apercu />
      </div>
    </FournisseurPreferences>
  );
}

const CSS = `
.pp{font-family:'DM Sans',system-ui,sans-serif;display:grid;grid-template-columns:1fr;gap:16px;
  max-width:760px;margin:1.5rem auto;color:#1a1a2e}
.pp *{box-sizing:border-box}
.pp-controles{display:flex;flex-direction:column;gap:13px;background:#fff;border:1px solid #e2e0db;
  border-radius:16px;padding:16px}
.pp-groupe{display:flex;flex-direction:column;gap:7px}
.pp-lbl{display:flex;align-items:center;gap:6px;font-size:.66rem;font-weight:700;text-transform:uppercase;
  letter-spacing:.05em;color:#9aa1ad}
.pp-opts{display:flex;gap:7px;flex-wrap:wrap}
.pp-opt{display:flex;align-items:center;gap:5px;border:1.5px solid #e5e7eb;background:#fff;color:#1a1a2e;
  font:inherit;font-size:.84rem;font-weight:600;padding:7px 13px;border-radius:10px;cursor:pointer}
.pp-opt:hover{border-color:#9fd8d1}
.pp-opt.on{border-color:#0d9488;background:#0d9488;color:#fff}
.pp-reset{align-self:flex-start;border:0;background:transparent;color:#0d7c70;font:inherit;font-size:.82rem;
  font-weight:600;cursor:pointer;padding:4px 0;text-decoration:underline}
.pp-apercu{border-radius:16px;padding:18px;border:1px solid #e2e0db}
.pp-theme-clair{background:#f5f7fa;color:#1a1a2e}
.pp-theme-sombre{background:#0e1117;color:#e8e8f0;border-color:#2a3142}
.pp-carte{border-radius:14px;padding:16px;border:1px solid currentColor;border-color:rgba(128,138,154,.25)}
.pp-theme-clair .pp-carte{background:#fff}
.pp-theme-sombre .pp-carte{background:#161b25}
.pp-carte__hd{display:flex;align-items:center;gap:8px;font-family:'Fraunces',serif;font-weight:600;
  font-size:1.15em;margin-bottom:10px;color:#0d9488}
.pp-aide{margin:0 0 10px;font-size:.82em;line-height:1.5;background:rgba(13,148,136,.1);color:#0d7c70;
  padding:8px 10px;border-radius:9px}
.pp-theme-sombre .pp-aide{color:#5eead4}
.pp-lignes{display:flex;gap:8px;margin-bottom:12px}
.pp-ligne{min-width:38px;border:1.5px solid rgba(128,138,154,.4);background:transparent;color:inherit;
  font:inherit;font-weight:700;font-size:.9em;padding:7px 10px;border-radius:10px;cursor:pointer}
.pp-ligne.grand{padding:11px 16px;font-size:1em}
.pp-cta{width:100%;border:0;background:linear-gradient(135deg,#0f9b8e,#0d7c70);color:#fff;font:inherit;
  font-weight:700;font-size:.95em;padding:11px;border-radius:11px;cursor:pointer}
.pp-cta.grand{padding:15px;font-size:1.1em}

@media (min-width:640px){ .pp{grid-template-columns:1fr 1fr;align-items:start} }
`;

if (typeof document !== "undefined" && !document.getElementById("pp-style")) {
  const el = document.createElement("style");
  el.id = "pp-style";
  el.textContent = CSS;
  document.head.appendChild(el);
}