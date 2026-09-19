(function(){
  // Where messages go. ENDPOINT is a FormSubmit address that forwards to EMAIL; the
  // very first message triggers a one-time activation email to confirm the address.
  // Set ENDPOINT to a form service URL (e.g. Formspree) and
  // the message is posted there as JSON. Without one, the visitor's mail app
  // opens with the message filled in, addressed to EMAIL.
  var ENDPOINT = 'https://formsubmit.co/ajax/gc3139@columbia.edu';
  var EMAIL = 'gc3139@columbia.edu';

  var flow = document.getElementById('flow');
  var details = document.getElementById('details');
  var form = document.getElementById('form');
  var nameIn = document.getElementById('name');
  var contactIn = document.getElementById('contact');
  var msgIn = document.getElementById('message');
  var trap = document.getElementById('company');
  var send = document.getElementById('send');
  var status = document.getElementById('status');
  var choices = Array.prototype.slice.call(document.querySelectorAll('.choice'));

  function topics(){
    return choices.filter(function(b){ return b.getAttribute('aria-pressed') === 'true'; })
                  .map(function(b){ return b.getAttribute('data-topic'); });
  }

  function open(on){
    details.classList.toggle('open', on);
    flow.classList.toggle('has-choice', on);
  }
  function dirty(){
    return topics().length || nameIn.value || contactIn.value || msgIn.value || details.contains(document.activeElement);
  }
  // the form opens as soon as a word is hovered, and closes again shortly after
  // the pointer leaves the words and the form, unless something was picked or typed
  var timer;
  var closed = false; // set by clicking the −, so hovering doesn't instantly reopen the form
  function hold(){ clearTimeout(timer); if(!closed) open(true); }
  function release(){ clearTimeout(timer); closed = false; timer = setTimeout(function(){ if(!dirty()) open(false); }, 250); }
  choices.forEach(function(b){ b.addEventListener('mouseenter', hold); b.addEventListener('mouseleave', release); });
  form.addEventListener('mouseenter', hold);
  form.addEventListener('mouseleave', release);
  details.addEventListener('focusout', release);

  choices.forEach(function(b){
    b.addEventListener('click', function(){
      b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
      // deselecting the last topic (the −) closes the form again
      var keep = dirty();
      closed = !keep;
      open(keep);
    });
  });

  function say(msg, err){ status.textContent = msg; status.classList.toggle('error', !!err); }

  form.addEventListener('submit', function(e){
    e.preventDefault();
    nameIn.removeAttribute('aria-invalid');
    contactIn.removeAttribute('aria-invalid');
    if(trap.value) return; // bot

    var t = topics(), msg = msgIn.value.trim(), name = nameIn.value.trim(), how = contactIn.value.trim();
    if(!t.length){ say('Pick a topic first.', true); return; }
    if(!name){ nameIn.setAttribute('aria-invalid', 'true'); say('Add your name.', true); nameIn.focus(); return; }
    var okEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(how);
    var okPhone = /^[+()\d\s.\-]{7,}$/.test(how) && (how.match(/\d/g) || []).length >= 7;
    if(!okEmail && !okPhone){ contactIn.setAttribute('aria-invalid', 'true'); say('Add an email or a phone number.', true); contactIn.focus(); return; }

    var subject = 'Website: ' + t.join(' + ');
    var body = 'Topic: ' + t.join(', ') + '\nName: ' + name + '\nReach me at: ' + how + (msg ? '\n\n' + msg : '');

    function done(){ flow.classList.add('sent'); }

    if(ENDPOINT){
      send.disabled = true; say('Sending…');
      fetch(ENDPOINT, {
        method: 'POST',
        headers: {'Content-Type': 'application/json', 'Accept': 'application/json'},
        body: JSON.stringify({topic: t.join(', '), name: name, contact: how, message: msg, subject: subject, _subject: subject, _template: 'table'})
      }).then(function(r){
        if(!r.ok) throw new Error(r.status);
        done();
      }).catch(function(){
        send.disabled = false;
        say('Something went wrong. Please try again.', true);
      });
    } else {
      location.href = 'mailto:' + EMAIL + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
      done();
    }
  });
})();
