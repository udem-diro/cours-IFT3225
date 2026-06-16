import { useState, useEffect, useRef, useMemo } from "react";
import { Bus, MapPin, Search, Send, Check, X } from "lucide-react";

/**
 * BusSignalementPanel (îlot Astro, hydraté client:visible)
 *
 * Vue mobile d'une petite application d'entraide : deux flux autour d'un
 * même état partagé (l'arrêt choisi, la liste des signalements).
 *   - onglet « Signaler » : choisir un arrêt, une ligne, un délai, et signaler ;
 *   - onglet « Rechercher » : filtrer les signalements par numéro de ligne.
 * Tout passe par l'état détenu par le composant : les onglets l'écrivent ou le
 * lisent, et les vues se redessinent. Une horloge rafraîchit l'âge des
 * signalements chaque seconde.
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
    { id: uid(), arretId: "a1", ligne: "11", delai: 3, t: now - 22000 },
    { id: uid(), arretId: "a1", ligne: "361", delai: 7, t: now - 68000 },
    { id: uid(), arretId: "a2", ligne: "747", delai: 2, t: now - 9000 },
    { id: uid(), arretId: "a3", ligne: "80", delai: 4, t: now - 40000 },
    { id: uid(), arretId: "a2", ligne: "15", delai: 6, t: now - 120000 },
  ];
}

const nomArret = (id) => ARRETS.find((a) => a.id === id)?.nom ?? "";
function age(ms) {
  const s = Math.max(0, Math.round(ms / 1000));
  return s < 60 ? `${s} s` : `${Math.round(s / 60)} min`;
}

export default function BusSignalementPanel() {
  const [now, setNow] = useState(() => Date.now());
  const [tab, setTab] = useState("signaler");
  const [arretId, setArretId] = useState("a1");
  const [signalements, setSignalements] = useState(() => seed(Date.now()));
  const [ligne, setLigne] = useState("11");
  const [delai, setDelai] = useState(3);
  const [requete, setRequete] = useState("");
  const [envoye, setEnvoye] = useState(false);
  const toast = useRef(null);

  const arret = ARRETS.find((a) => a.id === arretId) ?? ARRETS[0];

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    const a = ARRETS.find((x) => x.id === arretId) ?? ARRETS[0];
    setLigne(a.lignes[0]);
  }, [arretId]);
  useEffect(() => () => clearTimeout(toast.current), []);

  const recents = useMemo(
    () => signalements.filter((s) => s.arretId === arretId).sort((a, b) => b.t - a.t),
    [signalements, arretId]
  );
  const lignesConnues = useMemo(
    () => [...new Set(signalements.map((s) => s.ligne))].sort((a, b) => Number(a) - Number(b)),
    [signalements]
  );
  const resultats = useMemo(() => {
    const base = [...signalements].sort((a, b) => b.t - a.t);
    const q = requete.trim();
    return q === "" ? base : base.filter((s) => s.ligne.startsWith(q));
  }, [signalements, requete]);

  function signaler() {
    setSignalements((prev) => [{ id: uid(), arretId, ligne, delai, t: Date.now() }, ...prev]);
    setEnvoye(true);
    clearTimeout(toast.current);
    toast.current = setTimeout(() => setEnvoye(false), 1900);
  }

  return (
    <div className="bsp">
      <div className="bsp-phone">
        <div className="bsp-notch" />
        <div className="bsp-screen">
          <header className="bsp-hd">
            <div className="bsp-hd__brand"><Bus size={20} strokeWidth={2.2} /><span>Bus en vue</span></div>
            <p className="bsp-hd__sub">L'arrivée des autobus, entre usagers</p>
          </header>

          <div className="bsp-tabs" role="tablist" aria-label="Sections">
            <button role="tab" aria-selected={tab === "signaler"} className={`bsp-tab ${tab === "signaler" ? "on" : ""}`} onClick={() => setTab("signaler")}>Signaler</button>
            <button role="tab" aria-selected={tab === "rechercher"} className={`bsp-tab ${tab === "rechercher" ? "on" : ""}`} onClick={() => setTab("rechercher")}>Rechercher</button>
          </div>

          <div className="bsp-body">
            {tab === "signaler" ? (
              <>
                <div className="bsp-card">
                  <span className="bsp-lbl"><MapPin size={13} /> Arrêt</span>
                  <div className="bsp-stops">
                    {ARRETS.map((a) => (
                      <button key={a.id} className={`bsp-stop ${a.id === arretId ? "on" : ""}`} aria-pressed={a.id === arretId} onClick={() => setArretId(a.id)}>{a.nom}</button>
                    ))}
                  </div>
                </div>

                <div className="bsp-card">
                  <span className="bsp-lbl">Ligne</span>
                  <div className="bsp-chips">
                    {arret.lignes.map((l) => (
                      <button key={l} className={`bsp-chip ${l === ligne ? "on" : ""}`} aria-pressed={l === ligne} onClick={() => setLigne(l)}>{l}</button>
                    ))}
                  </div>
                  <span className="bsp-lbl mt">Arrive dans</span>
                  <div className="bsp-chips">
                    {[2, 3, 5, 10].map((d) => (
                      <button key={d} className={`bsp-chip ${d === delai ? "on" : ""}`} aria-pressed={d === delai} onClick={() => setDelai(d)}>{d} min</button>
                    ))}
                  </div>
                </div>

                <button className="bsp-cta" onClick={signaler}><Send size={16} /> Signaler l'arrivée</button>
                {envoye && <div className="bsp-toast" role="status"><Check size={14} /> Signalement envoyé, merci</div>}

                <div className="bsp-sec">Récents à cet arrêt</div>
                {recents.length === 0 ? (
                  <p className="bsp-empty">Aucun signalement. Soyez le premier.</p>
                ) : (
                  <ul className="bsp-list">
                    {recents.map((s) => (
                      <li key={s.id} className={`bsp-row ${now - s.t >= 60000 ? "old" : ""}`}>
                        <span className="bsp-badge">{s.ligne}</span>
                        <span className="bsp-row__main">arrive dans ~{s.delai} min</span>
                        <span className="bsp-row__age">il y a {age(now - s.t)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            ) : (
              <>
                <div className="bsp-search">
                  <Search size={16} />
                  <input className="bsp-search__input" value={requete} onChange={(e) => setRequete(e.target.value)} inputMode="numeric" placeholder="Numéro de ligne (ex. 11)" aria-label="Rechercher une ligne" />
                  {requete && <button className="bsp-search__clear" aria-label="Effacer" onClick={() => setRequete("")}><X size={15} /></button>}
                </div>

                <div className="bsp-chips wrap">
                  {lignesConnues.map((l) => (
                    <button key={l} className={`bsp-chip ${requete === l ? "on" : ""}`} aria-pressed={requete === l} onClick={() => setRequete(requete === l ? "" : l)}>Ligne {l}</button>
                  ))}
                </div>

                <div className="bsp-sec">{requete ? `Ligne ${requete}` : "Tous les signalements récents"}</div>
                {resultats.length === 0 ? (
                  <p className="bsp-empty">Aucun signalement pour cette ligne.</p>
                ) : (
                  <ul className="bsp-list">
                    {resultats.map((s) => (
                      <li key={s.id} className={`bsp-row ${now - s.t >= 60000 ? "old" : ""}`}>
                        <span className="bsp-badge">{s.ligne}</span>
                        <span className="bsp-row__main"><MapPin size={11} /> {nomArret(s.arretId)}</span>
                        <span className="bsp-row__age">il y a {age(now - s.t)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      <style>{CSS}</style>
    </div>
  );
}

const CSS = `
.bsp { display:flex; justify-content:center; margin:2rem auto; }
.bsp * { box-sizing:border-box; }
.bsp-phone {
  position:relative; width:min(360px,100%); background:#15171f;
  border-radius:36px; padding:12px;
  box-shadow:0 24px 60px rgba(15,23,42,0.28), 0 4px 12px rgba(15,23,42,0.18);
}
.bsp-notch { position:absolute; top:20px; left:50%; transform:translateX(-50%); width:96px; height:6px; border-radius:6px; background:#2a2d38; z-index:2; }
.bsp-screen {
  background:#f5f7fa; border-radius:26px; overflow:hidden;
  font-family:'DM Sans',system-ui,sans-serif; color:#1a1a2e; display:flex; flex-direction:column;
}
.bsp-hd { background:linear-gradient(135deg,#0f9b8e,#0d7c70); color:#fff; padding:30px 20px 18px; }
.bsp-hd__brand { display:flex; align-items:center; gap:9px; font-family:'Fraunces',serif; font-weight:600; font-size:1.25rem; }
.bsp-hd__sub { margin:5px 0 0; font-size:0.8rem; opacity:0.85; }
.bsp-tabs { display:flex; gap:6px; padding:12px 16px 0; }
.bsp-tab { flex:1; border:0; background:transparent; color:#6b7280; font:inherit; font-weight:600; font-size:0.88rem; padding:9px 0; border-radius:10px; cursor:pointer; }
.bsp-tab.on { color:#0d7c70; background:#fff; box-shadow:0 1px 3px rgba(15,23,42,0.08); }
.bsp-tab:focus-visible { outline:2px solid #0d9488; outline-offset:2px; }
.bsp-body { padding:14px 16px 22px; display:flex; flex-direction:column; gap:12px; }
.bsp-card { background:#fff; border:1px solid #eceef2; border-radius:14px; padding:13px 14px; box-shadow:0 1px 2px rgba(15,23,42,0.04); }
.bsp-lbl { display:flex; align-items:center; gap:5px; font-size:0.66rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:#9aa1ad; margin-bottom:9px; }
.bsp-lbl.mt { margin-top:14px; }
.bsp-stops { display:flex; flex-direction:column; gap:7px; }
.bsp-stop { text-align:left; border:1.5px solid #e5e7eb; background:#fff; color:#1a1a2e; font:inherit; font-size:0.86rem; padding:10px 12px; border-radius:11px; cursor:pointer; transition:all .15s; }
.bsp-stop:hover { border-color:#9fd8d1; }
.bsp-stop.on { border-color:#0d9488; background:#e9f7f5; font-weight:600; color:#0d7c70; }
.bsp-chips { display:flex; gap:7px; flex-wrap:wrap; }
.bsp-chip { border:1.5px solid #e5e7eb; background:#fff; color:#1a1a2e; font:inherit; font-size:0.82rem; font-weight:600; padding:7px 14px; border-radius:20px; cursor:pointer; transition:all .15s; }
.bsp-chip:hover { border-color:#9fd8d1; }
.bsp-chip.on { border-color:#0d9488; background:#0d9488; color:#fff; }
.bsp-chip:focus-visible, .bsp-stop:focus-visible, .bsp-cta:focus-visible { outline:2px solid #0d9488; outline-offset:2px; }
.bsp-cta { display:flex; align-items:center; justify-content:center; gap:8px; border:0; background:linear-gradient(135deg,#0f9b8e,#0d7c70); color:#fff; font:inherit; font-weight:700; font-size:0.95rem; padding:13px; border-radius:13px; cursor:pointer; box-shadow:0 6px 16px rgba(13,124,112,0.3); transition:transform .1s; }
.bsp-cta:active { transform:scale(0.98); }
.bsp-toast { display:flex; align-items:center; justify-content:center; gap:6px; background:#dcfce7; color:#166534; font-size:0.82rem; font-weight:600; padding:9px; border-radius:10px; }
.bsp-sec { font-size:0.7rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:#9aa1ad; margin-top:4px; }
.bsp-empty { color:#9aa1ad; font-size:0.84rem; font-style:italic; margin:2px 0; text-align:center; padding:10px; }
.bsp-list { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:8px; }
.bsp-row { display:flex; align-items:center; gap:10px; background:#fff; border:1px solid #eceef2; border-radius:12px; padding:10px 12px; box-shadow:0 1px 2px rgba(15,23,42,0.04); }
.bsp-row.old { opacity:0.5; }
.bsp-badge { flex-shrink:0; min-width:34px; height:34px; display:flex; align-items:center; justify-content:center; background:#e9f7f5; color:#0d7c70; font-weight:700; font-size:0.82rem; border-radius:9px; padding:0 8px; }
.bsp-row.old .bsp-badge { background:#f1f2f4; color:#9aa1ad; }
.bsp-row__main { flex:1; display:flex; align-items:center; gap:4px; font-size:0.85rem; color:#374151; }
.bsp-row__age { font-size:0.74rem; color:#9aa1ad; white-space:nowrap; font-variant-numeric:tabular-nums; }
.bsp-search { display:flex; align-items:center; gap:8px; background:#fff; border:1.5px solid #e5e7eb; border-radius:13px; padding:10px 13px; color:#9aa1ad; }
.bsp-search:focus-within { border-color:#0d9488; color:#0d7c70; }
.bsp-search__input { flex:1; border:0; outline:0; background:transparent; font:inherit; font-size:0.9rem; color:#1a1a2e; }
.bsp-search__clear { border:0; background:transparent; color:#9aa1ad; cursor:pointer; display:flex; padding:0; }
.bsp-search__clear:hover { color:#dc2626; }
`;