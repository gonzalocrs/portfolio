// Signature: exactly one letter per word is mirrored at any time. It starts as the
// N, R and L. While you hover, the mirrored letter turns upright (see the .gv-mark
// CSS); when you move away, the next letter from that word's short list takes its
// place and stays mirrored until the next hover. Only the hand-picked letters below
// ever change, so a word alternates between its two.
(function(){
  var mark = document.querySelector('.gv-mark');
  if(!mark) return;

  // position of each picked letter inside its word (GONZALO, CÁCERES, VALCÁRCEL)
  var PICKS = [
    [2, 5],   // N, L
    [4, 2],   // R, C
    [2, 5]    // L, R
  ];

  var words = [], cur = [];
  Array.prototype.forEach.call(mark.querySelectorAll('.gv-mark__line'), function(line){
    Array.prototype.forEach.call(line.children, function(s){
      if(s.classList.contains('gv-mark__gap')){ if(cur.length) words.push(cur); cur = []; }
      else cur.push(s);
    });
    if(cur.length) words.push(cur);
    cur = [];
  });
  var at = words.map(function(){ return 0; });   // which pick is mirrored now

  function advance(){
    words.forEach(function(w, wi){
      var picks = PICKS[wi];
      if(!picks) return;
      w[picks[at[wi]]].classList.remove('gv-mark__flip');
      at[wi] = (at[wi] + 1) % picks.length;
      w[picks[at[wi]]].classList.add('gv-mark__flip');
    });
  }
  mark.addEventListener('mouseleave', advance);
  mark.addEventListener('blur', advance);
})();
