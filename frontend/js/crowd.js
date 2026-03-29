/**
 * Golden Striker — Stadium Crowd System
 * Refactored: palette tema verde/bianco, chant overlay via CSS class,
 * nessuno stile inline con !important.
 */

const GS_Crowd = (() => {
    let canvas, ctx, W, H;
    let seats    = [];
    let animId   = null;
    let intensity = 0;

    // Palette tifosi
    const COLORS = {
        home:    ['#1e3a8a','#1d4ed8','#2563eb','#3b82f6','#60a5fa','#0d47a1'],
        away:    ['#7f1d1d','#991b1b','#b91c1c','#dc2626','#f87171','#c62828'],
        neutral: ['#374151','#4b5563','#6b7280','#1f2937','#9ca3af','#111827'],
        event:   ['#00C566','#00dd75','#E8B84B','#E8EDF2','#009950'],
    };

    const ROW_CONFIGS = [
        { y: 0.07, count: 58, size: 5, team: 'home' },
        { y: 0.13, count: 52, size: 5, team: 'home' },
        { y: 0.18, count: 46, size: 5, team: 'home' },
        { y: 0.82, count: 58, size: 5, team: 'away' },
        { y: 0.87, count: 52, size: 5, team: 'away' },
        { y: 0.92, count: 46, size: 5, team: 'away' },
    ];

    class Seat {
        constructor(x, y, size, colorPool) {
            this.x = x; this.y = y; this.baseY = y; this.size = size;
            this.colorPool    = colorPool;
            this.color        = colorPool[Math.floor(Math.random() * colorPool.length)];
            this.standHeight  = 0;
            this.targetHeight = 0;
            this.wavePhase    = Math.random() * Math.PI * 2;
            this.blink        = Math.random() > 0.72;
            this.blinkTimer   = Math.random() * 60;
            this.celebrating  = false;
            this.celebrateTimer = 0;
        }

        triggerWave(power) { this.targetHeight = power * 11; }

        celebrate() {
            this.celebrating    = true;
            this.celebrateTimer = 60 + Math.floor(Math.random() * 110);
            this.color = COLORS.event[Math.floor(Math.random() * COLORS.event.length)];
        }

        resetColor() {
            this.color = this.colorPool[Math.floor(Math.random() * this.colorPool.length)];
            this.celebrating = false;
        }

        update() {
            if (this.targetHeight > 0.3) {
                this.standHeight += (this.targetHeight - this.standHeight) * 0.14;
                this.targetHeight *= 0.91;
            } else {
                this.standHeight *= 0.88;
                this.targetHeight = 0;
            }
            if (this.celebrating) {
                this.celebrateTimer--;
                if (this.celebrateTimer <= 0) this.resetColor();
            }
            this.y = this.baseY + Math.sin(this.wavePhase + performance.now() * 0.001) * 0.5 * intensity;
            this.wavePhase += 0.009;
            if (this.blink) {
                this.blinkTimer--;
                if (this.blinkTimer <= 0) this.blinkTimer = 32 + Math.random() * 85;
            }
        }

        draw(ctx) {
            const alpha = (this.blink && this.blinkTimer < 5) ? 0.25 : 1;
            ctx.globalAlpha = alpha;
            ctx.fillStyle   = this.color;
            const bodyH = this.size + this.standHeight;
            ctx.beginPath();
            ctx.ellipse(this.x, this.y - this.standHeight * 0.28, this.size * 0.55, bodyH * 0.68, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(this.x, this.y - bodyH * 0.48 - this.standHeight * 0.28, this.size * 0.38, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    }

    function init(canvasEl) {
        canvas = canvasEl; ctx = canvas.getContext('2d');
        W = canvas.width; H = canvas.height;
        buildSeats();
    }

    function buildSeats() {
        seats = [];
        ROW_CONFIGS.forEach(row => {
            const colorPool = COLORS[row.team] || COLORS.neutral;
            const y = row.y * H;
            for (let i = 0; i < row.count; i++) {
                const x = (i / row.count) * W * 0.95 + W * 0.025;
                seats.push(new Seat(x, y, row.size, colorPool));
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

    function triggerWave(speed = 8) {
        let col = 0;
        const maxCol = 60;
        const interval = setInterval(() => {
            if (col >= maxCol) { clearInterval(interval); return; }
            seats.forEach(s => {
                const seatCol = Math.floor((s.x / W) * maxCol);
                if (Math.abs(seatCol - col) < 3) s.triggerWave(1 - Math.abs(seatCol - col) / 3);
            });
            col++;
        }, speed);
    }

    function triggerCelebration(durationMs = 5000) {
        intensity = 1;
        seats.forEach((s, i) => setTimeout(() => s.celebrate(), i * 3));
        triggerWave(6);
        setTimeout(() => triggerWave(5), 1400);
        setTimeout(() => triggerWave(4), 2900);
        setTimeout(() => { intensity = 0.5; seats.forEach(s => s.resetColor()); }, durationMs);
    }

    function triggerBoos() {
        intensity = 0.18;
        seats.forEach(s => { s.color = COLORS.neutral[Math.floor(Math.random() * COLORS.neutral.length)]; });
        setTimeout(() => { intensity = 0.5; }, 3000);
    }

    function setIntensity(level) { intensity = Math.max(0, Math.min(1, level)); }

    // ── Chant overlay (usa classi CSS dal restyling) ───────────────────────────
    const CHANTS = {
        it: {
            goal:    ['⚽ GOOOOOOL! ⚽','🔥 CHE BOMBA! 🔥','🌟 STREPITOSO! 🌟','💥 IN RETE! 💥'],
            victory: ['🏆 CAMPIONI! 🏆','⭐ CHE PARTITA! ⭐','👑 IL MIGLIORE! 👑'],
            draw:    ['🤝 UN PUNTO! 🤝','😐 MERITAVAMO DI PIÙ! 😐'],
            loss:    ['💪 TESTA ALTA! 💪','😞 CI RIFAREMO! 😞'],
            pressure:['📣 SPINGETE! 📣','⚡ FORZA! FORZA! ⚡','🎺 DAJE! DAJE! 🎺'],
        },
        en: {
            goal:    ['⚽ GOOOOOAL! ⚽','🔥 WHAT A STRIKE! 🔥','🌟 INCREDIBLE! 🌟','💥 IN THE NET! 💥'],
            victory: ['🏆 CHAMPIONS! 🏆','⭐ WHAT A GAME! ⭐','👑 THE BEST! 👑'],
            draw:    ['🤝 A POINT IS A POINT! 🤝'],
            loss:    ['💪 HEADS UP! 💪','😞 WE\'LL BE BACK! 😞'],
            pressure:['📣 ATTACK! ATTACK! 📣','⚡ FASTER! FASTER! ⚡','🎺 COME ON! 🎺'],
        },
    };

    let _chantEl = null;
    let _chantTimeout = null;

    function showChant(text, duration = 2400) {
        if (!_chantEl) {
            _chantEl = document.createElement('div');
            _chantEl.className = 'gs-chant-banner';
            document.body.appendChild(_chantEl);
        }
        _chantEl.textContent = text;
        _chantEl.classList.add('visible');
        clearTimeout(_chantTimeout);
        _chantTimeout = setTimeout(() => _chantEl?.classList.remove('visible'), duration);
    }

    function showContextualChant(context = 'pressure') {
        const lang = (typeof localStorage !== 'undefined' && localStorage.getItem('gs_lang')) || 'it';
        const pool = CHANTS[lang]?.[context] || CHANTS.it.pressure;
        showChant(pool[Math.floor(Math.random() * pool.length)]);
    }

    function randomChant() { showContextualChant('pressure'); }

    // shorthand
    const showGoalChant     = () => showContextualChant('goal');
    const showVictoryChant  = () => showContextualChant('victory');
    const showPressureChant = () => showContextualChant('pressure');

    // ── Mini crowd bar ────────────────────────────────────────────────────────
    function createMiniCrowdBar(container, homeTeam = 'Home', awayTeam = 'Away') {
        const bar = document.createElement('div');
        bar.className = 'gs-crowd-bar';
        const homeW = Math.round(50 + Math.random() * 20);
        const awayW = 100 - homeW;
        bar.innerHTML = `
            <span class="gs-crowd-home">${homeTeam}</span>
            <div class="gs-crowd-track">
                <div class="gs-crowd-fill gs-crowd-fill-home" style="width:${homeW}%"></div>
                <div class="gs-crowd-fill gs-crowd-fill-away" style="width:${awayW}%"></div>
            </div>
            <span class="gs-crowd-away">${awayTeam}</span>`;
        container.appendChild(bar);
        return bar;
    }

    const INTENSITY_PRESETS = {
        quiet:0.1, warming_up:0.3, engaged:0.5, excited:0.7, frenzy:0.9, explosion:1.0,
    };
    function setPreset(preset) { setIntensity(INTENSITY_PRESETS[preset] ?? 0.5); }

    function getAtmosphereDesc(level) {
        const lang = (typeof localStorage !== 'undefined' && localStorage.getItem('gs_lang')) || 'it';
        const descs = {
            it:[
                {min:0.0,label:'Stadio silenzioso',icon:'😶'},
                {min:0.2,label:'Tiepida partecipazione',icon:'🤔'},
                {min:0.4,label:'Pubblico attento',icon:'👀'},
                {min:0.6,label:'Atmosfera calda',icon:'🔥'},
                {min:0.8,label:'Stadio in delirio',icon:'🤩'},
                {min:0.95,label:'ESPLOSIONE DI FOLLA!',icon:'💥'},
            ],
            en:[
                {min:0.0,label:'Silent stadium',icon:'😶'},
                {min:0.2,label:'Lukewarm atmosphere',icon:'🤔'},
                {min:0.4,label:'Attentive crowd',icon:'👀'},
                {min:0.6,label:'Warm atmosphere',icon:'🔥'},
                {min:0.8,label:'Stadium going wild',icon:'🤩'},
                {min:0.95,label:'CROWD EXPLOSION!',icon:'💥'},
            ],
        };
        const pool = descs[lang] || descs.it;
        let result = pool[0];
        for (const d of pool) { if (level >= d.min) result = d; }
        return result;
    }

    function triggerMexicanWave(rounds = 3, speed = 8) {
        for (let r = 0; r < rounds; r++) setTimeout(() => triggerWave(speed), r * 2400);
    }

    // Stadium ambience
    const StadiumAmbience = {
        _chantInterval: null,
        start() {
            this.stop();
            this._chantInterval = setInterval(() => {
                if (Math.random() > 0.65) showContextualChant('pressure');
            }, 9000 + Math.random() * 10000);
        },
        stop() { if (this._chantInterval) { clearInterval(this._chantInterval); this._chantInterval = null; } },
        onGoal()    { showGoalChant();    GS_Crowd.triggerCelebration(5000); },
        onVictory() { showVictoryChant(); GS_Crowd.triggerCelebration(8000); },
        onLoss()    { GS_Crowd.triggerBoos(); },
    };

    return {
        init, start, stop, triggerWave, triggerCelebration, triggerBoos,
        setIntensity, setPreset, INTENSITY_PRESETS,
        showChant, randomChant, showContextualChant,
        showGoalChant, showVictoryChant, showPressureChant,
        createMiniCrowdBar, CHANTS,
        getAtmosphereDesc, triggerMexicanWave, StadiumAmbience,
    };
})();

window.GS_Crowd = GS_Crowd;
