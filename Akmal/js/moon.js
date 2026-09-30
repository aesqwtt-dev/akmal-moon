/* ==========================================================================
   SELENE — Procedural moon renderer
   A lunar surface is generated once (value-noise maria + foreshortened
   craters + ray systems), then any phase is lit with a soft terminator
   and faint earthshine on the dark side.
   ========================================================================== */
(() => {
  const S = (window.SELENE = window.SELENE || {});

  /* ---------- value noise ---------- */
  const PERM = new Uint8Array(512);
  (() => {
    let seed = 1337;
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const p = [...Array(256).keys()];
    for (let i = 255; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; }
    for (let i = 0; i < 512; i++) PERM[i] = p[i & 255];
  })();
  const hash = (x, y) => PERM[(PERM[x & 255] + y) & 511] / 255;
  const fade = (t) => t * t * (3 - 2 * t);
  function noise(x, y) {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = x - xi, yf = y - yi;
    const u = fade(xf), v = fade(yf);
    const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  function fbm(x, y, oct = 5) {
    let s = 0, amp = 0.5, f = 1;
    for (let i = 0; i < oct; i++) { s += amp * noise(x * f, y * f); f *= 2.03; amp *= 0.5; }
    return s;
  }
  const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

  /* ---------- surface texture (generated once) ---------- */
  let texture = null;

  function buildTexture(size = 900) {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d');
    const img = ctx.createImageData(size, size);
    const d = img.data;
    const half = size / 2;

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const nx = (x - half) / half, ny = (y - half) / half;
        const r2 = nx * nx + ny * ny;
        const i = (y * size + x) * 4;
        if (r2 > 1) { d[i + 3] = 0; continue; }
        const z = Math.sqrt(1 - r2);
        // project onto the sphere so features compress toward the limb
        const k = 1 / (z + 0.6);
        const u = nx * k * 1.3 + 7.3, v = ny * k * 1.3 + 3.1;
        // domain-warped maria: large, soft, irregular seas
        const wx = fbm(u * 0.9 + 11, v * 0.9, 3) * 1.4;
        const wy = fbm(u * 0.9, v * 0.9 + 5, 3) * 1.4;
        const seas = fbm(u * 1.1 + wx, v * 1.1 + wy, 5);
        const maria = smooth(0.44, 0.58, seas);
        const highland = fbm(u * 6, v * 6, 4) - 0.5;   // rugged highlands
        const fine = fbm(u * 22, v * 22, 3) - 0.5;      // regolith
        let val = 0.82 - maria * 0.42 + highland * (0.13 - maria * 0.08) + fine * 0.05;
        val *= 0.55 + 0.45 * Math.pow(z, 0.35);         // limb darkening
        const g = Math.max(0, Math.min(255, val * 228));
        // seas carry a faint cool cast, highlands a faint warm one
        d[i] = g * (1.0 - maria * 0.03);
        d[i + 1] = g * (0.995 - maria * 0.01);
        d[i + 2] = g * (0.97 + maria * 0.03);
        d[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);

    // Craters: soft bowls, lit far wall, faint ejecta. Light from the upper left.
    ctx.save();
    ctx.beginPath(); ctx.arc(half, half, half, 0, Math.PI * 2); ctx.clip();
    let seed = 42;
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const LX = -0.62, LY = -0.62;
    const drawCrater = (cx, cy, r, depth) => {
      const nx = (cx - half) / half, ny = (cy - half) / half;
      const dist = Math.hypot(nx, ny);
      if (dist > 0.96) return;
      const z = Math.sqrt(1 - dist * dist);
      const sx = Math.max(0.22, z);
      const ang = Math.atan2(ny, nx);
      // light direction expressed in the crater's local (rotated, squashed) frame
      const lx = (LX * Math.cos(-ang) - LY * Math.sin(-ang)) / sx;
      const ly = LX * Math.sin(-ang) + LY * Math.cos(-ang);
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(ang);
      ctx.scale(sx, 1);
      // ejecta blanket
      let g = ctx.createRadialGradient(0, 0, r * 0.9, 0, 0, r * 1.9);
      g.addColorStop(0, `rgba(255,255,250,${0.05 * depth})`);
      g.addColorStop(1, 'rgba(255,255,250,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(0, 0, r * 1.9, 0, Math.PI * 2); ctx.fill();
      // shadowed bowl, deepest on the side facing the light
      g = ctx.createRadialGradient(lx * r * 0.35, ly * r * 0.35, 0, 0, 0, r);
      g.addColorStop(0, `rgba(10,10,14,${0.2 * depth})`);
      g.addColorStop(0.8, `rgba(10,10,14,${0.07 * depth})`);
      g.addColorStop(1, 'rgba(10,10,14,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
      // sunlit far wall
      g = ctx.createRadialGradient(-lx * r * 0.45, -ly * r * 0.45, r * 0.05, -lx * r * 0.3, -ly * r * 0.3, r * 0.75);
      g.addColorStop(0, `rgba(255,255,248,${0.09 * depth})`);
      g.addColorStop(1, 'rgba(255,255,248,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    };
    for (let i = 0; i < 650; i++) {
      const r = Math.pow(rand(), 5) * size * 0.05 + size * 0.0014;
      drawCrater(rand() * size, rand() * size, r, 0.45 + rand() * 0.55);
    }
    // Tycho-like ray system, very faint
    const tx = half * 0.8, ty = half * 1.6;
    ctx.globalCompositeOperation = 'screen';
    for (let i = 0; i < 46; i++) {
      const a = rand() * Math.PI * 2, len = size * (0.1 + rand() * 0.4);
      const ex = tx + Math.cos(a) * len, ey = ty + Math.sin(a) * len;
      const grd = ctx.createLinearGradient(tx, ty, ex, ey);
      grd.addColorStop(0, 'rgba(255,255,255,0.06)');
      grd.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.strokeStyle = grd; ctx.lineWidth = size * (0.002 + rand() * 0.004);
      ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(ex, ey); ctx.stroke();
    }
    const tg = ctx.createRadialGradient(tx, ty, 0, tx, ty, size * 0.022);
    tg.addColorStop(0, 'rgba(255,255,255,0.22)'); tg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = tg; ctx.beginPath(); ctx.arc(tx, ty, size * 0.022, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    return c;
  }

  /* ---------- canvas sizing ---------- */
  function setupCanvas(canvas, cssSize, oversample = 1) {
    const px = Math.round(cssSize * S.env.dpr * oversample);
    if (canvas.width !== px) { canvas.width = canvas.height = px; }
    canvas.style.width = canvas.style.height = `${cssSize}px`;
    return px;
  }

  /* ---------- phase shadow path ---------- */
  function shadowPath(ctx, c, r, phase, bleed = 0) {
    const p = S.util.wrap(phase, 1);
    const k = Math.cos(p * Math.PI * 2); // 1 = new, -1 = full
    ctx.save();
    ctx.translate(c, c);
    if (p > 0.5) ctx.scale(-1, 1); // waning: mirror so the dark limb is on the right
    ctx.beginPath();
    ctx.arc(0, 0, r + bleed, -Math.PI / 2, Math.PI / 2, true); // dark half-disc via the left limb (bleeds past the clip)
    ctx.ellipse(0, 0, Math.abs(k) * r, r, 0, Math.PI / 2, -Math.PI / 2, k > 0);
    ctx.closePath();
    ctx.restore();
  }

  const scratch = document.createElement('canvas');
  const supportsFilter = typeof document.createElement('canvas').getContext('2d').filter === 'string';

  /**
   * Draw a lit moon.
   * @param {HTMLCanvasElement} canvas  already sized via setupCanvas
   * @param {number} phase 0..1 (0 new, .5 full)
   * @param {object} o  { pad: 0..0.4 room for halo, halo: 0..1, earthshine, soft }
   */
  function draw(canvas, phase, o = {}) {
    if (!texture) texture = buildTexture();
    const { pad = 0.12, halo = 1, earthshine = 0.07, soft = 0.035 } = o;
    const ctx = canvas.getContext('2d');
    const size = canvas.width;
    const c = size / 2;
    const r = c * (1 - pad);
    const lit = S.util.illumination(phase);

    ctx.clearRect(0, 0, size, size);

    // atmospheric halo (drawn under the disc)
    if (halo > 0 && pad > 0) {
      const hg = ctx.createRadialGradient(c, c, r * 0.9, c, c, c);
      const a = (0.04 + lit * 0.22) * halo;
      hg.addColorStop(0, `rgba(225,228,236,${a})`);
      hg.addColorStop(0.35, `rgba(200,206,220,${a * 0.35})`);
      hg.addColorStop(1, 'rgba(200,206,220,0)');
      ctx.fillStyle = hg;
      ctx.fillRect(0, 0, size, size);
    }

    // surface
    ctx.save();
    ctx.beginPath(); ctx.arc(c, c, r, 0, Math.PI * 2); ctx.clip();
    ctx.drawImage(texture, c - r, c - r, r * 2, r * 2);

    // phase shadow, softened on a scratch layer
    if (scratch.width !== size) { scratch.width = scratch.height = size; }
    const sctx = scratch.getContext('2d');
    sctx.clearRect(0, 0, size, size);
    const blur = Math.max(1, r * soft);
    if (supportsFilter) sctx.filter = `blur(${blur}px)`;
    shadowPath(sctx, c, r, phase, blur * 3);
    sctx.fillStyle = `rgba(3,3,5,${1 - earthshine})`;
    sctx.fill();
    if (supportsFilter) sctx.filter = 'none';
    ctx.drawImage(scratch, 0, 0);

    // spherical volume: a gentle rim shadow + a bluish cold bounce
    const vg = ctx.createRadialGradient(c - r * 0.25, c - r * 0.25, r * 0.2, c, c, r);
    vg.addColorStop(0, 'rgba(255,255,255,0.04)');
    vg.addColorStop(0.75, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,6,0.45)');
    ctx.fillStyle = vg;
    ctx.fillRect(c - r, c - r, r * 2, r * 2);
    ctx.restore();
  }

  S.Moon = {
    init() { if (!texture) texture = buildTexture(); },
    draw,
    setupCanvas,
    /** A small moon rendered to a data URL (used for image fallbacks / favicons) */
    toDataURL(phase, px = 256, opts = {}) {
      const c = document.createElement('canvas');
      c.width = c.height = px;
      draw(c, phase, opts);
      return c.toDataURL('image/png');
    },
    /** Real astronomical phase for a date (0 new → 0.5 full). */
    phaseOf(date = new Date()) {
      const synodic = 29.530588853;
      const knownNew = Date.UTC(2000, 0, 6, 18, 14);
      const days = (date.getTime() - knownNew) / 86400000;
      return S.util.wrap(days / synodic, 1);
    },
  };
})();
