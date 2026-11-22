// Regressione: funzioni che usavano identificatori fuori scope (ReferenceError
// a runtime). Carica i file reali in un contesto vm con stub minimi del DOM.
const vm = require('vm');
const fs = require('fs');
const path = require('path');

const JS_DIR = path.join(__dirname, '..', '..', 'frontend', 'js');
let passed = 0, failed = 0;
function check(name, fn) {
    try { fn(); passed++; console.log('  ok  ' + name); }
    catch (e) { failed++; console.log('  FAIL ' + name + ' -> ' + e.message); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg || 'assertion failed'); }

const storage = { gs_lang: 'it' };
const noop = () => {};
const fakeEl = () => ({ style: {}, classList: { add: noop, remove: noop, toggle: noop }, appendChild: noop,
    addEventListener: noop, setAttribute: noop, querySelector: () => null, querySelectorAll: () => [] });
const ctx = {
    console: { log: noop, warn: noop, error: noop },
    localStorage: { getItem: k => (k in storage ? storage[k] : null), setItem: (k, v) => { storage[k] = String(v); } },
    performance: { now: () => 0 },
    setTimeout: noop, clearTimeout: noop, setInterval: noop, clearInterval: noop,
    requestAnimationFrame: noop,
    document: { getElementById: () => null, createElement: fakeEl, querySelector: () => null,
        querySelectorAll: () => [], addEventListener: noop, body: fakeEl(), head: fakeEl() },
};
ctx.window = ctx;
vm.createContext(ctx);
for (const f of ['locale.js', 'season_planner.js', 'commentary.js']) {
    vm.runInContext(fs.readFileSync(path.join(JS_DIR, f), 'utf8'), ctx, { filename: f });
}

console.log('scope.test.js');

check('season_planner.predictMatchResult runs (homeAdv, not undefined homeAdj)', () => {
    const r = ctx.GS_SeasonPlanner.predictMatchResult(80, 75, 70, true, 7);
    assert(typeof r.advantage === 'number' && !Number.isNaN(r.advantage), 'advantage not numeric');
    assert(typeof r.prediction === 'string' && r.prediction.length > 0, 'prediction missing');
});

check('predictMatchResult: home bonus raises advantage vs away', () => {
    const home = ctx.GS_SeasonPlanner.predictMatchResult(80, 75, 70, true, 7).advantage;
    const away = ctx.GS_SeasonPlanner.predictMatchResult(80, 75, 70, false, 7).advantage;
    assert(home - away === 7, 'expected home-away difference of 7, got ' + (home - away));
});

check('season_planner.analyzePerformanceTrend does not throw (SEASON_MONTHS in scope)', () => {
    const log = [9, 10, 11, 12].map((m, i) => ({ avv: 'Team' + i, mese: m, voto: 6 + i * 0.2, gol: i, ass: 0 }));
    const r = ctx.GS_SeasonPlanner.analyzePerformanceTrend(log, 12);
    assert(r === null || typeof r === 'object', 'unexpected return');
});

check('locale.checkAllMilestones runs (getMilestone/getPopLevel via GS_Locale)', () => {
    const r = ctx.checkAllMilestones({ overall: 80, popolarita: 50, team_stelle: 3, age: 25 });
    assert(typeof r.milestone === 'string', 'milestone missing');
    assert(typeof r.popLevel === 'object' || typeof r.popLevel === 'string', 'popLevel missing');
});

check('locale.getFormation / getClubTier run (_lang via GS_Locale)', () => {
    const fn = ctx.GS_Locale.getFormation, tier = ctx.GS_Locale.getClubTier;
    assert(typeof fn === 'function' && typeof tier === 'function', 'helpers not exported');
    fn('4-3-3'); tier(3);
});

check('commentary.generateRichCommentary runs (local pick)', () => {
    const lines = ctx.generateRichCommentary('Mario Rossi', 'Juventus', {}, 'it');
    assert(Array.isArray(lines) && lines.length > 0, 'no commentary lines');
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
