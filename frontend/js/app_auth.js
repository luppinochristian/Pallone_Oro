/* app_auth.js — API helper, login/registrazione, selezione carriera.
 * Estratto da app.js (refactor): nessuna logica modificata.
 * Caricato in ordine da index.html. */

async function api(endpoint, data = {}, method = 'POST') {
    try {
        let url = `${API_BASE}/${endpoint}`;
        const opts = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'X-Auth-Token': authToken || '',
                'X-Lang': currentLang || 'it'
            }
        };
        if (method === 'GET') {
            data.token = authToken || '';
            if (currentCareerId) data.career_id = currentCareerId;
            data.lang = currentLang || 'it';
            data._t = Date.now();
            url += '?' + new URLSearchParams(data);
        } else {
            data.token = authToken || '';
            if (currentCareerId && !data.career_id) data.career_id = currentCareerId;
            data.lang = currentLang || 'it';
            opts.body = JSON.stringify(data);
        }
        const res = await fetch(url, opts);
        const text = await res.text();
        try {
            return JSON.parse(text);
        } catch(e) {
            console.error('Risposta non JSON:', text);
            return { error: _t('server_resp_invalid') + ': ' + text.substring(0, 200) };
        }
    } catch (e) {
        console.error('Fetch error:', e);
        return { error: _t('conn_error') };
    }
}

// ── NAVIGATION ──
function showPage(page) {
    // ── Auth guard: block protected pages if not logged in / guest ──
    const protectedPages = ['dashboard','game','career','transfer','strutture','classifica','agente','notizie','skilltree','achievements'];
    if (protectedPages.includes(page) && !currentCareerId && !_isGuestMode) {
        showPage('auth');
        return;
    }
    const targetPage = document.getElementById(`${page}-page`);
    // Safety: sempre nascondere nav principale sulla pagina auth
    if (page === 'auth') {
        const mn = document.getElementById('main-nav');
        if (mn) mn.style.display = 'none';
        // lang-switcher e settings restano sempre visibili anche in auth
    }
    if (!targetPage) { console.error(`Pagina non trovata: ${page}-page`); return; }
    // Flash on page change
    const overlay = document.getElementById('gs-page-overlay');
    if (overlay) { overlay.classList.add('flash'); setTimeout(() => overlay.classList.remove('flash'), 200); }
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    targetPage.classList.add('active');
    document.querySelectorAll('nav button[data-page]').forEach(b => {
        const isActive = b.dataset.page === page;
        b.classList.toggle('active', isActive);
        if (isActive) b.setAttribute('aria-current', 'page');
        else b.removeAttribute('aria-current');
    });
    // Se la pagina attiva è dentro il menu "Extra", evidenzia anche il pulsante Extra
    // così il giocatore capisce sempre dove si trova nella navigazione.
    const extraPages = ['strutture','agente','skilltree','achievements'];
    const extraBtn = document.getElementById('nav-extra-btn');
    if (extraBtn) {
        const inExtra = extraPages.includes(page);
        extraBtn.classList.toggle('active', inExtra);
        if (inExtra) extraBtn.setAttribute('aria-current', 'true');
        else extraBtn.removeAttribute('aria-current');
    }
    document.getElementById('main-nav').style.display = (page !== 'auth' && page !== 'career-select') ? 'flex' : 'none';

    const exitWrap    = document.getElementById('exit-dropdown-wrap');
    const exitOptHome = document.getElementById('exit-opt-home');
    const exitDivHome = document.getElementById('exit-divider-home');
    const isInGame    = (page !== 'auth' && page !== 'career-select');
    // lang-switcher e settings sempre visibili
    if (exitWrap) exitWrap.style.display = 'flex';
    const langWrap = document.getElementById('lang-switcher-wrap');
    if (langWrap) langWrap.style.display = 'flex';
    const inCareer = isInGame && page !== 'career-select';
    if (exitOptHome) exitOptHome.style.display = inCareer ? 'flex' : 'none';
    if (exitDivHome) exitDivHome.style.display = inCareer ? 'block' : 'none';

    if (page === 'dashboard') renderDashboard();
    if (page === 'game')      renderGame();
    if (page === 'career')    loadCareer();
    if (page === 'transfer')  loadTransfer();
    if (page === 'strutture') loadStrutture();
    if (page === 'classifica') loadClassifica();
    if (page === 'agente')     loadAgente();
    if (page === 'notizie')    loadNotizie();
    if (page === 'achievements') loadAchievements();
    if (page === 'skilltree')  loadSkillTree();
}

