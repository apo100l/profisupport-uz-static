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
const LD = /<script type="application\/ld\+json" id="ps-ld">[\s\S]*?<\/script>/;
let slots = 0, filled = 0, ldBlocks = 0;
for (const file of pages(root)) {
  const html = readFileSync(file, 'utf8');
  const lang = langOf(file);
  let out = html.replace(SLOT, (_, key, ph) => {
    slots++;
    const v = value(key, lang);
    if (v) filled++;
    return v
      ? `<span data-req="${key}" data-ph="${ph}">${v}</span>`
      : `<span data-req="${key}" data-ph="${ph}" class="ps-ph">${ph}</span>`;
  });
  out = out.replace(LD, () => {
    ldBlocks++;
    return `<script type="application/ld+json" id="ps-ld">${structuredData(file, lang, out)}</script>`;
  });
  if (out !== html) writeFileSync(file, out);
}
console.log(`requisites: ${filled}/${slots} slots filled, ${ldBlocks} JSON-LD blocks`);

// Structured data (schema.org JSON-LD) for the home and contacts pages, from the same requisites.
// Production URLs; empty requisites are left out rather than written as placeholders.
function structuredData(file, lang, html) {
  const BASE = 'https://profisupport.uz';
  const page = relative(root, file).split(sep).slice(1, -1).join('/');
  const url = `${BASE}/${lang}/${page ? page + '/' : ''}`;
  const text = (k) => { const v = data[k]; return String((typeof v === 'object' && v !== null ? v[lang] : v) || '').trim(); };
  const phone = (Array.isArray(data.phones) ? data.phones : [data.phones]).map((p) => String(p || '').replace(/[^\d+]/g, '')).find(Boolean);
  const date = (text('registered').match(/(\d{2})\.(\d{2})\.(\d{4})/) || []).slice(1);
  const clean = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== '' && v !== undefined && !(Array.isArray(v) && !v.length)));
  const org = clean({
    '@type': 'Organization', '@id': `${BASE}/#organization`, name: 'ProfiSupport', url: `${BASE}/`,
    legalName: text('nameFull'), alternateName: text('name'), taxID: text('stir'),
    foundingDate: date.length ? `${date[2]}-${date[1]}-${date[0]}` : '',
    email: 'support@profisupport.uz', telephone: phone,
    address: text('address') ? { '@type': 'PostalAddress', streetAddress: text('address'), addressCountry: 'UZ' } : '',
    contactPoint: clean({
      '@type': 'ContactPoint', contactType: 'customer support', email: 'support@profisupport.uz', telephone: phone,
      availableLanguage: ['uz', 'ru', 'en'],
      hoursAvailable: { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '09:00', closes: '18:00' },
    }),
  });
  const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1] || 'ProfiSupport';
  const site = { '@type': 'WebSite', '@id': `${BASE}/#website`, url: `${BASE}/`, name: 'ProfiSupport', inLanguage: ['uz', 'ru', 'en'], publisher: { '@id': org['@id'] } };
  const webPage = { '@type': page === 'contacts' ? 'ContactPage' : 'WebPage', '@id': url, url, name: title, inLanguage: lang, isPartOf: { '@id': site['@id'] }, about: { '@id': org['@id'] } };
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': [org, site, webPage] }).replace(/</g, '\\u003c');
}
