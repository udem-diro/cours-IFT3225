import { useState, useEffect } from "react";
import './PersistenceExplorer.css';

/**
 * Piloté par CONFIGURATION (prop `config`, défaut `defaultConfig`) pour être
 * réutilisable : types de client, cibles de persistance, mécanismes, scénarios
 * (décrits en étapes déclaratives) et « considérations » par technologie sont
 * tous des données. Seules les RÈGLES (comment un mécanisme affecte l'échange)
 * restent dans le code.
 *
 * Fonctionnalités : diagramme de séquence graphique et animé ; cases à cocher
 * indépendantes par cible ; choix de techno par cible ; aside de droite qui
 * détaille la techno sélectionnée (besoin / stockage / contrôle / limites /
 * quand) ; icône de payload (nature + taille) avec dialogue au survol.
 *
 * Pas d'authentification : tout identifiant transporté est un identifiant de
 * session ou d'appareil.
 */

import { defaultConfig } from "./persistence-config.js";
import { AppWindow, Code, Database, ReceiptText, FileBraces, Flag, Group, ListTodo, MemoryStick, RotateCcw, SlidersHorizontal, TabletSmartphone, Target, Ticket, Signal } from "lucide-react";
export { defaultConfig };

const NAT = { ids: "Identifiants", state: "Objet d'état", list: "Collection", sid: "Identifiant de session" };
const SN = { s: 1, m: 2, l: 3 };
const TONE = { ok: "#16a34a", ctx: "#d97706", heavy: "#dc2626", warn: "#d97706", muted: "#6b6b80" };

