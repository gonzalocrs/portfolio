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
    // inOrder: the grid's own order after the hero, drawings and renders mixed (Joint, his order, 2026-10-29)
    if(p.inOrder && grid.length){ drawings = grid; physical = []; photos = []; }
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
  // trial ?words= (2026-10-29, his note on the project words behind the "+": "i don't like how it is"); the words stay
  // his, only how they are set changes: label (credits as a quiet two-column label, a hairline, the text lighter and
  // more open), lede (credits on one small line, the first paragraph set large, the rest small), mono (all in the mono
  // face, like a data sheet), plain (no credits, only the place and year over his paragraphs, set a little larger),
  // first (the first sentence of each paragraph in full ink, the rest lighter), bare / line / tail (the
  // credits kept minimal, see the CSS), mix (his pick, 2026-10-29: label's credits with first's text; the default on
  // this preview); kept for the visit, ?words=off shows the live setting
  var WORDS = Q.get('words');
  try{ if(WORDS) sessionStorage.setItem('gc-words', WORDS); WORDS = sessionStorage.getItem('gc-words'); }catch(e){}
  WORDS = WORDS || 'mix';
  if(['label', 'lede', 'mono', 'plain', 'first', 'bare', 'line', 'tail', 'mix'].indexOf(WORDS) > -1) document.body.classList.add('wd-' + WORDS);
  // trial ?back= (2026-11-01, his ask: "a way to show all the images at once, like the gallery before or like the back
  // side of the record"): a project's side B, all its pictures at once, reached by a small "B" under its lines or by
  // scrolling on past the last picture; a click on one turns the record back to that picture. Four ways:
  //   sheet   the picture turns over and its back is a contact sheet: every picture uncropped, in even rows (default)
  //   sleeve  the back of a record sleeve: a strict grid, each picture in its own square with its track number (A1, A2...)
  //   crate   the pictures stand in a row like records in a crate, leaning; pointing at one pulls it upright
  //   strip   every picture in one line at the same height, the wheel sliding it along
  // kept for the visit, ?back=off for the live page without a side B
  // walk-through notes (his note, 2026-11-01: some of the work is conceptual, so the viewer still needs walking through it,
  // very minimally): a short note with each picture, from the project's notes in projects.js, beside the picture (under the
  // widest ones). He tried under (a caption) and chapter (opening on the first paragraph) and kept this one only.
  // ?walk=off hides the notes for the session
  var WALK = Q.get('walk');
  try{ if(WALK) sessionStorage.setItem('gc-walk', WALK); WALK = sessionStorage.getItem('gc-walk') || WALK; }catch(e){}
  WALK = WALK === 'off' ? 'off' : 'side';
  var BACK = Q.get('back');
  try{ if(BACK) sessionStorage.setItem('gc-back', BACK); BACK = sessionStorage.getItem('gc-back') || BACK; }catch(e){}
  BACK = ['sheet', 'sleeve', 'crate', 'strip', 'off'].indexOf(BACK) > -1 ? BACK : 'sheet';
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
    offAll();
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
  // leaving a page without a reload (his note, 2026-10-29: "when i click to get out of the project the whole page
  // reloads, it should smoothly go back"; and from one project straight into another): the page's own listeners are
  // kept here so they can be let go, the page fades out on a layer of its own and the next is built in its place and
  // fades in, the address following. Back and Forward do the same
  var OFF = [], CUR = null, HOME_TITLE = PAGE === 'home' ? document.title : 'Gonzalo Cáceres — Architecture';
  function on(t, ty, fn, o){ t.addEventListener(ty, fn, o); OFF.push(function(){ t.removeEventListener(ty, fn, o); }); }
  function offAll(){ OFF.splice(0).forEach(function(f){ f(); }); }
  function swap(url, page, build){
    if(url) history.pushState({q: page}, '', url);
    var cur = main.firstElementChild;
    if(cur){
      var r = cur.getBoundingClientRect(), old = el('div', 'q-old', document.body);
      old.style.left = r.left + 'px'; old.style.top = r.top + 'px'; old.style.width = r.width + 'px'; old.style.height = r.height + 'px';
      // seamless (his note, 2026-10-29: "i don't like the reloading feature"): the marks change in place at once, only
      // the old picture (and words) fade out over the new page, which is there from the start underneath
      var t = cur.querySelector('.qt-ticks'); if(t) t.style.visibility = 'hidden';
      old.appendChild(cur); old.classList.add('soft'); void old.offsetWidth; old.classList.add('out');
      setTimeout(function(){ old.remove(); }, 650);
    }
    offAll(); main.innerHTML = '';
    document.body.classList.remove('qh-one', 'qh-proj', 'in-unveil', 'in-rise', 'qo-flip');
    document.body.setAttribute('data-page', page); PAGE = page;
    build();
  }
  function goHome(slug){ swap('/', 'home', function(){ document.title = HOME_TITLE; buildRollOne(slug); }); }
  function goProject(s){ swap(quietHref(s), 'project', function(){ buildQuietProject(s, 0); }); }
  addEventListener('popstate', function(){
    var u = new URLSearchParams(location.search), s = u.get('p');
    if(PAGE === 'about' || (Q.get('home') || Q.has('flow'))){ location.reload(); return; }
    if(/project\.html$/.test(location.pathname) && P[s]){ var i = u.get('i'); swap(null, 'project', function(){ buildQuietProject(s, i === 'last' ? 1e3 : i ? (parseInt(i, 10) || 1) - 1 : 0); }); }
    else { var was = CUR; swap(null, 'home', function(){ document.title = HOME_TITLE; buildRollOne(was); }); }
  });
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
  function buildRollOne(backTo){
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
      var now = Date.now(); if(now - lastStep < 340) return false;
      flipping = now - lastStep < 900; lastStep = now;
      document.body.classList.toggle('qo-flip', flipping);
      clearTimeout(flipT); flipT = setTimeout(function(){ flipping = false; document.body.classList.remove('qo-flip'); }, 900);
      show(at + d, d);
      return true;
    }
    var withPics = SLUGS.filter(coverOf);
    // each visit opens on a different project (his call, 2026-10-26: "i always see sierra"): picked at random, never the
    // one the last visit opened on; scrolling then goes on through the others in the usual order and comes round again
    var last = null; try { last = localStorage.getItem('gc-first'); } catch(e){}
    var firsts = withPics.filter(function(s){ return s !== last; }); if(!firsts.length) firsts = withPics;
    var first = firsts[Math.floor(Math.random() * firsts.length)];
    // coming back from a project (a click outside its pictures, or Esc): /?at=<slug> opens on that project, so the visit
    // carries on scrolling from there (his note, 2026-10-29); the address is then cleaned
    var back = backTo || Q.get('at');
    if(back && withPics.indexOf(back) > -1){ first = back; if(!backTo) try { history.replaceState(null, '', location.pathname); } catch(e){} }
    try { localStorage.setItem('gc-first', first); } catch(e){}
    Promise.all(withPics.map(function(s){ return loadAll(pictures(s)); })).then(function(all){
      if(!st.isConnected || PAGE !== 'home') return;   // left before the pictures came
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
    // a project's name in the index goes straight into the project (his note, 2026-10-29; it used to only show its
    // picture here): from its picture when that is the one up, otherwise with the same soft change as between projects
    marks.forEach(function(m){
      m.addEventListener('click', function(e){
        if(e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
        e.preventDefault();
        if(curEl && curEl.o.slug === m.slug) into(curEl.querySelector('img'), m.slug, curEl.o.k0);
        else goProject(m.slug);
      });
    });
    // a new push of the wheel moves one picture as soon as it really moves; while the fingers keep scrolling, every further
    // stretch moves one more, so a long scroll keeps passing pictures. The glide a trackpad adds after the fingers lift
    // (deltas sinking well under the push's strongest) never counts: it used to carry a single swipe two or three projects on (his note,
    // 2026-10-29: "scrolling makes me skip some projects")
    var lastD = 0, run = 0, push = 0, peak = 0, moved = false, STRETCH = 440;
    on(window, 'wheel', function(e){
      if(PAGE !== 'home') return;
      e.preventDefault();
      var d = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX, now = Date.now(), gap = now - lastWheel;
      if(e.deltaMode === 1) d *= 40;
      lastWheel = now;
      var fresh = gap > 220 || (d > 0) !== (lastD > 0);
      lastD = d;
      if(fresh){ run = 0; push = 0; peak = 0; moved = false; }
      // the glide: once the deltas have sunk well under the strongest of this push, the fingers have let go
      var gliding = Math.abs(d) < peak * .8; peak = Math.max(peak, Math.abs(d));
      if(!moved){ push += Math.abs(d); if(push >= 10) moved = step(d > 0 ? 1 : -1); return; }
      if(gliding) return;
      run += Math.max(-60, Math.min(60, d));
      if(Math.abs(run) >= STRETCH && step(d > 0 ? 1 : -1)) run = 0;
    }, {passive: false});
    on(window, 'keydown', function(e){
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
    on(window, 'resize', function(){ if(PAGE === 'home' && curEl) place(curEl, curEl.o); });
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
    var p = P[slug], all = pictures(slug);
    if(WALK !== 'off'){
      // a note is a string (beside the picture, left), or {text, side: 'right'} for one on the picture's right (East 5th's
      // references slide, his ask 2026-11-06)
      (p.notes || []).forEach(function(t, i){ if(!all[i] || !t) return; if(typeof t === 'object'){ all[i].note = t.text; all[i].noteSide = t.side; } else all[i].note = t; });
    }
    var n = Math.max(1, all.length);
    var i0 = SLUGS.indexOf(slug); CUR = slug;
    document.title = p.title + ' — Gonzalo Cáceres';
    document.body.classList.add('qh-proj');
    night(p.dark);
    var wrap = el('div', 'qt qp', main), nav = el('nav', 'qt-ticks', wrap), st = el('div', 'p-stage qt-stage', wrap), fade = fader(st);
    var marks = quietMarks(nav, slug, function(s){ return quietHref(s); }), me = marks[i0];
    me.classList.add('cur'); me.removeAttribute('href'); me.style.setProperty('--p', 1);
    marks.forEach(function(m){
      if(m === me) return;
      m.addEventListener('click', function(e){ if(e.metaKey || e.ctrlKey || e.shiftKey || e.button) return; e.preventDefault(); goProject(m.slug); });
    });
    var plus = el('button', 'qp-plus', me.querySelector('span'), '+'); plus.type = 'button'; plus.setAttribute('aria-label', 'About this project');
    var subs = el('div', 'qp-subs', nav); nav.insertBefore(subs, me.nextSibling);
    var dots = [];
    for(var k = 0; k < n; k++){ (function(k){ var b = el('button', 'qs', subs); b.type = 'button'; el('i', '', b); b.setAttribute('aria-label', 'Picture ' + (k + 1)); b.addEventListener('click', function(){ go(k); }); dots.push(b); })(k); }
    // the words, behind the "+", opened one of four ways (&d=, see the CSS); on a phone always the floating card
    // under (mockup, 2026-10-29, his idea: "when i hit the + the title goes up, the lines also shift up like selecting a
    // record ... and the description appears below", so the picture is never moved or resized): the default on this
    // preview; ?d=beside for the live way
    var D = (Q.get('d') || 'under').toLowerCase(); if(['fold', 'beside', 'under'].indexOf(D) === -1) D = 'under';   // fold: by address only
    if(innerWidth <= 700) D = 'float';
    wrap.classList.add('qd-' + D);
    // under, while the words are open, another project's name on hover (his note, 2026-10-29, try both): &hov=top (the
    // name over the words, on the page's own ground; default) or &hov=none (no names while the words are open)
    var HOV = (Q.get('hov') || 'top').toLowerCase(); wrap.classList.add('hv-' + (HOV === 'none' ? 'none' : 'top'));
    var card = el('aside', 'qp-card', st), meta = el('div', 'meta', card);
    el('span', 'k', meta, p.kicker || '');
    var cr = el('div', 'cr', meta);
    (p.credits || []).forEach(function(r){ if(r[0] === 'Year' || !r[1]) return; var c = el('p', '', cr); el('b', '', c, r[0]); c.appendChild(document.createTextNode('  ' + r[1])); });
    var tx = el('div', 'tx', card);
    (p.lede ? [p.lede] : []).concat(p.text ? (Array.isArray(p.text) ? p.text : [p.text]) : []).forEach(function(t, i){
      // the first sentence in its own span (for ?words=first); the words themselves unchanged
      var e = el('p', p.lede && i === 0 ? 'lede' : '', tx), m = /^(.+?[.!?])(\s.*)?$/.exec(t);
      if(m && m[2]){ el('span', 's1', e, m[1]); e.appendChild(document.createTextNode(m[2])); } else e.textContent = t;
    });
    if(WORDS === 'tail') card.appendChild(cr);   // ?words=tail: the credits after his paragraphs
    var nameEl = me.querySelector('span'), rule = D === 'fold' ? el('div', 'qd-rule', st) : null, T = [];
    function nameY(){ var a = nameEl.getBoundingClientRect(), b = st.getBoundingClientRect(); return Math.max(0, Math.round(a.top + a.height / 2 - b.top)); }
    function curImg(){ return st.querySelector('.p-layer.on img, .p-layer.on .plate'); }
    function isOpen(){ return wrap.classList.contains('open'); }
    // centred (his notes, 2026-11-01: the picture "looks shifted"; then: keep the size it had, just centred): the picture
    // keeps its size and slides sideways until the room between the "+" after the name and the picture matches the room
    // right of it. Each picture on its own (narrow ones need more); not while the words are open (they place it)
    function centre(L, im){
      if(!L || !im) return;
      if(innerWidth <= 700){ L.style.translate = ''; return; }
      var cur = parseFloat(L.style.translate) || 0, r = im.getBoundingClientRect(); if(!r.width) return;
      var a = r.left - cur, b = r.right - cur, P = plus.getBoundingClientRect().right;
      var sh = Math.round((innerWidth - b - a + P) / 2);
      L.style.translate = Math.min(0, sh) + 'px 0';
    }
    on(window, 'resize', function(){ var L = st.querySelector('.p-layer.on'); centre(L, L && L.querySelector('.qf img, .qf .plate')); });
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
    // under: like picking a record from a rack (his note, 2026-10-29: "if you choose this record then the ones on top
    // go to the bottom, like a circular thing"): the column turns round until this project is at the top, the projects
    // above it going round to the bottom, under the last; every line stays (the other projects' and this one's
    // pictures'). The words open under the name, right of the lines, as wide as the room left of the widest a picture
    // can be, so no picture moves or shrinks. Closing turns the column back
    var ORDER = Array.prototype.slice.call(nav.children), ABOVE = ORDER.slice(0, ORDER.indexOf(me));
    function regroup(){
      var g = null, i = 0;
      Array.prototype.forEach.call(nav.children, function(c){
        if(!c.classList.contains('qk') || c.classList.contains('qa')) return;
        var q = P[c.slug]; c.classList.toggle('gs', i++ > 0 && q.group !== g); g = q.group;
      });
    }
    // the turn moves every line by the same distance at the same pace, like records sliding in a rack: the ones
    // going round leave over the top as they arrive from below (and the other way when it turns back)
    // it turns only when the title has to rise (his notes, 2026-10-29): with short words the records stay on top
    var WRAP = [];
    function turn(on){
      var kids = Array.prototype.slice.call(nav.children), vr = nav.getBoundingClientRect(), was = new Map();
      kids.forEach(function(k){ var r = k.getBoundingClientRect(); was.set(k, {top: r.top, left: r.left}); });
      var rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
      if(on){
        // where the title goes: level with the top of the picture showing, or lower so that title and words sit
        // centred on its height when they are shorter than it (never above the picture)
        var im = curImg(), ir = im ? im.getBoundingClientRect() : st.getBoundingClientRect();
        placeUnder();
        var nb = nameEl.getBoundingClientRect(), h = nb.height + 1.3 * rem + (tx.getBoundingClientRect().bottom - meta.getBoundingClientRect().top);
        // his rule (2026-10-29): when the words are long enough to push the title up, all the lines above roll round
        // to the bottom; when they are not, they all stay where they are
        var T = ir.top + Math.max(0, (ir.height - h) / 2);
        // and the projects of its own group above it stay on top, over the title (his note, 2026-10-30: the second of
        // Research keeps the first of Research above it; only the other groups go round)
        WRAP = T < nb.top - .8 * rem ? ABOVE.filter(function(k){ return !k.slug || P[k.slug].group !== P[slug].group; }) : [];
        var ab = nav.querySelector('.qk.qa'); WRAP.forEach(function(k){ nav.insertBefore(k, ab); });
        nav.classList.add('qu-top'); nav.style.paddingTop = '';
        regroup();
        var dy = T - nameEl.getBoundingClientRect().top; if(dy > 0) nav.style.paddingTop = Math.round(dy) + 'px';
        placeUnder();   // measured at the new places, before anything moves
      } else {
        ORDER.forEach(function(k){ nav.appendChild(k); });
        nav.classList.remove('qu-top'); nav.style.paddingTop = '';
        regroup();
      }
      var S = was.get(me).top - me.getBoundingClientRect().top, opt = {duration: 1000, easing: 'cubic-bezier(.45,.05,.2,1)'};
      kids.forEach(function(k){
        var o = was.get(k), d = o.top - k.getBoundingClientRect().top;
        if(!d) return;
        if(WRAP.indexOf(k) > -1){
          var g = k.cloneNode(true); g.classList.add('qu-ghost'); g.style.top = (o.top - vr.top) + 'px'; g.style.left = (o.left - vr.left) + 'px';
          nav.appendChild(g);
          g.animate([{opacity: 1, transform: 'none'}, {opacity: 0, transform: 'translateY(' + (-S) + 'px)'}], opt).onfinish = function(){ g.remove(); };
          k.animate([{opacity: 0, transform: 'translateY(' + S + 'px)'}, {opacity: 1, transform: 'none'}], opt);
        }
        else k.animate([{transform: 'translateY(' + d + 'px)'}, {transform: 'none'}], opt);
      });
    }
    // the words: under the name, which is now level with the top of the picture; as wide as the room
    // left of the widest a picture can be plus the stage's own margin, the pictures sliding right by that margin (never
    // smaller, never past the stage's edge)
    function placeUnder(){
      var rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
      var nr = nameEl.getBoundingClientRect(), sr = st.getBoundingClientRect(), pad = sr.width * .04;
      var x = nr.left, base = Math.max(11 * rem, sr.left + pad - 1.6 * rem - x), most = base + pad;
      st.style.setProperty('--cx', Math.round(x - sr.left) + 'px');
      st.style.setProperty('--ny', Math.round(nr.bottom - sr.top + 1.3 * rem) + 'px');
      // as wide as it can be (his note: "very narrow"): the full stage margin, the pictures sliding right by as much
      var w = Math.min(26 * rem, most);
      st.style.setProperty('--cw', Math.round(w) + 'px');
      st.style.setProperty('--sh', Math.round(Math.max(0, w - base)) + 'px');
    }
    on(window, 'resize', function(){ if(D === 'beside' && isOpen()) placeBeside(); if(D === 'under' && isOpen()) placeUnder(); });
    function toggle(on){
      on = on == null ? !isOpen() : on;
      if(on && bOn) flip(false);   // the words belong to side A
      if(on === isOpen()) return;
      st.style.setProperty('--ny', nameY() + 'px');
      if(D === 'beside') placeBeside();
      if(D === 'under' && innerWidth > 700) turn(on);
      // the picture's centring slide eases along with the words coming or going
      wrap.classList.add('qc-move'); clearTimeout(wrap.qcT); wrap.qcT = setTimeout(function(){ wrap.classList.remove('qc-move'); }, 900);
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
    // a tiny prompt under the first picture so a visitor knows to scroll (his ask, 2026-11-05: a friend inside a project
    // didn't know how to move through the pictures). It sits in the margin under the picture, never taking room from it
    // ("don't resize anything"). &cue= (kept for the visit):
    //   word   "Scroll" (on a phone "Swipe"), small, grey
    //   line   a short hairline drawing downwards, no word
    //   chev   a small thin chevron pointing down, drifting gently
    //   off    nothing (as live until now)
    var CUE = Q.get('cue');
    try{ if(CUE) sessionStorage.setItem('gc-cue', CUE); CUE = sessionStorage.getItem('gc-cue') || CUE; }catch(e){}
    CUE = ['word', 'line', 'chev', 'off'].indexOf(CUE) > -1 ? CUE : 'chev';   // his pick, 2026-11-05: the chevron, kept on every picture
    var cue = null;
    if(CUE !== 'off' && n > 1){
      cue = el('button', 'qcue qcue-' + CUE, wrap); cue.type = 'button'; cue.setAttribute('aria-label', 'Next picture');
      if(CUE === 'word') el('span', '', cue, innerWidth <= 700 ? 'Swipe' : 'Scroll');
      else if(CUE === 'line') el('i', '', cue);
      else cue.innerHTML = '<svg viewBox="0 0 16 8" width="16" height="8"><path d="M1 1l7 6 7-6"/></svg>';
      // on the last picture it opens all the pictures (side B), as scrolling on does there (his note, 2026-11-05: "after the
      // last photo keep the chevron even when in gallery mode"); on side B it stays as it is, a still mark
      cue.addEventListener('click', function(e){ e.stopPropagation(); if(bOn) return; if(at === n - 1 && bBtn){ flip(true); return; } go(at + 1); });
    }
    // and one pointing up, at the head of the picture area (his ask, 2026-11-06: "we need another chevron to go up as
    // well"): back one picture; on side B back to the pictures; gone on the first picture, where there's nothing above
    var cueUp = null;
    if(cue && CUE === 'chev'){
      cueUp = el('button', 'qcue qcue-chev qcue-up off', wrap); cueUp.type = 'button'; cueUp.setAttribute('aria-label', 'Previous picture');
      cueUp.innerHTML = '<svg viewBox="0 0 16 8" width="16" height="8"><path d="M1 7l7-6 7 6"/></svg>';
      cueUp.addEventListener('click', function(e){ e.stopPropagation(); if(bOn){ flip(false); return; } go(at - 1); });
    }
    function syncUp(){ if(cueUp) cueUp.classList.toggle('off', !bOn && at <= 0); }
    // close to the picture (his note, 2026-11-06: "put both chevrons closer to the image"): the down one a short step under
    // the picture on show, the up one the same step above it, both on its centre line; when the next picture is a
    // different size they glide there rather than jump. Never past the window's foot or head (1.8rem), and on a phone
    // never into the marks at the foot. (Before, 2026-11-05: one fixed spot in the margin under the stage.)
    var curIm = null;
    function picRect(){
      var r = curIm && curIm.isConnected ? curIm.getBoundingClientRect() : null;
      if(r && r.width) return r;
      var s = st.getBoundingClientRect(), P = innerWidth <= 700 ? 0 : plus.getBoundingClientRect().right;
      return {left: P, right: innerWidth, top: s.top + innerHeight * .03, bottom: s.bottom - innerHeight * .03};
    }
    function placeCue(){
      if(!cue) return;
      var r = picRect(), rem = parseFloat(getComputedStyle(document.documentElement).fontSize), x = (r.left + r.right) / 2, y = r.bottom + (curIm && curIm.isConnected ? parseFloat(curIm.style.marginBottom) || 0 : 0) + 1.5 * rem;   // under a phone note too (the note sits in the picture's bottom margin)
      if(innerWidth <= 700){ var t = wrap.querySelector('.qt-ticks'), tt = t ? t.getBoundingClientRect().top : innerHeight - 90; y = Math.min(y, tt - 22); }
      else y = Math.min(y, innerHeight - 1.8 * rem);
      cue.style.left = Math.round(x) + 'px'; cue.style.top = Math.round(y) + 'px';
      if(curIm && !cue.classList.contains('off')) cue.classList.add('in');   // shows with the first picture
    }
    function placeUp(){
      if(!cueUp) return;
      var r = picRect(), rem = parseFloat(getComputedStyle(document.documentElement).fontSize), x = (r.left + r.right) / 2, y = Math.max(r.top - 1.5 * rem, 1.8 * rem);
      cueUp.style.left = Math.round(x) + 'px'; cueUp.style.top = Math.round(y) + 'px';
      if(curIm) cueUp.classList.add('in');
    }
    if(cueUp){ on(window, 'resize', placeUp); requestAnimationFrame(placeUp); }
    if(cue){ on(window, 'resize', placeCue); requestAnimationFrame(placeCue); }
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
          if(it.note){
            // beside: a narrow column left of the picture, its last line on the picture's bottom edge; under the picture
            // when there isn't room beside it
            var nt = el('p', 'qn qn-side', L, it.note);
            fit = function(){
              var r = im.getBoundingClientRect(), lr = L.getBoundingClientRect(), rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
              if(!r.width) return;
              // the column may reach left past the stage, but stays clear of the project's name in the index
              var w = 11 * rem, g = 1.8 * rem, room = r.left - Math.max(me.getBoundingClientRect().right + 2 * rem, 0);
              // wide pictures take the note under them, from their left edge; upright and square ones beside (his rule,
              // 2026-11-01: "if the image is wide do under, if it's vertical or square do side")
              // then beside for all (below). Every wide picture keeps the size it had with a note under it ("don't resize anything")
              var ratio = im.naturalWidth ? im.naturalWidth / im.naturalHeight : 1, wide = ratio > 1.15;
              // a note under the picture gets its own room under it, the picture a little smaller for it (as in the
              // version he liked, 2026-11-01), so the note never runs off the bottom
              // every note beside its picture (his call, 2026-11-01: "keep the side version only, no caption at the bottom
              // no more"); on a phone there's no room beside, so there it stays under
              var low = innerWidth <= 700, sized = wide || low;
              if(f.classList.contains('qf-low') !== sized){ f.classList.toggle('qf-low', sized); r = im.getBoundingClientRect(); lr = L.getBoundingClientRect(); }
              if(!low){
                if(im.style.marginBottom){ im.style.marginBottom = ''; r = im.getBoundingClientRect(); lr = L.getBoundingClientRect(); }
                // short of room: first a narrower column, then the picture steps right (never past the window's edge)
                var right = it.noteSide === 'right';
                // on the right: the room is up to the window's edge, and the picture steps left if short (never into the index)
                if(right) room = innerWidth - rem - r.right;
                if(room < w + g) w = Math.max(7.5 * rem, room - g);
                var push = right ? -Math.min(w + g - room, r.left - Math.max(me.getBoundingClientRect().right + 2 * rem, 0)) : Math.min(w + g - room, innerWidth - rem - r.right);
                if(right ? push < 0 : push > 0){ L.style.translate = ((parseFloat(L.style.translate) || 0) + push) + 'px 0'; r = im.getBoundingClientRect(); lr = L.getBoundingClientRect(); }
                nt.classList.remove('qn-low'); nt.style.width = w + 'px'; nt.style.left = (right ? r.right - lr.left + g : r.left - lr.left - w - g) + 'px'; nt.style.top = (r.bottom - lr.top - nt.offsetHeight) + 'px';
              }
              else {
                // phone: the picture and its note centred together as one block, the note under it
                nt.classList.add('qn-low'); nt.style.width = Math.min(r.width, 26 * rem) + 'px';
                var mb = Math.round(nt.offsetHeight + .7 * rem) + 'px';
                if(im.style.marginBottom !== mb){ im.style.marginBottom = mb; r = im.getBoundingClientRect(); lr = L.getBoundingClientRect(); }
                nt.style.left = (r.left - lr.left) + 'px'; nt.style.top = (r.bottom - lr.top + .7 * rem) + 'px';
              }
            };
            if(window.ResizeObserver) new ResizeObserver(function(){ fit(); }).observe(L);
          }
          var fit0 = fit; fit = function(){ fit0(); centre(L, im); fit0(); curIm = im; placeCue(); placeUp(); };
          im.addEventListener('load', fit); f.fit = fit; if(im.complete) requestAnimationFrame(fit);
        }
        else el('div', 'plate', f, 'In preparation');
      }, first);
      dots.forEach(function(d, j){ d.classList.toggle('cur', j === k); });
      if(up){ up.classList.toggle('off', k === 0); dn.classList.toggle('off', k === n - 1); }
      if(hint && !first) hint.classList.add('off');
      // the chevron stays under every picture (his note, 2026-11-05: "keep it and make it clickable"); it stays put while the
      // pictures change; past the last picture it leads into all the pictures (gone there only if a project has no side B)
      if(cue) cue.classList.toggle('off', k === n - 1 && !bBtn);
      syncUp();
    }
    // side B (trial ?back=): all the pictures at once
    var sideB = null, bOn = false, bBtn = null, bTurn = 0, nameEl0 = me.querySelector('span');
    if(BACK !== 'off' && all.length > 1){
      // the way in sits under the project's lines, where its pictures' marks end (his note, 2026-11-01: "the B at the
      // bottom was really cool but it needs to be more subtle than a letter"): a small mark, &bmark=
      //   square  a small square with round corners and a centre hole; solid while side B shows (tried 2026-11-01)
      //   ring    a tiny record, a circle with its centre hole; solid while side B shows
      //   groove  two short lines close together, like the run-out groove at the end of a side
      //   corner  a short line whose end turns down, like a corner about to be turned over
      //   sleeve  a square sleeve with the record peeking out of its side
      //   half    half a record, as if sliding out of view
      //   stack   three short lines stepped like a stack of sheets
      //   grid    nine tiny dots, all the pictures at once
      //   tilt    one more line, leaning like the project lines in the index
      //   cross   one more line crossed by a short upright one
      //   logo    his GCV mark, small (his ask, 2026-11-01: "do one with my logo as well")
      var BM = (Q.get('bmark') || 'ring').toLowerCase();
      var SVG = {
        square: '<svg viewBox="0 0 10 10" width="10" height="10"><rect class="o" x=".5" y=".5" width="9" height="9" rx="2.2"/><circle class="h" cx="5" cy="5" r="1"/></svg>',
        ring: '<svg viewBox="0 0 10 10" width="10" height="10"><circle class="o" cx="5" cy="5" r="4.2"/><circle class="h" cx="5" cy="5" r="1"/></svg>',  // his pick 2026-11-01: the circle with its point (he dropped the point, then asked for it back)
        groove: '<svg viewBox="0 0 12 6" width="12" height="6"><path d="M0 1.5h12M0 4.5h12"/></svg>',
        corner: '<svg viewBox="0 0 12 8" width="12" height="8"><path d="M0 1h9.5l2 2.5V7.5"/></svg>',
        sleeve: '<svg viewBox="0 0 15 10" width="15" height="10"><path class="r" d="M9 1.2a3.8 3.8 0 0 1 0 7.6"/><rect class="o" x=".5" y=".5" width="9" height="9"/></svg>',
        half: '<svg viewBox="0 0 7 10" width="7" height="10"><path class="o" d="M1.5 .6a4.4 4.4 0 0 1 0 8.8z"/></svg>',
        grid: '<svg viewBox="0 0 10 10" width="10" height="10"><g class="d"><circle cx="1.5" cy="1.5" r=".9"/><circle cx="5" cy="1.5" r=".9"/><circle cx="8.5" cy="1.5" r=".9"/><circle cx="1.5" cy="5" r=".9"/><circle cx="5" cy="5" r=".9"/><circle cx="8.5" cy="5" r=".9"/><circle cx="1.5" cy="8.5" r=".9"/><circle cx="5" cy="8.5" r=".9"/><circle cx="8.5" cy="8.5" r=".9"/></g></svg>',
        tilt: '<svg viewBox="0 0 12 8" width="12" height="8"><path d="M.5 7.5L11.5.5"/></svg>',
        logo: '<svg viewBox="26 26 148 148" width="13" height="13"><circle cx="100" cy="100" r="70" stroke-width="9"/><g stroke-width="15" class="lg"><path d="M120.09 60.74L132.29 48.54M143.75 100H161M120.09 139.26L132.29 151.46M67.71 151.46L79.91 139.26M42.13 108.55A58.5 58.5 0 0 1 42.13 91.45M67.71 48.54L79.91 60.74"/></g></svg>',
        cross: '<svg viewBox="0 0 12 9" width="12" height="9"><path d="M0 4.5h12M6 0v9"/></svg>'
      };
      // the stack family (his ask, 2026-11-01: "i kind of like the stacked. do several iterations. one can be vertical
      // lines as showing all together as well"). One <path> per line so each line can move on its own.
      //   stack   three lines stepping down to the right (the one he liked); on side B the steps turn the other way,
      //           like the record turned over (same for stack2, stack4, stackl)
      //   stack2  two lines, wider step
      //   stack4  four finer steps
      //   stackl  stepping down to the left
      //   turn    the stack on side A; on side B each line stands up, three uprights side by side
      //   bars    one upright per picture, side by side: all of them together
      //   rack    uprights of uneven height, like records in a rack
      //   lean    uprights leaning like the index lines; on side B they stand straight
      //   spread  uprights packed tight like records seen edge-on; on side B they spread apart
      var NB = Math.min(all.length, 9);
      function sv(w, h, ds, st){ return '<svg viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h + '" overflow="visible">' + ds.map(function(d, i){ return '<path style="--i:' + i + (st ? ';' + st(i) : '') + '" d="' + d + '"/>'; }).join('') + '</svg>'; }
      function ups(gap, hs){ var a = []; for(var i = 0; i < NB; i++){ var h = hs ? hs[i % hs.length] : 9; a.push('M' + (.5 + i * gap) + ' ' + (9.5 - h) + 'v' + h); } return a; }
      SVG.stack = sv(14, 8, ['M0 1h10', 'M2 4h10', 'M4 7h10']);
      SVG.stack2 = sv(14, 6, ['M0 .5h9', 'M5 5.5h9']);
      SVG.stack4 = sv(14, 8, ['M0 .5h8', 'M2 2.83h8', 'M4 5.17h8', 'M6 7.5h8']);
      SVG.stackl = sv(14, 8, ['M4 1h10', 'M2 4h10', 'M0 7h10']);
      SVG.turn = sv(14, 8, ['M0 1h10', 'M2 4h10', 'M4 7h10'], function(i){ return '--x:' + (i - 1) * 2 + 'px;--y:' + (1 - i) * 3 + 'px'; });
      SVG.bars = sv(.5 + (NB - 1) * 2.5 + .5, 10, ups(2.5));
      SVG.rack = sv(.5 + (NB - 1) * 2.5 + .5, 10, ups(2.5, [9, 7, 8.5, 6, 9, 7.5, 8, 6.5, 9]));
      SVG.lean = sv(.5 + (NB - 1) * 2.5 + 3, 10, ups(2.5));
      SVG.spread = sv(.5 + (NB - 1) * 2 + .5, 10, ups(2));
      // one vertical line (his ask, 2026-11-01: "just one vertical line, when you click it makes all the other [ticks]
      // disappear (idk if it should increase on length or not) and then i'll have all the images"):
      //   line   the ticks fade and close up; the line keeps its length and rises under the name
      //   grow   the ticks fade; the line grows up through the place where they stood
      SVG.line = SVG.grow = '<i></i>';
      if(!SVG[BM]) BM = 'ring';
      subs.classList.add('bm-' + BM);
      bBtn = el('button', 'qs-x qs-' + BM, subs); bBtn.type = 'button'; bBtn.setAttribute('aria-label', 'All the pictures');
      bBtn.innerHTML = SVG[BM];
      bBtn.addEventListener('click', function(e){ e.stopPropagation(); flip(!bOn); });
    }
    function buildB(){
      sideB = el('div', 'qb qb-' + BACK, st);
      var box = el('div', 'qb-box', sideB);
      sideB.ready = loadAll(all).then(function(got){
        got.forEach(function(o, k){
          var f = el('figure', 'qb-f', box); f.r = o.r; f.k = k;
          var im = el('img', '', f); im.alt = o.it.caption || p.title; im.src = o.it.src; im.loading = 'lazy';
          if(/\.(svg|png)$/i.test(o.it.src)) f.classList.add('dr');
          if(BACK === 'sleeve') el('span', 'k', f, 'A' + (k + 1));
          f.addEventListener('click', function(e){ e.stopPropagation(); pick(k, f); });
        });
        layB();
      });
    }
    // the pictures laid out to fit the stage: sheet in even rows (one height per row, every row the full width, the
    // height chosen so that all the rows fit), sleeve in the largest squares that fit, crate and strip in one line
    function layB(){
      if(!sideB) return;
      var box = sideB.firstChild, F = Array.prototype.slice.call(box.children), W = sideB.clientWidth, H = sideB.clientHeight, g = Math.max(10, W * .012);
      if(!F.length) return;
      if(BACK === 'sheet'){
        var rows = function(h){
          var out = [], row = [], w = 0;
          F.forEach(function(f){ var fw = f.r * h; if(row.length && w + fw + g * row.length > W){ out.push(row); row = []; w = 0; } row.push(f); w += fw; });
          if(row.length) out.push(row);
          return out;
        };
        var lo = 20, hi = H, best = null;
        for(var t = 0; t < 24; t++){
          var h = (lo + hi) / 2, R = rows(h), tot = 0;
          R.forEach(function(row, i){ var sw = row.reduce(function(a, f){ return a + f.r; }, 0), rh = i < R.length - 1 ? (W - g * (row.length - 1)) / sw : h; tot += Math.min(rh, h * 1.25); });
          tot += g * (R.length - 1);
          if(tot <= H * .92){ best = {h: h, R: R}; lo = h; } else hi = h;
        }
        if(!best) best = {h: lo, R: rows(lo)};
        var y = 0, hs = best.R.map(function(row, i){ var sw = row.reduce(function(a, f){ return a + f.r; }, 0); return i < best.R.length - 1 ? Math.min((W - g * (row.length - 1)) / sw, best.h * 1.25) : best.h; });
        var total = hs.reduce(function(a, b){ return a + b; }, 0) + g * (hs.length - 1), y0 = Math.max(0, (H - total) / 2);
        y = y0;
        best.R.forEach(function(row, i){
          var rh = hs[i], rw = row.reduce(function(a, f){ return a + f.r * rh; }, 0) + g * (row.length - 1), x = (W - rw) / 2;
          row.forEach(function(f){ f.style.cssText = 'left:' + x + 'px;top:' + y + 'px;width:' + (f.r * rh) + 'px;height:' + rh + 'px'; x += f.r * rh + g; });
          y += rh + g;
        });
      } else if(BACK === 'sleeve'){
        var n2 = F.length, bestS = 0, bc = 1, lab = 22; W -= 2;
        for(var c = 1; c <= n2; c++){ var r2 = Math.ceil(n2 / c), sz = Math.min((W - g * (c - 1)) / c, (H * .94 - (g + lab) * r2) / r2); if(sz > bestS){ bestS = sz; bc = c; } }
        var rr = Math.ceil(n2 / bc), gw = bc * bestS + g * (bc - 1), gh = rr * (bestS + lab) + g * (rr - 1), x0 = (W - gw) / 2, y1 = (H - gh) / 2;
        F.forEach(function(f, i){ var cx = i % bc, cy = Math.floor(i / bc); f.style.cssText = 'left:' + (x0 + cx * (bestS + g)) + 'px;top:' + (y1 + cy * (bestS + lab + g)) + 'px;width:' + bestS + 'px;height:' + bestS + 'px'; });
      } else {
        // crate and strip: one line, centred while it fits, otherwise starting at the left and sliding with the wheel.
        // In the crate the pictures stand close, each leaning back from its left edge so only a slice of it shows,
        // spaced so that the whole crate fits when it can
        var hh = BACK === 'crate' ? H * .56 : H * .4, xx = 0, ws = F.map(function(f){ return f.r * hh; });
        var step = BACK === 'crate' ? Math.max(W * .045, Math.min(Math.min.apply(null, ws) * .55, (W * .96 - ws[ws.length - 1]) / Math.max(1, F.length - 1))) : 0;
        F.forEach(function(f, i){ f.style.cssText = 'left:' + xx + 'px;top:' + ((H - hh) / 2) + 'px;width:' + ws[i] + 'px;height:' + hh + 'px;z-index:' + (BACK === 'crate' ? F.length - i : 1); xx += BACK === 'crate' ? step : ws[i] + g * 1.6; });
        var last = F[F.length - 1], endX = parseFloat(last.style.left) + parseFloat(last.style.width);
        box.dataset.w = endX; box.style.width = endX + 'px';
        slide(0);
      }
    }
    var bx = 0;
    function slide(d){
      var box = sideB.firstChild, w = parseFloat(box.dataset.w || 0), W = sideB.clientWidth;
      if(w <= W){ bx = (W - w) / 2; } else { bx = Math.min(0, Math.max(W - w, bx - d)); }
      box.style.transform = 'translateX(' + bx + 'px)';
      return w > W;
    }
    on(window, 'resize', function(){ if(bOn) layB(); });
    // the way over to side B and back (his note, 2026-11-01: the turn "is like a wall turning, should be smoother"):
    // nothing turns. The picture on show glides from its place to its own place on the sheet while the rest of the sheet
    // fades in round it; coming back, it glides from the sheet to its place again while the sheet fades out
    function tileAt(k){ return sideB ? Array.prototype.filter.call(sideB.querySelectorAll('.qb-f'), function(f){ return f.k === k; })[0] : null; }
    function rectIn(f){
      var src = f.querySelector('img'), fr = src.getBoundingClientRect(), cs = getComputedStyle(src);
      var pl = parseFloat(cs.paddingLeft) || 0, pt = parseFloat(cs.paddingTop) || 0;
      var cw = fr.width - 2 * pl, ch = fr.height - 2 * pt, w0 = Math.min(cw, ch * f.r), h0 = w0 / f.r;
      return {left: fr.left + pl + (cw - w0) / 2, top: fr.top + pt + (ch - h0) / 2, width: w0, height: h0};
    }
    function glide(src, dr, from, to, done){
      var fly = el('img', 'qb-fly' + (dr ? ' dr' : ''), document.body); fly.src = src; fly.alt = '';
      fly.style.cssText = 'left:' + to.left + 'px;top:' + to.top + 'px;width:' + to.width + 'px;height:' + to.height + 'px;transform:translate(' + (from.left - to.left) + 'px,' + (from.top - to.top) + 'px) scale(' + (from.width / to.width) + ',' + (from.height / to.height) + ')';
      void fly.offsetWidth; fly.style.transform = 'none';
      setTimeout(function(){ done(); fly.remove(); }, 780);
    }
    function flip(to){
      if(to === bOn) return;
      if(to && isOpen()) toggle(false);
      if(!to){
        var t0 = tileAt(at);
        if(t0){ pick(at, t0); return; }
        bOn = false; bTurn = Date.now(); wrap.classList.remove('qb-show'); syncUp(); return;
      }
      if(!sideB) buildB();
      bOn = true; bTurn = Date.now(); syncUp();
      if(bBtn && (BM === 'grow' || BM === 'line')){
        // grow: how far the line grows, from the first tick down to its own foot; line: how far it rises to stand
        // where the first tick was (the column itself never moves, so the name stays put)
        var li = bBtn.querySelector('i'), lr = li.getBoundingClientRect(), d0 = dots[0].getBoundingClientRect();
        if(lr.height){
          bBtn.style.setProperty('--g', ((lr.bottom - d0.top - d0.height / 2 + 1) / lr.height).toFixed(3));
          bBtn.style.setProperty('--u', (d0.top + d0.height / 2 - 1 - lr.top).toFixed(1) + 'px');
        }
      }
      wrap.classList.add('qb-going');
      sideB.ready.then(function(){
        if(!bOn) return;
        layB();
        var L = st.querySelector('.p-layer.on'), im = L && L.querySelector('img'), t = tileAt(at);
        if(im && t && im.getBoundingClientRect().width){
          var rA = im.getBoundingClientRect(), rB = rectIn(t);
          t.style.visibility = 'hidden'; im.style.visibility = 'hidden';
          glide(t.querySelector('img').src, t.classList.contains('dr'), rA, rB, function(){ t.style.visibility = ''; im.style.visibility = ''; });
        }
        wrap.classList.remove('qb-going'); wrap.classList.add('qb-show');
      });
    }
    // a picture clicked on side B (his note, 2026-11-01: "if i click an image i don't need the whole gallery to turn, it
    // should be a smooth transition of just that one image"): that picture glides from its place on the sheet to its
    // place on side A; the others fade where they are; nothing turns
    function pick(k, f){
      if(!bOn) return;
      var r0 = rectIn(f), src = f.querySelector('img').src;
      wrap.classList.add('qb-pick');
      if(k !== at) go(k);
      bOn = false; bTurn = Date.now(); syncUp();
      wrap.classList.remove('qb-show');
      var L = st.querySelector('.p-layer.on'), im = L && L.querySelector('img');
      if(!im){ wrap.classList.remove('qb-pick'); return; }
      im.style.visibility = 'hidden'; f.style.visibility = 'hidden';
      var land = function(){
        glide(src, f.classList.contains('dr'), r0, im.getBoundingClientRect(), function(){
          im.style.visibility = ''; f.style.visibility = '';
          requestAnimationFrame(function(){ wrap.classList.remove('qb-pick'); });
        });
      };
      if(im.complete && im.naturalWidth) requestAnimationFrame(land);
      else { im.addEventListener('load', land); im.addEventListener('error', land); }
    }
    // a click on the picture goes on (or back, on its left part); a click anywhere outside the pictures, the marks and the
    // words goes back to the home (his note, 2026-10-29)
    // a safe margin round the picture (his note, 2026-11-01: with narrow pictures a click just beside one went back to the
    // home): a click within it counts as a click on the picture; the note beside a picture is safe ground too
    function picRect(){
      var L = st.querySelector('.p-layer.on'), t = L && L.querySelector('.qf img, .qf .plate');
      return t ? t.getBoundingClientRect() : null;
    }
    function nearPic(e){
      var r = picRect(); if(!r || !r.width) return false;
      var mx = Math.max(110, innerWidth * .08), my = Math.max(50, innerHeight * .06);
      if(e.clientX > r.left - mx && e.clientX < r.right + mx && e.clientY > r.top - my && e.clientY < r.bottom + my) return true;
      var nt = st.querySelector('.p-layer.on .qn'), q = nt && nt.getBoundingClientRect();
      return !!(q && q.width && e.clientX > q.left - 20 && e.clientX < q.right + 20 && e.clientY > q.top - 20 && e.clientY < q.bottom + 20);
    }
    st.addEventListener('click', function(e){
      if(isOpen() && D === 'float'){ toggle(false); return; }
      if(bOn) return;
      if(!e.target.closest('img, .plate') && !nearPic(e)) return;
      e.stopPropagation();
      // clicking on past the last picture comes round to the first, and back past the first to the last (his ask,
      // 2026-10-29); scrolling still stops at the ends. Back on the picture's left part (or left of it), on elsewhere
      var r = picRect() || st.getBoundingClientRect(); go((at + (e.clientX < r.left + r.width * .35 ? -1 : 1) + n) % n);
    });
    on(document, 'click', function(e){
      if(e.defaultPrevented || e.button || e.target.closest('a, button, img, .plate, input, textarea, select, label, .qp-card')) return;
      if(isOpen() && D === 'float') return;
      if(!bOn && nearPic(e)) return;
      if(String(getSelection())) return;
      // only a click in the index's own column goes back to the home (on this project's title); to its right, the
      // pictures' side, a stray click does nothing (his note, 2026-11-05, a line drawn just right of the name and the marks)
      if(innerWidth > 700 && e.clientX > indexEdge()) return;
      goHome(slug);
    });
    function indexEdge(){
      var rem = parseFloat(getComputedStyle(document.documentElement).fontSize), m = document.querySelector('.gv-mark');
      return Math.max(m ? m.getBoundingClientRect().right : 0, plus.getBoundingClientRect().right) + 2 * rem;
    }
    on(window, 'wheel', function(e){
      if(card.contains(e.target) && card.scrollHeight > card.clientHeight) return;
      var d = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      if(Math.abs(d) < 8) return;
      e.preventDefault();
      if(bOn){
        // on side B: the line slides with the wheel (crate, strip); scrolling back up (or left) turns the record over
        if((BACK === 'crate' || BACK === 'strip') && slide(d * 1.2) && !(d < 0 && bx >= -1)) return;
        var nb = Date.now(); if(nb - bTurn < 900) return;
        if(d < 0){ lock = nb; flip(false); }
        return;
      }
      var now = Date.now(); if(now - lock < 750) return; lock = now;
      // on past the last picture, the record turns over to side B
      if(d > 0 && at === n - 1 && bBtn){ flip(true); return; }
      go(at + (d > 0 ? 1 : -1));
    }, {passive: false});
    on(window, 'keydown', function(e){
      if(bOn && /^Arrow/.test(e.key)){ if(e.key === 'ArrowUp') flip(false); e.preventDefault(); return; }
      if(e.key === 'ArrowDown' || e.key === 'ArrowRight'){ go(at + 1); e.preventDefault(); }
      if(e.key === 'ArrowUp' || e.key === 'ArrowLeft'){ go(at - 1); e.preventDefault(); }
      if(e.key === 'Escape'){ if(bOn) flip(false); else if(isOpen()) toggle(false); else goHome(slug); }
    });
    var sx = null;
    st.addEventListener('touchstart', function(e){ sx = e.touches[0].clientX; }, {passive: true});
    st.addEventListener('touchend', function(e){ if(sx == null) return; var dx = e.changedTouches[0].clientX - sx; sx = null; if(bOn){ if(BACK === 'crate' || BACK === 'strip') slide(-dx * 2); return; } if(Math.abs(dx) > 40) go(at + (dx < 0 ? 1 : -1)); }, {passive: true});
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
