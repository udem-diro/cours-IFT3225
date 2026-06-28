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
import { Bus, MapPin, Search, Send, Check, X, Star, ThumbsUp, ThumbsDown } from "lucide-react";

/**
 * BusSignalApp : version enrichie de l'application Signalement de bus, point de
 * départ de la note « applications complexes ». ÉTAPE 1 (React Router) :
 *   - mise en page responsive (mobile en colonne, large sur grand écran) ;
 *   - les onglets deviennent des vues routées (MemoryRouter) : Signaler,
 *     Rechercher, Mes arrêts, plus une vue détail /arret/:arretId ;
 *   - arrêts en favoris (étoile) et onglet « Mes arrêts » ;
 *   - pouce haut / bas pour donner un retour sur un signalement.
 * L'état partagé (signalements, favoris, votes) est fourni par React Context
 * (FournisseurApp + hook useApp). Reste l'étape 3 : le multilingue (i18next).
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

// État partagé de l'application, fourni par React Context.
const AppContext = createContext(null);
function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp doit être utilisé dans <FournisseurApp>.");
  return ctx;
}

function Vote({ s }) {
  const { voter } = useApp();
  return (
    <span className="ba-vote">
      <button
        className={`ba-vote__btn ${s.monVote === "up" ? "on-up" : ""}`}
        aria-pressed={s.monVote === "up"}
        aria-label="Utile"
        onClick={() => voter(s.id, "up")}
      >
        <ThumbsUp size={13} /> {s.up}
      </button>
      <button
        className={`ba-vote__btn ${s.monVote === "down" ? "on-down" : ""}`}
        aria-pressed={s.monVote === "down"}
        aria-label="Pas utile"
        onClick={() => voter(s.id, "down")}
      >
        <ThumbsDown size={13} /> {s.down}
      </button>
    </span>
  );
}

function Signalement({ s, montrerArret = false }) {
  const { now } = useApp();
  return (
    <li className={`ba-row ${now - s.t >= 60000 ? "old" : ""}`}>
      <span className="ba-badge">{s.ligne}</span>
      <span className="ba-row__main">
        {montrerArret ? (
          <><MapPin size={11} /> {nomArret(s.arretId)}</>
        ) : (
          <>arrive dans ~{s.delai} min</>
        )}
      </span>
      <span className="ba-row__age">il y a {age(now - s.t)}</span>
      <Vote s={s} />
    </li>
  );
}

function EtoileFavori({ arretId }) {
  const { favoris, basculerFavori } = useApp();
  const actif = favoris.includes(arretId);
  return (
    <button
      className={`ba-fav ${actif ? "on" : ""}`}
      aria-pressed={actif}
      aria-label={actif ? "Retirer des favoris" : "Ajouter aux favoris"}
      onClick={() => basculerFavori(arretId)}
    >
      <Star size={15} fill={actif ? "currentColor" : "none"} />
    </button>
  );
}

function VueSignaler() {
  const { signalements, signaler } = useApp();
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
          <span className="ba-lbl"><MapPin size={13} /> Arrêt</span>
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
          <span className="ba-lbl">Ligne</span>
          <div className="ba-chips">
            {lignesDe(arretId).map((l) => (
              <button key={l} className={`ba-chip ${l === ligne ? "on" : ""}`} aria-pressed={l === ligne} onClick={() => setLigne(l)}>{l}</button>
            ))}
          </div>
          <span className="ba-lbl mt">Arrive dans</span>
          <div className="ba-chips">
            {[2, 3, 5, 10].map((d) => (
              <button key={d} className={`ba-chip ${d === delai ? "on" : ""}`} aria-pressed={d === delai} onClick={() => setDelai(d)}>{d} min</button>
            ))}
          </div>
        </div>

        <button className="ba-cta" onClick={envoyer}><Send size={16} /> Signaler l'arrivée</button>
        {envoye && <div className="ba-toast" role="status"><Check size={14} /> Signalement envoyé, merci</div>}
      </div>

      <div className="ba-col">
        <div className="ba-sec">Récents à cet arrêt</div>
        {recents.length === 0 ? (
          <p className="ba-empty">Aucun signalement. Soyez le premier.</p>
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
        <input className="ba-search__input" value={requete} onChange={(e) => setRequete(e.target.value)} inputMode="numeric" placeholder="Numéro de ligne (ex. 11)" aria-label="Rechercher une ligne" />
        {requete && <button className="ba-search__clear" aria-label="Effacer" onClick={() => setRequete("")}><X size={15} /></button>}
      </div>

      <div className="ba-chips wrap">
        {lignesConnues.map((l) => (
          <button key={l} className={`ba-chip ${requete === l ? "on" : ""}`} aria-pressed={requete === l} onClick={() => setRequete(requete === l ? "" : l)}>Ligne {l}</button>
        ))}
      </div>

      <div className="ba-sec">{requete ? `Ligne ${requete}` : "Tous les signalements récents"}</div>
      {resultats.length === 0 ? (
        <p className="ba-empty">Aucun signalement pour cette ligne.</p>
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

  if (favoris.length === 0) {
    return <p className="ba-empty">Aucun arrêt favori. Touchez l'étoile d'un arrêt pour l'ajouter.</p>;
  }

  return (
    <div className="ba-col">
      {favoris.map((id) => {
        const liste = signalements.filter((s) => s.arretId === id).sort((a, b) => b.t - a.t);
        return (
          <div className="ba-card" key={id}>
            <div className="ba-card__hd">
              <span className="ba-lbl"><MapPin size={13} /> {nomArret(id)}</span>
              <Link className="ba-lien" to={`/arret/${id}`}>Détail</Link>
            </div>
            {liste.length === 0 ? (
              <p className="ba-empty">Aucun signalement récent.</p>
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
  const liste = signalements.filter((s) => s.arretId === arretId).sort((a, b) => b.t - a.t);

  return (
    <div className="ba-col">
      <div className="ba-detail-hd">
        <button className="ba-retour" onClick={() => navigate(-1)}>Retour</button>
        <span className="ba-lbl"><MapPin size={13} /> {nomArret(arretId)}</span>
        <EtoileFavori arretId={arretId} />
      </div>
      {liste.length === 0 ? (
        <p className="ba-empty">Aucun signalement à cet arrêt.</p>
      ) : (
        <ul className="ba-list">
          {liste.map((s) => <Signalement key={s.id} s={s} />)}
        </ul>
      )}
    </div>
  );
}

function Coquille() {
  const classe = ({ isActive }) => "ba-tab" + (isActive ? " on" : "");
  return (
    <div className="ba">
      <header className="ba-hd">
        <div className="ba-hd__brand"><Bus size={20} strokeWidth={2.2} /><span>Bus en vue</span></div>
        <p className="ba-hd__sub">L'arrivée des autobus, entre usagers</p>
      </header>

      <nav className="ba-tabs" aria-label="Sections">
        <NavLink to="/" end className={classe}>Signaler</NavLink>
        <NavLink to="/rechercher" className={classe}>Rechercher</NavLink>
        <NavLink to="/mes-arrets" className={classe}>Mes arrêts</NavLink>
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
    <FournisseurApp>
      <MemoryRouter initialEntries={["/"]}>
        <Coquille />
      </MemoryRouter>
    </FournisseurApp>
  );
}

const CSS = `
.ba{font-family:'DM Sans',system-ui,sans-serif;color:#1a1a2e;background:#f5f7fa;
  border:1px solid #e2e0db;border-radius:20px;overflow:hidden;max-width:920px;margin:2rem auto;
  box-shadow:0 14px 44px rgba(15,23,42,0.12)}
.ba *{box-sizing:border-box}
.ba-hd{background:linear-gradient(135deg,#0f9b8e,#0d7c70);color:#fff;padding:22px 22px 16px}
.ba-hd__brand{display:flex;align-items:center;gap:9px;font-family:'Fraunces',serif;font-weight:600;font-size:1.25rem}
.ba-hd__sub{margin:5px 0 0;font-size:.82rem;opacity:.85}
.ba-tabs{display:flex;gap:6px;padding:12px 16px 0;background:#eef1f5}
.ba-tab{flex:1;text-align:center;text-decoration:none;color:#6b7280;font-weight:600;font-size:.88rem;
  padding:10px 0;border-radius:10px 10px 0 0;border:1px solid transparent;border-bottom:0}
.ba-tab:hover{color:#0d7c70}
.ba-tab.on{color:#0d7c70;background:#f5f7fa;box-shadow:0 -1px 2px rgba(15,23,42,0.05)}
.ba-body{padding:16px}
.ba-cols{display:flex;flex-direction:column;gap:14px}
.ba-col{display:flex;flex-direction:column;gap:12px;min-width:0}
.ba-card{background:#fff;border:1px solid #eceef2;border-radius:14px;padding:13px 14px}
.ba-card__hd{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px}
.ba-lbl{display:flex;align-items:center;gap:5px;font-size:.66rem;font-weight:700;text-transform:uppercase;
  letter-spacing:.05em;color:#9aa1ad;margin-bottom:9px}
.ba-lbl.mt{margin-top:14px}
.ba-card__hd .ba-lbl{margin-bottom:0}
.ba-stops{display:flex;flex-direction:column;gap:7px}
.ba-stop-row{display:flex;align-items:center;gap:8px;border:1.5px solid #e5e7eb;border-radius:11px;
  padding:2px 6px 2px 2px;transition:all .15s}
.ba-stop-row.on{border-color:#0d9488;background:#e9f7f5}
.ba-stop{flex:1;text-align:left;border:0;background:transparent;color:#1a1a2e;font:inherit;font-size:.86rem;
  padding:9px 10px;border-radius:9px;cursor:pointer}
.ba-stop-row.on .ba-stop{font-weight:600;color:#0d7c70}
.ba-fav{border:0;background:transparent;color:#cbd2da;cursor:pointer;display:flex;padding:5px;border-radius:8px}
.ba-fav:hover{color:#f0a500}
.ba-fav.on{color:#f0a500}
.ba-chips{display:flex;gap:7px;flex-wrap:wrap}
.ba-chip{border:1.5px solid #e5e7eb;background:#fff;color:#1a1a2e;font:inherit;font-size:.82rem;font-weight:600;
  padding:7px 14px;border-radius:20px;cursor:pointer;transition:all .15s}
.ba-chip:hover{border-color:#9fd8d1}
.ba-chip.on{border-color:#0d9488;background:#0d9488;color:#fff}
.ba-cta{display:flex;align-items:center;justify-content:center;gap:8px;border:0;
  background:linear-gradient(135deg,#0f9b8e,#0d7c70);color:#fff;font:inherit;font-weight:700;font-size:.95rem;
  padding:13px;border-radius:13px;cursor:pointer;box-shadow:0 6px 16px rgba(13,124,112,.3)}
.ba-cta:active{transform:scale(.98)}
.ba-toast{display:flex;align-items:center;justify-content:center;gap:6px;background:#dcfce7;color:#166534;
  font-size:.82rem;font-weight:600;padding:9px;border-radius:10px}
.ba-sec{font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#9aa1ad}
.ba-empty{color:#9aa1ad;font-size:.84rem;font-style:italic;text-align:center;padding:12px}
.ba-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:8px}
.ba-row{display:flex;align-items:center;gap:10px;flex-wrap:wrap;background:#fff;border:1px solid #eceef2;
  border-radius:12px;padding:10px 12px}
.ba-row.old{opacity:.55}
.ba-badge{flex-shrink:0;min-width:34px;height:34px;display:flex;align-items:center;justify-content:center;
  background:#e9f7f5;color:#0d7c70;font-weight:700;font-size:.82rem;border-radius:9px;padding:0 8px}
.ba-row.old .ba-badge{background:#f1f2f4;color:#9aa1ad}
.ba-row__main{flex:1;display:flex;align-items:center;gap:4px;font-size:.85rem;color:#374151;min-width:120px}
.ba-row__age{font-size:.74rem;color:#9aa1ad;white-space:nowrap;font-variant-numeric:tabular-nums}
.ba-vote{display:flex;gap:5px;flex-shrink:0}
.ba-vote__btn{display:flex;align-items:center;gap:4px;border:1px solid #e5e7eb;background:#fff;color:#6b7280;
  font:inherit;font-size:.76rem;font-weight:600;padding:4px 8px;border-radius:8px;cursor:pointer}
.ba-vote__btn:hover{border-color:#9fd8d1}
.ba-vote__btn.on-up{border-color:#0d9488;background:#e9f7f5;color:#0d7c70}
.ba-vote__btn.on-down{border-color:#fca5a5;background:#fef2f2;color:#dc2626}
.ba-search{display:flex;align-items:center;gap:8px;background:#fff;border:1.5px solid #e5e7eb;border-radius:13px;
  padding:10px 13px;color:#9aa1ad}
.ba-search:focus-within{border-color:#0d9488;color:#0d7c70}
.ba-search__input{flex:1;border:0;outline:0;background:transparent;font:inherit;font-size:.9rem;color:#1a1a2e}
.ba-search__clear{border:0;background:transparent;color:#9aa1ad;cursor:pointer;display:flex;padding:0}
.ba-search__clear:hover{color:#dc2626}
.ba-lien,.ba-retour{font-size:.8rem;font-weight:600;color:#0d7c70;text-decoration:none;cursor:pointer;
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

[data-theme="dark"] .ba{background:#0e1117;border-color:#2a3142;color:#e8e8f0}
[data-theme="dark"] .ba-tabs{background:#141925}
[data-theme="dark"] .ba-tab{color:#8b93a3}
[data-theme="dark"] .ba-tab.on{background:#0e1117;color:#5eead4}
[data-theme="dark"] .ba-card{background:#161b25;border-color:#2a3142}
[data-theme="dark"] .ba-stop-row{border-color:#2a3142}
[data-theme="dark"] .ba-stop-row.on{background:#10241f;border-color:#0d9488}
[data-theme="dark"] .ba-stop{color:#e8e8f0}
[data-theme="dark"] .ba-chip{background:#0b0f16;border-color:#2a3142;color:#e8e8f0}
[data-theme="dark"] .ba-chip.on{background:#0d9488;border-color:#0d9488}
[data-theme="dark"] .ba-row{background:#161b25;border-color:#2a3142}
[data-theme="dark"] .ba-badge{background:#10241f;color:#5eead4}
[data-theme="dark"] .ba-row__main{color:#c7cdd8}
[data-theme="dark"] .ba-vote__btn{background:#0b0f16;border-color:#2a3142;color:#8b93a3}
[data-theme="dark"] .ba-search{background:#0b0f16;border-color:#2a3142}
[data-theme="dark"] .ba-search__input{color:#e8e8f0}
`;

if (typeof document !== "undefined" && !document.getElementById("ba-style")) {
  const el = document.createElement("style");
  el.id = "ba-style";
  el.textContent = CSS;
  document.head.appendChild(el);
}