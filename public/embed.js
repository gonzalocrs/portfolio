// A project page opened inside the home page's overlay (project.html?p=...&embed=1, see index.html): the page drops its
// own name and menu (the home page is right behind it), and everything that would go back home closes the overlay
// instead: the back links, pushing past the last section, and Esc.
(function(){
  if(!/[?&]embed=1(&|$)/.test(location.search)) return;
  var root = document.documentElement;
  root.classList.add('embed');
  var css = document.createElement('style');
  css.textContent = '.embed .bar > .gv-mark, .embed .bar > nav{visibility:hidden}';
  document.head.appendChild(css);

  window.gcClose = function(){ parent.postMessage({gc: 'close'}, location.origin); };
  document.addEventListener('click', function(e){
    var a = e.target.closest && e.target.closest('a[href]');
    if(!a) return;
    var href = a.getAttribute('href');
    if(href === '/' || /^\/?(index\.html)?\?open=/.test(href)){ e.preventDefault(); e.stopPropagation(); gcClose(); }
    else if(/^\/?project(-oma)?\.html\?/.test(href) && !/[?&]embed=1/.test(href)) a.setAttribute('href', href + '&embed=1');
  }, true);
  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape' && !document.querySelector('.lightbox')) gcClose();
  }, true);
})();
