/* app_create.js — creazione carriera (wizard) e caricamento giocatore.
 * Estratto da app.js (refactor): nessuna logica modificata.
 * Caricato in ordine da index.html. */

let _ccCurrentStep = 1;
let _ccGender = 'male';
let _ccFoot = 'dx';
let _ccRole = 'bomber';
const CC_ROLES = [
    { id:'bomber',        statKey:'tiro',      icon:'⚽' },
    { id:'fantasista',    statKey:'dribbling', icon:'✨' },
    { id:'ala',           statKey:'velocita',  icon:'⚡' },
    { id:'regista',       statKey:'mentalita', icon:'🧠' },
    { id:'tuttocampista', statKey:'fisico',    icon:'💪' },
];
const CC_ALL_NATIONS = [
    {key:'Albania',      key_it:'Albania',          key_de:'Albanien',        key_es:'Albania',         iso:'al', color:'#e41e20'},
    {key:'Algeria',      key_it:'Algeria',          key_de:'Algerien',        key_es:'Argelia',         iso:'dz', color:'#006233'},
    {key:'Argentina',    key_it:'Argentina',        key_de:'Argentinien',     key_es:'Argentina',       iso:'ar', color:'#74acdf'},
    {key:'Australia',    key_it:'Australia',        key_de:'Australien',      key_es:'Australia',       iso:'au', color:'#00008b'},
    {key:'Austria',      key_it:'Austria',          key_de:'Österreich',      key_es:'Austria',         iso:'at', color:'#ed2939'},
    {key:'Belgium',      key_it:'Belgio',           key_de:'Belgien',         key_es:'Bélgica',         iso:'be', color:'#ef3340'},
    {key:'Bolivia',      key_it:'Bolivia',          key_de:'Bolivien',        key_es:'Bolivia',         iso:'bo', color:'#d52b1e'},
    {key:'Bosnia',       key_it:'Bosnia',           key_de:'Bosnien',         key_es:'Bosnia',          iso:'ba', color:'#002395'},
    {key:'Brazil',       key_it:'Brasile',          key_de:'Brasilien',       key_es:'Brasil',          iso:'br', color:'#009c3b'},
    {key:'Bulgaria',     key_it:'Bulgaria',         key_de:'Bulgarien',       key_es:'Bulgaria',        iso:'bg', color:'#00966e'},
    {key:'Cameroon',     key_it:'Camerun',          key_de:'Kamerun',         key_es:'Camerún',         iso:'cm', color:'#007a5e'},
    {key:'Canada',       key_it:'Canada',           key_de:'Kanada',          key_es:'Canadá',          iso:'ca', color:'#ff0000'},
    {key:'Chile',        key_it:'Cile',             key_de:'Chile',           key_es:'Chile',           iso:'cl', color:'#d52b1e'},
    {key:'China',        key_it:'Cina',             key_de:'China',           key_es:'China',           iso:'cn', color:'#de2910'},
    {key:'Colombia',     key_it:'Colombia',         key_de:'Kolumbien',       key_es:'Colombia',        iso:'co', color:'#fcd116'},
    {key:'CostaRica',    key_it:'Costa Rica',       key_de:'Costa Rica',      key_es:'Costa Rica',      iso:'cr', color:'#002b7f'},
    {key:'Croatia',      key_it:'Croazia',          key_de:'Kroatien',        key_es:'Croacia',         iso:'hr', color:'#e31837'},
    {key:'CzechRepublic',key_it:'Rep. Ceca',        key_de:'Tschechien',      key_es:'Rep. Checa',      iso:'cz', color:'#d7141a'},
    {key:'DRCongo',      key_it:'Congo DR',         key_de:'DR Kongo',        key_es:'RD Congo',        iso:'cd', color:'#007fff'},
    {key:'Denmark',      key_it:'Danimarca',        key_de:'Dänemark',        key_es:'Dinamarca',       iso:'dk', color:'#c60c30'},
    {key:'Ecuador',      key_it:'Ecuador',          key_de:'Ecuador',         key_es:'Ecuador',         iso:'ec', color:'#ffd100'},
    {key:'Egypt',        key_it:'Egitto',           key_de:'Ägypten',         key_es:'Egipto',          iso:'eg', color:'#ce1126'},
    {key:'England',      key_it:'Inghilterra',      key_de:'England',         key_es:'Inglaterra',      iso:'gb-eng', color:'#cf142b'},
    {key:'Finland',      key_it:'Finlandia',        key_de:'Finnland',        key_es:'Finlandia',       iso:'fi', color:'#003580'},
    {key:'France',       key_it:'Francia',          key_de:'Frankreich',      key_es:'Francia',         iso:'fr', color:'#002395'},
    {key:'Germany',      key_it:'Germania',         key_de:'Deutschland',     key_es:'Alemania',        iso:'de', color:'#555'},
    {key:'Ghana',        key_it:'Ghana',            key_de:'Ghana',           key_es:'Ghana',           iso:'gh', color:'#006b3f'},
    {key:'Greece',       key_it:'Grecia',           key_de:'Griechenland',    key_es:'Grecia',          iso:'gr', color:'#0d5eaf'},
    {key:'Hungary',      key_it:'Ungheria',         key_de:'Ungarn',          key_es:'Hungría',         iso:'hu', color:'#ce2939'},
    {key:'Iceland',      key_it:'Islanda',          key_de:'Island',          key_es:'Islandia',        iso:'is', color:'#003897'},
    {key:'Iran',         key_it:'Iran',             key_de:'Iran',            key_es:'Irán',            iso:'ir', color:'#239f40'},
    {key:'Ireland',      key_it:'Irlanda',          key_de:'Irland',          key_es:'Irlanda',         iso:'ie', color:'#169b62'},
    {key:'Italy',        key_it:'Italia',           key_de:'Italien',         key_es:'Italia',          iso:'it', color:'#009246'},
    {key:'Ivory_Coast',  key_it:"Costa d'Avorio",   key_de:'Elfenbeinküste',  key_es:'Costa de Marfil', iso:'ci', color:'#f77f00'},
    {key:'Jamaica',      key_it:'Giamaica',         key_de:'Jamaika',         key_es:'Jamaica',         iso:'jm', color:'#000000'},
    {key:'Japan',        key_it:'Giappone',         key_de:'Japan',           key_es:'Japón',           iso:'jp', color:'#bc002d'},
    {key:'Mali',         key_it:'Mali',             key_de:'Mali',            key_es:'Malí',            iso:'ml', color:'#14b53a'},
    {key:'Mexico',       key_it:'Messico',          key_de:'Mexiko',          key_es:'México',          iso:'mx', color:'#006847'},
    {key:'Montenegro',   key_it:'Montenegro',       key_de:'Montenegro',      key_es:'Montenegro',      iso:'me', color:'#d4af37'},
    {key:'Morocco',      key_it:'Marocco',          key_de:'Marokko',         key_es:'Marruecos',       iso:'ma', color:'#c1272d'},
    {key:'Netherlands',  key_it:'Olanda',           key_de:'Niederlande',     key_es:'Países Bajos',    iso:'nl', color:'#ae1c28'},
    {key:'Nigeria',      key_it:'Nigeria',          key_de:'Nigeria',         key_es:'Nigeria',         iso:'ng', color:'#008751'},
    {key:'Norway',       key_it:'Norvegia',         key_de:'Norwegen',        key_es:'Noruega',         iso:'no', color:'#ef2b2d'},
    {key:'Paraguay',     key_it:'Paraguay',         key_de:'Paraguay',        key_es:'Paraguay',        iso:'py', color:'#d52b1e'},
    {key:'Peru',         key_it:'Perù',             key_de:'Peru',            key_es:'Perú',            iso:'pe', color:'#d91023'},
    {key:'Poland',       key_it:'Polonia',          key_de:'Polen',           key_es:'Polonia',         iso:'pl', color:'#dc143c'},
    {key:'Portugal',     key_it:'Portogallo',       key_de:'Portugal',        key_es:'Portugal',        iso:'pt', color:'#006600'},
    {key:'Qatar',        key_it:'Qatar',            key_de:'Katar',           key_es:'Catar',           iso:'qa', color:'#8d1b3d'},
    {key:'Romania',      key_it:'Romania',          key_de:'Rumänien',        key_es:'Rumanía',         iso:'ro', color:'#002b7f'},
    {key:'Russia',       key_it:'Russia',           key_de:'Russland',        key_es:'Rusia',           iso:'ru', color:'#cc0000'},
    {key:'SaudiArabia',  key_it:'Arabia Saudita',   key_de:'Saudi-Arabien',   key_es:'Arabia Saudita',  iso:'sa', color:'#006c35'},
    {key:'Scotland',     key_it:'Scozia',           key_de:'Schottland',      key_es:'Escocia',         iso:'gb-sct', color:'#003078'},
    {key:'Senegal',      key_it:'Senegal',          key_de:'Senegal',         key_es:'Senegal',         iso:'sn', color:'#00853f'},
    {key:'Serbia',       key_it:'Serbia',           key_de:'Serbien',         key_es:'Serbia',          iso:'rs', color:'#c6363c'},
    {key:'Slovakia',     key_it:'Slovacchia',       key_de:'Slowakei',        key_es:'Eslovaquia',      iso:'sk', color:'#0b4ea2'},
    {key:'Slovenia',     key_it:'Slovenia',         key_de:'Slowenien',       key_es:'Eslovenia',       iso:'si', color:'#003da5'},
    {key:'SouthAfrica',  key_it:'Sudafrica',        key_de:'Südafrika',       key_es:'Sudáfrica',       iso:'za', color:'#007749'},
    {key:'SouthKorea',   key_it:'Corea del Sud',    key_de:'Südkorea',        key_es:'Corea del Sur',   iso:'kr', color:'#cd2e3a'},
    {key:'Spain',        key_it:'Spagna',           key_de:'Spanien',         key_es:'España',          iso:'es', color:'#c60b1e'},
    {key:'Sweden',       key_it:'Svezia',           key_de:'Schweden',        key_es:'Suecia',          iso:'se', color:'#006aa7'},
    {key:'Switzerland',  key_it:'Svizzera',         key_de:'Schweiz',         key_es:'Suiza',           iso:'ch', color:'#ff0000'},
    {key:'Tunisia',      key_it:'Tunisia',          key_de:'Tunesien',        key_es:'Túnez',           iso:'tn', color:'#e70013'},
    {key:'Turkey',       key_it:'Turchia',          key_de:'Türkei',          key_es:'Turquía',         iso:'tr', color:'#e30a17'},
    {key:'Ukraine',      key_it:'Ucraina',          key_de:'Ukraine',         key_es:'Ucrania',         iso:'ua', color:'#005bbb'},
    {key:'Uruguay',      key_it:'Uruguay',          key_de:'Uruguay',         key_es:'Uruguay',         iso:'uy', color:'#5aaaa8'},
    {key:'USA',          key_it:'USA',              key_de:'USA',             key_es:'EE. UU.',          iso:'us', color:'#3c3b6e'},
    {key:'Venezuela',    key_it:'Venezuela',        key_de:'Venezuela',       key_es:'Venezuela',       iso:'ve', color:'#cf142b'},
    {key:'Wales',        key_it:'Galles',           key_de:'Wales',           key_es:'Gales',           iso:'gb-wls', color:'#00ab39'},
];

