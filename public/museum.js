/*
  TEST: a visit to a project, the way you walk up to a painting in a museum (styles in museum.css).

    1. the wall: the home page as it is
    2. click a picture (or a title): it comes up close, whole, in the middle of the room
    3. scroll a little: it steps to the right and its wall label appears on the left (name, facts, the text);
       "More info" widens the label to the whole text
    4. scroll on: the rest of the project, hung one of three ways:
         walk   the label stays; the picture goes up and the second comes up in its place, then each scroll
                moves one picture to the right, each lit as it arrives; a small bar under them says where you are
         salon  everything at once, hung in openings like the home page's wall
       /?room=walk|salon picks one (remembered for the visit); a small switch in the corner swaps it.
  Every scroll (a wheel gesture, an arrow key) goes one step, gliding slowly.

  Content comes from projects.js. Pictures are never cropped.
*/
(function(){
  var P = window.PROJECTS || {}, SLUGS = Object.keys(P);
  var ROOMS = [['walk', 'Walk'], ['salon', 'Salon']];
  var room = 'walk';
  try{
    var rq = /[?&]room=(walk|salon)\b/.exec(location.search);
    if(rq) sessionStorage.setItem('gc-room', rq[1]);
    room = sessionStorage.getItem('gc-room') === 'salon' ? 'salon' : 'walk';
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
          if(state.hang) setTimeout(function(){ if(state && state.hang) state.hang(); }, 480);
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
    var n = state.walk ? state.walk.slides.length : (state.salon ? 1 : 0);
    state.stage.style.height = (n ? state.H + labelStop() + n * state.H : Math.round(state.H * 1.75)) + 'px';
  }
  function stops(){
    var L = labelStop(), H = state.H, o = [0, L];
    if(state.walk) state.walk.slides.forEach(function(s, k){ o.push(L + (k + 1) * H); });
    else if(state.salon) o.push(L + H);
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
    var dy = state.walk || state.salon ? clamp(y - L0, 0, H) : 0, k = state.walk ? Math.max(0, (y - L0 - H) / H) : 0;
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
      // the pane is one bay wide, so the next picture stays out of sight until it comes
      w.pane.style.left = R.areaL + 'px'; w.pane.style.width = R.bay + 'px';
      w.slides.forEach(function(s){ s.style.width = R.bay + 'px'; s.style.marginRight = R.gap + 'px'; });
      w.trail.style.transform = 'translate(' + Math.round(-k * (R.bay + R.gap)) + 'px,' + Math.round(H - dy) + 'px)';
      // a picture is lit while it is in front of you, as in a dark room
      var here = dy < H * .5 ? -1 : Math.round(k);
      w.slides.forEach(function(s, i){ s.classList.toggle('lit', i === here); });
      // the bar: one mark per picture (the first one included), the one in front of you dark
      // it shows once you are among the rest, moving sideways (not on the first picture)
      var at = Math.min(Math.round(k), w.marks.length - 1);
      w.bar.style.left = R.areaL + 'px'; w.bar.style.width = R.bay + 'px';
      w.bar.classList.toggle('on', dy >= H * .5);
      w.marks.forEach(function(m, i){ m.classList.toggle('here', i === at); });
    }
    if(state.salon){
      // the salon's wall comes up beside the label, which stays
      var sp = state.salon.pane;
      sp.style.left = R.areaL + 'px'; sp.style.width = (innerWidth - R.areaL - R.gut) + 'px';
      sp.style.transform = 'translateY(' + Math.round(H - dy) + 'px)';
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
    ov.scrollTop = narrow() ? state.gal.offsetTop : labelStop() + state.H;
  }
  function syncSwitch(){
    Array.prototype.forEach.call(sw.querySelectorAll('button[data-room]'), function(b){ b.setAttribute('aria-pressed', b.dataset.room === room ? 'true' : 'false'); });
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
    f.appendChild(el('figcaption', 'm-tag', it.caption || it.kind));
    return f;
  }

  function buildRoom(){
    var gal = state.gal, H = state.H;
    gal.innerHTML = ''; gal.className = 'm-gallery';
    state.walk = null; state.hang = null; state.salon = null;
    Array.prototype.forEach.call(state.roomEl.querySelectorAll('.m-pane,.m-bar'), function(e){ e.remove(); });
    var list = items(), total = list.length;
    if(narrow()){
      // on a phone: the rest, one under the other
      var col = el('div', 'm-list');
      list.forEach(function(it, i){ col.appendChild(figure(it, i + 1, total)); });
      col.appendChild(endPiece());
      gal.appendChild(col);
    }
    else if(room === 'walk'){
      // the rest of the work in a row of bays on the label's right; it comes up from below, then moves sideways
      var pane = el('div', 'm-pane'), trail = el('div', 'm-trail'), slides = [];
      list.forEach(function(it, i){
        var sl = el('div', 'm-step'); sl.appendChild(figure(it, i + 1, total));
        trail.appendChild(sl); slides.push(sl);
      });
      var last = el('div', 'm-step m-step-end'); last.appendChild(endPiece()); trail.appendChild(last); slides.push(last);
      pane.appendChild(trail);
      var bar = el('div', 'm-bar'), marks = [];
      // the bar: one mark per picture after the first; each takes you to its picture
      list.forEach(function(it, i){
        var mk = el('button'); mk.type = 'button'; mk.setAttribute('aria-label', it.caption || it.kind);
        mk.addEventListener('click', function(){ glide(labelStop() + (i + 1) * state.H); });
        bar.appendChild(mk); marks.push(mk);
      });
      state.roomEl.insertBefore(pane, state.label);
      state.roomEl.appendChild(bar);
      state.walk = {pane: pane, trail: trail, slides: slides, bar: bar, marks: marks};
    }
    else{
      // the salon: everything at once, in openings like the home page's wall (the same bay of openings, as many bays
      // as the pictures need). Each opening takes its picture's proportions inside its place, so nothing is cropped;
      // the places left over stay empty, drawn as splayed reveals.
      // It comes up on the label's right, as the walk's pictures do, and the label stays.
      var salon = el('div', 'm-pane m-salon'), wall = el('div', 'm-wall');
      salon.appendChild(wall);
      var foot = el('div', 'm-salon-foot'); foot.appendChild(endPiece()); salon.appendChild(foot);
      state.roomEl.insertBefore(salon, state.label);
      var R0 = rects(); salon.style.left = R0.areaL + 'px'; salon.style.width = (innerWidth - R0.areaL - R0.gut) + 'px';
      state.salon = {pane: salon};
      var left = list.length;
      list.forEach(function(it){
        var im = new Image();
        im.onload = im.onerror = function(){ it.a = im.naturalWidth ? im.naturalWidth / im.naturalHeight : 1.5; if(--left === 0) hang(); };
        im.src = it.src;
      });
      var hang = function(){
        if(!state || state.gal !== gal || left > 0) return;
        wall.innerHTML = '';
        var nb = Math.max(1, Math.ceil(list.length / BAY.length)), WW = nb * 100, WH = 90;
        var slots = [];
        for(var b = 0; b < nb; b++) BAY.forEach(function(o){
          var w = o.w, h = o.w / o.r, flip = b % 2 === 1;
          slots.push({x: b * 100 + o.x, y: flip ? WH - o.y - h : o.y, w: w, h: h, r: o.r});
        });
        // the box the wall fits in, and its scale (wall units to pixels)
        var bw = wall.clientWidth, bh = wall.clientHeight, sc = Math.min(bw / WW, bh / WH), ox = (bw - WW * sc) / 2, oy = (bh - WH * sc) / 2;
        // like goes with like: each picture takes the free place nearest its own proportions
        var pics = list.slice(), taken = {};
        var pick = pics.map(function(it){
          var best = -1;
          slots.forEach(function(sl, k){ if(!taken[k] && (best < 0 || Math.abs(Math.log(sl.r / it.a)) < Math.abs(Math.log(slots[best].r / it.a)))) best = k; });
          taken[best] = 1; return best;
        });
        var NS = 'http://www.w3.org/2000/svg', svg = document.createElementNS(NS, 'svg');
        svg.setAttribute('class', 'facade'); svg.setAttribute('viewBox', '0 0 ' + bw + ' ' + bh);
        function line(x1, y1, x2, y2){ var l = document.createElementNS(NS, 'line'); l.setAttribute('x1', x1); l.setAttribute('y1', y1); l.setAttribute('x2', x2); l.setAttribute('y2', y2); svg.appendChild(l); }
        function rect(x, y, w, h, c){ var r = document.createElementNS(NS, 'rect'); r.setAttribute('x', x); r.setAttribute('y', y); r.setAttribute('width', w); r.setAttribute('height', h); r.setAttribute('class', c); svg.appendChild(r); }
        slots.forEach(function(sl, k){
          var X = ox + sl.x * sc, Y = oy + sl.y * sc, Wd = sl.w * sc, Ht = sl.h * sc, j = pick.indexOf(k);
          if(j < 0){
            // an empty opening: the splayed reveal
            var gw = Wd * .28, gh = Ht * .24, gx = X + (Wd - gw) / 2, gy = Y + (Ht - gh) / 2;
            rect(X, Y, Wd, Ht, 'splay');
            line(X, Y, gx, gy); line(X + Wd, Y, gx + gw, gy); line(X + Wd, Y + Ht, gx + gw, gy + gh); line(X, Y + Ht, gx, gy + gh);
            rect(gx, gy, gw, gh, 'pane');
            return;
          }
          var it = pics[j], s1 = fit(it.a, Wd, Ht);
          var f = el('figure', 'm-hung'), im = new Image(); im.src = it.src; im.alt = it.caption || state.p.title;
          f.style.left = (X + (Wd - s1.w) / 2) + 'px'; f.style.top = (Y + (Ht - s1.h) / 2) + 'px';
          f.style.width = s1.w + 'px'; f.style.height = s1.h + 'px';
          f.appendChild(im); f.appendChild(el('span', 'cap', it.caption || it.kind));
          f.addEventListener('click', function(){ zoom(it.src); });
          wall.appendChild(f);
        });
        wall.insertBefore(svg, wall.firstChild);
      };
      state.hang = hang;
    }
  }
  // one bay of the home page's wall: places of different sizes and proportions (wall units, a bay is 100 x 90)
  var BAY = [
    {x: 1, y: 1, w: 33, r: 10 / 11}, {x: 39, y: 6, w: 28, r: 4 / 3}, {x: 72, y: 0, w: 24, r: 3 / 4},
    {x: 5, y: 44, w: 30, r: 3 / 2}, {x: 41, y: 31, w: 27, r: 1}, {x: 74, y: 37, w: 25, r: 4 / 5},
    {x: 1, y: 67, w: 27, r: 4 / 3}, {x: 33, y: 66, w: 31, r: 3 / 2}
  ];
  function roomFrame(){}
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
    if(Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
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
    if(!dir || (e.target.closest && e.target.closest('button'))) return;
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
