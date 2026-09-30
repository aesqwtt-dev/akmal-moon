/* ==========================================================================
   SELENE — Bootstrap
   ========================================================================== */
(() => {
  const S = window.SELENE;
  gsap.registerPlugin(ScrollTrigger);

  /* ---------- smooth scroll (Lenis driven by the GSAP ticker) ---------- */
  function initScroll() {
    if (S.env.reduced || typeof Lenis === 'undefined') return;
    const lenis = new Lenis({
      duration: 1.25,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 0.95,
    });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
    S.lenis = lenis;
  }

  /* ---------- a fallback for any photograph that fails to load ---------- */
  function imageFallback() {
    let fallback;
    document.addEventListener('error', (e) => {
      const img = e.target;
      if (!(img instanceof HTMLImageElement) || img.dataset.fallback) return;
      img.dataset.fallback = '1';
      fallback = fallback || S.Moon.toDataURL(0.32, 480, { pad: 0.3, halo: 1 });
      img.src = fallback;
      img.style.objectFit = 'contain';
      img.style.background = '#0b0b0d';
    }, true);
  }

  /* ---------- preloader: the moon completes a full cycle ---------- */
  function preload() {
    return new Promise((resolve) => {
      const el = document.querySelector('.preloader');
      const cv = el.querySelector('canvas');
      const num = el.querySelector('.pl-num');
      const name = el.querySelector('.pl-phase');
      S.Moon.setupCanvas(cv, 120, 1);
      const prog = { v: 0 };
      let loaded = false;
      addEventListener('load', () => { loaded = true; });
      if (document.readyState === 'complete') loaded = true;

      const render = () => {
        const p = prog.v / 100;
        S.Moon.draw(cv, p * 0.999, { pad: 0.12, halo: 1, soft: 0.04 });
        num.textContent = String(Math.round(prog.v)).padStart(3, '0');
        name.textContent = S.data.collections[Math.round(p * 15)].moon;
      };

      gsap.fromTo('.pl-word .char-in', { yPercent: 110 }, { yPercent: 0, duration: 1.2, stagger: 0.06, ease: 'expo.out' });
      const tl = gsap.timeline();
      tl.to(prog, { v: 72, duration: 1.8, ease: 'power2.inOut', onUpdate: render })
        .add(function waitForLoad() {
          if (loaded) return;
          tl.pause();
          const resume = () => tl.resume();
          addEventListener('load', resume, { once: true });
          setTimeout(resume, 3500); // never hold visitors hostage
        })
        .to(prog, { v: 100, duration: 0.9, ease: 'power3.out', onUpdate: render })
        .to('.pl-inner', { opacity: 0, y: -30, filter: 'blur(12px)', duration: 0.8, ease: 'power2.in' }, '+=0.15')
        .to(el, { clipPath: 'inset(0% 0% 100% 0%)', duration: 1.3, ease: 'expo.inOut' }, '-=0.2')
        .add(() => { el.remove(); resolve(); }, '-=0.65');
    });
  }

  /* ---------- boot ---------- */
  function boot() {
    S.Moon.init();
    imageFallback();
    initScroll();

    const list = S.data.collections;
    // Open on tonight's real moon.
    const start = Math.round(S.Moon.phaseOf() * list.length) % list.length;

    S.Collections.init(list, document.getElementById('heroMoon'));
    S.Particles.init(document.getElementById('particles'));
    S.Cursor.init();

    const Sx = S.Sections;
    Sx.hero.init();
    Sx.products.init();
    Sx.phases.init(start);           // wheel opens on tonight's phase
    S.Collections.setActive(start, { immediate: true });
    Sx.cycle.init();
    Sx.story.init();
    Sx.gallery.init();
    Sx.lookbook.init();
    Sx.marquee.init();
    Sx.nav.init();
    Sx.footer.init();
    Sx.reveals.init();

    gsap.set('.hero-word', { yPercent: 120 });
    gsap.set('.hero-fade, .site-nav', { opacity: 0 });
    gsap.set('.hero-moon-inner', { opacity: 0 });

    preload().then(() => {
      if (S.lenis) S.lenis.start();
      Sx.hero.intro();
      ScrollTrigger.refresh();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