function ccGoStep(n) {
    // Reset ALL panels first to avoid stale 'active' classes from previous sessions
    for (let i = 1; i <= 4; i++) {
        const p = document.getElementById(`cc-step-${i}`);
        if (p) { p.classList.remove('active'); p.classList.remove('exit'); }
    }
    const old = document.getElementById(`cc-step-${_ccCurrentStep}`);
    if (old && _ccCurrentStep !== n) { old.classList.add('exit'); setTimeout(() => old.classList.remove('exit'), 300); }
    _ccCurrentStep = n;
    const panel = document.getElementById(`cc-step-${n}`);
    if (panel) { setTimeout(() => panel.classList.add('active'), 50); }
    // Pills
    for (let i = 1; i <= 4; i++) {
        const pill = document.getElementById(`pill-${i}`);
        if (!pill) continue;
        pill.className = 'cc-step-pill' + (i < n ? ' done' : i === n ? ' active' : '');
    }
    for (let i = 1; i <= 3; i++) {
        const line = document.getElementById(`line-${i}-${i+1}`);
        if (line) line.className = 'cc-step-line' + (i < n ? ' done' : '');
    }
    if (n === 4) ccBuildSummary();
}

function ccNextStep(from) {
    if (from === 1) {
        const name = document.getElementById('c-name')?.value.trim();
        if (!name) { ccShakeField('c-name'); return; }
    }
    ccGoStep(from + 1);
}

