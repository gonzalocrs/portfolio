/*
  A visit to a project, the way you walk up to a painting in a museum (styles in museum.css).

    1. the wall: the home page as it is
    2. click a picture (or a title): it comes up close, whole, in the middle of the room
    3. scroll a little: it steps to the right and its wall label appears on the left (name, facts, the text);
       "More info" makes the label taller, to the whole text
    4. scroll on: the rest of the project, hung one of two ways:
         spotlight (walk)  the label stays; the picture goes up and the second comes up in its place, then each scroll
                moves one picture to the right, each lit as it arrives; a small bar under them says where you are
         gallery (salon)   everything at once, each picture at the back of a splayed opening in one wall (Ronchamp)
       A visit starts in spotlight; one small icon under the pictures goes to the other room (four panes: gallery,
       one pane: back to spotlight). Every visit starts in spotlight (/?room=gallery opens a linked one there).
  Every scroll (a wheel gesture, an arrow key) goes one step, gliding slowly.

  Content comes from projects.js. Pictures are never cropped.
*/
(function(){
  var P = window.PROJECTS || {}, SLUGS = Object.keys(P);
  var ROOMS = [['walk', 'Spotlight'], ['salon', 'Gallery']];
  // every visit starts in the spotlight; /?room=gallery only opens the first one (a link) in the gallery
  var room = 'walk', rq = /[?&]room=(salon|panorama|gallery)\b/.test(location.search) ? 'salon' : null;
  // gallery options being tried (?gal=strip|editorial|index), each scrolled freely inside the room; the contact sheet
  // (hangRows) otherwise
  var GAL = (location.search.match(/[?&]gal=(strip|editorial|index)\b/) || [])[1] || null;

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
    room = rq || 'walk'; rq = null;
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
    pic.appendChild(img); pic.appendChild(maxBtn(firstSrc));
    img.addEventListener('click', function(){ zoom(firstSrc); });
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
          frame();   // it grows taller, upward from its foot
        });
        c2.appendChild(more);
      }
      label.appendChild(c2);
    }
    // on a phone the visit fits the screen: the label shows only the name, and "More info" floats the whole label
    // up as a card over the pictures; the symbol in its bottom right corner (or a tap outside it) puts it away and
    // the swiping goes on
    var pm = el('button', 'm-pmore', 'More info'); pm.type = 'button';
    var ph = el('button', 'm-phide'); ph.type = 'button'; ph.setAttribute('aria-label', 'Hide');
    ph.innerHTML = '<svg viewBox="0 0 22 22"><path d="M4 7.5l7 7 7-7"/></svg>';
    function float(on){ label.classList.toggle('float', on); if(on) label.scrollTop = 0; }
    pm.addEventListener('click', function(){ float(true); });
    ph.addEventListener('click', function(){ float(false); });
    c1.appendChild(pm);
    roomEl.appendChild(label);
    roomEl.appendChild(ph);

    stage.appendChild(roomEl);
    ov.appendChild(stage);

    var gal = el('section', 'm-gallery');
    ov.appendChild(gal);
    document.body.appendChild(ov);
    document.body.classList.add('museum-on');

    ov.addEventListener('click', function(e){
      if(label.classList.contains('float') && !label.contains(e.target)){ e.stopPropagation(); e.preventDefault(); float(false); }
    }, true);

    closeBtn = el('button', 'm-close'); closeBtn.type = 'button'; closeBtn.setAttribute('aria-label', 'Back to the wall');
    closeBtn.innerHTML = '<svg viewBox="0 0 16 16"><path d="M3 3l10 10M13 3L3 13"/></svg>';
    closeBtn.addEventListener('click', function(){ close(); });
    document.body.appendChild(closeBtn);

    // the way to the other room: one icon, shown once you are in a room
    sw = el('button', 'm-switch'); sw.type = 'button';
    sw.addEventListener('click', function(){ setRoom(room === 'walk' ? 'salon' : 'walk'); });
    document.body.appendChild(sw);

    // the picture you came in with: the spotlight starts from it, the gallery hangs it with the rest
    var first = [].concat.apply([], all.map(function(s){ return s.items; })).filter(function(it){ return it.src === firstSrc; })[0] || {src: firstSrc, caption: '', kind: 'Hero'};
    var rest = all.map(function(s){ return {name: s.name, items: s.items.filter(function(it){ return it.src !== firstSrc; })}; }).filter(function(s){ return s.items.length; });
    state = {slug: slug, p: p, parts: rest, first: first, pic: pic, img: img, label: label, stage: stage, roomEl: roomEl, gal: gal, H: H, a: from ? from.width / from.height : 1.5, opened: false};
    var start = function(){
      if(img.naturalWidth) state.a = img.naturalWidth / img.naturalHeight;
      layout();
      // the picture comes up from where it hung on the wall
      if(from && !narrow()){
        var r1 = rects().r1;
        setRect(pic, {x: from.left, y: from.top - top, w: from.width, h: from.height});
        void pic.offsetWidth;
        pic.classList.add('fly');
        setRect(pic, r1);
        setTimeout(function(){ if(state && state.pic === pic){ pic.classList.remove('fly'); state.opened = true; onScroll(); } }, 720);
      }
      else{ state.opened = true; onScroll(); }
    };
    if(img.complete && img.naturalWidth) start(); else { img.onload = start; img.onerror = start; }
    requestAnimationFrame(function(){ ov.classList.add('on'); closeBtn.classList.add('on'); });
    ov.addEventListener('scroll', onScroll, {passive: true});
    ov.addEventListener('wheel', onWheel, {passive: false});
    buildRoom(); sizeStage();
    ov.scrollTop = narrow() ? 0 : labelStop();   // the visit opens on the picture with its label beside it
    syncSwitch();
  }

  function setRect(e, r){ e.style.left = r.x + 'px'; e.style.top = r.y + 'px'; e.style.width = r.w + 'px'; e.style.height = r.h + 'px'; }
  // r0: close up, in the middle; r1: stepped to the right, leaving the left for the label (areaL is where the
  // pictures' side begins). Each picture has a bay a little narrower than that side; the gallery's wall stands on
  // the same width.
  function rects(){
    var W = innerWidth, H = state.H, a = state.a, gut = Math.max(16, Math.min(40, W * .04));
    var s0 = fit(a, W * .84, H * .84), r0 = {x: (W - s0.w) / 2, y: (H - s0.h) / 2, w: s0.w, h: s0.h};
    var lw = state.label.offsetWidth || 336, gap = Math.max(40, W * .045);
    var areaL = gut + lw + gap, areaW = W - areaL - gut, bay = areaW * .8;
    var s1 = fit(a, bay, H * .74), r1 = {x: areaL + (bay - s1.w) / 2, y: (H - s1.h) / 2, w: s1.w, h: s1.h};
    return {r0: r0, r1: r1, gap: gap, gut: gut, areaL: areaL, bay: bay};
  }
  // where the scroll rests: close up, the label, then one screen of scroll per picture. The room is sticky, one
  // screen tall, so the stage is as tall as the walk is long.
  // the gallery's floor, in the room: the spotlight's bar line (see .m-bar), at the same height and as long
  function groundLine(){ return Math.round(state.H * .87 + 36 + 8); }
  function labelStop(){ return Math.round(state.H * .6); }
  function sizeStage(){
    if(!state) return;
    if(narrow()){ state.stage.style.height = 'auto'; return; }
    var n = state.walk ? state.walk.slides.length : (state.salon ? 1 : 0);
    state.stage.style.height = (n ? state.H + labelStop() + n * state.H : Math.round(state.H * 1.75)) + 'px';
  }
  function stops(){
    var L = labelStop(), H = state.H, o = [L];
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
    var t = 1;   // no close-up first: the picture comes from the wall straight to its place beside the label
    // on the walk every step goes one bay sideways, the first one too: the picture you came in with moves off to
    // the left and the next comes in from the right; the label stays. The gallery comes up from below instead.
    var dy = state.salon ? clamp(y - L0, 0, H) : 0, k = state.walk ? Math.max(0, (y - L0) / H) : 0;
    var off = k * (R.bay + R.gap);
    if(state.opened){
      var pr = {x: R.r0.x + (R.r1.x - R.r0.x) * t - off, y: R.r0.y + (R.r1.y - R.r0.y) * t - dy, w: R.r0.w + (R.r1.w - R.r0.w) * t, h: R.r0.h + (R.r1.h - R.r0.h) * t};
      setRect(state.pic, pr);
      // seen through the same opening as the rest, so it never slides over the label
      var cut = state.walk ? Math.max(0, Math.round(R.areaL - pr.x)) : 0;
      state.pic.style.clipPath = cut > 0 ? 'inset(0 0 0 ' + cut + 'px)' : '';
      state.pic.style.visibility = cut >= pr.w ? 'hidden' : '';
    }
    // the label hangs on the left with its foot on one line, the same in every room, and stays there; when it
    // opens it grows upward
    var lo = clamp((t - .35) / .65, 0, 1), L = state.label;
    L.style.left = R.gut + 'px';
    L.style.top = Math.max(16, Math.round(H * .87) - L.offsetHeight) + 'px';
    L.style.opacity = lo;
    L.style.transform = 'translateX(' + Math.round((lo - 1) * 16) + 'px)';
    L.classList.toggle('on', lo > .5);
    if(state.walk){
      var w = state.walk;
      // the pane is one bay wide, so the next picture stays out of sight until it comes
      w.pane.style.left = R.areaL + 'px'; w.pane.style.width = R.bay + 'px';
      w.slides.forEach(function(s){ s.style.width = R.bay + 'px'; s.style.marginRight = R.gap + 'px'; });
      w.trail.style.transform = 'translateX(' + Math.round(R.bay + R.gap - off) + 'px)';
      // a picture is lit while it is in front of you, as in a dark room
      var here = Math.round(k) - 1;
      w.slides.forEach(function(s, i){ s.classList.toggle('lit', i === here); });
      // the bar: one mark per picture (the one you came in with first), the one in front of you dark; it is there
      // from the start, so the line itself says there is more
      var at = Math.min(Math.round(k), w.marks.length - 1);
      w.bar.style.left = R.areaL + 'px'; w.bar.style.width = R.bay + 'px';
      w.bar.classList.add('on');
      // and a small arrow at each end of it, for anyone who does not scroll; none before the first or past the end
      var by = Math.round(H * .87 + 36), kk = Math.round(k);
      w.prev.style.left = (R.areaL - 34) + 'px'; w.next.style.left = (R.areaL + R.bay + 6) + 'px';
      w.prev.style.top = w.next.style.top = (by + 8 - 14) + 'px';
      w.prev.classList.toggle('on', kk > 0);
      w.next.classList.toggle('on', kk < w.slides.length);
      w.marks.forEach(function(m, i){ m.classList.toggle('here', i === at); });
    }
    if(state.salon){
      // the salon's wall comes up beside the label, which stays
      var sp = state.salon.pane;
      sp.style.left = R.areaL + 'px'; sp.style.width = (innerWidth - R.areaL - R.gut) + 'px';
      sp.style.transform = 'translateY(' + Math.round(H - dy) + 'px)';
    }
    placeSwitch(R, true);
    roomFrame();
  }

  // ---------- 4: the room ----------
  // at: in the spotlight, which picture to land on (from a click on it in the gallery; -1 is the one you came in
  // with, beside the label); the first of the rest otherwise
  function setRoom(r, at){
    room = r;
    buildRoom(); sizeStage();
    syncSwitch();
    ov.scrollTop = narrow() ? state.gal.offsetTop : labelStop() + state.H * (1 + (r === 'walk' && at ? at : 0));
    // the new room fades in (the gallery's wall once it is hung)
    if(state.walk) [state.walk.pane, state.walk.bar].forEach(fadeIn);
    else if(state.salon) state.salon.fade = true;
    frame();   // both rooms rest at the same scroll, so no scroll event comes to place the new one
  }
  // four panes for the gallery, one pane for the spotlight: the icon shows the room it takes you to
  var ICONS = {
    salon: '<svg viewBox="0 0 22 22"><rect x="2.5" y="2.5" width="7" height="7"/><rect x="12.5" y="2.5" width="7" height="7"/><rect x="2.5" y="12.5" width="7" height="7"/><rect x="12.5" y="12.5" width="7" height="7"/></svg>',
    walk: '<svg viewBox="0 0 22 22"><rect x="4.5" y="4.5" width="13" height="13"/></svg>'
  };
  function syncSwitch(){
    var to = room === 'walk' ? 'salon' : 'walk', name = ROOMS.filter(function(r){ return r[0] === to; })[0][1];
    sw.innerHTML = ICONS[to] + '<span>' + name + '</span>';
    sw.setAttribute('aria-label', to === 'salon' ? 'Gallery: see every picture at once' : 'Spotlight: one picture at a time');
  }
  // under the pictures, in the middle of their side; the same place in both rooms
  function placeSwitch(R, inRoom){
    var cx = R.areaL + R.bay / 2;
    sw.style.left = Math.round(cx) + 'px';
    sw.style.top = Math.round(headerBottom() + Math.min(state.H * .87 + 58, state.H - 34)) + 'px';
    sw.classList.toggle('on', inRoom);
  }

  function endPiece(){
    var i = SLUGS.indexOf(state.slug), ns = SLUGS[(i + 1) % SLUGS.length];
    // the next project that has something to hang
    for(var k = 1; k < SLUGS.length; k++){ ns = SLUGS[(i + k) % SLUGS.length]; if(parts(P[ns]).length) break; }
    var e = el('div', 'm-end');
    var b1 = el('button'); b1.type = 'button'; b1.appendChild(el('span', 'm-tag', 'Back')); b1.appendChild(document.createTextNode('To the wall'));
    b1.addEventListener('click', function(){ close(); });
    var b2 = el('button'); b2.type = 'button'; b2.appendChild(el('span', 'm-tag', 'Next project')); b2.appendChild(document.createTextNode(P[ns].title + ' →'));
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
    Array.prototype.forEach.call(state.roomEl.querySelectorAll('.m-pane,.m-bar,.m-nav,.m-strip,.m-sbar'), function(e){ e.remove(); });
    var list = items(), total = list.length;
    state.built = narrow();
    if(narrow()){
      // on a phone, the spotlight sideways: every picture (the one you came in with first) in one row you swipe
      // through, one at a time, with the bar under it; the label under that
      var every = [state.first].concat(list), strip = el('div', 'm-strip'), sbar = el('div', 'm-sbar'), smarks = [];
      every.forEach(function(it, i){
        var sl = el('div', 'm-strip-step'), f = figure(it, i + 1, every.length);
        f.appendChild(maxBtn(it.src)); f.querySelector('img').addEventListener('click', function(){ zoom(it.src); });
        sl.appendChild(f); strip.appendChild(sl);
        var mk = el('button'); mk.type = 'button'; mk.setAttribute('aria-label', it.caption || it.kind);
        mk.addEventListener('click', function(){ strip.scrollTo({left: i * strip.clientWidth, behavior: 'smooth'}); });
        sbar.appendChild(mk); smarks.push(mk);
      });
      var endS = el('div', 'm-strip-step m-strip-end'); endS.appendChild(endPiece()); strip.appendChild(endS);
      var mark = function(){
        var k = Math.round(strip.scrollLeft / (strip.clientWidth || 1));
        smarks.forEach(function(m, i){ m.classList.toggle('here', i === Math.min(k, smarks.length - 1)); });
      };
      strip.addEventListener('scroll', function(){ requestAnimationFrame(mark); }, {passive: true});
      state.roomEl.insertBefore(strip, state.label);
      if(every.length > 1) state.roomEl.insertBefore(sbar, state.label);
      mark();
    }
    else if(room === 'walk'){
      // the rest of the work in a row of bays on the label's right; it comes up from below, then moves sideways
      var pane = el('div', 'm-pane'), trail = el('div', 'm-trail'), slides = [];
      list.forEach(function(it, i){
        var sl = el('div', 'm-step'), f = figure(it, i + 1, total);
        f.appendChild(maxBtn(it.src)); f.querySelector('img').addEventListener('click', function(){ zoom(it.src); });
        sl.appendChild(f);
        trail.appendChild(sl); slides.push(sl);
      });
      var last = el('div', 'm-step m-step-end'); last.appendChild(endPiece()); trail.appendChild(last); slides.push(last);
      pane.appendChild(trail);
      var bar = el('div', 'm-bar'), marks = [];
      // the bar: one mark per picture, the one you came in with first; each takes you to its picture
      var m0 = el('button'); m0.type = 'button'; m0.setAttribute('aria-label', state.first.caption || state.first.kind || state.p.title);
      m0.addEventListener('click', function(){ glide(labelStop()); });
      bar.appendChild(m0); marks.push(m0);
      list.forEach(function(it, i){
        var mk = el('button'); mk.type = 'button'; mk.setAttribute('aria-label', it.caption || it.kind);
        mk.addEventListener('click', function(){ glide(labelStop() + (i + 1) * state.H); });
        bar.appendChild(mk); marks.push(mk);
      });
      state.roomEl.insertBefore(pane, state.label);
      state.roomEl.appendChild(bar);
      var nav = [-1, 1].map(function(d){
        var a = el('button', 'm-nav'); a.type = 'button'; a.setAttribute('aria-label', d < 0 ? 'Previous picture' : 'Next picture');
        a.innerHTML = '<svg viewBox="0 0 16 16"><path d="' + (d < 0 ? 'M10 3.5L5.5 8l4.5 4.5' : 'M6 3.5L10.5 8 6 12.5') + '"/></svg>';
        a.addEventListener('click', function(){ step(d); });
        state.roomEl.appendChild(a); return a;
      });
      state.walk = {pane: pane, trail: trail, slides: slides, bar: bar, marks: marks, prev: nav[0], next: nav[1]};
    }
    else{
      // the salon: everything at once, as a contact sheet (see hangRows). It comes up on the label's right, as the
      // walk's pictures do, and the label stays.
      list = [state.first].concat(list);   // every picture, the one you came in with first
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
        if(GAL) hangFree(list, salon, wall, foot); else hangRows(list, wall, foot);
      };
      state.hang = hang;
    }
  }
  // the gallery as a contact sheet: rows of one height, each filling the width, one gap throughout, the order kept;
  // nothing is cropped. It stands on the same floor line as the spotlight's bar.
  function hangRows(list, wall, foot){
    var bay = rects().bay, floor = groundLine();
    wall.style.height = Math.max(120, Math.round(floor - wall.offsetTop)) + 'px';
    foot.style.left = Math.round(bay + 24) + 'px'; foot.style.bottom = Math.round(state.H - floor) + 'px';
    var bw = bay, bh = wall.clientHeight, g = Math.round(Math.max(12, Math.min(20, bw * .016)));
    var NS = 'http://www.w3.org/2000/svg', svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'facade plain'); svg.setAttribute('viewBox', '0 0 ' + wall.clientWidth + ' ' + bh);
    var ln = document.createElementNS(NS, 'line');
    [['x1', 0], ['y1', bh], ['x2', bay], ['y2', bh], ['class', 'ground']].forEach(function(p){ ln.setAttribute(p[0], p[1]); });
    svg.appendChild(ln); wall.appendChild(svg);
    function put(it, r, cls){
      var f = el('figure', 'm-hung ' + (cls || '')), im = new Image(); im.src = it.src; im.alt = it.caption || state.p.title;
      setRect(f, {x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.w), h: Math.round(r.h)});
      f.appendChild(im); f.appendChild(el('span', 'cap', it.caption || it.kind));
      f.addEventListener('click', function(){ setRoom('walk', list.indexOf(it) - 1); });
      wall.appendChild(f); return f;
    }
    // try every number of rows and keep the one where the pictures come out largest
    var S = list.reduce(function(s, it){ return s + it.a; }, 0), pick = null;
    for(var r = 1; r <= list.length; r++){
      var rowsL = [], cur = [], acc = 0, tgt = S / r;
      list.forEach(function(it, i){
        cur.push(it); acc += it.a;
        var left = list.length - i - 1, need = r - rowsL.length - 1;
        if((acc >= tgt * (rowsL.length + 1) - it.a / 2 && need > 0 && left >= need) || left === 0){ rowsL.push(cur); cur = []; }
      });
      if(cur.length) rowsL.push(cur);
      var hs = rowsL.map(function(row){ return (bw - (row.length - 1) * g) / row.reduce(function(s, it){ return s + it.a; }, 0); });
      var tot = hs.reduce(function(s, h){ return s + h; }, 0) + (rowsL.length - 1) * g, sc = Math.min(1, (bh - g) / tot);
      var cover = sc * sc * hs.reduce(function(s, h, k){ return s + h * h * rowsL[k].reduce(function(t, it){ return t + it.a; }, 0); }, 0);
      if(!pick || cover > pick.cover) pick = {rows: rowsL, hs: hs, sc: sc, tot: tot, cover: cover};
    }
    var y = bh - g - pick.tot * pick.sc, x0 = (bw - bw * pick.sc) / 2;
    pick.rows.forEach(function(row, k){
      var h = pick.hs[k] * pick.sc, x = x0;
      row.forEach(function(it){ var w = it.a * h; put(it, {x: x, y: y, w: w, h: h}); x += w + g * pick.sc; });
      y += h + g * pick.sc;
    });
    if(state.salon && state.salon.fade){ state.salon.fade = false; fadeIn(wall); fadeIn(foot); }
  }
  // the gallery options: every picture whole, scrolled through freely inside the room, the label staying on the left.
  //   strip      one row at one height, standing on the spotlight's floor line, running off the screen's right edge
  //   editorial  one column on a twelve-column grid, pictures at varied widths and alternating sides, as a magazine
  //   index      small, all at one height, numbered, in rows that wrap
  // a click on a picture opens it in the spotlight
  var EDIT = [['1 / -1', 'start'], ['4 / -1', 'end'], ['1 / 8', 'start'], ['8 / -1', 'end'], ['2 / 11', 'start']];
  function hangFree(list, salon, wall, foot){
    wall.style.display = 'none'; foot.style.display = 'none';
    var old = salon.querySelector('.m-free'), keep = old ? (GAL === 'strip' ? old.scrollLeft : old.scrollTop) : 0;
    if(old) old.remove();
    var R = rects(), floor = groundLine(), top = Math.round(Math.max(24, Math.min(48, state.H * .05)));
    var box = el('div', 'm-free m-free-' + GAL);
    box.style.top = top + 'px'; box.style.height = (floor - top) + 'px';
    if(GAL === 'strip'){ salon.style.width = (innerWidth - R.areaL) + 'px'; box.style.right = '0'; }   // to the screen's edge, so the row reads as going on
    list.forEach(function(it, i){
      var f = el('figure', 'm-fig' + (isDrawing(it) ? ' drawing' : '')), im = new Image();
      im.src = it.src; im.alt = it.caption || state.p.title;
      f.appendChild(im);
      var cap = el('figcaption', 'm-tag');
      if(GAL === 'index') cap.appendChild(el('b', '', pad(i + 1)));
      cap.appendChild(document.createTextNode(it.caption || it.kind));
      f.appendChild(cap);
      if(GAL === 'editorial'){ var e = EDIT[i % EDIT.length]; f.style.gridColumn = e[0]; f.style.justifySelf = e[1]; }
      f.addEventListener('click', function(){ setRoom('walk', i - 1); });
      box.appendChild(f);
    });
    var end = el('div', 'm-free-end'); end.appendChild(endPiece()); box.appendChild(end);
    salon.appendChild(box);
    if(GAL === 'strip') box.scrollLeft = keep; else box.scrollTop = keep;
    if(state.salon && state.salon.fade){ state.salon.fade = false; fadeIn(box); }
  }
  function roomFrame(){}
  function fadeIn(e){ e.classList.remove('m-in'); void e.offsetWidth; e.classList.add('m-in'); }

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
  // a trackpad swipe counts whichever way it goes: down or right is forward, up or left is back (the pictures do move
  // sideways, so people swipe sideways). Its momentum keeps sending smaller and smaller events after the fingers
  // lift; those belong to the same step. A new swipe is told apart by a pause, or by the events growing again
  // once the glide has finished, so swiping again straight away still moves on
  var acc = 0, lastAbs = 0, lastT = 0, freeT = 0;
  function onWheel(e){
    if(!state || narrow() || e.ctrlKey || document.querySelector('.m-zoom')) return;
    var side = Math.abs(e.deltaX) > Math.abs(e.deltaY), d = side ? e.deltaX : e.deltaY, dir = d > 0 ? 1 : -1;
    var L = !side && e.target.closest && e.target.closest('.m-label.open');
    if(L && L.scrollHeight > L.clientHeight + 1 && (dir > 0 ? L.scrollTop + L.clientHeight < L.scrollHeight - 1 : L.scrollTop > 0)) return;   // reading the whole text
    var F = e.target.closest && e.target.closest('.m-free'), now0 = performance.now();
    if(F){
      var X = F.classList.contains('m-free-strip'), v = X ? (side ? e.deltaX : e.deltaY) : (side ? 0 : e.deltaY);
      var can = v > 0 ? (X ? F.scrollLeft + F.clientWidth < F.scrollWidth - 1 : F.scrollTop + F.clientHeight < F.scrollHeight - 1)
                      : v < 0 && (X ? F.scrollLeft > 0 : F.scrollTop > 0);
      if(can || now0 - freeT < 350){    // still going through it (or the same swipe's momentum running out at its end)
        if(can) freeT = now0;
        if(X && !side){ e.preventDefault(); F.scrollLeft += v; }
        else if(!can) e.preventDefault();
        return;
      }
    }
    e.preventDefault();
    var now = performance.now(), a = Math.abs(d), fresh = now - lastT > 200 || (a > lastAbs * 1.6 && a > 6);
    lastAbs = a; lastT = now;
    if(locked){
      if(anim || !fresh){ release(); return; }
      locked = false; acc = 0;
    }
    acc += d * (e.deltaMode === 1 ? 33 : e.deltaMode === 2 ? 600 : 1);
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
  // a Spotlight picture can be seen as large as the screen allows: click it, or the small corner button
  function maxBtn(src){
    var b = el('button', 'm-max'); b.type = 'button'; b.setAttribute('aria-label', 'View larger');
    b.innerHTML = '<svg viewBox="0 0 16 16"><path d="M10 2.5h3.5V6M6 13.5H2.5V10M13.5 2.5L9 7M2.5 13.5L7 9"/></svg>';
    b.addEventListener('click', function(e){ e.stopPropagation(); zoom(src); });
    return b;
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
    if(state.built !== narrow()){ buildRoom(); sizeStage(); }   // a phone turned on its side, or back
    state.H = innerHeight - headerBottom();
    ov.style.setProperty('--m-h', state.H + 'px');
    sizeStage();
    layout();
    if(state.hang) state.hang();
  });

  window.gcMuseum = {open: function(slug, from, src){ open(slug, from, src); }, isOpen: function(){ return !!ov; }, close: close};
  var vq = /[?&]visit=([\w-]+)/.exec(location.search);
  if(vq && P[vq[1]]){
    var go = function(){ history.replaceState(null, '', '/'); open(vq[1], null, null); };
    if(document.readyState === 'complete') go(); else window.addEventListener('load', go);
  }
})();
