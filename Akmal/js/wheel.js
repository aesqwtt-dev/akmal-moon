/* ==========================================================================
   SELENE — Moon Wheel
   Sixteen phases on a ring. Drag with inertia, click to spring into place,
   arrow keys to step. The phase at twelve o'clock is the active collection.
   ========================================================================== */
(() => {
  const S = (window.SELENE = window.SELENE || {});
  const { wrap, angleDelta, clamp } = S.util;

  const STEP = 360 / 16;
  const FRICTION = 0.93;      // per 60fps frame
  const SPRING_K = 95;        // stiffness
  const SPRING_ZETA = 0.62;   // damping ratio (<1 → a little overshoot)

  const state = {
    rot: 0, vel: 0, target: 0,
    mode: 'idle',           // idle | drag | inertia | spring
    dirty: true,
    index: -1,
    radius: 0, itemSize: 64,
  };

  let wheel, itemsWrap, ticks, items = [], collections;

  /* ---------- build ---------- */
  function build() {
    // tick ring (static SVG, rotated as one piece)
    const NS = 'http://www.w3.org/2000/svg';
    ticks = document.createElementNS(NS, 'svg');
    ticks.setAttribute('viewBox', '-100 -100 200 200');
    ticks.classList.add('wheel-ticks');
    let markup = '<circle r="99.4" class="tk-ring"/><circle r="58" class="tk-ring tk-inner"/>';
    for (let i = 0; i < 128; i++) {
      const a = (i / 128) * Math.PI * 2;
      const major = i % 8 === 0;
      const r1 = major ? 93 : 96.5, r2 = 99.4;
      markup += `<line x1="${Math.cos(a) * r1}" y1="${Math.sin(a) * r1}" x2="${Math.cos(a) * r2}" y2="${Math.sin(a) * r2}" class="${major ? 'tk-major' : 'tk-minor'}"/>`;
    }
    ticks.innerHTML = markup;
    wheel.prepend(ticks);

    items = collections.map((c, i) => {
      const btn = document.createElement('button');
      btn.className = 'phase-item';
      btn.type = 'button';
      btn.setAttribute('role', 'option');
      btn.setAttribute('aria-label', `${c.moon} — ${c.name}`);
      btn.dataset.index = i;
      btn.innerHTML = `<canvas></canvas><span class="phase-label"><em>${c.num}</em>${c.moon}</span>`;
      itemsWrap.appendChild(btn);
      return { el: btn, canvas: btn.querySelector('canvas'), label: btn.querySelector('.phase-label') };
    });
  }

  function renderMoons() {
    items.forEach((it, i) => {
      S.Moon.setupCanvas(it.canvas, state.itemSize, 2.1);
      S.Moon.draw(it.canvas, collections[i].phase, { pad: 0.14, halo: 0.9, soft: 0.05, earthshine: 0.1 });
    });
  }

  function measure() {
    const size = wheel.getBoundingClientRect().width;
    state.itemSize = clamp(size * 0.075, 30, 60);
    state.radius = size * 0.5 * 0.8;
    renderMoons();
    state.dirty = true;
  }

  /* ---------- layout (runs only while moving) ---------- */
  function layout() {
    const R = state.radius;
    ticks.style.transform = `rotate(${state.rot}deg)`;
    for (let i = 0; i < items.length; i++) {
      const a = i * STEP + state.rot;              // 0 = top
      const rad = (a - 90) * Math.PI / 180;
      const x = Math.cos(rad) * R, y = Math.sin(rad) * R;
      const dist = Math.abs(angleDelta(0, a));      // distance from 12 o'clock
      const prox = Math.max(0, 1 - dist / (STEP * 2.2));
      const eased = 1 - Math.pow(1 - prox, 3);
      const scale = 1 + eased * 0.95;
      const opacity = 0.22 + 0.78 * Math.max(eased, Math.pow(1 - dist / 180, 2.2) * 0.55);
      const it = items[i];
      it.el.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) scale(${scale})`;
      it.el.style.opacity = opacity;
      it.el.style.zIndex = Math.round(eased * 10) + 1;
      it.label.style.opacity = Math.pow(Math.max(0, 1 - dist / (STEP * 0.6)), 2);
    }
    const idx = wrap(Math.round(-state.rot / STEP), items.length);
    if (idx !== state.index) {
      if (state.index >= 0) items[state.index].el.classList.remove('is-active');
      items[idx].el.classList.add('is-active');
      items[idx].el.setAttribute('aria-selected', 'true');
      if (state.index >= 0) items[state.index].el.setAttribute('aria-selected', 'false');
      state.index = idx;
      S.bus.emit('wheel:index', idx);
    }
  }

  /* ---------- physics ---------- */
  function tick(time, deltaMs) {
    const dt = Math.min(deltaMs, 50) / 1000;
    if (state.mode === 'inertia') {
      state.rot += state.vel * dt;
      state.vel *= Math.pow(FRICTION, dt * 60);
      if (Math.abs(state.vel) < 60) {
        state.mode = 'spring';
        state.target = Math.round(state.rot / STEP) * STEP;
      }
      state.dirty = true;
    } else if (state.mode === 'spring') {
      const c = 2 * Math.sqrt(SPRING_K) * SPRING_ZETA;
      const x = state.target - state.rot;
      state.vel += (x * SPRING_K - state.vel * c) * dt;
      state.rot += state.vel * dt;
      if (Math.abs(x) < 0.01 && Math.abs(state.vel) < 0.05) {
        state.rot = state.target; state.vel = 0; state.mode = 'idle';
      }
      state.dirty = true;
    }
    if (state.dirty) { layout(); state.dirty = false; }
  }

  /* ---------- interaction ---------- */
  function goTo(i) {
    const d = angleDelta(state.rot, -i * STEP);
    // snap to the grid to avoid accumulated drift
    state.target = Math.round((state.rot + d) / STEP) * STEP;
    state.mode = 'spring';
  }

  function bindPointer() {
    let lastAngle = 0, lastT = 0, moved = 0, pointerId = null, downTarget = null;
    const angleAt = (e) => {
      const r = wheel.getBoundingClientRect();
      return Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180 / Math.PI;
    };

    wheel.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      pointerId = e.pointerId;
      downTarget = e.target.closest('.phase-item');
      lastAngle = angleAt(e);
      lastT = performance.now();
      moved = 0;
      state.vel = 0;
      state.mode = 'drag';
      wheel.classList.add('is-dragging');
    });

    wheel.addEventListener('pointermove', (e) => {
      if (state.mode !== 'drag' || e.pointerId !== pointerId) return;
      const a = angleAt(e);
      const d = angleDelta(lastAngle, a);
      const now = performance.now();
      const dt = Math.max(1, now - lastT) / 1000;
      moved += Math.abs(d);
      if (moved > 3 && !wheel.hasPointerCapture(pointerId)) wheel.setPointerCapture(pointerId);
      state.rot += d;
      state.vel = state.vel * 0.6 + (d / dt) * 0.4;
      lastAngle = a; lastT = now;
      state.dirty = true;
    });

    const release = (e) => {
      if (state.mode !== 'drag' || (e && e.pointerId !== pointerId)) return;
      wheel.classList.remove('is-dragging');
      if (moved < 3 && downTarget) {
        goTo(+downTarget.dataset.index);
      } else {
        // stale velocity if the pointer paused before release
        if (performance.now() - lastT > 90) state.vel = 0;
        state.vel = clamp(state.vel, -1400, 1400);
        state.mode = 'inertia';
      }
      pointerId = null; downTarget = null;
    };
    wheel.addEventListener('pointerup', release);
    wheel.addEventListener('pointercancel', release);
    wheel.addEventListener('lostpointercapture', release);

    wheel.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); next(); }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); prev(); }
    });
  }

  // step relative to where the wheel is heading, so rapid presses accumulate
  const heading = () => (state.mode === 'spring' ? wrap(Math.round(-state.target / STEP), items.length) : state.index);
  const next = () => goTo(wrap(heading() + 1, items.length));
  const prev = () => goTo(wrap(heading() - 1, items.length));

  S.Wheel = {
    init(el, list, startIndex = 0) {
      wheel = el;
      collections = list;
      itemsWrap = el.querySelector('.wheel-items');
      build();
      measure();
      state.rot = -startIndex * STEP;
      layout();
      bindPointer();
      gsap.ticker.add(tick);
      addEventListener('resize', S.util.debounce(measure, 200));
    },
    goTo, next, prev,
    get index() { return state.index; },
  };
})();
