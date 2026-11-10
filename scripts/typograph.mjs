// Russian typography for page text: no one-letter word left hanging at the end of a line,
// no dash starting a line. Touches only text inside <body>, never tags, attributes, scripts, styles or requisites (<span data-req>).
// Idempotent: run it after editing texts.  Usage: node scripts/typograph.mjs
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const SKIP = new Set(['node_modules', 'dev', 'assets', 'scripts', '.git', '.idea']);
const NBSP = '\u00a0';

function pages(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return SKIP.has(name) ? [] : pages(p);
    return name.endsWith('.html') ? [p] : [];
  });
}

// One-letter prepositions and conjunctions bind to the next word; a dash binds to the previous one.
// Repeated until stable, so runs like «и в доме» bind both words.
const fixOnce = (t) => t
  .replace(/(^|[\s(«„"])([вкосуияаВКОСУИЯА]) (?=\S)/g, `$1$2${NBSP}`)
  .replace(/(\S) (—|–)(?=\s)/g, `$1${NBSP}$2`);
const fixText = (t) => { for (let prev; prev !== t;) { prev = t; t = fixOnce(t); } return t; };

let changed = 0;
for (const file of pages(root)) {
  if (relative(root, file).split(sep)[0] !== 'ru') continue;
  const html = readFileSync(file, 'utf8');
  const start = html.indexOf('<body');
  const head = html.slice(0, start), body = html.slice(start);
  // Split into tags, script/style blocks and requisites slots (kept as is: requisites stay character for character) and text (fixed)
  const out = head + body.replace(/(<(script|style)\b[\s\S]*?<\/\2>|<span data-req=[\s\S]*?<\/span>|<[^>]*>)|([^<]+)/g,
    (m, tag, _n, text) => (tag ? tag : fixText(text)));
  if (out !== html) { writeFileSync(file, out); changed++; }
}
console.log(`typograph: ${changed} pages updated`);
