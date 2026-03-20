/**
 * Golden Striker — Stadium Crowd System
 * Animated crowd atmosphere, crowd wave, chants, and stadium ambience
 */

const GS_Crowd = (() => {
    let canvas, ctx, W, H;
    let seats = [];
    let wavePos = -1;
    let animId  = null;
    let intensity = 0; // 0-1: crowd excitement level

    const COLORS = {
        home: ['#1e40af', '#1d4ed8', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd'],
        away: ['#dc2626', '#ef4444', '#f87171', '#b91c1c', '#991b1b', '#7f1d1d'],
        neutral: ['#4b5563', '#6b7280', '#9ca3af', '#374151', '#1f2937', '#111827'],
        event: ['#FFD700', '#fbbf24', '#f59e0b', '#d97706', '#fff', '#fef3c7'],
    };

    const ROW_CONFIGS = [
        { y: 0.08, count: 60, size: 5, alpha: 0.7, team: 'home' },
        { y: 0.13, count: 55, size: 5, alpha: 0.7, team: 'home' },
        { y: 0.18, count: 50, size: 5, alpha: 0.65, team: 'home' },
        { y: 0.82, count: 60, size: 5, alpha: 0.7, team: 'away' },
        { y: 0.87, count: 55, size: 5, alpha: 0.7, team: 'away' },
        { y: 0.92, count: 50, size: 5, alpha: 0.65, team: 'away' },
    ];

    class Seat {
        constructor(x, y, size, colorPool, row) {
            this.x = x;
            this.y = y;
            this.baseY = y;
            this.size = size;
            this.row = row;
            this.colorPool = colorPool;
            this.color = colorPool[Math.floor(Math.random() * colorPool.length)];
            this.standing = false;
            this.standHeight = 0;
            this.targetHeight = 0;
            this.wavePhase = Math.random() * Math.PI * 2;
            this.blink = Math.random() > 0.7;
            this.blinkTimer = Math.random() * 60;
            this.celebrating = false;
            this.celebrateTimer = 0;
        }

        triggerWave(power) {
            this.targetHeight = power * 12;
            this.standing = true;
        }

        celebrate() {
            this.celebrating = true;
            this.celebrateTimer = 60 + Math.floor(Math.random() * 120);
            this.color = COLORS.event[Math.floor(Math.random() * COLORS.event.length)];
        }

        resetColor() {
            this.color = this.colorPool[Math.floor(Math.random() * this.colorPool.length)];
            this.celebrating = false;
        }

        update() {
            // Wave motion
            if (this.standing) {
                this.standHeight += (this.targetHeight - this.standHeight) * 0.15;
                if (this.targetHeight < 0.5) {
                    this.standing = false;
                    this.standHeight = 0;
                }
                this.targetHeight *= 0.92;
            }

            // Celebration animation
            if (this.celebrating) {
                this.celebrateTimer--;
                if (this.celebrateTimer <= 0) this.resetColor();
            }

            // Ambient micro-movement
            this.y = this.baseY + Math.sin(this.wavePhase + performance.now() * 0.001) * 0.5 * intensity;
            this.wavePhase += 0.01;

            // Blink effect
            if (this.blink) {
                this.blinkTimer--;
                if (this.blinkTimer <= 0) {
                    this.blinkTimer = 30 + Math.random() * 90;
                }
            }
        }

        draw(ctx) {
            const alpha = this.blinkTimer < 5 ? 0.3 : 1;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = this.color;

            // Body
            const bodyH = this.size + this.standHeight;
            ctx.beginPath();
            ctx.ellipse(this.x, this.y - this.standHeight * 0.3, this.size * 0.6, bodyH * 0.7, 0, 0, Math.PI * 2);
            ctx.fill();

            // Head
            ctx.beginPath();
            ctx.arc(this.x, this.y - bodyH * 0.5 - this.standHeight * 0.3, this.size * 0.4, 0, Math.PI * 2);
            ctx.fill();

            ctx.globalAlpha = 1;
        }
    }

    function init(canvasEl) {
        canvas = canvasEl;
        ctx    = canvas.getContext('2d');
        W      = canvas.width;
        H      = canvas.height;
        buildSeats();
    }

    function buildSeats() {
        seats = [];
        ROW_CONFIGS.forEach((row, ri) => {
            const colorPool = COLORS[row.team] || COLORS.neutral;
            const y = row.y * H;
            for (let i = 0; i < row.count; i++) {
                const x = (i / row.count) * W * 0.95 + W * 0.025;
                seats.push(new Seat(x, y, row.size, colorPool, ri));
            }
        });
    }

    function loop() {
        ctx.clearRect(0, 0, W, H);
        seats.forEach(s => { s.update(); s.draw(ctx); });
        animId = requestAnimationFrame(loop);
    }

    function start(canvasEl, level = 0.5) {
        if (canvasEl) init(canvasEl);
        intensity = level;
        if (!animId) loop();
    }

    function stop() {
        if (animId) { cancelAnimationFrame(animId); animId = null; }
    }

    // Crowd wave: left to right sweep
    function triggerWave(speed = 8) {
        let col = 0;
        const maxCol = 60;
        const interval = setInterval(() => {
            if (col >= maxCol) { clearInterval(interval); return; }
            seats.forEach(s => {
                const seatCol = Math.floor((s.x / W) * maxCol);
                if (Math.abs(seatCol - col) < 3) s.triggerWave(1 - Math.abs(seatCol - col) / 3);
            });
            col += 1;
        }, speed);
    }

    // Mass celebration (goal etc.)
    function triggerCelebration(durationMs = 5000) {
        intensity = 1;
        seats.forEach((s, i) => {
            setTimeout(() => s.celebrate(), i * 3);
        });
        // Multiple waves
        triggerWave(6);
        setTimeout(() => triggerWave(5), 1500);
        setTimeout(() => triggerWave(4), 3000);
        setTimeout(() => {
            intensity = 0.5;
            seats.forEach(s => s.resetColor());
        }, durationMs);
    }

    // Boos (for loss)
    function triggerBoos() {
        intensity = 0.2;
        seats.forEach(s => {
            s.color = COLORS.neutral[Math.floor(Math.random() * COLORS.neutral.length)];
        });
        setTimeout(() => { intensity = 0.5; }, 3000);
    }

    function setIntensity(level) {
        intensity = Math.max(0, Math.min(1, level));
    }

    // ── Chant display overlay ─────────────────────────────────────────────────
    const CHANTS = {
        it: [
            '🎵 OLEEEE OLE OLE OLE! 🎵',
            '⚽ GOOOOOL! ⚽',
            '🎶 CHI NON SALTA UN GOBBO È! 🎶',
            '📣 FORZA! FORZA! FORZA! 📣',
            '🏟️ SPINGEEEE! 🏟️',
        ],
        en: [
            '🎵 OLE OLE OLE OLE! 🎵',
            '⚽ GOOOOOAL! ⚽',
            '📣 COME ON! COME ON! 📣',
            '🎶 PUSH! PUSH! PUSH! 🎶',
            '🏟️ ATTACK! ATTACK! 🏟️',
        ]
    };

    let chantEl = null;
    function showChant(text, duration = 2500) {
        if (!chantEl) {
            chantEl = document.createElement('div');
            chantEl.style.cssText = `
                position: fixed; top: 70px; left: 50%; transform: translateX(-50%);
                background: rgba(0,0,0,0.8); color: #FFD700;
                font-size: 1.2rem; font-weight: 900; letter-spacing: 2px;
                padding: 10px 24px; border-radius: 30px;
                border: 2px solid rgba(255,215,0,0.4);
                z-index: 9900; pointer-events: none;
                animation: fadeIn 0.3s ease;
                backdrop-filter: blur(4px);
                text-shadow: 0 0 20px rgba(255,215,0,0.8);
            `;
            document.body.appendChild(chantEl);
        }
        chantEl.textContent = text;
        chantEl.style.display = 'block';
        chantEl.style.opacity = '1';
        clearTimeout(chantEl._timeout);
        chantEl._timeout = setTimeout(() => {
            if (chantEl) chantEl.style.opacity = '0';
        }, duration);
    }

    function randomChant() {
        const lang = localStorage.getItem('gs_lang') || 'it';
        const pool = CHANTS[lang] || CHANTS.it;
        showChant(pool[Math.floor(Math.random() * pool.length)]);
    }

    // ── Mini crowd bar (for dashboard) ────────────────────────────────────────
    function createMiniCrowdBar(container, homeTeam = 'Home', awayTeam = 'Away') {
        const bar = document.createElement('div');
        bar.style.cssText = `
            display: flex; align-items: center; gap: 8px;
            font-size: 0.78rem; color: var(--text-dim);
        `;
        const homeW = 55 + Math.random() * 15;
        const awayW = 100 - homeW;
        bar.innerHTML = `
            <span style="color:#60a5fa;font-weight:700">${homeTeam}</span>
            <div style="flex:1;height:8px;background:var(--bg3);border-radius:4px;overflow:hidden;display:flex">
                <div style="width:${homeW}%;background:linear-gradient(90deg,#1e40af,#3b82f6);border-radius:4px;transition:width 1s ease"></div>
                <div style="width:${awayW}%;background:linear-gradient(90deg,#dc2626,#ef4444);border-radius:4px"></div>
            </div>
            <span style="color:#f87171;font-weight:700">${awayTeam}</span>
        `;
        container.appendChild(bar);
        return bar;
    }

    return {
        init, start, stop, triggerWave, triggerCelebration, triggerBoos,
        setIntensity, showChant, randomChant, createMiniCrowdBar, CHANTS,
        showGoalChant, showVictoryChant, showPressureChant,
    };
})();

window.GS_Crowd = GS_Crowd;


// ── Extended chants library ───────────────────────────────────────────────────
const EXTENDED_CHANTS = {
    it: {
        victory: [
            "🎵 CAMPIONI! CAMPIONI! CAMPIONI! 🎵",
            "🏆 ABBIAMO VINTO! ABBIAMO VINTO! 🏆",
            "⭐ CHE PARTITA! CHE PARTITA! ⭐",
            "👑 IL MIGLIORE! IL MIGLIORE! 👑",
        ],
        draw: [
            "🤝 UN PUNTO È UN PUNTO! 🤝",
            "😐 AVREMMO MERITATO DI PIÙ! 😐",
        ],
        loss: [
            "😞 TESTA ALTA! CI RIFAREMO! 😞",
            "💪 FORZA E CORAGGIO! 💪",
        ],
        goal: [
            "⚽ GOOOOOOL! ⚽",
            "🔥 CHE BOMBA! CHE BOMBA! 🔥",
            "🌟 STREPITOSO! STREPITOSO! 🌟",
            "💥 IN RETE! IN RETE! IN RETE! 💥",
        ],
        pressure: [
            "📣 SPINGETE! SPINGETE! 📣",
            "⚡ VELOCE! VELOCE! ⚡",
            "🎺 FORZA! FORZA! FORZA! 🎺",
        ],
        birthday: [
            "🎂 AUGURI! AUGURI! AUGURI! 🎂",
        ],
        season_start: [
            "🍂 NUOVA STAGIONE! NUOVI SOGNI! 🍂",
            "🚀 SI RIPARTE! SI RIPARTE! 🚀",
        ],
        season_end: [
            "☀️ GRAZIE RAGAZZI! GRAZIE! ☀️",
            "🌟 CHE STAGIONE! CHE STAGIONE! 🌟",
        ],
    },
    en: {
        victory: [
            "🎵 CHAMPIONS! CHAMPIONS! CHAMPIONS! 🎵",
            "🏆 WE WON! WE WON! WE WON! 🏆",
            "⭐ WHAT A GAME! WHAT A GAME! ⭐",
            "👑 THE BEST! THE BEST! THE BEST! 👑",
        ],
        draw: [
            "🤝 A POINT IS A POINT! 🤝",
            "😐 WE DESERVED MORE! 😐",
        ],
        loss: [
            "😞 HEADS UP! WE'LL BE BACK! 😞",
            "💪 STRENGTH AND COURAGE! 💪",
        ],
        goal: [
            "⚽ GOOOOOAL! ⚽",
            "🔥 WHAT A STRIKE! WHAT A STRIKE! 🔥",
            "🌟 INCREDIBLE! INCREDIBLE! 🌟",
            "💥 IN THE NET! IN THE NET! 💥",
        ],
        pressure: [
            "📣 ATTACK! ATTACK! 📣",
            "⚡ FASTER! FASTER! ⚡",
            "🎺 COME ON! COME ON! 🎺",
        ],
        season_start: [
            "🍂 NEW SEASON! NEW DREAMS! 🍂",
            "🚀 LET'S GO! LET'S GO! 🚀",
        ],
        season_end: [
            "☀️ THANK YOU LADS! THANK YOU! ☀️",
            "🌟 WHAT A SEASON! WHAT A SEASON! 🌟",
        ],
    }
};

// ── Enhanced chant display ────────────────────────────────────────────────────
function showContextualChant(context = 'pressure') {
    const lang = localStorage.getItem('gs_lang') || 'it';
    const pool = EXTENDED_CHANTS[lang]?.[context] || EXTENDED_CHANTS.it.pressure;
    const text = pool[Math.floor(Math.random() * pool.length)];
    showChant(text, 2000);
}

function showGoalChant() { showContextualChant('goal'); }
function showVictoryChant() { showContextualChant('victory'); }
function showPressureChant() { showContextualChant('pressure'); }

// ── Stadium ambience controller ───────────────────────────────────────────────
const StadiumAmbience = {
    _interval: null,
    _chantInterval: null,

    start(intensity = 0.5) {
        this.stop();
        // Periodic random chants
        this._chantInterval = setInterval(() => {
            const contexts = ['pressure', 'pressure', 'pressure', 'goal'];
            if (Math.random() > 0.7) {
                showContextualChant(contexts[Math.floor(Math.random() * contexts.length)]);
            }
        }, 8000 + Math.random() * 12000);
    },

    stop() {
        if (this._interval) { clearInterval(this._interval); this._interval = null; }
        if (this._chantInterval) { clearInterval(this._chantInterval); this._chantInterval = null; }
    },

    onGoal() {
        showGoalChant();
        triggerCelebration(5000);
    },

    onVictory() {
        showVictoryChant();
        triggerCelebration(8000);
    },

    onLoss() {
        triggerBoos();
    },
};

// ── Wave patterns ─────────────────────────────────────────────────────────────
function triggerMexicanWave(rounds = 3, speed = 8) {
    for (let r = 0; r < rounds; r++) {
        setTimeout(() => triggerWave(speed), r * 2500);
    }
}

// Export extras
if (typeof window !== 'undefined') {
    Object.assign(GS_Crowd, {
        EXTENDED_CHANTS,
        showContextualChant, showGoalChant, showVictoryChant, showPressureChant,
        StadiumAmbience, triggerMexicanWave,
    });
}

// ── Extended chant library ────────────────────────────────────────────────────
GS_Crowd.EXTENDED_CHANTS = {
    it: [
        '🎵 DAJE! DAJE! DAJE! 🎵',
        '⚽ ALLEZ ALLEZ ALLEZ! ⚽',
        '🏟️ VINCEREMO NOI! 🏟️',
        '🎶 CHI NON SALTA NON AMA! 🎶',
        '📣 CAMPIONI DEL MONDO! 📣',
        '🔥 FUOCO SACRO! FORZA {team}! 🔥',
        '⭐ UNO, DUE, TRE — FORZA! ⭐',
        '🌟 SIAMO I MIGLIORI! 🌟',
        '💪 LOTTA FINO ALLA FINE! 💪',
        '🏆 VINCI PER NOI! 🏆',
        '🎊 OLE OLE OLE OLE! 🎊',
        '❤️ AMORE MIO! FORZA! ❤️',
    ],
    en: [
        '🎵 COME ON! COME ON! 🎵',
        '⚽ ALLEZ ALLEZ ALLEZ! ⚽',
        '🏟️ WE WILL WIN! 🏟️',
        '🎶 IF YOU'RE NOT JUMPING YOU DON'T CARE! 🎶',
        '📣 CHAMPIONS OF THE WORLD! 📣',
        '🔥 SACRED FIRE! GO {team}! 🔥',
        '⭐ ONE, TWO, THREE — PUSH! ⭐',
        '🌟 WE ARE THE GREATEST! 🌟',
        '💪 FIGHT TILL THE END! 💪',
        '🏆 WIN IT FOR US! 🏆',
        '🎊 OLE OLE OLE OLE! 🎊',
        '❤️ WE LOVE YOU! COME ON! ❤️',
    ]
};

GS_Crowd.randomExtendedChant = function(teamName) {
    const lang = localStorage.getItem('gs_lang') || 'it';
    const pool = GS_Crowd.EXTENDED_CHANTS[lang] || GS_Crowd.EXTENDED_CHANTS.it;
    const chant = pool[Math.floor(Math.random() * pool.length)];
    GS_Crowd.showChant(chant.replace('{team}', teamName || 'team'));
};

// ── Crowd intensity presets ────────────────────────────────────────────────────
GS_Crowd.INTENSITY_PRESETS = {
    quiet:      0.1,
    warming_up: 0.3,
    engaged:    0.5,
    excited:    0.7,
    frenzy:     0.9,
    explosion:  1.0,
};

GS_Crowd.setPreset = function(preset) {
    const level = GS_Crowd.INTENSITY_PRESETS[preset] ?? 0.5;
    GS_Crowd.setIntensity(level);
};

// ── Stadium atmosphere descriptions ───────────────────────────────────────────
GS_Crowd.getAtmosphereDesc = function(level) {
    const lang = localStorage.getItem('gs_lang') || 'it';
    const descs = {
        it: [
            { min: 0.0, label: 'Stadio silenzioso', icon: '😶' },
            { min: 0.2, label: 'Tiepida partecipazione', icon: '🤔' },
            { min: 0.4, label: 'Pubblico attento', icon: '👀' },
            { min: 0.6, label: 'Atmosfera calda', icon: '🔥' },
            { min: 0.8, label: 'Stadio in delirio', icon: '🤩' },
            { min: 0.95, label: 'ESPLOSIONE DI FOLLA!', icon: '💥' },
        ],
        en: [
            { min: 0.0, label: 'Silent stadium', icon: '😶' },
            { min: 0.2, label: 'Lukewarm atmosphere', icon: '🤔' },
            { min: 0.4, label: 'Attentive crowd', icon: '👀' },
            { min: 0.6, label: 'Warm atmosphere', icon: '🔥' },
            { min: 0.8, label: 'Stadium going wild', icon: '🤩' },
            { min: 0.95, label: 'CROWD EXPLOSION!', icon: '💥' },
        ]
    };
    const pool = descs[lang] || descs.it;
    let result = pool[0];
    for (const d of pool) { if (level >= d.min) result = d; }
    return result;
};
