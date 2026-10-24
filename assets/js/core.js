/* ============================================================
   Gemeinsamer Kern für alle Seiten: Server-Zugriff, Anmeldestatus, Hilfsfunktionen.
   Hier musst du normalerweise nichts ändern (Einstellungen: config.js).
   ============================================================ */
const RH = (function(){
  const API = AI_CONFIG.proxyUrl.replace(/\/api\/ai\/?$/, '').replace(/\/+$/, '');
  const configured = !API.includes('DEIN-PROXY');
  let auth = {token:null, user:null};
  try{ auth.token = localStorage.getItem('regelheft-token'); }catch(e){}
  let loading = !!(auth.token && configured);
  const subs = [];

  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const emit = () => subs.slice().forEach(f => f(auth.user, loading));
  const onAuth = fn => { subs.push(fn); fn(auth.user, loading); };

  async function api(path, opts){
    opts = opts || {};
    if(!configured) throw new Error('Der Server ist noch nicht eingerichtet (proxyUrl fehlt in config.js).');
    const h = {'Content-Type':'application/json'};
    if(auth.token) h.Authorization = 'Bearer ' + auth.token;
    let r;
    try{ r = await fetch(API + path, {method: opts.method || (opts.body ? 'POST' : 'GET'), headers:h, body: opts.body ? JSON.stringify(opts.body) : undefined}); }
    catch(e){ throw new Error('Keine Verbindung zum Server. Bitte prüfe deine Internetverbindung und versuche es gleich noch einmal.'); }
    const j = await r.json().catch(() => ({}));
    if(r.status === 401 && auth.token && path !== '/api/login') setAuth(null, null);
    if(!r.ok){ const e = new Error(r.status === 403 ? 'Nicht erlaubt. (Die Adresse dieser Webseite fehlt evtl. in ALLOWED_ORIGIN im Worker.)' : (j.error || ('Fehler ' + r.status))); e.status = r.status; throw e; }
    return j;
  }
  function setAuth(token, user){
    auth = {token, user};
    try{ token ? localStorage.setItem('regelheft-token', token) : localStorage.removeItem('regelheft-token'); }catch(e){}
    emit();
  }
  async function logout(){
    try{ await api('/api/logout', {body:{}}); }catch(e){}
    setAuth(null, null);
  }
  // Erst-Prüfung: ist das gespeicherte Token noch gültig?
  const ready = loading
    ? api('/api/me').then(j => { loading = false; setAuth(auth.token, j.user); }).catch(() => { loading = false; emit(); })
    : Promise.resolve();

  // Statistik (Suchbegriffe / geöffnete Regeln), ohne personenbezogene Daten
  function logEv(kind, value){
    if(!configured) return;
    fetch(API + '/api/log', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({kind, value}), keepalive:true}).catch(() => {});
  }
  // Nur Seiten dieser Webseite als Weiterleitungsziel erlauben (z. B. "ki.html" oder "index.html#r12")
  function safeNext(n){ return /^[a-z0-9_-]+\.html(#[\w-]+)?$/i.test(n || '') ? n : 'index.html'; }
  function toLogin(next){ location.replace('anmeldung.html?next=' + encodeURIComponent(next)); }

  return {api, setAuth, logout, onAuth, ready, esc, logEv, safeNext, toLogin, configured,
          user: () => auth.user, hasToken: () => !!auth.token, isLoading: () => loading};
})();