document.querySelectorAll('nav button[data-page]').forEach(btn => {
    btn.addEventListener('click', () => {
        showPage(btn.dataset.page);
        // Se il pulsante è dentro il menu Extra, chiudilo dopo la selezione
        closeExtraMenu();
    });
});

// ── Menu "Extra" (raggruppa le funzioni secondarie del nav) ──
function toggleExtraMenu(e) {
    if (e) e.stopPropagation();
    const dd  = document.getElementById('nav-extra-dropdown');
    const btn = document.getElementById('nav-extra-btn');
    if (!dd) return;
    // Sposta il dropdown direttamente sotto <body> alla prima apertura, così esce
    // dal contesto di impilamento dell'header (che lo coprirebbe nonostante lo z-index).
    if (dd.parentElement && dd.parentElement.id !== 'gs-body-portal') {
        document.body.appendChild(dd);
    }
    const open = dd.classList.toggle('open');
    btn?.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open && btn) {
        const r = btn.getBoundingClientRect();
        dd.style.top = (r.bottom + 8) + 'px';
        const ddWidth = dd.offsetWidth || 190;
        let left = r.right - ddWidth;
        if (left < 8) left = 8;
        // Mantieni dentro la viewport anche a destra
        if (left + ddWidth > window.innerWidth - 8) left = window.innerWidth - ddWidth - 8;
        dd.style.left = left + 'px';
        dd.style.right = 'auto';
    }
}
function closeExtraMenu() {
    const dd  = document.getElementById('nav-extra-dropdown');
    const btn = document.getElementById('nav-extra-btn');
    if (dd) dd.classList.remove('open');
    btn?.setAttribute('aria-expanded', 'false');
}
// Chiudi il menu Extra cliccando fuori (il dropdown può essere spostato sotto <body>)
document.addEventListener('click', (e) => {
    const wrap = document.getElementById('nav-extra-wrap');
    const dd   = document.getElementById('nav-extra-dropdown');
    const insideWrap = wrap && wrap.contains(e.target);
    const insideDd   = dd && dd.contains(e.target);
    if (!insideWrap && !insideDd) closeExtraMenu();
});

// ── AUTH ──
function showAuthTab(tab) {
    // Always hide verify panel and restore normal auth UI
    const vp = document.getElementById('verify-panel');
    if (vp) vp.style.display = 'none';
    if (_verifyResendTimer) { clearInterval(_verifyResendTimer); _verifyResendTimer = null; }
    // Restore auth tabs and forms
    document.querySelectorAll('.auth-tabs, .auth-forgot').forEach(el => el.style.display = '');
    document.querySelectorAll('.auth-tab').forEach(b => b.classList.remove('active'));
    document.querySelector(`.auth-tab[data-tab="${tab}"]`)?.classList.add('active');
    document.getElementById('login-form').style.display    = tab === 'login'    ? 'block' : 'none';
    document.getElementById('register-form').style.display = tab === 'register' ? 'block' : 'none';
    document.getElementById('forgot-form').style.display   = 'none';
    // Nasconde solo il nav principale, non lang-switcher e settings
    const mn = document.getElementById('main-nav');
    if (mn) mn.style.display = 'none';
}
function showForgot() {
    ['login-form','register-form'].forEach(id => { const el=document.getElementById(id); if(el) el.style.display='none'; });
    document.getElementById('forgot-form').style.display = 'block';
    document.querySelectorAll('.auth-tab').forEach(b => b.classList.remove('active'));
}

async function doLogin() {
    const email    = document.getElementById('l-email')?.value.trim();
    const password = document.getElementById('l-password')?.value;
    const errEl    = document.getElementById('login-error');
    if (errEl) errEl.textContent = '';
    const res = await api('auth.php', { action:'login', email, password }, 'POST');
    if (res.error) { if (errEl) errEl.textContent = res.error; return; }
    authToken = res.token;
    localStorage.setItem('gs_token', authToken);
    localStorage.setItem('gs_email', email);
    currentCareerId = null; localStorage.removeItem('gs_career');
    showCareerSelect(res.careers || [], res.email || email);
}