function buildFlow(cfg, ct, C) {
    const ctc = C.clientTypes[ct];
    const cMech = ctc.mechs.find((m) => m.id === cfg.client.mech) || ctc.mechs[0];
    const clientId = cfg.client.on && cMech.isId;
    const clientLocal = cfg.client.on && !cMech.isId;
    const srv = C.targets.find((t) => t.key === "server");
    const sMech = srv.mechs.find((m) => m.id === cfg.server.mech) || srv.mechs[0];
    const serverMem = cfg.server.on;
    const serverSession = serverMem && !!sMech.session;
    const serverMap = serverMem && !sMech.session;
    const durable = cfg.db.on;
    const cch = C.targets.find((t) => t.key === "cache");
    const caMech = cch.mechs.find((m) => m.id === cfg.cache.mech) || cch.mechs[0];
    const cacheRedis = cfg.cache.on && !caMech.edge;
    const cacheCdn = cfg.cache.on && !!caMech.edge;

    const ID = ctc.id;
    const idChip = { nature: "sid", size: "s", sizeText: "~32 octets", fields: [{ k: ID.k, v: ID.v }] };

    const cnom = { web: "Navigateur", mobile: "Mobile", sensor: "Capteur" }[ct] || ctc.nom;
    const actors = [{ key: "client", nom: cnom, ctype: ct, badge: clientId ? ID.short : clientLocal ? "local" : null }];
    if (cacheCdn) actors.push({ key: "cdn", nom: "CDN" });
    actors.push({ key: "server", nom: "Serveur", badge: serverSession ? "session" : serverMem ? "mémoire" : null });
    if (durable) actors.push({ key: "db", nom: "Base de données" });
    if (cacheRedis) actors.push({ key: "cache", nom: "Cache (Redis)" });

    const M = [];
    const readOp = (path, reqChips, resChip, baseNote) => {
        if (cacheCdn) {
            M.push({ type: "req", from: "client", to: "cdn", label: "GET " + path, chips: reqChips });
            M.push({ type: "res", from: "cdn", to: "client", label: "200 OK · HIT", chips: [resChip], note: "servi par le CDN — le serveur n'est pas sollicité" });
        } else {
            M.push({ type: "req", from: "client", to: "server", label: "GET " + path, chips: reqChips });
            if (cacheRedis) M.push({ type: "call", from: "server", to: "cache", label: "lire (HIT)" });
            else if (durable) M.push({ type: "call", from: "server", to: "db", label: "find(…)" });
            M.push({ type: "res", from: "server", to: "client", label: "200 OK", chips: [resChip], note: cacheRedis ? "servi depuis Redis, pas la BD" : baseNote });
        }
    };
    const serverWriteNote = () => {
        if (serverSession && !clientId) M.push({ type: "note", at: "server", label: "ouvre une session (Set-Cookie: sid)", tone: "muted" });
        else if (serverMap && !clientId) M.push({ type: "note", at: "server", label: "sans identifiant, impossible de retrouver l'état (clé manquante)", tone: "warn" });
        else if (serverMem) M.push({ type: "note", at: "server", label: "lit/écrit l'état en mémoire", tone: "muted" });
    };
    const writeRes = (extraNote) => {
        const resChips = [];
        if (serverSession && !clientId) resChips.push({ nature: "sid", size: "s", sizeText: "~32 octets", fields: [{ k: "Set-Cookie", v: "sid=ab12cd34" }] });
        M.push({ type: "res", from: "server", to: "client", label: "201 Created", chips: resChips.length ? resChips : null, note: extraNote });
    };

    C.scenarios[ct].steps.forEach((step) => {
        if (step.kind === "read") {
            readOp(step.path, clientId ? [idChip] : [], step.res, durable ? "lu en base" : "calculé par le serveur");
        } else if (step.kind === "write") {
            const bf = step.body.map((f) => ({ ...f }));
            let bnat = "ids", bsize = "s", btext = step.bodySize || "~40 octets";
            if (clientLocal) { bf.push({ k: step.stateKey || "etatLocal", v: "{ … }", tone: "ok" }); bnat = "state"; bsize = "m"; btext = "~0,3 Ko"; }
            else if (!serverMem && !durable) { bf.push({ k: "etatCourant", v: "{ … }", tone: "ctx" }); bnat = "state"; bsize = "m"; btext = "~0,3 Ko"; }
            const reqChips = []; if (clientId) reqChips.push(idChip); reqChips.push({ nature: bnat, size: bsize, sizeText: btext, fields: bf });
            M.push({ type: "req", from: "client", to: "server", label: "POST " + step.path, chips: reqChips });
            serverWriteNote();
            if (durable) M.push({ type: "call", from: "server", to: "db", label: "insertOne(" + (step.entity || "doc") + ")" });
            writeRes((!durable && !serverMem && !clientLocal) ? "rien n'est gardé" : (clientLocal ? "le client met à jour son stockage local" : null));
        } else if (step.kind === "history") {
            if (clientLocal && !durable && !serverMem) {
                M.push({ type: "note", at: "client", label: "historique lu localement — aucune requête", tone: "ok" });
            } else {
                M.push({ type: "req", from: "client", to: "server", label: "GET " + step.path, chips: clientId ? [idChip] : [] });
                if (cacheRedis && durable) M.push({ type: "call", from: "server", to: "cache", label: "lire (HIT)" });
                else if (durable) M.push({ type: "call", from: "server", to: "db", label: "find(…)" });
                else if (serverMem) M.push({ type: "note", at: "server", label: "depuis la mémoire (volatile)", tone: "muted" });
                let rc, note;
                if (durable) { rc = { nature: "list", size: "l", sizeText: step.listSize || "~2 Ko", fields: [{ k: step.listKey || "items", v: step.listVal || "[ … ]" }] }; note = cacheRedis ? "servi depuis Redis" : "historique durable"; }
                else if (serverMem) { rc = { nature: "list", size: "m", sizeText: "depuis le démarrage", fields: [{ k: step.listKey || "items", v: "[ … ]" }] }; note = "depuis le dernier démarrage"; }
                else { rc = { nature: "list", size: "s", sizeText: "0 élément", fields: [{ k: step.listKey || "items", v: "[ ]" }] }; note = "vide : rien n'est gardé"; }
                M.push({ type: "res", from: "server", to: "client", label: "200 OK", chips: [rc], note });
            }
        }
    });
    return { actors, messages: M };
}

const NatIcon = {
    "sid": <Ticket size={15} />,
    "ids": <ReceiptText size={15} />,
    "state": <FileBraces size={15} />,
    "collections": <Group size={15} />,
}

function ClientIcon({ t }) {
    if (t === "mobile") return <TabletSmartphone size={15} />;
    if (t === "sensor") return <MemoryStick size={15} />;
    return <AppWindow size={15} />;
}

function QIcon({ n }) {
    if (n === "need") return <ListTodo size={15} />;
    if (n === "store") return <Database size={15} />;
    if (n === "control") return <SlidersHorizontal size={15} />;
    if (n === "limit") return <Flag size={15} />
    if (n === "when") return <Target size={15} />
    return <Code size={15} />;
}

