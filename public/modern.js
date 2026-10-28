/* "A touch of modernity" trials (2026-10-27, after MAD, i-mad.com), preview only. Nothing happens without ?m=.
   ?m= takes one or more of these, joined by commas (?m=sheet,scan,type); ?m=mix is sheet + scan + type; ?m=off clears.
   The choice is kept for the visit (sessionStorage), so it follows into the projects and back.
     sheet  an instrument's readouts in the corners: New York time, the project's place in coordinates, which picture
            of how many; four small registration marks at the picture's corners
     scan   each picture is read in by one thin line that sweeps down it; on the picture the pointer is a hairline
            crosshair with its position
     field  a faint measured dot grid behind everything, like a drawing set up on a CAD sheet
     type   project names in wide capitals (Archivo at its widest), the "+" and the readouts in mono
   His name/logo, the pictures' own colours and the light ground stay as they are. */
(function(){
  var K = 'gc-modern', Q = new URLSearchParams(location.search), m = Q.get('m');
  try {
    if(m !== null){ if(m === 'off' || m === '') sessionStorage.removeItem(K); else sessionStorage.setItem(K, m); }
    m = sessionStorage.getItem(K);
  } catch(e){}
  if(!m) return;
  var ALL = ['sheet', 'scan', 'field', 'type'];
  var on = m === 'mix' ? ['sheet', 'scan', 'type'] : m === 'all' ? ALL : m.split(',').filter(function(x){ return ALL.indexOf(x) > -1; });
  if(!on.length) return;
  var B = document.body, has = function(x){ return on.indexOf(x) > -1; };
  on.forEach(function(x){ B.classList.add('m-' + x); });

  var css = document.createElement('link'); css.rel = 'stylesheet'; css.href = 'modern.css'; document.head.appendChild(css);
  if(has('type')){
    var f = document.createElement('link'); f.rel = 'stylesheet';
    f.href = 'https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@125,300;125,500;125,700&display=swap';
    document.head.appendChild(f);
  }
  function el(tag, cls, parent, text){ var e = document.createElement(tag); if(cls) e.className = cls; if(text != null) e.textContent = text; (parent || B).appendChild(e); return e; }

  var PLACE = {
    'Cusco': '13.5320° S  71.9675° W',
    'Lima': '12.0464° S  77.0428° W',
    'New York': '40.7128° N  74.0060° W'
  };
  var P = window.PROJECTS || {}, SLUGS = Object.keys(P);
  function two(n){ return (n < 10 ? '0' : '') + n; }

  // what is on screen now: the project and its picture
  function now(){
    var mk = document.querySelector('.qt-ticks .qk.cur'), slug = mk && mk.slug;
    var img = null, k = 0, n = 0;
    var figs = document.querySelectorAll('.qo-fig:not(.out) img');
    if(figs.length) img = figs[figs.length - 1];
    var lay = document.querySelector('.p-layer.on img'); if(lay) img = lay;
    var dots = document.querySelectorAll('.qp-subs .qs');
    if(dots.length){ n = dots.length; dots.forEach(function(d, j){ if(d.classList.contains('cur')) k = j; }); }
    return {slug: slug, img: img, k: k, n: n};
  }

  // ---------- sheet ----------
  var hud = null, regs = null;
  if(has('sheet')){
    hud = {
      tl: el('div', 'mh mh-tr'),
      bl: el('div', 'mh mh-br')
    };
    regs = el('div', 'mreg'); ['a', 'b', 'c', 'd'].forEach(function(c){ el('i', c, regs); });
    var clock = function(){
      var t = new Date().toLocaleTimeString('en-GB', {timeZone: 'America/New_York', hour12: false});
      hud.tl.textContent = 'New York  ' + t;
    };
    clock(); setInterval(clock, 1000);
  }

  // ---------- scan ----------
  var line = has('scan') ? el('div', 'mscan') : null, cross = null;
  if(has('scan') && matchMedia('(pointer:fine)').matches){
    cross = el('div', 'mx'); el('i', 'h', cross); el('i', 'v', cross); var lab = el('b', '', cross);
    addEventListener('mousemove', function(e){
      var s = now(), im = s.img;
      if(!im){ cross.classList.remove('on'); return; }
      var r = im.getBoundingClientRect();
      var inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      cross.classList.toggle('on', inside);
      if(!inside) return;
      cross.style.left = r.left + 'px'; cross.style.top = r.top + 'px'; cross.style.width = r.width + 'px'; cross.style.height = r.height + 'px';
      var x = e.clientX - r.left, y = e.clientY - r.top;
      cross.style.setProperty('--x', x + 'px'); cross.style.setProperty('--y', y + 'px');
      lab.textContent = 'x ' + (x / r.width).toFixed(3) + '   y ' + (y / r.height).toFixed(3);
    }, {passive: true});
    addEventListener('wheel', function(){ cross.classList.remove('on'); }, {passive: true});
  }
  function sweep(im){
    if(!line || !im || !im.animate) return;
    var r = im.getBoundingClientRect(); if(!r.width) return;
    var D = 1150, E = 'cubic-bezier(.55,0,.25,1)';
    im.animate([{clipPath: 'inset(0 0 100% 0)'}, {clipPath: 'inset(0 0 0% 0)'}], {duration: D, easing: E});
    line.style.left = r.left - 14 + 'px'; line.style.width = r.width + 28 + 'px';
    line.animate([{transform: 'translateY(' + r.top + 'px)', opacity: 1}, {transform: 'translateY(' + r.bottom + 'px)', opacity: 1, offset: .97}, {transform: 'translateY(' + r.bottom + 'px)', opacity: 0}],
      {duration: D, easing: E, fill: 'forwards'});
  }

  // ---------- keep everything in step with the page ----------
  var lastImg = null, raf = 0;
  function update(){
    raf = 0;
    var s = now();
    // a home picture is read in when it starts to open (its figure gets .in), a project picture straight away
    var fig = s.img && s.img.closest('.qo-fig');
    if(s.img && s.img !== lastImg && (!fig || fig.classList.contains('in'))){
      lastImg = s.img;
      var go = function(){ sweep(s.img); };
      if(s.img.complete) go(); else s.img.addEventListener('load', go, {once: true});
    }
    if(hud){
      var p = s.slug && P[s.slug], place = p && (p.kicker || '').split(',')[0].trim();
      var idx = s.slug ? two(SLUGS.indexOf(s.slug) + 1) + ' / ' + two(SLUGS.length) : '';
      var pic = s.n ? '   ' + two(s.k + 1) + ' / ' + two(s.n) : '';
      hud.bl.textContent = innerWidth <= 700 ? (s.n ? two(s.k + 1) + ' / ' + two(s.n) : idx) : (PLACE[place] || '') + (idx ? '      ' + idx : '') + pic;
    }
    if(regs){
      var im = s.img, r = im && im.getBoundingClientRect();
      if(r && r.width){
        regs.style.left = r.left + 'px'; regs.style.top = r.top + 'px'; regs.style.width = r.width + 'px'; regs.style.height = r.height + 'px';
        regs.classList.add('on');
      } else regs.classList.remove('on');
    }
  }
  function soon(){ if(!raf) raf = requestAnimationFrame(update); }
  new MutationObserver(soon).observe(document.getElementById('main') || B, {subtree: true, childList: true, attributes: true, attributeFilter: ['class', 'style']});
  addEventListener('resize', soon);
  // the regs follow the picture as it settles (its own arrival moves it a little)
  setInterval(function(){ if(regs) soon(); }, 120);
  soon();
})();
