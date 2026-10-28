// A new start (2026-10-27, after MAD, i-mad.com): minimal and modern by restraint alone. A plain scrolling page, one
// typeface at a regular weight, large pictures at their own proportions (never cropped), small grey facts, nothing
// added. minimal.html is the home; minimal.html?p=<slug> is one project.
(function(){
  var P = window.PROJECTS || {}, SLUGS = Object.keys(P), Q = new URLSearchParams(location.search);
  var main = document.getElementById('main'), SLUG = P[Q.get('p')] ? Q.get('p') : null;

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
  // the one picture that stands for a project: his pick (projects.js "home") or its first
  function cover(slug){
    var all = pictures(slug); if(!all.length) return null;
    var mine = (P[slug].home || []).map(function(s){ return all.filter(function(o){ return o.src === web(s); })[0]; }).filter(Boolean);
    return mine[0] || all[0];
  }
  function el(tag, cls, parent, text){ var e = document.createElement(tag); if(cls) e.className = cls; if(text != null) e.textContent = text; if(parent) parent.appendChild(e); return e; }
  function place(p){ return (p.kicker || '').split(',')[0].trim(); }
  function year(p){ var m = (p.kicker || '').match(/(\d{4})/); return m ? m[1] : ''; }
  function href(s){ return 'minimal.html?p=' + s; }
  function pic(o, parent, alt, eager){
    var f = el('figure', 'mn-pic' + (o.drawing ? ' dr' : ''), parent), im = el('img', '', f);
    im.alt = o.caption || alt; im.loading = eager ? 'eager' : 'lazy'; im.decoding = 'async';
    im.addEventListener('load', function(){ f.classList.add('in'); });
    im.src = o.src;
    return f;
  }
  // the facts line: name, then place and year in grey
  function facts(p, parent){ var d = el('div', 'mn-facts', parent); el('span', 't', d, p.title); el('span', '', d, [place(p), year(p)].filter(Boolean).join(', ')); return d; }

  if(!SLUG){
    document.body.classList.add('mn-home');
    // the opening picture: a different project with pictures on each visit, never the one the last visit opened on
    var withPics = SLUGS.filter(function(s){ return cover(s); }), last = null;
    try { last = localStorage.getItem('gc-first'); } catch(e){}
    var pool = withPics.filter(function(s){ return s !== last; }); if(!pool.length) pool = withPics;
    var first = pool[Math.floor(Math.random() * pool.length)];
    try { localStorage.setItem('gc-first', first); } catch(e){}
    if(first){
      var hero = el('a', 'mn-hero', main); hero.href = href(first);
      pic(cover(first), hero, P[first].title, true);
      facts(P[first], hero);
    }
    // the work: every project, in his order; one picture each, all standing on one line per row
    var sec = el('section', 'mn-work', main); sec.id = 'work';
    el('h2', 'mn-h', sec, 'Work');
    var grid = el('div', 'mn-grid', sec);
    SLUGS.forEach(function(s){
      var p = P[s], a = el('a', 'mn-card', grid); a.href = href(s);
      var box = el('div', 'mn-box', a), c = cover(s);
      if(c) pic(c, box, p.title); else box.classList.add('none');
      facts(p, a);
    });
    return;
  }

  // ---------- one project ----------
  document.body.classList.add('mn-proj');
  var p = P[SLUG], list = pictures(SLUG);
  document.title = p.title + ' — Gonzalo Cáceres';
  if(list[0]) pic(list[0], el('div', 'mn-lead', main), p.title, true);
  var info = el('section', 'mn-info', main), left = el('div', 'mn-id', info), right = el('div', 'mn-words', info);
  el('h1', '', left, p.title);
  var meta = el('dl', 'mn-meta', left);
  var rows = [['Location', place(p)], ['Year', year(p)]].concat((p.credits || []).filter(function(r){ return ['Year', 'Location'].indexOf(r[0]) < 0; }));
  rows.forEach(function(r){ if(!r[1]) return; el('dt', '', meta, r[0]); el('dd', '', meta, r[1]); });
  if(p.lede && p.text) el('p', 'lede', right, p.lede);
  var t = p.text || p.lede || ''; (Array.isArray(t) ? t : t ? [t] : []).forEach(function(x){ el('p', '', right, x); });
  if(!list.length) el('p', 'mn-soon', main, 'Pictures to come.');
  var rest = el('div', 'mn-rest', main);
  list.slice(1).forEach(function(o){ pic(o, rest, p.title); });
  var nx = SLUGS[(SLUGS.indexOf(SLUG) + 1) % SLUGS.length], next = el('a', 'mn-next', main); next.href = href(nx);
  el('span', '', next, 'Next'); el('span', 't', next, P[nx].title);
})();
