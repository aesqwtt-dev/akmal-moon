/* ==========================================================================
   SELENE — Sections
   One small module per chapter of the page. Each exposes init().
   ========================================================================== */
(() => {
  const S = (window.SELENE = window.SELENE || {});
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const { clamp, illumination } = S.util;
  const Sections = {};

  /* ======================================================================
     Global reveals — declarative via data attributes
     ====================================================================== */
  Sections.reveals = {
    init() {
      $$('[data-split]').forEach((el) => S.Anim.splitReveal(el));
      $$('[data-fade]').forEach((el) => S.Anim.fadeWords(el));
      $$('[data-reveal]').forEach((el) => S.Anim.imageReveal(el));
      $$('[data-speed]').forEach((el) => S.Anim.parallax(el, +el.dataset.speed, el.closest('[data-speed-trigger]') || el.parentElement));
      $$('[data-magnetic]').forEach((el) => S.Anim.magnetic(el, +(el.dataset.magnetic || 0.35)));
      $$('.rule').forEach((el) => gsap.fromTo(el, { scaleX: 0 }, {
        scaleX: 1, duration: 1.8, ease: 'expo.inOut', transformOrigin: '0% 50%',
        scrollTrigger: { trigger: el, start: 'top 92%', once: true },
      }));
      $$('[data-rise]').forEach((el) => gsap.fromTo(el, { y: 40, opacity: 0, filter: 'blur(8px)' }, {
        y: 0, opacity: 1, filter: 'blur(0px)', duration: 1.3, ease: 'expo.out', delay: +(el.dataset.rise || 0),
        scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      }));
    },
  };

  /* ======================================================================
     Hero
     ====================================================================== */
  Sections.hero = {
    init() {
      const hero = $('#hero');
      const moonWrap = $('.hero-moon', hero);
      const title = $('.hero-title', hero);

      const size = () => {
        const s = innerWidth < 768 ? innerWidth * 1.05 : Math.min(innerHeight * 0.92, innerWidth * 0.56);
        S.Collections.resizeHero(Math.round(s));
      };
      size();
      addEventListener('resize', S.util.debounce(size, 200));

      // mouse parallax — moon floats against the pointer, type drifts with it
      if (!S.env.touch) {
        const mx = gsap.quickTo(moonWrap, 'x', { duration: 1.8, ease: 'power3.out' });
        const my = gsap.quickTo(moonWrap, 'y', { duration: 1.8, ease: 'power3.out' });
        const tx = gsap.quickTo(title, 'x', { duration: 1.4, ease: 'power3.out' });
        const rot = gsap.quickTo(moonWrap, 'rotation', { duration: 2, ease: 'power3.out' });
        hero.addEventListener('pointermove', () => {
          mx(-S.pointer.nx * 34); my(-S.pointer.ny * 24);
          tx(S.pointer.nx * 14);
          rot(S.pointer.nx * 4);
        });
      }

      // scroll: the moon rises and swells while the headline sinks away
      gsap.timeline({ scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 1 } })
        .to('.hero-moon-inner', { yPercent: -28, scale: 1.25, ease: 'none' }, 0)
        .to(title, { yPercent: 38, opacity: 0.1, filter: 'blur(6px)', ease: 'none' }, 0)
        .to('.hero-bottom', { y: -60, opacity: 0, ease: 'none' }, 0);
    },

    // played once the preloader lifts
    intro() {
      const tl = gsap.timeline();
      tl.fromTo('.hero-moon-inner', { scale: 0.7, opacity: 0, filter: 'blur(30px)', rotate: -25 },
        { scale: 1, opacity: 1, filter: 'blur(0px)', rotate: 0, duration: 3, ease: 'expo.out' }, 0)
        .fromTo('.hero-word', { yPercent: 120, rotate: 6 },
          { yPercent: 0, rotate: 0, duration: 1.8, stagger: 0.12, ease: 'expo.out' }, 0.25)
        .fromTo('.hero-fade', { opacity: 0, y: 20, filter: 'blur(8px)' },
          { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.4, stagger: 0.08, ease: 'expo.out' }, 0.9)
        .fromTo('.site-nav', { yPercent: -100, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 1.4, ease: 'expo.out' }, 0.8);
      return tl;
    },
  };

  /* ======================================================================
     Moon wheel section
     ====================================================================== */
  Sections.phases = {
    init(startIndex) {
      const wheelEl = $('#wheel');
      S.Wheel.init(wheelEl, S.data.collections, startIndex);
      S.bus.on('wheel:index', (i) => S.Collections.setActive(i));
      $('#wPrev').addEventListener('click', () => S.Wheel.prev());
      $('#wNext').addEventListener('click', () => S.Wheel.next());

      gsap.fromTo('.wheel-spin', { rotate: -60, scale: 0.8, opacity: 0, filter: 'blur(20px)' }, {
        rotate: 0, scale: 1, opacity: 1, filter: 'blur(0px)', duration: 2.4, ease: 'expo.out',
        scrollTrigger: { trigger: '#phases', start: 'top 65%', once: true },
      });
      // the outlined title drifts sideways as you pass
      gsap.fromTo('.wheel-bigtitle', { xPercent: 8 }, {
        xPercent: -8, ease: 'none',
        scrollTrigger: { trigger: '#phases', start: 'top bottom', end: 'bottom top', scrub: true },
      });
    },
  };

  /* ======================================================================
     Horizontal lunar cycle
     ====================================================================== */
  Sections.cycle = {
    init() {
      const section = $('#cycle');
      const track = $('.cycle-track', section);
      const bar = $('.cycle-progress span', section);

      S.data.collections.forEach((c) => {
        const el = document.createElement('article');
        el.className = 'cycle-panel';
        el.dataset.cursor = 'Select';
        el.innerHTML = `
          <div class="cp-media"><img src="${S.data.img(c.photos[0], 900)}" alt="${c.name}" loading="lazy"></div>
          <div class="cp-head"><span class="cp-num">${c.num}</span><canvas class="cp-moon"></canvas></div>
          <div class="cp-foot">
            <p class="cp-moon-name">${c.moon}</p>
            <h3 class="cp-name">${c.name}</h3>
            <p class="cp-illum">${Math.round(illumination(c.phase) * 100)}% illuminated</p>
          </div>`;
        el.addEventListener('click', () => {
          S.Wheel.goTo(c.index);
          S.lenis ? S.lenis.scrollTo('#phases', { duration: 2 }) : $('#phases').scrollIntoView();
        });
        track.appendChild(el);
        const cv = $('.cp-moon', el);
        S.Moon.setupCanvas(cv, 44, 1);
        S.Moon.draw(cv, c.phase, { pad: 0.1, halo: 0.6, soft: 0.05, earthshine: 0.1 });
      });
      const outro = document.createElement('div');
      outro.className = 'cycle-outro';
      outro.innerHTML = '<p class="font-display italic">and the cycle</p><p class="font-display">begins again.</p>';
      track.appendChild(outro);

      const distance = () => track.scrollWidth - innerWidth;
      const tween = gsap.to(track, {
        x: () => -distance(), ease: 'none',
        scrollTrigger: {
          trigger: section, start: 'top top', end: () => `+=${distance()}`,
          pin: true, scrub: 1, invalidateOnRefresh: true, anticipatePin: 1,
          onUpdate: (self) => { bar.style.transform = `scaleX(${self.progress})`; },
        },
      });

      $$('.cycle-panel', track).forEach((panel) => {
        gsap.fromTo($('img', panel), { xPercent: -10, scale: 1.25 }, {
          xPercent: 10, ease: 'none',
          scrollTrigger: { trigger: panel, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true },
        });
        gsap.fromTo(panel, { opacity: 0.25, rotateY: -18, z: -120 }, {
          opacity: 1, rotateY: 0, z: 0, ease: 'power2.out',
          scrollTrigger: { trigger: panel, containerAnimation: tween, start: 'left 105%', end: 'left 55%', scrub: true },
        });
      });
    },
  };

  /* ======================================================================
     Sticky storytelling — the moon waxes as the story is told
     ====================================================================== */
  Sections.story = {
    init() {
      const canvas = $('#storyMoon');
      const counter = $('.story-counter');
      const illum = $('.story-illum');
      const steps = $$('.story-step');
      const moon = { p: 0.015 };
      const draw = () => {
        S.Moon.draw(canvas, moon.p, { pad: 0.14, halo: 1.3, soft: 0.03, earthshine: 0.05 });
        illum.textContent = `${String(Math.round(illumination(moon.p) * 100)).padStart(2, '0')}% illuminated`;
      };
      const size = () => {
        S.Moon.setupCanvas(canvas, Math.round(innerWidth < 768 ? innerWidth * 0.95 : Math.min(innerHeight * 0.72, innerWidth * 0.42)), 1);
        draw();
      };
      size();
      addEventListener('resize', S.util.debounce(size, 200));

      gsap.to(moon, {
        p: 0.5, ease: 'none', onUpdate: draw,
        scrollTrigger: { trigger: '#story', start: 'top top', end: 'bottom bottom', scrub: 1.2 },
      });
      gsap.fromTo('.story-visual', { rotate: -20 }, {
        rotate: 10, ease: 'none',
        scrollTrigger: { trigger: '#story', start: 'top top', end: 'bottom bottom', scrub: true },
      });

      steps.forEach((step, i) => {
        ScrollTrigger.create({
          trigger: step, start: 'top 55%', end: 'bottom 55%',
          onToggle: (self) => {
            step.classList.toggle('is-active', self.isActive);
            if (self.isActive) S.Anim.swapText(counter, String(i + 1).padStart(2, '0'));
          },
        });
      });
    },
  };

  /* ======================================================================
     Product cards — re-choreographed on every collection change
     ====================================================================== */
  Sections.products = {
    init() {
      this.grid = $('#productGrid');
      this.revealed = false;
      S.bus.on('collection:change', ({ c }) => this.render(c));
      ScrollTrigger.create({
        trigger: this.grid, start: 'top 80%', once: true,
        onEnter: () => { this.revealed = true; this.animateIn(); },
      });
      this.grid.addEventListener('click', (e) => {
        const add = e.target.closest('.pc-add');
        if (!add) return;
        e.preventDefault();
        S.Sections.nav.addToBag(add);
      });
    },

    card(pc, c) {
      return `
        <article class="product-card">
          <div class="pc-inner" data-cursor="View">
            <div class="pc-media">
              <img src="${S.data.img(pc.photo, 800)}" alt="${pc.name}" loading="lazy">
              <div class="pc-light"></div>
              <span class="pc-badge"><canvas></canvas>${c.num} · ${c.moon}</span>
            </div>
            <div class="pc-meta">
              <div>
                <h3 class="pc-name">${pc.name}</h3>
                <p class="pc-material">${pc.material}</p>
              </div>
              <span class="pc-price">€${pc.price.toLocaleString('en-US')}</span>
            </div>
            <button class="pc-add" type="button" data-magnetic="0.25"><span data-magnetic-inner>Add to bag</span><i>+</i></button>
          </div>
        </article>`;
    },

    fill(c) {
      this.grid.innerHTML = c.pieces.map((pc) => this.card(pc, c)).join('');
      $$('.product-card', this.grid).forEach((card) => {
        S.Anim.tilt($('.pc-inner', card), { max: 7 });
        S.Anim.magnetic($('.pc-add', card), 0.25);
        const cv = $('.pc-badge canvas', card);
        S.Moon.setupCanvas(cv, 14, 1.5);
        S.Moon.draw(cv, c.phase, { pad: 0.04, halo: 0, soft: 0.06, earthshine: 0.12 });
      });
    },

    animateIn() {
      gsap.fromTo($$('.product-card', this.grid),
        { y: 140, opacity: 0, rotateX: -32, filter: 'blur(16px)', transformOrigin: '50% 100%' },
        { y: 0, opacity: 1, rotateX: 0, filter: 'blur(0px)', duration: 1.5, stagger: 0.09, ease: 'expo.out', clearProps: 'filter' });
    },

    render(c) {
      const old = $$('.product-card', this.grid);
      if (!this.revealed || !old.length) {
        this.fill(c);
        if (!this.revealed) gsap.set($$('.product-card', this.grid), { opacity: 0 });
        return;
      }
      gsap.to(old, {
        y: -50, opacity: 0, rotateX: 18, filter: 'blur(12px)', duration: 0.55, stagger: 0.05, ease: 'power2.in',
        overwrite: true,
        onComplete: () => { this.fill(c); this.animateIn(); },
      });
    },
  };

  /* ======================================================================
     Gallery
     ====================================================================== */
  Sections.gallery = {
    init() {
      const grid = $('#galleryGrid');
      grid.innerHTML = S.data.gallery.map((g, i) => `
        <figure class="g-item g-${i + 1}" data-cursor="Look">
          <div class="g-mask" data-reveal><img src="${S.data.img(g.photo, 1100)}" alt="${g.cap}" loading="lazy"></div>
          <figcaption><span>${String(i + 1).padStart(2, '0')}</span>${g.cap}</figcaption>
        </figure>`).join('');
      $$('.g-item', grid).forEach((fig, i) => {
        S.Anim.imageReveal($('.g-mask', fig));
        if (innerWidth > 768) {
          gsap.fromTo(fig, { y: S.data.gallery[i].speed * 120 }, {
            y: -S.data.gallery[i].speed * 120, ease: 'none',
            scrollTrigger: { trigger: fig, start: 'top bottom', end: 'bottom top', scrub: true },
          });
        }
      });
    },
  };

  /* ======================================================================
     Fullscreen lookbook — each look rises through a lunar aperture
     ====================================================================== */
  Sections.lookbook = {
    init() {
      const section = $('#lookbook');
      const stage = $('.lb-stage', section);
      const looks = S.data.lookbook;
      stage.innerHTML = looks.map((l, i) => `
        <div class="lb-slide" style="z-index:${i + 1}">
          <img src="${S.data.img(l.photo, 2000)}" alt="${l.title}" ${i ? 'loading="lazy"' : ''}>
          <div class="lb-shade"></div>
        </div>`).join('');
      const slides = $$('.lb-slide', stage);
      const title = $('.lb-title', section);
      const sub = $('.lb-sub', section);
      const count = $('.lb-count', section);
      const moonCv = $('.lb-moon', section);
      S.Moon.setupCanvas(moonCv, 64, 1.5);
      const lbMoon = { p: 0.02 };
      const drawMoon = () => S.Moon.draw(moonCv, lbMoon.p, { pad: 0.1, halo: 0.8, soft: 0.04 });
      drawMoon();
      title.textContent = looks[0].title; title.dataset.text = looks[0].title;
      sub.textContent = looks[0].sub; sub.dataset.text = looks[0].sub;

      let active = 0;
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section, start: 'top top', end: () => `+=${(looks.length - 1) * innerHeight * 1.1}`,
          pin: true, scrub: 1,
          onUpdate: (self) => {
            lbMoon.p = 0.02 + self.progress * 0.48;
            drawMoon();
            const i = clamp(Math.round(self.progress * (looks.length - 1)), 0, looks.length - 1);
            if (i !== active) {
              active = i;
              S.Anim.swapText(title, looks[i].title);
              S.Anim.swapText(sub, looks[i].sub);
              count.textContent = `0${i + 1}`;
            }
          },
        },
      });
      slides.forEach((slide, i) => {
        const img = $('img', slide);
        if (i === 0) return;
        tl.fromTo(slide, { clipPath: 'circle(0% at 50% 55%)' }, { clipPath: 'circle(80% at 50% 55%)', ease: 'power2.inOut', duration: 1 }, i - 1)
          .fromTo(img, { scale: 1.5, rotate: 4 }, { scale: 1.08, rotate: 0, ease: 'power2.out', duration: 1 }, i - 1)
          .to($('img', slides[i - 1]), { scale: 0.92, filter: `${S.Anim.MONO} brightness(0.3) blur(6px)`, ease: 'power2.inOut', duration: 1 }, i - 1);
      });
      gsap.set($$('img', stage), { filter: `${S.Anim.MONO} brightness(1) blur(0px)` });
      gsap.set($('img', slides[0]), { scale: 1.08 });
    },
  };

  /* ======================================================================
     Marquee — speed and skew respond to scroll velocity
     ====================================================================== */
  Sections.marquee = {
    init() {
      const rows = $$('.marquee-row');
      let visible = false;
      new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe($('#marquee'));
      const state = rows.map((row, i) => {
        const inner = $('.marquee-inner', row);
        inner.innerHTML += inner.innerHTML; // seamless loop
        return { inner, x: i % 2 ? -inner.scrollWidth / 2 : 0, dir: i % 2 ? 1 : -1, skew: 0 };
      });
      addEventListener('resize', () => state.forEach((s) => { s.x = s.dir > 0 ? -s.inner.scrollWidth / 2 : 0; }));
      gsap.ticker.add((t, deltaMs) => {
        if (!visible) return;
        const dt = Math.min(deltaMs, 50) / 1000;
        const v = S.lenis ? S.lenis.velocity : 0;
        state.forEach((s) => {
          const half = s.inner.scrollWidth / 2;
          s.x += s.dir * (70 + Math.abs(v) * 28) * dt * (v < 0 ? -1 : 1);
          if (s.x <= -half) s.x += half;
          if (s.x > 0) s.x -= half;
          s.skew += (clamp(v * -0.35, -10, 10) - s.skew) * 0.1;
          s.inner.style.transform = `translate3d(${s.x}px,0,0) skewX(${s.skew}deg)`;
        });
      });
    },
  };

  /* ======================================================================
     Navigation — hide on scroll, bag counter, anchor scrolling
     ====================================================================== */
  Sections.nav = {
    init() {
      const nav = $('.site-nav');
      this.count = $('#bagCount');
      this.items = 0;
      let hidden = false;
      if (S.lenis) {
        S.lenis.on('scroll', ({ scroll, direction }) => {
          const hide = direction === 1 && scroll > innerHeight * 0.6;
          if (hide !== hidden) {
            hidden = hide;
            gsap.to(nav, { yPercent: hide ? -110 : 0, duration: 0.9, ease: 'expo.out' });
          }
          nav.classList.toggle('is-scrolled', scroll > 40);
        });
      }
      $$('[data-scroll-to]').forEach((a) => a.addEventListener('click', (e) => {
        e.preventDefault();
        const target = a.dataset.scrollTo;
        S.lenis ? S.lenis.scrollTo(target, { duration: 2, offset: 0 }) : $(target).scrollIntoView({ behavior: 'smooth' });
      }));
    },

    addToBag(btn) {
      this.items += 1;
      const label = $('[data-magnetic-inner]', btn);
      S.Anim.swapText(label, 'Added');
      setTimeout(() => S.Anim.swapText(label, 'Add to bag'), 1800);
      this.count.textContent = this.items;
      gsap.fromTo(this.count, { scale: 1.8, filter: 'blur(4px)' }, { scale: 1, filter: 'blur(0px)', duration: 0.9, ease: 'elastic.out(1, 0.4)' });
    },
  };

  /* ======================================================================
     Footer — tonight's actual moon, a Paris clock, the wordmark
     ====================================================================== */
  Sections.footer = {
    init() {
      const p = S.Moon.phaseOf();
      const cv = $('#todayMoon');
      S.Moon.setupCanvas(cv, 120, 1);
      S.Moon.draw(cv, p, { pad: 0.14, halo: 1, soft: 0.03 });
      const idx = Math.round(p * 16) % 16;
      $('#todayName').textContent = S.data.collections[idx].moon;
      $('#todayIllum').textContent = `${Math.round(illumination(p) * 100)}% illuminated`;

      const clock = $('#clock');
      const tick = () => {
        clock.textContent = new Date().toLocaleTimeString('en-GB', { timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit', second: '2-digit' });
      };
      tick(); setInterval(tick, 1000);

      const word = $('.footer-word');
      const split = new SplitType(word, { types: 'chars' });
      gsap.fromTo(split.chars, { yPercent: 110, opacity: 0 }, {
        yPercent: 0, opacity: 1, duration: 1.6, stagger: 0.06, ease: 'expo.out',
        scrollTrigger: { trigger: word, start: 'top 95%', once: true },
      });

      const form = $('#newsletter');
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = $('input', form);
        if (!input.value || !input.checkValidity()) {
          gsap.fromTo(form, { x: -8 }, { x: 0, duration: 0.6, ease: 'elastic.out(1, 0.3)' });
          return;
        }
        S.Anim.swapText($('.nl-label', form), 'Welcome to the cycle');
        input.value = '';
      });
    },
  };

  S.Sections = Sections;
})();
