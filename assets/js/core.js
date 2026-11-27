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
    social: {discord:SOCIAL.discord, instagram:SOCIAL.instagram},
    billing: {enabled:false, proFeatures:{practice:true, notes:true}, freeTokens:60, plusTokens:600, proTokens:3000, costs:{ai:4, aiImage:8, kurs:40, karten:10, tts:8}, plusFeatures:{practice:false, notes:true}, plusAvailable:false, yearly:true, kleinunternehmer:true, note:''},
    auth: {requireEmail:false, verifyActive:false, mailActive:false, google:false},
    advent: true,   // Adventskalender (im Dashboard abschaltbar)
    submit: true    // Einträge einreichen (im Dashboard abschaltbar)
  };
  const defaults = {news: NEWS, discord: SOCIAL.discord, instagram: SOCIAL.instagram, email: (typeof LEGAL !== 'undefined' && LEGAL.email) || '', phone: (typeof LEGAL !== 'undefined' && LEGAL.phone) || ''};
  const cfgSubs = [];
  const onConfig = fn => { cfgSubs.push(fn); fn(cfg); };
  function applyConfig(j){
    if(!j || typeof j !== 'object') return;
    if(j.maintenance) Object.assign(cfg.maintenance, j.maintenance);
    if(j.announcement) Object.assign(cfg.announcement, j.announcement);
    if(j.features) Object.assign(cfg.features, j.features);
    if(j.billing){ Object.assign(cfg.billing, j.billing); if(j.billing.proFeatures) cfg.billing.proFeatures = Object.assign({practice:true, notes:true}, j.billing.proFeatures); if(j.billing.plusFeatures) cfg.billing.plusFeatures = Object.assign({practice:false, notes:true}, j.billing.plusFeatures); }
    if(j.auth) Object.assign(cfg.auth, j.auth);
    if(j.advent !== undefined) cfg.advent = j.advent !== false;
    if(j.submit !== undefined) cfg.submit = j.submit !== false;
    cfg.news = j.news || defaults.news;
    const so = j.social || {};
    cfg.social.discord = so.discord == null ? defaults.discord : so.discord;
    cfg.social.instagram = so.instagram == null ? defaults.instagram : so.instagram;
    SOCIAL.discord = cfg.social.discord; SOCIAL.instagram = cfg.social.instagram;
    // Kontaktdaten aus dem Dashboard überschreiben die Standardwerte (Impressum, Datenschutz, Footer)
    cfg.contact = {email: (j.contact && j.contact.email) || '', phone: (j.contact && j.contact.phone) || ''};
    if(typeof LEGAL !== 'undefined'){ LEGAL.email = cfg.contact.email || defaults.email; LEGAL.phone = cfg.contact.phone || defaults.phone; }
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
    if(!r.ok){ const e = new Error(r.status === 403 && (!j.error || j.error === 'Nicht erlaubt.') ? 'Nicht erlaubt. (Die Adresse dieser Webseite fehlt evtl. in ALLOWED_ORIGIN im Worker.)' : (j.error || ('Fehler ' + r.status))); e.status = r.status; e.code = j.code; e.data = j; throw e; }
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

  // ---- Gesperrte Konten: eigene Sperrseite mit Grund; nur Abmelden oder Konto löschen ist möglich ----
  function banGate(user){
    let g = document.getElementById('banGate');
    if(!user || !user.banned){ if(g){ g.remove(); document.documentElement.style.overflow = ''; } return; }
    if(g) return;
    if(!document.getElementById('banGateCss')){
      const st = document.createElement('style'); st.id = 'banGateCss';
      st.textContent = '#banGate{position:fixed;inset:0;z-index:99999;display:grid;place-items:center;padding:20px;overflow:auto;background:var(--bg,#f2f2f7);color:var(--ink,#111);font:inherit}'
        + '#banGate .bg-card{width:min(460px,100%);background:var(--surface,#fff);border:1px solid var(--border,#d6d6dc);border-radius:22px;padding:28px 24px;text-align:center;box-shadow:0 18px 50px rgba(0,0,0,.12)}'
        + '#banGate .bg-ic{width:64px;height:64px;margin:0 auto 14px;display:grid;place-items:center;border-radius:50%;border:2.5px solid currentColor}'
        + '#banGate h1{margin:0 0 10px;font-size:1.5rem}#banGate p{margin:0 0 12px;line-height:1.5}'
        + '#banGate .bg-reason{margin:14px 0;padding:12px 14px;border-radius:14px;border:1.5px solid var(--border,#d6d6dc);text-align:left}#banGate .bg-reason small{display:block;opacity:.7;margin-bottom:2px}'
        + '#banGate .bg-act{display:flex;flex-direction:column;gap:10px;margin-top:18px}'
        + '#banGate button,#banGate input{font:inherit;min-height:48px;border-radius:14px;padding:0 16px}'
        + '#banGate button{cursor:pointer;border:1.5px solid var(--border,#c7c7cc);background:transparent;color:inherit;font-weight:600}'
        + '#banGate button.bg-main{background:var(--ink,#111);color:var(--surface,#fff);border-color:transparent}'
        + '#banGate button.bg-danger{border-color:#c0392b;color:#c0392b}#banGate input{width:100%;box-sizing:border-box;border:1.5px solid var(--border,#c7c7cc);background:transparent;color:inherit}'
        + '#banGate .bg-err{color:#c0392b;min-height:1.2em;margin:8px 0 0;font-size:.9rem}#banGate .bg-del{display:none;margin-top:14px;text-align:left}#banGate .bg-del.on{display:block}';
      document.head.appendChild(st);
    }
    g = document.createElement('div'); g.id = 'banGate'; g.setAttribute('role', 'alertdialog'); g.setAttribute('aria-modal', 'true'); g.setAttribute('aria-labelledby', 'bgT');
    const mail = (typeof LEGAL !== 'undefined' && LEGAL.email) ? LEGAL.email : '';
    g.innerHTML = '<div class="bg-card"><div class="bg-ic" aria-hidden="true"><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg></div>'
      + '<h1 id="bgT" tabindex="-1">Dein Konto wurde gesperrt</h1><p>Du kannst das Regelheft mit diesem Konto zurzeit nicht nutzen.</p>'
      + (user.banReason ? '<div class="bg-reason"><small>Grund</small>' + esc(user.banReason) + '</div>' : '')
      + '<p>Wenn du das für einen Fehler hältst, melde dich beim Betreiber' + (mail ? ' unter <a href="mailto:' + esc(mail) + '">' + esc(mail) + '</a>' : '') + '.</p>'
      + '<div class="bg-act"><button type="button" class="bg-main" id="bgOut">Abmelden</button><button type="button" class="bg-danger" id="bgDel">Konto löschen</button></div>'
      + '<div class="bg-del" id="bgForm"><p>Alle Daten deines Kontos werden endgültig gelöscht. Zur Bestätigung ' + (user.hasPassword === false ? 'gib deinen Benutzernamen ein:' : 'gib dein Passwort ein:') + '</p>'
      + '<input id="bgPw" type="' + (user.hasPassword === false ? 'text' : 'password') + '" autocomplete="' + (user.hasPassword === false ? 'off' : 'current-password') + '" aria-label="Bestätigung"><p class="bg-err" id="bgErr" role="alert"></p>'
      + '<div class="bg-act"><button type="button" class="bg-danger" id="bgGo">Endgültig löschen</button><button type="button" id="bgNo">Abbrechen</button></div></div></div>';
    document.body.appendChild(g); document.documentElement.style.overflow = 'hidden';
    document.getElementById('bgT').focus({preventScroll:true});
    document.getElementById('bgOut').onclick = async () => { await logout(); location.replace('index.html'); };
    document.getElementById('bgDel').onclick = () => { document.getElementById('bgForm').classList.add('on'); document.getElementById('bgPw').focus(); };
    document.getElementById('bgNo').onclick = () => document.getElementById('bgForm').classList.remove('on');
    document.getElementById('bgGo').onclick = async () => {
      const b = document.getElementById('bgGo'), err = document.getElementById('bgErr'); err.textContent = ''; b.disabled = true;
      try{ await api('/api/account/delete', {body:{password: document.getElementById('bgPw').value}}); setAuth(null, null); location.replace('index.html'); }
      catch(e){ err.textContent = e.message; b.disabled = false; }
    };
  }
  onAuth(u => { if(document.body) banGate(u); else document.addEventListener('DOMContentLoaded', () => banGate(u)); });

  const isPro = () => !!(auth.user && auth.user.pro);
  const isPlus = () => !!(auth.user && auth.user.plus && !auth.user.pro);
  const needsPro = f => !!cfg.billing.enabled && cfg.billing.proFeatures[f] !== false;
  async function refreshUser(){ const j = await api('/api/me'); setAuth(auth.token, j.user); return j.user; }
  return {isPro, isPlus, needsPro, hasAccess: f => !needsPro(f) || isPro() || (isPlus() && cfg.billing.plusFeatures[f] === true), refreshUser, apiBase: API, token: () => auth.token,
          api, setAuth, logout, onAuth, ready, esc, logEv, safeNext, toLogin, configured, onConfig, configReady, cfg: () => cfg, feat: k => cfg.features[k] !== false, defaults,
          user: () => auth.user, hasToken: () => !!auth.token, isLoading: () => loading};
})();
