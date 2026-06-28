import { useState, useEffect, useMemo, createContext, useContext } from "react";
import {
  MemoryRouter,
  Routes,
  Route,
  NavLink,
  Link,
  useParams,
  useNavigate,
} from "react-router-dom";
import { Bus, MapPin, Search, Send, Check, X, Star, ThumbsUp, ThumbsDown, Settings } from "lucide-react";
import i18next from "i18next";
import { initReactI18next, I18nextProvider, useTranslation } from "react-i18next";

/**
 * BusSignalApp : application Signalement de bus de la note « applications
 * complexes », enrichie en trois étapes :
 *   - React Router (MemoryRouter) : vues routées Signaler, Rechercher, Mes arrêts,
 *     plus le détail /arret/:arretId ; mise en page responsive ; favoris ; pouce haut/bas ;
 *   - React Context : état partagé (signalements, favoris, votes) fourni par
 *     FournisseurApp et lu via le hook useApp ;
 *   - react-i18next : libellés externalisés (FR/EN), instance propre à l'île ;
 *   - préférences utilisateur : un FournisseurPreferences (langue, thème, taille,
 *     animations, niveau de guidage) persisté, avec défauts système ; un panneau de
 *     réglages (engrenage) dans l'en-tête. Le thème est appliqué au conteneur de
 *     l'app (data-theme local), pas au document, car l'app est embarquée dans une note.
 */

const ARRETS = [
  { id: "a1", nom: "Mont-Royal / Saint-Denis", lignes: ["11", "361"] },
  { id: "a2", nom: "Berri-UQAM", lignes: ["15", "30", "747"] },
  { id: "a3", nom: "Parc / Beaubien", lignes: ["80", "129"] },
];

let SEQ = 0;
const uid = () => `s${(SEQ += 1)}`;

function seed(now) {
  return [
    { id: uid(), arretId: "a1", ligne: "11", delai: 3, t: now - 22000, up: 2, down: 0, monVote: null },
    { id: uid(), arretId: "a1", ligne: "361", delai: 7, t: now - 68000, up: 0, down: 1, monVote: null },
    { id: uid(), arretId: "a2", ligne: "747", delai: 2, t: now - 9000, up: 4, down: 0, monVote: null },
    { id: uid(), arretId: "a3", ligne: "80", delai: 4, t: now - 40000, up: 1, down: 0, monVote: null },
    { id: uid(), arretId: "a2", ligne: "15", delai: 6, t: now - 120000, up: 0, down: 0, monVote: null },
  ];
}

const nomArret = (id) => ARRETS.find((a) => a.id === id)?.nom ?? "";
const lignesDe = (id) => ARRETS.find((a) => a.id === id)?.lignes ?? [];
function age(ms) {
  const s = Math.max(0, Math.round(ms / 1000));
  return s < 60 ? `${s} s` : `${Math.round(s / 60)} min`;
}

// --- Langue : i18next est la SOURCE DE VÉRITÉ de la langue active ---
const CLE_LANGUE = "bus-en-vue:langue:v1";

// Langue de traduction au démarrage : choix explicite mémorisé, sinon langue
// détectée du navigateur, sinon français. La langue détectée n'est PAS mémorisée
// tant que l'utilisateur n'a pas fait de choix.
function langueInitiale() {
  if (typeof window === "undefined") return "fr";
  try {
    const choisie = window.localStorage.getItem(CLE_LANGUE);
    if (choisie) return choisie;
  } catch {
    // stockage indisponible
  }
  const detectee = (window.navigator.language ?? "fr").slice(0, 2);
  return detectee === "en" ? "en" : "fr";
}

// La LOCALE (formatage, attribut lang) est distincte de la langue de traduction :
// la langue choisit les textes (fr / en), la locale précise la région (fr-CA / en-CA).
const LOCALES = { fr: "fr-CA", en: "en-CA" };
const localeDe = (langue) => LOCALES[langue] ?? "fr-CA";

