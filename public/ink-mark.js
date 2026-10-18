// The GCV mark in motion, after Zach Lieberman's "Wireframe Ink" studies: the six stitches of the logo come loose and
// become the six edges of a wireframe turning in space, painted in ink, which changes from one solid to the next
// (a tetrahedron, a skew hexagon, two crossed triangles) and then folds back into the logo and rests there.
// The ring stays still the whole time. Every figure has exactly six edges, so each stitch is always the same edge.
// inkMark(canvas): draws into the canvas at its css size; colours follow the page (--ink, the canvas's background).
(function(){
  // the logo, in its 200-unit drawing (about.html): the six stitches, centred on 100,100
  var LOGO = [
    [120.09, 60.74, 132.29, 48.54],
    [143.75, 100, 161, 100],
    [120.09, 139.26, 132.29, 151.46],
    [67.71, 151.46, 79.91, 139.26],
    [42.13, 108.55, 42.13, 91.45],
    [67.71, 48.54, 79.91, 60.74]
  ].map(function(s){ return [[s[0] - 100, s[1] - 100, 0], [s[2] - 100, s[3] - 100, 0]]; });

  // the solids, six edges each, at a size that keeps them inside the ring
  function tetra(){
    var k = 50 / Math.sqrt(3), v = [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]].map(function(p){ return p.map(function(c){ return c * k; }); });
    return [[0, 1], [1, 2], [2, 3], [3, 0], [0, 2], [1, 3]].map(function(e){ return [v[e[0]], v[e[1]]]; });
  }
  function crown(){
    var v = [];
    for(var i = 0; i < 6; i++){ var a = i * Math.PI / 3; v.push([Math.cos(a) * 52, (i % 2 ? 26 : -26), Math.sin(a) * 52]); }
    return v.map(function(p, i){ return [p, v[(i + 1) % 6]]; });
  }
  function star(){
    function tri(a0, z){ var t = []; for(var i = 0; i < 3; i++){ var a = a0 + i * 2 * Math.PI / 3; t.push([Math.cos(a) * 54, Math.sin(a) * 54, z]); } return t; }
    var A = tri(-Math.PI / 2, 20), B = tri(Math.PI / 2, -20);
    return [[A[0], A[1]], [B[0], B[1]], [A[1], A[2]], [B[1], B[2]], [A[2], A[0]], [B[2], B[0]]];
  }
  var SOLIDS = [tetra(), crown(), star()];

  // the cycle, in seconds: rest as the logo, unfold, turn as each solid, fold back
  var REST = 3.2, MORPH = 2.2, TURN = 4.2;
  var SEQ = [{f: 'logo', d: REST}];
  SOLIDS.forEach(function(s, i){ SEQ.push({f: i, d: MORPH, morph: true}); SEQ.push({f: i, d: TURN}); });
  SEQ.push({f: 'logo', d: MORPH, morph: true});
  var CYCLE = SEQ.reduce(function(a, s){ return a + s.d; }, 0);

  function ease(t){ return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function lerp(a, b, t){ return a + (b - a) * t; }
  // a little smooth noise for the brush (sum of sines, no randomness, so a stroke doesn't flicker)
  function wob(x, s){ return Math.sin(x * 2.1 + s) * .5 + Math.sin(x * 5.3 + s * 1.7) * .3 + Math.sin(x * 11.7 + s * .6) * .2; }

  window.inkMark = function(cv){
    if(!cv || !cv.getContext) return;
    var g = cv.getContext('2d'), W = 0, H = 0, dpr = 1, ink = '#000', paper = '#fff', ring = '#ccc', still = false;
    try{ still = matchMedia('(prefers-reduced-motion: reduce)').matches; }catch(e){}
    function colours(){
      var cs = getComputedStyle(document.documentElement);
      ink = cs.getPropertyValue('--ink').trim() || '#000';
      ring = cs.getPropertyValue('--ring').trim() || '#ccc';
      var bg = getComputedStyle(cv.parentNode).backgroundColor;
      paper = (bg && bg !== 'rgba(0, 0, 0, 0)') ? bg : (cs.getPropertyValue('--paper').trim() || '#fff');
      g.fillStyle = paper; g.fillRect(0, 0, W, H);
    }
    function size(){
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = Math.round(cv.clientWidth * dpr); H = Math.round(cv.clientHeight * dpr);
      if(cv.width !== W || cv.height !== H){ cv.width = W; cv.height = H; colours(); }
    }

    // what is on show at time t (seconds): the figure it comes from (A), the one it goes to (B), how far along (k),
    // and how "logo" it is (flat: 1 = the resting logo)
    function figure(t){
      t = t % CYCLE;
      var i = 0; while(t > SEQ[i].d){ t -= SEQ[i].d; i++; }
      var s = SEQ[i], prev = s.morph ? SEQ[(i - 1 + SEQ.length) % SEQ.length].f : s.f, k = s.morph ? ease(t / s.d) : 1;
      return {A: prev, B: s.f, k: k, flat: (prev === 'logo' ? 1 - k : 0) + (s.f === 'logo' ? k : 0)};
    }
    function edgesOf(f){ return f === 'logo' ? LOGO : SOLIDS[f]; }

    // one brush stroke along a segment: tapered at both ends, its width breathing a little, with dry streaks
    function stroke(x1, y1, x2, y2, w, seed, dry){
      // dry is 0 for the resting logo: then the stitch is a plain bar with square ends, exactly as drawn
      var dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy);
      if(L < .5) return;
      var nx = -dy / L, ny = dx / L, N = Math.max(8, Math.min(40, Math.round(L / 4))), left = [], right = [], taper = Math.min(1, dry * 1.6);
      for(var i = 0; i <= N; i++){
        var u = i / N, prof = lerp(1, Math.pow(Math.sin(Math.PI * Math.min(1, Math.max(0, u * .94 + .03))), .45), taper);
        var ww = w * prof * (1 + dry * .22 * wob(u * 3, seed)) / 2, off = dry * w * .12 * wob(u * 2, seed + 4);
        var px = x1 + dx * u + nx * off, py = y1 + dy * u + ny * off;
        left.push([px + nx * ww, py + ny * ww]); right.push([px - nx * ww, py - ny * ww]);
      }
      g.beginPath(); g.moveTo(left[0][0], left[0][1]);
      left.forEach(function(p){ g.lineTo(p[0], p[1]); });
      for(var j = right.length - 1; j >= 0; j--) g.lineTo(right[j][0], right[j][1]);
      g.closePath(); g.fillStyle = ink; g.globalAlpha = .92; g.fill();
      if(dry > .05){
        // streaks where the brush runs dry: thin lines of paper along the stroke, towards its tail
        g.strokeStyle = paper; g.lineCap = 'round';
        for(var b = 0; b < 3; b++){
          var o = (b - 1) * w * .26 + w * .05 * Math.sin(seed + b), t0 = .35 + .2 * ((seed * 7 + b * 3) % 1);
          g.globalAlpha = .35 * dry; g.lineWidth = Math.max(.6, w * .07);
          g.beginPath(); g.moveTo(x1 + dx * t0 + nx * o, y1 + dy * t0 + ny * o); g.lineTo(x1 + dx * .97 + nx * o * 1.2, y1 + dy * .97 + ny * o * 1.2); g.stroke();
        }
      }
      g.globalAlpha = 1;
    }

    var t0 = null, raf = 0, seen = true, last = null, ay = 0;
    function draw(now){
      size();
      if(t0 === null) t0 = now;
      var t = still ? 0 : (now - t0) / 1000, F = figure(t), u = Math.min(W, H) / 200, cx = W / 2, cy = H / 2;
      // the old ink fades rather than vanishing, so a moving edge leaves a short trail; at rest it settles clean
      g.globalAlpha = lerp(.3, .6, F.flat); g.fillStyle = paper; g.fillRect(0, 0, W, H); g.globalAlpha = 1;
      // the ring, fixed and fine, as in the logo
      g.strokeStyle = ring; g.lineWidth = Math.max(1, .9 * u); g.beginPath(); g.arc(cx, cy, 70 * u, 0, Math.PI * 2); g.stroke();
      // the solids turn (always the same steady speed, so folding back is never a spin); the logo itself never
      // turns: a morph runs from the turned solid to the flat logo, then a gentle perspective
      var dt = last === null ? 0 : Math.min(.1, t - last); last = t; ay += dt * .55;
      var ax = .75 + .2 * Math.sin(t * .31), az = .15 * Math.sin(t * .23);
      var cY = Math.cos(ay), sY = Math.sin(ay), cX = Math.cos(ax), sX = Math.sin(ax), cZ = Math.cos(az), sZ = Math.sin(az);
      function R(p){
        var x = p[0] * cY + p[2] * sY, z = -p[0] * sY + p[2] * cY, y = p[1];
        var y2 = y * cX - z * sX, z2 = y * sX + z * cX;
        return [x * cZ - y2 * sZ, x * sZ + y2 * cZ, z2];
      }
      function P(p){ var f = 360 / (360 + p[2]); return [cx + p[0] * f * u, cy + p[1] * f * u, p[2]]; }
      var EA = edgesOf(F.A), EB = edgesOf(F.B);
      function at(f, p){ return f === 'logo' ? p : R(p); }
      var es = EA.map(function(e, j){
        var ends = [0, 1].map(function(n){
          var a = at(F.A, e[n]), b = at(F.B, EB[j][n]);
          return P([0, 1, 2].map(function(c){ return lerp(a[c], b[c], F.k); }));
        });
        return {a: ends[0], b: ends[1], z: (ends[0][2] + ends[1][2]) / 2, j: j};
      });
      es.sort(function(p, q){ return q.z - p.z; });   // far edges first
      es.forEach(function(e){
        // nearer edges are heavier; the logo's stitches are 5 units wide
        var w = lerp(lerp(6.2, 2.6, (e.z + 55) / 110), 5, F.flat) * u;
        stroke(e.a[0], e.a[1], e.b[0], e.b[1], w, e.j * 1.37 + t * .4 * (1 - F.flat), 1 - F.flat);
      });
      if(!still && seen) raf = requestAnimationFrame(draw);
    }
    size(); colours();
    raf = requestAnimationFrame(draw);
    // follow the theme switch and the system theme
    new MutationObserver(colours).observe(document.documentElement, {attributes: true, attributeFilter: ['data-theme']});
    try{ matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(){ setTimeout(colours, 0); }); }catch(e){}
    addEventListener('resize', function(){ size(); });
    // only run while it can be seen
    if('IntersectionObserver' in window) new IntersectionObserver(function(en){
      var v = en[0].isIntersecting;
      if(v && !seen){ seen = true; cancelAnimationFrame(raf); raf = requestAnimationFrame(draw); }
      seen = v;
    }).observe(cv);
  };
})();
