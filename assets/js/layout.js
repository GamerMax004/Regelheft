/* ============================================================
   Gemeinsames Layout: Konto-Knopf in der Kopfzeile + Footer.
   Der Footer-INHALT steht in footer.js, sein Aussehen in footer.css.
   ============================================================ */
(function(){
  const esc = RH.esc;
  const page = (location.pathname.split('/').pop() || 'index.html');

  /* ---------- Darstellung: Automatisch (wie das Gerät) / Hell / Dunkel ----------
     Ohne eigene Wahl folgt die Seite dem Gerät. Wer umschaltet, kann jederzeit zu „Automatisch“ zurück. */
  const root = document.documentElement;
  const sysDark = () => !!(window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches);
  const savedMode = () => { let v = null; try{ v = localStorage.getItem('regelheft-theme'); }catch(e){} return (v === 'dark' || v === 'light') ? v : 'auto'; };
  const themeNow = () => root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  const MODES = {auto:{icon:'monitor', name:'Automatisch (wie das Gerät)'}, light:{icon:'sun', name:'Hell'}, dark:{icon:'moon', name:'Dunkel'}};
  const nextMode = m => m === 'auto' ? 'light' : m === 'light' ? 'dark' : 'auto';
  function paintThemeBtn(){
    const b = document.getElementById('themeBtn'); if(!b) return;
    const m = savedMode();
    b.innerHTML = icon(MODES[m].icon, 19);
    b.setAttribute('aria-label', 'Darstellung: ' + MODES[m].name + '. Antippen für ' + MODES[nextMode(m)].name);
    b.title = 'Darstellung: ' + MODES[m].name;
  }
  function applyTheme(t, save){
    root.setAttribute('data-theme', t);
    const m = document.querySelector('meta[name="theme-color"]');
    if(m) m.setAttribute('content', t === 'dark' ? '#0F1218' : '#ffffff');
    if(save){ try{ localStorage.setItem('regelheft-theme', t); }catch(e){} }
    paintThemeBtn();
  }
  function setMode(mode){
    try{ mode === 'auto' ? localStorage.removeItem('regelheft-theme') : localStorage.setItem('regelheft-theme', mode); }catch(e){}
    applyTheme(mode === 'auto' ? (sysDark() ? 'dark' : 'light') : mode, false);
  }
  /* ---------- Heft-Look an/aus (Karopapier) ---------- */
  const heftNow = () => root.getAttribute('data-heft') === 'off' ? 'off' : 'on';
  function applyHeft(h, save){
    root.setAttribute('data-heft', h);
    if(save){ try{ localStorage.setItem('regelheft-heft', h); }catch(e){} }
    const b = document.getElementById('heftBtn');
    if(b){
      b.innerHTML = icon('book', 19);
      b.setAttribute('aria-pressed', h === 'on' ? 'true' : 'false');
      b.setAttribute('aria-label', 'Heft-Look (Karopapier)');
      b.title = h === 'on' ? 'Heft-Look ist an' : 'Heft-Look ist aus';
    }
  }
  /* ---------- Konto-Knopf ---------- */
  const host = document.querySelector('[data-account]');
  if(host){
    const wrap = document.createElement('div'); wrap.className = 'top-actions';
    const tb = document.createElement('button'); tb.type = 'button'; tb.className = 'theme-btn'; tb.id = 'themeBtn';
    tb.onclick = () => { const m = nextMode(savedMode()); setMode(m); if(RH.toast) RH.toast('Darstellung: ' + MODES[m].name); };
    const hb = document.createElement('button'); hb.type = 'button'; hb.className = 'heft-btn'; hb.id = 'heftBtn';
    hb.onclick = () => applyHeft(heftNow() === 'on' ? 'off' : 'on', true);
    host.parentNode.insertBefore(wrap, host); wrap.appendChild(hb); wrap.appendChild(tb); wrap.appendChild(host);
    applyHeft(heftNow(), false);
    applyTheme(themeNow(), false);
    // Ohne eigene Auswahl dem Gerät folgen (z. B. wenn abends auf Dunkel umgestellt wird)
    if(window.matchMedia) matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      if(savedMode() === 'auto') applyTheme(e.matches ? 'dark' : 'light', false);
    });
  }
  function renderAccount(user, loading){
    if(!host) return;
    host.className = 'acct';
    if(user){
      const ini = esc((user.username || '?').trim().charAt(0).toUpperCase());
      const bill = RH.cfg().billing.enabled;
      const tier = bill && !user.admin ? (user.pro ? 'pro' : user.plus ? 'plus' : 'free') : 'free';
      const planBadge = tier === 'pro' ? '<span class="u-badge pro">' + icon('crown', 12, true) + 'Pro</span>' : tier === 'plus' ? '<span class="u-badge plus">Plus</span>' : (user.owner ? '<span class="u-badge ok">Besitzer</span>' : user.admin ? '<span class="u-badge ok">Team</span>' : '');
      host.innerHTML = '<button type="button" class="acct-chip ' + tier + '" id="acctBtn" aria-haspopup="true" aria-expanded="false" aria-label="Konto-Menü"><span class="u-av">' + ini + '</span>'
        + (tier === 'pro' ? '<span class="acct-chip-plan">' + icon('crown', 13, true) + 'Pro</span>' : tier === 'plus' ? '<span class="acct-chip-plan">Plus</span>' : '') + '</button>'
        + '<div class="acct-menu" id="acctMenu" role="menu"><div class="am-head"><span class="u-av">' + ini + '</span><div class="am-head-tx"><b>' + esc(user.username) + '</b>' + planBadge + '</div></div>'
        + (user.admin ? '<a href="dashboard.html" role="menuitem">' + icon('dashboard', 18) + 'Dashboard</a>' : '')
        + '<a href="konto.html" role="menuitem">' + icon('user', 18) + 'Mein Konto</a>'
        + (bill && !user.admin && !user.pro ? '<a href="pro.html" role="menuitem" class="am-pro">' + icon('crown', 18, true) + (user.plus ? 'Auf Pro wechseln' : (RH.cfg().billing.plusAvailable ? 'Plus oder Pro holen' : 'Pro holen')) + '</a>' : '')
        + '<button type="button" class="am-it am-out" id="acctLogout" role="menuitem">' + icon('logout', 18) + 'Abmelden</button></div>';
      const btn = host.querySelector('#acctBtn'), menu = host.querySelector('#acctMenu');
      const items = () => Array.from(menu.querySelectorAll('[role="menuitem"]'));
      const closeMenu = back => { menu.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); if(back) btn.focus(); };
      btn.onclick = e => { e.stopPropagation(); const o = menu.classList.toggle('open'); btn.setAttribute('aria-expanded', o); if(o && e.detail === 0 && items()[0]) items()[0].focus(); };
      host.onkeydown = e => {
        if(!menu.classList.contains('open')) return;
        const list = items(), i = list.indexOf(document.activeElement);
        if(e.key === 'Escape'){ e.preventDefault(); closeMenu(true); }
        else if(e.key === 'ArrowDown'){ e.preventDefault(); list[(i + 1) % list.length].focus(); }
        else if(e.key === 'ArrowUp'){ e.preventDefault(); list[(i - 1 + list.length) % list.length].focus(); }
        else if(e.key === 'Tab' && !menu.contains(e.target)) closeMenu(false);
      };
      host.querySelector('#acctLogout').onclick = async () => {
        await RH.logout();
        if(page !== 'index.html' && page !== '') location.href = 'index.html';
      };
    }else if(loading){
      host.innerHTML = '<a class="acct-chip free" href="konto.html" aria-label="Konto"><span class="u-av">' + icon('user', 18) + '</span></a>';
    }else{
      const next = (page === 'index.html' || page === 'anmeldung.html') ? '' : '?next=' + encodeURIComponent(page);
      host.innerHTML = '<a class="acct-link" href="anmeldung.html' + next + '">Anmelden</a>';
    }
  }
  document.addEventListener('click', e => {
    const m = document.getElementById('acctMenu');
    if(m && !m.contains(e.target)){ m.classList.remove('open'); const b = document.getElementById('acctBtn'); if(b) b.setAttribute('aria-expanded', 'false'); }
  });

  /* ---------- Footer ---------- */
  const ICONS = {
    instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.3" cy="6.7" r="1" fill="currentColor" stroke="none"/></svg>',
    discord: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>',
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m3.5 7.5 8.5 6 8.5-6"/></svg>'
  };
  const FLAG = '<svg class="sf-flag" viewBox="0 0 24 24" aria-hidden="true"><defs><clipPath id="sfFlagClip"><rect width="24" height="24" rx="6"/></clipPath></defs><g clip-path="url(#sfFlagClip)"><rect width="24" height="8" fill="#111"/><rect y="8" width="24" height="8" fill="#DD0000"/><rect y="16" width="24" height="8" fill="#FFCE00"/></g></svg>';
  const fill = s => String(s || '').replace(/\{(discord|instagram|email)\}/g, (m, k) => k === 'email' ? (LEGAL.email || '') : (SOCIAL[k] || ''));
  const usable = h => h && !/^mailto:$/.test(h);
  const ext = h => /^https?:\/\//.test(h);

  const UP = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m18 15-6-6-6 6"/></svg>';
  function buildFooter(){
    const el = document.getElementById('siteFooter');
    if(!el) return;
    const social = FOOTER.social.map(s => ({...s, href: fill(s.href)})).filter(s => usable(s.href) && ICONS[s.icon]);
    const f = RH.cfg().features;
    const links = FOOTER.links.map(l => ({...l, href: fill(l.href), label: fill(l.label)})).filter(l => usable(l.href) && l.label
      && !(l.href === 'ki.html' && f.ai === false) && !(l.href === 'ueben.html' && f.practice === false)
      && !(l.billing && !RH.cfg().billing.enabled));
    const link = l => {
      const x = ext(l.href) ? ' target="_blank" rel="noopener noreferrer"' : '';
      const a = l.loggedIn ? ' data-in-href="' + esc(l.loggedIn.href) + '" data-in-label="' + esc(l.loggedIn.label) + '" data-out-href="' + esc(l.href) + '" data-out-label="' + esc(l.label) + '"' : '';
      return '<li><a href="' + esc(l.href) + '"' + x + a + '>' + esc(l.label) + '</a></li>';
    };
    el.className = 'sf';
    el.innerHTML = '<div class="sf-inner">'
      + '<div class="sf-top"><a class="sf-brand-name" href="index.html">' + esc(FOOTER.brand[0]) + '<span>' + esc(FOOTER.brand[1]) + '</span></a>'
      + '<div class="sf-tools">'
      + (social.length ? '<div class="sf-social">' + social.map(s => '<a href="' + esc(s.href) + '"' + (ext(s.href) ? ' target="_blank" rel="noopener noreferrer"' : '') + ' aria-label="' + esc(s.label) + '" title="' + esc(s.label) + '">' + ICONS[s.icon] + '</a>').join('') + '</div>' : '')
      + '</div></div>'
      + (links.length ? '<ul class="sf-links">' + links.map(link).join('') + '</ul>' : '')
      + '<div class="sf-bottom"><span>' + esc(FOOTER.copyright) + '</span>'
      + (FOOTER.madeIn ? '<span class="sf-made">' + FLAG + esc(FOOTER.madeIn) + '</span>' : '')
      + (FOOTER.backToTop ? '<button class="sf-top-btn" type="button" aria-label="Nach oben" title="Nach oben"><span>Nach oben</span>' + UP + '</button>' : '')
      + '</div></div>';
    const up = el.querySelector('.sf-top-btn');
    if(up) up.onclick = () => window.scrollTo({top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'});
  }
  function footerAuth(user, loading){
    document.querySelectorAll('#siteFooter [data-in-href]').forEach(a => {
      const inn = !!user || (loading && RH.hasToken());
      a.href = inn ? a.dataset.inHref : a.dataset.outHref;
      a.textContent = inn ? a.dataset.inLabel : a.dataset.outLabel;
    });
  }

  /* ---------- E-Mail-Abfrage / Bestätigung (blockiert, bis die Adresse stimmt) ---------- */
  const EXEMPT = ['impressum.html', 'datenschutz.html', 'agb.html', 'widerruf.html', 'anmeldung.html'];
  let dlgEl = null, dlgStep = 'email', dlgOpts = {};
  function closeDlg(){ if(dlgEl){ dlgEl.remove(); dlgEl = null; document.body.style.overflow = ''; } }
  function openEmailDialog(opts){
    opts = opts || {}; dlgOpts = opts; if(dlgEl) return;
    const u = RH.user(); if(!u) return;
    const c = RH.cfg();
    dlgStep = 'email';
    dlgEl = document.createElement('div'); dlgEl.className = 'dlg-back'; dlgEl.id = 'emailDlg';
    dlgEl.innerHTML = '<div class="dlg" role="dialog" aria-modal="true" aria-labelledby="emTitle"><h3 id="emTitle"></h3><p class="dlg-lead" id="emLead"></p>'
      + '<input class="auth-in" id="emInput" type="email" autocomplete="email" inputmode="email" maxlength="120" placeholder="deine@email.de">'
      + '<input class="auth-in is-hidden" id="emCode" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="6-stelliger Code">'
      + '<div class="auth-err" id="emErr" role="alert"></div>'
      + '<button class="ai-btn" id="emGo" type="button">Weiter</button>'
      + '<div class="dlg-links"><button class="dlg-link is-hidden" id="emResend" type="button">Code erneut senden</button><button class="dlg-link is-hidden" id="emBack" type="button">Andere E-Mail</button>'
      + '<button class="dlg-link" id="emOut" type="button">' + (opts.dismissible ? 'Abbrechen' : 'Abmelden') + '</button></div></div>';
    document.body.appendChild(dlgEl); document.body.style.overflow = 'hidden';
    dlgEl.addEventListener('keydown', e => { if(e.key === 'Escape' && opts.dismissible){ e.stopPropagation(); closeDlg(); } });
    const $ = id => dlgEl.querySelector('#' + id);
    const render = () => {
      const code = dlgStep === 'code';
      $('emTitle').textContent = code ? 'Code eingeben' : (c.auth.verifyActive ? 'E-Mail-Adresse bestätigen' : 'E-Mail-Adresse angeben');
      $('emLead').textContent = code ? 'Wir haben dir einen 6-stelligen Code an ' + $('emInput').value.trim() + ' geschickt. Er ist 15 Minuten gültig.'
        : (c.auth.verifyActive ? 'Bitte gib deine E-Mail-Adresse an und bestätige sie mit einem Code. Sie wird für Kontosicherheit und Rechnungen gebraucht.' : 'Bitte gib deine E-Mail-Adresse an. Sie wird für Kontosicherheit und Rechnungen gebraucht.');
      $('emInput').classList.toggle('is-hidden', code); $('emCode').classList.toggle('is-hidden', !code);
      $('emResend').classList.toggle('is-hidden', !code); $('emBack').classList.toggle('is-hidden', !code);
      $('emGo').textContent = code ? 'Bestätigen' : (c.auth.verifyActive ? 'Code senden' : 'Speichern');
      $('emErr').textContent = '';
      setTimeout(() => (code ? $('emCode') : $('emInput')).focus(), 30);
    };
    $('emInput').value = u.email || '';
    const send = async () => {
      const r = await RH.api('/api/email/start', {body:{email: $('emInput').value.trim()}});
      if(r.noMail || r.already){ await RH.refreshUser(); closeDlg(); return false; }
      return true;
    };
    $('emGo').onclick = async () => {
      const b = $('emGo'); b.disabled = true; $('emErr').textContent = '';
      try{
        if(dlgStep === 'email'){ if(await send()){ dlgStep = 'code'; render(); } }
        else { await RH.api('/api/email/verify', {body:{code: $('emCode').value.trim()}}); await RH.refreshUser(); closeDlg(); }
      }catch(e){ $('emErr').textContent = e.message; }
      b.disabled = false;
    };
    $('emResend').onclick = async () => { try{ await RH.api('/api/email/start', {body:{email: $('emInput').value.trim()}}); $('emErr').textContent = 'Neuer Code gesendet.'; }catch(e){ $('emErr').textContent = e.message; } };
    $('emBack').onclick = () => { dlgStep = 'email'; render(); };
    $('emOut').onclick = async () => { if(opts.dismissible){ closeDlg(); return; } await RH.logout(); closeDlg(); if(page !== 'index.html') location.href = 'index.html'; };
    [$('emInput'), $('emCode')].forEach(i => i.addEventListener('keydown', e => { if(e.key === 'Enter') $('emGo').click(); }));
    render();
  }
  RH.openEmailDialog = openEmailDialog;

  /* ---------- Kurze Meldung (Hinweis am unteren Rand) ---------- */
  let toastT;
  RH.toast = function(msg){
    let t = document.getElementById('toast');
    if(!t){ t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; t.setAttribute('role', 'status'); t.setAttribute('aria-live', 'polite'); document.body.appendChild(t); }
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2600);
  };

  /* ---------- Rückfrage im Seitenstil (statt confirm des Browsers) ----------
     Nur für Unwiderrufliches. „Abbrechen“ ist vorausgewählt, Esc und Tippen daneben brechen ab.
     Benutzung: if(await RH.confirm({title, text, ok:'Löschen', danger:true})) { … } */
  RH.confirm = function(o){
    o = o || {};
    return new Promise(res => {
      const prev = document.activeElement, prevOv = document.body.style.overflow;
      const back = document.createElement('div'); back.className = 'dlg-back';
      back.innerHTML = '<div class="dlg" role="alertdialog" aria-modal="true" aria-labelledby="cfTitle" aria-describedby="cfText"><h3 id="cfTitle"></h3><p class="dlg-lead" id="cfText"></p>'
        + '<div class="dlg-actions"><button type="button" class="ai-btn ghost" data-no></button><button type="button" class="ai-btn' + (o.danger ? ' ai-del' : '') + '" data-yes></button></div></div>';
      back.querySelector('#cfTitle').textContent = o.title || 'Sicher?';
      back.querySelector('#cfText').textContent = o.text || '';
      const no = back.querySelector('[data-no]'), yes = back.querySelector('[data-yes]');
      no.textContent = o.cancel || 'Abbrechen'; yes.textContent = o.ok || 'OK';
      const done = v => { document.removeEventListener('keydown', key, true); back.remove(); document.body.style.overflow = prevOv; if(prev && prev.focus) prev.focus(); res(v); };
      const key = e => {
        if(e.key === 'Escape'){ e.preventDefault(); e.stopPropagation(); done(false); }
        else if(e.key === 'Tab'){ e.preventDefault(); (document.activeElement === no ? yes : no).focus(); }
      };
      no.onclick = () => done(false); yes.onclick = () => done(true);
      back.addEventListener('click', e => { if(e.target === back) done(false); });
      document.addEventListener('keydown', key, true);
      document.body.appendChild(back); document.body.style.overflow = 'hidden';
      no.focus();
    });
  };
  function maybePrompt(){
    const u = RH.user(), c = RH.cfg();
    if(!u || RH.isLoading() || EXEMPT.includes(page) || dlgEl) return;
    const need = c.auth.requireEmail && (!u.email || (c.auth.verifyActive && !u.emailVerified));
    if(need) openEmailDialog({});
  }

  /* ---------- Mitteilung / Wartungshinweis (aus dem Dashboard) ---------- */
  let noticeDismissed = false;
  function renderNotice(cfg){
    const old = document.getElementById('siteNotice'); if(old) old.remove();
    const items = [];
    if(cfg.maintenance.enabled) items.push({type:'warn', text:cfg.maintenance.message || 'Wartungsarbeiten', link:'', linkText:'', key:'m'});
    if(cfg.announcement.enabled && cfg.announcement.text) items.push({type:cfg.announcement.type, text:cfg.announcement.text, link:cfg.announcement.link, linkText:cfg.announcement.linkText, key:'a'});
    if(!items.length || noticeDismissed) return;
    const el = document.createElement('div'); el.id = 'siteNotice'; el.className = 'notices'; el.setAttribute('role', 'status');
    el.innerHTML = items.map(n => '<div class="notice notice--' + esc(n.type) + '"><span class="notice-text">' + esc(n.text)
      + (n.link ? ' <a href="' + esc(n.link) + '"' + (/^https?:/.test(n.link) ? ' target="_blank" rel="noopener noreferrer"' : '') + '>' + esc(n.linkText || 'Mehr') + '</a>' : '') + '</span>'
      + '<button type="button" class="notice-x" aria-label="Schließen" data-k="' + n.key + '">' + icon('x', 16) + '</button></div>').join('');
    el.querySelectorAll('.notice-x').forEach(b => b.onclick = () => { noticeDismissed = true; el.remove(); });
    const hdr = document.querySelector('header.top');
    if(hdr) hdr.insertAdjacentElement('afterend', el); else document.body.prepend(el);
  }

  buildFooter();
  RH.onAuth((u, l) => { renderAccount(u, l); footerAuth(u, l); setTimeout(maybePrompt, 0); });
  RH.onConfig(cfg => {
    renderNotice(cfg);
    renderAccount(RH.user(), RH.isLoading());
    maybePrompt();
    // Dunkelmodus abgeschaltet: Umschalter ausblenden, hell erzwingen
    const tb = document.getElementById('themeBtn');
    if(tb) tb.style.display = cfg.features.darkmode === false ? 'none' : '';
    if(cfg.features.darkmode === false) applyTheme('light', false);
    buildFooter(); footerAuth(RH.user(), RH.isLoading());
  });
})();