// --- i18n propre à l'île (instance isolée, pas l'instance globale) ---
const i18n = i18next.createInstance();
i18n.use(initReactI18next).init({
  lng: langueInitiale(),
  fallbackLng: "fr",
  interpolation: { escapeValue: false },
  resources: {
    fr: { translation: {
      brand: "Bus en vue",
      sous_titre: "L'arrivée des autobus, entre usagers",
      nav_signaler: "Signaler",
      nav_rechercher: "Rechercher",
      nav_mes_arrets: "Mes arrêts",
      lbl_arret: "Arrêt",
      lbl_ligne: "Ligne",
      lbl_arrive_dans: "Arrive dans",
      cta_signaler: "Signaler l'arrivée",
      toast_envoye: "Signalement envoyé, merci",
      sec_recents: "Récents à cet arrêt",
      vide_premier: "Aucun signalement. Soyez le premier.",
      row_arrive: "arrive dans ~{{delai}} min",
      il_y_a: "il y a {{age}}",
      search_ph: "Numéro de ligne (ex. 11)",
      search_aria: "Rechercher une ligne",
      effacer: "Effacer",
      chip_ligne: "Ligne {{ligne}}",
      sec_tous: "Tous les signalements récents",
      vide_ligne: "Aucun signalement pour cette ligne.",
      vide_favoris: "Aucun arrêt favori. Touchez l'étoile d'un arrêt pour l'ajouter.",
      detail: "Détail",
      vide_recent: "Aucun signalement récent.",
      retour: "Retour",
      vide_arret: "Aucun signalement à cet arrêt.",
      vote_utile: "Utile",
      vote_pas_utile: "Pas utile",
      fav_retirer: "Retirer des favoris",
      fav_ajouter: "Ajouter aux favoris",
      reglages: "Réglages",
      pref_langue: "Langue",
      pref_theme: "Thème",
      theme_clair: "Clair",
      theme_sombre: "Sombre",
      pref_taille: "Taille du texte",
      taille_normale: "Normale",
      taille_grande: "Grande",
      taille_tres_grande: "Très grande",
      pref_guidage: "Guidage",
      guidage_standard: "Standard",
      guidage_guide: "Guidé",
      pref_systeme: "Revenir aux préférences système",
      aide_signaler: "Choisissez un arrêt et une ligne, puis touchez le grand bouton pour signaler l'arrivée.",
    } },
    en: { translation: {
      brand: "Bus in sight",
      sous_titre: "Bus arrivals, shared by riders",
      nav_signaler: "Report",
      nav_rechercher: "Search",
      nav_mes_arrets: "My stops",
      lbl_arret: "Stop",
      lbl_ligne: "Line",
      lbl_arrive_dans: "Arriving in",
      cta_signaler: "Report the arrival",
      toast_envoye: "Report sent, thanks",
      sec_recents: "Recent at this stop",
      vide_premier: "No reports yet. Be the first.",
      row_arrive: "arriving in ~{{delai}} min",
      il_y_a: "{{age}} ago",
      search_ph: "Line number (e.g. 11)",
      search_aria: "Search a line",
      effacer: "Clear",
      chip_ligne: "Line {{ligne}}",
      sec_tous: "All recent reports",
      vide_ligne: "No reports for this line.",
      vide_favoris: "No favorite stops. Tap a stop's star to add it.",
      detail: "Details",
      vide_recent: "No recent reports.",
      retour: "Back",
      vide_arret: "No reports at this stop.",
      vote_utile: "Helpful",
      vote_pas_utile: "Not helpful",
      fav_retirer: "Remove from favorites",
      fav_ajouter: "Add to favorites",
      reglages: "Settings",
      pref_langue: "Language",
      pref_theme: "Theme",
      theme_clair: "Light",
      theme_sombre: "Dark",
      pref_taille: "Text size",
      taille_normale: "Normal",
      taille_grande: "Large",
      taille_tres_grande: "Extra large",
      pref_guidage: "Guidance",
      guidage_standard: "Standard",
      guidage_guide: "Guided",
      pref_systeme: "Back to system preferences",
      aide_signaler: "Pick a stop and a line, then tap the large button to report the arrival.",
    } },
  },
});

// Changer la langue ET mémoriser ce choix explicite (i18next reste la source de vérité).
function changerLangue(langue) {
  i18n.changeLanguage(langue);
  try {
    window.localStorage.setItem(CLE_LANGUE, langue);
  } catch {
    // stockage indisponible
  }
}

// État partagé de l'application, fourni par React Context.
const AppContext = createContext(null);
function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp doit être utilisé dans <FournisseurApp>.");
  return ctx;
}

// --- Préférences d'apparence : un service partagé par contexte ---
// (la langue n'est PAS ici : sa source de vérité est i18next, voir plus haut.)
const CLE_PREFS = "bus-en-vue:apparence:v1";

