/*
  The sphere gallery: every picture on a slowly turning sphere seen in perspective, after the home page of
  adamjakubowski.pl (a Framer "Sphere Gallery" component). Same maths as that component, without React:

  - The cards sit on a Fibonacci sphere (evenly spread points), stretched to an ellipsoid: `radius` wide and
    deep, `height` tall. The point nearest the front centre is moved to index 0, so the first card always
    starts there.
  - Each frame the sphere turns about X and Y (both by 360° / `duration` per second when axis is "xy", which
    gives the slow diagonal tumble), then the depth is squashed by `zScale` and the camera stands `camera`
    px in front of the centre. A point at depth z is drawn at scale perspective / (perspective - z), moved by
    the same factor, and stacked by depth. Cards always face the viewer (no rotateY): a "billboard".
  - Dragging gives the sphere a spin that fades out (x 0.94 per 60 Hz frame). Ctrl/⌘ + wheel, a trackpad
    pinch or a two-finger pinch zooms between `zoomMin` and `zoomMax`.
  - On first show, every card grows from nothing as a solid block (the first one first, then the others in a
    staggered wave) and the block then fades away to reveal the picture: `appear` seconds in all.

  Usage:
    var g = SphereGallery(rootEl, [{el: cardElement}, ...], {radius: 1600, ...});
    g.start();     // after the cards have their size (pictures loaded), starts the intro and the motion
    g.destroy();
*/
(function(){
  function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }
  function easeOutQuart(t){ return 1 - Math.pow(1 - t, 4); }
  function easeInOutCubic(t){ return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  // n points spread evenly over an ellipsoid: `radius` across and deep, `height` tall
  function fibonacci(n, radius, height){
    var pts = [], golden = Math.PI * (3 - Math.sqrt(5)), count = Math.max(1, n);
    for(var i = 0; i < count; i++){
      var y = count === 1 ? 0 : 1 - 2 * (i / (count - 1)), r = Math.sqrt(1 - y * y), a = golden * i;
      pts.push({x: Math.cos(a) * r * radius, y: -y * height / 2, z: Math.sin(a) * r * radius});
    }
    // the point most facing the viewer (front, near the middle) becomes the first, so card 0 starts in front
    var best = 0, score = -Infinity;
    pts.forEach(function(p, i){
      var s = p.z - Math.abs(p.x) * .5 - Math.abs(p.y) * .5;
      if(s > score){ score = s; best = i; }
    });
    var t = pts[0]; pts[0] = pts[best]; pts[best] = t;
    return pts;
  }
  function rotX(p, deg){
    var a = deg * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
    return {x: p.x, y: p.y * c - p.z * s, z: p.y * s + p.z * c};
  }
  function rotY(p, deg){
    var a = deg * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
    return {x: p.x * c + p.z * s, y: p.y, z: -p.x * s + p.z * c};
  }

  var DEFAULTS = {
    radius: 1600,        // half-width and half-depth of the sphere, px
    height: 1100,        // full height, px
    zScale: .5,          // squashes the depth, so the back is not too small
    perspective: 900,
    camera: 1000,        // how far in front of the centre the camera stands
    duration: 120,       // seconds per full turn of the automatic rotation
    axis: 'xy',          // 'x', 'y' or 'xy'
    autoRotate: true,
    dragSensitivity: 5,
    friction: .94,       // spin kept per 60 Hz frame after a drag
    zoomMin: .7,
    zoomMax: 2,
    zoomSensitivity: .05,
    appear: 3,           // seconds for the opening animation; 0 for none
    clickSlop: 6         // px a press may move and still count as a click on a card
  };

  window.SphereGallery = function(root, cards, options){
    var o = {}, k;
    for(k in DEFAULTS) o[k] = DEFAULTS[k];
    for(k in (options || {})) o[k] = options[k];
    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(reduced){ o.autoRotate = false; o.appear = 0; }

    var pts = fibonacci(cards.length, o.radius, o.height);
    var angle = {x: 0, y: 0}, spin = {x: 0, y: 0}, zoom = 1;
    var raf = null, last = 0, t0 = null, appearing = o.appear > 0, grow = [];

    // each card goes in a wrapper that is placed at the sphere's centre and moved by transform
    var items = cards.map(function(c){
      var item = document.createElement('div');
      item.className = 'sphere-item';
      item.style.opacity = '0';
      item.appendChild(c.el);
      var veil = null;
      if(appearing){
        veil = document.createElement('span');
        veil.className = 'sphere-veil';
        c.el.appendChild(veil);
      }
      root.appendChild(item);
      return {el: item, veil: veil};
    });

    function frame(now){
      var dt = last ? Math.min(.1, (now - last) / 1000) : 0;
      last = now;
      var f = dt * 60;     // in 60 Hz frames, so the spin feels the same on a 120 Hz screen

      if(o.autoRotate){
        var w = 360 / o.duration * dt;
        if(o.axis !== 'x') angle.y += w;
        if(o.axis !== 'y') angle.x += w;
      }
      angle.x += spin.x * f; angle.y += spin.y * f;
      var decay = Math.pow(o.friction, f);
      spin.x *= decay; spin.y *= decay;

      // opening: card 0 grows over the first 30%, the rest in a wave from 20% to about 45%; then, from 55%,
      // the blocks fade off the pictures, also in a wave
      var p = 1;
      if(appearing){
        if(t0 === null) t0 = now;
        p = Math.min((now - t0) / 1000 / o.appear, 1);
        var n = items.length, A = .2, B = .65, span = (B - A) * .45;
        items.forEach(function(it, i){
          var g = i === 0 ? clamp(p / .3, 0, 1)
                          : clamp((p - (A + (i - 1) / Math.max(1, n - 1) * (B - A - span))) / span, 0, 1);
          grow[i] = easeOutQuart(g);
          if(it.veil){
            var d = i / Math.max(1, n - 1) * .25;
            it.veil.style.opacity = String(1 - easeInOutCubic(clamp((p - (.55 + d * .45)) / .3375, 0, 1)));
          }
        });
        if(p >= 1){
          appearing = false;
          items.forEach(function(it){ if(it.veil){ it.veil.remove(); it.veil = null; } });
        }
      }

      var P = o.perspective, cam = -o.camera;
      for(var i = 0; i < items.length; i++){
        var q = rotY(rotX(pts[i], angle.x), angle.y);
        var z = q.z * o.zScale + cam;
        var s = P / Math.max(1, P - z);
        var sc = s * zoom * (appearing ? grow[i] || 0 : 1);
        var st = items[i].el.style;
        st.transform = 'translate3d(' + (q.x * s).toFixed(2) + 'px,' + (q.y * s).toFixed(2) + 'px,0) translate(-50%,-50%) scale(' + sc.toFixed(4) + ')';
        st.zIndex = String(Math.round(z + 1000));
        st.opacity = '1';
      }
      raf = requestAnimationFrame(frame);
    }

    // ---- drag to spin (anywhere, cards included; a press that barely moves still opens the card) ----
    var drag = null, suppressClick = false, touches = {}, pinch = null;
    function onDown(e){
      if(e.pointerType === 'touch'){
        touches[e.pointerId] = {x: e.clientX, y: e.clientY};
        var ids = Object.keys(touches);
        if(ids.length === 2){
          pinch = {d: dist(), z: zoom};
          drag = null;
          return;
        }
      }
      if(e.button > 0) return;
      drag = {x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, moved: false};
      suppressClick = false;
      root.classList.add('is-dragging');
    }
    function dist(){
      var v = Object.keys(touches).map(function(id){ return touches[id]; });
      return Math.hypot(v[0].x - v[1].x, v[0].y - v[1].y);
    }
    function onMove(e){
      if(e.pointerType === 'touch' && touches[e.pointerId]){
        touches[e.pointerId] = {x: e.clientX, y: e.clientY};
        if(pinch && Object.keys(touches).length === 2){
          zoom = clamp(pinch.z * dist() / Math.max(1, pinch.d), o.zoomMin, o.zoomMax);
          return;
        }
      }
      if(!drag) return;
      var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      drag.x = e.clientX; drag.y = e.clientY;
      if(Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) > o.clickSlop) drag.moved = true;
      spin.y = dx * o.dragSensitivity * .02;
      spin.x = -dy * o.dragSensitivity * .02;
    }
    function onUp(e){
      if(e && e.pointerType === 'touch'){
        delete touches[e.pointerId];
        if(Object.keys(touches).length < 2) pinch = null;
      }
      if(drag && drag.moved) suppressClick = true;
      drag = null;
      root.classList.remove('is-dragging');
    }
    // a drag that ends over a card must not also open it
    function onClick(e){
      if(suppressClick){ e.preventDefault(); e.stopPropagation(); suppressClick = false; }
    }
    // Ctrl/⌘ + wheel (also what a trackpad pinch sends) zooms; a plain wheel is left to scroll the page
    function onWheel(e){
      if(!(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      zoom = clamp(zoom * Math.exp(-e.deltaY * o.zoomSensitivity * .01), o.zoomMin, o.zoomMax);
    }
    // Safari's own pinch events (desktop trackpad)
    var gesture = null;
    function onGestureStart(e){ e.preventDefault(); gesture = {s: e.scale || 1, z: zoom}; }
    function onGestureChange(e){
      if(!gesture) return;
      e.preventDefault();
      zoom = clamp(gesture.z * (e.scale || 1) / gesture.s, o.zoomMin, o.zoomMax);
    }
    function onGestureEnd(e){ gesture = null; e.preventDefault(); }
    function noDrag(e){ e.preventDefault(); }

    root.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    root.addEventListener('click', onClick, true);
    root.addEventListener('wheel', onWheel, {passive: false});
    root.addEventListener('dragstart', noDrag);
    root.addEventListener('gesturestart', onGestureStart);
    root.addEventListener('gesturechange', onGestureChange);
    root.addEventListener('gestureend', onGestureEnd);

    return {
      start: function(){ if(raf === null){ last = 0; raf = requestAnimationFrame(frame); } },
      destroy: function(){
        if(raf !== null) cancelAnimationFrame(raf);
        raf = null;
        root.removeEventListener('pointerdown', onDown);
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('pointercancel', onUp);
        root.removeEventListener('click', onClick, true);
        root.removeEventListener('wheel', onWheel);
        root.removeEventListener('dragstart', noDrag);
        root.removeEventListener('gesturestart', onGestureStart);
        root.removeEventListener('gesturechange', onGestureChange);
        root.removeEventListener('gestureend', onGestureEnd);
        items.forEach(function(it){ it.el.remove(); });
      }
    };
  };
})();
