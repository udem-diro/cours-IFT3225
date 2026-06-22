import { useState, useMemo } from "react";

/**
 * TodoInspector
 *
 * Inspecteur pédagogique, dans l'esprit du DomInspector. À gauche, un rendu.
 * À droite, le balisage correspondant. Survoler un élément d'un côté surligne
 * son jumeau de l'autre ; cliquer ouvre un panneau qui détaille le rôle de
 * l'élément et le relie au script.
 *
 * Prop `which` : "task" (anatomie d'une tâche, par défaut) ou "layout"
 * (la coquille de l'application).
 *
 * Usage (Astro island) :
 *   <TodoInspector which="layout" client:visible />
 *   <TodoInspector which="task" client:visible />
 */

const TASK_TREE = {
  id: "li",
  tag: "li",
  attrs: { class: "todo-item" },
  role: "La tâche entière. Elle porte data-id (quelle tâche), data-status (pour la couleur de bordure) et la classe is-done quand la tâche est complétée.",
  children: [
    {
      id: "check",
      tag: "input",
      void: true,
      attrs: { class: "todo-item__check", type: "checkbox" },
      role: "Case de complétion. Son événement change bascule completed dans l'état, puis on re-rend ; le rendu pose alors la classe is-done.",
    },
    {
      id: "body",
      tag: "div",
      attrs: { class: "todo-item__body" },
      role: "Conteneur du contenu (titre et métadonnées), séparé visuellement des boutons d'action.",
      children: [
        {
          id: "title",
          tag: "span",
          attrs: { class: "todo-item__title" },
          text: "Préparer la démo",
          role: "Le titre. Éditable en ligne : un double-clic le rend modifiable (contentEditable), la sortie du champ (blur) valide et met à jour l'état.",
        },
        {
          id: "meta",
          tag: "div",
          attrs: { class: "todo-item__meta" },
          role: "Regroupe les métadonnées sous le titre : statut, date limite, tags.",
          children: [
            {
              id: "status",
              tag: "select",
              attrs: { class: "todo-item__status" },
              text: "en cours",
              role: "Le statut, parmi trois options (à faire, en cours, terminé). Son événement change met à jour status dans l'état ; la valeur est aussi copiée dans data-status pour la couleur.",
            },
            {
              id: "due",
              tag: "span",
              attrs: { class: "todo-item__due" },
              text: "2026-06-25",
              role: "La date limite. Au rendu, reçoit la classe is-late si elle est dépassée et que la tâche n'est pas complétée. Retirée du DOM si aucune date.",
            },
            {
              id: "tags",
              tag: "span",
              attrs: { class: "todo-item__tags" },
              role: "Conteneur des tags, vide dans le gabarit. Le rendu le remplit de petites pastilles à partir du tableau tags de la tâche.",
            },
          ],
        },
      ],
    },
    {
      id: "actions",
      tag: "div",
      attrs: { class: "todo-item__actions" },
      role: "Regroupe les boutons d'action, alignés à droite.",
      children: [
        {
          id: "dup",
          tag: "button",
          attrs: { "data-action": "duplicate" },
          text: "\u29C9",
          role: "Dupliquer. L'écouteur de clic, délégué sur la liste, lit data-action et passe l'action à actionHandler, qui insère une copie de la tâche.",
        },
        {
          id: "del",
          tag: "button",
          attrs: { "data-action": "delete" },
          text: "\u00D7",
          role: "Supprimer. Même principe : data-action est lu, puis actionHandler retire la tâche de l'état.",
        },
      ],
    },
  ],
};

