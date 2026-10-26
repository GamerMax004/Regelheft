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
  // ---- Einstellungen aus dem Dashboard (Mitteilung, Funktionen an/aus, Neues …). Standardwerte stehen in config.js ----
  const cfg = {
    maintenance: {enabled:false, message:''},
    announcement: {enabled:false, text:'', type:'info', link:'', linkText:''},
    news: NEWS,
    features: {ai:true, registration:true, favorites:true, recent:true, notes:true, practice:true, share:true, darkmode:true, stats:true},
    social: {discord:SOCIAL.discord, instagram:SOCIAL.instagram}
  };
  const defaults = {news: NEWS, discord: SOCIAL.discord, instagram: SOCIAL.instagram};
  const cfgSubs = [];
  const onConfig = fn => { cfgSubs.push(fn); fn(cfg); };
  function applyConfig(j){
    if(!j || typeof j !== 'object') return;
    if(j.maintenance) Object.assign(cfg.maintenance, j.maintenance);
    if(j.announcement) Object.assign(cfg.announcement, j.announcement);
    if(j.features) Object.assign(cfg.features, j.features);
    cfg.news = j.news || defaults.news;
    const so = j.social || {};
    cfg.social.discord = so.discord == null ? defaults.discord : so.discord;
    cfg.social.instagram = so.instagram == null ? defaults.instagram : so.instagram;
    SOCIAL.discord = cfg.social.discord; SOCIAL.instagram = cfg.social.instagram;
    cfgSubs.slice().forEach(f => f(cfg));
  }
  const configReady = configured
    ? Promise.race([fetch(API + '/api/config').then(r => r.json()), new Promise((_, rej) => setTimeout(rej, 3500))]).then(applyConfig).catch(() => {})
    : Promise.resolve();

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

  return {api, setAuth, logout, onAuth, ready, esc, logEv, safeNext, toLogin, configured, onConfig, configReady, cfg: () => cfg, feat: k => cfg.features[k] !== false, defaults,
          user: () => auth.user, hasToken: () => !!auth.token, isLoading: () => loading};
})();
