import { useState, useRef } from "react";

/**
 * TodoReact : la TodoList du guide natif, rebâtie en React.
 * Démo interactive et implémentation de référence du guide todo-react.
 * État unique (useState), vue = f(état), composant TodoItem, pas de DOM manuel.
 */

const LIBELLES = { todo: "à faire", "in-progress": "en cours", done: "terminé" };
const today = () => new Date().toISOString().slice(0, 10);

function parseTags(saisie) {
  return saisie
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

// Une tâche. Reçoit ses données et des rappels ; ne possède aucun état propre.
function TodoItem({
  task,
  isEditing,
  editingValue,
  onEditChange,
  onStartEdit,
  onCommitEdit,
  onCancelEdit,
  onToggle,
  onStatus,
  onDuplicate,
  onDelete
}) {
  const enRetard = !task.completed && task.dueDate && task.dueDate < today();

  return (
    <li className={"todo-item" + (task.completed ? " is-done" : "")} data-status={task.status}>
      <input
        className="todo-item__check"
        type="checkbox"
        checked={task.completed}
        onChange={() => onToggle(task.id)}
        aria-label="Marquer complétée"
      />

      <div className="todo-item__body">
        {isEditing ? (
          <input
            className="todo-item__edit"
            value={editingValue}
            autoFocus
            onChange={(event) => onEditChange(event.target.value)}
            onBlur={onCommitEdit}
            onKeyDown={(event) => {
              if (event.key === "Enter") event.target.blur();
              if (event.key === "Escape") onCancelEdit();
            }}
            aria-label="Modifier le titre"
          />
        ) : (
          <span
            className="todo-item__title"
            tabIndex={0}
            title="Double-cliquer pour modifier"
            onDoubleClick={() => onStartEdit(task)}
          >
            {task.title}
          </span>
        )}

        <div className="todo-item__meta">
          <select
            className="todo-item__status"
            value={task.status}
            onChange={(event) => onStatus(task.id, event.target.value)}
            aria-label="Statut"
          >
            <option value="todo">à faire</option>
            <option value="in-progress">en cours</option>
            <option value="done">terminé</option>
          </select>

          {task.dueDate && (
            <span className={"todo-item__due" + (enRetard ? " is-late" : "")}>
              {"\u{1F4C5} " + task.dueDate}
            </span>
          )}

          {task.tags.length > 0 && (
            <span className="todo-item__tags">
              {task.tags.map((label, i) => (
                <span className="todo-tag" key={i}>{label}</span>
              ))}
            </span>
          )}
        </div>
      </div>

      <div className="todo-item__actions">
        <button
          className="todo-item__btn"
          onClick={() => onDuplicate(task.id)}
          aria-label="Dupliquer"
          title="Dupliquer"
        >
          &#x29C9;
        </button>
        <button
          className="todo-item__btn todo-item__btn--del"
          onClick={() => onDelete(task.id)}
          aria-label="Supprimer"
          title="Supprimer"
        >
          &times;
        </button>
      </div>
    </li>
  );
}

export default function TodoReact() {
  const seq = useRef(2);
  const uid = () => "t" + (seq.current += 1);

  const [tasks, setTasks] = useState([
    { id: "t1", title: "Préparer la démo du cours", tags: ["cours"], dueDate: "", status: "in-progress", completed: false },
    { id: "t2", title: "Lire le chapitre sur le DOM", tags: ["lecture", "dom"], dueDate: "", status: "todo", completed: false }
  ]);

  const [title, setTitle] = useState("");
  const [tags, setTags] = useState("");
  const [dueDate, setDueDate] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editingValue, setEditingValue] = useState("");

  // Actions : chacune calcule le nouvel état et le confie à setTasks.
  function addTask(event) {
    event.preventDefault();
    const titre = title.trim();
    if (!titre) return;
    setTasks([
      ...tasks,
      { id: uid(), title: titre, tags: parseTags(tags), dueDate, status: "todo", completed: false }
    ]);
    setTitle("");
    setTags("");
    setDueDate("");
  }

  const toggle = (id) =>
    setTasks(tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));

  const changeStatus = (id, status) =>
    setTasks(tasks.map((t) => (t.id === id ? { ...t, status } : t)));

  const remove = (id) => setTasks(tasks.filter((t) => t.id !== id));

  function duplicate(id) {
    const index = tasks.findIndex((t) => t.id === id);
    if (index === -1) return;
    const source = tasks[index];
    const copy = { ...source, id: uid(), tags: [...source.tags], title: source.title + " (copie)" };
    const suivant = [...tasks];
    suivant.splice(index + 1, 0, copy);
    setTasks(suivant);
  }

  const startEdit = (task) => {
    setEditingId(task.id);
    setEditingValue(task.title);
  };

  function commitEdit() {
    setTasks(tasks.map((t) => (t.id === editingId ? { ...t, title: editingValue.trim() || t.title } : t)));
    setEditingId(null);
  }

  const cancelEdit = () => setEditingId(null);

  return (
    <section className="todo" aria-label="Application de tâches (React)">
      <header className="todo__head">
        <h3 className="todo__title">Mes tâches</h3>
        <form className="todo__add" onSubmit={addTask}>
          <input
            className="todo__input todo__input--title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Nouvelle tâche"
            required
            aria-label="Titre de la tâche"
          />
          <input
            className="todo__input todo__input--tags"
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="tags, séparés, par virgules"
            aria-label="Tags"
          />
          <input
            className="todo__input todo__input--date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            aria-label="Date limite"
          />
          <button className="todo__addbtn" type="submit">Ajouter</button>
        </form>
      </header>

      {tasks.length === 0 ? (
        <p className="todo__empty">Aucune tâche. Ajoutez-en une ci-dessus.</p>
      ) : (
        <ul className="todo__list">
          {tasks.map((task) => (
            <TodoItem
              key={task.id}
              task={task}
              isEditing={task.id === editingId}
              editingValue={editingValue}
              onEditChange={setEditingValue}
              onStartEdit={startEdit}
              onCommitEdit={commitEdit}
              onCancelEdit={cancelEdit}
              onToggle={toggle}
              onStatus={changeStatus}
              onDuplicate={duplicate}
              onDelete={remove}
            />
          ))}
        </ul>
      )}

      <style>{CSS}</style>
    </section>
  );
}