function ccShakeField(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.borderColor = 'var(--red)';
    el.classList.add('cc-shake');
    setTimeout(() => { el.style.borderColor = ''; el.classList.remove('cc-shake'); }, 600);
    el.focus();
}

function ccSetGender(val) {
    if (_ccGender === val) return; // nessun cambiamento, evita reset inutile
    _ccGender = val;
    document.querySelectorAll('#gender-toggle .cc-toggle').forEach(b => b.classList.toggle('active', b.dataset.val === val));
    updateAvatar();
}

function ccSetFoot(val) {
    _ccFoot = val;
    document.getElementById('c-piede-preferito').value = val;
    document.querySelectorAll('#foot-toggle .cc-toggle').forEach(b => b.classList.toggle('active', b.dataset.val === val));
}

function ccAgeStep(delta) {
    const input = document.getElementById('c-age');
    const display = document.getElementById('c-age-display');
    let val = parseInt(input.value) + delta;
    val = Math.max(16, Math.min(22, val));
    input.value = val;
    display.textContent = val;
}

function ccBuildNationList(filter = '') {
    const list = document.getElementById('cc-nation-list');
    if (!list) return;
    const current = document.getElementById('c-nationality')?.value || 'Italy';
    const fLow = filter.toLowerCase();

    // Pick name key for current language
    const nameKey = { en: 'key', it: 'key_it', de: 'key_de', es: 'key_es' }[currentLang] || 'key_it';
    const locale  = { en: 'en', it: 'it', de: 'de', es: 'es' }[currentLang] || 'it';
    let sorted = [...CC_ALL_NATIONS].sort((a, b) =>
        (a[nameKey] || a.key).localeCompare(b[nameKey] || b.key, locale)
    );

    if (filter) {
        sorted = sorted.filter(n =>
            n.key.toLowerCase().includes(fLow) ||
            (n.key_it || '').toLowerCase().includes(fLow) ||
            (n.key_de || '').toLowerCase().includes(fLow) ||
            (n.key_es || '').toLowerCase().includes(fLow) ||
            n.key.toLowerCase().replace(/_/g,' ').includes(fLow)
        );
    }

    list.innerHTML = sorted.map(n => {
        const name = (n[nameKey] || n.key).replace(/_/g,' ');
        return `<div class="cc-nation-item ${n.key === current ? 'active' : ''}"
             style="--nat-color: ${n.color || '#888'};"
             onclick="ccSelectNation('${n.key}')">
            <img class="cc-nation-flag-img"
                 src="https://flagcdn.com/w40/${n.iso}.png"
                 alt="${n.key}"
                 onerror="this.style.display='none'">
            <span class="cc-nation-name">${name}</span>
        </div>`;
    }).join('');
}

