/**
 * Golden Striker — Stadium & UI Animations
 * Stadium background, page transitions, loading animations
 */

const GS_Animations = (() => {

    // ── Page transitions ─────────────────────────────────────────────────────
    function pageTransition(fromEl, toEl, direction = 'right') {
        if (!fromEl || !toEl) return;
        const dx = direction === 'right' ? '30px' : '-30px';

        fromEl.animate([
            { opacity: 1, transform: 'translateX(0)' },
            { opacity: 0, transform: `translateX(${direction === 'right' ? '-30px' : '30px'})` }
        ], { duration: 200, easing: 'ease-in', fill: 'forwards' });

        toEl.style.display = 'block';
        toEl.animate([
            { opacity: 0, transform: `translateX(${dx})` },
            { opacity: 1, transform: 'translateX(0)' }
        ], { duration: 250, delay: 100, easing: 'ease-out', fill: 'forwards' });
    }

    // ── Number counter on dashboard ───────────────────────────────────────────
    function countUp(el, target, duration = 700) {
        if (!el) return;
        const start = parseInt(el.textContent) || 0;
        const startTime = performance.now();
        function tick(now) {
            const p = Math.min((now - startTime) / duration, 1);
            const ease = 1 - Math.pow(1 - p, 3);
            el.textContent = Math.round(start + (target - start) * ease);
            if (p < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
    }

    // ── Shimmer loading skeleton ──────────────────────────────────────────────
    function createSkeleton(lines = 3, widths = ['100%', '80%', '60%']) {
        const el = document.createElement('div');
        el.className = 'gs-skeleton-wrap';
        for (let i = 0; i < lines; i++) {
            const line = document.createElement('div');
            line.className = 'gs-skeleton-line';
            line.style.width = widths[i % widths.length];
            el.appendChild(line);
        }
        return el;
    }

    // ── Stadium SVG background ────────────────────────────────────────────────
    function createStadiumSVG() {
        return `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400" class="gs-stadium-bg" aria-hidden="true">
            <defs>
                <radialGradient id="pitchGrad" cx="50%" cy="50%" r="55%">
                    <stop offset="0%"   stop-color="#1a4a1a"/>
                    <stop offset="100%" stop-color="#0d2e0d"/>
                </radialGradient>
                <radialGradient id="spotlightL" cx="25%" cy="0%" r="60%">
                    <stop offset="0%" stop-color="rgba(255,215,0,0.15)"/>
                    <stop offset="100%" stop-color="rgba(255,215,0,0)"/>
                </radialGradient>
                <radialGradient id="spotlightR" cx="75%" cy="0%" r="60%">
                    <stop offset="0%" stop-color="rgba(255,215,0,0.12)"/>
                    <stop offset="100%" stop-color="rgba(255,215,0,0)"/>
                </radialGradient>
                <filter id="glow">
                    <feGaussianBlur stdDeviation="2" result="blur"/>
                    <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
            </defs>

            <!-- Stands gradient background -->
            <rect width="800" height="400" fill="#0a0e1a"/>

            <!-- Upper stands -->
            <rect x="0" y="0" width="800" height="120" fill="#111827" opacity="0.9"/>
            <!-- Stand seats pattern -->
            <g opacity="0.4" class="gs-crowd">
                ${Array.from({length: 80}, (_, i) => {
                    const x = (i % 20) * 40 + 10;
                    const y = Math.floor(i / 20) * 22 + 8;
                    const colors = ['#1e40af','#dc2626','#15803d','#7c3aed','#b45309','#0e7490'];
                    const c = colors[Math.floor(Math.random() * colors.length)];
                    return `<circle cx="${x}" cy="${y}" r="6" fill="${c}"/>`;
                }).join('')}
            </g>

            <!-- Lower stands -->
            <rect x="0" y="320" width="800" height="80" fill="#111827" opacity="0.9"/>
            <!-- Crowd bottom -->
            <g opacity="0.4">
                ${Array.from({length: 40}, (_, i) => {
                    const x = (i % 20) * 40 + 10;
                    const y = 330 + Math.floor(i / 20) * 22;
                    const colors = ['#1e40af','#dc2626','#15803d','#7c3aed'];
                    const c = colors[Math.floor(Math.random() * colors.length)];
                    return `<circle cx="${x}" cy="${y}" r="6" fill="${c}"/>`;
                }).join('')}
            </g>

            <!-- Pitch -->
            <rect x="60" y="110" width="680" height="210" rx="8" fill="url(#pitchGrad)"/>

            <!-- Grass stripes -->
            <g opacity="0.3">
                ${Array.from({length: 8}, (_, i) => {
                    const x = 60 + (i * 680/8);
                    const w = 680/8;
                    return i % 2 === 0 ? `<rect x="${x}" y="110" width="${w}" height="210" fill="#1e5c1e"/>` : '';
                }).join('')}
            </g>

            <!-- Pitch markings -->
            <g fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="1.5">
                <!-- Boundary -->
                <rect x="65" y="115" width="670" height="200" rx="4"/>
                <!-- Center line -->
                <line x1="400" y1="115" x2="400" y2="315"/>
                <!-- Center circle -->
                <circle cx="400" cy="215" r="40"/>
                <!-- Center spot -->
                <circle cx="400" cy="215" r="2.5" fill="rgba(255,255,255,0.35)" stroke="none"/>
                <!-- Left penalty box -->
                <rect x="65" y="160" width="90" height="110"/>
                <!-- Left goal box -->
                <rect x="65" y="185" width="40" height="60"/>
                <!-- Left penalty spot -->
                <circle cx="120" cy="215" r="2" fill="rgba(255,255,255,0.35)" stroke="none"/>
                <!-- Left penalty arc -->
                <path d="M 155 185 A 40 40 0 0 1 155 245" stroke-dasharray="4,2"/>
                <!-- Right penalty box -->
                <rect x="645" y="160" width="90" height="110"/>
                <!-- Right goal box -->
                <rect x="695" y="185" width="40" height="60"/>
                <!-- Right penalty spot -->
                <circle cx="680" cy="215" r="2" fill="rgba(255,255,255,0.35)" stroke="none"/>
                <!-- Right penalty arc -->
                <path d="M 645 185 A 40 40 0 0 0 645 245" stroke-dasharray="4,2"/>
            </g>

            <!-- Goals -->
            <g fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="2">
                <rect x="55" y="190" width="12" height="50"/>
                <rect x="733" y="190" width="12" height="50"/>
            </g>

            <!-- Corner arcs -->
            <g fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="1.5">
                <path d="M 65 125 A 12 12 0 0 1 77 115"/>
                <path d="M 723 115 A 12 12 0 0 1 735 125"/>
                <path d="M 65 305 A 12 12 0 0 0 77 315"/>
                <path d="M 723 315 A 12 12 0 0 0 735 305"/>
            </g>

            <!-- Spotlights -->
            <rect width="800" height="400" fill="url(#spotlightL)"/>
            <rect width="800" height="400" fill="url(#spotlightR)"/>

            <!-- Floodlights -->
            <g fill="#FFD700" filter="url(#glow)" class="gs-floodlights">
                <rect x="20" y="5" width="8" height="40" rx="2" fill="#888"/>
                <rect x="10" y="3" width="28" height="6" rx="2"/>
                <rect x="772" y="5" width="8" height="40" rx="2" fill="#888"/>
                <rect x="762" y="3" width="28" height="6" rx="2"/>
            </g>

            <!-- Scoreboard -->
            <rect x="310" y="50" width="180" height="55" rx="8" fill="#0a0a14" stroke="#FFD700" stroke-width="1.5" opacity="0.95"/>
            <text x="400" y="70" font-family="monospace" font-size="11" fill="#FFD700" text-anchor="middle" font-weight="bold">GOLDEN STRIKER</text>
            <text x="400" y="88" font-family="monospace" font-size="18" fill="white" text-anchor="middle" font-weight="bold" id="gs-scoreboard-text">0 – 0</text>
            <text x="400" y="100" font-family="monospace" font-size="9" fill="#94a3b8" text-anchor="middle" id="gs-scoreboard-time">00:00</text>
        </svg>`;
    }

    // ── Scoreboard update ─────────────────────────────────────────────────────
    let scoreInterval = null;
    let scoreMinute = 0;

    function startScoreboard(homeGoals = 0, awayGoals = 0) {
        const el = document.getElementById('gs-scoreboard-text');
        const timeEl = document.getElementById('gs-scoreboard-time');
        if (!el || !timeEl) return;
        el.textContent = `${homeGoals} – ${awayGoals}`;
        scoreMinute = 0;
        if (scoreInterval) clearInterval(scoreInterval);
        scoreInterval = setInterval(() => {
            scoreMinute = Math.min(scoreMinute + 1, 90);
            if (timeEl) timeEl.textContent = `${String(scoreMinute).padStart(2, '0')}:00`;
            if (scoreMinute >= 90) clearInterval(scoreInterval);
        }, 50); // fast simulation
    }

    function stopScoreboard() {
        if (scoreInterval) clearInterval(scoreInterval);
    }

    // ── Pulse animation on stat change ───────────────────────────────────────
    function pulseElement(el, color = '#FFD700') {
        if (!el) return;
        el.animate([
            { boxShadow: `0 0 0 0 ${color}88`, transform: 'scale(1)' },
            { boxShadow: `0 0 0 12px ${color}00`, transform: 'scale(1.05)' },
            { boxShadow: `0 0 0 0 ${color}00`, transform: 'scale(1)' },
        ], { duration: 600, easing: 'ease-out' });
    }

    // ── Stat change indicator ─────────────────────────────────────────────────
    function showStatChange(el, delta, isPositive) {
        if (!el) return;
        const indicator = document.createElement('div');
        indicator.className = `gs-stat-delta ${isPositive ? 'positive' : 'negative'}`;
        indicator.textContent = `${isPositive ? '+' : ''}${delta}`;
        el.style.position = 'relative';
        el.appendChild(indicator);
        indicator.animate([
            { opacity: 1, transform: 'translateY(0)' },
            { opacity: 0, transform: 'translateY(-30px)' }
        ], { duration: 1200, easing: 'ease-out', fill: 'forwards' });
        setTimeout(() => indicator.remove(), 1200);
    }

    // ── Loading spinner ───────────────────────────────────────────────────────
    function createSpinner(size = 40) {
        const div = document.createElement('div');
        div.className = 'gs-spinner';
        div.style.width = div.style.height = `${size}px`;
        return div;
    }

    // ── Card flip ─────────────────────────────────────────────────────────────
    function flipCard(el) {
        if (!el) return;
        el.animate([
            { transform: 'perspective(400px) rotateY(0deg)' },
            { transform: 'perspective(400px) rotateY(90deg)' },
            { transform: 'perspective(400px) rotateY(0deg)' },
        ], { duration: 600, easing: 'ease-in-out' });
    }

    // ── Shake animation (for errors) ──────────────────────────────────────────
    function shake(el) {
        if (!el) return;
        el.animate([
            { transform: 'translateX(0)' },
            { transform: 'translateX(-8px)' },
            { transform: 'translateX(8px)' },
            { transform: 'translateX(-6px)' },
            { transform: 'translateX(6px)' },
            { transform: 'translateX(0)' },
        ], { duration: 400, easing: 'ease-in-out' });
    }

    // ── Glow pulse (for active elements) ─────────────────────────────────────
    function glowPulse(el, color = '#FFD700') {
        if (!el) return;
        let i = 0;
        const interval = setInterval(() => {
            el.style.boxShadow = i % 2 === 0
                ? `0 0 20px ${color}88, 0 0 40px ${color}44`
                : `0 0 8px ${color}44`;
            i++;
            if (i > 6) { clearInterval(interval); el.style.boxShadow = ''; }
        }, 300);
    }

    // ── Typewriter effect ────────────────────────────────────────────────────
    function typewriter(el, text, speed = 30) {
        if (!el) return;
        el.textContent = '';
        let i = 0;
        const interval = setInterval(() => {
            el.textContent += text[i++];
            if (i >= text.length) clearInterval(interval);
        }, speed);
    }

    return {
        pageTransition, countUp, createSkeleton, createStadiumSVG,
        startScoreboard, stopScoreboard, pulseElement, showStatChange,
        createSpinner, flipCard, shake, glowPulse, typewriter,
    };
})();

window.GS_Animations = GS_Animations;
