// A new mockup (2026-10-29, his ask: "based on everything do a new mockup, closer to this vibe", fernando-garrido.com):
// one numbered index in a line beside his name (the category words before their numbers, the name of the project
// pointed at sliding in at the end), and under it plain pictures at their own proportions in justified rows, no
// tiles, frames or rounded corners, each with its small number. A number or a picture opens the project in place:
// its pictures first, then the title, facts and words. A project picture opens full screen. Pictures are never
// cropped; drawings stay on their own white. numbered.html is the home, numbered.html?p=<slug> a project.
(function(){
  var P = window.PROJECTS || {}, SLUGS = Object.keys(P), Q = new URLSearchParams(location.search);
  var main = document.getElementById('main'), nav = document.getElementById('index'), B = document.body;
  if(Q.get('theme') === 'dark') document.documentElement.classList.add('nb-dark');
  // ?v=field (his note the same evening: "cryptic like this website, from MAD how futuristic or forward it is... Zaha's
  // drawings explain this idea"): the home becomes a field after Zaha's drawings. The pictures float as planes of
  // different depth along one long diagonal, never overlapping and never cropped; projects still without pictures are
  // empty hairline planes. Fine construction lines run through them and past the edges, a few faint orbits behind,
  // and a hairline ties each plane to its number in the index. A scroll or a drag moves everything along the
  // diagonal, nearer planes faster, and it comes round again. &theme=dark is the night version.
  var V = Q.get('v');
  if(V === 'field') document.body.classList.add('nb-v-field');

  function web(src){
    if(src === 'img/anticlastic-roof-structure/hero.jpg') return 'img/anticlastic-roof-structure/hero-web.jpg';
    return src.replace(/\/physical\/(?!web\/)([^\/]+)$/, '/physical/web/$1');
  }
  function thumb(src){ return /\.jpe?g$/i.test(src) ? src.replace(/\/physical\/web\//, '/physical/').replace(/\/([^\/]+)\.jpe?g$/i, '/thumbs/$1.jpg') : src; }
  function isDrawing(it){ return it.drawing || /\.(svg|png|webp)$/i.test(it.src); }
  function flat(list){ var o = []; (list || []).forEach(function(it){ Array.isArray(it) ? o.push.apply(o, it) : o.push(it); }); return o; }
  function pictures(slug){
    var p = P[slug], grid = flat(p.grid), g = p.gallery || {}, seen = {}, out = [];
    var drawings = grid.filter(isDrawing), physical = grid.filter(function(it){ return !isDrawing(it) && /\/physical\//.test(it.src); });
    var photos = grid.filter(function(it){ return !isDrawing(it) && !/\/physical\//.test(it.src); });
    if(!grid.length){ drawings = g.drawings || []; physical = g.physical || []; photos = g.photos || []; }
    if(!physical.length && g.physical) physical = g.physical;
    [p.hero ? [{src: p.hero}] : [], p.diagram && p.diagram.src ? [{src: p.diagram.src, caption: p.diagram.caption, drawing: true}] : [], drawings, physical, photos].forEach(function(list){
      list.forEach(function(it){
        var s = it.src && web(it.src);
        if(!s || seen[s]) return; seen[s] = 1;
        out.push({src: s, drawing: isDrawing(it), caption: it.caption || '', slug: slug});
      });
    });
    return out;
  }
  function picks(slug, all){
    if(!all.length) return [];
    var mine = (P[slug].home || []).map(function(s){ return all.filter(function(o){ return o.src === web(s); })[0]; }).filter(Boolean);
    if(mine.length) return mine;
    var out = [all[0]];
    if(all.length >= 3) for(var i = 1; i < all.length; i++) if(all[i].drawing !== all[0].drawing){ out.push(all[i]); break; }
    return out;
  }
  function el(tag, cls, parent, text){ var e = document.createElement(tag); if(cls) e.className = cls; if(text != null) e.textContent = text; if(parent) parent.appendChild(e); return e; }
  function num(s){ var i = SLUGS.indexOf(s) + 1; return (i < 10 ? '0' : '') + i; }
  function place(p){ var c = (p.credits || []).filter(function(r){ return r[0] === 'Location'; })[0]; return c ? c[1] : (p.kicker || '').split(',')[0].trim(); }
  function year(p){ var m = (p.kicker || '').match(/(\d{4})/); return m ? m[1] : ''; }
  function kind(p){ var c = (p.credits || []).filter(function(r){ return r[0] === 'Type'; })[0]; return c ? c[1] : p.group; }
  function ratio(o){
    return new Promise(function(res){
      var im = new Image(); im.onload = function(){ o.r = im.naturalWidth / im.naturalHeight || 1.5; res(o); };
      im.onerror = function(){ o.r = 1.5; res(o); }; im.src = o.src;
    });
  }

  // ---------- the index: category word, its numbers; the name pointed at slides in at the end ----------
  var nums = {}, words = {}, now = null, group = null, view = null;
  var GROUPS = SLUGS.map(function(s){ return P[s].group; }).filter(function(g, i, a){ return g && a.indexOf(g) === i; });
  GROUPS.forEach(function(g){
    var w = el('button', 'nb-w', nav, g); w.type = 'button'; words[g] = w;
    w.addEventListener('click', function(){ if(view !== 'home') go(null, true, g); else filter(group === g ? null : g); });
    SLUGS.filter(function(s){ return P[s].group === g; }).forEach(function(s){
      var a = el('a', 'nb-n', nav, num(s)); a.href = 'numbered.html?p=' + s; nums[s] = a;
      a.addEventListener('click', function(e){ e.preventDefault(); go(s, true); });
      a.addEventListener('mouseenter', function(){ point(s); });
      a.addEventListener('mouseleave', function(){ point(null); });
    });
  });
  var ab = el('a', 'nb-w nb-ab', nav, '+ About'); ab.href = 'about.html';
  now = el('span', 'nb-now', nav);
  function say(t){
    if(now.textContent === t) return;
    now.textContent = t;
    if(t && now.animate) now.animate([{opacity: 0, transform: 'translateY(4px)'}, {opacity: 1, transform: 'none'}], {duration: 450, easing: 'cubic-bezier(.2,.7,.2,1)'});
  }
  // pointing at a number or a picture: its number darkens, its name shows, the other projects' pictures step back
  function point(s){
    SLUGS.forEach(function(x){ nums[x].classList.toggle('hi', x === s); });
    say(s ? P[s].title : view && view !== 'home' ? P[view].title : '');
    var wall = main.querySelector('.nb-wall');
    if(wall){ wall.classList.toggle('focus', !!s); wall.querySelectorAll('figure').forEach(function(f){ f.classList.toggle('on', f.slug === s); }); }
    if(fstate) fstate.items.forEach(function(m){ [m.a, m.b, m.tie].forEach(function(l){ l.classList.toggle('on', m.slug === s); }); });
  }

  // ---------- justified rows: each row as wide as the space, every picture at its own proportion ----------
  function justify(box, items, h0, gap, cap){
    items = items.filter(function(o){ return o.fig && o.r; });
    var W = box.clientWidth, rows = [], row = [], w = 0;
    items.forEach(function(o){
      row.push(o); w += o.r * h0;
      if(w + gap * (row.length - 1) >= W){ rows.push(row); row = []; w = 0; }
    });
    if(row.length) rows.push(row.concat({last: true}));
    rows.forEach(function(r){
      var last = r[r.length - 1] && r[r.length - 1].last; if(last) r = r.slice(0, -1);
      var sr = r.reduce(function(a, o){ return a + o.r; }, 0), h = last ? Math.min(h0, (W - gap * (r.length - 1)) / sr) : (W - gap * (r.length - 1)) / sr;
      if(cap) h = Math.min(h, cap);
      r.forEach(function(o){ o.fig.style.width = (o.r * h) + 'px'; o.fig.querySelector('.nb-img').style.height = h + 'px'; });
    });
  }
  function fig(parent, o, small, label){
    var f = el('figure', 'nb-fig' + (o.drawing ? ' dr' : ''), parent); f.slug = o.slug; o.fig = f;
    var box = el('div', 'nb-img', f), im = el('img', '', box); im.alt = o.caption || P[o.slug].title; im.decoding = 'async';
    im.addEventListener('load', function(){ im.classList.add('in'); });
    if(small && !o.drawing){ im.addEventListener('error', function(){ if(im.src.indexOf(o.src) < 0) im.src = o.src; }, {once: true}); im.src = thumb(o.src); }
    else im.src = o.src;
    if(label) el('figcaption', '', f, label);
    return f;
  }

  // ---------- the home: one or two pictures per project, justified, each with its number ----------
  var wallItems = [];
  function home(){
    if(V === 'field') return field();
    var wall = el('div', 'nb-wall', null);
    var shown = wallItems.filter(function(o){ return !group || P[o.slug].group === group; });
    shown.forEach(function(o){
      var f = fig(wall, o, true, num(o.slug));
      f.addEventListener('mouseenter', function(){ point(o.slug); });
      f.addEventListener('mouseleave', function(){ point(null); });
      f.addEventListener('click', function(){ go(o.slug, true); });
    });
    swap(wall, function(){ justify(wall, shown, innerWidth <= 700 ? 130 : 230, innerWidth <= 700 ? 8 : 14); });
    return wall;
  }
  // ---------- the field ----------
  var fieldItems = null, fstate = null;
  function field(){
    var box = el('div', 'nb-wall nb-field', null), NS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(NS, 'svg'); svg.setAttribute('class', 'nb-lines'); box.appendChild(svg);
    if(!fieldItems){
      var seed = 7; var rnd = function(){ seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
      fieldItems = [];
      SLUGS.forEach(function(s){
        var mine = wallItems.filter(function(o){ return o.slug === s; });
        if(!mine.length) mine = [{slug: s, empty: true, r: [1.5, 1.2, .8, 1.8][fieldItems.length % 4]}];
        mine.forEach(function(o){ fieldItems.push({o: o, z: rnd(), off: (rnd() - .5) * 2}); });
      });
      fieldItems.forEach(function(it, i){ it.u0 = .08 + .84 * i / Math.max(1, fieldItems.length - 1); });
    }
    var items = fieldItems.map(function(it){
      var o = it.o, f;
      if(o.empty){ f = el('figure', 'nb-fig nb-plane', box); el('span', '', f, num(o.slug)); }
      else { f = el('figure', 'nb-fig' + (o.drawing ? ' dr' : ''), box); var b = el('div', 'nb-img', f), im = el('img', '', b); im.alt = o.caption || P[o.slug].title; im.addEventListener('load', function(){ im.classList.add('in'); }); im.src = o.drawing ? o.src : thumb(o.src); if(!o.drawing) im.addEventListener('error', function(){ if(im.src.indexOf(o.src) < 0) im.src = o.src; }, {once: true}); }
      f.slug = o.slug; f.classList.toggle('off', !!group && P[o.slug].group !== group);
      f.addEventListener('mouseenter', function(){ point(o.slug); });
      f.addEventListener('mouseleave', function(){ point(null); });
      f.addEventListener('click', function(){ if(!moved) go(o.slug, true); });
      var lineA = document.createElementNS(NS, 'line'), lineB = document.createElementNS(NS, 'line'), tie = document.createElementNS(NS, 'line');
      lineA.setAttribute('class', 'la'); lineB.setAttribute('class', 'lb'); tie.setAttribute('class', 'tie');
      svg.appendChild(lineA); svg.appendChild(lineB); svg.appendChild(tie);
      return {it: it, f: f, a: lineA, b: lineB, tie: tie, slug: o.slug};
    });
    var orbits = [0, 1, 2].map(function(){ var e = document.createElementNS(NS, 'ellipse'); e.setAttribute('class', 'orb'); svg.insertBefore(e, svg.firstChild); return e; });
    var axis = document.createElementNS(NS, 'line'); axis.setAttribute('class', 'axis'); svg.insertBefore(axis, svg.firstChild);
    var shift = 0, moved = false;
    function render(){
      var W = box.clientWidth, H = box.clientHeight; if(!W || !H) return;
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H); svg.setAttribute('width', W); svg.setAttribute('height', H);
      var phone = innerWidth <= 700, x0 = W * .02, y0 = H * .94, x1 = W * .98, y1 = H * .08;
      var dx = x1 - x0, dy = y1 - y0, L = Math.sqrt(dx * dx + dy * dy), ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
      var ang = Math.atan2(dy, dx) * 180 / Math.PI, A = W * H * (phone ? .07 : .05), ext = Math.max(W, H) * 2;
      axis.setAttribute('x1', x0 - ux * ext); axis.setAttribute('y1', y0 - uy * ext); axis.setAttribute('x2', x1 + ux * ext); axis.setAttribute('y2', y1 + uy * ext);
      orbits.forEach(function(e, i){
        var cx = W * (.42 + i * .06), cy = H * (.55 - i * .05);
        e.setAttribute('cx', cx); e.setAttribute('cy', cy); e.setAttribute('rx', W * (.34 + i * .1)); e.setAttribute('ry', H * (.18 + i * .07));
        e.setAttribute('transform', 'rotate(' + (ang + 8 + i * 9) + ' ' + cx + ' ' + cy + ')');
      });
      var placed = [];
      items.forEach(function(m){
        // pictures large, the empty planes of projects still to come small and faint
        var it = m.it, sc = it.o.empty ? .28 : .7 + (1 - it.z) * .7, w = Math.sqrt(A * sc * (it.o.r || 1.5)), h = w / (it.o.r || 1.5);
        var u = ((it.u0 + shift * (.6 + (1 - it.z) * .8)) % 1 + 1) % 1, d = L * (u * 1.06 - .03);
        m.f.style.opacity = Math.min(1, u / .06, (1 - u) / .06).toFixed(3);
        var cx = x0 + ux * d + nx * it.off * H * .2, cy = y0 + uy * d + ny * it.off * H * .2;
        m.box = {x: cx - w / 2, y: cy - h / 2, w: w, h: h};
        placed.push(m);
      });
      // keep planes apart (pushed away from each other across the diagonal) and inside the frame
      var M = 14, keep = function(){ placed.forEach(function(p){ var b = p.box; b.x = Math.max(M, Math.min(W - b.w - M, b.x)); b.y = Math.max(M, Math.min(H - b.h - M, b.y)); }); };
      for(var k = 0; k < 30; k++){ if(k % 3 === 2) keep(); placed.forEach(function(p, i){ placed.forEach(function(q, j){
        if(j <= i) return;
        var a = p.box, b = q.box, ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x), oy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
        if(ox > -14 && oy > -14){ var push = (Math.min(ox, oy) + 14) / 2, sgn = ((a.x + a.w / 2 - b.x - b.w / 2) * nx + (a.y + a.h / 2 - b.y - b.h / 2) * ny) >= 0 ? 1 : -1;
          a.x += nx * push * sgn; a.y += ny * push * sgn; b.x -= nx * push * sgn; b.y -= ny * push * sgn; }
      }); }); }
      keep();
      items.forEach(function(m){
        var b = m.box, f = m.f;
        f.style.transform = 'translate(' + b.x + 'px,' + b.y + 'px)'; f.style.width = b.w + 'px'; f.style.height = b.h + 'px';
        f.style.zIndex = Math.round((1 - m.it.z) * 10) + 1;
        // its lines: the bottom edge and the left edge carried on far past the plane, like the lines of a drawing
        m.a.setAttribute('x1', b.x - ux * ext); m.a.setAttribute('y1', b.y + b.h - uy * ext); m.a.setAttribute('x2', b.x + ux * ext); m.a.setAttribute('y2', b.y + b.h + uy * ext);
        m.b.setAttribute('x1', b.x + b.w - nx * H * .25); m.b.setAttribute('y1', b.y - ny * H * .25); m.b.setAttribute('x2', b.x + b.w + nx * H * .5); m.b.setAttribute('y2', b.y + ny * H * .5);
        // the tie to its number in the index
        var n = nums[m.slug].getBoundingClientRect(), r = box.getBoundingClientRect();
        m.tie.setAttribute('x1', n.left + n.width / 2 - r.left); m.tie.setAttribute('y1', n.bottom - r.top + 3); m.tie.setAttribute('x2', b.x + b.w / 2); m.tie.setAttribute('y2', b.y);
      });
    }
    fstate = {render: render, items: items};
    var target = 0, raf = null;
    function ease(){ shift += (target - shift) * .09; render(); if(Math.abs(target - shift) > .0002) raf = requestAnimationFrame(ease); else raf = null; }
    function nudge(d){ target += d; if(!raf) raf = requestAnimationFrame(ease); }
    box.addEventListener('wheel', function(e){ e.preventDefault(); nudge(((Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX)) * .00035); }, {passive: false});
    var sx = null, sy = null;
    box.addEventListener('pointerdown', function(e){ sx = e.clientX; sy = e.clientY; moved = false; });
    addEventListener('pointermove', function(e){ if(sx == null) return; var d = (e.clientX - sx) - (e.clientY - sy); if(Math.abs(d) > 4) moved = true; nudge(d * .0006); sx = e.clientX; sy = e.clientY; });
    addEventListener('pointerup', function(){ sx = sy = null; setTimeout(function(){ moved = false; }, 0); });
    swap(box, render);
    return box;
  }
  function filter(g){
    group = g;
    GROUPS.forEach(function(x){ words[x].classList.toggle('on', x === g); });
    SLUGS.forEach(function(s){ nums[s].classList.toggle('off', !!g && P[s].group !== g); });
    home();
  }

  // ---------- a project: its pictures first, then title, facts, words; a picture opens full screen ----------
  function project(slug){
    var p = P[slug], list = pictures(slug), pg = el('div', 'nb-proj', null);
    var pics = el('div', 'nb-pics', pg);
    Promise.all(list.map(ratio)).then(function(){
      list.forEach(function(o, i){ fig(pics, o, false).addEventListener('click', function(){ big(list, i); }); });
      lay();
    });
    if(!list.length) el('p', 'nb-none', pics, 'Pictures to come');
    var tx = el('div', 'nb-text', pg), head = el('div', 'nb-head', tx);
    el('span', 'nb-num', head, num(slug));
    el('h1', '', head, p.title);
    var facts = el('p', 'nb-facts', head); facts.textContent = [place(p), kind(p), year(p)].filter(Boolean).join(' — ');
    var body = el('div', 'nb-body', tx), t = p.text || p.lede || '';
    if(p.lede && p.text) el('p', 'lede', body, p.lede);
    (Array.isArray(t) ? t : t ? [t] : []).forEach(function(s){ el('p', '', body, s); });
    var cr = (p.credits || []).filter(function(r){ return ['Type', 'Location', 'Year'].indexOf(r[0]) < 0; });
    if(cr.length){ var dl = el('dl', 'nb-cr', body); cr.forEach(function(r){ el('dt', '', dl, r[0]); el('dd', '', dl, r[1]); }); }
    var i = SLUGS.indexOf(slug), nx = SLUGS[(i + 1) % SLUGS.length];
    var next = el('a', 'nb-next', pg); next.href = 'numbered.html?p=' + nx; el('span', '', next, 'Next'); el('span', '', next, num(nx) + '  ' + P[nx].title);
    next.addEventListener('click', function(e){ e.preventDefault(); go(nx, true); });
    function lay(){ justify(pics, list, innerWidth <= 700 ? 200 : Math.max(320, innerHeight * .5), innerWidth <= 700 ? 8 : 14, innerHeight * .78); }
    swap(pg, lay);
  }

  // ---------- moving between the home and a project: a soft fade, the address follows ----------
  var relay = null;
  function swap(node, lay){
    var old = main.firstElementChild;
    function put(){ main.innerHTML = ''; main.appendChild(node); relay = lay; lay(); requestAnimationFrame(function(){ node.classList.add('in'); }); }
    if(old){ old.classList.remove('in'); setTimeout(put, 280); } else put();
  }
  addEventListener('resize', function(){ if(relay) relay(); });
  function go(slug, push, g){
    view = slug || 'home';
    SLUGS.forEach(function(s){ nums[s].classList.toggle('cur', s === slug); });
    B.classList.toggle('nb-in', !!slug);
    say(slug ? P[slug].title : '');
    if(push) history.pushState({p: slug || null}, '', slug ? 'numbered.html?p=' + slug : 'numbered.html');
    if(push) scrollTo({top: 0, behavior: 'smooth'});
    if(slug){ GROUPS.forEach(function(x){ words[x].classList.remove('on'); }); SLUGS.forEach(function(s){ nums[s].classList.remove('off'); }); group = null; project(slug); }
    else filter(g || null);
  }
  addEventListener('popstate', function(){ var s = new URLSearchParams(location.search).get('p'); go(P[s] ? s : null, false); });
  document.getElementById('home').addEventListener('click', function(e){ e.preventDefault(); go(null, true); });

  // ---------- full screen: the picture whole, on the page's own ground; click or Esc closes, arrows step ----------
  var lb = el('div', 'nb-lb', B), lbi = el('img', '', lb), lbList = null, lbAt = 0;
  function big(list, i){ lbList = list; lbAt = i; lbi.src = list[i].src; lbi.classList.toggle('dr', list[i].drawing); lb.classList.add('on'); }
  lb.addEventListener('click', function(){ lb.classList.remove('on'); });
  addEventListener('keydown', function(e){
    if(!lb.classList.contains('on')) return;
    if(e.key === 'Escape') lb.classList.remove('on');
    if(e.key === 'ArrowRight' || e.key === 'ArrowLeft'){ var n = lbList.length; big(lbList, (lbAt + (e.key === 'ArrowRight' ? 1 : -1) + n) % n); }
  });

  // ---------- start ----------
  var all = [];
  SLUGS.forEach(function(s){ var got = pictures(s); if(!got.length) nums[s].classList.add('empty'); all = all.concat(picks(s, got)); });
  Promise.all(all.map(ratio)).then(function(){
    wallItems = all;
    var s = Q.get('p'); go(P[s] ? s : null, false);
  });
})();
