// Fills company requisites into every page from requisites.json.
// Each slot in the HTML is <span data-req="key" data-ph="[placeholder]">…</span>.
// An empty value renders the placeholder (class ps-ph); phones render as tel: links.
// Usage: node scripts/requisites.mjs [path/to/requisites.json]
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const data = JSON.parse(readFileSync(process.argv[2] || join(root, 'requisites.json'), 'utf8'));
const SKIP = new Set(['node_modules', 'dev', 'assets', 'scripts', '.git', '.idea']);

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const telHref = (p) => 'tel:' + p.replace(/[^\d+]/g, '');

function pages(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return SKIP.has(name) ? [] : pages(p);
    return name.endsWith('.html') ? [p] : [];
  });
}

// Language of a page: first path segment uz/ru/en; the root index and 404 are Uzbek.
const langOf = (file) => {
  const first = relative(root, file).split(sep)[0];
  return ['uz', 'ru', 'en'].includes(first) ? first : 'uz';
};

function value(key, lang) {
  if (!(key in data)) throw new Error(`requisites.json has no "${key}"`);
  const v = data[key];
  if (key === 'phones') {
    const list = (Array.isArray(v) ? v : [v]).map((p) => String(p).trim()).filter(Boolean);
    return list.length ? list.map((p) => `<a class="ps-tel" href="${esc(telHref(p))}">${esc(p)}</a>`).join(', ') : '';
  }
  const s = typeof v === 'object' && v !== null ? v[lang] || '' : v;
  return String(s).trim() ? esc(String(s).trim()) : '';
}

const SLOT = /<span data-req="(\w+)" data-ph="([^"]*)"(?: class="ps-ph")?>[\s\S]*?<\/span>/g;
let slots = 0, filled = 0;
for (const file of pages(root)) {
  const html = readFileSync(file, 'utf8');
  const lang = langOf(file);
  const out = html.replace(SLOT, (_, key, ph) => {
    slots++;
    const v = value(key, lang);
    if (v) filled++;
    return v
      ? `<span data-req="${key}" data-ph="${ph}">${v}</span>`
      : `<span data-req="${key}" data-ph="${ph}" class="ps-ph">${ph}</span>`;
  });
  if (out !== html) writeFileSync(file, out);
}
console.log(`requisites: ${filled}/${slots} slots filled`);
