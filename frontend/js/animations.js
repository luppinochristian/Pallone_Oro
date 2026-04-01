/**
 * ============================================================
 * animations.js — Animazioni UI e transizioni di pagina
 * ============================================================
 * Gestisce tutte le animazioni dell'interfaccia utente:
 * transizioni tra pagine, effetti sui numeri, animazioni
 * di entrata/uscita degli elementi.
 *
 * FUNZIONALITÀ:
 *  - pageTransition(from, to, dir): transizione fluida tra pagine
 *  - counterAnimation(el, start, end, dur): animazione contatore
 *  - pulseElement(el): effetto pulse su elemento
 *  - slideIn(el, dir): animazione entrata da direzione
 *  - fadeIn(el, dur) / fadeOut(el, dur): dissolvenza
 *  - shakeElement(el): tremito per errori
 *  - glowEffect(el, color): bagliore colorato temporaneo
 *
 * PALETTE ANIMAZIONI:
 *  - green (#00C566): eventi positivi
 *  - gold (#E8B84B): achievement, Pallone d'Oro
 *  - white (#E8EDF2): transizioni neutre
 *  - dim (#6B8299): elementi secondari
 *
 * Usa Web Animations API e requestAnimationFrame.
 * Nessun interval su proprietà paint per massima performance.
 *
 * Esposto come oggetto globale GS_Animations.
 * ============================================================
 */

