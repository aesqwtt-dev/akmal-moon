/* ==========================================================================
   SELENE — Utilities & reusable animation primitives
   ========================================================================== */
(() => {
  const S = (window.SELENE = window.SELENE || {});

  /* ---------- math ---------- */
  const util = {
    clamp: (v, a, b) => Math.min(b, Math.max(a, v)),
    lerp: (a, b, t) => a + (b - a) * t,
    wrap: (v, n) => ((v % n) + n) % n,
    // shortest signed difference between two angles (degrees)
    angleDelta: (from, to) => {
      let d = (to - from) % 360;
      if (d > 180) d -= 360;
      if (d < -180) d += 360;
      return d;
    },
    // shortest signed difference on a cyclic [0,1) domain
    cycleDelta: (from, to) => {
      let d = (to - from) % 1;
      if (d > 0.5) d -= 1;
      if (d < -0.5) d += 1;
      return d;
    },
    mixRGB: (a, b, t) => a.map((v, i) => v + (b[i] - v) * t),
    debounce: (fn, ms) => {
      let t;
      return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
    },
    // Fraction of the disc that is lit for a phase in [0,1)
    illumination: (p) => (1 - Math.cos(p * Math.PI * 2)) / 2,
  };
  S.util = util;

  /* ---------- tiny event bus ---------- */
  const listeners = {};
  S.bus = {
    on(evt, fn) { (listeners[evt] = listeners[evt] || []).push(fn); },
    emit(evt, data) { (listeners[evt] || []).forEach((fn) => fn(data)); },
  };

  S.env = {
    reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
    touch: matchMedia('(hover: none), (pointer: coarse)').matches,
    dpr: Math.min(window.devicePixelRatio || 1, 2),
  };

  // Shared pointer state (normalised -1..1 from viewport centre)
  S.pointer = { x: innerWidth / 2, y: innerHeight / 2, nx: 0, ny: 0 };
  addEventListener('pointermove', (e) => {
    S.pointer.x = e.clientX;
    S.pointer.y = e.clientY;
    S.pointer.nx = (e.clientX / innerWidth) * 2 - 1;
    S.pointer.ny = (e.clientY / innerHeight) * 2 - 1;
  }, { passive: true });

  /* ======================================================================
     Anim — reusable motion vocabulary
     ====================================================================== */
  // All photography is monochrome; animated filters must keep it that way.
  const MONO = 'grayscale(1) contrast(1.05)';

  const Anim = {
    MONO,
    ease: {
      out: 'expo.out',
      inOut: 'power3.inOut',
      soft: 'power2.out',
    },

    /** Masked line reveal for headings — triggered on scroll or immediately. */
    splitReveal(el, { delay = 0, scroll = true, stagger = 0.08, duration = 1.4, start = 'top 85%' } = {}) {
      const split = new SplitType(el, { types: 'lines,words' });
      split.lines.forEach((line) => {
        const mask = document.createElement('span');
        mask.className = 'line-mask';
        line.parentNode.insertBefore(mask, line);
        mask.appendChild(line);
      });
      gsap.set(split.words, { yPercent: 115, rotate: 4, transformOrigin: '0% 100%' });
      const tween = {
        yPercent: 0, rotate: 0, duration, delay, stagger,
        ease: Anim.ease.out,
        onComplete: () => { split.revert(); el.classList.add('is-revealed'); },
      };
      if (scroll) tween.scrollTrigger = { trigger: el, start, once: true };
      el.style.visibility = 'visible';
      return gsap.to(split.words, tween);
    },

    /** Word fade with blur — for paragraphs. */
    fadeWords(el, { delay = 0, scroll = true, start = 'top 88%' } = {}) {
      const split = new SplitType(el, { types: 'words' });
      el.style.visibility = 'visible';
      return gsap.fromTo(split.words,
        { opacity: 0, y: 14, filter: 'blur(8px)' },
        {
          opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.1, delay,
          stagger: 0.012, ease: Anim.ease.soft,
          scrollTrigger: scroll ? { trigger: el, start, once: true } : undefined,
          onComplete: () => split.revert(),
        });
    },

    /**
     * Write text as word/char spans. (SplitType caches an element's first
     * content and restores it on re-split, so live-changing text uses this.)
     */
    charSpans(el, text) {
      el.innerHTML = text.split(' ').map((word) =>
        `<span class="sw-word">${[...word].map((ch) => `<span class="sw-char">${ch.replace(/[&<>]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[m])}</span>`).join('')}</span>`
      ).join(' ');
      return el.querySelectorAll('.sw-char');
    },

    /** Replace text with a blur/char cascade. Safe to call rapidly. */
    swapText(el, text, { delay = 0 } = {}) {
      if (!el || el.dataset.text === text) return;
      el.dataset.text = text;
      if (el._swap) el._swap.kill();
      const tl = gsap.timeline({ delay });
      el._swap = tl;
      tl.to(el, { opacity: 0, y: -10, filter: 'blur(10px)', duration: 0.35, ease: 'power2.in' })
        .add(() => {
          const chars = Anim.charSpans(el, text);
          gsap.set(el, { opacity: 1, y: 0, filter: 'blur(0px)' });
          tl.fromTo(chars,
            { opacity: 0, yPercent: 60, filter: 'blur(12px)' },
            { opacity: 1, yPercent: 0, filter: 'blur(0px)', duration: 0.9, stagger: 0.018, ease: Anim.ease.out },
            '>');
        });
      return tl;
    },

    /**
     * Crossfade a new photograph into a container.
     * mode: 'wipe' (vertical curtain) | 'circle' (moonrise) | 'fade'
     */
    swapImage(container, src, { mode = 'wipe', alt = '' } = {}) {
      if (!container || container.dataset.src === src) return;
      container.dataset.src = src;
      const next = new Image();
      next.alt = alt;
      next.decoding = 'async';
      next.className = 'swap-img';
      const reveal = () => {
        if (container.dataset.src !== src) return; // superseded
        const prev = [...container.querySelectorAll('.swap-img')];
        container.appendChild(next);
        const from = {
          wipe:   { clipPath: 'inset(100% 0% 0% 0%)', scale: 1.25, filter: `${MONO} blur(14px) brightness(1.4)` },
          circle: { clipPath: 'circle(0% at 50% 50%)', scale: 1.3, filter: `${MONO} blur(16px) brightness(1.6)` },
          fade:   { opacity: 0, scale: 1.08, filter: `${MONO} blur(20px) brightness(1)` },
        }[mode];
        const to = {
          wipe:   { clipPath: 'inset(0% 0% 0% 0%)' },
          circle: { clipPath: 'circle(75% at 50% 50%)' },
          fade:   { opacity: 1 },
        }[mode];
        gsap.fromTo(next, from, {
          ...to, scale: 1, filter: `${MONO} blur(0px) brightness(1)`, duration: 1.5, ease: 'expo.inOut',
          onComplete: () => prev.forEach((n) => n.remove()),
        });
        prev.forEach((n) => gsap.to(n, { scale: 1.08, opacity: 0.2, filter: `${MONO} blur(6px) brightness(0.6)`, duration: 1.4, ease: 'expo.inOut' }));
      };
      next.onload = reveal;
      next.onerror = reveal;
      next.src = src;
    },

    /** Cinematic clip reveal on scroll for [data-reveal] figures. */
    imageReveal(fig, { start = 'top 85%' } = {}) {
      const inner = fig.querySelector('img, canvas, .reveal-inner');
      const tl = gsap.timeline({ scrollTrigger: { trigger: fig, start, once: true } });
      tl.fromTo(fig,
        { clipPath: 'inset(22% 14% 22% 14%)' },
        { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.8, ease: 'expo.inOut' });
      if (inner) {
        tl.fromTo(inner,
          { scale: 1.45, filter: `${MONO} blur(10px) brightness(0.4)` },
          { scale: 1, filter: `${MONO} blur(0px) brightness(1)`, duration: 2.2, ease: 'expo.out' }, 0);
      }
      return tl;
    },

    /** Scroll parallax — speed is a fraction of the element height. */
    parallax(el, speed = 0.3, trigger) {
      return gsap.fromTo(el, { yPercent: -speed * 20 }, {
        yPercent: speed * 20, ease: 'none',
        scrollTrigger: { trigger: trigger || el, start: 'top bottom', end: 'bottom top', scrub: true },
      });
    },

    /** Magnetic attraction toward the pointer. */
    magnetic(el, strength = 0.35) {
      if (S.env.touch) return;
      const inner = el.querySelector('[data-magnetic-inner]');
      const xTo = gsap.quickTo(el, 'x', { duration: 0.8, ease: 'power3.out' });
      const yTo = gsap.quickTo(el, 'y', { duration: 0.8, ease: 'power3.out' });
      const ixTo = inner && gsap.quickTo(inner, 'x', { duration: 0.8, ease: 'power3.out' });
      const iyTo = inner && gsap.quickTo(inner, 'y', { duration: 0.8, ease: 'power3.out' });
      let rect;
      el.addEventListener('pointerenter', () => { rect = el.getBoundingClientRect(); });
      el.addEventListener('pointermove', (e) => {
        if (!rect) rect = el.getBoundingClientRect();
        const dx = e.clientX - (rect.left + rect.width / 2);
        const dy = e.clientY - (rect.top + rect.height / 2);
        xTo(dx * strength); yTo(dy * strength);
        if (inner) { ixTo(dx * strength * 0.5); iyTo(dy * strength * 0.5); }
      });
      el.addEventListener('pointerleave', () => {
        rect = null;
        gsap.to(el, { x: 0, y: 0, duration: 1.2, ease: 'elastic.out(1, 0.35)' });
        if (inner) gsap.to(inner, { x: 0, y: 0, duration: 1.2, ease: 'elastic.out(1, 0.35)' });
      });
    },

    /** 3D tilt + moving specular light (uses --mx/--my in CSS). */
    tilt(el, { max = 8 } = {}) {
      if (S.env.touch) return;
      const rx = gsap.quickTo(el, 'rotationX', { duration: 0.9, ease: 'power3.out' });
      const ry = gsap.quickTo(el, 'rotationY', { duration: 0.9, ease: 'power3.out' });
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        ry((px - 0.5) * max * 2);
        rx(-(py - 0.5) * max * 2);
        el.style.setProperty('--mx', `${px * 100}%`);
        el.style.setProperty('--my', `${py * 100}%`);
      });
      el.addEventListener('pointerleave', () => { rx(0); ry(0); });
    },
  };
  S.Anim = Anim;
})();