export default function PersistenceExplorer({ config }) {
    const C = config ?? defaultConfig;
    const ctIds = Object.keys(C.clientTypes);
    const [ctype, setCtype] = useState(ctIds[0]);
    const [cfg, setCfg] = useState({
        client: { on: false, mech: C.clientTypes[ctIds[0]].mechs[0].id },
        server: { on: false, mech: C.targets.find((t) => t.key === "server").mechs[0].id },
        db: { on: false, mech: C.targets.find((t) => t.key === "db").mechs[0].id },
        cache: { on: false, mech: C.targets.find((t) => t.key === "cache").mechs[0].id },
    });
    const [hover, setHover] = useState(null);
    const [pin, setPin] = useState(null);
    const [visible, setVisible] = useState(0);
    const [nonce, setNonce] = useState(0);
    const [focus, setFocus] = useState(null);

    const pickType = (t) => { setCtype(t); const m = C.clientTypes[t].mechs[0].id; setCfg((c) => ({ ...c, client: { ...c.client, mech: m } })); if (cfg.client.on) setFocus(m); };
    const toggle = (k) => { setCfg((c) => ({ ...c, [k]: { ...c[k], on: !c[k].on } })); setFocus(cfg[k].mech); };
    const setMech = (k, m) => { setCfg((c) => ({ ...c, [k]: { ...c[k], mech: m } })); setFocus(m); };

    const flow = buildFlow(cfg, ctype, C);
    const actors = flow.actors;
    const N = actors.length;
    const idx = Object.fromEntries(actors.map((a, i) => [a.key, i]));
    const xPct = (i) => ((i + 0.5) / N) * 100;
    const total = flow.messages.length;

    const cfgKey = ctype + JSON.stringify(cfg);
    useEffect(() => {
        setVisible(0);
        let i = 0;
        const id = setInterval(() => { i += 1; setVisible(i); if (i >= total) clearInterval(id); }, 560);
        return () => clearInterval(id);
    }, [cfgKey, total, nonce]);

    const HEAD = 50, ROW = 76, PAD = 84;
    const height = HEAD + total * ROW + PAD;
    const minW = Math.max(420, N * 158);

    const clientTarget = { key: "client", nom: "Client", mechs: C.clientTypes[ctype].mechs };
    const allTargets = [clientTarget, ...C.targets];
    const colHex = (c) => c === "var(--pf-accent)" ? "#0d9488" : c === "var(--pf-warn)" ? "#d97706" : "#6b6b80";
    const cons = focus ? C.considerations[focus] : null;

    return (
        <div className="pf">
            <p className="pf__scenario"><strong>Scénario.</strong> {C.scenarios[ctype].blurb} Le type de client change le scénario et les mécanismes disponibles.</p>

            <div className="pf__ctype">
                <span className="pf__ctype__lbl">Type de client</span>
                {ctIds.map((t) => (
                    <button key={t} className={"pf__ctbtn " + (ctype === t ? "on" : "")} onClick={() => pickType(t)}>
                        <ClientIcon t={C.clientTypes[t].icon} />{C.clientTypes[t].nom}
                    </button>
                ))}
            </div>

            <div className="pf__controls">
                {allTargets.map((t) => {
                    const c = cfg[t.key];
                    return (
                        <div key={t.key} className={"pf__target " + (c.on ? "on" : "")}>
                            <button className="pf__toggle" onClick={() => toggle(t.key)}>
                                <span className={"pf__box " + (c.on ? "checked" : "")}>{c.on ? "✓" : ""}</span>{t.nom}
                            </button>
                            {c.on && (
                                <>
                                    <div className="pf__mechs">
                                        {t.mechs.map((m) => (
                                            <button key={m.id} className={"pf__mech " + (c.mech === m.id ? "sel" : "") + (focus === m.id ? " foc" : "")} onClick={() => setMech(t.key, m.id)}>{m.nom}</button>
                                        ))}
                                    </div>
                                    <div className="pf__effet">{t.mechs.find((m) => m.id === c.mech).effet}</div>
                                </>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="pf__bar"><button className="pf__replay" onClick={() => setNonce((n) => n + 1)}><RotateCcw size={18} /> Rejouer l'animation</button></div>

            <div className="pf__split">
                <div className="pf__diagram">
                    <div className="pf__track" style={{ height, minWidth: minW }}>
                        {actors.map((a, i) => (
                            <div key={a.key} className="pf__lifeline" style={{ left: xPct(i) + "%" }}>
                                <div className={"pf__actor pf__actor--" + a.key}>
                                    {a.ctype && <span className="pf__cicon"><ClientIcon t={C.clientTypes[a.ctype].icon} /></span>}{a.nom}{a.badge && <span className="pf__memo">{a.badge}</span>}
                                </div>
                                <div className="pf__line" style={{ height: height - HEAD }} />
                            </div>
                        ))}

                        {flow.messages.map((m, r) => {
                            if (r >= visible) return null;

                            const y = HEAD + r * ROW;
                            const anim = r === visible - 1;

                            if (m.type === "note") {
                                const x = xPct(idx[m.at]);
                                return <div key={r} className={"pf__note " + (anim ? "pf__in" : "")} style={{ left: x + "%", top: y + 22, borderColor: TONE[m.tone] || TONE.muted, color: TONE[m.tone] || TONE.muted }}>{m.label}</div>;
                            }

                            const fi = idx[m.from], ti = idx[m.to];
                            const fx = xPct(fi), tx = xPct(ti);
                            const left = Math.min(fx, tx), w = Math.abs(tx - fx);
                            const right = tx > fx;
                            const mid = (fx + tx) / 2;
                            const internal = m.type === "call";
                            const colv = m.type === "req" ? "var(--pf-accent)" : internal ? "var(--pf-warn)" : "var(--pf-mut)";
                            const hex = colHex(colv);
                            const dashed = m.type === "res";

                            return (
                                <div className="pf__wrapper" key={r}>
                                    <div className={"pf__label " + (anim ? "pf__in" : "")} style={{ left: mid + "%", top: y + 2, color: colv }}>
                                        <span className="pf__method">{m.label}</span>
                                        {m.chips && m.chips.length > 0 && (
                                            <span className="pf__chips">
                                                {m.chips.map((c, ci) => {
                                                    const key = r + "_" + ci;
                                                    const open = hover === key || pin === key;
                                                    return (
                                                        <span key={ci} className="pf__chipwrap">
                                                            <button className="pf__chip"
                                                                onMouseEnter={() => setHover(key)} onMouseLeave={() => setHover((h) => (h === key ? null : h))}
                                                                onClick={() => setPin((p) => (p === key ? null : key))}>
                                                                {NatIcon[c.nature]}<span className="pf__bars">{[1, 2, 3].map((b) => <i key={b} className={b <= SN[c.size] ? "on" : ""} />)}</span>
                                                            </button>
                                                            {open && (
                                                                <span className="pf__pop">
                                                                    <span className="pf__pop__h">{NatIcon[c.nature]} {NAT[c.nature]} · {c.sizeText}</span>
                                                                    {c.fields.map((f, fi2) => (
                                                                        <span key={fi2} className="pf__pop__f"><span className="pf__pk">{f.k}</span>: <span style={{ color: f.tone ? TONE[f.tone] : "#c3e88d" }}>{f.v}</span></span>
                                                                    ))}
                                                                </span>
                                                            )}
                                                        </span>
                                                    );
                                                })}
                                            </span>
                                        )}
                                    </div>
                                    <div className={"pf__arrow " + (anim ? "pf__in" : "")} style={{ left: left + "%", width: w + "%", top: y + 48, borderTopColor: hex, borderTopStyle: dashed ? "dashed" : "solid" }}>
                                        <span className="pf__head" style={{ [right ? "right" : "left"]: -1, [right ? "borderLeft" : "borderRight"]: "7px solid " + hex }} />
                                        {anim && <span className={"pf__packet " + (right ? "r" : "l")} style={{ background: hex }} />}
                                    </div>
                                    {m.note && <div className={"pf__msgnote " + (anim ? "pf__in" : "")} style={{ left: mid + "%", top: y + 56 }}>{m.note}</div>}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <p className="pf__hint">
                    Icône (<FileBraces size={12} />) = <strong>nature</strong> du payload | Barres (<Signal size={12} />) = <strong>taille</strong> (survolez pour le détail).</p>

                <aside className="pf__aside">
                    <div className="pf__aside__t">Considérations</div>
                    {cons ? (
                        <>
                            <div className="pf__aside__nom">{cons.nom}</div>
                            {C.questions.map((q) => (
                                <div key={q.key} className={"pf__qa pf__qa--" + q.key}>
                                    <div className="pf__qhead">
                                        <span className="pf__qicon"><QIcon n={q.icon} /></span>
                                        <span className="pf__qtag">{q.tag}</span>
                                    </div>
                                    <div className="pf__q">{q.label}</div>
                                    <div className="pf__a">{cons[q.key]}</div>
                                </div>
                            ))}
                        </>
                    ) : (
                        <div className="pf__aside__empty">Activez une cible et cliquez une technologie (cookie, Redis, MongoDB…) pour afficher ce dont elle a besoin, ce qu'elle stocke, comment la contrôler, ses limites et quand l'utiliser.</div>
                    )}
                </aside>
            </div>
        </div>
    );
}