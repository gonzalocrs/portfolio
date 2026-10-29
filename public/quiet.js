// The site (2026-10-26, the "quiet" round, first tried in mockups.html?v=a&l=quiet). index.html is the home, project.html
// one project (?p=<slug>, &i=<picture number> or &i=last). Projects come from projects.js; pictures are never cropped.
(function(){
  var P = window.PROJECTS || {}, SLUGS = Object.keys(P);
  var Q = new URLSearchParams(location.search);
  var main = document.getElementById('main');

  // ---- the project material: hero, diagram, drawings, models, photos, in that order ----
  function web(src){
    if(src === 'img/anticlastic-roof-structure/hero.jpg') return 'img/anticlastic-roof-structure/hero-web.jpg';
    return src.replace(/\/physical\/(?!web\/)([^\/]+)$/, '/physical/web/$1');
  }
  // the small copy next to a photo (tools/thumbs.sh); drawings are already light
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
        var dr = isDrawing(it);
        out.push({src: s, drawing: dr, kind: dr ? 'drawing' : /\/physical\//.test(s) ? 'physical' : 'photo', caption: it.caption || ''});
      });
    });
    return out;
  }
  function coverOf(slug){ var p = P[slug], all = pictures(slug); return all.length ? (p.cover ? {src: p.cover} : all[0]) : null; }
  function el(tag, cls, parent, text){ var e = document.createElement(tag); if(cls) e.className = cls; if(text != null) e.textContent = text; if(parent) parent.appendChild(e); return e; }
  function fader(st){
    var layers = [0, 1].map(function(){ return el('div', 'p-layer', st); });
    return function(build, instant){
      var on = layers[0].classList.contains('on') ? layers[0] : layers[1];
      var L = instant ? on : (on === layers[0] ? layers[1] : layers[0]);
      L.innerHTML = ''; build(L);
      if(L !== on) on.classList.remove('on');
      L.classList.add('on');
      return L;
    };
  }

  // home: the marks on the left, one picture on the right; the project's pictures pass one after another, its mark
  // filling as they go, then the next project. Pointing at a mark shows that project and holds it; the wheel,
  // the arrow keys or a swipe move from project to project; a click on the picture goes into it
  function quietMarks(nav, slug, href){
    var group = null, marks = [];
    SLUGS.forEach(function(s){
      var q = P[s], a = el('a', 'qk', nav); a.slug = s; a.href = href(s);
      if(group !== null && q.group !== group) a.classList.add('gs');
      group = q.group;
      el('i', '', a); el('span', '', a, q.title);
      // a length of its own for each project, the same on every visit (used by the signature ticks)
      a.style.setProperty('--len', (.35 + ((marks.length + 1) * .618034 % 1) * 1.45).toFixed(2) + 'rem');
      marks.push(a);
    });
    var ab = el('a', 'qk qa', nav); ab.href = 'about.html'; el('i', '', ab, '+'); el('span', '', ab, 'About');
    // fan ticks: each one knows how far it is from the current project, so the lean can grow with the distance
    if(TICK === 'fan'){
      var spread = function(){
        var c = -1; marks.forEach(function(m, i){ if(m.classList.contains('cur')) c = i; });
        marks.forEach(function(m, i){ m.style.setProperty('--d', c < 0 ? 0 : i - c); });
      };
      new MutationObserver(spread).observe(nav, {subtree: true, attributes: true, attributeFilter: ['class']});
      spread();
    }
    return marks;
  }
  // a dark project (projects.js "dark: true", trial 2026-10-29 with Joint's night render): while its picture is up, and
  // on its page, the whole page slowly goes dark (the ground near-black, the words and marks light). Drawings are never
  // inverted: they keep their own white
  function night(on){ document.body.classList.toggle('q-night', !!on); }
  function quietHref(s, i){ return 'project.html?p=' + s + (i ? '&i=' + i : ''); }
  // going into a project from a picture on the home (test, 2026-10-26): the page doesn't reload. The picture lifts off
  // the home and glides to its place in the project while the home fades away and the project fades in around it; the
  // address changes to the project's, and Back returns to the home. (The older homes, ?home=stage|flow, still just go.)
  var PAGE = document.body.getAttribute('data-page');
  // ticks (2026-10-29, his ask: "a new system for the menu ticks"): tilt is the default since he said "tick tilt was
  // good"; ?tick= tries another for the visit, ?tick=flat the straight ticks from before, ?tick=off back to tilt:
  // sign (each project's tick has its own length, like a signature or a barcode; the current one runs out long),
  // tilt (his pick, "reminds me of a record player": the current tick lies flat and runs out, the ones above it lean
  // up, the ones below lean down), fan (the same, the lean growing with the distance from the current one, like a fan
  // of lines), dot (a dot per project; the current one stretches into the line)
  // trial ?fade=on (2026-10-29, his ask: "make the bottom or top edge of the images fade with the background according
  // to their position"): on the home, kept for the visit, ?fade=off ends it
  var FADE = Q.get('fade');
  try{ if(FADE === 'off') sessionStorage.removeItem('gc-fade'); else if(FADE) sessionStorage.setItem('gc-fade', FADE); FADE = sessionStorage.getItem('gc-fade') || FADE; }catch(e){}
  if(FADE && FADE !== 'off') document.body.classList.add('fd');
  var TICK = Q.get('tick');
  try{ if(TICK === 'off') sessionStorage.removeItem('gc-tick'); else if(TICK) sessionStorage.setItem('gc-tick', TICK); TICK = sessionStorage.getItem('gc-tick'); }catch(e){}
  TICK = TICK && TICK !== 'off' ? TICK : 'tilt';
  if(['sign', 'tilt', 'fan', 'dot'].indexOf(TICK) > -1) document.body.classList.add('tk-' + TICK, TICK === 'fan' ? 'tk-tilt' : 'tk');
  function enter(img, href){ location.href = href; }
  function into(img, slug, k){
    if(PAGE !== 'home') return;
    PAGE = 'project';
    var r0 = img.getBoundingClientRect(), home = main.firstElementChild, hr = home.getBoundingClientRect();
    // the home stays where it is, on a layer of its own, to fade out; the project is laid out underneath, unseen, so the
    // picture knows where it lands before it sets off; then one motion: the picture flies (same pace and easing as the
    // pictures opening on the home), the home fades out and the project fades in around it
    var old = el('div', 'q-old', document.body);
    old.style.left = hr.left + 'px'; old.style.top = hr.top + 'px'; old.style.width = hr.width + 'px'; old.style.height = hr.height + 'px';
    old.appendChild(home);
    history.pushState({q: 'project'}, '', quietHref(slug, k ? k + 1 : 0));
    document.body.classList.remove('qh-one', 'in-unveil', 'in-rise');
    document.body.setAttribute('data-page', 'project');
    main.classList.add('q-away');
    buildQuietProject(slug, k);
    var target = document.querySelector('.p-layer.on img');
    function go(){
      var r1 = target ? target.getBoundingClientRect() : r0;
      var fly = el('img', 'q-fly', document.body); fly.src = img.src; fly.alt = '';
      fly.style.left = r1.left + 'px'; fly.style.top = r1.top + 'px'; fly.style.width = r1.width + 'px'; fly.style.height = r1.height + 'px';
      fly.style.transform = 'translate(' + (r0.left - r1.left) + 'px,' + (r0.top - r1.top) + 'px) scale(' + (r0.width / r1.width) + ',' + (r0.height / r1.height) + ')';
      img.style.visibility = 'hidden'; if(target) target.style.visibility = 'hidden';
      void fly.offsetWidth;
      fly.classList.add('go'); fly.style.transform = '';
      old.classList.add('out'); main.classList.remove('q-away');
      setTimeout(function(){ if(target) target.style.visibility = ''; fly.remove(); old.remove(); }, 1150);
    }
    if(!target || (target.complete && target.naturalWidth)) requestAnimationFrame(go);
    else { target.addEventListener('load', go); target.addEventListener('error', go); }
  }
  addEventListener('popstate', function(){ location.reload(); });
  function ratioOf(img){ return img.naturalWidth && img.naturalHeight ? img.naturalWidth / img.naturalHeight : 1.5; }
  function loadAll(list){
    return Promise.all(list.map(function(it){
      return new Promise(function(res){ var i = new Image(); i.onload = function(){ res({it: it, r: ratioOf(i)}); }; i.onerror = function(){ res({it: it, r: 1.5}); }; i.src = it.src; });
    }));
  }
  function buildQuiet(){
    var wrap = el('div', 'qt', main), nav = el('nav', 'qt-ticks', wrap), st = el('div', 'p-stage qt-stage', wrap), fade = fader(st);
    var marks = quietMarks(nav, null, function(s){ return quietHref(s); });
    var withPics = SLUGS.filter(coverOf), cur = null, list = [], at = 0, hold = false, timer = null, lock = 0;
    function markOf(s){ return marks.filter(function(m){ return m.slug === s; })[0]; }
    function paint(instant){
      var it = list[at], s = cur;
      fade(function(L){
        var e = it ? el('img', '', L) : el('div', 'plate', L, 'In preparation');
        if(it){ e.alt = P[s].title; e.src = it.src; }
        e.addEventListener('click', function(){ enter(it ? e : null, quietHref(s, at ? at + 1 : 0)); });
      }, instant);
      var m = markOf(cur); if(m) m.style.setProperty('--p', ((at + 1) / list.length).toFixed(3));
    }
    function show(s, instant){
      if(s === cur) return;
      cur = s; list = pictures(s); if(!list.length) list = [null]; at = 0;
      marks.forEach(function(m){ m.classList.toggle('cur', m.slug === s); if(m.slug !== s) m.style.removeProperty('--p'); });
      paint(instant);
      clearInterval(timer); timer = setInterval(tick, 3200);
    }
    function tick(){
      if(at + 1 < list.length){ at++; paint(); return; }
      if(hold){ at = 0; paint(); return; }
      step(1);
    }
    function step(d){ var i = withPics.indexOf(cur); show(withPics[(i + d + withPics.length) % withPics.length]); }
    marks.forEach(function(m){ m.addEventListener('mouseenter', function(){ show(m.slug); }); });
    [nav, st].forEach(function(x){
      x.addEventListener('mouseenter', function(){ hold = true; });
      x.addEventListener('mouseleave', function(){ hold = false; });
    });
    addEventListener('wheel', function(e){
      var d = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      if(Math.abs(d) < 8) return;
      e.preventDefault();
      var now = Date.now(); if(now - lock < 800) return; lock = now;
      step(d > 0 ? 1 : -1);
    }, {passive: false});
    addEventListener('keydown', function(e){
      if(e.key === 'ArrowDown' || e.key === 'ArrowRight'){ step(1); e.preventDefault(); }
      if(e.key === 'ArrowUp' || e.key === 'ArrowLeft'){ step(-1); e.preventDefault(); }
      if(e.key === 'Enter' && cur) location.href = quietHref(cur, at ? at + 1 : 0);
    });
    var sx = null;
    st.addEventListener('touchstart', function(e){ sx = e.touches[0].clientX; }, {passive: true});
    st.addEventListener('touchend', function(e){ if(sx == null) return; var dx = e.changedTouches[0].clientX - sx; sx = null; if(Math.abs(dx) > 40) step(dx < 0 ? 1 : -1); }, {passive: true});
    show(withPics[0], true);
    return {restart: function(){ clearInterval(timer); timer = setInterval(tick, 3200); }};
  }

  // home trial (?home=roll, 2026-10-26, after fernando-garrido.com/YARD-GROTESQUE): the page scrolls; every project's
  // pictures come one after another down the page, each alone (now and then two), set to the left, the right or near
  // the middle at its own size, with room between them, and each opens as it arrives. The marks stay put on the left;
  // the project passing has its name out and its mark filling. A mark scrolls to its project; a picture goes into it.
  //   &in=unveil  drawn open from its bottom edge (default)
  //   &in=rise    fades up into place
  //   &in=drift   unveiled, then each one moves at its own pace as the page rolls
  // the home shows one picture of each project (his note, 2026-10-29; it was one or two since 2026-10-26): his pick
  // (projects.js: home, the first one when it lists several), otherwise the project's first picture
  function homePicks(got, slug){
    if(!got.length) return [];
    var mine = (P[slug].home || []).map(function(src){
      var i = -1; got.some(function(o, j){ if(o.it.src === web(src)){ i = j; return true; } });
      return i < 0 ? null : {it: got[i].it, r: got[i].r, k0: i};
    }).filter(Boolean);
    return mine.length ? mine.slice(0, 1) : [{it: got[0].it, r: got[0].r, k0: 0}];
  }
  function buildRoll(){
    var IN = (Q.get('in') || 'unveil').toLowerCase(); if(['unveil', 'rise', 'drift'].indexOf(IN) === -1) IN = 'unveil';
    document.body.classList.add('qh-roll', 'in-' + IN);
    var wrap = el('div', 'qt', main), nav = el('nav', 'qt-ticks', wrap), flow = el('div', 'qr-flow', wrap);
    var marks = quietMarks(nav, null, function(s){ return quietHref(s); });
    var seed = 11; function rnd(){ seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
    function pick(a){ return a[Math.floor(rnd() * a.length)]; }
    var figs = [], cur = null, lastSide = null;
    // width by shape, as a share of the field: wide pictures larger, upright ones narrower; never taller than the screen
    function size(r){ return r >= 1.6 ? pick([58, 64, 72]) : r >= 1.15 ? pick([46, 52, 58]) : r >= .85 ? pick([38, 44]) : pick([30, 36]); }
    function side(){ var s; do { s = pick(['l', 'r', 'r', 'l', 'm']); } while(s === lastSide); lastSide = s; return s; }
    function fig(row, s, k, o, w){
      var f = el('figure', 'qr-fig', row), par = el('div', 'qr-par', f);
      f.style.width = 'min(' + w + '%, calc(' + (o.r * 74).toFixed(1) + 'vh))';
      var im = el('img', '', par); im.alt = o.it.caption || P[s].title; im.src = o.it.src;
      f.addEventListener('click', function(){ enter(im, quietHref(s, o.k0 ? o.k0 + 1 : 0)); });
      f.slug = s; f.k = k; par.speed = (rnd() - .5) * .22;
      figs.push(f); return f;
    }
    var withPics = SLUGS.filter(coverOf);
    Promise.all(withPics.map(function(s){ return loadAll(pictures(s)); })).then(function(all){
      all.forEach(function(got, j){
        got = homePicks(got, withPics[j]);
        var s = withPics[j], k = 0;
        while(k < got.length){
          var o = got[k], q = got[k + 1], row = el('div', 'qr-row', flow);
          row.style.marginTop = (j === 0 && k === 0) ? '0' : (k === 0 ? pick([34, 40]) : pick([14, 20, 26, 32])) + 'vh';
          if(k === 0 && j === 0){ row.classList.add('m'); fig(row, s, k, o, o.r >= 1.15 ? 70 : 40); k++; continue; }
          // now and then two smaller ones side by side, the second lower
          if(q && o.r < 1.6 && q.r < 1.6 && rnd() < .35){
            row.classList.add('two');
            fig(row, s, k, o, Math.min(size(o.r), 44));
            fig(row, s, k + 1, q, Math.min(size(q.r), 38)).style.marginTop = pick([12, 18, 24]) + 'vh';
            k += 2; continue;
          }
          var sd = side(); row.classList.add(sd);
          var f = fig(row, s, k, o, size(o.r));
          if(sd !== 'm') f.style[sd === 'l' ? 'marginLeft' : 'marginRight'] = pick([0, 4, 9]) + '%';
          k++;
        }
      });
      el('div', 'qr-end', flow);
      var io = new IntersectionObserver(function(es){
        es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
      }, {rootMargin: '0px 0px -10% 0px', threshold: .06});
      figs.forEach(function(f){ io.observe(f); });
      sync();
    });
    function markOf(s){ return marks.filter(function(m){ return m.slug === s; })[0]; }
    function sync(){
      var vh = innerHeight, best = null, bd = 1e9;
      figs.forEach(function(f){
        var b = f.getBoundingClientRect(), d = Math.abs(b.top + b.height / 2 - vh / 2);
        if(d < bd){ bd = d; best = f; }
        if(IN === 'drift' && innerWidth > 700){ var par = f.firstChild; par.style.transform = 'translateY(' + ((b.top + b.height / 2 - vh / 2) * par.speed).toFixed(1) + 'px)'; }
      });
      if(!best) return;
      var n = figs.filter(function(f){ return f.slug === best.slug; }).length;
      if(cur !== best.slug){
        cur = best.slug;
        marks.forEach(function(m){ m.classList.toggle('cur', m.slug === cur); if(m.slug !== cur) m.style.removeProperty('--p'); });
      }
      var m = markOf(cur); if(m) m.style.setProperty('--p', ((best.k + 1) / n).toFixed(3));
    }
    marks.forEach(function(m){
      m.addEventListener('click', function(e){
        var f = figs.filter(function(x){ return x.slug === m.slug; })[0];
        if(!f) return;
        e.preventDefault();
        var b = f.getBoundingClientRect();
        scrollTo({top: scrollY + b.top - Math.max(0, (innerHeight - b.height) / 2), behavior: 'smooth'});
      });
    });
    addEventListener('scroll', sync, {passive: true});
    addEventListener('resize', sync);
    if(withPics[0]){ var m0 = markOf(withPics[0]); if(m0){ m0.classList.add('cur'); cur = withPics[0]; } }
  }

  // home trial ?home=roll, one at a time (2026-10-26, his follow-up: "each time i scroll one fades and another
  // appears, don't make two appear at the same time"): the same placing (left, right or near the middle, its own size and
  // height), but there is only ever one picture: a scroll fades it out as it rises away and the next one opens up out of
  // its bottom edge somewhere else. The page itself doesn't move. Back with a scroll up. &flow keeps the scrolling page.
  function buildRollOne(){
    var IN = (Q.get('in') || 'unveil').toLowerCase(); if(['unveil', 'rise'].indexOf(IN) === -1) IN = 'unveil';
    document.body.classList.add('qh-one', 'in-' + IN);
    var wrap = el('div', 'qt', main), nav = el('nav', 'qt-ticks', wrap), st = el('div', 'qo-stage', wrap);
    var marks = quietMarks(nav, null, function(s){ return quietHref(s); });
    var seed = 11; function rnd(){ seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
    function pick(a){ return a[Math.floor(rnd() * a.length)]; }
    var seq = [], at = -1, curEl = null, lastStep = 0, lastWheel = 0, lastSide = null;
    function size(r){ return r >= 1.6 ? pick([62, 70, 78]) : r >= 1.15 ? pick([50, 56, 62]) : r >= .85 ? pick([40, 46]) : pick([32, 38]); }
    function side(){ var s; do { s = pick(['l', 'r', 'r', 'l', 'm']); } while(s === lastSide); lastSide = s; return s; }
    function markOf(s){ return marks.filter(function(m){ return m.slug === s; })[0]; }
    // where a picture stands: its width and its height on the screen are chosen once, the pixels worked out each time
    function place(f, o){
      var W = st.clientWidth, H = st.clientHeight, phone = innerWidth <= 700;
      var w = Math.min(W * (phone ? o.pw : o.w) / 100, H * (phone ? .8 : .72) * o.r), h = w / o.r;
      var room = Math.max(0, W - w), x = o.side === 'l' ? room * o.off : o.side === 'r' ? room * (1 - o.off) : room / 2 + (o.off - .1) * room * .4;
      f.style.width = w + 'px'; f.style.left = Math.max(0, Math.min(room, x)) + 'px'; f.style.top = (Math.max(0, H - h) * o.y) + 'px';
      // trial ?fade=on: the edge nearer the top or bottom of the screen dissolves into the page, more the nearer it is
      var c = (Math.max(0, H - h) * o.y + h / 2) / H - .5;
      f.classList.toggle('fade-top', c < 0); f.classList.toggle('fade-bottom', c >= 0);
      f.style.setProperty('--fade', Math.min(50, 18 + Math.abs(c) * 2 * 45).toFixed(1) + '%');
    }
    function show(i, d){
      if(!seq.length) return;
      i = (i + seq.length) % seq.length;
      var o = seq[i], old = curEl;
      if(old){ old.classList.remove('in'); old.classList.add('out', d < 0 ? 'down' : 'up'); setTimeout(function(){ old.remove(); }, 1100); }
      var f = el('figure', 'qo-fig' + (d < 0 ? ' from-up' : ''), st); f.o = o;
      var im = el('img', '', f); im.alt = o.it.caption || P[o.slug].title; im.src = o.it.src;
      f.addEventListener('click', function(){ into(im, o.slug, o.k0); });
      place(f, o);
      setTimeout(function(){ f.classList.add('in'); }, old && !flipping ? 420 : 30);
      curEl = f; at = i;
      night(P[o.slug].dark);
      marks.forEach(function(m){ m.classList.toggle('cur', m.slug === o.slug); if(m.slug !== o.slug) m.style.removeProperty('--p'); });
      var m = markOf(o.slug); if(m) m.style.setProperty('--p', ((o.k + 1) / o.n).toFixed(3));
    }
    // flipping (his note, 2026-10-29: "if i keep scrolling i will keep passing them, like records"): there is no wait
    // between steps; when steps follow each other closely the pictures pass quickly (short fades), and once the scroll
    // stops the page goes back to the slow opening for the next step
    var flipping = false, flipT = 0;
    function step(d){
      var now = Date.now(); if(now - lastStep < 340) return;
      flipping = now - lastStep < 900; lastStep = now;
      document.body.classList.toggle('qo-flip', flipping);
      clearTimeout(flipT); flipT = setTimeout(function(){ flipping = false; document.body.classList.remove('qo-flip'); }, 900);
      show(at + d, d);
    }
    var withPics = SLUGS.filter(coverOf);
    // each visit opens on a different project (his call, 2026-10-26: "i always see sierra"): picked at random, never the
    // one the last visit opened on; scrolling then goes on through the others in the usual order and comes round again
    var last = null; try { last = localStorage.getItem('gc-first'); } catch(e){}
    var firsts = withPics.filter(function(s){ return s !== last; }); if(!firsts.length) firsts = withPics;
    var first = firsts[Math.floor(Math.random() * firsts.length)];
    try { localStorage.setItem('gc-first', first); } catch(e){}
    Promise.all(withPics.map(function(s){ return loadAll(pictures(s)); })).then(function(all){
      var start = 0;
      all.forEach(function(got, j){
        got = homePicks(got, withPics[j]);
        got.forEach(function(o, k){
          var lead = withPics[j] === first && k === 0, sd = lead ? 'm' : side();
          if(lead) start = seq.length;
          seq.push({it: o.it, r: o.r, slug: withPics[j], k: k, k0: o.k0, n: got.length, side: sd, w: lead ? (o.r >= 1.15 ? 72 : 44) : size(o.r),
            pw: pick([78, 86, 94]), off: pick([0, .06, .12]), y: sd === 'm' ? .45 : pick([.15, .35, .55, .8])});
        });
      });
      show(start, 1);
    });
    marks.forEach(function(m){
      m.addEventListener('click', function(e){
        var i = -1; seq.some(function(o, j){ if(o.slug === m.slug){ i = j; return true; } });
        if(i < 0) return;
        e.preventDefault(); if(i !== at){ lastStep = Date.now(); show(i, i > at ? 1 : -1); }
      });
    });
    // a new push of the wheel steps at once; while the scroll goes on (a trackpad's glide included) every further stretch
    // of it steps again, so a long scroll keeps passing pictures and a short one moves just one
    var lastD = 0, run = 0, STRETCH = 440;
    addEventListener('wheel', function(e){
      if(PAGE !== 'home') return;
      e.preventDefault();
      var d = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX, now = Date.now(), gap = now - lastWheel;
      if(e.deltaMode === 1) d *= 40;
      lastWheel = now;
      var fresh = gap > 220 || (d > 0) !== (lastD > 0);
      lastD = d;
      if(Math.abs(d) < 2) return;
      if(fresh){ run = 0; if(Math.abs(d) >= 6) step(d > 0 ? 1 : -1); return; }
      run += Math.max(-60, Math.min(60, d));
      if(Math.abs(run) >= STRETCH){ run = 0; step(d > 0 ? 1 : -1); }
    }, {passive: false});
    addEventListener('keydown', function(e){
      if(PAGE !== 'home') return;
      if(['ArrowDown', 'ArrowRight', 'PageDown', ' '].indexOf(e.key) > -1){ step(1); e.preventDefault(); }
      if(['ArrowUp', 'ArrowLeft', 'PageUp'].indexOf(e.key) > -1){ step(-1); e.preventDefault(); }
      if(e.key === 'Enter' && curEl) curEl.click();
    });
    var sy = null, sx = null;
    st.addEventListener('touchstart', function(e){ sy = e.touches[0].clientY; sx = e.touches[0].clientX; }, {passive: true});
    st.addEventListener('touchmove', function(e){ e.preventDefault(); }, {passive: false});
    st.addEventListener('touchend', function(e){
      if(sy == null) return;
      var dy = e.changedTouches[0].clientY - sy, dx = e.changedTouches[0].clientX - sx; sy = sx = null;
      var d = Math.abs(dy) > Math.abs(dx) ? dy : dx;
      if(Math.abs(d) > 35) step(d < 0 ? 1 : -1);
    }, {passive: true});
    addEventListener('resize', function(){ if(PAGE === 'home' && curEl) place(curEl, curEl.o); });
  }

  // a project: the same marks, its own opened into one mark per picture; one picture at a time, as large as fits.
  // A click on the right half of the picture goes on, the left half back (the pointer shows which); the wheel,
  // arrow keys and a swipe do the same; it stops at the first and last picture. "+" shows the words.
  // a caption for a picture that has none yet (to be replaced by his own): what kind of picture it is
  function kindOf(it){
    if(/render/i.test(it.src)) return 'Render';
    return it.kind === 'drawing' ? 'Drawing' : it.kind === 'physical' ? 'Physical model' : 'Photograph';
  }
  addEventListener('resize', function(){ Array.prototype.forEach.call(document.querySelectorAll('.qf'), function(f){ if(f.fit) f.fit(); }); });
  function buildQuietProject(slug, startAt){
    var p = P[slug], all = pictures(slug), n = Math.max(1, all.length);
    var i0 = SLUGS.indexOf(slug);
    document.title = p.title + ' — Gonzalo Cáceres';
    document.body.classList.add('qh-proj');
    night(p.dark);
    var wrap = el('div', 'qt qp', main), nav = el('nav', 'qt-ticks', wrap), st = el('div', 'p-stage qt-stage', wrap), fade = fader(st);
    var marks = quietMarks(nav, slug, function(s){ return quietHref(s); }), me = marks[i0];
    me.classList.add('cur'); me.removeAttribute('href'); me.style.setProperty('--p', 1);
    var plus = el('button', 'qp-plus', me.querySelector('span'), '+'); plus.type = 'button'; plus.setAttribute('aria-label', 'About this project');
    var subs = el('div', 'qp-subs', nav); nav.insertBefore(subs, me.nextSibling);
    var dots = [];
    for(var k = 0; k < n; k++){ (function(k){ var b = el('button', 'qs', subs); b.type = 'button'; el('i', '', b); b.setAttribute('aria-label', 'Picture ' + (k + 1)); b.addEventListener('click', function(){ go(k); }); dots.push(b); })(k); }
    // the words, behind the "+", opened one of four ways (&d=, see the CSS); on a phone always the floating card
    var D = (Q.get('d') || 'beside').toLowerCase(); if(['fold', 'beside'].indexOf(D) === -1) D = 'beside';   // fold: by address only
    if(innerWidth <= 700) D = 'float';
    wrap.classList.add('qd-' + D);
    var card = el('aside', 'qp-card', st), meta = el('div', 'meta', card);
    el('span', 'k', meta, p.kicker || '');
    var cr = el('div', 'cr', meta);
    (p.credits || []).forEach(function(r){ if(r[0] === 'Year') return; var c = el('p', '', cr); el('b', '', c, r[0]); c.appendChild(document.createTextNode('  ' + r[1])); });
    var tx = el('div', 'tx', card);
    (p.lede ? [p.lede] : []).concat(p.text ? (Array.isArray(p.text) ? p.text : [p.text]) : []).forEach(function(t, i){ el('p', p.lede && i === 0 ? 'lede' : '', tx, t); });
    var nameEl = me.querySelector('span'), rule = D === 'fold' ? el('div', 'qd-rule', st) : null, T = [];
    function nameY(){ var a = nameEl.getBoundingClientRect(), b = st.getBoundingClientRect(); return Math.max(0, Math.round(a.top + a.height / 2 - b.top)); }
    function curImg(){ return st.querySelector('.p-layer.on img, .p-layer.on .plate'); }
    function isOpen(){ return wrap.classList.contains('open'); }
    // beside: the words start a short, fixed step after the "+" (whatever the width of the window), the kicker on the
    // name's line; the picture follows a little after the words
    function placeBeside(){
      var pr = plus.getBoundingClientRect(), sr = st.getBoundingClientRect(), rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
      var x = pr.right + 2.2 * rem, w = Math.max(15 * rem, Math.min(21 * rem, sr.right - x - 14 * rem));
      st.style.setProperty('--cx', Math.round(x - sr.left) + 'px');
      st.style.setProperty('--cw', Math.round(w) + 'px');
      st.style.setProperty('--px', Math.round(x - sr.left + w + 3 * rem) + 'px');
      st.style.setProperty('--ny', (nameY() - 8) + 'px');
    }
    addEventListener('resize', function(){ if(D === 'beside' && isOpen()) placeBeside(); });
    function toggle(on){
      on = on == null ? !isOpen() : on;
      if(on === isOpen()) return;
      st.style.setProperty('--ny', nameY() + 'px');
      if(D === 'beside') placeBeside();
      if(D !== 'fold'){ wrap.classList.toggle('open', on); return; }
      // fold: the picture closes into its middle line, the line rises to the name, the words come in under it and the
      // picture opens again beside them, out of a line; closing just lets the words go and the picture slide back
      T.forEach(clearTimeout); T = [];
      if(!on){
        wrap.classList.remove('shown', 'open'); rule.style.opacity = '0';
        st.querySelectorAll('.p-layer').forEach(function(L){ L.style.transition = 'opacity 1.1s ease, left .6s cubic-bezier(.2,.7,.2,1)'; });
        T.push(setTimeout(function(){ st.querySelectorAll('.p-layer').forEach(function(L){ L.style.transition = ''; }); }, 700));
        return;
      }
      var im = curImg(), sr = st.getBoundingClientRect(), r = im ? im.getBoundingClientRect() : sr;
      function put(o){ rule.style.top = o.top; rule.style.left = o.left; rule.style.width = o.width; }
      wrap.classList.add('open');
      rule.style.transition = 'none'; put({top: (r.top - sr.top + r.height / 2) + 'px', left: (r.left - sr.left) + 'px', width: r.width + 'px'});
      void rule.offsetWidth; rule.style.transition = ''; rule.style.opacity = '1';
      if(im) im.style.clipPath = 'inset(50% 0 50% 0)';
      T.push(setTimeout(function(){ put({top: nameY() + 'px', left: '0px', width: Math.min(sr.width, card.offsetWidth || 336) + 'px'}); }, 380));
      T.push(setTimeout(function(){
        wrap.classList.add('shown');
        if(im){ void im.offsetWidth; im.style.clipPath = 'inset(0 0 0 0)'; T.push(setTimeout(function(){ im.style.clipPath = ''; }, 450)); }
      }, 760));
    }
    plus.addEventListener('click', function(e){ e.stopPropagation(); toggle(); });
    card.addEventListener('click', function(e){ e.stopPropagation(); });
    var at = -1, lock = 0;
    // how the page shows there is more above or below (test, 2026-10-26; the pictures go by vertically, so no side
    // arrows): &nav=
    //   chev  a thin chevron centred over the picture area (back) and one under it (on); each hides at its end
    //   hint  only on arrival: a short line drawing down under the picture with "Scroll"; gone after the first step
    //   none  nothing but the small marks in the index (his pick, 2026-10-26)
    var NAV = (Q.get('nav') || 'none').toLowerCase(); if(['chev', 'hint', 'none'].indexOf(NAV) === -1) NAV = 'none';
    wrap.classList.add('qnav-' + NAV);
    var up = null, dn = null, hint = null;
    if(NAV === 'chev'){
      up = el('button', 'qv up', st); dn = el('button', 'qv dn', st); up.type = dn.type = 'button';
      up.setAttribute('aria-label', 'Previous picture'); dn.setAttribute('aria-label', 'Next picture');
      up.innerHTML = '<svg viewBox="0 0 28 12" width="28" height="12"><path d="M2 11L14 1l12 10"/></svg>';
      dn.innerHTML = '<svg viewBox="0 0 28 12" width="28" height="12"><path d="M2 1l12 10L26 1"/></svg>';
      up.addEventListener('click', function(e){ e.stopPropagation(); go(at - 1); });
      dn.addEventListener('click', function(e){ e.stopPropagation(); go(at + 1); });
    }
    if(NAV === 'hint' && n > 1){
      hint = el('button', 'qv-hint', st); hint.type = 'button';
      el('span', 'k', hint, 'Scroll'); el('i', '', hint);
      hint.addEventListener('click', function(e){ e.stopPropagation(); go(at + 1); });
    }
    function go(k){
      // a project ends at its last picture (his call, 2026-10-26): no scrolling on into the next one; the marks go there
      if(k >= n || k < 0) return;
      if(k === at) return;
      var first = at < 0; at = k;
      fade(function(L){
        var it = all[k];
        // the picture, smaller than the space and centred, with its caption centred under it (drawings carry their own
        // white margins, so a caption set from the picture's edge would look off)
        var f = el('figure', 'qf', L);
        if(it){
          var im = el('img', '', f); im.alt = it.caption || p.title; im.src = it.src;
          // no captions under the pictures (his call, 2026-10-26: first the photos, then the drawings too); the caption text
          // stays in projects.js as the picture's alt text
          var cap = null;
          var fit = function(){ if(cap) cap.style.width = im.offsetWidth ? im.offsetWidth + 'px' : ''; };
          im.addEventListener('load', fit); f.fit = fit;
        }
        else el('div', 'plate', f, 'In preparation');
      }, first);
      dots.forEach(function(d, j){ d.classList.toggle('cur', j === k); });
      if(up){ up.classList.toggle('off', k === 0); dn.classList.toggle('off', k === n - 1); }
      if(hint && !first) hint.classList.add('off');
    }
    st.addEventListener('click', function(e){
      if(isOpen() && D === 'float'){ toggle(false); return; }
      var r = st.getBoundingClientRect(); go(at + (e.clientX < r.left + r.width * .35 ? -1 : 1));
    });
    addEventListener('wheel', function(e){
      if(card.contains(e.target) && card.scrollHeight > card.clientHeight) return;
      var d = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      if(Math.abs(d) < 8) return;
      e.preventDefault();
      var now = Date.now(); if(now - lock < 750) return; lock = now;
      go(at + (d > 0 ? 1 : -1));
    }, {passive: false});
    addEventListener('keydown', function(e){
      if(e.key === 'ArrowDown' || e.key === 'ArrowRight'){ go(at + 1); e.preventDefault(); }
      if(e.key === 'ArrowUp' || e.key === 'ArrowLeft'){ go(at - 1); e.preventDefault(); }
      if(e.key === 'Escape'){ if(isOpen()) toggle(false); else location.href = '/'; }
    });
    var sx = null;
    st.addEventListener('touchstart', function(e){ sx = e.touches[0].clientX; }, {passive: true});
    st.addEventListener('touchend', function(e){ if(sx == null) return; var dx = e.changedTouches[0].clientX - sx; sx = null; if(Math.abs(dx) > 40) go(at + (dx < 0 ? 1 : -1)); }, {passive: true});
    var start = Q.get('i'); go(startAt != null ? Math.min(n - 1, startAt) : start === 'last' ? n - 1 : Math.max(0, Math.min(n - 1, (parseInt(start, 10) || 1) - 1)));
  }

  // the intro. The old one (the name large in the middle, its letters flipping in like an airport board, then
  // gliding to the header) is replaced by something quieter. He kept line (2026-10-26); marks stays reachable by address:
  //   line   one thin line draws across where the picture will be; the picture opens up and down out of it while the
  //          marks draw in one by one; then the name
  //   marks  an empty page; the ten marks draw in one by one, top to bottom; then the name; then the picture
  // Once per visit; ?intro plays it again.
  function quietIntro(home){
    var kind = (Q.get('intro') || 'line').toLowerCase();
    if(kind === 'off' || kind === 'none') return;
    if(kind !== 'marks') kind = 'line';
    var forced = Q.has('intro');
    try{ if(!forced && sessionStorage.getItem('gc-qintro') === '1') return; sessionStorage.setItem('gc-qintro', '1'); }catch(e){}
    if(matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var b = document.body, marks = Array.prototype.slice.call(document.querySelectorAll('.qt-ticks > .qk')), st = document.querySelector('.qt-stage');
    var T = [];
    function later(fn, ms){ T.push(setTimeout(fn, ms)); }
    b.classList.add('qi', 'qi-' + kind);
    marks.forEach(function(m, i){ m.style.setProperty('--d', (i * 70) + 'ms'); });
    function img(){ return st.querySelector('.p-layer.on img, .p-layer.on .plate'); }
    function end(){
      b.classList.remove('qi', 'qi-' + kind, 'qi-marks-in', 'qi-name-in', 'qi-pic-in', 'qi-line-in', 'qi-open');
      marks.forEach(function(m){ m.style.removeProperty('--d'); });
      var im = img(); if(im) im.style.clipPath = '';
      var ln = document.querySelector('.qi-rule'); if(ln) ln.remove();
      home.restart();
    }
    if(kind === 'marks'){
      later(function(){ b.classList.add('qi-marks-in'); }, 150);
      later(function(){ b.classList.add('qi-name-in'); }, 1000);
      later(function(){ b.classList.add('qi-pic-in'); }, 1400);
      later(end, 2700);
      return;
    }
    // line: wait for the first picture to know its size (never long)
    var started = false;
    function go(){
      if(started) return; started = true;
      var im = img(), sr = st.getBoundingClientRect(), r = im ? im.getBoundingClientRect() : sr;
      var ln = el('div', 'qi-rule', st);
      ln.style.left = (r.left - sr.left) + 'px'; ln.style.width = r.width + 'px'; ln.style.top = (r.top - sr.top + r.height / 2) + 'px';
      if(im){ im.style.transition = 'none'; im.style.clipPath = 'inset(50% 0 50% 0)'; }
      b.classList.add('qi-pic-in');
      later(function(){ b.classList.add('qi-line-in'); }, 80);
      later(function(){
        if(im){ im.style.transition = 'clip-path 1.25s cubic-bezier(.7,0,.2,1)'; im.style.clipPath = 'inset(0 0 0 0)'; }
        b.classList.add('qi-open', 'qi-marks-in');
      }, 1000);
      later(function(){ b.classList.add('qi-name-in'); }, 1900);
      later(function(){ if(im) im.style.transition = ''; end(); }, 3000);
    }
    var im0 = img();
    if(im0 && im0.tagName === 'IMG' && !im0.complete){ im0.addEventListener('load', go); setTimeout(go, 1200); }
    else setTimeout(go, 30);
  }

  // About (2026-10-26): the marks with About open; his words stand where a project's words do, the GCV mark where the
  // picture would be. "Get in touch +" or a scroll down opens the mark to the right: a topic beside each of its three
  // right-hand stitches, the fields beside them (the sending itself is contact.js); the ×, a scroll up or Esc closes it
  function buildAbout(){
    var wrap = document.querySelector('.qab'), nav = wrap.querySelector('.qt-ticks');
    quietMarks(nav, null, function(s){ return quietHref(s); });
    var ab = nav.querySelector('.qk.qa'); ab.classList.add('cur'); ab.setAttribute('aria-current', 'page');
    var touch = document.getElementById('touch'), lock = 0;
    function isOpen(){ return wrap.classList.contains('open'); }
    function toggle(on){
      on = on == null ? !isOpen() : on;
      if(on === isOpen()) return;
      wrap.classList.toggle('open', on);
      touch.querySelector('span').textContent = on ? 'Close' : 'Get in touch';
      layout();
      if(on) setTimeout(function(){ var c = wrap.querySelector('.choice'); if(c && innerWidth > 700) c.focus({preventScroll: true}); }, 500);
    }
    // the layout, as on the About page before (2026-10-18, his pick "A"): each topic's word beside its stitch
    var side = wrap.querySelector('.qab-side'), mark = wrap.querySelector('.qab-mark'), flds = wrap.querySelector('.qab-fields'),
        flow = document.getElementById('flow'), words = Array.prototype.slice.call(wrap.querySelectorAll('.choice')), hov = -1;
    function tones(){
      var m = window.gcMark, open = isOpen() && !flow.classList.contains('sent');
      if(m) words.forEach(function(b, i){ m.tone(i, !open || b.getAttribute('aria-pressed') === 'true' ? 1 : hov === i ? .55 : 0); });
    }
    function layout(){
      if(innerWidth <= 700){ [mark, touch, flds].concat(words).forEach(function(e){ e.style.transform = ''; }); tones(); return; }
      var on = isOpen(), W = side.clientWidth, S = mark.offsetWidth;
      var cx0 = mark.offsetLeft + S / 2, cy = mark.offsetTop + S / 2;
      // the group, centred in the space: the ring; each word the same small step out from the ring, level with its
      // stitch (top right and bottom right at 45°, right in the middle), so the three follow the ring's curve; a wider
      // step, then the fields. The ring is 70 of the mark's 200 units (logo-works.js RING)
      var rem = parseFloat(getComputedStyle(document.documentElement).fontSize), ring = .35, g1 = 2.2 * rem, gap = 3.5 * rem;
      var ANG = [-45, 0, 45], fw = flds.offsetWidth;
      // how far right of the ring's centre the words reach, for a ring of radius r
      function reach(r){ return Math.max.apply(null, words.map(function(b, i){ return r * Math.cos(ANG[i] * Math.PI / 180) + g1 + b.offsetWidth; })); }
      // on a narrower window the open mark and form take the whole room and his words step back meanwhile
      var x0 = 0, need = function(k){ return ring * S * k + reach(ring * S * k) + gap + fw; }, full = on && need(.55) > W;
      wrap.classList.toggle('full', full);
      if(full){ x0 = -side.offsetLeft; W += side.offsetLeft; }
      var k = 1; while(k > .3 && (need(k) > W || S * k > W * .42)) k -= .02;
      var R = S * k, r = ring * R, gx = x0 + Math.max(0, (W - need(k)) / 2), rx = gx + r;
      mark.style.transform = on ? 'translate(' + Math.round(rx - cx0) + 'px,0) scale(' + k.toFixed(3) + ')' : '';
      touch.style.transform = on ? 'translate(' + Math.round(rx - cx0) + 'px,' + Math.round(-ring * (S - R)) + 'px)' : '';
      words.forEach(function(b, i){
        var a = ANG[i] * Math.PI / 180, x = rx + r * Math.cos(a) + g1, y = cy + r * Math.sin(a) - b.offsetHeight / 2;
        b.style.transform = 'translate(' + Math.round(x + (on ? 0 : -16)) + 'px,' + Math.round(y) + 'px)'; b.tabIndex = on ? 0 : -1;
      });
      var wx = rx, ww = reach(r);
      flds.style.transform = 'translate(' + Math.round(wx + ww + gap + (on ? 0 : 30)) + 'px,' + Math.round(cy - flds.offsetHeight / 2) + 'px)';
      tones();
    }
    words.forEach(function(b, i){
      b.addEventListener('click', function(){ setTimeout(tones, 0); });
      b.addEventListener('mouseenter', function(){ hov = i; tones(); });
      b.addEventListener('mouseleave', function(){ hov = -1; tones(); });
    });
    new MutationObserver(tones).observe(flow, {attributes: true, attributeFilter: ['class']});
    addEventListener('resize', layout);
    if(document.fonts) document.fonts.ready.then(layout);
    [mark, touch, flds].concat(words).forEach(function(e){ e.style.transition = 'none'; });
    layout(); void side.offsetWidth;
    [mark, touch, flds].concat(words).forEach(function(e){ e.style.transition = ''; });
    touch.addEventListener('click', function(){ toggle(); });
    addEventListener('wheel', function(e){
      if(innerWidth <= 700) return;
      var t = e.target;
      if(t.tagName === 'TEXTAREA' && t.scrollHeight > t.clientHeight) return;
      e.preventDefault();
      if(Math.abs(e.deltaY) < 8) return;
      var now = Date.now(); if(now - lock < 800) return; lock = now;
      toggle(e.deltaY > 0);
    }, {passive: false});
    addEventListener('keydown', function(e){
      if(/INPUT|TEXTAREA/.test(document.activeElement.tagName)){ if(e.key === 'Escape') document.activeElement.blur(); return; }
      if(e.key === 'Escape') toggle(false);
      if(e.key === 'ArrowDown' || e.key === 'PageDown'){ toggle(true); e.preventDefault(); }
      if(e.key === 'ArrowUp' || e.key === 'PageUp'){ toggle(false); e.preventDefault(); }
    });
  }

  if(document.body.getAttribute('data-page') === 'about'){ buildAbout(); return; }
  if(document.body.getAttribute('data-page') === 'project'){
    var slug = Q.get('p');
    if(!P[slug]){ location.replace('/'); return; }
    buildQuietProject(slug);
  } else {
    // old addresses of a project on the home page (?show= / ?open=) go to its page
    var old = Q.get('show') || Q.get('open');
    if(old && P[old]){ location.replace(quietHref(old)); return; }
    // the home (published 2026-10-26): one picture at a time, a scroll fades it and the next opens somewhere else.
    // The earlier homes stay reachable: ?home=stage (marks + one large picture passing by itself, with the line intro)
    // and ?home=flow (the pictures down a scrolling page)
    var H = (Q.get('home') || '').toLowerCase();
    if(H === 'stage') quietIntro(buildQuiet());
    else if(H === 'flow' || Q.has('flow')) buildRoll();
    else buildRollOne();
  }
})();
