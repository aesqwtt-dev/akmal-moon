/* ==========================================================================
   SELENE — Collection controller
   Single source of truth for the active phase. Everything that reacts to
   the moon — lighting, typography, copy, imagery, products — listens here.
   ========================================================================== */
(() => {
  const S = (window.SELENE = window.SELENE || {});
  const { illumination, mixRGB, cycleDelta, wrap } = S.util;

  /* ---------- lighting: derived from the phase itself ---------- */
  const COOL = [192, 204, 226];   // waxing — blue silver
  const WARM = [228, 219, 203];   // waning — champagne silver
  const NEUTRAL = [210, 210, 214];

  function themeFor(c) {
    const lit = illumination(c.phase);
    const waxing = c.phase > 0 && c.phase < 0.5;
    const tone = c.phase === 0 || c.phase === 0.5 ? NEUTRAL : (waxing ? COOL : WARM);
    const bg = mixRGB([5, 5, 7], [19, 19, 21], Math.pow(lit, 1.3));
    return {
      bgR: bg[0], bgG: bg[1], bgB: bg[2],
      glR: tone[0], glG: tone[1], glB: tone[2],
      glA: 0.05 + lit * 0.26,
      lit,
      // typography breathes with the light: tighter in the dark, airier at full
      track: -0.045 + lit * 0.03,
      lx: waxing ? 72 : 28, // light source side follows the lit limb
    };
  }

  const theme = { bgR: 5, bgG: 5, bgB: 7, glR: 210, glG: 210, glB: 214, glA: 0.1, lit: 0, track: -0.04, lx: 60 };
  S.theme = theme;

  const root = document.documentElement;
  function applyTheme() {
    root.style.setProperty('--bg', `rgb(${theme.bgR | 0},${theme.bgG | 0},${theme.bgB | 0})`);
    root.style.setProperty('--glow', `${theme.glR | 0},${theme.glG | 0},${theme.glB | 0}`);
    root.style.setProperty('--glow-a', theme.glA.toFixed(3));
    root.style.setProperty('--lit', theme.lit.toFixed(3));
    root.style.setProperty('--track', `${theme.track.toFixed(4)}em`);
    root.style.setProperty('--lx', `${theme.lx.toFixed(1)}%`);
  }

  /* ---------- hero moon: phase tween along the shortest path ---------- */
  const heroMoon = { phase: 0, canvas: null };
  function drawHero() {
    if (heroMoon.canvas) S.Moon.draw(heroMoon.canvas, heroMoon.phase, { pad: 0.16, halo: 1.2, soft: 0.03, earthshine: 0.06 });
  }

  /* ---------- controller ---------- */
  let list, current = -1, contentTimer;

  function applyContent(c, immediate) {
    // text bindings: [data-bind="name"] etc.
    document.querySelectorAll('[data-bind]').forEach((el) => {
      const key = el.dataset.bind;
      let value = key === 'illum' ? `${Math.round(illumination(c.phase) * 100)}%`
        : key === 'line1' ? c.line[0]
        : key === 'line2' ? c.line[1]
        : key === 'index' ? String(c.index + 1).padStart(2, '0')
        : c[key];
      if (value == null) return;
      if (immediate) { el.textContent = value; el.dataset.text = value; }
      else S.Anim.swapText(el, String(value));
    });

    // image bindings: [data-bind-img="0"] uses c.photos[0]
    document.querySelectorAll('[data-bind-img]').forEach((el) => {
      const slot = +el.dataset.bindImg;
      const w = +(el.dataset.w || 1400);
      S.Anim.swapImage(el, S.data.img(c.photos[slot], w), { mode: el.dataset.mode || 'wipe', alt: `${c.name} — look ${slot + 1}` });
    });

    // hero moon
    const target = heroMoon.phase + cycleDelta(heroMoon.phase, c.phase);
    gsap.to(heroMoon, {
      phase: target, duration: immediate ? 0 : 2.2, ease: 'power3.inOut', overwrite: true,
      onUpdate: drawHero,
      onComplete: () => { heroMoon.phase = wrap(heroMoon.phase, 1); },
    });

    S.bus.emit('collection:change', { c, immediate });
  }

  S.Collections = {
    init(collections, heroCanvas) {
      list = collections;
      heroMoon.canvas = heroCanvas;
    },
    resizeHero(size) {
      if (!heroMoon.canvas) return;
      S.Moon.setupCanvas(heroMoon.canvas, size, 1);
      drawHero();
    },
    get active() { return list[current]; },
    get index() { return current; },

    setActive(i, { immediate = false } = {}) {
      if (i === current) return;
      current = i;
      const c = list[i];

      // lighting starts instantly and flows over ~1.8s
      gsap.to(theme, { ...themeFor(c), duration: immediate ? 0 : 1.8, ease: 'power2.inOut', overwrite: true, onUpdate: applyTheme });
      if (immediate) applyTheme();

      // content waits a beat so a fast spin doesn't thrash every image
      clearTimeout(contentTimer);
      if (immediate) applyContent(c, true);
      else contentTimer = setTimeout(() => applyContent(c, false), 180);
    },
  };
})();
