/* ==========================================================================
   Akmal — Atmosphere
   Cursor (dot, ring, glow), ambient light that follows the pointer,
   and a starfield of floating dust with the occasional falling star.
   ========================================================================== */
(() => {
  const S = (window.SELENE = window.SELENE || {});

  /* ======================================================================
     Cursor
     ====================================================================== */
  const Cursor = {
    init() {
      const root = document.querySelector('.cursor');
      const ambient = document.querySelector('.ambient');
      if (S.env.touch) { root && root.remove(); }

      // ambient light follows the pointer lazily (on every device)
      const light = { x: 50, y: 30 };
      const lxTo = gsap.quickTo(light, 'x', { duration: 2.4, ease: 'power3.out', onUpdate: () => ambient.style.setProperty('--px', `${light.x}%`) });
      const lyTo = gsap.quickTo(light, 'y', { duration: 2.4, ease: 'power3.out', onUpdate: () => ambient.style.setProperty('--py', `${light.y}%`) });
      addEventListener('pointermove', (e) => {
        lxTo((e.clientX / innerWidth) * 100);
        lyTo((e.clientY / innerHeight) * 100);
      }, { passive: true });

      if (S.env.touch || !root) return;

      const dot = root.querySelector('.cursor-dot');
      const ring = root.querySelector('.cursor-ring');
      const glow = root.querySelector('.cursor-glow');
      const label = root.querySelector('.cursor-label');
      gsap.set([dot, ring, glow], { xPercent: -50, yPercent: -50 });

      const dx = gsap.quickTo(dot, 'x', { duration: 0.12, ease: 'power3' });
      const dy = gsap.quickTo(dot, 'y', { duration: 0.12, ease: 'power3' });
      const rx = gsap.quickTo(ring, 'x', { duration: 0.55, ease: 'power3' });
      const ry = gsap.quickTo(ring, 'y', { duration: 0.55, ease: 'power3' });
      const gx = gsap.quickTo(glow, 'x', { duration: 1.4, ease: 'power3' });
      const gy = gsap.quickTo(glow, 'y', { duration: 1.4, ease: 'power3' });

      let shown = false;
      addEventListener('pointermove', (e) => {
        if (e.pointerType === 'touch') return;
        if (!shown) { shown = true; gsap.to(root, { opacity: 1, duration: 0.6 }); }
        dx(e.clientX); dy(e.clientY);
        rx(e.clientX); ry(e.clientY);
        gx(e.clientX); gy(e.clientY);
      }, { passive: true });
      document.addEventListener('pointerleave', () => { shown = false; gsap.to(root, { opacity: 0, duration: 0.4 }); });

      // contextual states
      document.addEventListener('pointerover', (e) => {
        const labelled = e.target.closest('[data-cursor]');
        const interactive = e.target.closest('a, button, input, [data-magnetic]');
        root.classList.toggle('is-label', !!labelled);
        root.classList.toggle('is-hover', !labelled && !!interactive);
        label.textContent = labelled ? labelled.dataset.cursor : '';
      });
      addEventListener('pointerdown', () => root.classList.add('is-down'));
      addEventListener('pointerup', () => root.classList.remove('is-down'));
    },
  };

  /* ======================================================================
     Particles — stars + drifting lunar dust
     ====================================================================== */
  const Particles = {
    init(canvas) {
      const ctx = canvas.getContext('2d');
      const dpr = Math.min(S.env.dpr, 1.5);
      let w, h, parts = [], shooting = null, nextShoot = 6;
      const mouse = { x: 0, y: 0 };

      const make = () => {
        const count = Math.round(Math.min(220, (w * h) / 9000));
        parts = Array.from({ length: count }, () => {
          const z = Math.random();
          return {
            x: Math.random() * w, y: Math.random() * h, z,
            r: 0.35 + z * z * 1.6,
            a: 0.15 + z * 0.6,
            tw: Math.random() * Math.PI * 2,
            ts: 0.4 + Math.random() * 1.6,
            vx: (Math.random() - 0.5) * 3 * z,
            vy: -(2 + Math.random() * 6) * z,
          };
        });
      };
      const resize = () => {
        w = innerWidth; h = innerHeight;
        canvas.width = w * dpr; canvas.height = h * dpr;
        canvas.style.width = `${w}px`; canvas.style.height = `${h}px`;
        make();
      };
      resize();
      addEventListener('resize', S.util.debounce(resize, 200));

      let lastScroll = scrollY, scrollVel = 0;

      gsap.ticker.add((time, deltaMs) => {
        const dt = Math.min(deltaMs, 50) / 1000;
        mouse.x += (S.pointer.nx - mouse.x) * 0.04;
        mouse.y += (S.pointer.ny - mouse.y) * 0.04;
        const sv = scrollY - lastScroll; lastScroll = scrollY;
        scrollVel += (sv - scrollVel) * 0.1;

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, w, h);
        const t = S.theme;
        const col = `${t.glR | 0},${t.glG | 0},${t.glB | 0}`;
        const boost = 0.7 + t.lit * 0.5;

        for (let i = 0; i < parts.length; i++) {
          const p = parts[i];
          p.x += p.vx * dt;
          p.y += p.vy * dt - scrollVel * p.z * 0.35;
          if (p.y < -10) p.y = h + 10; else if (p.y > h + 10) p.y = -10;
          if (p.x < -10) p.x = w + 10; else if (p.x > w + 10) p.x = -10;
          const px = p.x - mouse.x * 30 * p.z;
          const py = p.y - mouse.y * 30 * p.z;
          const tw = 0.55 + 0.45 * Math.sin(time * p.ts + p.tw);
          ctx.globalAlpha = p.a * tw * boost;
          ctx.fillStyle = `rgb(${col})`;
          ctx.beginPath();
          ctx.arc(px, py, p.r, 0, 6.2832);
          ctx.fill();
        }

        // an occasional falling star
        nextShoot -= dt;
        if (!shooting && nextShoot <= 0) {
          const a = Math.PI * (0.12 + Math.random() * 0.12);
          shooting = { x: Math.random() * w * 0.7, y: Math.random() * h * 0.35, a, life: 0, len: 120 + Math.random() * 160, speed: 900 + Math.random() * 500 };
          nextShoot = 9 + Math.random() * 10;
        }
        if (shooting) {
          const s = shooting;
          s.life += dt;
          s.x += Math.cos(s.a) * s.speed * dt;
          s.y += Math.sin(s.a) * s.speed * dt;
          const fadeK = Math.min(1, s.life * 4) * Math.max(0, 1 - s.life / 1.1);
          const tx = s.x - Math.cos(s.a) * s.len, ty = s.y - Math.sin(s.a) * s.len;
          const g = ctx.createLinearGradient(s.x, s.y, tx, ty);
          g.addColorStop(0, `rgba(255,255,255,${0.8 * fadeK})`);
          g.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.globalAlpha = 1;
          ctx.strokeStyle = g; ctx.lineWidth = 1.1;
          ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(tx, ty); ctx.stroke();
          if (s.life > 1.1) shooting = null;
        }
        ctx.globalAlpha = 1;
      });
    },
  };

  S.Cursor = Cursor;
  S.Particles = Particles;
})();
