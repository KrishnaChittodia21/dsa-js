// Vite plugin: serves `virtual:content-manifest` — the lightweight metadata of every topic and
// question (titles, patterns, checkpoints, cheatsheets). Full lessons and question bodies are
// loaded lazily per topic, which keeps the initial bundle small.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const VIRTUAL_ID = 'virtual:content-manifest';
const RESOLVED_ID = '\0' + VIRTUAL_ID;
const QUESTION_META_KEYS = ['id', 'title', 'difficulty', 'order', 'pattern', 'tags', 'source', 'kind'];

async function freshImport(file) {
  const url = pathToFileURL(file).href + `?t=${Date.now()}-${Math.random()}`;
  return (await import(url)).default;
}

export async function buildManifest(topicsDir) {
  const manifest = { topics: {}, questions: {} };
  if (!fs.existsSync(topicsDir)) return manifest;
  for (const topicId of fs.readdirSync(topicsDir)) {
    const dir = path.join(topicsDir, topicId);
    if (!fs.statSync(dir).isDirectory()) continue;
    const topicFile = path.join(dir, 'topic.js');
    if (fs.existsSync(topicFile)) {
      try {
        const t = await freshImport(topicFile);
        manifest.topics[topicId] = {
          summary: t.summary,
          // Slim pattern summaries; full details (template, evolution…) load with the topic.
          patterns: (t.patterns || []).map((p) => ({
            id: p.id,
            name: p.name,
            summary: p.summary,
            clues: p.clues || [],
            whenToUse: p.whenToUse || [],
            variations: (p.variations || []).map((v) => ({ name: v.name })),
            ...(p.visual ? { visual: p.visual } : {}),
          })),
          cheatsheet: t.cheatsheet || null,
          keyConcepts: t.keyConcepts || [],
          interviewTips: t.interviewTips || [],
          jsTools: t.jsTools || [],
          sections: (t.lesson?.sections || []).map((s) => ({
            id: s.id,
            title: s.title,
            // Only ids are needed for progress maths; checkpoint text loads with the lesson.
            checkpoints: (s.blocks || []).filter((b) => b.type === 'checkpoint').map((b) => ({ type: 'checkpoint', id: b.id })),
          })),
        };
      } catch (e) {
        console.warn(`[content-manifest] skipping ${topicId}/topic.js: ${e.message}`);
      }
    }
    const qDir = path.join(dir, 'questions');
    if (!fs.existsSync(qDir)) continue;
    const list = [];
    for (const f of fs.readdirSync(qDir).filter((x) => x.endsWith('.js'))) {
      try {
        const q = await freshImport(path.join(qDir, f));
        if (!q?.id) continue;
        const meta = { topicId };
        for (const k of QUESTION_META_KEYS) if (q[k] !== undefined) meta[k] = q[k];
        list.push(meta);
      } catch (e) {
        console.warn(`[content-manifest] skipping ${topicId}/questions/${f}: ${e.message}`);
      }
    }
    manifest.questions[topicId] = list;
  }
  return manifest;
}

export default function contentManifestPlugin() {
  let root;
  return {
    name: 'content-manifest',
    configResolved(config) {
      root = config.root;
    },
    resolveId(id) {
      return id === VIRTUAL_ID ? RESOLVED_ID : null;
    },
    async load(id) {
      if (id !== RESOLVED_ID) return null;
      const topicsDir = path.join(root, 'src/content/topics');
      const manifest = await buildManifest(topicsDir);
      // No addWatchFile here: Vite's dev server treats watch files of a virtual module as imports and fails to
      // resolve the topic directories (500 on every page). Vite already watches src/, and handleHotUpdate below
      // invalidates this module and reloads when a topic file changes.
      return `export default ${JSON.stringify(manifest)};`;
    },
    handleHotUpdate({ file, server }) {
      if (file.includes(`${path.sep}src${path.sep}content${path.sep}topics${path.sep}`)) {
        const mod = server.moduleGraph.getModuleById(RESOLVED_ID);
        if (mod) server.moduleGraph.invalidateModule(mod);
        server.ws.send({ type: 'full-reload' });
        return [];
      }
      return undefined;
    },
  };
}
