/*
  TEST: a project seen through a long window in the home page's wall (see ribbon.html). Content comes from projects.js.
  Pictures are never cropped: each takes the height of the window and keeps its own proportions.
*/
(function(){
  var q = new URLSearchParams(location.search);
  var p = (window.PROJECTS || {})[q.get('p')];
  var look = q.get('look') === 'bays' ? 'bays' : 'strip';
  var track = document.getElementById('track'), strip = document.getElementById('strip');
  var prev = document.getElementById('prev'), next = document.getElementById('next'), plan = document.getElementById('keyplan');
  // lighter copies of camera originals: the hero's web copy, and the physical models' web/ folder
  function web(src){
    if(src === 'img/anticlastic-roof-structure/hero.jpg') return 'img/anticlastic-roof-structure/hero-web.jpg';
    return src.replace(/\/physical\/(?!web\/)([^\/]+)$/, '/physical/web/$1');
  }
  function isDrawing(it){ return it.drawing || /\.(svg|png|webp)$/i.test(it.src); }
  function flat(list){ var o = []; (list || []).forEach(function(it){ Array.isArray(it) ? o.push.apply(o, it) : o.push(it); }); return o; }
  function el(tag, cls, text){ var e = document.createElement(tag); if(cls) e.className = cls; if(text != null) e.textContent = text; return e; }
  function close(){ parent.postMessage({gc: 'close'}, location.origin); }
  document.addEventListener('keydown', function(e){ if(e.key === 'Escape') close(); });
  if(!p) return;

  // ---------- what goes in the window ----------
  var grid = flat(p.grid), g = p.gallery || {}, hero = p.hero, diagram = p.diagram && p.diagram.src;
  var seen = {};
  function fresh(list){ return list.filter(function(it){ var k = web(it.src); if(!it.src || seen[k]) return false; seen[k] = 1; return true; }); }
  var parts;
  if(look === 'strip'){
    // everything, in the order the project page has it: the hero, then the grid
    parts = [{items: fresh((hero ? [{src: hero}] : []).concat(grid.length ? grid : flat([g.drawings, g.physical, g.photos])))}];
  }
  else{
    // one bay per part, as the project pages were laid out before: hero, concept, drawings, physical models, photos
    // and renders. The grid (the newer, hand-picked set) is used where it has them, the older galleries otherwise.
    var physical = grid.filter(function(it){ return !isDrawing(it) && /\/physical\//.test(it.src); });
    var photos = grid.filter(function(it){ return !isDrawing(it) && !/\/physical\//.test(it.src); });
    var drawings = grid.filter(isDrawing);
    if(!grid.length){ drawings = g.drawings || []; physical = g.physical || []; photos = g.photos || []; }
    if(!physical.length && g.physical) physical = g.physical;
    parts = [
      {name: 'Hero', items: fresh(hero ? [{src: hero}] : [])},
      {name: 'Concept', items: fresh(diagram ? [{src: diagram, caption: p.diagram.caption, drawing: true}] : [])},
      {name: 'Drawings', items: fresh(drawings)},
      {name: 'Physical model', items: fresh(physical)},
      {name: 'Photos and renders', items: fresh(photos)}
    ].filter(function(s){ return s.items.length; });
  }

  // ---------- the openings ----------
  var openings = [], figs = [];
  parts.forEach(function(s){
    var op = el('section', 'opening'), glass = el('div', 'glass');
    if(s.name){ var lab = el('div', 'label'); lab.appendChild(el('b', null, s.name)); lab.appendChild(document.createTextNode(String(s.items.length))); op.appendChild(lab); }
    s.items.forEach(function(it){
      var fig = el('figure', 'fig'), img = new Image();
      img.alt = it.caption || p.title;
      img.decoding = 'async';
      img.onload = function(){ fig.style.setProperty('--a', img.naturalWidth / img.naturalHeight); draw(); };
      img.src = web(it.src);
      fig.appendChild(img);
      if(it.caption) fig.appendChild(el('span', 'cap', it.caption));
      glass.appendChild(fig);
      figs.push(fig);
    });
    op.appendChild(glass);
    op.appendChild(document.createElementNS('http://www.w3.org/2000/svg', 'svg'));
    strip.appendChild(op);
    openings.push(op);
  });

  // the splayed reveal around each opening's glass: four trapezoids from the outer edge to the glass, as on the wall
  function draw(){
    var d = 30, e = 26;
    openings.forEach(function(op){
      var w = op.offsetWidth, h = op.offsetHeight, svg = op.querySelector('svg');
      svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
      var O = [[0, 0], [w, 0], [w, h], [0, h]], I = [[e, d], [w - e, d], [w - e, h - d], [e, h - d]];
      var quads = [[O[0], O[1], I[1], I[0]], [O[3], O[2], I[2], I[3]], [O[0], I[0], I[3], O[3]], [O[1], O[2], I[2], I[1]]];
      svg.innerHTML = quads.map(function(q){ return '<polygon class="splay" points="' + q.map(function(pt){ return pt.join(','); }).join(' ') + '"/>'; }).join('');
    });
    update();
  }
  window.addEventListener('resize', draw);
  draw();

  // ---------- moving along it: the wheel glides it sideways; the chevrons and the key plan step ----------
  var pos = 0, target = 0, raf = 0;
  function max(){ return track.scrollWidth - track.clientWidth; }
  function step(){
    var dd = target - pos;
    if(Math.abs(dd) < .5){ pos = target; track.scrollLeft = pos; raf = 0; return; }
    pos += dd * .12; track.scrollLeft = pos; raf = requestAnimationFrame(step);
  }
  function to(x){ if(!raf) pos = track.scrollLeft; target = Math.max(0, Math.min(max(), x)); if(!raf) raf = requestAnimationFrame(step); }
  window.addEventListener('wheel', function(e){
    if(e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    e.preventDefault();
    var k = e.deltaMode === 1 ? 36 : e.deltaMode === 2 ? track.clientWidth : 1;
    to((raf ? target : track.scrollLeft) + e.deltaY * k);
  }, {passive: false});
  track.addEventListener('scroll', function(){ if(!raf) pos = target = track.scrollLeft; update(); }, {passive: true});
  window.gcRibbonBy = function(dx){ to((raf ? target : track.scrollLeft) + dx); };   // the home page's wheel, over the wall

  // the key plan has a square per picture (one window) or per bay; the chevrons step to the next one of those
  var stops = look === 'bays' ? openings : figs;
  stops.forEach(function(s, i){
    var b = el('button'); b.type = 'button'; b.setAttribute('aria-label', (parts[i] && parts[i].name) || ('Picture ' + (i + 1)));
    b.addEventListener('click', function(){ to(left(s)); });
    plan.appendChild(b);
  });
  function left(s){ return s.getBoundingClientRect().left + track.scrollLeft - (look === 'bays' ? 0 : 26 + 14); }
  function current(){
    var x = (raf ? target : track.scrollLeft) + 2, c = 0;
    stops.forEach(function(s, i){ if(left(s) <= x) c = i; });
    return c;
  }
  prev.addEventListener('click', function(){ var c = current(), s = stops[c]; to(left(s) < (raf ? target : track.scrollLeft) - 2 ? left(s) : left(stops[Math.max(0, c - 1)])); });
  next.addEventListener('click', function(){ var c = current(); to(c + 1 < stops.length ? left(stops[c + 1]) : max()); });
  document.addEventListener('keydown', function(e){
    if(e.key === 'ArrowRight') next.click(); else if(e.key === 'ArrowLeft') prev.click(); else return;
    e.preventDefault();
  });
  function update(){
    if(!stops) return;     // still being built
    var x = track.scrollLeft, m = max();
    prev.classList.toggle('on', x > 2);
    next.classList.toggle('on', x < m - 2);
    var c = x >= m - 2 && m > 0 ? stops.length - 1 : current();
    Array.prototype.forEach.call(plan.children, function(b, i){ b.classList.toggle('here', i === c); });
  }
  window.addEventListener('load', draw);
})();