const LAYOUT_TREE = {
  id: "section",
  tag: "section",
  attrs: { class: "todo" },
  role: "Le conteneur de l'application.",
  children: [
    {
      id: "header",
      tag: "header",
      attrs: { class: "todo__head" },
      role: "L'en-tête : le titre et le formulaire d'ajout.",
      children: [
        {
          id: "h3title",
          tag: "h3",
          attrs: { class: "todo__title" },
          text: "Todos",
          role: "Le titre de l'application.",
        },
        {
          id: "form",
          tag: "form",
          attrs: { class: "todo__add", id: "todo-add" },
          role: "Le formulaire d'ajout. Son événement submit crée une tâche ; FormData lit les champs par leur attribut name.",
          children: [
            {
              id: "inTitle",
              tag: "input",
              void: true,
              attrs: { name: "title", type: "text" },
              role: "Le titre de la nouvelle tâche, lu par FormData via name=\"title\". L'attribut required (non montré ici) empêche un envoi vide.",
            },
            {
              id: "inTags",
              tag: "input",
              void: true,
              attrs: { name: "tags", type: "text" },
              role: "Les tags, séparés par des virgules, découpés en tableau à la création.",
            },
            {
              id: "inDate",
              tag: "input",
              void: true,
              attrs: { name: "dueDate", type: "date" },
              role: "La date limite, via le sélecteur de date natif.",
            },
            {
              id: "submit",
              tag: "button",
              attrs: { type: "submit" },
              text: "Ajouter",
              role: "Envoie le formulaire, ce qui déclenche l'événement submit.",
            },
          ],
        },
      ],
    },
    {
      id: "list",
      tag: "ul",
      attrs: { class: "todo__list", id: "todo-list" },
      role: "La liste, vide dans le HTML. Le rendu y insère les tâches, et elle porte les écouteurs délégués (click, change).",
    },
    {
      id: "empty",
      tag: "p",
      attrs: { class: "todo__empty", id: "todo-empty" },
      text: "Aucune tâche.",
      role: "Message d'état vide, masqué dès qu'il y a au moins une tâche.",
    },
  ],
};

function flatten(node, acc = {}, parent = null, depth = 0) {
  acc[node.id] = { ...node, parent, depth };
  (node.children || []).forEach((c) => flatten(c, acc, node.id, depth + 1));
  return acc;
}

export default function TodoInspector({ which = "task" }) {
  const tree = which === "layout" ? LAYOUT_TREE : TASK_TREE;
  const flat = useMemo(() => flatten(tree), [tree]);

  const [hovered, setHovered] = useState(null);
  const [selected, setSelected] = useState(null);
  const active = hovered || selected;

  const bind = (id) => ({
    onMouseEnter: () => setHovered(id),
    onMouseLeave: () => setHovered(null),
    onClick: (e) => { e.preventDefault(); setSelected(id); },
    "data-on": active === id ? "1" : undefined,
  });

  function renderTaskVisual() {
    return (
      <div className="ti-item" data-status="in-progress" {...bind("li")}>
        <span className="ti-check" {...bind("check")} aria-hidden="true"></span>
        <div className="ti-body" {...bind("body")}>
          <span className="ti-title" {...bind("title")}>Préparer la démo</span>
          <div className="ti-meta" {...bind("meta")}>
            <span className="ti-status" {...bind("status")}>en cours</span>
            <span className="ti-due" {...bind("due")}>{"\u{1F4C5}"} 2026-06-25</span>
            <span className="ti-tags" {...bind("tags")}>
              <span className="ti-tag">cours</span>
            </span>
          </div>
        </div>
        <div className="ti-actions" {...bind("actions")}>
          <span className="ti-btn" {...bind("dup")}>{"\u29C9"}</span>
          <span className="ti-btn ti-btn--del" {...bind("del")}>{"\u00D7"}</span>
        </div>
      </div>
    );
  }

  function renderLayoutVisual() {
    return (
      <div className="ti-shell" {...bind("section")}>
        <div className="ti-shell__head" {...bind("header")}>
          <span className="ti-shell__title" {...bind("h3title")}>Todos</span>
          <div className="ti-shell__form" {...bind("form")}>
            <span className="ti-field" {...bind("inTitle")}>Nouvelle tâche</span>
            <span className="ti-field" {...bind("inTags")}>tags</span>
            <span className="ti-field ti-field--date" {...bind("inDate")}>jj / mm</span>
            <span className="ti-submit" {...bind("submit")}>Ajouter</span>
          </div>
        </div>
        <div className="ti-shell__list" {...bind("list")}>la liste (remplie par le rendu)</div>
        <div className="ti-shell__empty" {...bind("empty")}>Aucune tâche.</div>
      </div>
    );
  }

  function renderNode(node, depth = 0) {
    const isActive = active === node.id;
    const pad = { paddingLeft: depth * 14 + 8 + "px" };
    const rowClass = "ti-row" + (isActive ? " ti-row--active" : "");
    const b = {
      onMouseEnter: () => setHovered(node.id),
      onMouseLeave: () => setHovered(null),
      onClick: () => setSelected(node.id),
    };
    const attrsStr = node.attrs
      ? Object.entries(node.attrs).map(([k, v]) => (
          <span key={k}>
            {" "}
            <span className="ti-attr-name">{k}</span>
            <span className="ti-punct">=</span>
            <span className="ti-attr-val">"{v}"</span>
          </span>
        ))
      : null;
    const hasChildren = node.children && node.children.length > 0;

    if (node.void) {
      return (
        <div key={node.id} className={rowClass} style={pad} {...b}>
          <span className="ti-punct">&lt;</span>
          <span className="ti-tag">{node.tag}</span>
          {attrsStr}
          <span className="ti-punct"> /&gt;</span>
        </div>
      );
    }

    if (!hasChildren) {
      return (
        <div key={node.id} className={rowClass} style={pad} {...b}>
          <span className="ti-punct">&lt;</span>
          <span className="ti-tag">{node.tag}</span>
          {attrsStr}
          <span className="ti-punct">&gt;</span>
          {node.text && <span className="ti-text">{node.text}</span>}
          <span className="ti-punct">&lt;/</span>
          <span className="ti-tag">{node.tag}</span>
          <span className="ti-punct">&gt;</span>
        </div>
      );
    }

    return (
      <div key={node.id}>
        <div className={rowClass} style={pad} {...b}>
          <span className="ti-punct">&lt;</span>
          <span className="ti-tag">{node.tag}</span>
          {attrsStr}
          <span className="ti-punct">&gt;</span>
        </div>
        {node.children.map((c) => renderNode(c, depth + 1))}
        <div className={rowClass} style={pad} {...b}>
          <span className="ti-punct">&lt;/</span>
          <span className="ti-tag">{node.tag}</span>
          <span className="ti-punct">&gt;</span>
        </div>
      </div>
    );
  }

  function renderDetails() {
    if (!selected) {
      return (
        <div className="ti-details ti-details--empty">
          Survolez un élément pour le repérer des deux côtés. Cliquez pour lire son rôle.
        </div>
      );
    }
    const n = flat[selected];
    const sel = n.attrs?.class
      ? "." + n.attrs.class.split(" ").slice(-1)[0]
      : n.attrs?.["data-action"]
      ? `[data-action="${n.attrs["data-action"]}"]`
      : n.attrs?.name
      ? `[name="${n.attrs.name}"]`
      : n.tag;

    return (
      <div className="ti-details">
        <div className="ti-details__head">
          <code className="ti-details__tag">&lt;{n.tag}&gt;</code>
          <code className="ti-details__sel">{sel}</code>
        </div>
        <p className="ti-details__role">{n.role}</p>
      </div>
    );
  }

  const treeLabel = which === "layout" ? "Structure" : "Gabarit";

  return (
    <div className="ti">
      <style>{CSS}</style>
      <div className="ti-grid">
        <div className="ti-pane">
          <div className="ti-pane__head">Rendu</div>
          <div className="ti-visual">
            {which === "layout" ? renderLayoutVisual() : renderTaskVisual()}
          </div>
        </div>
        <div className="ti-pane">
          <div className="ti-pane__head">{treeLabel}</div>
          <div className="ti-tree">{renderNode(tree)}</div>
        </div>
      </div>
      {renderDetails()}
    </div>
  );
}

