/* "Modern through restraint" (2026-10-27, after MAD, i-mad.com), preview only. Nothing changes without ?s=.
   He turned down added readouts, effects and whole new layouts: "minimalistic but modern and futuristic without using
   many things". So these only retune what is already there (type, weight, tone), nothing is added.
   ?s= takes one or more, joined by commas (?s=light,cool); ?s=off clears. Kept for the visit (sessionStorage).
     light  the project names in a light weight, a little larger; the "+" and the marks as fine as the name's lines
     caps   the project names in small, widely spaced capitals
     geist  the project names and words in Geist, a more technical grotesk (his name stays in Archivo)
     cool   a cool, faintly grey ground and a colder ink; the pictures keep their own colours, drawings sit on it as sheets */
(function(){
  var K = 'gc-style', Q = new URLSearchParams(location.search), s = Q.get('s');
  try {
    if(s !== null){ if(s === 'off' || s === '') sessionStorage.removeItem(K); else sessionStorage.setItem(K, s); }
    s = sessionStorage.getItem(K);
  } catch(e){}
  if(!s) return;
  var ALL = ['light', 'caps', 'geist', 'cool'];
  var on = s.split(',').filter(function(x){ return ALL.indexOf(x) > -1; });
  if(!on.length) return;
  on.forEach(function(x){ document.body.classList.add('s-' + x); });
  var css = document.createElement('link'); css.rel = 'stylesheet'; css.href = 'modern.css'; document.head.appendChild(css);
  if(on.indexOf('geist') > -1){
    var f = document.createElement('link'); f.rel = 'stylesheet';
    f.href = 'https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500&display=swap';
    document.head.appendChild(f);
  }
})();