async function doRegister() {
    const username = document.getElementById('r-username')?.value.trim();
    const email    = document.getElementById('r-email')?.value.trim();
    const password = document.getElementById('r-password')?.value;
    const pass2    = document.getElementById('r-password2')?.value;
    const errEl    = document.getElementById('register-error');
    if (errEl) errEl.textContent = '';
    if (!username) { if(errEl) errEl.textContent=_t('reg_err_username'); return; }
    if (!email) { if(errEl) errEl.textContent=_t('reg_err_email'); return; }
    if (password !== pass2) { if(errEl) errEl.textContent=_t('reg_err_password'); return; }
    const res = await api('auth.php', { action:'register', email, username, password }, 'POST');
    if (res.error) { if(errEl) errEl.textContent = res.error; return; }
    if (res.pending_verification) {
        showVerifyPanel(email);
    }
}

// ── EMAIL VERIFICATION PANEL ────────────────────────────────────────────────
let _verifyEmail = '';
let _verifyResendTimer = null;

function showVerifyPanel(email) {
    _verifyEmail = email;
    // Hide register form, show verify panel
    const authBox = document.querySelector('.auth-box');
    if (!authBox) return;

    // Create verify panel if not exists
    let panel = document.getElementById('verify-panel');
    if (!panel) {
        panel = document.createElement('div');
        panel.id = 'verify-panel';
        panel.style.cssText = 'display:none;flex-direction:column;gap:16px;';
        panel.innerHTML = `
            <div style="text-align:center;margin-bottom:4px;">
                <div style="font-size:38px;margin-bottom:8px;">📧</div>
                <div id="verify-title-txt" style="font-size:1.1rem;font-weight:800;color:#fff;margin-bottom:6px;"></div>
                <div id="verify-sub-txt" style="font-size:0.82rem;color:#94a3b8;line-height:1.5;"></div>
                <div id="verify-email-txt" style="font-size:0.9rem;font-weight:700;color:#FFD700;margin-top:4px;"></div>
            </div>
            <div style="display:flex;gap:8px;justify-content:center;margin:8px 0;" id="verify-digits-wrap">
                ${[0,1,2,3,4,5].map(i=>`<input id="vd${i}" type="text" inputmode="numeric" maxlength="1"
                    style="width:44px;height:54px;text-align:center;font-size:22px;font-weight:800;
                    background:#0a0f1e;border:2px solid #FFD70044;border-radius:10px;color:#FFD700;
                    outline:none;transition:border-color .2s;" />`).join('')}
            </div>
            <div id="verify-error" style="color:#ff6b6b;font-size:0.82rem;min-height:18px;text-align:center;"></div>
            <button id="verify-submit-btn" onclick="doVerifyCode()"
                style="width:100%;padding:13px;background:linear-gradient(135deg,#FFD700,#B8860B);
                color:#000;border:none;border-radius:10px;font-weight:800;font-size:1rem;cursor:pointer;">
            </button>
            <div style="text-align:center;margin-top:4px;">
                <button id="verify-resend-btn" onclick="doResendCode()"
                    style="background:none;border:none;font-size:0.82rem;cursor:pointer;color:#FFD700;font-weight:600;padding:4px 8px;border-radius:6px;"></button>
            </div>
        `;
        authBox.appendChild(panel);

        // Auto-advance digits
        for (let i = 0; i < 6; i++) {
            const inp = document.getElementById(`vd${i}`);
            inp.addEventListener('input', () => {
                inp.value = inp.value.replace(/\D/g,'').slice(-1);
                if (inp.value && i < 5) document.getElementById(`vd${i+1}`).focus();
            });
            inp.addEventListener('keydown', e => {
                if (e.key === 'Backspace' && !inp.value && i > 0) document.getElementById(`vd${i-1}`).focus();
                if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); doVerifyCode(); }
            });
            inp.addEventListener('focus', () => { inp.style.borderColor='#FFD700'; });
            inp.addEventListener('blur', () => { inp.style.borderColor='#FFD70044'; });
        }
    }

    // Update texts
    document.getElementById('verify-title-txt').textContent = _t('verify_title');
    document.getElementById('verify-sub-txt').textContent   = _t('verify_subtitle');
    document.getElementById('verify-email-txt').textContent = email;
    document.getElementById('verify-submit-btn').textContent = _t('verify_btn');
    document.getElementById('verify-error').textContent = '';

    // Nasconde tutti i pannelli interni dell'auth box e mostra il pannello di verifica
    // al posto dei form di registrazione/login (i selettori coprono tutti gli elementi visibili)
    ['login-form', 'register-form', 'forgot-form'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
    authBox.querySelectorAll('.auth-tabs, .auth-forgot').forEach(el => el.style.display = 'none');
    panel.style.display = 'flex';

    // Start resend countdown
    startResendCountdown();
    document.getElementById('vd0')?.focus();
}

function startResendCountdown() {
    const btn = document.getElementById('verify-resend-btn');
    if (!btn) return;
    clearInterval(_verifyResendTimer);
    let secs = 30;
    btn.disabled = true;
    btn.style.opacity = '0.45';
    btn.style.cursor = 'default';
    const tick = () => {
        btn.textContent = `${_t('verify_resend_wait')} ${secs}s`;
        if (secs <= 0) {
            clearInterval(_verifyResendTimer);
            btn.textContent = _t('verify_resend');
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.style.cursor = 'pointer';
        }
        secs--;
    };
    tick();
    _verifyResendTimer = setInterval(tick, 1000);
}

async function doVerifyCode() {
    const code = [0,1,2,3,4,5].map(i => document.getElementById(`vd${i}`)?.value || '').join('');
    const errEl = document.getElementById('verify-error');
    if (errEl) errEl.textContent = '';
    if (code.length !== 6) { if(errEl) errEl.textContent = _t('verify_err_code'); return; }
    const btn = document.getElementById('verify-submit-btn');
    if (btn) { btn.disabled = true; btn.textContent = '⏳...'; }
    const res = await api('auth.php', { action:'verify_code', email:_verifyEmail, code }, 'POST');
    if (btn) { btn.disabled = false; btn.textContent = _t('verify_btn'); }
    if (res.error) { if(errEl) errEl.textContent = res.error; [0,1,2,3,4,5].forEach(i=>{ const d=document.getElementById(`vd${i}`); if(d){d.value='';d.style.borderColor='#ff6b6b';} }); document.getElementById('vd0')?.focus(); return; }
    authToken = res.token;
    localStorage.setItem('gs_token', authToken);
    localStorage.setItem('gs_email', _verifyEmail);
    if (res.username) localStorage.setItem('gs_username', res.username);
    clearInterval(_verifyResendTimer);
    toast(_t('verify_success'), 'gold');
    currentCareerId = null;
    showCareerSelect([], _verifyEmail);
}

async function doResendCode() {
    const btn = document.getElementById('verify-resend-btn');
    if (btn && btn.disabled) return;
    const res = await api('auth.php', { action:'resend_code', email:_verifyEmail }, 'POST');
    if (res.error) { const errEl=document.getElementById('verify-error'); if(errEl) errEl.textContent=res.error; return; }
    startResendCountdown();
    toast('📧 ' + (_t('verify_resend')), 'gold');
}

async function doForgot() {
    const email = document.getElementById('f-email')?.value.trim();
    const errEl = document.getElementById('forgot-error');
    if (errEl) errEl.textContent = '';
    const res = await api('auth.php', { action:'request_reset', email }, 'POST');
    if (res.error) { if(errEl) errEl.textContent = res.error; return; }
    if (errEl) { errEl.style.color='#4caf50'; errEl.textContent = res.msg || 'Istruzioni inviate!'; }
}

// ── GUEST MODE ──────────────────────────────────────────────────────────────
let _isGuestMode = false;

function startGuestMode() {
    _isGuestMode = true;
    // Crea un player demo in memoria senza toccare il server
    currentPlayer = {
        id: 'guest', career_name: 'Demo Career', player_name: 'Guest Player',
        gender: 'male', age: 20, overall: 65,
        tiro: 62, velocita: 68, dribbling: 65, fisico: 63, mentalita: 64,
        popolarita: 15, energia: 85, morale: 75,
        soldi: 25000, gol_carriera: 0, assist_carriera: 0,
        trofei: 0, palloni_doro: 0, struttura_livello: 0,
        team_id: 1, team_nome: 'FC Demo', team_stelle: 2, team_ovr: 65,
        lega_id: 1, lega_nome: 'Seria Alfa', lega_livello: 1,
        nazione_nome: 'Italy', nationality: 'Italy',
        mese_corrente: 9, anno_corrente: 1,
        infortuni_mesi: 0, trasferimento_anno: 0,
        piede_forte: 3, piede_debole: 2, livello_skill: 2,
        moltiplicatore_stipendio: 100,
        skin_color: 'medium', skin_hair: 'short_black',
        eye_color: 'brown', hair_color: '#1a1a1a', facial_hair: 'none', eyebrow_style: 'standard', freckles: 0, kit_color: null,
    };
    currentCareerId = 'guest';

    _applyTranslations();
    _updateNavLabels();
    showPage('dashboard');
    renderDashboard();

    // Banner ospite persistente
    _showGuestBanner();
}

function _showGuestBanner() {
    let banner = document.getElementById('guest-banner');
    if (!banner) {
        banner = document.createElement('div');
        banner.id = 'guest-banner';
        banner.style.cssText = [
            'position:fixed;bottom:0;left:0;right:0;z-index:2500',
            'background:var(--card2);border-top:2px solid var(--green)',
            'padding:10px 20px;display:flex;align-items:center;justify-content:space-between;gap:12px',
            'font-size:0.82rem;color:var(--text-mid)',
        ].join(';');
        document.body.appendChild(banner);
    }
    banner.innerHTML = `
        <span>${_t('guest_banner')}</span>
        <div style="display:flex;gap:8px;align-items:center">
            <span style="color:var(--text-dim);font-size:0.75rem">${_t('guest_save_prompt')}</span>
            <button onclick="exitGuestMode()" style="padding:6px 14px;background:var(--green);color:#000;border:none;border-radius:6px;font-family:var(--font-display);font-weight:800;font-size:0.8rem;letter-spacing:1px;text-transform:uppercase;cursor:pointer">${_t('guest_register_btn')}</button>
        </div>`;
    banner.style.display = 'flex';
}

function exitGuestMode() {
    _isGuestMode = false;
    currentPlayer = null;
    currentCareerId = null;
    const banner = document.getElementById('guest-banner');
    if (banner) banner.style.display = 'none';
    showPage('auth');
    showAuthTab('register');
}

async function doLogout() {
    document.getElementById('exit-dropdown')?.classList.remove('open');
    await api('auth.php', { action:'logout' }, 'POST');
    authToken = null; currentPlayer = null; currentCareerId = null;
    _cachedCareers = null;
    localStorage.removeItem('gs_token');
    localStorage.removeItem('gs_career');
    document.getElementById('auth-box-main').style.display  = 'block';
    document.getElementById('career-select-box').style.display = 'none';
    document.getElementById('create-career-box').style.display = 'none';
    showPage('auth'); showAuthTab('login');
}

// ── CARRIERE ──
function showCareerSelect(careers, email) {
    showPage('auth');
    document.getElementById('auth-box-main').style.display     = 'none';
    document.getElementById('career-select-box').style.display = 'block';
    document.getElementById('create-career-box').style.display = 'none';
    // Ensure nav is always hidden on career-select
    const mn = document.getElementById('main-nav');
    if (mn) mn.style.display = 'none';
    const emailEl = document.getElementById('career-account-email');
    if (emailEl) emailEl.textContent = email || '';
    _cachedCareers = careers; // cache for language-change re-render
    renderCareerList(careers);
    const exitWrap    = document.getElementById('exit-dropdown-wrap');
    const exitOptHome = document.getElementById('exit-opt-home');
    const exitDivHome = document.getElementById('exit-divider-home');
    if (exitWrap) exitWrap.style.display = 'flex';
    const langWrap2 = document.getElementById('lang-switcher-wrap');
    if (langWrap2) langWrap2.style.display = 'flex';
    if (exitOptHome) exitOptHome.style.display = 'none';
    if (exitDivHome) exitDivHome.style.display = 'none';
}

function renderCareerList(careers) {
    const el       = document.getElementById('careers-list');
    const btnNew   = document.getElementById('btn-new-career');
    const limitMsg = document.getElementById('careers-limit-msg');
    if (!el) return;
    if (!careers || careers.length === 0) {
        el.innerHTML = `<div style="text-align:center;padding:24px;color:var(--text-dim)"><div style="font-size:2.5rem;margin-bottom:12px">⚽</div><p>${_t('no_career').replace('\\n','<br>')}</p></div>`;
        if (btnNew) btnNew.style.display = 'block';
        if (limitMsg) limitMsg.style.display = 'none';
        return;
    }
    const gIcon = g => g === 'female' ? '👩' : '👦';
    el.innerHTML = careers.map(c => `
        <div class="career-card" onclick="selectCareer(${c.id})">
            <div class="career-avatar">${
                renderAvatarSVG(c.skin_color||'medium',c.skin_hair||'short_black',c.eye_color||'brown',c.gender||'male',52,c.hair_color||'#1a1a1a',c.facial_hair||'none',c.eyebrow_style||'standard',c.freckles||0,c.kit_color||null)
            }</div>
            <div class="career-info">
                <div class="career-title">${gIcon(c.gender)} ${esc(c.career_name)}</div>
                <div class="career-sub">${esc(c.player_name)} · OVR ${Number(c.overall)} · ${_t('career_year_label')} ${Number(c.anno_corrente)}</div>
                <div class="career-sub" style="color:var(--text-dim)">${esc(c.team_nome||'')} ${c.lega_nome?'— '+esc(c.lega_nome):''}</div>
                <div class="career-stats">
                    <span>⚽ ${c.gol_carriera} ${_t('stat_gol')}</span>
                    <span>🏆 ${c.trofei} ${_t('stat_trofei')}</span>
                    <span>🌟 ${c.palloni_doro} ${_t('stat_palloni')}</span>
                </div>
            </div>
            <div class="career-actions" onclick="event.stopPropagation()">
                <button data-name="${esc(c.career_name||'')}" onclick="renameCareer(${Number(c.id)}, this.dataset.name)" title="${_t('tooltip_rename')}">✏️</button>
                <button data-name="${esc(c.career_name||'')}" onclick="confirmDeleteCareer(${Number(c.id)}, this.dataset.name)" title="${_t('tooltip_delete')}" style="color:#ff6b6b">🗑️</button>
            </div>
        </div>`).join('');
    if (careers.length >= 5) { if(btnNew) btnNew.style.display='none'; if(limitMsg) limitMsg.style.display='block'; }
    else { if(btnNew) btnNew.style.display='block'; if(limitMsg) limitMsg.style.display='none'; }
}

async function selectCareer(id) {
    currentCareerId = id; localStorage.setItem('gs_career', id);
    if (window.GS_Achievements) GS_Achievements.setCareer(id);
    await loadPlayer();
    // Reapply language after entering game so nav and all data-i18n elements are correct
    _applyTranslations();
    _updateNavLabels();
    showPage('dashboard');
}

function showCreateCareer() {
    const cnInput = document.getElementById('c-career-name');
    if (cnInput) cnInput.value = _t('default_career_name');

    document.getElementById('career-select-box').style.display = 'none';
    document.getElementById('create-career-box').style.display = 'flex';
    // Reset all wizard step panels to avoid stale state from previous sessions
    for (let i = 1; i <= 4; i++) {
        const p = document.getElementById(`cc-step-${i}`);
        if (p) { p.classList.remove('active', 'exit'); }
    }
    // Ogni apertura del wizard parte dall'aspetto di default
    resetAppearance();
    // Wizard init
    _ccCurrentStep = 1; _ccGender = 'male'; _ccFoot = 'dx'; _ccRole = 'bomber';
    ccGoStep(1);
    setTimeout(() => {
        ccBuildNationList();
        ccBuildRoleGrid();
        // Inizializza il trigger con la nazione di default
        const defNat = CC_ALL_NATIONS.find(n => n.key === 'Italy') || CC_ALL_NATIONS[0];
        if (defNat) {
            const triggerFlag = document.getElementById('cc-trigger-flag');
            const triggerName = document.getElementById('cc-trigger-name');
            if (triggerFlag) triggerFlag.src = 'https://flagcdn.com/w40/' + defNat.iso + '.png';
            if (triggerName) triggerName.textContent = {it:'Italia',en:'Italy',de:'Italien',es:'Italia'}[currentLang]||'Italia';
            const trigger = document.getElementById('cc-nation-trigger');
            if (trigger) trigger.style.setProperty('--nat-color', defNat.color || '#888');
        }
        // Chiudi dropdown cliccando fuori
        document.addEventListener('click', function _natOutside(e) {
            if (!e.target.closest('#cc-nation-dropdown')) {
                document.getElementById('cc-nation-panel')?.classList.remove('open');
                document.getElementById('cc-nation-dropdown')?.classList.remove('open');
            }
        }, { capture: true, once: false });
    }, 50);
}

// ── Character Creation Wizard ────────────────────────────────────────────────
