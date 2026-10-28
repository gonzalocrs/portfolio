// After MAD (i-mad.com), from his screenshots of their site (2026-10-27): grey rounded buttons with small mono labels,
// the categories as large light words, a three-column grid of rounded pictures with the name on a dark label at the
// pointer, and a project opening as a white rounded panel over the dimmed grid (title, mono facts, words with Read
// more on the left; the pictures on the right; a Gallery button). His name mark stays; pictures are never cropped.
// minimal.html is the home; minimal.html?p=<slug> opens with that project's panel.
(function(){
  var P = window.PROJECTS || {}, SLUGS = Object.keys(P), Q = new URLSearchParams(location.search);
  var main = document.getElementById('main'), B = document.body;

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
  // the home's one or two pictures per project (his rule; projects.js "home" when set)
  function picks(slug){
    var all = pictures(slug); if(!all.length) return [];
    var mine = (P[slug].home || []).map(function(s){ return all.filter(function(o){ return o.src === web(s); })[0]; }).filter(Boolean);
    if(mine.length) return mine;
    var out = [all[0]];
    if(all.length >= 3) for(var i = 1; i < all.length; i++) if(all[i].drawing !== all[0].drawing){ out.push(all[i]); break; }
    return out;
  }
  function el(tag, cls, parent, text){ var e = document.createElement(tag); if(cls) e.className = cls; if(text != null) e.textContent = text; if(parent) parent.appendChild(e); return e; }
  function place(p){ var c = (p.credits || []).filter(function(r){ return r[0] === 'Location'; })[0]; return c ? c[1] : (p.kicker || '').split(',')[0].trim(); }
  function year(p){ var m = (p.kicker || '').match(/(\d{4})/); return m ? m[1] : ''; }
  function kind(p){ var c = (p.credits || []).filter(function(r){ return r[0] === 'Type'; })[0]; return c ? c[1] : p.group; }
  function ratio(o){
    return new Promise(function(res){
      var im = new Image(); im.onload = function(){ o.r = im.naturalWidth / im.naturalHeight || 1.5; res(o); };
      im.onerror = function(){ o.r = 1.5; res(o); }; im.src = o.src;
    });
  }
  function img(o, parent, small){
    var im = el('img', '', parent); im.alt = o.caption || P[o.slug].title; im.decoding = 'async';
    im.addEventListener('load', function(){ im.classList.add('in'); });
    if(small && !o.drawing){ im.addEventListener('error', function(){ if(im.src.indexOf(o.src) < 0) im.src = o.src; }, {once: true}); im.src = thumb(o.src); }
    else im.src = o.src;
    return im;
  }

  // ---------------- the grid ----------------
  var GROUPS = ['All'].concat(SLUGS.map(function(s){ return P[s].group; }).filter(function(g, i, a){ return g && a.indexOf(g) === i; }));
  var cats = el('nav', 'md-cats', main), filt = 'All';
  GROUPS.forEach(function(g){
    var b = el('button', g === 'All' ? 'on' : '', cats, g); b.type = 'button';
    b.addEventListener('click', function(){ filt = g; cats.querySelectorAll('button').forEach(function(x){ x.classList.toggle('on', x === b); }); lay(); });
  });
  var grid = el('div', 'md-grid', main), tiles = [];
  var tip = el('div', 'md-tip', B);
  SLUGS.forEach(function(s, j){
    var got = picks(s);
    if(!got.length) got = [{slug: s, none: true, r: 1.5}];
    got.forEach(function(o){
      var a = el('a', 'md-tile' + (o.none ? ' none' : o.drawing ? ' dr' : ''), null); a.href = 'minimal.html?p=' + s; a.slug = s; a.o = o;
      if(o.none) el('span', '', a, P[s].title); else img(o, a, true);
      el('span', 'md-cap', a, P[s].title);
      a.addEventListener('click', function(e){ e.preventDefault(); open(s, true); });
      a.addEventListener('mouseenter', function(){ tip.textContent = P[s].title; tip.classList.add('on'); });
      a.addEventListener('mouseleave', function(){ tip.classList.remove('on'); });
      tiles.push(a);
    });
  });
  addEventListener('mousemove', function(e){ tip.style.transform = 'translate(' + (e.clientX + 14) + 'px,' + (e.clientY + 16) + 'px)'; }, {passive: true});
  // three columns (two on a tablet, one on a phone); each picture goes to the shortest column, at its own proportion
  var cols = 0;
  function lay(){
    var n = innerWidth <= 700 ? 1 : innerWidth <= 1000 ? 2 : 3;
    var show = tiles.filter(function(t){ return filt === 'All' || P[t.slug].group === filt; });
    grid.innerHTML = ''; cols = n;
    var cs = [], hs = [];
    for(var i = 0; i < n; i++){ cs.push(el('div', 'md-col', grid)); hs.push(0); }
    show.forEach(function(t){
      var k = hs.indexOf(Math.min.apply(null, hs)); cs[k].appendChild(t); hs[k] += 1 / (t.o.r || 1.5) + .04;
    });
  }
  Promise.all(tiles.filter(function(t){ return !t.o.none; }).map(function(t){ return ratio(t.o); })).then(function(){
    tiles.forEach(function(t){ t.style.aspectRatio = (t.o.r || 1.5).toFixed(4); });
    lay();
  });
  addEventListener('resize', function(){ var n = innerWidth <= 700 ? 1 : innerWidth <= 1000 ? 2 : 3; if(n !== cols) lay(); });

  // ---------------- a project: the panel ----------------
  var shade = el('div', 'md-shade', B), card = el('div', 'md-card', shade), cur = null;
  shade.addEventListener('click', function(e){ if(e.target === shade) close(true); });
  addEventListener('keydown', function(e){ if(e.key === 'Escape' && cur) close(true); });
  function open(slug, push){
    var p = P[slug], list = pictures(slug); cur = slug;
    card.innerHTML = ''; card.scrollTop = 0;
    var left = el('div', 'md-left', card), right = el('div', 'md-right', card);
    var tools = el('div', 'md-tools', left);
    var x = el('button', 'md-btn md-x', tools); x.type = 'button'; x.setAttribute('aria-label', 'Close'); x.textContent = '×';
    x.addEventListener('click', function(){ close(true); });
    if(list.length > 1){
      var gb = el('button', 'md-btn', tools, 'Gallery'); gb.type = 'button';
      gb.addEventListener('click', function(){ var on = right.classList.toggle('sheet'); gb.textContent = on ? 'Pictures' : 'Gallery'; right.scrollTop = 0; });
    }
    el('h1', 'md-title', left, p.title);
    var facts = el('div', 'md-facts', left);
    [place(p), kind(p), year(p)].filter(Boolean).forEach(function(t){ el('p', '', facts, t); });
    var words = el('div', 'md-words', left), t = p.text || p.lede || '';
    if(p.lede && p.text) el('p', 'lede', words, p.lede);
    (Array.isArray(t) ? t : t ? [t] : []).forEach(function(s){ el('p', '', words, s); });
    var cr = (p.credits || []).filter(function(r){ return ['Type', 'Location', 'Year'].indexOf(r[0]) < 0; });
    if(cr.length){ var dl = el('dl', 'md-cr', words); cr.forEach(function(r){ el('dt', '', dl, r[0]); el('dd', '', dl, r[1]); }); }
    requestAnimationFrame(function(){
      if(words.scrollHeight > words.clientHeight + 4){
        var more = el('button', 'md-more', left, 'Read more'); more.type = 'button';
        more.addEventListener('click', function(){ var o = words.classList.toggle('open'); more.textContent = o ? 'Read less' : 'Read more'; more.classList.toggle('less', o); });
      } else words.classList.add('open');
    });
    if(!list.length){ var none = el('div', 'md-none', right); el('span', '', none, 'Pictures to come'); }
    list.forEach(function(o){ var f = el('figure', 'md-fig' + (o.drawing ? ' dr' : ''), right); img(o, f); });
    B.classList.add('md-open');
    document.title = p.title + ' — Gonzalo Cáceres';
    if(push) history.pushState({p: slug}, '', 'minimal.html?p=' + slug);
  }
  function close(push){
    if(!cur) return; cur = null;
    B.classList.remove('md-open');
    document.title = 'Gonzalo Cáceres — Architecture';
    if(push) history.pushState({}, '', 'minimal.html');
  }
  addEventListener('popstate', function(){ var s = new URLSearchParams(location.search).get('p'); if(P[s]) open(s, false); else close(false); });
  if(P[Q.get('p')]) open(Q.get('p'), false);
})();
