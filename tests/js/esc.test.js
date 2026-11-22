/**
 * Test di esc() (frontend/js/ui_components.js).
 * Esecuzione dalla radice del progetto:  node tests/js/esc.test.js
 * Estrae la funzione dal file reale, così il test verifica il codice in produzione.
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const src = fs.readFileSync(path.join(__dirname, '../../frontend/js/ui_components.js'), 'utf8');
const match = src.match(/function esc\(value\) \{[\s\S]*?\n\}/);
assert(match, 'esc() non trovata in ui_components.js');
const esc = new Function(`${match[0]}; return esc;`)();

const cases = [
    ['<script>alert(1)</script>', '&lt;script&gt;alert(1)&lt;/script&gt;'],
    ['"><img src=x onerror=alert(1)>', '&quot;&gt;&lt;img src=x onerror=alert(1)&gt;'],
    ["O'Brien", 'O&#39;Brien'],
    ['Tom & Jerry', 'Tom &amp; Jerry'],
    ['Mario Rossi', 'Mario Rossi'],
    [null, ''],
    [undefined, ''],
    [42, '42'],
];

let failed = 0;
for (const [input, expected] of cases) {
    try {
        assert.strictEqual(esc(input), expected);
    } catch (e) {
        failed++;
        console.error(`FAIL esc(${JSON.stringify(input)}): atteso ${expected}, ottenuto ${esc(input)}`);
    }
}
// Il risultato non deve mai contenere un tag HTML attivo
assert.ok(!/<[a-z]/i.test(esc('<b>x</b>')), 'il tag non è stato neutralizzato');

if (failed) { console.error(`${failed} test falliti`); process.exit(1); }
console.log(`Test esc() superati: ${cases.length}`);
