/* ==========================================================================
   SELENE — Data
   Sixteen phases of the moon, sixteen wardrobes.
   ========================================================================== */
(() => {
  const S = (window.SELENE = window.SELENE || {});

  // Curated photography (Unsplash). Every image is rendered in monochrome.
  const PHOTO = {
    gravity:      'local:images/gravity.jpg',
    streetwear:   'local:images/streetwear.jpg',
    suitButton:   '1507679799987-c73779587ccf',
    knitPortrait: '1506794778202-cad84cf45f1d',
    suitNight:    '1519085360753-af0119f7cbe7',
    whiteTee:     '1521572163474-6864f9cf17ab',
    leather:      '1551028719-00167b16eac5',
    bomber:       '1591047139829-d91aecb6caea',
    denim:        '1542272604-787c3835535d',
    hoodie:       '1556821840-3a63f95609a7',
    streetDenim:  '1516826957135-700dedea698c',
    camelBlazer:  '1552374196-1ab2a1c593e8',
    circleWall:   '1488161628813-04466f872be2',
    graphicTee:   '1503341504253-dff4815485f1',
    checkSuit:    '1594938298603-c8148c4dae35',
    flatlay:      '1593030761757-71fae45fa0e7',
    navySuit:     '1617137968427-85924c800a22',
    vneck:        '1480455624313-e29b44bbfde1',
    capPortrait:  '1531891437562-4301cf35b7e4',
    waistcoat:    '1504593811423-6dd665756598',
    beardProfile: '1522075469751-3a6694fb2f61',
    leatherStreet:'1520975954732-35dd22299614',
    blackSuit:    '1617127365659-c47fa864d8bc',
    rack:         '1512436991641-6745cdb1723f',
    streetArt:    '1523398002811-999ca8dec234',
    tweed:        '1505022610485-0249ba5b3675',
    parka:        '1548883354-94bcfe321cbb',
    denimJacket:  '1611312449408-fcece27cdbb7',
    blackTeeMan:  '1622519407650-3df9883f76a5',
    greyTee:      '1564584217132-2271feaeb3c5',
    blackWalk:    '1618886614638-80e3c103d31a',
    shirts:       '1602810318383-e386cc2a3ccf',
    blueShirt:    '1620012253295-c15cc3e65df4',
    printShirt:   '1596755094514-f87e34085b2c',
    blackTee:     '1583743814966-8936f5b7be1a',
    shoes:        '1614252235316-8c857d38b5f4',
  };

  const img = (key, w = 1400) =>
    PHOTO[key].startsWith('local:')
      ? PHOTO[key].slice(6)
      : `https://images.unsplash.com/photo-${PHOTO[key]}?auto=format&fit=crop&w=${w}&q=78`;

  const ROMAN = ['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII','XIII','XIV','XV','XVI'];

  // p(name, material, price, photo)
  const p = (name, material, price, photo) => ({ name, material, price, photo });

  const RAW = [
    {
      moon: 'New Moon', name: 'Minimal Essentials', short: 'Essentials',
      line: ['Nothing', 'but form'],
      copy: 'Born in total darkness. Pieces reduced to their silhouette — heavy cotton, clean seams, no ornament. The quiet foundation of every wardrobe.',
      cta: 'Enter the Dark', fabric: 'Organic heavyweight cotton', silhouette: 'Relaxed, dropped shoulder', palette: 'Void black · Chalk',
      photos: ['blackTeeMan', 'whiteTee', 'greyTee'],
      pieces: [p('Eclipse Tee', 'Heavy jersey · 280 gsm', 140, 'whiteTee'), p('Umbra Tee', 'Garment-dyed cotton', 140, 'blackTee'), p('Regolith Tee', 'Slub cotton', 125, 'greyTee'), p('Nocturne Oxford', 'Brushed oxford', 260, 'shirts')],
    },
    {
      moon: 'Young Moon', name: 'Knitwear', short: 'Knit',
      line: ['Warmth', 'in the cold'],
      copy: 'The first hair of light. Chunky shawl collars, fine merino and cashmere spun for nights that refuse to end.',
      cta: 'Feel the Knit', fabric: 'Cashmere · Merino wool', silhouette: 'Close to the body', palette: 'Smoke · Graphite',
      photos: ['knitPortrait', 'vneck', 'beardProfile'],
      pieces: [p('Shawl Collar Cardigan', 'Lambswool cable', 520, 'knitPortrait'), p('Merino V-Neck', 'Extra-fine merino', 290, 'vneck'), p('Cashmere Crew', 'Mongolian cashmere', 640, 'greyTee'), p('Ribbed Watch Cap', 'Cashmere rib', 160, 'capPortrait')],
    },
    {
      moon: 'Waxing Crescent', name: 'Streetwear', short: 'Street',
      line: ['Concrete', 'moonlight'],
      copy: 'A sliver of light on wet pavement. Oversized graphics, heavy fleece and technical layers built for the city after midnight.',
      cta: 'Hit the Street', fabric: 'Loopback fleece · Nylon', silhouette: 'Oversized, boxy', palette: 'Asphalt · Signal white',
      photos: ['streetwear', 'graphicTee', 'hoodie'],
      pieces: [p('Crater Hoodie', 'Loopback fleece · 500 gsm', 280, 'hoodie'), p('Orbit Graphic Tee', 'Screen-printed cotton', 120, 'graphicTee'), p('Signal Tee', 'Compact jersey', 110, 'blackTee'), p('Tide Bomber', 'Washed nylon', 480, 'bomber')],
    },
    {
      moon: 'Evening Crescent', name: 'Denim', short: 'Denim',
      line: ['Indigo', 'after dusk'],
      copy: 'Denim woven in Okayama and washed by hand until it holds the colour of the sky twenty minutes after sunset.',
      cta: 'Discover Denim', fabric: '14 oz selvedge denim', silhouette: 'Straight, slightly tapered', palette: 'Raw indigo · Stone',
      photos: ['streetDenim', 'denim', 'denimJacket'],
      pieces: [p('Type III Trucker', 'Selvedge, corduroy collar', 420, 'denimJacket'), p('Tide Straight Jean', '14 oz selvedge', 310, 'denim'), p('Faded Loose Jean', 'Hand-washed denim', 290, 'streetDenim'), p('Chambray Dot Shirt', 'Printed chambray', 210, 'printShirt')],
    },
    {
      moon: 'First Quarter', name: 'Casual', short: 'Casual',
      line: ['Half light,', 'full ease'],
      copy: 'Balance between dark and light. Easy layers, soft bombers and printed shirts for days that drift into night without asking.',
      cta: 'Wear it Easy', fabric: 'Washed cotton · Nylon', silhouette: 'Easy, unstructured', palette: 'Dust · Graphite',
      photos: ['circleWall', 'bomber', 'capPortrait'],
      pieces: [p('Half Moon Bomber', 'Washed nylon twill', 460, 'bomber'), p('Quarter Print Shirt', 'Cotton poplin', 220, 'printShirt'), p('Everyday Tee', 'Slub jersey', 110, 'greyTee'), p('Derby Luna', 'Calf leather', 540, 'shoes')],
    },
    {
      moon: 'Half-Light', name: 'Outerwear', short: 'Outer',
      line: ['Shelter', 'from the tide'],
      copy: 'Coats and parkas cut for weather that changes with the moon. Waxed cotton, horsehide and storm flaps sealed by hand.',
      cta: 'Brave the Weather', fabric: 'Waxed cotton · Horsehide', silhouette: 'Structured, layered', palette: 'Moss · Obsidian',
      photos: ['parka', 'leather', 'tweed'],
      pieces: [p('Storm Parka', 'Waxed cotton', 890, 'parka'), p('Rider Jacket', 'Italian horsehide', 1680, 'leather'), p('Nightfall Bomber', 'Technical nylon', 520, 'bomber'), p('Selvedge Trucker', '14 oz denim', 420, 'denimJacket')],
    },
    {
      moon: 'Waxing Gibbous', name: 'Smart Casual', short: 'Smart',
      line: ['Almost', 'formal'],
      copy: 'The moon swells toward fullness. Unstructured blazers, crisp poplin and polished leather — the space between the office and the evening.',
      cta: 'Dress it Up', fabric: 'Linen-wool · Poplin', silhouette: 'Soft-shouldered', palette: 'Camel · Pale silver',
      photos: ['camelBlazer', 'blueShirt', 'flatlay'],
      pieces: [p('Soft Blazer', 'Linen-wool hopsack', 890, 'flatlay'), p('Poplin Shirt', 'Two-ply poplin', 240, 'blueShirt'), p('Tonal Shirt Set', 'Brushed cotton', 380, 'shirts'), p('Luna Brogue', 'Burnished calf', 560, 'shoes')],
    },
    {
      moon: 'Gibbous Rising', name: 'Tailoring', short: 'Tailoring',
      line: ['Cut by', 'lunar hand'],
      copy: 'Forty-two hours per suit. Canvassed chests, pick-stitched lapels and cloth from the oldest mills in Biella, finished under a single lamp.',
      cta: 'Book a Fitting', fabric: 'Super 130s wool', silhouette: 'Full canvas, roped shoulder', palette: 'Midnight · Slate',
      photos: ['checkSuit', 'suitButton', 'navySuit'],
      pieces: [p('Three-Piece Check', 'Super 130s wool', 2400, 'checkSuit'), p('Midnight Two-Piece', 'Wool mohair', 2100, 'navySuit'), p('Chalk Stripe Jacket', 'Flannel', 1450, 'suitButton'), p('Watch Waistcoat', 'Wool barathea', 420, 'waistcoat')],
    },
    {
      moon: 'Full Moon', name: 'Luxury Collection', short: 'Luxury',
      line: ['The night', 'at its brightest'],
      copy: 'Total illumination. Our most precious cloths — silk, vicuña blends, hand-lasted leather — reserved for the one night each month the sky is entirely lit.',
      cta: 'Enter the Light', fabric: 'Silk · Vicuña blend', silhouette: 'Sculpted, precise', palette: 'Moon white · Onyx',
      photos: ['blackSuit', 'suitNight', 'beardProfile'],
      pieces: [p('Onyx Dinner Suit', 'Wool-silk barathea', 3800, 'blackSuit'), p('Selene Evening Jacket', 'Silk shawl lapel', 2600, 'suitNight'), p('Opera Oxford', 'Patent calf', 980, 'shoes'), p('Heirloom Rider', 'Vegetable-tanned leather', 2900, 'leather')],
    },
    {
      moon: 'Disseminating', name: 'Evening', short: 'Evening',
      line: ['After', 'the gala'],
      copy: 'Light spills outward. Dark tailoring loosened at the collar, made to be worn from the last toast to the first train home.',
      cta: 'Stay Out Late', fabric: 'Wool twill · Silk', silhouette: 'Slim, elongated', palette: 'Ink · Candle',
      photos: ['suitNight', 'blackWalk', 'blackSuit'],
      pieces: [p('After Hours Blazer', 'Wool twill', 1350, 'blackSuit'), p('Night Walk Suit', 'Tropical wool', 1980, 'blackWalk'), p('Midnight Suit', 'Wool mohair', 2100, 'suitNight'), p('Candle Oxford', 'Polished calf', 620, 'shoes')],
    },
    {
      moon: 'Waning Gibbous', name: 'Classic', short: 'Classic',
      line: ['Timeless', 'as tides'],
      copy: 'What remains after the brilliance. Waistcoats, tweeds and heritage patterns that have outlived every trend — and will outlive the next.',
      cta: 'Explore Classics', fabric: 'Harris tweed · Flannel', silhouette: 'Traditional, natural', palette: 'Pewter · Oat',
      photos: ['waistcoat', 'tweed', 'suitButton'],
      pieces: [p('Heritage Waistcoat', 'Wool flannel', 390, 'waistcoat'), p('Tweed Hunting Jacket', 'Harris tweed', 1250, 'tweed'), p('Classic Two-Button', 'Worsted wool', 1650, 'suitButton'), p('Wingtip Brogue', 'Burnished calf', 560, 'shoes')],
    },
    {
      moon: 'Falling Gibbous', name: 'Travel', short: 'Travel',
      line: ['Pack', 'the orbit'],
      copy: 'Crease-resistant wools and packable layers engineered for long-haul nights — from terminal to hotel bar without a second thought.',
      cta: 'Start the Journey', fabric: 'Travel wool · Ripstop', silhouette: 'Articulated, relaxed', palette: 'Fog · Olive black',
      photos: ['tweed', 'parka', 'rack'],
      pieces: [p('Voyager Jacket', 'Travel tweed', 980, 'tweed'), p('Packable Parka', 'Ripstop nylon', 720, 'parka'), p('Transit Tee', 'Merino jersey', 150, 'blackTee'), p('Nomad Shirt', 'Non-iron poplin', 230, 'shirts')],
    },
    {
      moon: 'Last Quarter', name: 'Sport', short: 'Sport',
      line: ['Run', 'toward dawn'],
      copy: 'Half-light returns. Technical fleece, breathable jersey and silhouettes built for movement in the cold hour before sunrise.',
      cta: 'Move with Us', fabric: 'Technical fleece · Mesh', silhouette: 'Athletic, articulated', palette: 'Frost grey · Carbon',
      photos: ['hoodie', 'greyTee', 'blackTeeMan'],
      pieces: [p('Dawn Hoodie', 'Technical fleece', 260, 'hoodie'), p('Tempo Tee', 'Quick-dry jersey', 95, 'greyTee'), p('Carbon Tee', 'Merino blend', 120, 'blackTee'), p('Stride Bomber', 'Stretch nylon', 440, 'bomber')],
    },
    {
      moon: 'Morning Crescent', name: 'Loungewear', short: 'Lounge',
      line: ['Soft', 'hours'],
      copy: 'The moon fades into morning. Brushed jersey and open-knit layers for the slow, quiet hours when the city is still asleep.',
      cta: 'Slow Down', fabric: 'Brushed jersey · Merino', silhouette: 'Fluid, loose', palette: 'Milk · Ash',
      photos: ['vneck', 'greyTee', 'knitPortrait'],
      pieces: [p('Morning V-Neck', 'Modal jersey', 130, 'vneck'), p('Lounge Tee', 'Brushed cotton', 110, 'greyTee'), p('Hearth Cardigan', 'Merino cable', 480, 'knitPortrait'), p('House Shirt', 'Flannel', 210, 'shirts')],
    },
    {
      moon: 'Waning Crescent', name: 'Limited Collection', short: 'Limited',
      line: ['Before', 'it vanishes'],
      copy: 'A last thin arc of light. Numbered pieces produced in runs of forty-nine — never restocked, never repeated. When it is gone, it is gone.',
      cta: 'Claim a Number', fabric: 'Hand-dyed horsehide', silhouette: 'Sculpted, singular', palette: 'Oil black · Silver',
      photos: ['leatherStreet', 'leather', 'blackWalk'],
      pieces: [p('No. 07 Rider', 'Hand-dyed horsehide', 2400, 'leather'), p('No. 21 Street Jacket', 'Waxed calf', 1900, 'leatherStreet'), p('No. 33 Suit', 'Wool-silk', 2600, 'blackWalk'), p('No. 49 Tee', 'Numbered cotton', 180, 'blackTee')],
    },
    {
      moon: 'Balsamic Moon', name: 'Archive', short: 'Archive',
      line: ['Memory', 'of light'],
      copy: 'The final breath before the cycle restarts. Re-issued pieces from our archive, reworked with the knowledge of every moon since.',
      cta: 'Open the Archive', fabric: 'Archive cloths', silhouette: 'Revisited', palette: 'Bone · Carbon',
      photos: ['beardProfile', 'rack', 'circleWall'],
      pieces: [p('Archive Blazer 2019', 'Re-cut wool', 980, 'flatlay'), p('Archive Knit 2021', 'Recycled cashmere', 460, 'knitPortrait'), p('Archive Trucker', 'Re-dyed denim', 380, 'denimJacket'), p('Archive Oxford', 'Brushed oxford', 240, 'shirts')],
    },
  ];

  S.data = {
    img,
    ROMAN,
    collections: RAW.map((c, i) => ({
      ...c,
      index: i,
      num: ROMAN[i],
      phase: i / RAW.length, // 0 new → 0.5 full → 1 new
    })),
    lookbook: [
      { photo: 'beardProfile', title: 'Silence', sub: 'Chapter I — The dark side' },
      { photo: 'gravity', title: 'Gravity', sub: 'Chapter II — Pull of the tide' },
      { photo: 'circleWall', title: 'Orbit', sub: 'Chapter III — A perfect circle' },
      { photo: 'leatherStreet', title: 'Eclipse', sub: 'Chapter IV — Shadow over light' },
      { photo: 'checkSuit', title: 'Fullness', sub: 'Chapter V — Total illumination' },
    ],
    gallery: [
      { photo: 'suitButton', cap: 'Atelier, 02:14', speed: 0.6 },
      { photo: 'knitPortrait', cap: 'Portrait in wool', speed: -0.4 },
      { photo: 'rack', cap: 'The fitting room', speed: 0.3 },
      { photo: 'navySuit', cap: 'Midnight cloth', speed: -0.6 },
      { photo: 'shoes', cap: 'Hand-lasted', speed: 0.5 },
      { photo: 'tweed', cap: 'Harris, Outer Hebrides', speed: -0.3 },
      { photo: 'streetArt', cap: 'City after dark', speed: 0.4 },
    ],
  };
})();