function ccFilterNations(val) {
    ccBuildNationList(val);
}

function ccToggleNationDropdown() {
    const panel = document.getElementById('cc-nation-panel');
    const dropdown = document.getElementById('cc-nation-dropdown');
    if (!panel) return;
    const isOpen = panel.classList.contains('open');
    if (isOpen) {
        panel.classList.remove('open');
        dropdown?.classList.remove('open');
    } else {
        panel.classList.add('open');
        dropdown?.classList.add('open');
        ccBuildNationList('');
        const search = document.getElementById('cc-nation-search-input');
        if (search) { search.value = ''; search.focus(); }
        // Scroll to active item
        setTimeout(() => {
            const active = panel.querySelector('.cc-nation-item.active');
            if (active) active.scrollIntoView({ block: 'nearest' });
        }, 60);
    }
}

function ccSelectNation(key) {
    document.getElementById('c-nationality').value = key;
    const n = CC_ALL_NATIONS.find(n => n.key === key);
    if (n) {
        const nameKey = { en: 'key', it: 'key_it', de: 'key_de', es: 'key_es' }[currentLang] || 'key_it';
        const name = (n[nameKey] || n.key).replace(/_/g,' ');
        const triggerFlag = document.getElementById('cc-trigger-flag');
        const triggerName = document.getElementById('cc-trigger-name');
        if (triggerFlag) { triggerFlag.src = 'https://flagcdn.com/w40/' + n.iso + '.png'; triggerFlag.alt = n.key; }
        if (triggerName) triggerName.textContent = name;
        const trigger = document.getElementById('cc-nation-trigger');
        if (trigger) trigger.style.setProperty('--nat-color', n.color || '#888');
    }
    // Close dropdown
    document.getElementById('cc-nation-panel')?.classList.remove('open');
    document.getElementById('cc-nation-dropdown')?.classList.remove('open');
    // Rebuild to update active state
    ccBuildNationList(document.getElementById('cc-nation-search-input')?.value || '');
}

