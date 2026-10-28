// "A touch of modernity", round 2 (2026-10-27, after MAD, i-mad.com): whole pages rethought, preview only.
// next.html?v=depth|time|index is a home; &p=<slug> opens one project in the same way. Pictures are never cropped,
// his name keeps its size, the ground stays light, drawings keep their own colours, his words are shown as written.
//   depth  the museum walk made literal: the pictures hang in a deep space and a scroll walks you forward past them
//   time   the work laid on one line of years: a scroll travels sideways along it, a playhead reads the date
//   index  a precise table of the work; pointing at a row shows its picture; a project is a sheet: data and words
//          fixed on the left, its pictures running down the right
(function(){
  var P = window.PROJECTS || {}, SLUGS = Object.keys(P), Q = new URLSearchParams(location.search);
  var VS = ['depth', 'time', 'index'], V = (Q.get('v') || 'depth').toLowerCase(); if(VS.indexOf(V) < 0) V = 'depth';
  var SLUG = P[Q.get('p')] ? Q.get('p') : null;
  var main = document.getElementById('main'), B = document.body;
  B.classList.add('v-' + V, SLUG ? 'is-proj' : 'is-home');
  var home = document.getElementById('home'); if(home) home.href = 'next.html?v=' + V;

  // ---- the material (the same order as the live site: hero, diagram, drawings, models, photos) ----
  function web(src){
    if(src === 'img/anticlastic-roof-structure/hero.jpg') return 'img/anticlastic-roof-structure/hero-web.jpg';
    return src.replace(/\/physical\/(?!web\/)([^\/]+)$/, '/physical/web/$1');
  }
  function thumb(src){ return /\.jpe?g$/i.test(src) ? src.replace(/\/physical\/web\//, '/physical/').replace(/\/([^\/]+)\.jpe?g$/i, '/thumbs/$1.jpg') : src; }
  // a missing small copy falls back to the picture itself
  function fallback(im, src){ im.addEventListener('error', function(){ if(im.src.indexOf(src) < 0) im.src = src; }); }
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
  // the home's one or two pictures per project (his rule; projects.js "home" when set)
  function picks(slug){
    var all = pictures(slug); if(!all.length) return [];
    var mine = (P[slug].home || []).map(function(s){ return all.filter(function(o){ return o.src === web(s); })[0]; }).filter(Boolean);
    if(mine.length) return mine;
    var out = [all[0]];
    if(all.length >= 3) for(var i = 1; i < all.length; i++) if(all[i].drawing !== all[0].drawing){ out.push(all[i]); break; }
    return out;
  }
  function load(list){
    return Promise.all(list.map(function(o){
      return new Promise(function(res){
        var im = new Image(); im.onload = function(){ o.r = im.naturalWidth / im.naturalHeight || 1.5; res(o); };
        im.onerror = function(){ o.r = 1.5; res(o); }; im.src = o.src;
      });
    }));
  }
  function place(p){ return (p.kicker || '').split(',')[0].trim(); }
  function year(p){ var m = (p.kicker || '').match(/(\d{4})/); return m ? +m[1] : 2024; }
  function el(tag, cls, parent, text){ var e = document.createElement(tag); if(cls) e.className = cls; if(text != null) e.textContent = text; if(parent) parent.appendChild(e); return e; }
  function two(n){ return (n < 10 ? '0' : '') + n; }
  function href(slug){ return 'next.html?v=' + V + (slug ? '&p=' + slug : ''); }
  function paras(p){ var t = p.text || p.lede || ''; return Array.isArray(t) ? t : t ? [t] : []; }
  function credits(p, parent){
    var dl = el('dl', 'nx-cr', parent);
    (p.credits || []).forEach(function(r){ el('dt', '', dl, r[0]); el('dd', '', dl, r[1]); });
    return dl;
  }
  // the words, behind a "+": they come in from the right over a white sheet, his text exactly as written
  function words(p, btnParent){
    var b = el('button', 'nx-plus', btnParent, '+'); b.type = 'button'; b.setAttribute('aria-label', 'About this project');
    var pane = el('aside', 'nx-words', B);
    el('p', 'nx-k', pane, [place(p), year(p), p.group].filter(Boolean).join('   ·   '));
    el('h2', '', pane, p.title);
    if(p.lede && p.text) el('p', 'nx-lede', pane, p.lede);
    (p.text ? paras(p) : p.lede ? [] : []).forEach(function(t){ el('p', '', pane, t); });
    credits(p, pane);
    var x = el('button', 'nx-x', pane, '×'); x.type = 'button'; x.setAttribute('aria-label', 'Close');
    function set(o){ B.classList.toggle('words-open', o); b.textContent = o ? '−' : '+'; }
    b.addEventListener('click', function(){ set(!B.classList.contains('words-open')); });
    x.addEventListener('click', function(){ set(false); });
    addEventListener('keydown', function(e){ if(e.key === 'Escape') set(false); });
    return b;
  }
  // for comparing on the preview: the three ways, bottom right
  var sw = el('nav', 'nx-sw', B);
  VS.forEach(function(v){ var a = el('a', v === V ? 'on' : '', sw, v); a.href = 'next.html?v=' + v + (SLUG ? '&p=' + SLUG : ''); });

  // =====================================================================================================
  // depth: a corridor seen in perspective; the pictures hang at their own depth, left, right or ahead, and a
  // scroll (or swipe) walks forward. The nearest one is sharp and full; the far ones wait pale in the distance.
  // Projects without pictures yet stand in the space as their names.
  function buildDepth(){
    var items = [];
    if(SLUG){
      var p = P[SLUG];
      items.push({plate: true, slug: SLUG, head: true});
      pictures(SLUG).forEach(function(o){ items.push(o); });
      var nx = SLUGS[(SLUGS.indexOf(SLUG) + 1) % SLUGS.length];
      items.push({plate: true, slug: nx, next: true});
    } else {
      SLUGS.forEach(function(s){
        var got = picks(s);
        if(got.length) got.forEach(function(o){ items.push(o); }); else items.push({plate: true, slug: s});
      });
    }
    var view = el('div', 'dp-view', main), world = el('div', 'dp-world', view);
    var hud = el('div', 'dp-hud', main), hn = el('span', 'dp-n', hud), ht = el('a', 'dp-t', hud), hk = el('span', 'dp-k', hud);
    var bar = el('div', 'dp-bar', main), fill = el('i', '', bar);
    if(SLUG) words(P[SLUG], hud);
    var GAP = 1100, seed = 7; function rnd(){ seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
    var SIDES = [0, -1, 1, -1, 0, 1, 1, -1];
    load(items.filter(function(o){ return !o.plate; })).then(function(){
      items.forEach(function(o, i){
        var f = el('a', 'dp-fig' + (o.plate ? ' dp-plate' : ''), world); f.href = href(o.plate && !o.next && SLUG ? null : o.slug);
        if(o.plate){
          var q = P[o.slug];
          if(o.next) el('span', 'dp-pk', f, 'Next');
          el('span', 'dp-pt', f, q.title);
          el('span', 'dp-pk', f, [place(q), year(q)].join(', '));
          if(o.head && paras(q)[0]) el('span', 'dp-pl', f, q.lede || '');
          o.w = innerWidth <= 700 ? 260 : 360; o.h = 0;
        } else {
          var im = el('img', '', f); fallback(im, o.src); im.src = o.drawing ? o.src : thumb(o.src); im.alt = o.caption || P[o.slug].title;
          if(!o.drawing){ var big = new Image(); big.onload = function(){ im.src = o.src; }; big.src = o.src; }
          var vh = innerHeight, vw = innerWidth, phone = vw <= 700;
          o.w = Math.min(vw * (phone ? .78 : o.r >= 1.2 ? .46 : .3), vh * .56 * o.r); o.h = o.w / o.r;
          f.style.width = o.w + 'px';
        }
        var side = o.head ? -.75 : SLUG && i === 1 ? .55 : i === 0 ? 0 : SIDES[i % SIDES.length], phoneX = innerWidth <= 700 ? .12 : .26;
        o.x = side * innerWidth * phoneX + (rnd() - .5) * innerWidth * .05; o.y = (rnd() - .5) * innerHeight * .12; o.z = i * GAP;
        if(o.head && innerWidth <= 700){ o.x = -innerWidth * .08; o.y = -innerHeight * .2; }
        o.el = f;
        f.style.transform = 'translate3d(' + (o.x - (o.w || 0) / 2) + 'px,' + (o.y - (o.h || 0) / 2) + 'px,' + (-o.z) + 'px)';
      });
      var cam = 0, goal = 0, max = (items.length - 1) * GAP, cur = -1;
      function frame(){
        cam += (goal - cam) * .085; if(Math.abs(goal - cam) < .5) cam = goal;
        world.style.transform = 'translateZ(' + cam + 'px)';
        var best = 0, bd = 1e9;
        items.forEach(function(o, i){
          var d = o.z - cam;
          var op = d < -260 ? 0 : d < 0 ? 1 + d / 260 : Math.max(.06, 1 - d / (GAP * 4.2));
          o.el.style.opacity = op.toFixed(3);
          o.el.style.visibility = op <= .01 ? 'hidden' : 'visible';
          var ad = Math.abs(d + 80); if(ad < bd){ bd = ad; best = i; }
        });
        if(best !== cur){
          cur = best; var o = items[cur], q = P[o.slug];
          items.forEach(function(x, i){ x.el.classList.toggle('near', i === cur); });
          hn.textContent = two(SLUGS.indexOf(o.slug) + 1);
          ht.textContent = q.title; ht.href = href(o.slug); hk.textContent = [place(q), year(q)].join(', ');
          hud.classList.toggle('next', !!o.next);
        }
        fill.style.transform = 'scaleY(' + (max ? cam / max : 0).toFixed(4) + ')';
        requestAnimationFrame(frame);
      }
      frame();
      function step(d){ goal = Math.max(0, Math.min(max, goal + d)); }
      addEventListener('wheel', function(e){ e.preventDefault(); step((Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX) * 2.2); }, {passive: false});
      addEventListener('keydown', function(e){
        if(['ArrowDown', 'ArrowRight', 'PageDown', ' '].indexOf(e.key) > -1){ e.preventDefault(); goal = Math.min(max, Math.round(goal / GAP + 1) * GAP); }
        if(['ArrowUp', 'ArrowLeft', 'PageUp'].indexOf(e.key) > -1){ e.preventDefault(); goal = Math.max(0, Math.round(goal / GAP - 1) * GAP); }
      });
      var ty = null;
      view.addEventListener('touchstart', function(e){ ty = e.touches[0].clientY; }, {passive: true});
      view.addEventListener('touchmove', function(e){ e.preventDefault(); var y = e.touches[0].clientY; step((ty - y) * 4.5); ty = y; }, {passive: false});
    });
  }

  // =====================================================================================================
  // time: the years as one long ruler along the foot; each project stands at its year, its pictures above it on a
  // fine stem. A scroll travels along the line; a playhead in the middle reads the year and month under it.
  // In a project the same line runs through its pictures, one after another at one height.
  function buildTime(){
    var track = el('div', 'tm-track', main), rule = el('div', 'tm-rule', main), ruleIn = el('div', 'tm-rule-in', rule);
    var head = el('div', 'tm-head', main), readout = el('span', 'tm-read', head), name = el('a', 'tm-name', head);
    var vw = innerWidth, vh = innerHeight, phone = vw <= 700;
    var Y0, Y1, YW = phone ? vw * 1.3 : vw * .62, x0 = vw * .5;
    var marks = [];
    if(SLUG){
      var p = P[SLUG], list = pictures(SLUG);
      B.classList.add('tm-one');
      var intro = el('div', 'tm-intro', track); el('p', 'nx-k', intro, [place(p), year(p), p.group].join('   ·   ')); el('h1', '', intro, p.title);
      if(p.lede) el('p', 'tm-lede', intro, p.lede);
      words(p, intro);
      load(list).then(function(){
        var H = phone ? vh * .42 : vh * .56, x = (phone ? vw * .9 : vw * .42);
        intro.style.left = (phone ? vw * .06 : vw * .1) + 'px';
        list.forEach(function(o, i){
          var a = el('figure', 'tm-fig', track), im = el('img', '', a); im.src = o.src; im.alt = o.caption || p.title; im.loading = 'lazy';
          var w = H * o.r; a.style.left = x + 'px'; a.style.width = w + 'px'; a.style.height = H + 'px';
          el('figcaption', '', a, two(i + 1) + ' / ' + two(list.length));
          marks.push({x: x + w / 2, label: two(i + 1) + ' / ' + two(list.length)});
          x += w + (phone ? vw * .08 : vw * .06);
        });
        var nx = SLUGS[(SLUGS.indexOf(SLUG) + 1) % SLUGS.length], end = el('a', 'tm-next', track); end.href = href(nx);
        el('span', 'nx-k', end, 'Next'); el('span', '', end, P[nx].title); end.style.left = x + 'px';
        var total = x + vw * .4;
        for(var i = 0; i <= 40; i++){ var t = el('i', i % 10 ? '' : 'big', ruleIn); t.style.left = (total * i / 40) + 'px'; }
        run(total, function(at){ var m = marks.filter(function(m){ return m.x <= at + vw * .1; }).pop(); return m ? m.label : '00 / ' + two(list.length); }, function(){ return null; });
      });
      return;
    }
    var ys = SLUGS.map(function(s){ return year(P[s]); });
    Y0 = Math.min.apply(null, ys); Y1 = Math.max.apply(null, ys) + 1;
    var total = x0 + (Y1 - Y0) * YW + vw * .5;
    track.style.width = rule.style.width = total + 'px';
    for(var y = Y0; y <= Y1; y++){
      var X = x0 + (y - Y0) * YW, t = el('i', 'big', ruleIn); t.style.left = X + 'px'; el('b', '', t, y);
      if(y < Y1) for(var m = 1; m < 12; m++){ var tt = el('i', m === 6 ? 'mid' : '', ruleIn); tt.style.left = X + YW * m / 12 + 'px'; }
    }
    // projects of one year share it, spread across its months
    var byYear = {}; SLUGS.forEach(function(s){ (byYear[year(P[s])] = byYear[year(P[s])] || []).push(s); });
    var spots = [], seed = 3; function rnd(){ seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
    Object.keys(byYear).forEach(function(y){
      byYear[y].forEach(function(s, j){ spots.push({slug: s, x: x0 + (y - Y0) * YW + YW * (j + .5) / byYear[y].length}); });
    });
    var lift = [.1, .2, .04, .15];
    Promise.all(spots.map(function(sp){ return load(picks(sp.slug)).then(function(l){ sp.list = l; return sp; }); })).then(function(){
      spots.forEach(function(sp, k){
        var q = P[sp.slug], g = el('a', 'tm-spot', track); g.href = href(sp.slug); g.style.left = sp.x + 'px';
        var H = (phone ? vh * .3 : vh * .46) * (sp.list.length > 1 ? .8 : 1), up = lift[k % lift.length] * vh;
        var stack = el('div', 'tm-stack', g); stack.style.bottom = up + 'px';
        sp.list.forEach(function(o){ var im = el('img', '', stack); fallback(im, o.src); im.src = o.drawing ? o.src : thumb(o.src); im.alt = o.caption || q.title; im.style.height = H + 'px'; });
        if(!sp.list.length) stack.classList.add('empty');
        var stem = el('i', 'tm-stem', g); stem.style.height = up + 'px';
        var lab = el('span', 'tm-lab', g); el('b', '', lab, q.title); el('span', '', lab, place(q));
        lab.style.bottom = (up + (sp.list.length ? H + 10 : 0) + 6) + 'px';
        marks.push({x: sp.x, slug: sp.slug});
      });
      var first = spots.filter(function(sp){ return sp.list.length; })[0];
      var walk = run(total, function(at){
        var yy = Y0 + (at - x0) / YW; if(yy < Y0) yy = Y0; if(yy > Y1) yy = Y1;
        var Y = Math.floor(yy), M = Math.min(12, Math.floor((yy - Y) * 12) + 1); return Y + '.' + two(M);
      }, function(at){ var best = null, bd = 1e9; marks.forEach(function(m){ var d = Math.abs(m.x - at); if(d < bd){ bd = d; best = m; } }); return bd < YW * .5 ? best : null; });
      // start on the first project that has pictures, under the playhead
      if(first) walk.at(first.x - vw * .5);
    });
    function run(total, read, near){
      var max = Math.max(0, total - vw), pos = 0, goal = 0, cur = null;
      function frame(){
        pos += (goal - pos) * .09; if(Math.abs(goal - pos) < .3) pos = goal;
        track.style.transform = rule.style.transform = 'translateX(' + (-pos) + 'px)';
        var at = pos + vw * .5; readout.textContent = read(at);
        var n = near(at); if(n !== cur){ cur = n; name.textContent = n ? P[n.slug].title : ''; name.href = n ? href(n.slug) : '#'; }
        requestAnimationFrame(frame);
      }
      frame();
      addEventListener('wheel', function(e){ e.preventDefault(); goal = Math.max(0, Math.min(max, goal + (Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX) * 1.4)); }, {passive: false});
      addEventListener('keydown', function(e){
        if(e.key === 'ArrowRight' || e.key === 'ArrowDown') goal = Math.min(max, goal + vw * .4);
        if(e.key === 'ArrowLeft' || e.key === 'ArrowUp') goal = Math.max(0, goal - vw * .4);
      });
      var tx = null, ty = null;
      addEventListener('touchstart', function(e){ tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, {passive: true});
      addEventListener('touchmove', function(e){ var x = e.touches[0].clientX, y = e.touches[0].clientY; goal = Math.max(0, Math.min(max, goal + ((tx - x) + (ty - y)) * 1.6)); tx = x; ty = y; }, {passive: true});
      return {at: function(x){ goal = pos = Math.max(0, Math.min(max, x)); }};
    }
  }

  // =====================================================================================================
  // index: the work as a precise table (number, project, place, year, kind, pictures); pointing at a row shows its
  // picture in the frame on the right. A project is a sheet: its data and words held on the left, its pictures
  // running down the right at the column's width.
  function buildIndex(){
    if(SLUG){
      var p = P[SLUG], list = pictures(SLUG);
      var sheet = el('div', 'ix-sheet', main), side = el('aside', 'ix-side', sheet), col = el('div', 'ix-col', sheet);
      var back = el('a', 'ix-back', side, '← Index'); back.href = href(null);
      el('p', 'ix-no', side, two(SLUGS.indexOf(SLUG) + 1) + ' / ' + two(SLUGS.length));
      el('h1', '', side, p.title);
      var dl = el('dl', 'ix-data', side);
      [['Place', place(p)], ['Year', year(p)], ['Kind', p.group]].concat((p.credits || []).filter(function(r){ return ['Year', 'Location'].indexOf(r[0]) < 0; })).forEach(function(r){ el('dt', '', dl, r[0]); el('dd', '', dl, r[1]); });
      var tx = el('div', 'ix-text', side);
      if(p.lede && p.text) el('p', 'ix-lede', tx, p.lede);
      paras(p).forEach(function(t){ el('p', '', tx, t); });
      if(!list.length) el('div', 'ix-empty', col, 'Pictures in preparation');
      list.forEach(function(o, i){
        var f = el('figure', 'ix-fig', col), im = el('img', '', f); im.src = o.src; im.alt = o.caption || p.title; im.loading = i < 2 ? 'eager' : 'lazy';
        el('figcaption', '', f, two(i + 1));
      });
      var nx = SLUGS[(SLUGS.indexOf(SLUG) + 1) % SLUGS.length], end = el('a', 'ix-next', col); end.href = href(nx);
      el('span', '', end, 'Next'); el('b', '', end, P[nx].title);
      // the pictures appear as they come up, the number counting with them
      var io = new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } }); }, {rootMargin: '0px 0px -8% 0px'});
      col.querySelectorAll('.ix-fig').forEach(function(f){ io.observe(f); });
      return;
    }
    var wrap = el('div', 'ix', main), tbl = el('div', 'ix-tbl', wrap), frame = el('div', 'ix-frame', wrap);
    var hdr = el('div', 'ix-row ix-hdr', tbl); ['No.', 'Project', 'Place', 'Year', 'Kind', 'Pictures'].forEach(function(h){ el('span', '', hdr, h); });
    var shows = {}, curS = null;
    SLUGS.forEach(function(s, i){
      var q = P[s], n = pictures(s).length, r = el('a', 'ix-row', tbl); r.href = href(s); r.slug = s;
      [two(i + 1), q.title, place(q), year(q), q.group, n ? two(n) : '—'].forEach(function(t, j){ el('span', j === 1 ? 't' : '', r, t); });
      if(!n) r.classList.add('dim');
      r.addEventListener('mouseenter', function(){ show(s); });
      r.addEventListener('focus', function(){ show(s); });
    });
    var cap = el('p', 'ix-cap', frame);
    function show(s){
      if(s === curS) return; curS = s;
      tbl.querySelectorAll('.ix-row').forEach(function(r){ r.classList.toggle('on', r.slug === s); });
      frame.querySelectorAll('img.on').forEach(function(im){ im.classList.remove('on'); });
      var got = picks(s)[0];
      cap.textContent = got ? '' : P[s].title + '  —  pictures in preparation';
      if(!got) return;
      var im = shows[s];
      if(!im){ im = shows[s] = el('img', '', frame); fallback(im, got.src); im.src = got.drawing ? got.src : thumb(got.src); im.alt = got.caption || P[s].title; }
      requestAnimationFrame(function(){ im.classList.add('on'); });
    }
    var first = SLUGS.filter(function(s){ return pictures(s).length; });
    show(first[Math.floor(Math.random() * first.length)] || SLUGS[0]);
  }

  ({depth: buildDepth, time: buildTime, index: buildIndex})[V]();
})();
