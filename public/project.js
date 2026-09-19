(function(){
  var params = new URLSearchParams(location.search);
  var p = (window.PROJECTS || {})[params.get('p')];
  if(!p){ location.replace('/'); return; }

  // A project that isn't marked ready shows the full layout as a roadmap: marked
  // placeholders for the text, extra credit rows and sample gallery frames.
  // Set ready: true in projects.js to switch a project to its real, clean page.
  var showLayout = params.has('layout') || !p.ready;
  var backHref = '/?open=' + p.group.toLowerCase();

  document.title = p.title + ' — Gonzalo Cáceres';

  function el(tag, cls, text){
    var n = document.createElement(tag);
    if(cls) n.className = cls;
    if(text != null) n.textContent = text;
    return n;
  }

  var app = document.getElementById('app');

  // the first screen is just image, title and subtitle; everything else scrolls in below
  var intro = el('section', 'intro');

  var hero = el('div', 'hero');
  hero.setAttribute('role', 'img');
  hero.setAttribute('aria-label', p.title);
  if(p.hero){
    var himg = el('img');
    himg.src = p.hero; himg.alt = p.title;
    himg.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover';
    hero.appendChild(himg);
  } else {
    var ha = el('div', 'art art--photo');
    ha.style.setProperty('--h', p.hue);
    hero.appendChild(ha);
  }
  hero.appendChild(el('span', 'cap mono', p.title));
  intro.appendChild(hero);

  intro.appendChild(el('h1', 'title', p.title));

  var kicker = el('p', 'kicker mono');
  kicker.appendChild(document.createTextNode(p.kicker + ' · '));
  var kgroup = el('a', null, p.group);
  kgroup.href = backHref;
  kicker.appendChild(kgroup);
  intro.appendChild(kicker);
  app.appendChild(intro);

  // size the intro to the screen below the header
  var bar = document.querySelector('.bar');
  function setBar(){ document.documentElement.style.setProperty('--bar-h', bar.offsetHeight + 'px'); }
  setBar();
  window.addEventListener('resize', setBar);
  if(document.fonts && document.fonts.ready) document.fonts.ready.then(setBar);

  // description + credits
  var info = el('section', 'info');
  var left = el('div');
  if(p.lede) left.appendChild(el('p', 'lede', p.lede));
  else if(showLayout) left.appendChild(el('p', 'lede placeholder', 'A short description of the project goes here.'));
  if(p.text) left.appendChild(el('p', 'text', p.text));
  else if(showLayout) left.appendChild(el('p', 'text placeholder', 'A second, shorter paragraph can add context, such as the site, the brief or the approach.'));
  if(left.children.length) info.appendChild(left); else info.classList.add('solo');
  var dl = el('dl', 'credits');
  var rows = (p.credits || []).slice();
  if(showLayout){
    var EXTRA = {
      Built: ['Design', 'Architect of Record'],
      Unbuilt: ['Design', 'Collaborators'],
      Research: ['Design']
    };
    var graphic = rows.some(function(r){ return r[0] === 'Type' && /graphic/i.test(r[1]); });
    (EXTRA[p.group] || []).forEach(function(label){
      if(graphic && label === 'Architect of Record') return;
      var has = rows.some(function(r){ return r[0] === label; });
      if(!has) rows.push([label, 'To be added']);
    });
  }
  rows.forEach(function(row){
    var d = el('div');
    d.appendChild(el('dt', 'mono', row[0]));
    d.appendChild(el('dd', null, row[1]));
    dl.appendChild(d);
  });
  info.appendChild(dl);
  app.appendChild(info);

  // gallery
  var G = p.gallery || {};
  if(showLayout && !G.drawings && !G.physical && !G.photos){
    function demo(label, n){ var a = []; for(var i = 1; i <= n; i++) a.push({caption: label + ' ' + (i < 10 ? '0' + i : i)}); return a; }
    G = { drawings: demo('Drawing', 4), physical: demo('Physical drawing', 3), photos: demo('Photo or render', 5) };
  }

  var SECTIONS = [
    {key: 'drawings', label: 'Drawings', kind: 'drawing',
     pattern: [['s8','r-43'], ['s4','r-34'], ['s6','r-43'], ['s6','r-43']]},
    {key: 'physical', label: 'Physical drawings', kind: 'physical',
     pattern: [['s4','r-34']]},
    {key: 'photos', label: 'Photos & renders', kind: 'photo',
     pattern: [['s12','r-wide'], ['s6','r-43'], ['s6','r-43'], ['s4','r-34'], ['s8','r-43']]}
  ];

  var n = 0;
  SECTIONS.forEach(function(s){
    var items = G[s.key];
    if(!items || !items.length) return;
    var sec = el('section', 'gal');
    var head = el('div', 'gal__head mono');
    head.appendChild(el('span', null, s.label));
    head.appendChild(el('span', null, items.length < 10 ? '0' + items.length : String(items.length)));
    sec.appendChild(head);
    var grid = el('div', 'grid');
    items.forEach(function(it, i){
      var slot = s.pattern[i % s.pattern.length];
      n += 1;
      var fig = el('figure', 'fig ' + slot[0]);
      var frame = el('div', 'frame ' + slot[1]);
      if(it.src){
        var img = el('img');
        img.src = it.src; img.alt = it.caption || p.title; img.loading = 'lazy';
        img.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover';
        frame.appendChild(img);
      } else {
        var art = el('div', 'art art--' + s.kind);
        art.style.setProperty('--h', (p.hue + i * 40) % 360);
        frame.appendChild(art);
      }
      fig.appendChild(frame);
      var cap = el('figcaption', 'mono');
      cap.appendChild(el('span', null, n < 10 ? '0' + n : String(n)));
      cap.appendChild(el('span', null, it.caption || ''));
      fig.appendChild(cap);
      grid.appendChild(fig);
    });
    sec.appendChild(grid);
    app.appendChild(sec);
  });

  // way back
  var end = el('a', 'end');
  end.href = backHref;
  end.appendChild(el('span', 'mono', 'Back to'));
  end.appendChild(el('strong', null, p.group));
  app.appendChild(end);
})();