// Seul le thème est lu dans les préférences système. La taille du texte et le
// guidage sont des réglages propres à l'application, jamais déduits du système.
function lireThemeSysteme() {
  if (typeof window === "undefined" || !window.matchMedia) return "clair";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "sombre" : "clair";
}

const DEFAUTS_APP = { taille: "normale", niveau: "standard" };

// On ne lit dans le stockage QUE les choix explicites de l'utilisateur.
function lireChoix() {
  if (typeof window === "undefined") return {};
  try {
    const brut = window.localStorage.getItem(CLE_PREFS);
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
  // On ne stocke QUE les choix explicites, jamais les valeurs héritées du système
  // (le thème système reste un défaut, pas un choix).
  const [choix, setChoix] = useState(lireChoix);
  const [themeSysteme] = useState(lireThemeSysteme);

  useEffect(() => {
    try {
      window.localStorage.setItem(CLE_PREFS, JSON.stringify(choix));
    } catch {
      // stockage indisponible : les choix restent en mémoire
    }
  }, [choix]);

  const preferences = { theme: themeSysteme, ...DEFAUTS_APP, ...choix };
  const definir = (cle, valeur) => setChoix((prev) => ({ ...prev, [cle]: valeur }));
  const reinitialiser = () => setChoix({}); // efface les choix : retour aux défauts et au thème système

  return (
    <PreferencesContext.Provider value={{ preferences, definir, reinitialiser }}>
      {children}
    </PreferencesContext.Provider>
  );
}

function Vote({ s }) {
  const { voter } = useApp();
  const { t } = useTranslation();
  return (
    <span className="ba-vote">
      <button
        className={`ba-vote__btn ${s.monVote === "up" ? "on-up" : ""}`}
        aria-pressed={s.monVote === "up"}
        aria-label={t("vote_utile")}
        onClick={() => voter(s.id, "up")}
      >
        <ThumbsUp size={13} /> {s.up}
      </button>
      <button
        className={`ba-vote__btn ${s.monVote === "down" ? "on-down" : ""}`}
        aria-pressed={s.monVote === "down"}
        aria-label={t("vote_pas_utile")}
        onClick={() => voter(s.id, "down")}
      >
        <ThumbsDown size={13} /> {s.down}
      </button>
    </span>
  );
}

function Signalement({ s, montrerArret = false }) {
  const { now } = useApp();
  const { t } = useTranslation();
  return (
    <li className={`ba-row ${now - s.t >= 60000 ? "old" : ""}`}>
      <span className="ba-badge">{s.ligne}</span>
      <span className="ba-row__main">
        {montrerArret ? (
          <><MapPin size={11} /> {nomArret(s.arretId)}</>
        ) : (
          <>{t("row_arrive", { delai: s.delai })}</>
        )}
      </span>
      <span className="ba-row__age">{t("il_y_a", { age: age(now - s.t) })}</span>
      <Vote s={s} />
    </li>
  );
}

function EtoileFavori({ arretId }) {
  const { favoris, basculerFavori } = useApp();
  const { t } = useTranslation();
  const actif = favoris.includes(arretId);
  return (
    <button
      className={`ba-fav ${actif ? "on" : ""}`}
      aria-pressed={actif}
      aria-label={actif ? t("fav_retirer") : t("fav_ajouter")}
      onClick={() => basculerFavori(arretId)}
    >
      <Star size={15} fill={actif ? "currentColor" : "none"} />
    </button>
  );
}

function VueSignaler() {
  const { signalements, signaler } = useApp();
  const { preferences } = usePreferences();
  const { t } = useTranslation();
  const guide = preferences.niveau === "guide";
  const [arretId, setArretId] = useState("a1");
  const [ligne, setLigne] = useState("11");
  const [delai, setDelai] = useState(3);
  const [envoye, setEnvoye] = useState(false);

  useEffect(() => {
    setLigne(lignesDe(arretId)[0]);
  }, [arretId]);

  const recents = useMemo(
    () => signalements.filter((s) => s.arretId === arretId).sort((a, b) => b.t - a.t),
    [signalements, arretId]
  );

  function envoyer() {
    signaler({ arretId, ligne, delai });
    setEnvoye(true);
    setTimeout(() => setEnvoye(false), 1900);
  }

  return (
    <div className="ba-cols">
      <div className="ba-col">
        <div className="ba-card">
          <span className="ba-lbl"><MapPin size={13} /> {t("lbl_arret")}</span>
          <div className="ba-stops">
            {ARRETS.map((a) => (
              <div key={a.id} className={`ba-stop-row ${a.id === arretId ? "on" : ""}`}>
                <button className="ba-stop" aria-pressed={a.id === arretId} onClick={() => setArretId(a.id)}>
                  {a.nom}
                </button>
                <EtoileFavori arretId={a.id} />
              </div>
            ))}
          </div>
        </div>

        <div className="ba-card">
          <span className="ba-lbl">{t("lbl_ligne")}</span>
          <div className="ba-chips">
            {lignesDe(arretId).map((l) => (
              <button key={l} className={`ba-chip ${l === ligne ? "on" : ""}`} aria-pressed={l === ligne} onClick={() => setLigne(l)}>{l}</button>
            ))}
          </div>
          <span className="ba-lbl mt">{t("lbl_arrive_dans")}</span>
          <div className="ba-chips">
            {[2, 3, 5, 10].map((d) => (
              <button key={d} className={`ba-chip ${d === delai ? "on" : ""}`} aria-pressed={d === delai} onClick={() => setDelai(d)}>{d} min</button>
            ))}
          </div>
        </div>

        {guide && <p className="ba-aide">{t("aide_signaler")}</p>}
        <button className={`ba-cta ${guide ? "grand" : ""}`} onClick={envoyer}><Send size={16} /> {t("cta_signaler")}</button>
        {envoye && <div className="ba-toast" role="status"><Check size={14} /> {t("toast_envoye")}</div>}
      </div>

      <div className="ba-col">
        <div className="ba-sec">{t("sec_recents")}</div>
        {recents.length === 0 ? (
          <p className="ba-empty">{t("vide_premier")}</p>
        ) : (
          <ul className="ba-list">
            {recents.map((s) => <Signalement key={s.id} s={s} />)}
          </ul>
        )}
      </div>
    </div>
  );
}

function VueRechercher() {
  const { signalements } = useApp();
  const { t } = useTranslation();
  const [requete, setRequete] = useState("");

  const lignesConnues = useMemo(
    () => [...new Set(signalements.map((s) => s.ligne))].sort((a, b) => Number(a) - Number(b)),
    [signalements]
  );
  const resultats = useMemo(() => {
    const base = [...signalements].sort((a, b) => b.t - a.t);
    const q = requete.trim();
    return q === "" ? base : base.filter((s) => s.ligne.startsWith(q));
  }, [signalements, requete]);

  return (
    <div className="ba-col">
      <div className="ba-search">
        <Search size={16} />
        <input className="ba-search__input" value={requete} onChange={(e) => setRequete(e.target.value)} inputMode="numeric" placeholder={t("search_ph")} aria-label={t("search_aria")} />
        {requete && <button className="ba-search__clear" aria-label={t("effacer")} onClick={() => setRequete("")}><X size={15} /></button>}
      </div>

      <div className="ba-chips wrap">
        {lignesConnues.map((l) => (
          <button key={l} className={`ba-chip ${requete === l ? "on" : ""}`} aria-pressed={requete === l} onClick={() => setRequete(requete === l ? "" : l)}>{t("chip_ligne", { ligne: l })}</button>
        ))}
      </div>

      <div className="ba-sec">{requete ? t("chip_ligne", { ligne: requete }) : t("sec_tous")}</div>
      {resultats.length === 0 ? (
        <p className="ba-empty">{t("vide_ligne")}</p>
      ) : (
        <ul className="ba-list">
          {resultats.map((s) => <Signalement key={s.id} s={s} montrerArret />)}
        </ul>
      )}
    </div>
  );
}

function VueMesArrets() {
  const { favoris, signalements } = useApp();
  const { t } = useTranslation();

  if (favoris.length === 0) {
    return <p className="ba-empty">{t("vide_favoris")}</p>;
  }

  return (
    <div className="ba-col">
      {favoris.map((id) => {
        const liste = signalements.filter((s) => s.arretId === id).sort((a, b) => b.t - a.t);
        return (
          <div className="ba-card" key={id}>
            <div className="ba-card__hd">
              <span className="ba-lbl"><MapPin size={13} /> {nomArret(id)}</span>
              <Link className="ba-lien" to={`/arret/${id}`}>{t("detail")}</Link>
            </div>
            {liste.length === 0 ? (
              <p className="ba-empty">{t("vide_recent")}</p>
            ) : (
              <ul className="ba-list">
                {liste.slice(0, 3).map((s) => <Signalement key={s.id} s={s} />)}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}

function VueArret() {
  const { arretId } = useParams();
  const { signalements } = useApp();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const liste = signalements.filter((s) => s.arretId === arretId).sort((a, b) => b.t - a.t);

  return (
    <div className="ba-col">
      <div className="ba-detail-hd">
        <button className="ba-retour" onClick={() => navigate(-1)}>{t("retour")}</button>
        <span className="ba-lbl"><MapPin size={13} /> {nomArret(arretId)}</span>
        <EtoileFavori arretId={arretId} />
      </div>
      {liste.length === 0 ? (
        <p className="ba-empty">{t("vide_arret")}</p>
      ) : (
        <ul className="ba-list">
          {liste.map((s) => <Signalement key={s.id} s={s} />)}
        </ul>
      )}
    </div>
  );
}

function OptionPref({ champ, valeur, children }) {
  const { preferences, definir } = usePreferences();
  const actif = preferences[champ] === valeur;
  return (
    <button className={`ba-opt ${actif ? "on" : ""}`} aria-pressed={actif} onClick={() => definir(champ, valeur)}>
      {children}
    </button>
  );
}

function PanneauReglages({ onFermer }) {
  const { reinitialiser } = usePreferences();
  const { t, i18n } = useTranslation();
  return (
    <div className="ba-panneau" role="dialog" aria-label={t("reglages")}>
      <div className="ba-pgroupe">
        <span className="ba-plbl">{t("pref_langue")}</span>
        <div className="ba-opts">
          {["fr", "en"].map((lng) => (
            <button
              key={lng}
              className={"ba-opt" + (i18n.language === lng ? " on" : "")}
              aria-pressed={i18n.language === lng}
              onClick={() => changerLangue(lng)}
            >
              {lng.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
      <div className="ba-pgroupe">
        <span className="ba-plbl">{t("pref_theme")}</span>
        <div className="ba-opts">
          <OptionPref champ="theme" valeur="clair">{t("theme_clair")}</OptionPref>
          <OptionPref champ="theme" valeur="sombre">{t("theme_sombre")}</OptionPref>
        </div>
      </div>
      <div className="ba-pgroupe">
        <span className="ba-plbl">{t("pref_taille")}</span>
        <div className="ba-opts">
          <OptionPref champ="taille" valeur="normale">{t("taille_normale")}</OptionPref>
          <OptionPref champ="taille" valeur="grande">{t("taille_grande")}</OptionPref>
          <OptionPref champ="taille" valeur="tres-grande">{t("taille_tres_grande")}</OptionPref>
        </div>
      </div>
      <div className="ba-pgroupe">
        <span className="ba-plbl">{t("pref_guidage")}</span>
        <div className="ba-opts">
          <OptionPref champ="niveau" valeur="standard">{t("guidage_standard")}</OptionPref>
          <OptionPref champ="niveau" valeur="guide">{t("guidage_guide")}</OptionPref>
        </div>
      </div>
      <button className="ba-preset" onClick={() => { reinitialiser(); onFermer(); }}>{t("pref_systeme")}</button>
    </div>
  );
}

function Coquille() {
  const classe = ({ isActive }) => "ba-tab" + (isActive ? " on" : "");
  const { t, i18n } = useTranslation();
  const { preferences } = usePreferences();
  const [reglagesOuverts, setReglagesOuverts] = useState(false);
  return (
    <div
      className="ba"
      lang={localeDe(i18n.language)}
      data-theme={preferences.theme}
      data-taille={preferences.taille}
    >
      <header className="ba-hd">
        <div>
          <div className="ba-hd__brand"><Bus size={20} strokeWidth={2.2} /><span>{t("brand")}</span></div>
          <p className="ba-hd__sub">{t("sous_titre")}</p>
        </div>
        <div className="ba-reglages-zone">
          <button
            className={"ba-engrenage" + (reglagesOuverts ? " on" : "")}
            aria-expanded={reglagesOuverts}
            aria-label={t("reglages")}
            onClick={() => setReglagesOuverts((v) => !v)}
          >
            <Settings size={18} />
          </button>
          {reglagesOuverts && <PanneauReglages onFermer={() => setReglagesOuverts(false)} />}
        </div>
      </header>

      <nav className="ba-tabs" aria-label="Sections">
        <NavLink to="/" end className={classe}>{t("nav_signaler")}</NavLink>
        <NavLink to="/rechercher" className={classe}>{t("nav_rechercher")}</NavLink>
        <NavLink to="/mes-arrets" className={classe}>{t("nav_mes_arrets")}</NavLink>
      </nav>

      <div className="ba-body">
        <Routes>
          <Route path="/" element={<VueSignaler />} />
          <Route path="/rechercher" element={<VueRechercher />} />
          <Route path="/mes-arrets" element={<VueMesArrets />} />
          <Route path="/arret/:arretId" element={<VueArret />} />
        </Routes>
      </div>
    </div>
  );
}

function FournisseurApp({ children }) {
  const [now, setNow] = useState(() => Date.now());
  const [signalements, setSignalements] = useState(() => seed(Date.now()));
  const [favoris, setFavoris] = useState(["a2"]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const signaler = ({ arretId, ligne, delai }) =>
    setSignalements((prev) => [
      { id: uid(), arretId, ligne, delai, t: Date.now(), up: 0, down: 0, monVote: null },
      ...prev,
    ]);

  const basculerFavori = (id) =>
    setFavoris((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const voter = (id, dir) =>
    setSignalements((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const next = { ...s };
        // retire le vote précédent
        if (s.monVote === "up") next.up -= 1;
        if (s.monVote === "down") next.down -= 1;
        if (s.monVote === dir) {
          next.monVote = null; // un second clic annule le vote
        } else {
          next.monVote = dir;
          if (dir === "up") next.up += 1;
          else next.down += 1;
        }
        return next;
      })
    );

  const valeur = useMemo(
    () => ({ now, signalements, favoris, signaler, basculerFavori, voter }),
    [now, signalements, favoris]
  );

  return <AppContext.Provider value={valeur}>{children}</AppContext.Provider>;
}

export default function BusSignalApp() {
  return (
    <I18nextProvider i18n={i18n}>
      <FournisseurPreferences>
        <FournisseurApp>
          <MemoryRouter initialEntries={["/"]}>
            <Coquille />
          </MemoryRouter>
        </FournisseurApp>
      </FournisseurPreferences>
    </I18nextProvider>
  );
}

const CSS = `
.ba{font-family:'DM Sans',system-ui,sans-serif;color:#1a1a2e;background:#f5f7fa;
  border:1px solid #e2e0db;border-radius:20px;overflow:hidden;max-width:920px;margin:2rem auto;
  box-shadow:0 14px 44px rgba(15,23,42,0.12);font-size:16px}
.ba[data-taille="grande"]{font-size:18px}
.ba[data-taille="tres-grande"]{font-size:20px}
.ba *{box-sizing:border-box}
.ba-hd{background:linear-gradient(135deg,#0f9b8e,#0d7c70);color:#fff;padding:22px 22px 16px;display:flex;justify-content:space-between;align-items:flex-start;gap:12px}
.ba-langue{display:flex;gap:4px;flex-shrink:0}
.ba-lng{font:inherit;font-size:.72em;font-weight:700;padding:4px 9px;border:1px solid rgba(255,255,255,.55);background:transparent;color:#fff;border-radius:7px;cursor:pointer}
.ba-lng:hover{background:rgba(255,255,255,.15)}
.ba-lng.on{background:#fff;color:#0d7c70;border-color:#fff}
.ba-hd__brand{display:flex;align-items:center;gap:9px;font-family:'Fraunces',serif;font-weight:600;font-size:1.25em}
.ba-hd__sub{margin:5px 0 0;font-size:.82em;opacity:.85}
.ba-tabs{display:flex;gap:6px;padding:12px 16px 0;background:#eef1f5}
.ba-tab{flex:1;text-align:center;text-decoration:none;color:#6b7280;font-weight:600;font-size:.88em;
  padding:10px 0;border-radius:10px 10px 0 0;border:1px solid transparent;border-bottom:0}
.ba-tab:hover{color:#0d7c70}
.ba-tab.on{color:#0d7c70;background:#f5f7fa;box-shadow:0 -1px 2px rgba(15,23,42,0.05)}
.ba-body{padding:16px}
.ba-cols{display:flex;flex-direction:column;gap:14px}
.ba-col{display:flex;flex-direction:column;gap:12px;min-width:0}
.ba-card{background:#fff;border:1px solid #eceef2;border-radius:14px;padding:13px 14px}
.ba-card__hd{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px}
.ba-lbl{display:flex;align-items:center;gap:5px;font-size:.66em;font-weight:700;text-transform:uppercase;
  letter-spacing:.05em;color:#9aa1ad;margin-bottom:9px}
.ba-lbl.mt{margin-top:14px}
.ba-card__hd .ba-lbl{margin-bottom:0}
.ba-stops{display:flex;flex-direction:column;gap:7px}
.ba-stop-row{display:flex;align-items:center;gap:8px;border:1.5px solid #e5e7eb;border-radius:11px;
  padding:2px 6px 2px 2px;transition:all .15s}
.ba-stop-row.on{border-color:#0d9488;background:#e9f7f5}
.ba-stop{flex:1;text-align:left;border:0;background:transparent;color:#1a1a2e;font:inherit;font-size:.86em;
  padding:9px 10px;border-radius:9px;cursor:pointer}
.ba-stop-row.on .ba-stop{font-weight:600;color:#0d7c70}
.ba-fav{border:0;background:transparent;color:#cbd2da;cursor:pointer;display:flex;padding:5px;border-radius:8px}
.ba-fav:hover{color:#f0a500}
.ba-fav.on{color:#f0a500}
.ba-chips{display:flex;gap:7px;flex-wrap:wrap}
.ba-chip{border:1.5px solid #e5e7eb;background:#fff;color:#1a1a2e;font:inherit;font-size:.82em;font-weight:600;
  padding:7px 14px;border-radius:20px;cursor:pointer;transition:all .15s}
.ba-chip:hover{border-color:#9fd8d1}
.ba-chip.on{border-color:#0d9488;background:#0d9488;color:#fff}
.ba-cta{display:flex;align-items:center;justify-content:center;gap:8px;border:0;
  background:linear-gradient(135deg,#0f9b8e,#0d7c70);color:#fff;font:inherit;font-weight:700;font-size:.95em;
  padding:13px;border-radius:13px;cursor:pointer;box-shadow:0 6px 16px rgba(13,124,112,.3)}
.ba-cta:active{transform:scale(.98)}
.ba-toast{display:flex;align-items:center;justify-content:center;gap:6px;background:#dcfce7;color:#166534;
  font-size:.82em;font-weight:600;padding:9px;border-radius:10px}
.ba-sec{font-size:.7em;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#9aa1ad}
.ba-empty{color:#9aa1ad;font-size:.84em;font-style:italic;text-align:center;padding:12px}
.ba-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:8px}
.ba-row{display:flex;align-items:center;gap:10px;flex-wrap:wrap;background:#fff;border:1px solid #eceef2;
  border-radius:12px;padding:10px 12px}
.ba-row.old{opacity:.55}
.ba-badge{flex-shrink:0;min-width:34px;height:34px;display:flex;align-items:center;justify-content:center;
  background:#e9f7f5;color:#0d7c70;font-weight:700;font-size:.82em;border-radius:9px;padding:0 8px}
.ba-row.old .ba-badge{background:#f1f2f4;color:#9aa1ad}
.ba-row__main{flex:1;display:flex;align-items:center;gap:4px;font-size:.85em;color:#374151;min-width:120px}
.ba-row__age{font-size:.74em;color:#9aa1ad;white-space:nowrap;font-variant-numeric:tabular-nums}
.ba-vote{display:flex;gap:5px;flex-shrink:0}
.ba-vote__btn{display:flex;align-items:center;gap:4px;border:1px solid #e5e7eb;background:#fff;color:#6b7280;
  font:inherit;font-size:.76em;font-weight:600;padding:4px 8px;border-radius:8px;cursor:pointer}
.ba-vote__btn:hover{border-color:#9fd8d1}
.ba-vote__btn.on-up{border-color:#0d9488;background:#e9f7f5;color:#0d7c70}
.ba-vote__btn.on-down{border-color:#fca5a5;background:#fef2f2;color:#dc2626}
.ba-search{display:flex;align-items:center;gap:8px;background:#fff;border:1.5px solid #e5e7eb;border-radius:13px;
  padding:10px 13px;color:#9aa1ad}
.ba-search:focus-within{border-color:#0d9488;color:#0d7c70}
.ba-search__input{flex:1;border:0;outline:0;background:transparent;font:inherit;font-size:.9em;color:#1a1a2e}
.ba-search__clear{border:0;background:transparent;color:#9aa1ad;cursor:pointer;display:flex;padding:0}
.ba-search__clear:hover{color:#dc2626}
.ba-lien,.ba-retour{font-size:.8em;font-weight:600;color:#0d7c70;text-decoration:none;cursor:pointer;
  border:0;background:transparent;padding:0}
.ba-lien:hover,.ba-retour:hover{text-decoration:underline}
.ba-detail-hd{display:flex;align-items:center;gap:10px;margin-bottom:4px}
.ba-detail-hd .ba-lbl{flex:1;margin-bottom:0}

@media (min-width:680px){
  .ba-hd{padding:26px 28px 20px}
  .ba-tabs{padding:14px 22px 0}
  .ba-body{padding:22px}
  .ba-cols{flex-direction:row;align-items:flex-start;gap:22px}
  .ba-cols .ba-col{flex:1}
}

.ba[data-theme="sombre"]{background:#0e1117;border-color:#2a3142;color:#e8e8f0}
.ba[data-theme="sombre"] .ba-tabs{background:#141925}
.ba[data-theme="sombre"] .ba-tab{color:#8b93a3}
.ba[data-theme="sombre"] .ba-tab.on{background:#0e1117;color:#5eead4}
.ba[data-theme="sombre"] .ba-card{background:#161b25;border-color:#2a3142}
.ba[data-theme="sombre"] .ba-stop-row{border-color:#2a3142}
.ba[data-theme="sombre"] .ba-stop-row.on{background:#10241f;border-color:#0d9488}
.ba[data-theme="sombre"] .ba-stop{color:#e8e8f0}
.ba[data-theme="sombre"] .ba-chip{background:#0b0f16;border-color:#2a3142;color:#e8e8f0}
.ba[data-theme="sombre"] .ba-chip.on{background:#0d9488;border-color:#0d9488}
.ba[data-theme="sombre"] .ba-row{background:#161b25;border-color:#2a3142}
.ba[data-theme="sombre"] .ba-badge{background:#10241f;color:#5eead4}
.ba[data-theme="sombre"] .ba-row__main{color:#c7cdd8}
.ba[data-theme="sombre"] .ba-vote__btn{background:#0b0f16;border-color:#2a3142;color:#8b93a3}
.ba[data-theme="sombre"] .ba-search{background:#0b0f16;border-color:#2a3142}
.ba[data-theme="sombre"] .ba-search__input{color:#e8e8f0}

.ba-aide{margin:0 0 4px;font-size:.86em;line-height:1.5;background:rgba(13,148,136,.1);color:#0d7c70;
  padding:9px 11px;border-radius:10px}
.ba-cta.grand{padding:17px;font-size:1.08em}
.ba-reglages-zone{position:relative;flex-shrink:0}
.ba-engrenage{display:flex;align-items:center;justify-content:center;width:34px;height:34px;border:1px solid rgba(255,255,255,.55);
  background:transparent;color:#fff;border-radius:9px;cursor:pointer}
.ba-engrenage:hover,.ba-engrenage.on{background:rgba(255,255,255,.18)}
.ba-panneau{position:absolute;top:42px;right:0;z-index:5;width:248px;background:#fff;color:#1a1a2e;
  border:1px solid #e2e0db;border-radius:14px;padding:14px;display:flex;flex-direction:column;gap:12px;
  box-shadow:0 16px 40px rgba(15,23,42,.22)}
.ba-pgroupe{display:flex;flex-direction:column;gap:6px}
.ba-plbl{font-size:.66em;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#9aa1ad}
.ba-opts{display:flex;gap:6px;flex-wrap:wrap}
.ba-opt{border:1.5px solid #e5e7eb;background:#fff;color:#1a1a2e;font:inherit;font-size:.8em;font-weight:600;
  padding:6px 11px;border-radius:9px;cursor:pointer}
.ba-opt:hover{border-color:#9fd8d1}
.ba-opt.on{border-color:#0d9488;background:#0d9488;color:#fff}
.ba-preset{align-self:flex-start;border:0;background:transparent;color:#0d7c70;font:inherit;font-size:.8em;
  font-weight:600;cursor:pointer;padding:2px 0;text-decoration:underline}
.ba[data-theme="sombre"] .ba-panneau{background:#161b25;color:#e8e8f0;border-color:#2a3142}
.ba[data-theme="sombre"] .ba-opt{background:#0b0f16;border-color:#2a3142;color:#e8e8f0}
.ba[data-theme="sombre"] .ba-opt.on{background:#0d9488;border-color:#0d9488}
.ba[data-theme="sombre"] .ba-aide{color:#5eead4}
`;

if (typeof document !== "undefined" && !document.getElementById("ba-style")) {
  const el = document.createElement("style");
  el.id = "ba-style";
  el.textContent = CSS;
  document.head.appendChild(el);
}