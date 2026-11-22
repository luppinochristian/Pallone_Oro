// Controllo traduzioni: ogni lingua ha le stesse chiavi, nessuna chiave usata nel codice manca,
// e nessun valore è vuoto. Esecuzione dalla radice:  node tests/js/i18n.test.js
const vm = require('vm');
const fs = require('fs');
const path = require('path');
const JS = path.join(__dirname, '../../frontend/js');
const HTML = path.join(__dirname, '../../frontend/index.html');
const LANGS = ['it', 'en', 'de', 'es'];

// Carica solo TRANSLATIONS da app_core.js (il resto del file richiede il DOM).
const src = fs.readFileSync(path.join(JS, 'app_core.js'), 'utf8');
const start = src.indexOf('const TRANSLATIONS = {');
let depth = 0, end = -1;
for (let i = src.indexOf('{', start); i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') { depth--; if (depth === 0) { end = i + 1; break; } }
}
const TRANSLATIONS = vm.runInNewContext('(' + src.slice(src.indexOf('{', start), end) + ')');

let failed = 0, checks = 0;
const ok = (name, cond, detail = '') => { checks++; if (!cond) { failed++; console.error('FAIL ' + name + (detail ? ': ' + detail : '')); } };

// 1. Stesse chiavi in tutte le lingue
const keysOf = l => new Set(Object.keys(TRANSLATIONS[l] || {}));
for (const l of LANGS) ok('lingua presente: ' + l, !!TRANSLATIONS[l]);
const allKeys = new Set(LANGS.flatMap(l => [...keysOf(l)]));
for (const l of LANGS) {
    const missing = [...allKeys].filter(k => !keysOf(l).has(k));
    ok(`chiavi complete in ${l}`, missing.length === 0, missing.slice(0, 15).join(', ') + (missing.length > 15 ? ` … (+${missing.length - 15})` : ''));
}

// 2. Nessun valore vuoto
for (const l of LANGS) for (const [k, v] of Object.entries(TRANSLATIONS[l] || {})) {
    ok(`valore non vuoto ${l}.${k}`, typeof v === 'string' && v.trim().length > 0);
}

// 3. Chiavi usate nel codice (statiche e dinamiche) devono esistere in ogni lingua
const files = fs.readdirSync(JS).filter(f => f.endsWith('.js')).map(f => path.join(JS, f));
const code = files.map(f => fs.readFileSync(f, 'utf8')).join('\n') + fs.readFileSync(HTML, 'utf8');
const used = new Set();
for (const m of code.matchAll(/data-i18n(?:-placeholder|-title)?="([^"]+)"/g)) used.add(m[1]);
for (const m of code.matchAll(/_t\(\s*'([^']+)'\s*\)/g)) used.add(m[1]);
for (const m of code.matchAll(/_t\(\s*"([^"]+)"\s*\)/g)) used.add(m[1]);
// chiavi costruite dinamicamente: prefisso + valore da una lista nota
const dynamic = {
    cc_role_: ['bomber', 'fantasista', 'ala', 'regista', 'tuttocampista'],
    facial_: ['none', 'stubble', 'goatee', 'beard', 'mustache'],
    eyebrow_: ['thin', 'standard', 'thick', 'arched'],
};
for (const [prefix, vals] of Object.entries(dynamic)) for (const v of vals) used.add(prefix + v);
// Chiavi con ${...} sono template literal interpolati a runtime: coperte dalla lista 'dynamic'.
for (const k of used) {
    if (k.includes('${')) continue;
    const missing = LANGS.filter(l => !(TRANSLATIONS[l] || {})[k]);
    ok('chiave usata definita: ' + k, missing.length === 0, 'mancante in ' + missing.join(','));
}

// 4. Parole italiane rimaste nelle altre lingue (testo non tradotto). Lista di parole
//    che in it/en/de/es non compaiono come parole comuni: un match indica una traduzione mancante.
const ITALIAN_LEAK = /\b(della|delle|nella|nelle|sono|squadra|stagione|giocatore|partita|anni|annulla|salva|oggi|vittoria|sconfitta|pareggio|allenatore|carriera|ruolo|contratto|stipendio|infortunio|inizio|caricamento|tuttocampista|regista|fantasista|mentalità|mentalita)\b/i;
for (const l of ['en', 'de', 'es']) for (const [k, v] of Object.entries(TRANSLATIONS[l] || {})) {
    ok(`nessuna parola italiana in ${l}.${k}`, !ITALIAN_LEAK.test(v), `"${v}"`);
}

console.log(`i18n.test.js: ${checks - failed}/${checks} controlli superati`);
if (failed) { console.error(`${failed} controlli falliti`); process.exit(1); }