const CSS = `
.todo{--t-accent:#0d9488;--t-bg:#fff;--t-raised:#f8f7f4;--t-border:#e2e0db;--t-text:#1a1a2e;--t-mut:#6b6b80;--t-blue:#3b6fca;--t-green:#2d8a4e;--t-red:#dc2626;font-family:'DM Sans',system-ui,sans-serif;color:var(--t-text);background:var(--t-bg);border:1px solid var(--t-border);border-radius:16px;padding:18px;max-width:680px;margin:2rem auto}
.todo *{box-sizing:border-box}
.todo__head{margin-bottom:14px}
.todo__title{font-family:'Fraunces',Georgia,serif;font-size:1.2rem;font-weight:700;margin:0 0 10px}
.todo__add{display:flex;flex-wrap:wrap;gap:8px}
.todo__input{font:inherit;font-size:.88rem;padding:8px 10px;border:1px solid var(--t-border);border-radius:8px;background:var(--t-bg);color:var(--t-text)}
.todo__input--title{flex:1 1 160px}
.todo__input--tags{flex:1 1 140px}
.todo__input:focus-visible,.todo__addbtn:focus-visible{outline:2px solid var(--t-accent);outline-offset:2px}
.todo__addbtn{font:inherit;font-weight:600;font-size:.88rem;padding:8px 16px;border:1px solid var(--t-accent);background:var(--t-accent);color:#fff;border-radius:8px;cursor:pointer}
.todo__list{list-style:none;margin:14px 0 0;padding:0;display:flex;flex-direction:column;gap:8px}
.todo__empty{color:var(--t-mut);font-size:.86rem;font-style:italic;text-align:center;padding:18px}
.todo-item{display:flex;align-items:flex-start;gap:11px;background:var(--t-raised);border:1px solid var(--t-border);border-left:3px solid var(--t-border);border-radius:10px;padding:11px 13px}
.todo-item[data-status="todo"]{border-left-color:#cbd5e1}
.todo-item[data-status="in-progress"]{border-left-color:var(--t-blue)}
.todo-item[data-status="done"]{border-left-color:var(--t-green)}
.todo-item__check{margin-top:3px;width:17px;height:17px;accent-color:var(--t-accent);cursor:pointer;flex-shrink:0}
.todo-item__body{flex:1;min-width:0}
.todo-item__title{display:inline-block;font-size:.95rem;font-weight:600;padding:1px 4px;border-radius:5px;cursor:text;outline:none}
.todo-item__title:focus{background:#fff;box-shadow:0 0 0 2px var(--t-accent)}
.todo-item__edit{font:inherit;font-size:.95rem;font-weight:600;padding:1px 4px;border:1px solid var(--t-accent);border-radius:5px;background:var(--t-bg);color:var(--t-text);width:100%;max-width:280px}
.todo-item__edit:focus-visible{outline:2px solid var(--t-accent);outline-offset:1px}
.todo-item__meta{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-top:6px}
.todo-item__status{font:inherit;font-size:.74rem;font-weight:600;padding:2px 6px;border:1px solid var(--t-border);border-radius:6px;background:var(--t-bg);color:var(--t-mut);cursor:pointer}
.todo-item__status:focus-visible{outline:2px solid var(--t-accent);outline-offset:1px}
.todo-item__due{font-size:.76rem;color:var(--t-mut);white-space:nowrap}
.todo-item__due.is-late{color:var(--t-red);font-weight:600}
.todo-item__tags{display:inline-flex;flex-wrap:wrap;gap:5px}
.todo-tag{font-size:.7rem;font-weight:600;color:var(--t-accent);background:color-mix(in srgb,var(--t-accent) 12%,var(--t-bg));border:1px solid color-mix(in srgb,var(--t-accent) 30%,var(--t-border));padding:1px 7px;border-radius:20px}
.todo-item__actions{display:flex;gap:4px;flex-shrink:0}
.todo-item__btn{border:1px solid var(--t-border);background:var(--t-bg);color:var(--t-mut);font-size:1rem;line-height:1;width:28px;height:28px;border-radius:7px;cursor:pointer;display:flex;align-items:center;justify-content:center}
.todo-item__btn:hover{border-color:var(--t-accent);color:var(--t-accent)}
.todo-item__btn--del:hover{border-color:var(--t-red);color:var(--t-red)}
.todo-item__btn:focus-visible{outline:2px solid var(--t-accent);outline-offset:1px}
.todo-item.is-done{opacity:.6}
.todo-item.is-done .todo-item__title{text-decoration:line-through;text-decoration-thickness:1.5px}
[data-theme="dark"] .todo{--t-bg:#10141d;--t-raised:#161b26;--t-border:#2a3142;--t-text:#e8e8f0;--t-mut:#aeb6c4}
[data-theme="dark"] .todo-item__title:focus{background:#0b0f16}
[data-theme="dark"] .todo__addbtn{color:#0b0f16}
`;