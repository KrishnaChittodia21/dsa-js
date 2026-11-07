// M6: the Java / C++ reference solutions (src/content/topics/<topic>/solutions/<id>.java | .cpp), loaded as text
// only when a Solution tab asks for them. Checked against every test by scripts/check-refs.mjs.
const files = import.meta.glob('../content/topics/*/solutions/*.{java,cpp}', { query: '?raw', import: 'default' });

const EXT = { java: 'java', cpp: 'cpp' };
const keyOf = (id, lang) => Object.keys(files).find((k) => k.endsWith(`/${id}.${EXT[lang]}`));

/** the languages (besides JS) that have a reference for this question */
export const referenceLanguages = (id) => Object.keys(EXT).filter((l) => keyOf(id, l));

/** the reference's source text, or null */
export async function loadReference(id, lang) {
  const k = keyOf(id, lang);
  return k ? files[k]() : null;
}
