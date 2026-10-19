// While the site is a work in progress, everything sits behind one passcode. The passcode is the PASSCODE secret on
// the Worker (Cloudflare dashboard > Workers > portfolio > Settings > Variables and Secrets), never in this repo.
// With no PASSCODE set the site is open, as before. A right passcode leaves a cookie for 30 days.

const COOKIE = 'gcv_pass';
const DAYS = 30;

async function token(code){
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('gcv-entrance:' + code));
  return [...new Uint8Array(d)].map(b => b.toString(16).padStart(2, '0')).join('');
}

function cookieOf(req, name){
  const m = (req.headers.get('Cookie') || '').match(new RegExp('(?:^|;\\s*)' + name + '=([^;]+)'));
  return m ? m[1] : '';
}

// only paths on this site, never another host
function safeNext(n){ return typeof n === 'string' && n.startsWith('/') && !n.startsWith('//') && !n.startsWith('/\\') ? n : '/'; }

function esc(s){ return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

function entrance(next, wrong){
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>Gonzalo Cáceres Valcárcel</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@300;800&family=IBM+Plex+Mono:wght@400&display=swap" rel="stylesheet">
<style>
  :root{--paper:#fff;--ink:#0f1216;--rule:#d8d6d1;--mute:#7b7d80;--live:#1a2ce0;--mono:"IBM Plex Mono",Consolas,monospace}
  @media (prefers-color-scheme:dark){:root{--paper:#0d0e10;--ink:#f2f1ee;--rule:#2b2d30;--mute:#8b8d90;--live:#7d8bff}}
  *{box-sizing:border-box}
  html,body{margin:0;height:100%;background:var(--paper);color:var(--ink);font-family:Archivo,system-ui,sans-serif;font-weight:300}
  body{display:flex;flex-direction:column;padding:1.6rem 2.5rem}
  .name{font-size:.95rem;letter-spacing:.32em;text-transform:uppercase;line-height:1.1}
  main{flex:1;display:flex;align-items:center}
  .card{width:min(21rem,100%);background:color-mix(in srgb,var(--ink) 3%,var(--paper));
    box-shadow:0 1px 0 color-mix(in srgb,var(--ink) 10%,transparent),0 6px 18px -10px rgba(0,0,0,.25);padding:1.35rem 1.4rem 1.45rem}
  .tag,label,button,.err{font-family:var(--mono);font-size:.66rem;text-transform:uppercase;letter-spacing:.05em;color:var(--mute)}
  h1{margin:.5rem 0 .4rem;font-weight:800;font-size:1.7rem;line-height:1.1;letter-spacing:-.02em}
  p{margin:0 0 1.2rem;line-height:1.45;font-size:.95rem}
  label{display:block;margin-bottom:.35rem}
  .row{display:flex;gap:.6rem;align-items:flex-end}
  input{flex:1;min-width:0;font:inherit;font-size:1rem;color:var(--ink);background:transparent;border:0;border-bottom:1px solid var(--rule);padding:.35rem 0;border-radius:0;outline:none}
  input:focus{border-bottom-color:var(--ink)}
  button{background:none;border:0;padding:.4rem 0;cursor:pointer;color:var(--ink);display:flex;align-items:center;gap:.35rem}
  button:hover{color:var(--live)}
  button svg{width:12px;height:12px;fill:none;stroke:currentColor;stroke-width:1.5}
  .err{margin-top:.8rem;color:var(--ink)}
  @media (max-width:700px){body{padding:1.2rem 1rem}}
</style></head>
<body>
  <div class="name">Gonzalo Cáceres Valcárcel</div>
  <main>
    <form class="card" method="post" action="/__enter">
      <span class="tag">Work in progress</span>
      <h1>Private preview</h1>
      <p>This portfolio is still being hung. Enter the passcode to visit.</p>
      <input type="hidden" name="next" value="${esc(next)}">
      <label for="code">Passcode</label>
      <div class="row">
        <input id="code" name="code" type="password" autocomplete="current-password" autofocus required>
        <button type="submit" aria-label="Enter">Enter<svg viewBox="0 0 12 12"><path d="M4 2l4 4-4 4"/></svg></button>
      </div>
      ${wrong ? '<div class="err">That passcode is not right.</div>' : ''}
    </form>
  </main>
</body></html>`;
}

function page(html, status){
  return new Response(html, {status, headers: {
    'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex'
  }});
}

export default {
  async fetch(req, env){
    const code = env.PASSCODE;
    if(!code) return env.ASSETS.fetch(req);
    const url = new URL(req.url);
    const good = await token(code);

    if(url.pathname === '/__enter' && req.method === 'POST'){
      const form = await req.formData();
      const next = safeNext(form.get('next'));
      if(await token(String(form.get('code') || '').trim()) !== good) return page(entrance(next, true), 401);
      return new Response(null, {status: 303, headers: {
        'Location': next,
        'Set-Cookie': `${COOKIE}=${good}; Path=/; Max-Age=${DAYS * 86400}; HttpOnly; Secure; SameSite=Lax`,
        'Cache-Control': 'no-store'
      }});
    }

    if(cookieOf(req, COOKIE) === good){
      const res = await env.ASSETS.fetch(req);
      const out = new Response(res.body, res);
      out.headers.set('X-Robots-Tag', 'noindex');
      return out;
    }
    return page(entrance(safeNext(url.pathname + url.search), false), 401);
  }
};
