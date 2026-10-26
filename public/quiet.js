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
      marks.push(a);
    });
    var ab = el('a', 'qk qa', nav); ab.href = 'about.html'; el('i', '', ab, '+'); el('span', '', ab, 'About');
    return marks;
  }
  function quietHref(s, i){ return 'project.html?p=' + s + (i ? '&i=' + i : ''); }
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
        e.addEventListener('click', function(){ location.href = quietHref(s, at ? at + 1 : 0); });
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

  // a project: the same marks, its own opened into one mark per picture; one picture at a time, as large as fits.
  // A click on the right half of the picture goes on, the left half back (the pointer shows which); the wheel,
  // arrow keys and a swipe do the same; past the last picture comes the next project. "+" shows the words.
  function buildQuietProject(slug){
    var p = P[slug], all = pictures(slug), n = Math.max(1, all.length);
    var i0 = SLUGS.indexOf(slug), nx = SLUGS[(i0 + 1) % SLUGS.length], pv = SLUGS[(i0 - 1 + SLUGS.length) % SLUGS.length];
    document.title = p.title + ' — Gonzalo Cáceres';
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
    function go(k){
      if(k >= n){ location.href = quietHref(nx); return; }
      if(k < 0){ location.href = quietHref(pv, 'last'); return; }
      if(k === at) return;
      var first = at < 0; at = k;
      fade(function(L){
        var it = all[k];
        if(it){ var im = el('img', '', L); im.alt = it.caption || p.title; im.src = it.src; }
        else el('div', 'plate', L, 'In preparation');
      }, first);
      dots.forEach(function(d, j){ d.classList.toggle('cur', j === k); });
    }
    st.addEventListener('mousemove', function(e){ var r = st.getBoundingClientRect(); st.classList.toggle('back', e.clientX < r.left + r.width * .35); });
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
    var start = Q.get('i'); go(start === 'last' ? n - 1 : Math.max(0, Math.min(n - 1, (parseInt(start, 10) || 1) - 1)));
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

  if(document.body.getAttribute('data-page') === 'project'){
    var slug = Q.get('p');
    if(!P[slug]){ location.replace('/'); return; }
    buildQuietProject(slug);
  } else {
    // old addresses of a project on the home page (?show= / ?open=) go to its page
    var old = Q.get('show') || Q.get('open');
    if(old && P[old]){ location.replace(quietHref(old)); return; }
    quietIntro(buildQuiet());
  }
})();
