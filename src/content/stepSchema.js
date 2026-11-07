// Step lessons (M2): the "Steps" view of a lesson section. Each topic may have `topics/<id>/steps.js`:
//
//   export default { [sectionId]: Step[] }
//
//   Step = { kind: 'watch', title, lines: string[], frames: Frame[] }
//        | { kind: 'turn',  title, lines: string[], panels: Panel[], task: Task, solved: string, then?: Frame[] }
//   Frame = { say?: number (the line it explains, 0-based), note: string, panels: Panel[] }
//   Panel = a Visualizer panel (visualizations/panels.jsx): array, stack, queue, vars, list, nodes, grid, table,
//           intervals ({ items: [{ start, end, state? }], min, max, label })
//   Task  = { type: 'choose', question, options: [{ text, why? }], answer }          pick one option
//         | { type: 'order',  question, items: string[] (right order), hint }        tap them in order
//         | { type: 'number', question, options: number[], answer: number, hint }     pick the count
//         | { type: 'cell',   question, panel?: number, answer: number, hints?: { [index]: string } }  pick an array cell
//           (answer and hints are positions in that panel; an array panel's `indexBase` only changes the labels)
//
// Rule carried over from system-design-learn: the number of steps follows the section's content and every lesson
// animates its own mechanism; never one template for all. Text is plain with **bold** and `code`.

export const PANEL_KINDS = ['array', 'stack', 'queue', 'vars', 'list', 'nodes', 'grid', 'table', 'intervals'];
export const STATES = ['active', 'done', 'bad', 'muted', 'visited', 'window'];
// a highlight of "" (or none) means the plain cell
const TASKS = ['choose', 'order', 'number', 'cell'];

const isStr = (s) => typeof s === 'string' && s.trim().length > 0;

function checkPanel(p, at, errs) {
  if (!p || !PANEL_KINDS.includes(p.kind)) return errs.push(`${at}: panel kind "${p?.kind}" is not one of ${PANEL_KINDS.join(', ')}`);
  const need = { array: ['values'], stack: ['values'], queue: ['values'], list: ['values'], vars: ['vars'], nodes: ['nodes', 'edges'], grid: ['cells'], table: ['cells', 'rowLabels', 'colLabels'], intervals: ['items', 'min', 'max'] }[p.kind];
  for (const k of need) if (p[k] === undefined) errs.push(`${at}: ${p.kind} panel needs "${k}"`);
  if (p.kind === 'array') {
    for (const [i, st] of Object.entries(p.highlights || {})) {
      if (st && !STATES.includes(st)) errs.push(`${at}: highlight "${st}" is not one of ${STATES.join(', ')}`);
      if (+i < 0 || +i >= p.values.length) errs.push(`${at}: highlight index ${i} is outside the array`);
    }
    for (const ptr of p.pointers || []) if (ptr.index < 0 || ptr.index >= p.values.length) errs.push(`${at}: pointer ${ptr.label} at ${ptr.index} is outside the array`);
  }
}

function checkFrames(frames, lines, at, errs) {
  if (!Array.isArray(frames) || !frames.length) return errs.push(`${at}: needs at least one frame`);
  frames.forEach((f, i) => {
    const fa = `${at} frame ${i + 1}`;
    if (!isStr(f.note)) errs.push(`${fa}: needs a note`);
    if (f.say !== undefined && (!Number.isInteger(f.say) || f.say < 0 || f.say >= lines.length)) errs.push(`${fa}: say ${f.say} has no matching line`);
    if (!Array.isArray(f.panels) || !f.panels.length) errs.push(`${fa}: needs panels`);
    else f.panels.forEach((p, j) => checkPanel(p, `${fa} panel ${j + 1}`, errs));
  });
}

function checkTask(t, panels, at, errs) {
  if (!t || !TASKS.includes(t.type)) return errs.push(`${at}: task type "${t?.type}" is not one of ${TASKS.join(', ')}`);
  if (!isStr(t.question)) errs.push(`${at}: task needs a question`);
  if (t.type === 'choose') {
    if (!Array.isArray(t.options) || t.options.length < 2) errs.push(`${at}: choose needs 2+ options`);
    else if (!Number.isInteger(t.answer) || !t.options[t.answer]) errs.push(`${at}: choose answer ${t.answer} is not an option`);
    else t.options.forEach((o, i) => i !== t.answer && !isStr(o.why) && errs.push(`${at}: wrong option ${i + 1} needs a "why"`));
  }
  if (t.type === 'order' && (!Array.isArray(t.items) || t.items.length < 2 || new Set(t.items).size !== t.items.length || !isStr(t.hint)))
    errs.push(`${at}: order needs 2+ distinct items and a hint`);
  if (t.type === 'number' && (!Array.isArray(t.options) || !t.options.includes(t.answer) || new Set(t.options).size !== t.options.length || !isStr(t.hint)))
    errs.push(`${at}: number needs distinct options that include the answer, and a hint`);
  if (t.type === 'cell') {
    const p = (panels || [])[t.panel || 0];
    if (p?.kind !== 'array') errs.push(`${at}: cell task needs an array panel at ${t.panel || 0}`);
    else if (!Number.isInteger(t.answer) || t.answer < 0 || t.answer >= p.values.length) errs.push(`${at}: cell answer ${t.answer} is outside the array`);
  }
}

/** Every problem with one section's steps, as readable strings (empty = valid). */
export function validateSteps(steps, at = 'steps') {
  const errs = [];
  if (!Array.isArray(steps) || !steps.length) return [`${at}: needs at least one step`];
  steps.forEach((s, i) => {
    const sa = `${at} step ${i + 1}`;
    if (!isStr(s.title)) errs.push(`${sa}: needs a title`);
    if (!Array.isArray(s.lines) || !s.lines.length || !s.lines.every(isStr)) errs.push(`${sa}: needs lines`);
    if (s.kind === 'watch') checkFrames(s.frames, s.lines || [], sa, errs);
    else if (s.kind === 'turn') {
      if (!Array.isArray(s.panels) || !s.panels.length) errs.push(`${sa}: a turn needs panels to show while you answer`);
      else s.panels.forEach((p, j) => checkPanel(p, `${sa} panel ${j + 1}`, errs));
      checkTask(s.task, s.panels, sa, errs);
      if (!isStr(s.solved)) errs.push(`${sa}: needs a "solved" takeaway`);
      if (s.then) checkFrames(s.then, s.lines || [], `${sa} then`, errs);
    } else errs.push(`${sa}: kind "${s.kind}" must be watch or turn`);
  });
  return errs;
}