function ccBuildRoleGrid() {
    const grid = document.getElementById('cc-role-grid');
    if (!grid) return;
    grid.innerHTML = CC_ROLES.map(r => `
        <div class="cc-role-card ${r.id === _ccRole ? 'active' : ''}" onclick="ccSelectRole('${r.id}')">
            <div class="cc-role-icon">${r.icon}</div>
            <div class="cc-role-name" data-i18n="cc_role_${r.id}">${_t('cc_role_'+r.id)}</div>
            <div class="cc-role-sub" data-i18n="cc_role_${r.id}_sub">${_t('cc_role_'+r.id+'_sub')}</div>
        </div>
    `).join('');
}

function ccSelectRole(id) {
    _ccRole = id;
    document.getElementById('c-role').value = id;
    document.querySelectorAll('.cc-role-card').forEach(c => c.classList.toggle('active', c.onclick?.toString().includes(`'${id}'`)));
    ccBuildRoleGrid();
}

function ccBuildSummary() {
    const name = document.getElementById('c-name')?.value.trim() || '—';
    const career = document.getElementById('c-career-name')?.value.trim() || _t('default_career_name');
    const age = document.getElementById('c-age')?.value || '17';
    const natKey = document.getElementById('c-nationality')?.value || 'Italy';
    const nation = CC_ALL_NATIONS.find(n => n.key === natKey);
    const role = CC_ROLES.find(r => r.id === _ccRole);
    const foot = _ccFoot === 'dx' ? _t('foot_right') : _t('foot_left');

    document.getElementById('cc-summary-name').textContent = name;
    document.getElementById('cc-summary-career').textContent = career;
    document.getElementById('cc-summary-tags').innerHTML = [
        `<span class="cc-tag" style="border: 1.5px solid ${nation?.color||'var(--border)'};">${({en:natKey.replace(/_/g,' '),it:nation?.key_it||natKey,de:nation?.key_de||natKey,es:nation?.key_es||natKey})[currentLang]||nation?.key_it||natKey}</span>`,
        `<span class="cc-tag">🎂 ${age} ${{it:'anni',en:'yrs',de:'J.',es:'años'}[currentLang]||'anni'}</span>`,
        `<span class="cc-tag">${role?.icon||''} ${_t('cc_role_'+_ccRole)}</span>`,
        `<span class="cc-tag">🦶 ${foot}</span>`,
    ].join('');

    // Copia l'anteprima SVG nel riepilogo
    const dest = document.getElementById('cc-summary-avatar');
    const src  = document.getElementById('avatar-preview');
    if (dest && src) dest.innerHTML = src.innerHTML;
}


function showCareerSelectBack() {
    document.getElementById('career-select-box').style.display = 'block';
    document.getElementById('create-career-box').style.display = 'none';
}

let _ccCreating = false; // flag anti-doppio-submit creazione carriera

