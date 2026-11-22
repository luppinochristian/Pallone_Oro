/**
 * Test dell'aspetto del giocatore (barba e baffi) e pulizia dell'AI nel frontend.
 * Esecuzione dalla radice del progetto:  node tests/js/avatar.test.js
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const root = path.join(__dirname, '../..');
const shared = fs.readFileSync(path.join(root, 'frontend/js/avatar_shared.js'), 'utf8');
const { buildFacialHairSVG, FACIAL_HAIR_STYLES, buildEyebrowsSVG, EYEBROW_STYLES, buildFrecklesSVG, KIT_COLORS, KIT_KEYS, kitShirtColor } = new Function(`${shared}; return { buildFacialHairSVG, FACIAL_HAIR_STYLES, buildEyebrowsSVG, EYEBROW_STYLES, buildFrecklesSVG, KIT_COLORS, KIT_KEYS, kitShirtColor };`)();

let failed = 0, checks = 0;
const ok = (name, fn) => { checks++; try { fn(); } catch (e) { failed++; console.error('FAIL ' + name + ': ' + e.message); } };

ok('stili barba', () => assert.deepStrictEqual(FACIAL_HAIR_STYLES, ['none','stubble','goatee','beard','mustache']));
ok('none non disegna nulla', () => assert.strictEqual(buildFacialHairSVG('none', '#000', 140, 70), ''));
ok('stile sconosciuto non disegna nulla', () => assert.strictEqual(buildFacialHairSVG('dreadlocks', '#000', 140, 70), ''));
for (const style of ['stubble','goatee','beard','mustache']) {
    ok('disegna ' + style, () => {
        const svg = buildFacialHairSVG(style, '#8B4513', 140, 70);
        assert.ok(svg.startsWith('<path'), 'manca il path');
        assert.ok(/fill="#[0-9a-f]{6}"/i.test(svg), 'colore non valido');
        assert.ok(!/NaN|undefined/.test(svg), 'coordinate non valide');
    });
}
const lum = hex => { const v=[1,3,5].map(i=>parseInt(hex.substr(i,2),16)); return 0.2126*v[0]+0.7152*v[1]+0.0722*v[2]; };
const fillOf = svg => svg.match(/fill="(#[0-9a-fA-F]{6})"/)[1];
ok('colore di default valido', () => assert.ok(/fill="#[0-9a-fA-F]{6}"/.test(buildFacialHairSVG('beard', '', 140, 70))));
ok('capelli chiari: barba più scura (contrasto sulla pelle)', () => {
    const f = fillOf(buildFacialHairSVG('beard', '#C4893E', 140, 70));
    assert.ok(lum(f) < lum('#C4893E'), 'fill ' + f + ' non più scuro');
});
ok('capelli neri: barba ancora scura', () => assert.ok(lum(fillOf(buildFacialHairSVG('beard', '#1a1a1a', 140, 70))) < 60));
ok('colore non valido ricade sul default', () => assert.ok(/fill="#[0-9a-fA-F]{6}"/.test(buildFacialHairSVG('beard', 'red; x', 140, 70))));
ok('coordinate proporzionali alla dimensione', () => {
    const a = buildFacialHairSVG('beard', '#000', 100, 50);
    const b = buildFacialHairSVG('beard', '#000', 200, 100);
    assert.notStrictEqual(a, b);
    assert.ok(!a.includes('200'), 'valore fisso non proporzionale');
});

// Il frontend non deve più contenere la generazione AI
const frontendFiles = fs.readdirSync(path.join(root, 'frontend/js')).filter(f => f.endsWith('.js'))
    .map(f => path.join(root, 'frontend/js', f));
frontendFiles.push(path.join(root, 'frontend/index.html'));
for (const f of frontendFiles) {
    ok('nessun riferimento AI in ' + path.basename(f), () => {
        const src = fs.readFileSync(f, 'utf8');
        assert.ok(!/ai_avatar|generateAIAvatar|setAvatarMode|btn-mode-ai|ai-avatar-prompt|has_ai_avatar/.test(src));
    });
}

// ── Sopracciglia ──────────────────────────────────────────────────────────────
ok('stili sopracciglia', () => assert.deepStrictEqual(EYEBROW_STYLES, ['thin','standard','thick','arched']));
ok('standard coincide con il disegno originale (s=110)', () => {
    const s = 110;
    const svg = buildEyebrowsSVG('standard', '#1a1a1a', s);
    assert.ok(svg.includes(`M${s*0.34} ${s*0.335} Q${s*0.41} ${s*0.305} ${s*0.47} ${s*0.335}`), 'sopracciglio sinistro diverso');
    assert.ok(svg.includes(`M${s*0.53} ${s*0.335} Q${s*0.59} ${s*0.305} ${s*0.66} ${s*0.335}`), 'sopracciglio destro diverso');
});
ok('ogni stile disegna due path con colore valido', () => {
    for (const st of EYEBROW_STYLES) {
        const svg = buildEyebrowsSVG(st, '#8B4513', 110);
        assert.strictEqual((svg.match(/<path /g) || []).length, 2, st);
        assert.ok(/stroke="#8b4513"|stroke="#8B4513"/i.test(svg), st + ' colore');
        assert.ok(!/NaN|undefined/.test(svg), st + ' coordinate');
    }
});
const sw = svg => parseFloat(svg.match(/stroke-width="([\d.]+)"/)[1]);
ok('spessore: sottile < standard < spesso', () => {
    const t = sw(buildEyebrowsSVG('thin', '#000000', 110)), n = sw(buildEyebrowsSVG('standard', '#000000', 110)), k = sw(buildEyebrowsSVG('thick', '#000000', 110));
    assert.ok(t < n && n < k, `${t} ${n} ${k}`);
});
ok('arcuate: picco più alto (controllo y più piccolo) dello standard', () => {
    const ctrlY = svg => parseFloat(svg.match(/Q[\d.]+ ([\d.]+)/)[1]);
    assert.ok(ctrlY(buildEyebrowsSVG('arched', '#000000', 110)) < ctrlY(buildEyebrowsSVG('standard', '#000000', 110)));
});
ok('stile sconosciuto → standard', () => assert.strictEqual(buildEyebrowsSVG('punk', '#1a1a1a', 110), buildEyebrowsSVG('standard', '#1a1a1a', 110)));
ok('colore non valido → grigio di default', () => assert.ok(buildEyebrowsSVG('thin', 'red; x', 110).includes('stroke="#555555"')));

// ── Lentiggini ────────────────────────────────────────────────────────────────
ok('lentiggini: 12 punti, colore valido e più scuro della pelle', () => {
    const svg = buildFrecklesSVG('#FDDBB4', 110, 55);
    assert.strictEqual((svg.match(/<circle /g) || []).length, 12);
    const fill = svg.match(/fill="(#[0-9a-fA-F]{6})"/)[1];
    const lum = h => [1,3,5].map(i => parseInt(h.substr(i,2),16)).reduce((a,b)=>a+b,0);
    assert.ok(lum(fill) < lum('#FDDBB4'), 'lentiggine non più scura della pelle');
    assert.ok(!/NaN|undefined/.test(svg));
});
ok('lentiggini: pelle non valida → base di default', () => {
    const svg = buildFrecklesSVG('medium', 110, 55);
    assert.ok(/fill="#[0-9a-fA-F]{6}"/.test(svg) && !/NaN/.test(svg));
});
ok('lentiggini: piccole e centrate sul volto (cx simmetrico)', () => {
    const xs = [...buildFrecklesSVG('#C68642', 110, 55).matchAll(/cx="([\d.-]+)"/g)].map(m => parseFloat(m[1]));
    const mean = xs.reduce((a,b)=>a+b,0)/xs.length;
    assert.ok(Math.abs(mean - 55) < 0.5, 'centro non simmetrico: ' + mean);
});

// ── Maglia ────────────────────────────────────────────────────────────────────
ok('maglia: 8 colori validi con 8 chiavi di traduzione', () => {
    assert.strictEqual(KIT_COLORS.length, 8);
    assert.strictEqual(KIT_KEYS.length, 8);
    assert.ok(KIT_COLORS.every(c => /^#[0-9a-f]{6}$/.test(c)), 'colore non in minuscolo/valido');
});
ok('maglia: palette JS identica alla whitelist PHP', () => {
    const php = fs.readFileSync(path.join(root, 'backend/config/appearance.php'), 'utf8');
    const m = php.match(/const KIT_COLORS = \[([^\]]+)\]/);
    assert.ok(m, 'KIT_COLORS non trovato in appearance.php');
    const phpList = [...m[1].matchAll(/'(#[0-9a-f]{6})'/g)].map(x => x[1]);
    assert.deepStrictEqual(KIT_COLORS, phpList);
});
ok('maglia: colore scelto usato così com\'è', () => assert.strictEqual(kitShirtColor('#c62828', 'male'), '#c62828'));
ok('maglia: nessun colore → default maschile blu', () => assert.strictEqual(kitShirtColor(null, 'male'), '#1565c0'));
ok('maglia: nessun colore → default femminile rosa', () => assert.strictEqual(kitShirtColor(undefined, 'female'), '#c0397a'));
ok('maglia: valore non valido → default del genere', () => assert.strictEqual(kitShirtColor('red;x', 'male'), '#1565c0'));

if (failed) { console.error(`${failed} test falliti`); process.exit(1); }
console.log('Test aspetto e assenza AI superati: ' + checks + ' (di cui ' + frontendFiles.length + ' controlli sui file frontend)');