const CSS = `
.ti {
  --ti-accent:#0d9488; --ti-b:#e2e0db; --ti-bg:#fff; --ti-raised:#f8f7f4;
  --ti-text:#1a1a2e; --ti-mut:#6b6b80; --ti-blue:#3b6fca;
  font-family:'DM Sans',system-ui,sans-serif; color:var(--ti-text);
  border:1px solid var(--ti-b); border-radius:16px; padding:18px;
  background:var(--ti-bg); max-width:760px; margin:2rem auto;
}
.ti * { box-sizing:border-box; }
.ti-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
.ti-pane { border:1px solid var(--ti-b); border-radius:12px; overflow:hidden; background:var(--ti-raised); }
.ti-pane__head {
  font-size:0.68rem; font-weight:700; text-transform:uppercase; letter-spacing:0.06em;
  color:var(--ti-mut); padding:8px 12px; border-bottom:1px solid var(--ti-b); background:var(--ti-bg);
}
.ti-visual { padding:18px 14px; display:flex; align-items:center; justify-content:center; min-height:170px; }
.ti-visual [data-on="1"], .ti-row--active { outline:2px solid var(--ti-accent); outline-offset:2px; border-radius:5px; }

/* tâche rendue */
.ti-item {
  display:flex; align-items:flex-start; gap:10px; width:100%;
  background:var(--ti-bg); border:1px solid var(--ti-b); border-left:3px solid var(--ti-blue);
  border-radius:10px; padding:11px 12px;
}
.ti-check { width:16px; height:16px; border:2px solid var(--ti-mut); border-radius:4px; flex-shrink:0; margin-top:2px; cursor:pointer; display:block; }
.ti-body { flex:1; min-width:0; }
.ti-title { display:inline-block; font-size:0.92rem; font-weight:600; cursor:pointer; }
.ti-meta { display:flex; flex-wrap:wrap; align-items:center; gap:7px; margin-top:6px; }
.ti-status {
  font-size:0.72rem; font-weight:600; color:var(--ti-blue);
  border:1px solid color-mix(in srgb,var(--ti-blue) 35%,var(--ti-b));
  background:color-mix(in srgb,var(--ti-blue) 10%,var(--ti-bg));
  padding:1px 8px; border-radius:6px; cursor:pointer;
}
.ti-due { font-size:0.74rem; color:var(--ti-mut); cursor:pointer; }
.ti-tags { display:inline-flex; gap:5px; cursor:pointer; }
.ti-tag {
  font-size:0.68rem; font-weight:600; color:var(--ti-accent);
  background:color-mix(in srgb,var(--ti-accent) 12%,var(--ti-bg));
  border:1px solid color-mix(in srgb,var(--ti-accent) 30%,var(--ti-b));
  padding:1px 7px; border-radius:20px;
}
.ti-actions { display:flex; gap:4px; flex-shrink:0; }
.ti-btn { width:26px; height:26px; display:flex; align-items:center; justify-content:center; border:1px solid var(--ti-b); border-radius:7px; color:var(--ti-mut); font-size:0.95rem; cursor:pointer; }

/* coquille rendue (layout) */
.ti-shell { width:100%; }
.ti-shell__head { border:1px solid var(--ti-b); border-radius:10px; padding:12px; background:var(--ti-bg); }
.ti-shell__title { font-family:'Fraunces',serif; font-size:1rem; font-weight:700; display:inline-block; cursor:pointer; }
.ti-shell__form { display:flex; flex-wrap:wrap; gap:6px; margin-top:10px; }
.ti-field {
  flex:1 1 90px; font-size:0.76rem; color:var(--ti-mut); border:1px solid var(--ti-b);
  border-radius:7px; padding:6px 9px; background:var(--ti-raised); cursor:pointer;
}
.ti-field--date { flex:0 0 auto; }
.ti-submit {
  font-size:0.78rem; font-weight:600; color:#fff; background:var(--ti-accent);
  border:1px solid var(--ti-accent); border-radius:7px; padding:6px 14px; cursor:pointer;
}
.ti-shell__list {
  margin-top:10px; border:1px dashed var(--ti-b); border-radius:9px; padding:16px;
  text-align:center; font-size:0.78rem; color:var(--ti-mut); cursor:pointer;
}
.ti-shell__empty { margin-top:8px; text-align:center; font-size:0.78rem; font-style:italic; color:var(--ti-mut); cursor:pointer; }

/* arbre du balisage */
.ti-tree {
  padding:10px 4px; font-family:'JetBrains Mono',monospace; font-size:0.75rem;
  line-height:1.5; overflow-x:auto; font-variant-ligatures:none;
}
.ti-row { padding:1px 8px; cursor:pointer; white-space:nowrap; border-radius:4px; transition:background 0.12s; }
.ti-row:hover { background:color-mix(in srgb,var(--ti-accent) 8%,transparent); }
.ti-tag { color:#d4537e; }
.ti-attr-name { color:#ba7517; }
.ti-attr-val { color:#1d9e75; }
.ti-punct { color:var(--ti-mut); }
.ti-text { color:var(--ti-text); }

/* détails */
.ti-details { margin-top:14px; padding:14px 16px; border:1px solid var(--ti-b); border-radius:12px; background:var(--ti-raised); }
.ti-details--empty { color:var(--ti-mut); font-size:0.85rem; font-style:italic; text-align:center; }
.ti-details__head { display:flex; align-items:center; gap:10px; margin-bottom:8px; }
.ti-details__tag { font-family:'JetBrains Mono',monospace; font-size:0.84rem; color:#d4537e; font-variant-ligatures:none; }
.ti-details__sel {
  font-family:'JetBrains Mono',monospace; font-size:0.78rem; color:var(--ti-accent);
  background:color-mix(in srgb,var(--ti-accent) 10%,transparent); padding:2px 8px; border-radius:5px; font-variant-ligatures:none;
}
.ti-details__role { margin:0; font-size:0.9rem; line-height:1.6; color:var(--ti-text); }

[data-theme="dark"] .ti { --ti-b:#2a3142; --ti-bg:#10141d; --ti-raised:#161b26; --ti-text:#e8e8f0; --ti-mut:#aeb6c4; }

@media (max-width:600px) { .ti-grid { grid-template-columns:1fr; } }
`;