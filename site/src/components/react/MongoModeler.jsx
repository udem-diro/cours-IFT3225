import { useState, useCallback } from "react";
import { DragDropProvider, DragOverlay, useDraggable, useDroppable } from "@dnd-kit/react";

/**
 * MongoModeler
 *
 * Constructeur de modèle MongoDB + analyse de coût des endpoints.
 *
 *  1) MODÉLISER : glisser-déposer (via @dnd-kit/react) une entité dans une
 *     autre pour l'imbriquer ; cliquer une entité puis une seconde pour la
 *     lier (référence, affichée dans une section « Dépendances »).
 *
 *  2) COÛT : pour chaque endpoint de l'API, le panneau du bas calcule —
 *     EN FONCTION DU MODÈLE — le plan d'accès BD et son coût (lectures,
 *     $lookup, agrégation). Imbriquer rend certaines lectures gratuites ;
 *     référencer ajoute des $lookup ; interroger une entité imbriquée
 *     directement force une agrégation coûteuse. Le compromis, calculé.
 *
 * Dépendance : @dnd-kit/react (tire @dnd-kit/dom et @dnd-kit/abstract).
 */

const TYPES = {
  ObjectId: "#7c3aed", String: "#0d9488", Number: "#2563eb",
  Date: "#d97706", Boolean: "#dc2626", Array: "#0891b2", Object: "#9333ea",
};

const ENTITES = [
  { id: "boite", nom: "Boîte", coll: "boites", attrs: [
    { k: "nom", t: "String" }, { k: "quartier", t: "String" }, { k: "position", t: "Object" },
  ] },
  { id: "livre", nom: "Livre", coll: "livres", attrs: [
    { k: "titre", t: "String" }, { k: "auteur", t: "String" }, { k: "isbn", t: "String" },
  ] },
  { id: "evenement", nom: "Événement", coll: "evenements", attrs: [
    { k: "type", t: "String" }, { k: "date", t: "Date" },
  ] },
  { id: "utilisateur", nom: "Utilisateur", coll: "utilisateurs", attrs: [
    { k: "nom", t: "String" }, { k: "courriel", t: "String" },
  ] },
];
const ent = (id) => ENTITES.find((e) => e.id === id);

/* Endpoints de l'API. Chaque « traversal » est une relation à résoudre. */
const ENDPOINTS = [
  { id: "box-ev", method: "GET", path: "/boites/:id", desc: "Une boîte avec ses événements",
    root: "boite", traversals: [{ from: "boite", to: "evenement" }] },
  { id: "box-ev-livre", method: "GET", path: "/boites/:id", desc: "Une boîte, ses événements, et le livre de chacun",
    root: "boite", traversals: [{ from: "boite", to: "evenement" }, { from: "evenement", to: "livre" }] },
  { id: "box-quartier", method: "GET", path: "/boites?quartier=", desc: "Boîtes d'un quartier + nombre d'événements",
    root: "boite", filterOwn: true, traversals: [{ from: "boite", to: "evenement", agg: "count" }] },
  { id: "ev-recents", method: "GET", path: "/evenements/recents", desc: "Événements récents + leur livre + leur boîte",
    root: "evenement", traversals: [{ from: "evenement", to: "livre" }, { from: "evenement", to: "boite" }] },
  { id: "create-box", method: "POST", path: "/boites", desc: "Créer une boîte", root: "boite", write: true },
];

/* ── Logique de coût (pure) ─────────────────────────────── */
function makeModel(embeds, refs) {
  const isEmbed = (p, c) => embeds.some((e) => e.parent === p && e.child === c);
  const parentOf = (id) => { const e = embeds.find((x) => x.child === id); return e ? e.parent : null; };
  const standalone = (id) => !embeds.some((e) => e.child === id);
  const hasRef = (a, b) => refs.some((r) => (r.from === a && r.to === b) || (r.from === b && r.to === a));
  return { isEmbed, parentOf, standalone, hasRef };
}

function classify(from, to, m) {
  if (m.isEmbed(from, to)) return { kind: "inclus" };
  if (m.hasRef(from, to)) return m.standalone(to) ? { kind: "lookup" } : { kind: "aggregate", reason: `${ent(to).nom} vit dans ${ent(m.parentOf(to)).coll}` };
  return { kind: "absent" };
}

