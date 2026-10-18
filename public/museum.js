/*
  TEST: a visit to a project, the way you walk up to a painting in a museum (styles in museum.css).

    1. the wall: the home page as it is
    2. click a picture (or a title): it comes up close, whole, in the middle of the room
    3. scroll a little: it steps to the right and its wall label appears on the left (name, facts, the text);
       "More info" widens the label to the whole text
    4. scroll on: the rest of the project, hung one of three ways:
         walk       the label stays; the picture goes up and the second comes up in its place, then each scroll
                    moves one picture to the right
         salon      the rest hung loosely on one wall you scroll over freely: loose, pairs or column (/?hang=)
         spotlight  a dark room you cross to the right, one work at a time, each lit as you come to it
       /?room=walk|salon|spot picks one (remembered for the visit); a small switch in the corner swaps it.
  Every scroll (a wheel gesture, an arrow key) goes one step, gliding slowly; the salon's wall scrolls freely.

  Content comes from projects.js. Pictures are never cropped.
*/
(function(){
  var P = window.PROJECTS || {}, SLUGS = Object.keys(P);
  var ROOMS = [['walk', 'Walk'], ['salon', 'Salon'], ['spot', 'Spotlight']];
  var HANGS = [['loose', 'Loose'], ['pairs', 'Pairs'], ['column', 'Column']];
  var room = 'walk', hangStyle = 'loose';
  try{
    var hq = /[?&]hang=(loose|pairs|column)\b/.exec(location.search);
    if(hq) sessionStorage.setItem('gc-hang', hq[1]);
    hangStyle = sessionStorage.getItem('gc-hang') || 'loose';
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
    var allText = lead.concat(text), shown = lead.length + Math.min(1, text.length);
    if(allText.length){
      var c2 = el('div', 'm-card');
      allText.forEach(function(t, i){ c2.appendChild(el('p', 'text' + (i >= shown ? ' extra' : ''), t)); });
      if(allText.length > shown){
        var more = el('button', 'm-more-btn', 'More info'); more.type = 'button';
        more.addEventListener('click', function(){
          var on = label.classList.toggle('open');
          more.textContent = on ? 'Less' : 'More info';
          if(!on) label.scrollTop = 0;
          follow(500);   // the picture makes room as the label widens
        });
        c2.appendChild(more);
      }
      label.appendChild(c2);
    }
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
    var hs = el('div', 'm-hangs'); hs.appendChild(el('span', null, 'Hang'));
    HANGS.forEach(function(h){
      var b = el('button', null, h[1]); b.type = 'button'; b.dataset.hang = h[0];
      b.addEventListener('click', function(){ setHang(h[0]); });
      hs.appendChild(b);
    });
    sw.appendChild(hs);
    document.body.appendChild(sw);

    var rest = all.map(function(s){ return {name: s.name, items: s.items.filter(function(it){ return it.src !== firstSrc; })}; }).filter(function(s){ return s.items.length; });
    state = {slug: slug, p: p, parts: rest, pic: pic, img: img, label: label, hint: hint, stage: stage, roomEl: roomEl, gal: gal, H: H, a: from ? from.width / from.height : 1.5, opened: false};
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
    ov.addEventListener('wheel', onWheel, {passive: false});
    buildRoom(); sizeStage();
    syncSwitch();
  }

  function setRect(e, r){ e.style.left = r.x + 'px'; e.style.top = r.y + 'px'; e.style.width = r.w + 'px'; e.style.height = r.h + 'px'; }
  // r0: close up, in the middle; r1: stepped to the right, leaving the left for the label (areaL is where the
  // pictures' side begins). On the walk each picture has a bay (sw wide) a little narrower than that side, so the
  // next one shows at the right edge.
  function rects(){
    var W = innerWidth, H = state.H, a = state.a, gut = Math.max(16, Math.min(40, W * .04));
    var s0 = fit(a, W * .84, H * .84), r0 = {x: (W - s0.w) / 2, y: (H - s0.h) / 2, w: s0.w, h: s0.h};
    var lw = state.label.offsetWidth || 336, gap = Math.max(40, W * .045);
    var areaL = gut + lw + gap, areaW = W - areaL - gut, bay = state.walk ? areaW * .8 : areaW;
    var s1 = fit(a, bay, H * .74), r1 = {x: areaL + (bay - s1.w) / 2, y: (H - s1.h) / 2, w: s1.w, h: s1.h};
    return {r0: r0, r1: r1, gap: gap, gut: gut, areaL: areaL, bay: bay};
  }
  // where the scroll rests: close up, the label, then one screen of scroll per picture. The room is sticky, one
  // screen tall, so the stage is as tall as the walk is long.
  function labelStop(){ return Math.round(state.H * .6); }
  function sizeStage(){
    if(!state) return;
    if(narrow()){ state.stage.style.height = 'auto'; return; }
    var n = state.walk ? state.walk.slides.length : 0;
    state.stage.style.height = (n ? state.H + labelStop() + n * state.H : Math.round(state.H * 1.75)) + 'px';
  }
  function stops(){
    var L = labelStop(), H = state.H, o = [0, L];
    if(state.walk) state.walk.slides.forEach(function(s, k){ o.push(L + (k + 1) * H); });
    else if(state.spot) state.spot.slides.forEach(function(s, k){ o.push(state.gal.offsetTop + k * H); });
    else o.push(state.gal.offsetTop);
    return o;
  }
  function layout(){
    if(!state) return;
    if(narrow()){ state.pic.removeAttribute('style'); onScroll(); return; }
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
    var y = ov.scrollTop, H = state.H, R = rects(), L0 = labelStop();
    var t = ease(clamp(y / (H * .55), 0, 1));
    // on the walk, past the label: the first picture goes up and the second comes up in its place, then each
    // step goes one bay to the right; the label stays
    var dy = state.walk ? clamp(y - L0, 0, H) : 0, k = state.walk ? Math.max(0, (y - L0 - H) / H) : 0;
    if(state.opened){
      setRect(state.pic, {x: R.r0.x + (R.r1.x - R.r0.x) * t, y: R.r0.y + (R.r1.y - R.r0.y) * t - dy, w: R.r0.w + (R.r1.w - R.r0.w) * t, h: R.r0.h + (R.r1.h - R.r0.h) * t});
    }
    // the label hangs on the left, its foot level with the picture's foot, and stays there
    var lo = clamp((t - .35) / .65, 0, 1), L = state.label;
    L.style.left = R.gut + 'px';
    L.style.top = Math.max(16, R.r1.y + R.r1.h - L.offsetHeight) + 'px';
    L.style.opacity = lo;
    L.style.transform = 'translateX(' + Math.round((lo - 1) * 16) + 'px)';
    L.classList.toggle('on', lo > .5);
    if(state.walk){
      var w = state.walk;
      w.pane.style.left = R.areaL + 'px';
      w.slides.forEach(function(s){ s.style.width = R.bay + 'px'; s.style.marginRight = R.gap + 'px'; });
      w.trail.style.transform = 'translate(' + Math.round(-k * (R.bay + R.gap)) + 'px,' + Math.round(H - dy) + 'px)';
    }
    state.hint.style.opacity = t < .05 ? 1 : (t > .98 && dy < 4 ? 1 : 0);
    state.hint.firstChild.textContent = t > .98 ? 'More from this project' : 'Scroll';
    roomFrame();
  }

  // ---------- 4: the room ----------
  function setRoom(r){
    room = r;
    try{ sessionStorage.setItem('gc-room', r); }catch(e){}
    buildRoom(); sizeStage();
    syncSwitch();
    ov.scrollTop = room === 'walk' && !narrow() ? labelStop() + state.H : state.gal.offsetTop;
  }
  function setHang(h){
    hangStyle = h;
    try{ sessionStorage.setItem('gc-hang', h); }catch(e){}
    if(state.hang) state.hang();
    syncSwitch();
  }
  function syncSwitch(){
    Array.prototype.forEach.call(sw.querySelectorAll('button[data-room]'), function(b){ b.setAttribute('aria-pressed', b.dataset.room === room ? 'true' : 'false'); });
    Array.prototype.forEach.call(sw.querySelectorAll('button[data-hang]'), function(b){ b.setAttribute('aria-pressed', b.dataset.hang === hangStyle ? 'true' : 'false'); });
    sw.classList.toggle('salon', room === 'salon');
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
  function figure(it, n, total, cls){
    var f = el('figure', cls), im = new Image();
    im.alt = it.caption || state.p.title; im.src = it.src;
    f.appendChild(im);
    var cap = el('figcaption', 'm-tag'); cap.appendChild(el('b', null, pad(n) + ' / ' + pad(total))); cap.appendChild(document.createTextNode(it.caption || it.kind));
    f.appendChild(cap);
    return f;
  }

  function buildRoom(){
    var gal = state.gal, H = state.H;
    gal.innerHTML = ''; gal.className = 'm-gallery';
    if(state.io) state.io.disconnect();
    state.walk = null; state.spot = null; state.hang = null; state.io = null;
    var old = state.roomEl.querySelector('.m-pane'); if(old) old.remove();
    var list = items(), total = list.length;
    if(room === 'walk' && !narrow()){
      // the rest of the work in a row of bays on the label's right; it comes up from below, then moves sideways
      var pane = el('div', 'm-pane'), trail = el('div', 'm-trail'), slides = [];
      list.forEach(function(it, i){
        var sl = el('div', 'm-step'); sl.appendChild(figure(it, i + 1, total));
        trail.appendChild(sl); slides.push(sl);
      });
      var last = el('div', 'm-step'); last.appendChild(endPiece()); trail.appendChild(last); slides.push(last);
      pane.appendChild(trail);
      state.roomEl.insertBefore(pane, state.label);
      state.walk = {pane: pane, trail: trail, slides: slides};
    }
    else if(room === 'salon'){
      // the rest hung loosely on one wall that you look over freely, in one of three hangs
      var salon = el('div', 'm-salon'), wall = el('div', 'm-wall');
      salon.appendChild(wall); salon.appendChild(endPiece());
      gal.appendChild(salon);
      var left = list.length;
      list.forEach(function(it){
        var im = new Image();
        im.onload = im.onerror = function(){ it.a = im.naturalWidth ? im.naturalWidth / im.naturalHeight : 1.5; if(--left === 0) hang(); };
        im.src = it.src;
      });
      var hang = function(){
        if(!state || state.gal !== gal || left > 0) return;
        wall.innerHTML = '';
        var W = wall.clientWidth, placed = [], bottom = 0, gapY = Math.max(48, H * .1);
        function below(){ return placed.length ? bottom + gapY : 0; }
        function put(it, i, x, w, y){
          var h = w / it.a;
          // unless told where, as high as it can go without touching anything above it
          if(y == null){ y = 0; placed.forEach(function(r){ if(x < r.x + r.w + 24 && x + w + 24 > r.x) y = Math.max(y, r.y + r.h + gapY); }); }
          var f = figure(it, i + 1, total, 'm-hung');
          f.style.left = x + 'px'; f.style.top = y + 'px'; f.style.width = w + 'px';
          f.querySelector('img').style.height = h + 'px';
          f.addEventListener('click', function(){ zoom(it.src); });
          wall.appendChild(f);
          placed.push({x: x, y: y, w: w, h: h}); bottom = Math.max(bottom, y + h);
        }
        function size(it, wf, hmax){ var w = W * wf; return Math.min(w, hmax * it.a); }
        if(hangStyle === 'loose'){
          // scattered, as on the home wall: varied sizes and positions, nothing touching
          var WF = [.4, .28, .34, .24, .44, .3, .36], XF = [.02, .56, .2, .66, .06, .46, .28];
          list.forEach(function(it, i){
            var w = size(it, WF[i % WF.length] * (it.kind === 'Drawing' || it.kind === 'Concept' ? 1.15 : 1), H * .62);
            put(it, i, clamp(W * XF[i % XF.length], 0, W - w), w);
          });
        }
        else if(hangStyle === 'pairs'){
          // two at a time, large, the pair stepping left and right down the wall
          for(var i = 0; i < list.length; i += 2){
            var a = list[i], b = list[i + 1], g = Math.max(32, W * .05), row = W * .86;
            var h = b ? Math.min(H * .58, (row - g) / (a.a + b.a)) : Math.min(H * .62, row * .6 / a.a);
            var x0 = (i / 2) % 2 ? W - (b ? h * (a.a + b.a) + g : h * a.a) : 0, y0 = below();
            put(a, i, x0, h * a.a, y0);
            if(b) put(b, i + 1, x0 + h * a.a + g, h * b.a, y0);
          }
        }
        else{
          // one at a time down a long wall, each stepping left, centre, right
          var XS = [.06, .5, .94];
          list.forEach(function(it, i){
            var w = size(it, .56, H * .7), c = W * XS[i % 3];
            put(it, i, clamp(c - w / 2, 0, W - w), w, below());
          });
        }
        wall.style.height = (bottom + 40) + 'px';
      };
      state.hang = hang;
    }
    else{
      // a dark room you walk across to the right, one work at a time, each lit as you come to it
      var spot = el('div', 'm-spot'), view = el('div', 'm-spot-view'), track = el('div', 'm-spot-track'), sls = [];
      list.forEach(function(it, i){
        var s = el('div', 'm-slide'), im = new Image(); im.src = it.src; im.alt = it.caption || state.p.title;
        s.appendChild(im);
        var tg = el('div', 'm-tag'); tg.appendChild(el('b', null, it.kind)); tg.appendChild(document.createTextNode(it.caption || '')); s.appendChild(tg);
        s.appendChild(el('div', 'm-tag count', pad(i + 1) + ' / ' + pad(total)));
        track.appendChild(s); sls.push(s);
      });
      var endS = el('div', 'm-slide m-slide-end'); endS.appendChild(endPiece()); track.appendChild(endS); sls.push(endS);
      view.appendChild(track); spot.appendChild(view); gal.appendChild(spot);
      spot.style.height = sls.length * H + 'px';
      state.spot = {el: spot, track: track, slides: sls};
    }
  }
  // the spotlight room: scrolling down carries you sideways, one screen of scroll per work
  function roomFrame(){
    if(!state || !state.spot) return;
    var s = state.spot, k = clamp((ov.scrollTop - state.gal.offsetTop) / state.H, 0, s.slides.length - 1), cw = ov.clientWidth;
    s.slides.forEach(function(sl){ sl.style.width = cw + 'px'; });
    s.track.style.transform = 'translateX(' + (-k * cw) + 'px)';
    var here = Math.round(k);
    s.slides.forEach(function(sl, i){ sl.classList.toggle('lit', i === here && ov.scrollTop >= state.gal.offsetTop - state.H * .5); });
  }
  // keep the layout in step for a moment (while the label widens or narrows)
  function follow(ms){ var end = performance.now() + ms; (function go(){ frame(); if(performance.now() < end) requestAnimationFrame(go); })(); }

  // ---------- one step per scroll: each wheel gesture or key press goes to the next resting place ----------
  var anim = 0, goal = null, locked = false, quiet = 0;
  function glide(to){
    var from = ov.scrollTop, t0 = performance.now(), d = 1100;   // slow, so each step reads as one move
    goal = to; cancelAnimationFrame(anim);
    (function go(now){
      if(!ov) return;
      var k = clamp((now - t0) / d, 0, 1), e = k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      ov.scrollTop = from + (to - from) * e;
      if(k < 1) anim = requestAnimationFrame(go); else { anim = 0; goal = null; }
    })(t0);
  }
  function step(dir){
    var list = stops(), y = goal != null ? goal : ov.scrollTop, cur = 0;
    list.forEach(function(v, i){ if(Math.abs(v - y) < Math.abs(list[cur] - y)) cur = i; });
    if(dir > 0 && list[cur] < y - 2) cur--;          // between two stops: the next one is the one ahead
    if(dir < 0 && list[cur] > y + 2) cur++;
    var next = clamp(cur + dir, 0, list.length - 1);
    if(Math.abs(list[next] - y) < 2) return false;
    glide(list[next]);
    return true;
  }
  // the salon is hung on one wall you look over freely; stepping only takes you to it and back
  function free(dir){
    if(room !== 'salon') return false;
    var g = state.gal.offsetTop, y = ov.scrollTop;
    return y > g + 2 || (y >= g - 2 && dir > 0);
  }
  function release(){
    clearTimeout(quiet);
    quiet = setTimeout(function(){ if(anim){ release(); return; } locked = false; acc = 0; }, 200);
  }
  var acc = 0;
  function onWheel(e){
    if(!state || narrow() || e.ctrlKey || document.querySelector('.m-zoom')) return;
    var dir = e.deltaY > 0 ? 1 : -1;
    var L = e.target.closest && e.target.closest('.m-label.open');
    if(L && L.scrollHeight > L.clientHeight + 1 && (dir > 0 ? L.scrollTop + L.clientHeight < L.scrollHeight - 1 : L.scrollTop > 0)) return;   // reading the whole text
    if(Math.abs(e.deltaX) > Math.abs(e.deltaY) || free(dir)) return;
    e.preventDefault();
    if(locked){ release(); return; }
    acc += e.deltaY * (e.deltaMode === 1 ? 33 : e.deltaMode === 2 ? 600 : 1);
    if(Math.abs(acc) < 30) return;
    acc = 0;
    if(step(dir)){ locked = true; release(); }
  }
  function onKey(e){
    if(!state || narrow() || e.metaKey || e.ctrlKey || e.altKey || document.querySelector('.m-zoom')) return;
    var dir = {ArrowDown: 1, PageDown: 1, ' ': 1, ArrowUp: -1, PageUp: -1}[e.key];
    if(!dir || free(dir) || (e.target.closest && e.target.closest('button'))) return;
    e.preventDefault();
    step(e.shiftKey && e.key === ' ' ? -1 : dir);
  }
  document.addEventListener('keydown', onKey);
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
    sizeStage();
    layout();
    if(state.hang) state.hang();
  });

  window.gcMuseum = {open: function(slug, from, src){ open(slug, from, src); }, isOpen: function(){ return !!ov; }};
  var vq = /[?&]visit=([\w-]+)/.exec(location.search);
  if(vq && P[vq[1]]){
    var go = function(){ history.replaceState(null, '', '/'); open(vq[1], null, null); };
    if(document.readyState === 'complete') go(); else window.addEventListener('load', go);
  }
})();