const GS_Animations = (() => {

    const C = {
        green:    '#00C566',
        gold:     '#E8B84B',
        white:    '#E8EDF2',
        dim:      '#6B8299',
    };

    // ── Page transitions ──────────────────────────────────────────────────────
    function pageTransition(fromEl, toEl, direction = 'right') {
        if (!fromEl || !toEl) return;
        const dx = direction === 'right' ? '24px' : '-24px';
        fromEl.animate([
            { opacity: 1, transform: 'translateX(0)' },
            { opacity: 0, transform: `translateX(${direction === 'right' ? '-24px' : '24px'})` },
        ], { duration: 180, easing: 'ease-in', fill: 'forwards' });

        toEl.style.display = 'block';
        toEl.animate([
            { opacity: 0, transform: `translateX(${dx})` },
            { opacity: 1, transform: 'translateX(0)' },
        ], { duration: 220, delay: 80, easing: 'cubic-bezier(0.22,1,0.36,1)', fill: 'forwards' });
    }

    // ── Number counter ────────────────────────────────────────────────────────
    function countUp(el, target, duration = 700) {
        if (!el) return;
        const start     = parseInt(el.textContent) || 0;
        const startTime = performance.now();
        function tick(now) {
            const p    = Math.min((now - startTime) / duration, 1);
            const ease = 1 - Math.pow(1 - p, 3);
            el.textContent = Math.round(start + (target - start) * ease);
            if (p < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
    }

    // ── Skeleton loader ───────────────────────────────────────────────────────
    function createSkeleton(lines = 3, widths = ['100%', '80%', '60%']) {
        const el = document.createElement('div');
        el.className = 'gs-skeleton-wrap';
        for (let i = 0; i < lines; i++) {
            const line = document.createElement('div');
            line.className = 'gs-skeleton-line skeleton';
            line.style.cssText = `width:${widths[i % widths.length]};height:14px;margin-bottom:10px;border-radius:4px`;
            el.appendChild(line);
        }
        return el;
    }

    // ── Stadium SVG — "Stadio di notte" ──────────────────────────────────────
    function createStadiumSVG() {
        const homeColors = ['#1e3a8a','#1e40af','#2563eb','#3b82f6','#1d4ed8','#0d47a1'];
        const awayColors = ['#7f1d1d','#991b1b','#b91c1c','#dc2626','#ef4444','#c62828'];

        function makeSeats(count, y, colors) {
            return Array.from({ length: count }, (_, i) => {
                const x = (i / count) * 760 + 20;
                const c = colors[i % colors.length];
                return `<ellipse cx="${x.toFixed(1)}" cy="${y}" rx="5" ry="7" fill="${c}" opacity="0.72"/>`;
            }).join('');
        }

        const stripes = Array.from({ length: 9 }, (_, i) => {
            const x = 55 + i * (690 / 9);
            const w = 690 / 9;
            return i % 2 === 0 ? `<rect x="${x.toFixed(1)}" y="108" width="${w.toFixed(1)}" height="216" fill="#1e6b1e"/>` : '';
        }).join('');

        return `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400" class="gs-stadium-bg" aria-hidden="true">
          <defs>
            <radialGradient id="pitchGrad" cx="50%" cy="50%" r="55%">
              <stop offset="0%"   stop-color="#1a5c1a"/>
              <stop offset="100%" stop-color="#0d3010"/>
            </radialGradient>
            <radialGradient id="lightL" cx="18%" cy="0%" r="52%">
              <stop offset="0%"  stop-color="rgba(0,197,102,0.09)"/>
              <stop offset="100%" stop-color="rgba(0,197,102,0)"/>
            </radialGradient>
            <radialGradient id="lightR" cx="82%" cy="0%" r="52%">
              <stop offset="0%"  stop-color="rgba(0,197,102,0.07)"/>
              <stop offset="100%" stop-color="rgba(0,197,102,0)"/>
            </radialGradient>
            <radialGradient id="floodGlow" cx="50%" cy="0%" r="60%">
              <stop offset="0%"  stop-color="rgba(255,255,220,0.14)"/>
              <stop offset="100%" stop-color="rgba(255,255,220,0)"/>
            </radialGradient>
            <filter id="softBlur"><feGaussianBlur stdDeviation="2"/></filter>
          </defs>

          <rect width="800" height="400" fill="#080c10"/>
          <rect width="800" height="400" fill="url(#floodGlow)"/>

          <!-- Tribune nord -->
          <rect x="0" y="0" width="800" height="108" fill="#0d1520" opacity="0.96"/>
          ${makeSeats(38, 20, homeColors)}
          ${makeSeats(35, 42, homeColors)}
          ${makeSeats(32, 63, homeColors)}

          <!-- Tribune sud -->
          <rect x="0" y="308" width="800" height="92" fill="#0d1520" opacity="0.96"/>
          ${makeSeats(38, 328, awayColors)}
          ${makeSeats(35, 350, awayColors)}
          ${makeSeats(28, 370, awayColors)}

          <rect x="0" y="0" width="800" height="400" fill="url(#lightL)"/>
          <rect x="0" y="0" width="800" height="400" fill="url(#lightR)"/>

          <!-- Torri floodlight sx -->
          <g class="gs-floodlights" fill="#b0b8c0">
            <rect x="18" y="8" width="6" height="50" rx="2"/>
            <rect x="8"  y="6" width="26" height="5" rx="2"/>
            <rect x="9"  y="3" width="4" height="4" rx="1" fill="#fffde0" opacity="0.95"/>
            <rect x="15" y="3" width="4" height="4" rx="1" fill="#fffde0" opacity="0.95"/>
            <rect x="21" y="3" width="4" height="4" rx="1" fill="#fffde0" opacity="0.95"/>
            <rect x="27" y="3" width="4" height="4" rx="1" fill="#fffde0" opacity="0.95"/>
          </g>
          <!-- Bagliore torre sx -->
          <ellipse cx="22" cy="6" rx="16" ry="8" fill="rgba(255,255,200,0.1)" filter="url(#softBlur)"/>

          <!-- Torri floodlight dx -->
          <g class="gs-floodlights" fill="#b0b8c0">
            <rect x="776" y="8" width="6" height="50" rx="2"/>
            <rect x="766" y="6" width="26" height="5" rx="2"/>
            <rect x="767" y="3" width="4" height="4" rx="1" fill="#fffde0" opacity="0.95"/>
            <rect x="773" y="3" width="4" height="4" rx="1" fill="#fffde0" opacity="0.95"/>
            <rect x="779" y="3" width="4" height="4" rx="1" fill="#fffde0" opacity="0.95"/>
            <rect x="785" y="3" width="4" height="4" rx="1" fill="#fffde0" opacity="0.95"/>
          </g>
          <ellipse cx="778" cy="6" rx="16" ry="8" fill="rgba(255,255,200,0.1)" filter="url(#softBlur)"/>

          <!-- Campo -->
          <rect x="55" y="108" width="690" height="216" rx="6" fill="url(#pitchGrad)"/>
          <g opacity="0.18">${stripes}</g>

          <!-- Linee campo -->
          <g fill="none" stroke="rgba(255,255,255,0.26)" stroke-width="1.5">
            <rect x="60" y="112" width="680" height="208" rx="3"/>
            <line x1="400" y1="112" x2="400" y2="320"/>
            <circle cx="400" cy="216" r="42"/>
            <circle cx="400" cy="216" r="2.5" fill="rgba(255,255,255,0.26)" stroke="none"/>
            <rect x="60" y="163" width="94" height="106"/>
            <rect x="60" y="187" width="38" height="58"/>
            <circle cx="116" cy="216" r="2" fill="rgba(255,255,255,0.26)" stroke="none"/>
            <path d="M 154 186 A 42 42 0 0 1 154 246" stroke-dasharray="4,3"/>
            <rect x="646" y="163" width="94" height="106"/>
            <rect x="702" y="187" width="38" height="58"/>
            <circle cx="684" cy="216" r="2" fill="rgba(255,255,255,0.26)" stroke="none"/>
            <path d="M 646 186 A 42 42 0 0 0 646 246" stroke-dasharray="4,3"/>
          </g>
          <g fill="none" stroke="rgba(255,255,255,0.16)" stroke-width="1.5">
            <path d="M 60 122 A 11 11 0 0 1 71 112"/>
            <path d="M 729 112 A 11 11 0 0 1 740 122"/>
            <path d="M 60 310 A 11 11 0 0 0 71 320"/>
            <path d="M 729 320 A 11 11 0 0 0 740 310"/>
          </g>

          <!-- Porte -->
          <g fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="2">
            <rect x="48" y="191" width="13" height="50"/>
            <rect x="739" y="191" width="13" height="50"/>
          </g>

          <!-- Tabellone LED -->
          <rect x="308" y="46" width="184" height="56" rx="7"
                fill="#060e08" stroke="${C.green}" stroke-width="1.2" stroke-opacity="0.55" opacity="0.97"/>
          <text x="400" y="66"
                font-family="'Barlow Condensed', monospace"
                font-size="10" fill="${C.green}" text-anchor="middle"
                font-weight="700" letter-spacing="3" opacity="0.75">GOLDEN STRIKER</text>
          <text x="400" y="88"
                font-family="'Barlow Condensed', monospace"
                font-size="20" fill="${C.white}" text-anchor="middle"
                font-weight="900" id="gs-scoreboard-text">0 – 0</text>
          <text x="400" y="100"
                font-family="'Barlow Condensed', monospace"
                font-size="9" fill="${C.dim}" text-anchor="middle"
                id="gs-scoreboard-time">00:00</text>
        </svg>`;
    }

    // ── Scoreboard (rAF con stop condition) ───────────────────────────────────
    let _scoreRaf = null, _scoreMin = 0, _scoreLast = 0;

    function startScoreboard(homeGoals = 0, awayGoals = 0) {
        const el     = document.getElementById('gs-scoreboard-text');
        const timeEl = document.getElementById('gs-scoreboard-time');
        if (!el || !timeEl) return;
        el.textContent = `${homeGoals} – ${awayGoals}`;
        _scoreMin  = 0;
        _scoreLast = performance.now();
        if (_scoreRaf) cancelAnimationFrame(_scoreRaf);

        function tick(now) {
            if (now - _scoreLast >= 50) {
                _scoreMin  = Math.min(_scoreMin + 1, 90);
                _scoreLast = now;
                timeEl.textContent = `${String(_scoreMin).padStart(2, '0')}:00`;
            }
            if (_scoreMin < 90) _scoreRaf = requestAnimationFrame(tick);
            else _scoreRaf = null;
        }
        _scoreRaf = requestAnimationFrame(tick);
    }

    function stopScoreboard() {
        if (_scoreRaf) { cancelAnimationFrame(_scoreRaf); _scoreRaf = null; }
    }

    // ── Pulse (solo transform/opacity) ────────────────────────────────────────
    function pulseElement(el) {
        if (!el) return;
        el.animate([
            { transform: 'scale(1)',    opacity: 1 },
            { transform: 'scale(1.07)', opacity: 0.82 },
            { transform: 'scale(1)',    opacity: 1 },
        ], { duration: 420, easing: 'cubic-bezier(0.22,1,0.36,1)' });
    }

    // ── Stat delta ────────────────────────────────────────────────────────────
    function showStatChange(el, delta, isPositive) {
        if (!el) return;
        const indicator = document.createElement('span');
        indicator.textContent = `${isPositive ? '+' : ''}${delta}`;
        indicator.style.cssText = [
            'position:absolute;right:-8px;top:-14px',
            "font-family:'Barlow Condensed',sans-serif",
            'font-size:0.9rem;font-weight:800;pointer-events:none',
            `color:${isPositive ? '#00C566' : '#F04058'}`,
        ].join(';');
        el.style.position = 'relative';
        el.appendChild(indicator);
        indicator.animate([
            { opacity: 1, transform: 'translateY(0) scale(1)' },
            { opacity: 0, transform: 'translateY(-26px) scale(0.75)' },
        ], { duration: 1100, easing: 'ease-out', fill: 'forwards' })
          .finished.then(() => indicator.remove());
    }

    function createSpinner(size = 32) {
        const div = document.createElement('div');
        div.className = 'gs-spinner';
        div.style.width = div.style.height = `${size}px`;
        return div;
    }

    function flipCard(el) {
        if (!el) return;
        el.animate([
            { transform: 'perspective(600px) rotateY(0deg)' },
            { transform: 'perspective(600px) rotateY(90deg)' },
            { transform: 'perspective(600px) rotateY(0deg)' },
        ], { duration: 500, easing: 'cubic-bezier(0.22,1,0.36,1)' });
    }

    function shake(el) {
        if (!el) return;
        el.animate([
            { transform: 'translateX(0)' },
            { transform: 'translateX(-7px)' },
            { transform: 'translateX(7px)' },
            { transform: 'translateX(-5px)' },
            { transform: 'translateX(5px)' },
            { transform: 'translateX(0)' },
        ], { duration: 380, easing: 'ease-in-out' });
    }

    // glowPulse via classe CSS (no setInterval su boxShadow)
    function glowPulse(el) {
        if (!el) return;
        el.classList.remove('gs-glow-pulse');
        void el.offsetWidth; // reflow per restart
        el.classList.add('gs-glow-pulse');
        const onEnd = () => { el.classList.remove('gs-glow-pulse'); el.removeEventListener('animationend', onEnd); };
        el.addEventListener('animationend', onEnd);
    }

    function typewriter(el, text, speed = 28) {
        if (!el) return;
        el.textContent = '';
        let i = 0;
        function next() { if (i < text.length) { el.textContent += text[i++]; setTimeout(next, speed); } }
        next();
    }

    function staggerReveal(els, delay = 60) {
        els.forEach((el, i) => {
            setTimeout(() => {
                el.animate([
                    { opacity: 0, transform: 'translateY(10px)' },
                    { opacity: 1, transform: 'translateY(0)' },
                ], { duration: 260, easing: 'cubic-bezier(0.22,1,0.36,1)', fill: 'forwards' });
            }, i * delay);
        });
    }

    function slideIn(el, fromY = 20, duration = 300) {
        if (!el) return;
        el.animate([
            { opacity: 0, transform: `translateY(${fromY}px)` },
            { opacity: 1, transform: 'translateY(0)' },
        ], { duration, easing: 'cubic-bezier(0.22,1,0.36,1)', fill: 'forwards' });
    }

    function badgePop(el) {
        if (!el) return;
        el.animate([
            { transform: 'scale(0.55)', opacity: 0 },
            { transform: 'scale(1.14)', opacity: 1 },
            { transform: 'scale(1)',    opacity: 1 },
        ], { duration: 380, easing: 'cubic-bezier(0.22,1,0.36,1)', fill: 'forwards' });
    }

    function animateBar(fillEl, pct) {
        if (!fillEl) return;
        fillEl.style.transform = `scaleX(${Math.max(0, Math.min(1, pct / 100))})`;
    }

    return {
        pageTransition, countUp, createSkeleton, createStadiumSVG,
        startScoreboard, stopScoreboard,
        pulseElement, showStatChange,
        createSpinner, flipCard, shake, glowPulse, typewriter,
        staggerReveal, slideIn, badgePop, animateBar,
    };
})();

window.GS_Animations = GS_Animations;