function planFor(ep, embeds, refs) {
  const m = makeModel(embeds, refs);
  if (ep.write) {
    return { verdict: "Écriture", reads: 0, lookups: 0, aggregate: false,
      steps: [{ t: `insertOne dans ${ent(ep.root).coll}`, k: "write" }, { t: "validation du schéma Mongoose", k: "plain" }] };
  }
  const steps = [];
  let lookups = 0, aggregate = false, absent = false;

  // Coût de la racine
  if (m.standalone(ep.root)) {
    steps.push({ t: `find sur ${ent(ep.root).coll}${ep.filterOwn ? " — filtre indexable" : ""}`, k: "read" });
  } else {
    const p = m.parentOf(ep.root);
    steps.push({ t: `aggregate sur ${ent(p).coll}`, k: "agg" });
    steps.push({ t: `$unwind ${ent(ep.root).coll} — « ${ent(ep.root).nom} » est imbriqué dans « ${ent(p).nom} »`, k: "agg" });
    aggregate = true;
  }

  // Coût de chaque traversée
  ep.traversals.forEach((tr) => {
    const c = classify(tr.from, tr.to, m);
    if (c.kind === "inclus") {
      steps.push({ t: tr.agg === "count" ? `compter ${ent(tr.to).nom} = longueur du tableau (inclus)` : `${ent(tr.to).nom} déjà dans le document`, k: "inclus" });
    } else if (c.kind === "lookup") {
      if (tr.agg === "count") { steps.push({ t: `$lookup ${ent(tr.to).coll} + $size`, k: "agg" }); aggregate = true; }
      else { steps.push({ t: `$lookup ${ent(tr.to).coll}`, k: "lookup" }); }
      lookups += 1;
    } else if (c.kind === "aggregate") {
      steps.push({ t: `agréger pour ${ent(tr.to).nom} (${c.reason})`, k: "agg" });
      aggregate = true;
    } else {
      steps.push({ t: `lien ${ent(tr.from).nom} → ${ent(tr.to).nom} non modélisé`, k: "absent" });
      absent = true;
    }
  });

  let verdict;
  if (absent) verdict = "Non modélisé";
  else if (aggregate) verdict = "Coûteux";
  else if (lookups > 0) verdict = "Modéré";
  else verdict = "Économique";

  return { verdict, reads: 1, lookups, aggregate, steps };
}

const VERDICT = {
  "Économique": { c: "#16a34a", bg: "#f0fdf4", b: "#bbf7d0" },
  "Modéré": { c: "#d97706", bg: "#fffbeb", b: "#fde68a" },
  "Coûteux": { c: "#dc2626", bg: "#fef2f2", b: "#fecaca" },
  "Non modélisé": { c: "#6b6b80", bg: "#f8f7f4", b: "#e2e0db" },
  "Écriture": { c: "#2563eb", bg: "#eff6ff", b: "#bfdbfe" },
};