async function doCreateCareer() {
    if (_ccCreating) return;
    const career_name     = (document.getElementById('c-career-name')?.value.trim()) || _t('default_career_name');
    const player_name     = document.getElementById('c-name')?.value.trim();
    const gender          = _ccGender || 'male';
    const age             = document.getElementById('c-age')?.value || '17';
    const nationality     = document.getElementById('c-nationality')?.value || 'Italy';
    const piede_preferito = _ccFoot || 'dx';
    const piede_forte_lato  = piede_preferito;
    const piede_debole_lato = piede_preferito === 'dx' ? 'sx' : 'dx';
    const role            = _ccRole || 'bomber';
    const errEl = document.getElementById('create-error');
    if (errEl) errEl.textContent = '';
    if (!player_name) { ccShakeField('c-name'); ccGoStep(1); return; }


    // Disabilita il bottone per evitare doppio submit
    _ccCreating = true;
    const submitBtn = document.querySelector('.cc-btn-start');
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = '⏳...'; }

    try {
        const res = await api('auth.php', {
            action:'create_career', career_name, player_name, gender, age, nationality, role,
            skin_hair:  selectedHairStyle,
            skin_color: selectedSkin,
            eye_color:  selectedEye,
            hair_color: selectedHairColor,
            facial_hair: selectedFacialHair,
            eyebrow_style: selectedEyebrowStyle,
            freckles: selectedFreckles,
            kit_color: selectedKit,
            piede_forte: 3, piede_debole: 2, piede_forte_lato, piede_debole_lato
        }, 'POST');
        if (res.error) { if(errEl) errEl.textContent = res.error; return; }
        currentCareerId = res.career_id; localStorage.setItem('gs_career', currentCareerId);
        await loadPlayer();
        _applyTranslations();
        _updateNavLabels();
        showPage('dashboard');
        if (window.GS_Particles) GS_Particles.effects.confettiRain();
        toast(_t('welcome_career'), 'gold');
        // Tutorial al PRIMO accesso: reset + avvio immediato alla creazione carriera
        setTimeout(() => {
            if (window.GS_Tutorial) { GS_Tutorial.reset(); GS_Tutorial.start(true); }
        }, 1200);
    } catch(e) {
        if (errEl) errEl.textContent = _t('error_generic_msg');
    } finally {
        _ccCreating = false;
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = _t('create_start_btn') || '🌟 Inizia la Carriera!'; }
    }
}

async function renameCareer(id, currentName) {
    try {
    const name = prompt(_t('rename_career_prompt'), currentName);
    if (!name || name.trim() === currentName) return;
    const res = await api('auth.php', { action:'rename_career', career_id:id, name:name.trim() }, 'POST');
    if (res.error) { toast(res.error,'error'); return; }
    renderCareerList(res.careers);
    } catch(e) { console.error('renameCareer error:', e); }
}

async function confirmDeleteCareer(id, name) {
    try {
    if (!confirm(_t('delete_career_confirm').replace('{0}', name))) return;
    const res = await api('auth.php', { action:'delete_career', career_id:id }, 'POST');
    if (res.error) { toast(res.error,'error'); return; }
    renderCareerList(res.careers); toast(_t('career_deleted'),'info');
    } catch(e) { console.error('confirmDeleteCareer error:', e); }
}

// ── LOAD PLAYER ──
async function loadPlayer() {
    if (!currentCareerId) return;
    const [res, agRes] = await Promise.all([
        api('player.php', { action:'get', career_id:currentCareerId }, 'GET'),
        api('agente.php', { action:'get', career_id:currentCareerId }, 'GET')
    ]);
    if (res && !res.error) {
        const agSconti = {1:2.5, 2:5.0, 3:7.5, 4:10.0, 5:15.0};
        res.agent_ovr_sconto = agSconti[agRes?.livello] || 0;
        // Check achievements on any player data load
        if (window.GS_Achievements) GS_Achievements.checkFromPlayer(res);
        // Show contextual tutorial tips
        if (window.GS_AdvancedTutorial) GS_AdvancedTutorial.checkContext(res);
        currentPlayer = res;
    }
}

// ── DASHBOARD ──
