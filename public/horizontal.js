/*
  TEST: the site as one sideways strip (see horizontal.html). No content of its own: everything comes from projects.js.

    horizontal.html            an index, then every project in turn: its hero, one more photo and one drawing
    horizontal.html?p=<slug>   one project: the text, the hero, its grid pictures in order, then the next project

  Pictures are never cropped: each gets a height and keeps its own proportions.
*/
(function(){
  var P = window.PROJECTS || {};
  var SLUGS = Object.keys(P);
  var GROUPS = ['Built', 'Unbuilt', 'Research'];
  // lighter copies of pictures whose originals are camera files (3000 px wide, made with ffmpeg as in CLAUDE.md)
  var WEB = {'img/anticlastic-roof-structure/hero.jpg': 'img/anticlastic-roof-structure/hero-web.jpg'};

  var track = document.getElementById('track');
  var strip = document.getElementById('strip');
  var footLeft = document.getElementById('footLeft');
  var whereEl = document.getElementById('where');
  var bar = document.getElementById('progress');
  var prevBtn = document.getElementById('prev'), nextBtn = document.getElementById('next');
  var phone = window.matchMedia('(max-width:700px)');
  // inside the home page (index.html opens a project here, in a band along the bottom): no header of its own, and
  // "back" closes the band instead of leaving
  var embed = /[?&]embed=1(&|$)/.test(location.search);
  if(embed) document.documentElement.classList.add('embed');
  function closeEmbed(){ parent.postMessage({gc: 'close'}, location.origin); }
  if(embed) document.addEventListener('keydown', function(e){ if(e.key === 'Escape') closeEmbed(); });
  var mode = {project: null};

  function el(tag, cls, text){
    var e = document.createElement(tag);
    if(cls) e.className = cls;
    if(text != null) e.textContent = text;
    return e;
  }
  function pad(n){ return (n < 10 ? '0' : '') + n; }
  function paras(t){ return t ? (Array.isArray(t) ? t : [t]) : []; }
  function isDrawing(it){ return it.drawing || /\.(svg|png|webp)$/i.test(it.src); }
  // every picture a project has, in its grid order (a row of two stays together as a pair)
  function pictures(p){
    if(p.grid) return p.grid;
    var out = [], g = p.gallery || {};
    ['drawings', 'physical', 'photos'].forEach(function(k){ (g[k] || []).forEach(function(it){ out.push(it); }); });
    if(!out.length && p.diagram && p.diagram.src) out.push({src: p.diagram.src, drawing: true, caption: p.diagram.caption});
    return out;
  }
  function flat(list){ var o = []; list.forEach(function(it){ Array.isArray(it) ? o.push.apply(o, it) : o.push(it); }); return o; }
  function num(slug){ return pad(SLUGS.indexOf(slug) + 1); }

  // a whole picture at a set height; while it loads it holds its place as a grey block of a guessed shape, and if
  // it then turns out wider or narrower while it is off to the left, the strip is nudged so what you look at stays put
  function figure(it, cls){
    var fig = el('figure', 'fig' + (cls ? ' ' + cls : ''));
    var img = new Image();
    img.alt = it.caption || '';
    img.decoding = 'async';
    if(it.a) fig.style.setProperty('--a', it.a);
    img.onload = function(){
      var before = fig.getBoundingClientRect();
      fig.style.setProperty('--a', img.naturalWidth / img.naturalHeight);
      img.classList.add('is-in');
      var after = fig.getBoundingClientRect();
      if(!phone.matches && before.right < track.getBoundingClientRect().left){ scroller.shift(after.width - before.width); }
    };
    img.src = WEB[it.src] || it.src;
    fig.appendChild(img);
    fig.appendChild(el('figcaption', 'mono', it.caption || ''));
    return fig;
  }

  // ---------- moving sideways ----------
  // The vertical wheel moves the strip sideways, eased toward where it was sent so it glides rather than jumps;
  // a trackpad's own sideways swipe, the arrow keys and the footer arrows all go through the same glide.
  var scroller = (function(){
    var pos = 0, target = 0, raf = 0;
    function max(){ return track.scrollWidth - track.clientWidth; }
    function clamp(x){ return Math.max(0, Math.min(max(), x)); }
    function step(){
      var d = target - pos;
      if(Math.abs(d) < .5){ pos = target; track.scrollLeft = pos; raf = 0; return; }
      pos += d * .12;
      track.scrollLeft = pos;
      raf = requestAnimationFrame(step);
    }
    function to(x, now){
      if(!raf) pos = track.scrollLeft;
      target = clamp(x);
      if(now){ cancelAnimationFrame(raf); raf = 0; pos = target; track.scrollLeft = pos; return; }
      if(!raf) raf = requestAnimationFrame(step);
    }
    window.addEventListener('wheel', function(e){
      if(phone.matches || e.ctrlKey) return;
      if(Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;        // already sideways: leave it to the browser
      e.preventDefault();
      var k = e.deltaMode === 1 ? 36 : e.deltaMode === 2 ? track.clientWidth : 1;
      to((raf ? target : track.scrollLeft) + e.deltaY * k);
    }, {passive: false});
    track.addEventListener('scroll', function(){ if(!raf){ pos = target = track.scrollLeft; } update(); }, {passive: true});
    return {
      to: to,
      by: function(dx){ to((raf ? target : track.scrollLeft) + dx); },
      shift: function(dx){ pos += dx; target += dx; track.scrollLeft += dx; }
    };
  })();

  function stepSize(){ return track.clientWidth * .72; }
  prevBtn.addEventListener('click', function(){ scroller.by(-stepSize()); });
  nextBtn.addEventListener('click', function(){ scroller.by(stepSize()); });
  document.addEventListener('keydown', function(e){
    if(phone.matches || e.metaKey || e.ctrlKey || e.altKey) return;
    if(/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
    var k = e.key;
    if(k === 'ArrowRight' || k === 'ArrowDown' || k === 'PageDown' || (k === ' ' && !e.shiftKey)) scroller.by(k === 'ArrowRight' || k === 'ArrowDown' ? stepSize() / 2 : stepSize());
    else if(k === 'ArrowLeft' || k === 'ArrowUp' || k === 'PageUp' || (k === ' ' && e.shiftKey)) scroller.by(k === 'ArrowLeft' || k === 'ArrowUp' ? -stepSize() / 2 : -stepSize());
    else if(k === 'Home') scroller.to(0);
    else if(k === 'End') scroller.to(Infinity);
    else return;
    e.preventDefault();
  });

  // ---------- footer: the line fills as you go, and names what is in front of you ----------
  var marks = [];     // [{el, html}] in strip order; the last one whose left edge has passed 40% of the view is current
  function update(){
    var m = track.scrollWidth - track.clientWidth, x = track.scrollLeft;
    bar.style.transform = 'scaleX(' + (m > 0 ? x / m : 0) + ')';
    prevBtn.disabled = x <= 1;
    nextBtn.disabled = x >= m - 1;
    var at = track.getBoundingClientRect().left + track.clientWidth * .4, cur = null;
    marks.forEach(function(mk){ if(mk.el.offsetParent !== null && mk.el.getBoundingClientRect().left <= at) cur = mk; });
    var html = cur ? cur.html : (marks[0] && !mode.project ? 'Index' : '');
    if(whereEl.innerHTML !== html) whereEl.innerHTML = html;
  }
  window.addEventListener('resize', update);

  // ---------- home ----------
  function home(){
    var intro = el('div', 'intro');
    var index = el('ul', 'index');
    GROUPS.forEach(function(g){
      var li = el('li');
      li.appendChild(el('h2', null, g));
      var ul = el('ul');
      SLUGS.filter(function(s){ return P[s].group === g; }).forEach(function(s){
        var a = el('a');
        a.href = '#' + s;
        a.dataset.slug = s;
        a.appendChild(el('span', null, P[s].title));
        a.appendChild(el('span', null, (P[s].kicker || '').split('·').pop().trim()));
        var w = el('li'); w.appendChild(a); ul.appendChild(w);
      });
      li.appendChild(ul);
      index.appendChild(li);
    });
    intro.appendChild(index);
    var hint = el('div', 'hint mono'); hint.appendChild(document.createTextNode('Scroll')); hint.appendChild(el('i'));
    intro.appendChild(hint);
    strip.appendChild(intro);

    var blocks = {};
    SLUGS.forEach(function(s, i){
      var p = P[s], link = 'horizontal.html?p=' + s;
      var proj = el('section', 'proj');
      proj.id = s;
      proj.dataset.group = p.group;
      var label = el('a', 'label');
      label.href = link;
      var top = el('div');
      top.appendChild(el('div', 'num mono', pad(i + 1) + ' · ' + p.group));
      top.appendChild(el('h3', null, p.title));
      top.appendChild(el('p', 'mono', p.kicker || ''));
      label.appendChild(top);
      label.appendChild(el('span', 'go mono', 'View project →'));
      proj.appendChild(label);

      // the hero, then the first photo and the first drawing of the project (whatever it has of those)
      var all = flat(pictures(p)).filter(function(it){ return it.src && it.src !== p.hero; });
      var pick = [];
      if(p.hero) pick.push({src: p.hero});
      var photo = all.filter(function(it){ return !isDrawing(it); })[0];
      var drawing = all.filter(isDrawing)[0];
      if(photo) pick.push(photo);
      if(drawing) pick.push(drawing);
      if(!pick.length && p.diagram && p.diagram.src) pick.push({src: p.diagram.src, caption: p.diagram.caption});
      var sizes = ['', 'm', 's low'];
      pick.forEach(function(it, k){
        var a = el('a', 'pic'); a.href = link;
        a.appendChild(figure(it, pick.length === 1 ? '' : sizes[k]));
        proj.appendChild(a);
      });
      if(!pick.length){
        var v = el('a', 'pic'); v.href = link;
        var f = el('div', 'fig'); f.appendChild(el('div', 'void mono', 'Pictures to come')); v.appendChild(f);
        proj.appendChild(v);
      }
      proj.addEventListener('click', function(e){ if(e.target.closest('a')) remember(s); });
      strip.appendChild(proj);
      blocks[s] = proj;
      marks.push({el: proj, group: p.group, html: pad(i + 1) + ' <b>' + p.title + '</b>'});
    });

    // clicking a name glides there
    index.addEventListener('click', function(e){
      var a = e.target.closest('a[data-slug]');
      if(!a) return;
      e.preventDefault();
      var b = blocks[a.dataset.slug];
      if(b.classList.contains('is-off')) setFilter('All');
      if(phone.matches){ b.scrollIntoView({behavior: 'smooth'}); return; }
      scroller.to(b.offsetLeft - parseFloat(getComputedStyle(strip).paddingLeft));
    });

    // Built / Unbuilt / Research keeps only that group's projects on the strip
    var filters = el('div', 'filters');
    var btns = ['All'].concat(GROUPS).map(function(g){
      var b = el('button', null, g);
      b.type = 'button';
      b.setAttribute('aria-pressed', g === 'All' ? 'true' : 'false');
      b.addEventListener('click', function(){ setFilter(g); });
      filters.appendChild(b);
      return b;
    });
    footLeft.appendChild(filters);
    function setFilter(g){
      btns.forEach(function(b){ b.setAttribute('aria-pressed', b.textContent === g ? 'true' : 'false'); });
      Object.keys(blocks).forEach(function(s){ blocks[s].classList.toggle('is-off', g !== 'All' && P[s].group !== g); });
      try{ sessionStorage.setItem('h-filter', g); }catch(e){}
      if(phone.matches) return;
      var first = SLUGS.filter(function(s){ return !blocks[s].classList.contains('is-off'); })[0];
      scroller.to(g === 'All' ? 0 : blocks[first].offsetLeft - parseFloat(getComputedStyle(strip).paddingLeft), true);
      update();
    }

    // coming back from a project lands on that project again
    var back = null, f = 'All';
    try{ back = sessionStorage.getItem('h-back'); f = sessionStorage.getItem('h-filter') || 'All'; sessionStorage.removeItem('h-back'); }catch(e){}
    if(f !== 'All') setFilter(f);
    if(back && blocks[back] && !phone.matches){
      var land = function(){ scroller.to(blocks[back].offsetLeft - parseFloat(getComputedStyle(strip).paddingLeft), true); };
      land();
      window.addEventListener('load', land);
    }
  }
  function remember(s){ try{ sessionStorage.setItem('h-back', s); }catch(e){} }

  // ---------- one project ----------
  function project(slug){
    var p = P[slug], i = SLUGS.indexOf(slug);
    document.title = p.title + ' — Gonzalo Cáceres';

    var info = el('div', 'info');
    var top = el('div');
    top.appendChild(el('div', 'mono', num(slug) + ' · ' + p.group));
    top.appendChild(el('h1', null, p.title));
    if(p.kicker) top.appendChild(el('p', 'kicker mono', p.kicker));
    if(p.lede) top.appendChild(el('p', 'lede', p.lede));
    var text = paras(p.text), more = null;
    if(text.length) top.appendChild(el('p', 'text', text[0]));
    if(text.length > 1){
      var btn = el('button', 'more-toggle mono', 'Read more');
      btn.type = 'button';
      btn.setAttribute('aria-expanded', 'false');
      top.appendChild(btn);
      more = el('div', 'more');
      more.hidden = true;
      text.slice(1).forEach(function(t){ more.appendChild(el('p', null, t)); });
      btn.addEventListener('click', function(){
        more.hidden = !more.hidden;
        btn.textContent = more.hidden ? 'Read more' : 'Read less';
        btn.setAttribute('aria-expanded', more.hidden ? 'false' : 'true');
        if(!more.hidden && !phone.matches) scroller.to(Math.max(track.scrollLeft, more.offsetLeft + more.offsetWidth - track.clientWidth * .85));
        update();
      });
    }
    info.appendChild(top);
    if(p.credits && p.credits.length){
      var dl = el('dl', 'credits');
      p.credits.forEach(function(r){ dl.appendChild(el('dt', null, r[0])); dl.appendChild(el('dd', null, r[1])); });
      info.appendChild(dl);
    }
    strip.appendChild(info);
    if(more) strip.appendChild(more);

    // the hero first, at full height, then the grid in its own order: big pictures and drawings at full height, the
    // smaller ones lower, alternately hanging from the top and standing on the bottom; a row of two stays a pair
    var list = pictures(p).filter(function(it){ return Array.isArray(it) || it.src !== p.hero; });
    var n = 0, total = (p.hero ? 1 : 0) + flat(list).length;
    function mark(fig){ n++; marks.push({el: fig, html: '<b>' + pad(n) + '</b> / ' + pad(total)}); return fig; }
    if(p.hero) strip.appendChild(mark(figure({src: p.hero})));
    var low = false;
    list.forEach(function(it){
      if(Array.isArray(it)){
        var pair = el('div', 'pair');
        it.forEach(function(x){ pair.appendChild(mark(figure(x))); });
        strip.appendChild(pair);
        return;
      }
      var big = /^(full|big|xl|tower|wide)$/.test(it.size || '') || isDrawing(it);
      var cls = big ? '' : 'm' + (low ? ' low' : '');
      if(!big) low = !low;
      strip.appendChild(mark(figure(it, cls)));
    });
    if(!total){
      var f = el('div', 'fig'); f.appendChild(el('div', 'void mono', 'Pictures to come'));
      strip.appendChild(f);
    }

    // the next project waits at the end, so the strip carries on into it
    var ns = SLUGS[(i + 1) % SLUGS.length], np = P[ns];
    var next = el('a', 'next');
    next.href = 'horizontal.html?p=' + ns + (embed ? '&embed=1' : '');
    var lab = el('div', 'label');
    var lt = el('div');
    lt.appendChild(el('div', 'num mono', 'Next · ' + num(ns)));
    lt.appendChild(el('h3', null, np.title));
    lt.appendChild(el('p', 'mono', np.kicker || ''));
    lab.appendChild(lt);
    next.appendChild(lab);
    var nh = np.hero || (np.diagram && np.diagram.src);
    if(nh) next.appendChild(figure({src: nh}, 's'));
    strip.appendChild(next);
    marks.push({el: next, html: 'Next <b>' + np.title + '</b>'});

    var backA = el('a', 'back', embed ? '← ' + p.title : '← All work');
    backA.href = 'horizontal.html';
    backA.addEventListener('click', function(e){
      if(embed){ e.preventDefault(); closeEmbed(); return; }
      remember(slug);
    });
    footLeft.appendChild(backA);
  }

  var q = new URLSearchParams(location.search).get('p');
  if(q && P[q]){ mode.project = q; project(q); } else home();
  update();
  window.addEventListener('load', update);

  // ---------- header: the time in New York, the theme switch ----------
  var clock = document.getElementById('clock');
  function tick(){
    try{ clock.textContent = new Date().toLocaleTimeString('en-US', {timeZone: 'America/New_York', hour: 'numeric', minute: '2-digit'}); }catch(e){}
  }
  tick(); setInterval(tick, 20000);

  var sw = document.getElementById('theme');
  function isDark(){
    var a = document.documentElement.getAttribute('data-theme');
    if(a) return a === 'dark';
    return !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  }
  function sync(){ sw.setAttribute('aria-checked', isDark() ? 'true' : 'false'); }
  sync();
  sw.addEventListener('click', function(){
    var t = isDark() ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', t);
    try{ sessionStorage.setItem('gc-theme', t); }catch(e){}
    sync();
  });
})();