/* ── Carte d'entité (display) ───────────────────────────── */
function CardBody({ id, nested, embeds, refs, handlers, renderChild }) {
  const e = ent(id);
  const myRefs = refs.filter((r) => r.from === id);
  const myEmbeds = embeds.filter((em) => em.parent === id);
  return (
    <>
      <div className="mm-card__head">
        <span className="mm-card__name">{e.nom}</span>
        <span className="mm-card__coll">{e.coll}</span>
        {!nested && <span className="mm-card__grip" title="Glisser dans une autre entité">⠿</span>}
      </div>
      <div className="mm-sec">
        <div className="mm-sec__lbl">Attributs</div>
        <div className="mm-row"><span className="mm-k">_id</span><span className="mm-t" style={{ color: TYPES.ObjectId, borderColor: TYPES.ObjectId }}>ObjectId</span></div>
        {e.attrs.map((a) => (
          <div key={a.k} className="mm-row"><span className="mm-k">{a.k}</span><span className="mm-t" style={{ color: TYPES[a.t], borderColor: TYPES[a.t] }}>{a.t}</span></div>
        ))}
      </div>
      {myRefs.length > 0 && (
        <div className="mm-sec mm-sec--dep">
          <div className="mm-sec__lbl">Dépendances</div>
          {myRefs.map((r) => {
            const fname = r.card === "N" ? r.to + "_ids" : r.to + "_id";
            const ftype = r.card === "N" ? "Array" : "ObjectId";
            return (
              <div key={r.to} className="mm-row mm-row--dep">
                <span className="mm-k">{fname}</span>
                <span className="mm-t" style={{ color: TYPES[ftype], borderColor: TYPES[ftype] }}>{ftype}</span>
                <span className="mm-arrow">→ {ent(r.to).coll}</span>
                {!nested && (
                  <span className="mm-mini-grp" onPointerDown={(ev) => ev.stopPropagation()} onClick={(ev) => ev.stopPropagation()}>
                    <button className="mm-card-toggle" onClick={() => handlers.flipRef(r.from, r.to)} title="Cardinalité">{r.card}</button>
                    <button className="mm-x" onClick={() => handlers.unRef(r.from, r.to)} title="Retirer le lien">×</button>
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
      {myEmbeds.length > 0 && (
        <div className="mm-sec mm-sec--emb">
          <div className="mm-sec__lbl">Imbriqué ({myEmbeds.length})</div>
          {myEmbeds.map((em) => {
            const child = ent(em.child);
            const fname = em.card === "N" ? child.coll : child.id;
            const ftype = em.card === "N" ? "Array" : "Object";
            return (
              <div key={em.child} className="mm-embed-wrap">
                <div className="mm-embed-field">
                  <span className="mm-k">{fname}</span>
                  <span className="mm-t" style={{ color: TYPES[ftype], borderColor: TYPES[ftype] }}>{ftype}</span>
                  {!nested && (
                    <span className="mm-mini-grp" onPointerDown={(ev) => ev.stopPropagation()} onClick={(ev) => ev.stopPropagation()}>
                      <button className="mm-card-toggle" onClick={() => handlers.flipEmbed(em.child)} title="Cardinalité">{em.card}</button>
                      <button className="mm-x" onClick={() => handlers.unEmbed(em.child)} title="Sortir de l'imbrication">×</button>
                    </span>
                  )}
                </div>
                {renderChild(em.child)}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

/* Carte racine : draggable + droppable via @dnd-kit/react */
function DraggableCard({ id, activeId, canEmbed, linkFrom, embeds, refs, handlers, renderChild }) {
  const { ref: dragRef, isDragging } = useDraggable({ id });
  const { ref: dropRef, isDropTarget } = useDroppable({ id });
  const setRef = useCallback((node) => { dragRef(node); dropRef(node); }, [dragRef, dropRef]);

  const valid = activeId && activeId !== id && canEmbed(id, activeId);
  const over = isDropTarget && activeId && activeId !== id;
  const invalidOver = over && !canEmbed(id, activeId);

  let cls = "mm-card";
  if (isDragging) cls += " mm-card--dragging";
  if (valid && !over) cls += " mm-card--droppable";
  if (over && valid) cls += " mm-card--drophover";
  if (invalidOver) cls += " mm-card--nodrop";
  if (activeId && !isDragging && !valid && !over) cls += " mm-card--inactive";
  if (linkFrom === id) cls += " mm-card--linksel";

  return (
    <div ref={setRef} className={cls} onClick={() => handlers.click(id)}>
      {over && valid && <div className="mm-drop-overlay mm-drop-overlay--ok"><span>↓ Imbriquer dans <b>{ent(id).nom}</b></span></div>}
      {invalidOver && <div className="mm-drop-overlay mm-drop-overlay--no"><span>Imbrication impossible (cycle)</span></div>}
      <CardBody id={id} nested={false} embeds={embeds} refs={refs} handlers={handlers} renderChild={renderChild} />
    </div>
  );
}

export default function MongoModeler() {
  const [embeds, setEmbeds] = useState([]);
  const [refs, setRefs] = useState([]);
  const [linkFrom, setLinkFrom] = useState(null);
  const [activeId, setActiveId] = useState(null);

  function descendants(id, set) {
    embeds.filter((e) => e.parent === id).forEach((e) => { if (!set.has(e.child)) { set.add(e.child); descendants(e.child, set); } });
    return set;
  }
  const canEmbed = (parent, child) => parent !== child && !descendants(child, new Set()).has(parent);

  function doEmbed(parent, child) {
    if (!canEmbed(parent, child)) return;
    setEmbeds((es) => [...es.filter((e) => e.child !== child), { parent, child, card: "N" }]);
    setLinkFrom(null);
  }
  const handlers = {
    click: (id) => {
      setLinkFrom((lf) => {
        if (lf === null) return id;
        if (lf === id) return null;
        setRefs((rs) => rs.some((r) => r.from === lf && r.to === id) ? rs : [...rs, { from: lf, to: id, card: "1" }]);
        return null;
      });
    },
    unRef: (from, to) => setRefs((rs) => rs.filter((r) => !(r.from === from && r.to === to))),
    unEmbed: (child) => setEmbeds((es) => es.filter((e) => e.child !== child)),
    flipRef: (from, to) => setRefs((rs) => rs.map((r) => r.from === from && r.to === to ? { ...r, card: r.card === "N" ? "1" : "N" } : r)),
    flipEmbed: (child) => setEmbeds((es) => es.map((e) => e.child === child ? { ...e, card: e.card === "N" ? "1" : "N" } : e)),
  };
  function tout() { setEmbeds([]); setRefs([]); setLinkFrom(null); }

  const embeddedSet = new Set(embeds.map((e) => e.child));
  const topLevel = ENTITES.filter((e) => !embeddedSet.has(e.id));

  const renderChild = (id) => (
    <div className="mm-card mm-card--nested">
      <CardBody id={id} nested={true} embeds={embeds} refs={refs} handlers={handlers} renderChild={renderChild} />
    </div>
  );

  return (
    <div className="mm">
      <style>{CSS}</style>

      <div className="mm-instructions">
        <span><b>Regrouper</b> : glissez une entité <em>dans</em> une autre (imbrication).</span>
        <span><b>Lier</b> : cliquez une entité, puis une seconde (référence).</span>
      </div>

      {linkFrom && !activeId && (
        <div className="mm-linkbar">
          Liaison depuis <b>{ent(linkFrom).nom}</b> — cliquez l'entité à lier, ou
          <button onClick={() => setLinkFrom(null)}>annuler</button>
        </div>
      )}

      <DragDropProvider
        onDragStart={(event) => setActiveId(event.operation?.source?.id ?? null)}
        onDragEnd={(event) => {
          setActiveId(null);
          if (event.canceled) return;
          const s = event.operation?.source;
          const t = event.operation?.target;
          if (s && t && s.id !== t.id) doEmbed(t.id, s.id);
        }}
      >
        <div className="mm-canvas">
          {topLevel.map((e) => (
            <DraggableCard key={e.id} id={e.id} activeId={activeId} canEmbed={canEmbed}
              linkFrom={linkFrom} embeds={embeds} refs={refs} handlers={handlers} renderChild={renderChild} />
          ))}
        </div>
        <DragOverlay>
          {activeId ? (
            <div className="mm-card mm-card--overlay"><CardBody id={activeId} nested={false} embeds={embeds} refs={refs} handlers={handlers} renderChild={() => null} /></div>
          ) : null}
        </DragOverlay>
      </DragDropProvider>

      {(embeds.length > 0 || refs.length > 0) && (
        <button className="mm-reset" onClick={tout}>Tout réinitialiser</button>
      )}

      {/* Panneau de coût des endpoints */}
      {/* <div className="mm-cost">
        <div className="mm-cost__head">Coût des endpoints, selon votre modèle</div>
        <div className="mm-cost__grid">
          {ENDPOINTS.map((ep) => {
            const plan = planFor(ep, embeds, refs);
            const v = VERDICT[plan.verdict];
            return (
              <div key={ep.id} className="mm-ep" style={{ borderColor: v.b }}>
                <div className="mm-ep__top">
                  <span className={"mm-ep__method mm-ep__method--" + ep.method.toLowerCase()}>{ep.method}</span>
                  <code className="mm-ep__path">{ep.path}</code>
                  <span className="mm-ep__verdict" style={{ color: v.c, background: v.bg, borderColor: v.b }}>{plan.verdict}</span>
                </div>
                <div className="mm-ep__desc">{ep.desc}</div>
                <div className="mm-ep__steps">
                  {plan.steps.map((s, i) => (
                    <div key={i} className={"mm-step mm-step--" + s.k}>
                      <span className="mm-step__dot" />{s.t}
                    </div>
                  ))}
                </div>
                {!ep.write && (
                  <div className="mm-ep__metrics">
                    <span>{plan.reads} lecture racine</span>
                    <span className={plan.lookups ? "on" : ""}>{plan.lookups} $lookup</span>
                    <span className={plan.aggregate ? "on" : ""}>{plan.aggregate ? "agrégation" : "pas d'agrégation"}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <p className="mm-cost__note">Modifiez le modèle ci-dessus : imbriquez les événements dans les boîtes, ou liez-les — et observez le coût de chaque endpoint changer.</p>
      </div> */}
    </div>
  );
}

const CSS = `
.mm {
  --mm-accent: #0d9488; --mm-b: #e2e0db; --mm-bg: #fff; --mm-raised: #f8f7f4;
  --mm-text: #1a1a2e; --mm-mut: #6b6b80; --mm-ref: #7c3aed;
  font-family: 'DM Sans', system-ui, sans-serif; color: var(--mm-text);
  border: 1px solid var(--mm-b); border-radius: 16px; padding: 18px;
  background: var(--mm-bg); max-width: 820px; margin: 2rem auto; font-variant-ligatures: none;
}
.mm * { box-sizing: border-box; }

.mm-instructions { display: flex; flex-wrap: wrap; gap: 16px; font-size: 0.8rem; color: var(--mm-mut); margin-bottom: 14px; }
.mm-instructions b { color: var(--mm-text); } .mm-instructions em { font-style: italic; }

.mm-linkbar { display: flex; align-items: center; gap: 8px; font-size: 0.82rem; background: color-mix(in srgb, var(--mm-ref) 9%, transparent); border: 1px solid color-mix(in srgb, var(--mm-ref) 35%, transparent); border-radius: 8px; padding: 8px 12px; margin-bottom: 14px; }
.mm-linkbar button { font: inherit; font-size: 0.78rem; border: none; background: var(--mm-ref); color: #fff; border-radius: 6px; padding: 3px 10px; cursor: pointer; }

.mm-canvas { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; align-items: start; }

.mm-card { position: relative; border: 1.5px solid var(--mm-b); border-radius: 12px; background: var(--mm-bg); overflow: hidden; cursor: grab; transition: border-color .15s, box-shadow .18s, transform .18s, opacity .18s; touch-action: none; }
.mm-card:active { cursor: grabbing; }
.mm-card:not(.mm-card--nested):hover { border-color: var(--mm-accent); }
.mm-card--linksel { border-color: var(--mm-ref); box-shadow: 0 0 0 3px color-mix(in srgb, var(--mm-ref) 16%, transparent); }
.mm-card--nested { margin-top: 6px; cursor: default; border-style: dashed; border-color: color-mix(in srgb, var(--mm-accent) 45%, transparent); background: color-mix(in srgb, var(--mm-accent) 4%, transparent); touch-action: auto; }
.mm-card--dragging { opacity: 0.4; border-style: dashed; }
.mm-card--inactive { opacity: 0.5; }
.mm-card--droppable { border-color: var(--mm-accent); border-style: dashed; box-shadow: 0 0 0 2px color-mix(in srgb, var(--mm-accent) 14%, transparent); }
.mm-card--drophover { border-color: var(--mm-accent); box-shadow: 0 0 0 4px color-mix(in srgb, var(--mm-accent) 26%, transparent), 0 8px 20px rgba(13,148,136,0.18); transform: translateY(-2px) scale(1.01); }
.mm-card--nodrop { border-color: #dc2626; box-shadow: 0 0 0 3px color-mix(in srgb, #dc2626 18%, transparent); }
.mm-card--overlay { cursor: grabbing; box-shadow: 0 12px 30px rgba(0,0,0,0.22); transform: rotate(-1.5deg); width: 360px; max-width: 80vw; }

.mm-drop-overlay { position: absolute; inset: 0; z-index: 3; pointer-events: none; display: flex; align-items: center; justify-content: center; text-align: center; border-radius: 11px; font-size: 0.84rem; font-weight: 600; padding: 10px; }
.mm-drop-overlay--ok { background: color-mix(in srgb, var(--mm-accent) 26%, transparent); color: #06443f; }
.mm-drop-overlay--ok b { font-family: 'Fraunces', Georgia, serif; }
.mm-drop-overlay--no { background: color-mix(in srgb, #dc2626 18%, transparent); color: #7f1d1d; }

.mm-card__head { display: flex; align-items: center; gap: 8px; padding: 9px 12px; background: var(--mm-raised); border-bottom: 1px solid var(--mm-b); }
.mm-card--nested .mm-card__head { background: transparent; }
.mm-card__name { font-family: 'Fraunces', Georgia, serif; font-weight: 700; font-size: 0.95rem; }
.mm-card__coll { font-family: 'JetBrains Mono', monospace; font-size: 0.66rem; color: var(--mm-accent); }
.mm-card__coll::before { content: "db."; opacity: 0.5; }
.mm-card__grip { margin-left: auto; color: var(--mm-mut); font-size: 0.9rem; }

.mm-sec { padding: 8px 12px; }
.mm-sec + .mm-sec { border-top: 1px dashed var(--mm-b); }
.mm-sec__lbl { font-size: 0.6rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--mm-mut); margin-bottom: 5px; }
.mm-sec--dep .mm-sec__lbl { color: var(--mm-ref); }
.mm-sec--emb .mm-sec__lbl { color: var(--mm-accent); }

.mm-row { display: flex; align-items: center; gap: 8px; padding: 2px 0; font-family: 'JetBrains Mono', monospace; font-size: 0.74rem; }
.mm-k { color: var(--mm-text); }
.mm-t { font-size: 0.6rem; font-weight: 700; padding: 0 6px; border-radius: 4px; border: 1px solid; margin-left: auto; }
.mm-arrow { font-size: 0.62rem; color: var(--mm-ref); }

.mm-mini-grp { display: inline-flex; gap: 3px; }
.mm-card-toggle { font: inherit; font-family: 'JetBrains Mono', monospace; font-size: 0.62rem; font-weight: 700; width: 18px; height: 18px; border: 1px solid var(--mm-b); background: var(--mm-bg); color: var(--mm-mut); border-radius: 4px; cursor: pointer; }
.mm-x { font: inherit; width: 18px; height: 18px; border: none; background: rgba(0,0,0,0.06); color: var(--mm-mut); border-radius: 4px; cursor: pointer; font-size: 0.85rem; line-height: 1; }
.mm-embed-field { display: flex; align-items: center; gap: 8px; font-family: 'JetBrains Mono', monospace; font-size: 0.74rem; padding: 2px 0; }
.mm-embed-wrap + .mm-embed-wrap { margin-top: 8px; }

.mm-reset { margin-top: 14px; font: inherit; font-size: 0.76rem; color: var(--mm-mut); background: none; border: none; cursor: pointer; text-decoration: underline; }

/* Panneau de coût */
.mm-cost { margin-top: 20px; border-top: 2px solid var(--mm-b); padding-top: 16px; }
.mm-cost__head { font-family: 'Fraunces', Georgia, serif; font-weight: 700; font-size: 1.05rem; margin-bottom: 12px; }
.mm-cost__grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.mm-ep { border: 1.5px solid var(--mm-b); border-radius: 12px; padding: 12px; background: var(--mm-bg); }
.mm-ep__top { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; flex-wrap: wrap; }
.mm-ep__method { font-family: 'JetBrains Mono', monospace; font-size: 0.62rem; font-weight: 700; padding: 2px 7px; border-radius: 5px; }
.mm-ep__method--get { background: #eaf3de; color: #27500a; }
.mm-ep__method--post { background: #e6f1fb; color: #0c447c; }
.mm-ep__path { font-family: 'JetBrains Mono', monospace; font-size: 0.74rem; color: var(--mm-text); }
.mm-ep__verdict { margin-left: auto; font-size: 0.64rem; font-weight: 700; padding: 2px 8px; border-radius: 100px; border: 1px solid; }
.mm-ep__desc { font-size: 0.78rem; color: var(--mm-mut); margin-bottom: 8px; line-height: 1.4; }
.mm-ep__steps { display: flex; flex-direction: column; gap: 3px; margin-bottom: 8px; }
.mm-step { display: flex; align-items: baseline; gap: 7px; font-family: 'JetBrains Mono', monospace; font-size: 0.7rem; color: var(--mm-text); line-height: 1.35; }
.mm-step__dot { flex-shrink: 0; width: 6px; height: 6px; border-radius: 50%; margin-top: 4px; background: var(--mm-mut); }
.mm-step--inclus .mm-step__dot { background: #16a34a; }
.mm-step--read .mm-step__dot, .mm-step--write .mm-step__dot { background: var(--mm-accent); }
.mm-step--lookup .mm-step__dot { background: #d97706; }
.mm-step--agg .mm-step__dot { background: #dc2626; }
.mm-step--absent { color: #dc2626; font-style: italic; }
.mm-step--absent .mm-step__dot { background: #dc2626; }
.mm-ep__metrics { display: flex; flex-wrap: wrap; gap: 6px; }
.mm-ep__metrics span { font-size: 0.64rem; color: var(--mm-mut); background: var(--mm-raised); border-radius: 5px; padding: 2px 7px; }
.mm-ep__metrics span.on { color: #d97706; background: #fffbeb; font-weight: 600; }
.mm-cost__note { font-size: 0.78rem; color: var(--mm-mut); font-style: italic; margin: 12px 0 0; line-height: 1.5; }

@media (max-width: 640px) {
  .mm-canvas, .mm-cost__grid { grid-template-columns: 1fr; }
}
`;