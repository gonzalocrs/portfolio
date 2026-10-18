// The GCV mark in motion: hover it and its six stitches open into a small line drawing of one of the projects, fold
// back into the logo, then open into the next. Every drawing is made of exactly six lines, so each stitch always
// becomes one line of it; the ring stays where it is and the project's name shows under it while it is open.
// logoWorks(canvas, {still: true}): draws into the canvas at its css size; colours follow the page (--ink, --ring,
// --mute; the canvas is transparent, so its box shows through). still: just the logo, no hovering (while the drawings
// are being redone). It returns {tone(i, v)}: stitch i fades to v, from 1 (ink, the logo) to 0 (the faint ring colour).
(function(){
  var N = 72;                          // points per line
  var RING = 70, STITCH_W = 3.8, LINE_W = 1.5, FIT = 47, CORNER = .12;

  function lerp(a, b, t){ return a + (b - a) * t; }
  function ease(t){ t = Math.max(0, Math.min(1, t)); return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  // ---- drawing helpers (200-unit drawing, centred on 0,0, y down) ----
  function poly(pts, closed){ return closed ? pts.concat([pts[0]]) : pts; }
  function curve(f, n){ var p = []; for(var i = 0; i <= (n || 48); i++) p.push(f(i / (n || 48))); return p; }
  function ellipse(cx, cy, rx, ry, a0, a1){ return curve(function(t){ var a = lerp(a0 || 0, a1 === undefined ? 2 * Math.PI : a1, t); return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]; }, 64); }
  // a plain isometric view, for the drawings in three dimensions (z up)
  function iso(x, y, z){ return [(x - y) * .866, (x + y) * .5 - z]; }
  function isoPoly(pts, closed){ return poly(pts.map(function(p){ return iso(p[0], p[1], p[2]); }), closed); }

  // ---- the projects, six lines each ----
  var WORKS = [
    {name: 'Sierra Hotel', lines: (function(){             // the façade: three bays, floors, the street
      return [poly([[-28, -44], [28, -44], [28, 40], [-28, 40]], true),
        [[-9.3, -44], [-9.3, 40]], [[9.3, -44], [9.3, 40]],
        [[-28, -16], [28, -16]], [[-28, 12], [28, 12]], [[-42, 40], [42, 40]]];
    })()},
    {name: 'Edificio Murano', lines: (function(){          // a slender tower, its floors banding two faces
      var a = 24, b = 24, h = 80;
      function band(z){ return isoPoly([[a, 0, z], [a, b, z], [0, b, z]]); }
      return [isoPoly([[0, 0, h], [a, 0, h], [a, 0, 0], [a, b, 0], [0, b, 0], [0, b, h]], true),
        isoPoly([[a, 0, h], [a, b, h], [0, b, h]]), isoPoly([[a, b, h], [a, b, 0]]),
        band(h * .25), band(h * .5), band(h * .75)];
    })()},
    {name: 'Urba Inmobiliaria', lines: (function(){        // a house with the U of the brand inside
      var u = [[-11, -2], [-11, 14]].concat(ellipse(0, 14, 11, 11, Math.PI, 0)).concat([[11, -2]]);
      return [[[-36, -4], [0, -38], [36, -4]], [[-27, -12], [-27, 36], [27, 36], [27, -12]], u,
        [[17, -22], [17, -34], [24, -34], [24, -16]], [[-42, 36], [42, 36]], u.slice().reverse()];
    })()},
    {name: 'Outer Dock', lines: [                           // a deck on piles, reaching out from the shore over the water
      [[-46, -6], [-30, -6], [-20, 24]],
      [[-30, -13], [46, -13]],
      [[-4, -13], [-4, 26]], [[17, -13], [17, 26]], [[38, -13], [38, 26]],
      curve(function(t){ var x = lerp(-22, 48, t); return [x, 10 + Math.sin(t * Math.PI * 6) * 1.6]; }, 72)
    ]},
    {name: 'East 5th', lines: [                             // the section: two cores, floors, the stair between
      [[-46, 36], [46, 36]],
      poly([[-20, -40], [-13, -40], [-13, 36], [-20, 36]], true),
      poly([[13, -22], [20, -22], [20, 36], [13, 36]], true),
      [[-40, -28], [32, -28]], [[-32, -6], [42, -6]],
      [[-13, 30], [-6, 30], [-6, 21], [1, 21], [1, 12], [8, 12], [8, 3], [13, 3]]
    ]},
    {name: 'Joint', lines: (function(){                     // two timbers crossing in a lap joint, pegged
      var A = [[-42, -6, 0], [42, 6, 8]], B = [[-6, -42, 8], [6, 42, 16]];
      function sil(b){ var x0 = b[0][0], y0 = b[0][1], z0 = b[0][2], x1 = b[1][0], y1 = b[1][1], z1 = b[1][2];
        return isoPoly([[x0, y0, z1], [x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], [x0, y1, z1]], true); }
      function ridge(b){ var x0 = b[0][0], y0 = b[0][1], z0 = b[0][2], x1 = b[1][0], y1 = b[1][1], z1 = b[1][2];
        return isoPoly([[x1, y0, z1], [x1, y1, z1], [x0, y1, z1]].concat([[x1, y1, z1], [x1, y1, z0]])); }
      var peg = curve(function(t){ var a = t * 2 * Math.PI; return iso(Math.cos(a) * 3.5, Math.sin(a) * 3.5, 16); }, 40);
      return [sil(A), ridge(A), sil(B), ridge(B), peg, peg.slice().reverse()];
    })()},
    {name: 'Aftergrowth', lines: [                          // trees taking hold on and beside a block
      [[-46, 38], [46, 38]],
      [[-38, 38], [-38, -10], [-6, -10], [-6, 38]],
      ellipse(18, -4, 18, 18), [[18, 14], [18, 38]],
      ellipse(-22, -26, 11, 11), [[-22, -15], [-22, -10]]
    ]},
    {name: 'Anticlastic Surfaces', lines: (function(){      // the saddle: its edge and a few lines across it
      function S(u, v){ return iso(u * 36, v * 36, (u * u - v * v) * 16); }
      var edge = curve(function(t){ var s = t * 4, k = Math.floor(Math.min(3.999, s)), f = s - k;
        var c = [[-1, -1], [1, -1], [1, 1], [-1, 1], [-1, -1]]; return S(lerp(c[k][0], c[k + 1][0], f), lerp(c[k][1], c[k + 1][1], f)); }, 96);
      function U(u){ return curve(function(t){ return S(u, lerp(-1, 1, t)); }); }
      function V(v){ return curve(function(t){ return S(lerp(-1, 1, t), v); }); }
      return [edge, U(-.5), U(0), U(.5), V(-.34), V(.34)];
    })()},
    {name: 'Lean Shells', lines: (function(){               // a thin vault: its arches, springing lines and crown
      var L = 64, R = 26, H = 30;
      function arch(x){ return curve(function(t){ var y = lerp(-R, R, t); return iso(x, y, H * (1 - (y / R) * (y / R))); }); }
      return [arch(0), arch(L), isoPoly([[0, -R, 0], [L, -R, 0]]), isoPoly([[0, R, 0], [L, R, 0]]), isoPoly([[0, 0, H], [L, 0, H]]), arch(L / 2)];
    })()},
    {name: 'Open Assembly', lines: (function(){             // a sphere put together from rings
      var tilt = .42, r = 40;
      function ring(nx, ny, nz){
        // a great circle with normal n, turned a little towards the viewer
        var l = Math.hypot(nx, ny, nz); nx /= l; ny /= l; nz /= l;
        var ax = Math.abs(nx) < .9 ? [1, 0, 0] : [0, 1, 0];
        var u = [ny * ax[2] - nz * ax[1], nz * ax[0] - nx * ax[2], nx * ax[1] - ny * ax[0]], lu = Math.hypot(u[0], u[1], u[2]);
        u = u.map(function(c){ return c / lu; });
        var v = [ny * u[2] - nz * u[1], nz * u[0] - nx * u[2], nx * u[1] - ny * u[0]];
        return curve(function(t){ var a = t * 2 * Math.PI, p = [0, 1, 2].map(function(i){ return (u[i] * Math.cos(a) + v[i] * Math.sin(a)) * r; });
          return [p[0], p[1] * Math.cos(tilt) - p[2] * Math.sin(tilt)]; }, 72);
      }
      return [ellipse(0, 0, r, r), ring(0, 0, 1), ring(1, 0, 0), ring(.5, .866, .3), ring(-.5, .866, .3), ring(0, 1, -.6)];
    })()}
  ];

  // ---- the logo's six stitches (about.html, 200-unit drawing centred on 100,100) ----
  function seg(x1, y1, x2, y2){ return function(u){ return [lerp(x1, x2, u) - 100, lerp(y1, y2, u) - 100]; }; }
  function arcF(r, a1, a2){ return function(u){ var a = lerp(a1, a2, u); return [Math.cos(a) * r, Math.sin(a) * r]; }; }
  var STITCHES = [
    seg(120.09, 60.74, 132.29, 48.54), seg(143.75, 100, 161, 100), seg(120.09, 139.26, 132.29, 151.46),
    seg(67.71, 151.46, 79.91, 139.26), arcF(58.5, Math.PI - Math.asin(8.55 / 58.5), Math.PI + Math.asin(8.55 / 58.5)), seg(67.71, 48.54, 79.91, 60.74)
  ].map(function(f){ var p = []; for(var i = 0; i < N; i++) p.push(f(i / (N - 1))); return p; });

  // every line resampled to N points evenly along its length
  function resample(pts){
    var d = [0];
    for(var i = 1; i < pts.length; i++) d.push(d[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    var L = d[d.length - 1] || 1, out = [], j = 0;
    for(var k = 0; k < N; k++){
      var s = L * k / (N - 1);
      while(j < d.length - 2 && d[j + 1] < s) j++;
      var f = (s - d[j]) / ((d[j + 1] - d[j]) || 1);
      out.push([lerp(pts[j][0], pts[j + 1][0], f), lerp(pts[j][1], pts[j + 1][1], f)]);
    }
    return out;
  }
  function centre(p){ var x = 0, y = 0; p.forEach(function(q){ x += q[0]; y += q[1]; }); return [x / p.length, y / p.length]; }
  function perms(a){ if(a.length < 2) return [a]; var r = []; a.forEach(function(x, i){ perms(a.slice(0, i).concat(a.slice(i + 1))).forEach(function(p){ r.push([x].concat(p)); }); }); return r; }
  var PERMS = perms([0, 1, 2, 3, 4, 5]);
  WORKS.forEach(function(w){
    // centre the drawing and size it to sit inside the ring
    var all = [].concat.apply([], w.lines), x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    all.forEach(function(p){ x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); });
    var k = FIT / Math.max((x1 - x0) / 2, (y1 - y0) / 2), mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
    var lines = w.lines.map(function(l){ return resample(l.map(function(p){ return [(p[0] - mx) * k, (p[1] - my) * k]; })); });
    // give each stitch the line nearest to it (the pairing that moves least), and run each line the way that travels least
    var cs = STITCHES.map(centre), cl = lines.map(centre), best = null, bestD = Infinity;
    PERMS.forEach(function(p){ var d = 0; p.forEach(function(j, i){ d += Math.hypot(cs[i][0] - cl[j][0], cs[i][1] - cl[j][1]); }); if(d < bestD){ bestD = d; best = p; } });
    w.paths = best.map(function(j, i){
      var l = lines[j], s = STITCHES[i];
      var fwd = Math.hypot(s[0][0] - l[0][0], s[0][1] - l[0][1]) + Math.hypot(s[N - 1][0] - l[N - 1][0], s[N - 1][1] - l[N - 1][1]);
      var back = Math.hypot(s[0][0] - l[N - 1][0], s[0][1] - l[N - 1][1]) + Math.hypot(s[N - 1][0] - l[0][0], s[N - 1][1] - l[0][1]);
      return back < fwd ? l.slice().reverse() : l;
    });
  });

  // the sequence, in seconds, one project after another; it only runs while the mark is hovered
  var TL = [], at = 0;
  WORKS.forEach(function(w, i){
    [['rest', .9], ['open', 1.7], ['hold', 2], ['close', 1.5]].forEach(function(p){ TL.push({kind: p[0], d: p[1], work: i, start: at}); at += p[1]; });
  });
  var CYCLE = at;
  function wrap(t){ return ((t % CYCLE) + CYCLE) % CYCLE; }
  function segAt(t){ t = wrap(t); for(var i = 0; i < TL.length - 1 && t >= TL[i].start + TL[i].d; i++); return TL[i]; }
  function state(t){
    var s = segAt(t), k = ease((wrap(t) - s.start) / s.d);
    return {open: s.kind === 'open' ? k : s.kind === 'close' ? 1 - k : s.kind === 'hold' ? 1 : 0, work: WORKS[s.work]};
  }

  window.logoWorks = function(cv, opts){
    if(!cv || !cv.getContext) return;
    var g = cv.getContext('2d'), W = 0, H = 0, ink = '#000', ring = '#ccc', mute = '#888', mono = 'monospace', still = false;
    try{ still = matchMedia('(prefers-reduced-motion: reduce)').matches; }catch(e){}
    if(opts && opts.still) still = true;
    function colours(){
      var cs = getComputedStyle(document.documentElement);
      ink = cs.getPropertyValue('--ink').trim() || '#000';
      ring = cs.getPropertyValue('--ring').trim() || '#ccc';
      mute = cs.getPropertyValue('--mute').trim() || '#888';
      mono = cs.getPropertyValue('--mono').trim() || 'monospace';
    }
    function size(){
      var dpr = Math.min(2, window.devicePixelRatio || 1), w = Math.round(cv.clientWidth * dpr), h = Math.round(cv.clientHeight * dpr);
      if(cv.width !== w || cv.height !== h){ cv.width = w; cv.height = h; }
      W = w; H = h;
    }

    // a stitch as a filled bar along its line: square ends with their corners just softened (CORNER of the width)
    function bar(pts, w, r){
      var n = pts.length - 1, L = [], R = [], len = 0;
      for(var i = 0; i <= n; i++){
        var a = pts[Math.max(0, i - 1)], b = pts[Math.min(n, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
        L.push([pts[i][0] - dy / l * w / 2, pts[i][1] + dx / l * w / 2]); R.push([pts[i][0] + dy / l * w / 2, pts[i][1] - dx / l * w / 2]);
        if(i) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      }
      var k = Math.max(1, Math.min(Math.floor(n / 3), Math.round(r / (len / n || 1)))), t = Math.min(.5, r / w);
      function mix(a, b, f){ return [lerp(a[0], b[0], f), lerp(a[1], b[1], f)]; }
      g.beginPath(); g.moveTo(L[k][0], L[k][1]);
      for(i = k + 1; i <= n - k; i++) g.lineTo(L[i][0], L[i][1]);
      var q = mix(L[n], R[n], t); g.quadraticCurveTo(L[n][0], L[n][1], q[0], q[1]);
      q = mix(R[n], L[n], t); g.lineTo(q[0], q[1]); g.quadraticCurveTo(R[n][0], R[n][1], R[n - k][0], R[n - k][1]);
      for(i = n - k - 1; i >= k; i--) g.lineTo(R[i][0], R[i][1]);
      q = mix(R[0], L[0], t); g.quadraticCurveTo(R[0][0], R[0][1], q[0], q[1]);
      q = mix(L[0], R[0], t); g.lineTo(q[0], q[1]); g.quadraticCurveTo(L[0][0], L[0][1], L[k][0], L[k][1]);
      g.closePath(); g.fill();
    }
    var tl = 0, last = null, raf = 0, hover = false, running = false, pending = false, fading = false;
    var tone = [1, 1, 1, 1, 1, 1], want = tone.slice();
    function schedule(){ if(!pending){ pending = true; raf = requestAnimationFrame(function(t){ pending = false; draw(t); }); } }
    function draw(now){
      size();
      // advance only while hovered, or while a drawing is still out (it then folds back into the logo and stops)
      var dt = last === null ? 0 : Math.min(.1, (now - last) / 1000); last = now;
      var seg = segAt(tl);
      if(!hover && seg.kind === 'hold'){ tl = seg.start + seg.d; seg = segAt(tl); }
      if(!hover && seg.kind === 'open'){ var c = TL[TL.indexOf(seg) + 1]; tl = c.start + (1 - (wrap(tl) - seg.start) / seg.d) * c.d; seg = c; }
      if(!hover && seg.kind === 'rest'){ tl = seg.start; running = false; }
      else tl += dt;
      var S = state(still ? 0 : tl), u = Math.min(W, H) / 200, cx = W / 2, cy = H / 2, o = S.open;
      g.clearRect(0, 0, W, H);
      fading = false;
      tone.forEach(function(v, i){ var d = want[i] - v; if(d){ tone[i] = Math.abs(d) < dt * 3 ? want[i] : v + Math.sign(d) * dt * 3; fading = true; } });
      g.lineCap = 'butt'; g.lineJoin = 'miter';
      g.strokeStyle = ring; g.lineWidth = Math.max(1, .9 * u);
      g.beginPath(); g.arc(cx, cy, RING * u, 0, 2 * Math.PI); g.stroke();
      // the stitches / the drawing: fine, square-ended bars at rest (sharp corners), fine lines once open
      g.strokeStyle = ink; g.lineWidth = lerp(STITCH_W, LINE_W, Math.min(1, o * 1.5)) * u;
      STITCHES.forEach(function(s, i){
        var p = S.work.paths[i], pts = [];
        for(var j = 0; j < N; j++) pts.push([cx + lerp(s[j][0], p[j][0], o) * u, cy + lerp(s[j][1], p[j][1], o) * u]);
        if(o < .12){
          if(tone[i] < 1){ g.fillStyle = ring; bar(pts, g.lineWidth, g.lineWidth * CORNER); }
          g.globalAlpha = tone[i]; g.fillStyle = ink; bar(pts, g.lineWidth, g.lineWidth * CORNER); g.globalAlpha = 1;
        }
        else{ g.beginPath(); pts.forEach(function(q, j){ j ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]); }); g.stroke(); }
      });
      // the project's name, small, under the ring while its drawing is out
      if(o > .01){
        g.globalAlpha = Math.max(0, (o - .4) / .6);
        g.fillStyle = mute; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.font = Math.round(Math.max(10, 4.6 * u)) + 'px ' + mono;
        try{ g.letterSpacing = (.05 * Math.max(10, 4.6 * u)) + 'px'; }catch(e){}
        g.fillText(S.work.name.toUpperCase(), cx, cy + 86 * u);
        g.globalAlpha = 1;
      }
      if(running || fading) schedule(); else last = null;
    }
    function wake(){ if(!running && !still){ running = true; schedule(); } }
    function redraw(){ schedule(); }
    size(); colours();
    schedule();
    if(document.fonts) document.fonts.ready.then(redraw);
    // hovering opens the next drawing straight away (skipping the pause) and keeps going through the projects while the
    // pointer stays; on leaving, the drawing that is out folds back into the logo. A tap on a touch screen plays one.
    var box = cv.parentNode;
    function start(){ hover = true; var s = segAt(tl); if(s.kind === 'rest') tl = s.start + s.d; wake(); }
    box.addEventListener('pointerenter', function(e){ if(e.pointerType !== 'touch') start(); });
    box.addEventListener('pointerleave', function(e){ if(e.pointerType !== 'touch') hover = false; });
    box.addEventListener('pointerdown', function(e){
      if(e.pointerType !== 'touch' || hover) return;
      start(); setTimeout(function(){ hover = false; }, 3800);
    });
    new MutationObserver(function(){ colours(); redraw(); }).observe(document.documentElement, {attributes: true, attributeFilter: ['data-theme']});
    try{ matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(){ setTimeout(function(){ colours(); redraw(); }, 0); }); }catch(e){}
    addEventListener('resize', redraw);
    return {tone: function(i, v){ want[i] = Math.max(0, Math.min(1, v)); schedule(); }};
  };
  window.logoWorks.works = WORKS;   // the drawings, for checking them side by side
})();
