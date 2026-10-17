/*
  TEST: a visit to a project, the way you walk up to a painting in a museum (styles in museum.css).

    1. the wall: the home page as it is
    2. click a picture (or a title): it comes up close, whole, in the middle of the room
    3. scroll a little: it steps aside and its wall label appears beside it (name, facts, the text)
    4. scroll on: a new room with the rest of the project, hung one of three ways:
         walk       one long wall you walk along; scrolling down moves you sideways past the work
         salon      everything hung at once, edge to edge
         spotlight  a dark room, one work at a time, each lit as you come to it
       /?room=walk|salon|spot picks one (remembered for the visit); a small switch in the corner swaps it.

  Content comes from projects.js. Pictures are never cropped.
*/
(function(){
  var P = window.PROJECTS || {}, SLUGS = Object.keys(P);
  var ROOMS = [['walk', 'Walk'], ['salon', 'Salon'], ['spot', 'Spotlight']];
  var room = 'walk';
  try{
    var rq = /[?&]room=(walk|salon|spot)\b/.exec(location.search);
    if(rq) sessionStorage.setItem('gc-room', rq[1]);
    room = sessionStorage.getItem('gc-room') || 'walk';
  }catch(e){}

  // lighter copies of camera originals
  function web(src){
    if(src === 'img/anticlastic-roof-structure/hero.jpg') return 'img/anticlastic-roof-structure/hero-web.jpg';
    return src.replace(/\/physical\/(?!web\/)([^\/]+)$/, '/physical/web/$1');
  }
  function isDrawing(it){ return it.drawing || /\.(svg|png|webp)$/i.test(it.src); }
  function flat(list){ var o = []; (list || []).forEach(function(it){ Array.isArray(it) ? o.push.apply(o, it) : o.push(it); }); return o; }
  function el(tag, cls, text){ var e = document.createElement(tag); if(cls) e.className = cls; if(text != null) e.textContent = text; return e; }
  function paras(t){ return t ? (Array.isArray(t) ? t : [t]) : []; }
  function pad(n){ return (n < 10 ? '0' : '') + n; }
  function clamp(x, a, b){ return Math.max(a, Math.min(b, x)); }
  function ease(t){ return t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
  function fit(a, w, h){ return w / h > a ? {w: h * a, h: h} : {w: w, h: w / a}; }

  // the project's material in parts, as the project pages had it: hero, concept, drawings, physical model, photos
  // and renders. The grid (the newer hand-picked set) is used where a project has one, the galleries otherwise.
  function parts(p){
    var grid = flat(p.grid), g = p.gallery || {}, seen = {};
    function fresh(list, kind){
      return (list || []).filter(function(it){ var k = it.src && web(it.src); if(!k || seen[k]) return false; seen[k] = 1; return true; })
        .map(function(it){ return {src: web(it.src), caption: it.caption || '', kind: kind}; });
    }
    var drawings = grid.filter(isDrawing), physical = grid.filter(function(it){ return !isDrawing(it) && /\/physical\//.test(it.src); });
    var photos = grid.filter(function(it){ return !isDrawing(it) && !/\/physical\//.test(it.src); });
    if(!grid.length){ drawings = g.drawings || []; physical = g.physical || []; photos = g.photos || []; }
    if(!physical.length && g.physical) physical = g.physical;
    var out = [
      {name: 'Hero', items: fresh(p.hero ? [{src: p.hero}] : [], 'Hero')},
      {name: 'Concept', items: fresh(p.diagram && p.diagram.src ? [{src: p.diagram.src, caption: p.diagram.caption}] : [], 'Concept')},
      {name: 'Drawings', items: fresh(drawings, 'Drawing')},
      {name: 'Physical model', items: fresh(physical, 'Physical model')},
      {name: 'Photos and renders', items: fresh(photos, 'Photograph')}
    ];
    return out.filter(function(s){ return s.items.length; });
  }

  var ov = null, closeBtn = null, sw = null, state = null;
  function headerBottom(){ var h = document.querySelector('header.bar'); return h ? Math.round(h.getBoundingClientRect().bottom) : 0; }
  function narrow(){ return innerWidth <= 700; }

  // ---------- 2 + 3: up close, then the label ----------
  function open(slug, from, src, fromHistory){
    var p = P[slug];
    if(!p) return;
    var top = headerBottom();
    document.documentElement.style.setProperty('--m-top', top + 'px');
    if(ov) teardown(true);
    var all = parts(p), firstSrc = src ? web(src) : (all[0] && all[0].items[0].src);
    if(!firstSrc) return;
    if(!fromHistory) history.pushState({visit: slug, src: firstSrc}, '', '/?visit=' + slug);

    ov = el('div', 'museum');
    ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-label', p.title);
    var H = innerHeight - top;
    ov.style.setProperty('--m-h', H + 'px');
    var stage = el('section', 'm-stage'), roomEl = el('div', 'm-room');
    stage.style.height = narrow() ? 'auto' : Math.round(H * 1.75) + 'px';
    var pic = el('figure', 'm-pic'), img = new Image();
    img.alt = p.title; img.src = firstSrc;
    pic.appendChild(img);
    roomEl.appendChild(pic);

    // the label: one card with the name and the facts, one with the text
    var label = el('div', 'm-label');
    var c1 = el('div', 'm-card');
    c1.appendChild(el('h2', null, p.title));
    var cr = {}; (p.credits || []).forEach(function(r){ cr[r[0]] = r[1]; });
    c1.appendChild(el('p', 'sub', cr.Location || cr.School || cr.Practice || p.kicker || ''));
    var wl = el('p', 'work-line'); wl.appendChild(el('b', null, cr.Type || p.group)); if(cr.Year) wl.appendChild(document.createTextNode(', ' + cr.Year)); c1.appendChild(wl);
    (p.credits || []).forEach(function(r){
      if(/^(Type|Location|Year)$/.test(r[0])) return;
      var l = el('p', 'line'); l.appendChild(el('span', null, r[0] + '  ')); l.appendChild(document.createTextNode(r[1])); c1.appendChild(l);
    });
    label.appendChild(c1);
    var text = paras(p.text), lead = p.lede ? [p.lede] : [];
    var first = lead.concat(text.slice(0, 1));
    if(first.length){ var c2 = el('div', 'm-card'); first.forEach(function(t){ c2.appendChild(el('p', 'text', t)); }); label.appendChild(c2); }
    roomEl.appendChild(label);

    var hint = el('div', 'm-hint');
    hint.innerHTML = '<span>Scroll</span><svg viewBox="0 0 22 22"><path d="M4 7.5l7 7 7-7"/></svg>';
    roomEl.appendChild(hint);
    stage.appendChild(roomEl);
    ov.appendChild(stage);

    var gal = el('section', 'm-gallery');
    ov.appendChild(gal);
    document.body.appendChild(ov);
    document.body.classList.add('museum-on');

    closeBtn = el('button', 'm-close'); closeBtn.type = 'button'; closeBtn.setAttribute('aria-label', 'Back to the wall');
    closeBtn.innerHTML = '<svg viewBox="0 0 16 16"><path d="M3 3l10 10M13 3L3 13"/></svg>';
    closeBtn.addEventListener('click', function(){ close(); });
    document.body.appendChild(closeBtn);

    sw = el('div', 'm-switch'); sw.appendChild(el('span', null, 'Room'));
    ROOMS.forEach(function(r){
      var b = el('button', null, r[1]); b.type = 'button'; b.dataset.room = r[0];
      b.addEventListener('click', function(){ setRoom(r[0]); });
      sw.appendChild(b);
    });
    document.body.appendChild(sw);

    var rest = all.map(function(s){ return {name: s.name, items: s.items.filter(function(it){ return it.src !== firstSrc; })}; }).filter(function(s){ return s.items.length; });
    state = {slug: slug, p: p, parts: rest, pic: pic, img: img, label: label, hint: hint, stage: stage, gal: gal, H: H, a: from ? from.width / from.height : 1.5, opened: false};
    var start = function(){
      if(img.naturalWidth) state.a = img.naturalWidth / img.naturalHeight;
      layout();
      // the picture comes up from where it hung on the wall
      if(from && !narrow()){
        var r0 = rects().r0;
        setRect(pic, {x: from.left, y: from.top - top, w: from.width, h: from.height});
        void pic.offsetWidth;
        pic.classList.add('fly');
        setRect(pic, r0);
        setTimeout(function(){ if(state && state.pic === pic){ pic.classList.remove('fly'); state.opened = true; onScroll(); } }, 720);
      }
      else{ state.opened = true; onScroll(); }
    };
    if(img.complete && img.naturalWidth) start(); else { img.onload = start; img.onerror = start; }
    requestAnimationFrame(function(){ ov.classList.add('on'); closeBtn.classList.add('on'); });
    ov.addEventListener('scroll', onScroll, {passive: true});
    buildRoom();
    syncSwitch();
  }

  function setRect(e, r){ e.style.left = r.x + 'px'; e.style.top = r.y + 'px'; e.style.width = r.w + 'px'; e.style.height = r.h + 'px'; }
  // r0: close up, in the middle; r1: stepped aside to the left with room for the label on its right
  function rects(){
    var W = innerWidth, H = state.H, a = state.a, gut = Math.max(16, Math.min(40, W * .04));
    var s0 = fit(a, W * .84, H * .84), r0 = {x: (W - s0.w) / 2, y: (H - s0.h) / 2, w: s0.w, h: s0.h};
    var lw = state.label.offsetWidth || 336, gap = Math.max(40, W * .045);
    var areaW = W - gut * 2 - lw - gap * 2, s1 = fit(a, areaW, H * .74);
    var x1 = gut + gap * .5 + (areaW - s1.w) / 2;
    var r1 = {x: x1, y: (H - s1.h) / 2, w: s1.w, h: s1.h};
    return {r0: r0, r1: r1, gap: gap};
  }
  function layout(){
    if(!state) return;
    if(narrow()){ state.pic.removeAttribute('style'); return; }
    onScroll();
  }
  var ticking = false;
  function onScroll(){
    if(ticking) return;
    ticking = true;
    requestAnimationFrame(function(){ ticking = false; frame(); });
  }
  function frame(){
    if(!state || narrow()) { if(state) roomFrame(); return; }
    var y = ov.scrollTop, H = state.H, R = rects();
    var t = ease(clamp(y / (H * .55), 0, 1));
    if(state.opened){
      setRect(state.pic, {x: R.r0.x + (R.r1.x - R.r0.x) * t, y: R.r0.y + (R.r1.y - R.r0.y) * t, w: R.r0.w + (R.r1.w - R.r0.w) * t, h: R.r0.h + (R.r1.h - R.r0.h) * t});
    }
    // the label hangs beside the picture, its foot level with the picture's foot
    var lo = clamp((t - .35) / .65, 0, 1), L = state.label;
    L.style.left = (R.r1.x + R.r1.w + R.gap) + 'px';
    L.style.top = Math.max(16, R.r1.y + R.r1.h - L.offsetHeight) + 'px';
    L.style.opacity = lo;
    L.style.transform = 'translateY(' + Math.round((1 - lo) * 14) + 'px)';
    L.classList.toggle('on', lo > .5);
    state.hint.style.opacity = t < .05 ? 1 : (t > .98 ? 1 : 0);
    state.hint.firstChild.textContent = t > .98 ? 'More from this project' : 'Scroll';
    roomFrame();
  }

  // ---------- 4: the room ----------
  function setRoom(r){
    room = r;
    try{ sessionStorage.setItem('gc-room', r); }catch(e){}
    buildRoom();
    syncSwitch();
    ov.scrollTop = state.gal.offsetTop;
  }
  function syncSwitch(){ Array.prototype.forEach.call(sw.querySelectorAll('button'), function(b){ b.setAttribute('aria-pressed', b.dataset.room === room ? 'true' : 'false'); }); }

  function wallText(p){
    var w = el('div', 'm-walltext');
    var head = el('div');
    head.appendChild(el('span', 'k', p.group + (p.kicker ? ' · ' + p.kicker : '')));
    head.appendChild(el('h3', null, p.title));
    w.appendChild(head);
    var rest = el('div');
    var text = paras(p.text);
    (text.length > 1 ? text.slice(1) : (p.lede && text.length ? [] : text)).forEach(function(t){ rest.appendChild(el('p', null, t)); });
    w.appendChild(rest);
    return w;
  }
  function endPiece(){
    var i = SLUGS.indexOf(state.slug), ns = SLUGS[(i + 1) % SLUGS.length];
    // the next project that has something to hang
    for(var k = 1; k < SLUGS.length; k++){ ns = SLUGS[(i + k) % SLUGS.length]; if(parts(P[ns]).length) break; }
    var e = el('div', 'm-end');
    var b1 = el('button'); b1.type = 'button'; b1.appendChild(el('span', 'm-tag', 'Back')); b1.appendChild(document.createTextNode('To the wall'));
    b1.addEventListener('click', function(){ close(); });
    var b2 = el('button'); b2.type = 'button'; b2.appendChild(el('span', 'm-tag', 'Next room')); b2.appendChild(document.createTextNode(P[ns].title + ' →'));
    b2.addEventListener('click', function(){ open(ns, null, null); });
    e.appendChild(b1); e.appendChild(b2);
    return e;
  }
  function items(){ var o = []; state.parts.forEach(function(s){ s.items.forEach(function(it){ o.push(it); }); }); return o; }

  function buildRoom(){
    var gal = state.gal, p = state.p, H = state.H;
    gal.innerHTML = ''; gal.className = 'm-gallery';
    state.walk = null;
    var n = 0, total = items().length;
    if(room === 'walk' && !narrow()){
      var walk = el('div', 'm-walk'), view = el('div', 'm-walk-view'), track = el('div', 'm-walk-track');
      track.appendChild(wallText(p));
      state.parts.forEach(function(s){
        var grp = el('div', 'm-group');
        var tag = el('div', 'm-tag'); tag.appendChild(el('b', null, s.name)); tag.appendChild(document.createTextNode(s.items.length)); grp.appendChild(tag);
        s.items.forEach(function(it, k){
          n++;
          var f = el('figure', 'm-work'), im = new Image();
          var hh = Math.round(H * .91 * (it.kind === 'Drawing' || it.kind === 'Concept' ? .7 : (it.kind === 'Hero' ? .66 : (k % 2 ? .5 : .58))));
          im.style.height = hh + 'px'; im.alt = it.caption || p.title;
          im.onload = sizeWalk; im.src = it.src;
          f.appendChild(im);
          var cap = el('figcaption'); cap.appendChild(el('b', null, pad(n))); cap.appendChild(document.createTextNode(it.caption || it.kind));
          f.appendChild(cap);
          grp.appendChild(f);
        });
        track.appendChild(grp);
      });
      track.appendChild(endPiece());
      view.appendChild(track); walk.appendChild(view); gal.appendChild(walk);
      state.walk = {el: walk, track: track};
      sizeWalk();
    }
    else if(room === 'salon'){
      var salon = el('div', 'm-salon');
      salon.appendChild(wallText(p));
      var rows = el('div', 'm-salon-rows'); salon.appendChild(rows);
      salon.appendChild(endPiece());
      gal.appendChild(salon);
      var list = items(), left = list.length;
      list.forEach(function(it){
        var im = new Image();
        im.onload = im.onerror = function(){ it.a = im.naturalWidth ? im.naturalWidth / im.naturalHeight : 1.5; if(--left === 0) hang(); };
        im.src = it.src;
      });
      // rows of even height across the width, each picture whole (justified rows)
      var hang = function(){
        if(!state || state.gal !== gal) return;
        rows.innerHTML = '';
        var W = rows.clientWidth, gap = 14, target = Math.max(180, H * .46), row = [], sum = 0;
        function flush(last){
          if(!row.length) return;
          var h = last ? Math.min(target, (W - gap * (row.length - 1)) / sum) : (W - gap * (row.length - 1)) / sum;
          var r = el('div', 'm-row');
          row.forEach(function(it){
            var f = el('figure'), im = new Image(); im.src = it.src; im.alt = it.caption || p.title;
            f.style.width = Math.floor(it.a * h) + 'px'; f.style.height = Math.floor(h) + 'px';
            f.appendChild(im); f.appendChild(el('span', 'cap', it.caption || it.kind));
            f.addEventListener('click', function(){ zoom(it.src); });
            r.appendChild(f);
          });
          rows.appendChild(r); row = []; sum = 0;
        }
        list.forEach(function(it){ row.push(it); sum += it.a; if((W - gap * (row.length - 1)) / sum < target) flush(false); });
        flush(true);
      };
      state.hang = hang;
    }
    else{
      var spot = el('div', 'm-spot');
      var intro = el('div', 'm-slide'); intro.appendChild(wallText(p)); spot.appendChild(intro);
      items().forEach(function(it){
        n++;
        var s = el('div', 'm-slide'), im = new Image(); im.src = it.src; im.alt = it.caption || p.title;
        s.appendChild(im);
        var tg = el('div', 'm-tag'); tg.appendChild(el('b', null, it.kind)); tg.appendChild(document.createTextNode(it.caption || '')); s.appendChild(tg);
        s.appendChild(el('div', 'm-tag count', pad(n) + ' / ' + pad(total)));
        spot.appendChild(s);
      });
      spot.appendChild(endPiece());
      gal.appendChild(spot);
      // a work is lit while it is in front of you
      var io = new IntersectionObserver(function(es){ es.forEach(function(e){ e.target.classList.toggle('lit', e.isIntersecting); }); }, {root: ov, threshold: .6});
      Array.prototype.forEach.call(spot.querySelectorAll('.m-slide'), function(s){ io.observe(s); });
      state.io = io;
    }
  }
  // the walk is as tall as the wall is long, so scrolling down carries you along it
  function sizeWalk(){
    if(!state || !state.walk) return;
    var w = state.walk, len = w.track.scrollWidth - innerWidth;
    w.el.style.height = (state.H + Math.max(0, len)) + 'px';
    roomFrame();
  }
  function roomFrame(){
    if(!state || !state.walk) return;
    var w = state.walk;
    var x = clamp(ov.scrollTop - state.gal.offsetTop, 0, Math.max(0, w.track.scrollWidth - innerWidth));
    w.track.style.transform = 'translateX(' + (-x) + 'px)';
  }
  function zoom(src){
    var z = el('div', 'm-zoom'), im = new Image(); im.src = src; z.appendChild(im);
    z.addEventListener('click', function(){ z.classList.remove('on'); setTimeout(function(){ z.remove(); }, 300); });
    document.body.appendChild(z); requestAnimationFrame(function(){ z.classList.add('on'); });
  }

  // ---------- leaving ----------
  function teardown(now){
    if(!ov) return;
    var o = ov, c = closeBtn, s = sw;
    if(state && state.io) state.io.disconnect();
    ov = closeBtn = sw = state = null;
    document.body.classList.remove('museum-on');
    if(now){ o.remove(); c.remove(); s.remove(); return; }
    o.classList.remove('on'); c.classList.remove('on'); s.style.opacity = 0;
    setTimeout(function(){ o.remove(); c.remove(); s.remove(); }, 460);
  }
  function close(){
    if(!ov) return;
    teardown(false);
    if(history.state && history.state.visit) history.replaceState(null, '', '/');
  }
  window.addEventListener('popstate', function(e){
    if(e.state && e.state.visit) open(e.state.visit, null, e.state.src, true);
    else teardown(false);
  });
  document.addEventListener('keydown', function(e){
    if(!ov) return;
    if(e.key === 'Escape'){
      var z = document.querySelector('.m-zoom'); if(z){ z.click(); } else close();
      e.stopImmediatePropagation(); e.preventDefault();
    }
  }, true);
  window.addEventListener('resize', function(){
    if(!state) return;
    state.H = innerHeight - headerBottom();
    ov.style.setProperty('--m-h', state.H + 'px');
    if(!narrow()) state.stage.style.height = Math.round(state.H * 1.75) + 'px';
    layout();
    if(state.hang) state.hang();
    sizeWalk();
  });

  window.gcMuseum = {open: function(slug, from, src){ open(slug, from, src); }, isOpen: function(){ return !!ov; }};
  var vq = /[?&]visit=([\w-]+)/.exec(location.search);
  if(vq && P[vq[1]]){
    var go = function(){ history.replaceState(null, '', '/'); open(vq[1], null, null); };
    if(document.readyState === 'complete') go(); else window.addEventListener('load', go);
  }
})();
