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
  function two(n){ return n < 10 ? '0' + n : String(n); }

  var app = document.getElementById('app');
  var bar = document.querySelector('.bar');

  // the project's name floats in the middle of the ribbon once you have left the first screen
  // (which already shows it big), like the product name in Apple's sticky bar; click to go back to the start
  var ptitle = el('a', 'ptitle', p.title);
  ptitle.href = '#';
  ptitle.setAttribute('aria-label', p.title + ' \u2014 back to the overview');
  ptitle.addEventListener('click', function(e){ e.preventDefault(); go(0); });
  bar.appendChild(ptitle);

  // The page is a stack of full-screen segments: overview, details, then one per
  // gallery (drawings, physical models, photos & renders).
  // On a desktop with a mouse or trackpad, scrolling has to build up "resistance"
  // before it turns the page (see the paging code at the bottom).
  var segs = [];
  var stages = [];

  // ---- 1. overview: image, title, subtitle -------------------------------
  var intro = el('section', 'intro seg');

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
  segs.push({el: intro, name: 'Overview'});

  // size the segments to the screen below the header
  function setBar(){ document.documentElement.style.setProperty('--bar-h', bar.offsetHeight + 'px'); }
  setBar();
  if(document.fonts && document.fonts.ready) document.fonts.ready.then(function(){ setBar(); relayout(); });

  // ---- 2. details: description + credits ---------------------------------
  var info = el('div', 'info');
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
  var infoSeg = el('section', 'seg seg--info');
  infoSeg.appendChild(info);
  app.appendChild(infoSeg);
  segs.push({el: infoSeg, name: 'Details'});

  // ---- 3. galleries: one full-screen stage each ---------------------------
  var G = p.gallery || {};
  if(showLayout && !G.drawings && !G.physical && !G.photos){
    function demo(label, n){ var a = []; for(var i = 1; i <= n; i++) a.push({caption: label + ' ' + two(i)}); return a; }
    G = { drawings: demo('Drawing', 4), physical: demo('Physical model', 3), photos: demo('Photo or render', 5) };
  }

  // width / height of the placeholder frames, cycled; real images use their own proportions
  var SECTIONS = [
    {key: 'drawings', label: 'Drawings', kind: 'drawing', name: 'Drawings',
     shapes: [4/3, 3/4, 4/3, 4/3]},
    {key: 'physical', label: 'Physical models', kind: 'physical', name: 'Physical models',
     mode: 'strip', shapes: [4/3, 3/4, 1/1]},   // a horizontal gallery: click right = next, left = previous, centre = zoom
    {key: 'photos', label: 'Photos & renders', kind: 'photo', name: 'Photos & renders',
     shapes: [16/9, 4/3, 4/3, 3/4, 4/3]}
  ];

  var n = 0;
  SECTIONS.forEach(function(s){
    var items = G[s.key];
    if(!items || !items.length) return;
    var seg = el('section', 'seg seg--gal');
    var head = el('div', 'gal__head mono');
    head.appendChild(el('span', null, s.label));
    head.appendChild(el('span', null, two(items.length)));
    seg.appendChild(head);

    var stage = el('div', 'stage');
    stage._items = [];
    stage._zoom = null;
    stage._mode = s.mode || 'grid';
    stage._cur = 0;
    if(stage._mode === 'strip'){
      stage.classList.add('stage--strip');
      stage._count = head.lastChild;
      stage._count.textContent = two(1) + ' / ' + two(items.length);
    }
    items.forEach(function(it, i){
      n += 1;
      var fig = el('figure', 'fig');
      var frame = el('div', 'frame');
      var item = {fig: fig, a: it.aspect || s.shapes[i % s.shapes.length]};
      if(it.src){
        var img = el('img');
        img.src = it.src; img.alt = it.caption || p.title; img.loading = 'lazy';
        img.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover';
        img.addEventListener('load', function(){
          if(!it.aspect && img.naturalWidth && img.naturalHeight){ item.a = img.naturalWidth / img.naturalHeight; layoutStage(stage); }
        });
        frame.appendChild(img);
      } else {
        var art = el('div', 'art art--' + s.kind);
        art.style.setProperty('--h', (p.hue + i * 40) % 360);
        frame.appendChild(art);
      }
      fig.appendChild(frame);
      var cap = el('span', 'cap mono', two(n) + '  ' + (it.caption || ''));
      fig.appendChild(cap);
      if(s.mode === 'strip'){
        // a note under the model: a title line, and an optional paragraph (item.text in projects.js)
        var note = el('figcaption', 'note');
        note.appendChild(el('span', 'note__title', two(i + 1) + '  ' + (it.caption || '')));
        if(it.text) note.appendChild(el('p', 'note__text', it.text));
        else if(showLayout) note.appendChild(el('p', 'note__text placeholder', 'A short note about this model can go here.'));
        fig.appendChild(note);
      }
      if(stage._mode !== 'strip') fig.addEventListener('click', function(e){
        e.stopPropagation();
        setZoom(stage, stage._zoom === i ? null : i);
      });
      stage._items.push(item);
      stage.appendChild(fig);
    });
    // clicking the empty part of a zoomed stage puts the image back
    stage.addEventListener('click', function(e){
      if(stage._mode === 'strip'){ stripClick(stage, e); return; }
      if(stage._zoom !== null) setZoom(stage, null);
    });
    stage.addEventListener('mousemove', function(e){
      if(stage._mode !== 'strip') return;
      stage.setAttribute('data-zone', stripZone(stage, e));
    });
    seg.appendChild(stage);
    app.appendChild(seg);
    stages.push(stage);
    segs.push({el: seg, name: s.name, stage: stage});
  });

  // there is no separate closing page: pushing hard past the last segment goes back to the home page with this group open
  var exitName = 'Back to ' + p.group;

  // ---- stage layout ------------------------------------------------------
  // Fits every image on the stage at once, like a canvas: the frames are packed
  // into rows, and the number of rows that gives the biggest frames wins.
  function fitRows(items, k, W, H, gap){
    var total = 0; items.forEach(function(it){ total += it.a; });
    var target = total / k, rowsArr = [[]], sum = 0;
    items.forEach(function(it){
      var row = rowsArr[rowsArr.length - 1];
      if(row.length && rowsArr.length < k && Math.abs(sum + it.a - target) > Math.abs(sum - target)){
        rowsArr.push([]); row = rowsArr[rowsArr.length - 1]; sum = 0;
      }
      row.push(it); sum += it.a;
    });
    var heights = [], sumH = 0, gaps = gap * (rowsArr.length - 1);
    rowsArr.forEach(function(row){
      var s = 0; row.forEach(function(it){ s += it.a; });
      var h = (W - gap * (row.length - 1)) / s;
      heights.push(h); sumH += h;
    });
    var scale = Math.min(1, (H - gaps) / sumH), boxes = [], area = 0;
    var y = (H - (sumH * scale + gaps)) / 2;
    rowsArr.forEach(function(row, r){
      var h = heights[r] * scale, rowW = gap * (row.length - 1);
      row.forEach(function(it){ rowW += it.a * h; });
      var x = (W - rowW) / 2;
      row.forEach(function(it){
        var w = it.a * h;
        boxes.push({item: it, x: x, y: y, w: w, h: h});
        area += w * h; x += w + gap;
      });
      y += h + gap;
    });
    return {area: area, boxes: boxes};
  }

  // ---- the horizontal gallery (physical models) ----------------------------
  // One model is centred and the others wait either side; the row slides along.
  // Click the right third for the next one, the left third for the previous one,
  // the middle to zoom.
  function stripZone(stage, e){
    if(stage._zoom !== null) return 'zoom';
    var r = stage.getBoundingClientRect(), x = (e.clientX - r.left) / r.width;
    if(x < .33) return stage._cur > 0 ? 'left' : 'edge';
    if(x > .67) return stage._cur < stage._items.length - 1 ? 'right' : 'edge';
    return 'mid';
  }
  function stripClick(stage, e){
    var z = stripZone(stage, e);
    if(z === 'zoom') setZoom(stage, null);
    else if(z === 'left') stepStrip(stage, -1);
    else if(z === 'right') stepStrip(stage, 1);
    else if(z === 'mid') setZoom(stage, stage._cur);
  }
  function stepStrip(stage, dir){
    var n2 = Math.max(0, Math.min(stage._items.length - 1, stage._cur + dir));
    if(n2 === stage._cur) return;
    stage._cur = n2;
    if(stage._zoom !== null) setZoom(stage, n2); else layoutStage(stage);
  }
  function layoutStrip(stage){
    var W = stage.clientWidth, H = stage.clientHeight, items = stage._items, c = stage._cur;
    if(!W || !H || !items.length) return;
    var gap = Math.round(W * .12), boxes = [];
    var noteH = 116;                                   // room under the model for its centred note
    var availH = Math.max(120, H - noteH);
    items.forEach(function(it){
      var h = availH * .94, w = it.a * h;
      if(w > W * .64){ w = W * .64; h = w / it.a; }     // a very wide one can't take over the screen
      boxes.push({w: w, h: h});
    });
    var lefts = [];
    lefts[c] = (W - boxes[c].w) / 2;
    for(var k = c + 1; k < items.length; k++) lefts[k] = lefts[k - 1] + boxes[k - 1].w + gap;
    for(var j = c - 1; j >= 0; j--) lefts[j] = lefts[j + 1] - gap - boxes[j].w;
    items.forEach(function(it, k){
      var s = it.fig.style, b = boxes[k];
      it.fig.classList.toggle('is-current', k === c);
      if(stage._zoom === k){
        var zw = Math.min(W, H * it.a), zh = zw / it.a;
        s.left = ((W - zw) / 2) + 'px'; s.top = ((H - zh) / 2) + 'px';
        s.width = zw + 'px'; s.height = zh + 'px';
      } else {
        s.left = lefts[k] + 'px'; s.top = ((availH - b.h) / 2) + 'px';
        s.width = b.w + 'px'; s.height = b.h + 'px';
      }
    });
    if(stage._count) stage._count.textContent = two(c + 1) + ' / ' + two(items.length);
    stage.classList.toggle('at-start', c === 0);
    stage.classList.toggle('at-end', c === items.length - 1);
  }

  function layoutStage(stage){
    if(stage._mode === 'strip'){ layoutStrip(stage); return; }
    var W = stage.clientWidth, H = stage.clientHeight, items = stage._items;
    if(!W || !H || !items.length) return;
    var gap = Math.max(10, Math.round(W * .012)), best = null;
    for(var k = 1; k <= items.length; k++){
      var r = fitRows(items, k, W, H, gap);
      if(!best || r.area > best.area) best = r;
    }
    best.boxes.forEach(function(b){
      var s = b.item.fig.style;
      b.item.box = b;
      if(stage._zoom !== null && items[stage._zoom] === b.item){
        var a = b.item.a, zw = Math.min(W, H * a), zh = zw / a;
        s.left = ((W - zw) / 2) + 'px'; s.top = ((H - zh) / 2) + 'px';
        s.width = zw + 'px'; s.height = zh + 'px';
      } else {
        s.left = b.x + 'px'; s.top = b.y + 'px'; s.width = b.w + 'px'; s.height = b.h + 'px';
      }
    });
  }
  function relayout(){ stages.forEach(layoutStage); }

  function setZoom(stage, i){
    stage._zoom = i;
    stage.classList.toggle('zoomed', i !== null);
    stage._items.forEach(function(it, k){ it.fig.classList.toggle('is-zoomed', k === i); });
    layoutStage(stage);
  }
  function currentStage(){ var s = segs[cur]; return s && s.stage; }
  function unzoomAll(){ stages.forEach(function(st){ if(st._zoom !== null) setZoom(st, null); }); }

  // ---- paging with resistance ---------------------------------------------
  var pagedMQ = window.matchMedia('(min-width:900px) and (hover:hover) and (pointer:fine)');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var THRESH = 360;            // how far you have to push before the page lets go (about four wheel clicks)
  var EXIT_THRESH = 720;       // past the last segment it is heavier still: this takes you back to the home page
  var GRACE_TRACKPAD = 140;    // ms of quiet before a released push starts easing back
  var GRACE_WHEEL = 480;       // a mouse wheel arrives in clicks, so it gets longer to hold
  var HALF_LIFE = 170;         // ms for the stretch to halve while easing back
  var MAXSTRETCH = 140;        // the most the page can ever stretch (px), approached slowly
  var cur = 0, pull = 0, grace = GRACE_TRACKPAD, lastInput = 0;
  var stripSwipe = 0, stripAt = 0;
  var lockQuiet = false, lockAt = 0, animating = false, raf = null, lastFrame = 0, exiting = false;

  // indicator: dots on the right edge, and the "keep scrolling" cue at the bottom
  var dots = el('nav', 'dots');
  dots.setAttribute('aria-label', 'Sections');
  segs.forEach(function(s, i){
    var b = el('button', 'dot');
    b.type = 'button'; b.title = s.name; b.setAttribute('aria-label', s.name);
    b.addEventListener('click', function(){ go(i); });
    dots.appendChild(b);
  });
  document.body.appendChild(dots);
  var cue = el('div', 'cue');
  cue.setAttribute('aria-hidden', 'true');
  var cueLabel = el('span', 'cue__label mono');
  var cueBar = el('span', 'cue__bar');
  cue.appendChild(cueLabel); cue.appendChild(cueBar);
  document.body.appendChild(cue);

  function targetFor(i){
    return i === 0 ? 0 : Math.max(0, segs[i].el.offsetTop - bar.offsetHeight);
  }
  function nearest(){
    var y = window.scrollY, best = 0, bd = 1e9;
    segs.forEach(function(s, i){ var d = Math.abs(targetFor(i) - y); if(d < bd){ bd = d; best = i; } });
    return best;
  }
  function markDots(){
    Array.prototype.forEach.call(dots.children, function(d, i){ d.classList.toggle('on', i === cur); });
    ptitle.classList.toggle('on', cur > 0);
  }

  var easeInOut = function(k){ return k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; };
  var easeOut = function(k){ return 1 - Math.pow(1 - k, 3); };
  function animateTo(y, ease, dur){
    var from = window.scrollY, dist = y - from;
    if(reduce || Math.abs(dist) < 2){ window.scrollTo(0, y); animating = false; return; }
    var t0 = null;
    animating = true;
    function step(t){
      if(t0 === null) t0 = t;
      var k = Math.min(1, (t - t0) / dur);
      window.scrollTo(0, from + dist * ease(k));
      if(k < 1) requestAnimationFrame(step); else animating = false;
    }
    requestAnimationFrame(step);
  }

  // the stretch: follows the push, but every extra bit of push moves the page less
  // (the same curve iOS uses for its rubber band)
  function stretch(x){
    var s = x < 0 ? -1 : 1, a = Math.abs(x);
    return s * MAXSTRETCH * (1 - 1 / (a * .55 / MAXSTRETCH + 1));
  }
  // where a push in this direction leads, and how far it has to go
  function target(){
    var dir = pull > 0 ? 1 : -1, next = segs[cur + dir];
    if(next) return {name: next.name, limit: THRESH, dir: dir};
    if(dir === 1) return {name: exitName, limit: EXIT_THRESH, dir: dir};   // past the last segment: back home
    return null;
  }
  function render(){
    var seg = segs[cur].el;
    var off = reduce ? 0 : stretch(pull);
    seg.style.transition = 'none';
    seg.style.transform = off ? 'translateY(' + (-off).toFixed(2) + 'px)' : '';
    var t = pull ? target() : null;
    if(t){
      var pct = Math.min(1, Math.abs(pull) / t.limit);
      cueLabel.textContent = (t.dir > 0 ? '↓ ' : '↑ ') + t.name;
      cue.style.opacity = String(Math.min(1, .5 + pct * 1.5));     // visible from the first push
      cueBar.style.transform = 'scaleX(' + pct.toFixed(3) + ')';
    } else { cue.style.opacity = '0'; cueBar.style.transform = 'scaleX(0)'; }
  }
  function loop(now){
    raf = null;
    var dt = Math.min(50, now - lastFrame); lastFrame = now;
    // let go, and the page eases back on its own (no hard reset)
    if(pull && now - lastInput > grace){
      pull *= Math.pow(.5, dt / HALF_LIFE);
      if(Math.abs(pull) < .4) pull = 0;
    }
    // after a page turn, wait for the trackpad's trailing momentum to die out
    if(lockQuiet && !animating && now - lastInput > 140 && now - lockAt > 450) lockQuiet = false;
    render();
    if(pull || lockQuiet) raf = requestAnimationFrame(loop);
  }
  function kick(){ if(!raf){ lastFrame = performance.now(); raf = requestAnimationFrame(loop); } }

  // turn the page from wherever the push has got to, so the movement carries straight on
  function commit(dir){
    var off = reduce ? 0 : stretch(pull);
    var seg = segs[cur].el;
    unzoomAll();
    seg.style.transform = '';
    pull = 0;
    render();
    window.scrollTo(0, Math.max(0, window.scrollY + off));   // same picture as the stretched page, now as a real scroll position
    cur += dir; markDots();
    lockQuiet = true; lockAt = performance.now();
    animateTo(targetFor(cur), easeOut, 750);
    kick();
  }

  // pushed all the way through the last segment: fade out and go back to the home page, with this group open
  function leave(){
    exiting = true;
    pull = 0;
    cueLabel.textContent = '';
    document.body.style.transition = 'opacity .45s ease';
    document.body.style.opacity = '0';
    setTimeout(function(){ location.href = backHref; }, 420);
  }

  // dots and keys: a plain, smooth glide
  function go(i){
    i = Math.max(0, Math.min(segs.length - 1, i));
    unzoomAll();
    pull = 0; render();
    if(i !== cur){ cur = i; markDots(); }
    lockQuiet = true; lockAt = performance.now();
    animateTo(targetFor(i), easeInOut, 850);
    kick();
  }

  document.addEventListener('wheel', function(e){
    if(!pagedMQ.matches) return;
    e.preventDefault();
    var now = performance.now();
    lastInput = now;
    if(exiting) return;
    var st0 = currentStage();
    if(st0 && st0._mode === 'strip' && Math.abs(e.deltaX) > Math.abs(e.deltaY)){   // a sideways swipe moves along the models
      stripSwipe += e.deltaX;
      if(Math.abs(stripSwipe) > 70 && now - stripAt > 450){ stepStrip(st0, stripSwipe > 0 ? 1 : -1); stripSwipe = 0; stripAt = now; }
      return;
    }
    if(lockQuiet || animating){ kick(); return; }
    var d = e.deltaY;
    if(e.deltaMode === 1) d *= 16; else if(e.deltaMode === 2) d *= window.innerHeight;
    if(!d) return;
    if(cur === 0 && d < 0 && pull <= 0){ pull = 0; return; }   // nothing above the first segment: scrolling up does nothing at all
    var notch = Math.abs(d) >= 90;                       // a mouse wheel click, as opposed to a trackpad's fine stream
    grace = notch ? GRACE_WHEEL : GRACE_TRACKPAD;
    d = Math.max(-100, Math.min(100, d));
    if(pull && (d > 0) !== (pull > 0)) pull *= .4;       // pushing back the other way gives it up quickly
    pull += d;
    if(cur === 0 && pull < 0) pull = 0;                    // pushing back from a stretch can't overshoot upward either
    var t = target();
    if(t && Math.abs(pull) >= t.limit){
      if(segs[cur + t.dir]) commit(t.dir); else leave();
      return;
    }
    render();
    kick();
  }, {passive: false});

  document.addEventListener('keydown', function(e){
    var tag = (e.target.tagName || '').toLowerCase();
    if(e.key === 'Escape'){ unzoomAll(); return; }
    var st = currentStage();
    if(st && st._mode === 'strip' && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')){
      stepStrip(st, e.key === 'ArrowRight' ? 1 : -1);
      e.preventDefault(); return;
    }
    if(st && st._zoom !== null && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')){
      var len = st._items.length;
      setZoom(st, (st._zoom + (e.key === 'ArrowRight' ? 1 : len - 1)) % len);
      e.preventDefault(); return;
    }
    if(!pagedMQ.matches || tag === 'input' || tag === 'textarea') return;
    var k = e.key;
    if(k === ' ' && (tag === 'button' || tag === 'a')) return;
    if(k === 'ArrowDown' || k === 'PageDown' || (k === ' ' && !e.shiftKey)){ e.preventDefault(); go(cur + 1); }
    else if(k === 'ArrowUp' || k === 'PageUp' || (k === ' ' && e.shiftKey)){ e.preventDefault(); go(cur - 1); }
    else if(k === 'Home'){ e.preventDefault(); go(0); }
    else if(k === 'End'){ e.preventDefault(); go(segs.length - 1); }
  });

  // keep the dots honest if the page is moved some other way (scrollbar, touch, a link)
  var ticking = false;
  window.addEventListener('scroll', function(){
    if(ticking || animating) return;
    ticking = true;
    requestAnimationFrame(function(){ ticking = false; var n2 = nearest(); if(n2 !== cur){ cur = n2; markDots(); } });
  });

  function applyMode(){
    document.documentElement.classList.toggle('paged', pagedMQ.matches);
    dots.style.display = pagedMQ.matches ? '' : 'none';
    relayout();
  }
  if(pagedMQ.addEventListener) pagedMQ.addEventListener('change', applyMode);
  window.addEventListener('resize', function(){
    setBar(); relayout();
    if(pagedMQ.matches && !animating) window.scrollTo(0, targetFor(cur));   // stay on the same segment
  });

  markDots();
  applyMode();
  requestAnimationFrame(relayout);
})();
