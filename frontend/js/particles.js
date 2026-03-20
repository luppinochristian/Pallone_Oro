/**
 * Golden Striker — Particle System
 * Canvas-based particle engine for goal celebrations, confetti, etc.
 */

const GS_Particles = (() => {
    let canvas, ctx2d, particles = [], animId = null;
    let W, H;

    // ── Setup canvas overlay ──────────────────────────────────────────────────
    function ensureCanvas() {
        if (canvas) return;
        canvas = document.createElement('canvas');
        canvas.id = 'gs-particle-canvas';
        canvas.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            pointer-events: none; z-index: 9998;
        `;
        document.body.appendChild(canvas);
        ctx2d = canvas.getContext('2d');
        resize();
        window.addEventListener('resize', resize);
    }

    function resize() {
        if (!canvas) return;
        W = canvas.width  = window.innerWidth;
        H = canvas.height = window.innerHeight;
    }

    // ── Particle class ────────────────────────────────────────────────────────
    class Particle {
        constructor(opts) {
            this.x = opts.x ?? W / 2;
            this.y = opts.y ?? H / 2;
            this.vx = opts.vx ?? (Math.random() - 0.5) * 12;
            this.vy = opts.vy ?? -(Math.random() * 15 + 5);
            this.size = opts.size ?? Math.random() * 8 + 4;
            this.color = opts.color ?? '#FFD700';
            this.alpha = 1;
            this.rotation = Math.random() * Math.PI * 2;
            this.rotSpeed = (Math.random() - 0.5) * 0.3;
            this.gravity = opts.gravity ?? 0.4;
            this.drag = opts.drag ?? 0.98;
            this.life = 1;
            this.decay = opts.decay ?? (Math.random() * 0.015 + 0.012);
            this.shape = opts.shape ?? 'rect'; // 'rect', 'circle', 'star', 'triangle', 'ball'
            this.glow = opts.glow ?? false;
            this.trail = [];
            this.maxTrail = opts.maxTrail ?? 0;
        }

        update() {
            if (this.maxTrail > 0) {
                this.trail.push({ x: this.x, y: this.y, alpha: this.life });
                if (this.trail.length > this.maxTrail) this.trail.shift();
            }
            this.x  += this.vx;
            this.y  += this.vy;
            this.vy += this.gravity;
            this.vx *= this.drag;
            this.vy *= this.drag;
            this.rotation += this.rotSpeed;
            this.life -= this.decay;
            this.alpha = Math.max(0, this.life);
        }

        draw(ctx) {
            if (this.alpha <= 0) return;
            ctx.save();
            ctx.globalAlpha = this.alpha;

            // Draw trail
            if (this.trail.length > 1) {
                ctx.beginPath();
                ctx.moveTo(this.trail[0].x, this.trail[0].y);
                this.trail.forEach((p, i) => {
                    ctx.globalAlpha = p.alpha * 0.3 * (i / this.trail.length);
                    ctx.lineTo(p.x, p.y);
                });
                ctx.strokeStyle = this.color;
                ctx.lineWidth = this.size * 0.4;
                ctx.stroke();
                ctx.globalAlpha = this.alpha;
            }

            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);

            if (this.glow) {
                ctx.shadowColor = this.color;
                ctx.shadowBlur  = 12;
            }

            ctx.fillStyle = this.color;

            switch (this.shape) {
                case 'circle':
                    ctx.beginPath();
                    ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
                    ctx.fill();
                    break;

                case 'star':
                    ctx.beginPath();
                    for (let i = 0; i < 5; i++) {
                        const a  = (i / 5) * Math.PI * 2 - Math.PI / 2;
                        const a2 = ((i + 0.5) / 5) * Math.PI * 2 - Math.PI / 2;
                        const r  = this.size / 2;
                        const r2 = r * 0.4;
                        i === 0 ? ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r) : ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
                        ctx.lineTo(Math.cos(a2) * r2, Math.sin(a2) * r2);
                    }
                    ctx.closePath();
                    ctx.fill();
                    break;

                case 'triangle':
                    ctx.beginPath();
                    ctx.moveTo(0, -this.size / 2);
                    ctx.lineTo(this.size / 2, this.size / 2);
                    ctx.lineTo(-this.size / 2, this.size / 2);
                    ctx.closePath();
                    ctx.fill();
                    break;

                case 'ball':
                    ctx.beginPath();
                    ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
                    ctx.fillStyle = '#fff';
                    ctx.fill();
                    ctx.strokeStyle = '#222';
                    ctx.lineWidth = 1;
                    ctx.stroke();
                    // Pentagon patches
                    ctx.fillStyle = '#111';
                    ctx.beginPath();
                    for (let i = 0; i < 5; i++) {
                        const a = (i / 5) * Math.PI * 2;
                        const r = this.size * 0.2;
                        i === 0 ? ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r) : ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
                    }
                    ctx.closePath();
                    ctx.fill();
                    break;

                default: // rect
                    ctx.fillRect(-this.size / 2, -this.size * 0.3, this.size, this.size * 0.6);
            }

            ctx.restore();
        }

        isDead() { return this.life <= 0; }
    }

    // ── Animation loop ────────────────────────────────────────────────────────
    function loop() {
        ctx2d.clearRect(0, 0, W, H);
        particles = particles.filter(p => {
            p.update();
            p.draw(ctx2d);
            return !p.isDead();
        });
        if (particles.length > 0) {
            animId = requestAnimationFrame(loop);
        } else {
            animId = null;
        }
    }

    function startLoop() {
        if (!animId) animId = requestAnimationFrame(loop);
    }

    function spawn(opts) {
        ensureCanvas();
        particles.push(new Particle(opts));
        startLoop();
    }

    function spawnBurst(count, opts) {
        ensureCanvas();
        for (let i = 0; i < count; i++) particles.push(new Particle({ ...opts }));
        startLoop();
    }

    // ── Named effects ─────────────────────────────────────────────────────────
    const effects = {

        goalCelebration(x, y) {
            ensureCanvas();
            const cx = x ?? W / 2;
            const cy = y ?? H / 2;
            const colors = ['#FFD700', '#FF6B35', '#FF1744', '#00E5FF', '#76FF03', '#E040FB', '#FF4081'];

            // Main burst — confetti
            for (let i = 0; i < 120; i++) {
                const angle = (Math.random() * Math.PI * 2);
                const speed = Math.random() * 22 + 8;
                particles.push(new Particle({
                    x: cx, y: cy,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed - 12,
                    size: Math.random() * 12 + 4,
                    color: colors[Math.floor(Math.random() * colors.length)],
                    shape: ['rect', 'circle', 'star', 'triangle'][Math.floor(Math.random() * 4)],
                    gravity: 0.35,
                    decay: 0.008 + Math.random() * 0.008,
                    glow: Math.random() > 0.7,
                }));
            }

            // Footballs
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                particles.push(new Particle({
                    x: cx, y: cy,
                    vx: Math.cos(angle) * (Math.random() * 10 + 5),
                    vy: Math.sin(angle) * (Math.random() * 10 + 5) - 8,
                    size: 20,
                    shape: 'ball',
                    gravity: 0.5,
                    decay: 0.006,
                }));
            }

            // Gold stars streaking up
            for (let i = 0; i < 20; i++) {
                particles.push(new Particle({
                    x: cx + (Math.random() - 0.5) * 100,
                    y: cy,
                    vx: (Math.random() - 0.5) * 4,
                    vy: -(Math.random() * 20 + 10),
                    size: 16,
                    color: '#FFD700',
                    shape: 'star',
                    gravity: 0.15,
                    decay: 0.006,
                    glow: true,
                    maxTrail: 8,
                }));
            }
            startLoop();
        },

        confettiRain() {
            ensureCanvas();
            const colors = ['#FFD700', '#FF6B35', '#00E5FF', '#76FF03', '#E040FB', '#FF4081', '#fff'];
            for (let i = 0; i < 200; i++) {
                setTimeout(() => {
                    particles.push(new Particle({
                        x: Math.random() * W,
                        y: -20,
                        vx: (Math.random() - 0.5) * 5,
                        vy: Math.random() * 4 + 2,
                        size: Math.random() * 10 + 4,
                        color: colors[Math.floor(Math.random() * colors.length)],
                        shape: ['rect', 'circle', 'triangle'][Math.floor(Math.random() * 3)],
                        gravity: 0.08,
                        drag: 0.995,
                        decay: 0.004,
                    }));
                    startLoop();
                }, i * 20);
            }
        },

        levelUpBurst(x, y) {
            ensureCanvas();
            const cx = x ?? W / 2;
            const cy = y ?? H / 2;
            // Ring of stars
            for (let i = 0; i < 24; i++) {
                const angle = (i / 24) * Math.PI * 2;
                const speed = 10 + Math.random() * 8;
                particles.push(new Particle({
                    x: cx, y: cy,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    size: Math.random() * 14 + 8,
                    color: i % 2 === 0 ? '#FFD700' : '#fff',
                    shape: 'star',
                    gravity: 0.1,
                    decay: 0.009,
                    glow: true,
                }));
            }
            // Central flash
            for (let i = 0; i < 30; i++) {
                const angle = Math.random() * Math.PI * 2;
                particles.push(new Particle({
                    x: cx, y: cy,
                    vx: Math.cos(angle) * (Math.random() * 8 + 2),
                    vy: Math.sin(angle) * (Math.random() * 8 + 2),
                    size: Math.random() * 6 + 3,
                    color: '#FFD700',
                    shape: 'circle',
                    gravity: 0,
                    decay: 0.025,
                    glow: true,
                }));
            }
            startLoop();
        },

        transferWhoosh(fromEl, toEl) {
            ensureCanvas();
            const rect = fromEl?.getBoundingClientRect?.() ?? { left: W * 0.3, top: H / 2 };
            const cx = rect.left + (rect.width ?? 0) / 2;
            const cy = rect.top + (rect.height ?? 0) / 2;
            const colors = ['#3b82f6', '#60a5fa', '#93c5fd', '#fff', '#FFD700'];
            for (let i = 0; i < 40; i++) {
                particles.push(new Particle({
                    x: cx, y: cy,
                    vx: (Math.random() - 0.5) * 16,
                    vy: (Math.random() - 0.5) * 16,
                    size: Math.random() * 10 + 4,
                    color: colors[Math.floor(Math.random() * colors.length)],
                    shape: Math.random() > 0.5 ? 'star' : 'circle',
                    gravity: 0.1,
                    decay: 0.015,
                    glow: true,
                }));
            }
            startLoop();
        },

        achievementPop(el) {
            ensureCanvas();
            const rect = el?.getBoundingClientRect?.() ?? { left: W / 2 - 50, top: H / 2 - 50, width: 100, height: 100 };
            const cx = rect.left + rect.width / 2;
            const cy = rect.top;
            const colors = ['#FFD700', '#FFF', '#FF4081', '#76FF03'];
            for (let i = 0; i < 50; i++) {
                const angle = (Math.random() * Math.PI) + Math.PI; // upward
                particles.push(new Particle({
                    x: cx + (Math.random() - 0.5) * rect.width,
                    y: cy,
                    vx: Math.cos(angle) * (Math.random() * 10),
                    vy: -(Math.random() * 14 + 4),
                    size: Math.random() * 10 + 4,
                    color: colors[Math.floor(Math.random() * colors.length)],
                    shape: ['rect', 'star', 'circle'][Math.floor(Math.random() * 3)],
                    gravity: 0.3,
                    decay: 0.012,
                    glow: Math.random() > 0.6,
                }));
            }
            startLoop();
        },

        sparkle(el, count = 15) {
            ensureCanvas();
            const rect = el?.getBoundingClientRect?.();
            if (!rect) return;
            for (let i = 0; i < count; i++) {
                particles.push(new Particle({
                    x: rect.left + Math.random() * rect.width,
                    y: rect.top + Math.random() * rect.height,
                    vx: (Math.random() - 0.5) * 3,
                    vy: -(Math.random() * 4 + 1),
                    size: Math.random() * 8 + 3,
                    color: Math.random() > 0.5 ? '#FFD700' : '#fff',
                    shape: 'star',
                    gravity: 0.05,
                    decay: 0.02,
                    glow: true,
                }));
            }
            startLoop();
        },

        shockwave(x, y) {
            // Expanding ring using many tiny particles
            ensureCanvas();
            const cx = x ?? W / 2;
            const cy = y ?? H / 2;
            for (let i = 0; i < 60; i++) {
                const angle = (i / 60) * Math.PI * 2;
                const speed = 15;
                particles.push(new Particle({
                    x: cx, y: cy,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    size: 6,
                    color: `hsl(${Math.floor(Math.random() * 60 + 30)}, 100%, 70%)`,
                    shape: 'circle',
                    gravity: 0,
                    drag: 0.9,
                    decay: 0.05,
                    glow: true,
                }));
            }
            startLoop();
        },

        clear() {
            particles = [];
            if (ctx2d) ctx2d.clearRect(0, 0, W, H);
        }
    };

    return { spawn, spawnBurst, effects };
})();

window.GS_Particles = GS_Particles;


// ── Extended particle effects ────────────────────────────────────────────────
(function extendParticles() {
    if (!window.GS_Particles) return;

    const extra = {
        // Fireworks burst
        fireworks(count = 5) {
            const W = window.innerWidth, H = window.innerHeight;
            for (let i = 0; i < count; i++) {
                setTimeout(() => {
                    const cx = W * 0.2 + Math.random() * W * 0.6;
                    const cy = H * 0.15 + Math.random() * H * 0.5;
                    GS_Particles.effects.shockwave(cx, cy);
                    const colors = ['#FFD700','#FF4081','#00E5FF','#76FF03','#E040FB','#FF6B35'];
                    for (let j = 0; j < 40; j++) {
                        const angle = (j / 40) * Math.PI * 2;
                        const speed = 8 + Math.random() * 12;
                        GS_Particles.spawn({
                            x: cx, y: cy,
                            vx: Math.cos(angle) * speed,
                            vy: Math.sin(angle) * speed - 4,
                            size: Math.random() * 8 + 3,
                            color: colors[Math.floor(Math.random() * colors.length)],
                            shape: Math.random() > 0.5 ? 'star' : 'circle',
                            gravity: 0.3, decay: 0.008, glow: true,
                        });
                    }
                }, i * 400 + Math.random() * 300);
            }
        },

        // DNA helix (for level up)
        dnaHelix(cx, cy) {
            const count = 60;
            for (let i = 0; i < count; i++) {
                const t = i / count;
                const angle = t * Math.PI * 4;
                const radius = 30;
                for (let strand = 0; strand < 2; strand++) {
                    const offset = strand === 0 ? 0 : Math.PI;
                    GS_Particles.spawn({
                        x: cx + Math.cos(angle + offset) * radius,
                        y: cy - t * 200,
                        vx: Math.cos(angle + offset) * 2,
                        vy: -(3 + Math.random() * 2),
                        size: 5,
                        color: strand === 0 ? '#FFD700' : '#00E5FF',
                        shape: 'circle',
                        gravity: -0.05, decay: 0.012, glow: true,
                    });
                }
            }
        },

        // Rain effect
        rain(duration = 3000, intensity = 50) {
            const W = window.innerWidth;
            const start = Date.now();
            const interval = setInterval(() => {
                if (Date.now() - start > duration) { clearInterval(interval); return; }
                for (let i = 0; i < intensity / 30; i++) {
                    GS_Particles.spawn({
                        x: Math.random() * W, y: -10,
                        vx: Math.random() * 2 - 1, vy: 8 + Math.random() * 4,
                        size: Math.random() * 3 + 1,
                        color: `rgba(${150 + Math.floor(Math.random()*100)},${200 + Math.floor(Math.random()*55)},255,0.7)`,
                        shape: 'circle', gravity: 0.1, decay: 0.015, drag: 0.99,
                    });
                }
            }, 33);
        },

        // Money rain (€€€)
        moneyRain() {
            const W = window.innerWidth;
            for (let i = 0; i < 30; i++) {
                setTimeout(() => {
                    GS_Particles.spawn({
                        x: Math.random() * W, y: -20,
                        vx: (Math.random() - 0.5) * 3,
                        vy: 3 + Math.random() * 3,
                        size: 14,
                        color: '#10b981',
                        shape: 'circle',
                        gravity: 0.05, decay: 0.005, glow: true,
                    });
                }, i * 100);
            }
        },

        // Sparkle trail following mouse
        _trailActive: false,
        startMouseTrail() {
            if (this._trailActive) return;
            this._trailActive = true;
            const handler = (e) => {
                if (!this._trailActive) { document.removeEventListener('mousemove', handler); return; }
                GS_Particles.spawn({
                    x: e.clientX, y: e.clientY,
                    vx: (Math.random() - 0.5) * 3, vy: -Math.random() * 3,
                    size: Math.random() * 6 + 2,
                    color: Math.random() > 0.5 ? '#FFD700' : '#fff',
                    shape: 'star', gravity: 0.05, decay: 0.04, glow: true,
                });
            };
            document.addEventListener('mousemove', handler);
        },
        stopMouseTrail() {
            this._trailActive = false;
        },
    };

    // Merge into GS_Particles.effects
    Object.assign(GS_Particles.effects, extra);
})();

// ── Additional particle presets ───────────────────────────────────────────────
Object.assign(GS_Particles.effects, {
    victory(cx, cy) {
        const x = cx ?? window.innerWidth / 2;
        const y = cy ?? window.innerHeight * 0.3;
        // Trophy explosion
        GS_Particles.effects.goalCelebration(x, y);
        setTimeout(() => GS_Particles.effects.confettiRain(), 500);
        setTimeout(() => GS_Particles.effects.shockwave(x, y), 800);
    },
    goalFlash() {
        // Quick flash of stars around the net area
        const x = window.innerWidth * 0.2;
        const y = window.innerHeight * 0.5;
        for (let i = 0; i < 30; i++) {
            GS_Particles.spawn({
                x: x + (Math.random() - 0.5) * 100,
                y: y + (Math.random() - 0.5) * 60,
                vx: (Math.random() - 0.5) * 8,
                vy: -(Math.random() * 6 + 2),
                size: Math.random() * 10 + 5,
                color: Math.random() > 0.5 ? '#FFD700' : '#fff',
                shape: Math.random() > 0.5 ? 'star' : 'circle',
                gravity: 0.2,
                decay: 0.02,
                glow: true,
            });
        }
        startLoop();
    },
    levelUpRing(el) {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        GS_Particles.effects.levelUpBurst(cx, cy);
        GS_Particles.effects.shockwave(cx, cy);
    },
    rain(count = 80, colors = ['#FFD700', '#fff', '#60a5fa']) {
        if (typeof window === 'undefined') return;
        const W = window.innerWidth;
        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                GS_Particles.spawn({
                    x: Math.random() * W,
                    y: -10,
                    vx: (Math.random() - 0.5) * 2,
                    vy: Math.random() * 3 + 2,
                    size: Math.random() * 6 + 2,
                    color: colors[Math.floor(Math.random() * colors.length)],
                    shape: Math.random() > 0.5 ? 'circle' : 'rect',
                    gravity: 0.05,
                    drag: 0.998,
                    decay: 0.003,
                });
            }, i * 25);
        }
    }
});
