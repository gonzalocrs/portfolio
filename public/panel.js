// The project panel (2026-10-28, kept from the MAD round, his pick: "i like how the project opens like this"): over the
// dimmed home, a white rounded panel; on the left × and Gallery, the title, the facts in mono capitals and his words
// with Read more; on the right the pictures. Used by quiet.js on the home when a trial (?it=) is on.
//   gcPanel.open(slug, k, mode)   mode 'stack': the pictures one under another (as at MAD)
//                                 mode 'one':   one picture at a time, as on his project pages, small marks under it
(function(){
  var P = window.PROJECTS || {}, B = document.body;
  var css = document.createElement('link'); css.rel = 'stylesheet'; css.href = 'panel.css'; document.head.appendChild(css);
  function el(tag, cls, parent, text){ var e = document.createElement(tag); if(cls) e.className = cls; if(text != null) e.textContent = text; if(parent) parent.appendChild(e); return e; }
  function web(src){
    if(src === 'img/anticlastic-roof-structure/hero.jpg') return 'img/anticlastic-roof-structure/hero-web.jpg';
    return src.replace(/\/physical\/(?!web\/)([^\/]+)$/, '/physical/web/$1');
  }
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
        out.push({src: s, drawing: isDrawing(it), caption: it.caption || ''});
      });
    });
    return out;
  }
  function place(p){ var c = (p.credits || []).filter(function(r){ return r[0] === 'Location'; })[0]; return c ? c[1] : (p.kicker || '').split(',')[0].trim(); }
  function year(p){ var m = (p.kicker || '').match(/(\d{4})/); return m ? m[1] : ''; }
  function kind(p){ var c = (p.credits || []).filter(function(r){ return r[0] === 'Type'; })[0]; return c ? c[1] : p.group; }
  function img(o, parent, alt){
    var im = el('img', '', parent); im.alt = o.caption || alt; im.decoding = 'async';
    im.addEventListener('load', function(){ im.classList.add('in'); });
    im.src = o.src; return im;
  }

  var shade = el('div', 'md-shade', B), card = el('div', 'md-card', shade), cur = null, onKey = null, home = location.pathname;
  shade.addEventListener('click', function(e){ if(e.target === shade) close(true); });
  addEventListener('keydown', function(e){
    if(!cur) return;
    if(e.key === 'Escape') close(true);
    else if(onKey) onKey(e);
  });
  function open(slug, k, mode, push){
    var p = P[slug], list = pictures(slug); cur = slug; onKey = null;
    if(mode === 'one' && innerWidth <= 1000) mode = 'stack';
    card.innerHTML = ''; card.className = 'md-card m-' + mode;
    var left = el('div', 'md-left', card), right = el('div', 'md-right', card);
    var tools = el('div', 'md-tools', left);
    var x = el('button', 'md-btn md-x', tools, '×'); x.type = 'button'; x.setAttribute('aria-label', 'Close');
    x.addEventListener('click', function(){ close(true); });
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
    else if(mode === 'one') one(right, list, p, k || 0);
    else list.forEach(function(o){ var f = el('figure', 'md-fig' + (o.drawing ? ' dr' : ''), right); img(o, f, p.title); });
    if(list.length > 1){
      var gb = el('button', 'md-btn', tools, 'Gallery'); gb.type = 'button';
      gb.addEventListener('click', function(){ var on = card.classList.toggle('sheet'); gb.textContent = on ? 'Pictures' : 'Gallery'; right.scrollTop = 0; });
      // in the sheet, a picture opens back at its place
      right.addEventListener('click', function(e){
        if(!card.classList.contains('sheet')) return;
        var f = e.target.closest('.md-fig'); if(!f) return;
        card.classList.remove('sheet'); gb.textContent = 'Gallery';
        if(card.goTo) card.goTo(+f.dataset.i); else f.scrollIntoView({block: 'start'});
      });
    }
    right.querySelectorAll('.md-fig').forEach(function(f, i){ f.dataset.i = i; });
    if(mode !== 'one' && k) requestAnimationFrame(function(){ var f = right.querySelectorAll('.md-fig')[k]; if(f) right.scrollTop = f.offsetTop - right.offsetTop; });
    B.classList.add('md-open');
    document.title = p.title + ' — Gonzalo Cáceres';
    if(push) history.pushState({p: slug}, '', home + '?p=' + slug);
  }
  // one picture at a time on the right, as on his project pages: click its right half to go on, left half back; the
  // wheel and arrow keys too; small marks under it, one per picture
  function one(right, list, p, k){
    var stage = el('div', 'md-one', right), marks = el('div', 'md-marks', right), at = -1, last = 0;
    list.forEach(function(o, i){ var f = el('figure', 'md-fig' + (o.drawing ? ' dr' : ''), stage); img(o, f, p.title); var b = el('button', 'md-m', marks); b.type = 'button'; el('i', '', b); b.addEventListener('click', function(){ go(i); }); });
    var figs = stage.querySelectorAll('.md-fig'), ms = marks.querySelectorAll('.md-m');
    function go(i){
      if(i < 0 || i >= list.length || i === at) return; at = i;
      figs.forEach(function(f, j){ f.classList.toggle('on', j === i); });
      ms.forEach(function(m, j){ m.classList.toggle('cur', j === i); });
    }
    card.goTo = go;
    stage.addEventListener('click', function(e){ var r = stage.getBoundingClientRect(); go(at + (e.clientX > r.left + r.width / 2 ? 1 : -1)); });
    stage.addEventListener('mousemove', function(e){ var r = stage.getBoundingClientRect(); stage.classList.toggle('back', e.clientX < r.left + r.width / 2); });
    right.addEventListener('wheel', function(e){ if(card.classList.contains('sheet')) return; e.preventDefault(); var now = Date.now(); if(now - last < 700 || Math.abs(e.deltaY) + Math.abs(e.deltaX) < 6) return; last = now; go(at + ((e.deltaY || e.deltaX) > 0 ? 1 : -1)); }, {passive: false});
    onKey = function(e){ if(['ArrowDown', 'ArrowRight'].indexOf(e.key) > -1){ go(at + 1); e.preventDefault(); } if(['ArrowUp', 'ArrowLeft'].indexOf(e.key) > -1){ go(at - 1); e.preventDefault(); } };
    go(Math.min(k, list.length - 1));
  }
  function close(push){
    if(!cur) return; cur = null; onKey = null; card.goTo = null;
    B.classList.remove('md-open');
    document.title = 'Gonzalo Cáceres — Architecture';
    if(push) history.pushState({}, '', home);
  }
  window.gcPanel = {open: open, close: close, isOpen: function(){ return !!cur; }};
})();
