// The GCV mark in motion, from Gonzalo's "Perspective is everything" study: the rose r = 4 sin(3θ/2) lifted into space
// by z = 4 sin θ (θ from 0 to 4π). Seen from above it is a six-petal rose; from the side, an hourglass or a lantern;
// "a point of view does not represent the totality".
// It rests as the logo; while you hover over it, it opens into the curve seen from above (each of the six stitches opens into the petal it
// sits on: they sit at the same six angles), folds back into the logo, opens into the curve seen from one side, back
// to the logo, then from the other side. The ring is the curve's equator.
// logoRose(canvas): draws into the canvas at its css size; colours follow the page (--ink, --ring, the background).
(function(){
  // the logo, in its 200-unit drawing (about.html), centred on 100,100, y down
  function seg(x1, y1, x2, y2){ return function(u){ return [lerp(x1, x2, u) - 100, lerp(y1, y2, u) - 100, 0]; }; }
  function arc(r, a1, a2){ return function(u){ var a = lerp(a1, a2, u); return [Math.cos(a) * r, Math.sin(a) * r, 0]; }; }
  var STITCHES = [
    seg(120.09, 60.74, 132.29, 48.54),
    seg(143.75, 100, 161, 100),
    seg(120.09, 139.26, 132.29, 151.46),
    seg(67.71, 151.46, 79.91, 139.26),
    arc(58.5, Math.PI - Math.asin(8.55 / 58.5), Math.PI + Math.asin(8.55 / 58.5)),
    seg(67.71, 48.54, 79.91, 60.74)
  ];
  var RING = 70, STITCH_W = 3.8, LINE_W = 1.25, SCALE = 16;   // petal tips at 64, just inside the ring
  var N = 140;                                               // points per petal

  function lerp(a, b, t){ return a + (b - a) * t; }
  function ease(t){ t = Math.max(0, Math.min(1, t)); return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  // the curve, as six petals (between the zeros of r), each running centre, tip, centre
  var petals = [];
  for(var k = 0; k < 6; k++){
    var pts = [];
    for(var i = 0; i <= N; i++){
      var th = (k + i / N) * 2 * Math.PI / 3, r = 4 * Math.sin(1.5 * th);
      pts.push([r * Math.cos(th) * SCALE, -r * Math.sin(th) * SCALE, 4 * Math.sin(th) * SCALE]);
    }
    petals.push(pts);
  }
  // each stitch opens into the petal it sits on: match them by angle (seen from above)
  function ang(p){ return Math.atan2(p[1], p[0]); }
  function near(a, b){ var d = Math.abs(a - b) % (2 * Math.PI); return Math.min(d, 2 * Math.PI - d); }
  var shapes = STITCHES.map(function(f){
    var mid = f(.5), best = 0;
    petals.forEach(function(p, j){ if(near(ang(p[N / 2]), ang(mid)) < near(ang(petals[best][N / 2]), ang(mid))) best = j; });
    // the stitch traced in, then out (inner end at the petal's two ends at the centre, outer end at its tip)
    var a = f(0), b = f(1), flip = Math.hypot(a[0], a[1]) > Math.hypot(b[0], b[1]);
    var st = [];
    for(var i = 0; i <= N; i++){ var s = i / N, u = s < .5 ? s * 2 : (1 - s) * 2; st.push(f(flip ? 1 - u : u)); }
    return {stitch: st, petal: petals[best]};
  });

  // the points of view, as spin about the vertical then tilt towards the viewer (0 = from above, 90 = from the side):
  // the rose from above, the hourglass from one side, the lantern from the other
  var VIEWS = {top: [0, 0], side1: [-90, 90], side2: [0, 90]};
  var D = Math.PI / 180;
  // the sequence, in seconds: the logo opens into one view of the curve, closes back into the logo, then the next view.
  // It only runs while the pointer is over the mark (see hover below); the rests are the pauses between views.
  var TL = [], at = 0;
  ['top', 'side1', 'side2'].forEach(function(v){
    [['rest', 1.2], ['open', 2.4], ['hold', 2.2], ['close', 2.4]].forEach(function(p){ TL.push({kind: p[0], d: p[1], view: v, start: at}); at += p[1]; });
  });
  var CYCLE = at;
  function segAt(t){ t = ((t % CYCLE) + CYCLE) % CYCLE; for(var i = 0; i < TL.length - 1 && t >= TL[i].start + TL[i].d; i++); return TL[i]; }
  function state(t){
    var s = segAt(t), k = ease((((t % CYCLE) + CYCLE) % CYCLE - s.start) / s.d);
    return {open: s.kind === 'open' ? k : s.kind === 'close' ? 1 - k : s.kind === 'hold' ? 1 : 0, view: VIEWS[s.view]};
  }

  window.logoRose = function(cv){
    if(!cv || !cv.getContext) return;
    var g = cv.getContext('2d'), W = 0, H = 0, ink = '#000', ring = '#ccc', paper = '#fff', still = false;
    try{ still = matchMedia('(prefers-reduced-motion: reduce)').matches; }catch(e){}
    function colours(){
      var cs = getComputedStyle(document.documentElement), bg = getComputedStyle(cv.parentNode).backgroundColor;
      ink = cs.getPropertyValue('--ink').trim() || '#000';
      ring = cs.getPropertyValue('--ring').trim() || '#ccc';
      paper = (bg && bg !== 'rgba(0, 0, 0, 0)') ? bg : (cs.getPropertyValue('--paper').trim() || '#fff');
    }
    function size(){
      var dpr = Math.min(2, window.devicePixelRatio || 1), w = Math.round(cv.clientWidth * dpr), h = Math.round(cv.clientHeight * dpr);
      if(cv.width !== w || cv.height !== h){ cv.width = w; cv.height = h; }
      W = w; H = h;
    }

    var tl = 0, last = null, raf = 0, hover = false, running = false;
    function draw(now){
      size();
      // advance only while hovered, or while a view is still out (it then closes back into the logo and stops)
      var dt = last === null ? 0 : Math.min(.1, (now - last) / 1000); last = now;
      var seg = segAt(tl);
      if(!hover && seg.kind === 'hold'){ tl = seg.start + seg.d; seg = segAt(tl); }
      if(!hover && seg.kind === 'open'){ var c = TL[TL.indexOf(seg) + 1]; tl = c.start + (1 - (tl % CYCLE - seg.start) / seg.d) * c.d; seg = c; }
      if(!hover && seg.kind === 'rest'){ tl = seg.start; running = false; }
      else tl += dt;
      var S = state(still ? 0 : tl), u = Math.min(W, H) / 200, cx = W / 2, cy = H / 2;
      var sa = S.view[0] * D, tb = S.view[1] * D, cA = Math.cos(sa), sA = Math.sin(sa), cB = Math.cos(tb), sB = Math.sin(tb);
      function P(p){
        var x = p[0] * cA - p[1] * sA, y = p[0] * sA + p[1] * cA;
        return [x, y * cB - p[2] * sB];
      }
      // the logo never turns: each point slides from where it is in the flat logo to where the view puts it
      var o = ease(S.open);
      function M(a, b){ var q = P(b); return [cx + lerp(a[0], q[0], o) * u, cy + lerp(a[1], q[1], o) * u]; }
      g.fillStyle = paper; g.fillRect(0, 0, W, H);
      g.lineCap = 'round'; g.lineJoin = 'round';
      // the ring: the curve's equator, so from the side it flattens straight down into a line (a circle needs no spin)
      g.strokeStyle = ring; g.lineWidth = Math.max(1, .9 * u); g.beginPath();
      for(var i = 0; i <= 96; i++){ var a = i / 96 * 2 * Math.PI, c = [Math.cos(a) * RING, Math.sin(a) * RING], q = [cx + c[0] * u, cy + c[1] * lerp(1, cB, o) * u]; i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]); }
      g.closePath(); g.stroke();
      // the stitches / petals: round-ended bars at rest (a little finer than the printed logo), a fine line once open
      g.strokeStyle = ink; g.lineWidth = lerp(STITCH_W, LINE_W, Math.min(1, o * 1.6)) * u;
      shapes.forEach(function(sh){
        g.beginPath();
        for(var i = 0; i <= N; i++){
          var q = M(sh.stitch[i], sh.petal[i]);
          i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]);
        }
        g.stroke();
      });
      if(running) raf = requestAnimationFrame(draw); else last = null;
    }
    function wake(){ if(!running && !still){ running = true; cancelAnimationFrame(raf); raf = requestAnimationFrame(draw); } }
    size(); colours();
    raf = requestAnimationFrame(draw);
    // hovering the mark opens it straight away (skipping the pause), and it keeps going through the views while the
    // pointer stays; on leaving, the view that is out closes back into the logo. A tap on a touch screen plays one view.
    var box = cv.parentNode;
    box.addEventListener('pointerenter', function(e){
      if(e.pointerType === 'touch') return;
      hover = true; var s = segAt(tl); if(s.kind === 'rest') tl = s.start + s.d; wake();
    });
    box.addEventListener('pointerleave', function(e){ if(e.pointerType !== 'touch') hover = false; });
    box.addEventListener('pointerdown', function(e){
      if(e.pointerType !== 'touch' || hover) return;
      hover = true; var s = segAt(tl); if(s.kind === 'rest') tl = s.start + s.d; wake();
      setTimeout(function(){ hover = false; }, 4600);
    });
    new MutationObserver(function(){ colours(); if(!running) raf = requestAnimationFrame(draw); }).observe(document.documentElement, {attributes: true, attributeFilter: ['data-theme']});
    try{ matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(){ setTimeout(function(){ colours(); if(!running) raf = requestAnimationFrame(draw); }, 0); }); }catch(e){}
    addEventListener('resize', function(){ if(!running) raf = requestAnimationFrame(draw); });
  };
})();
