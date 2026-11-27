/* ============================================================
   Dashboard (dashboard.html) – Betreiber (alles) und Team (ohne Einstellungen)
   Tabs: Übersicht · Nutzer (Plus/Pro schenken) · Chats · Team · Einstellungen
   ============================================================ */
(function(){
  const $ = id => document.getElementById(id);
  const RULES = window.RULES_ALL || window.RULES || [];
  const esc = RH.esc;
  const ic = (n, s) => icon(n, s || 18);
  const T = ts => new Date(ts).toLocaleString('de-DE', {day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit'});
  const D = ts => new Date(ts).toLocaleDateString('de-DE');
  const ruleTitle = id => { const r = RULES.find(x => x.id === id); return r ? r.title : id; };
  const prettyModel = m => String(m).replace(/(^|[-\/])([a-z])/g, (_, p, c) => p + c.toUpperCase());
  const openRule = id => { location.href = 'index.html?from=dashboard#' + encodeURIComponent(id); };
  let isOwner = false, tab = 'ov';

  /* ---------- Bausteine ---------- */
  const acc = (title, iconName, body, open) => '<div class="u-acc' + (open ? ' open' : '') + '"><button type="button" class="u-acc-h" aria-expanded="' + !!open + '">' + ic(iconName) + '<span class="u-grow">' + esc(title) + '</span><span class="u-chev">' + ic('chevron-down') + '</span></button><div class="u-acc-b"><div class="u-acc-in">' + body + '</div></div></div>';
  const sw = (id, on, label, sub) => '<label class="u-sw"><span class="u-sw-tx"><b>' + esc(label) + '</b>' + (sub ? '<small>' + esc(sub) + '</small>' : '') + '</span><input type="checkbox" id="' + id + '"' + (on ? ' checked' : '') + '><span class="u-sw-ui" aria-hidden="true"></span></label>';
  const fld = (id, label, val, ph, type) => '<label class="u-field"><span>' + esc(label) + '</span><input class="u-in" id="' + id + '" type="' + (type || 'text') + '" value="' + esc(val == null ? '' : val) + '" placeholder="' + esc(ph || '') + '"' + (type === 'number' ? ' inputmode="numeric" min="0"' : '') + '></label>';
  const area = (id, label, val, ph, rows) => '<label class="u-field"><span>' + esc(label) + '</span><textarea class="u-in" id="' + id + '" rows="' + (rows || 3) + '" placeholder="' + esc(ph || '') + '">' + esc(val || '') + '</textarea></label>';
  const tier = u => u.tier === 'pro' ? '<span class="u-badge pro">' + ic('crown', 12) + 'Pro</span>' : u.tier === 'plus' ? '<span class="u-badge plus">Plus</span>' : '';
  const bars = (rows, label) => {
    const max = Math.max(1, ...rows.map(r => r.c));
    return rows.length ? rows.map(r => '<div class="u-bar"><i style="width:' + Math.round(r.c / max * 100) + '%"></i><span>' + esc(label(r)) + '</span><span><b>' + r.c + '×</b></span></div>').join('') : '<div class="u-empty">Noch keine Daten.</div>';
  };
  const err = e => '<div class="u-card"><div class="u-msg err">' + esc(e.message || e) + '</div></div>';
  const loading = () => { $('dashBody').innerHTML = '<div class="u-skel" role="status" aria-label="Lädt"><i></i><i></i><i></i></div>'; };

  /* ---------- Tabs ---------- */
  const TABS = [['ov', 'chart', 'Übersicht'], ['users', 'users', 'Nutzer'], ['chats', 'chat', 'Chats'], ['subs', 'file-text', 'Einreichungen'], ['team', 'shield', 'Team', 1], ['set', 'sliders', 'Einstellungen', 1]];
  function placeInd(animate){
    const bar = $('dashTabs'), on = bar.querySelector('[aria-selected="true"]'), ind = bar.querySelector('.u-ind'); if(!on || !ind) return;
    if(!animate) ind.style.transition = 'none';
    ind.style.width = on.offsetWidth + 'px'; ind.style.transform = 'translateX(' + on.offsetLeft + 'px)';
    if(!animate){ void ind.offsetWidth; ind.style.transition = ''; }
    on.scrollIntoView({block:'nearest', inline:'center', behavior:'smooth'});
  }
  function renderTabs(){
    const bar = $('dashTabs');
    if(!bar.querySelector('.u-tab')){
      bar.innerHTML = '<span class="u-ind" aria-hidden="true"></span>' + TABS.filter(t => !t[3] || isOwner).map(t => '<button type="button" class="u-tab" role="tab" data-t="' + t[0] + '" aria-selected="false">' + ic(t[1]) + '<span>' + t[2] + '</span></button>').join('');
      window.addEventListener('resize', () => placeInd(false));
    }
    bar.querySelectorAll('.u-tab').forEach(b => b.setAttribute('aria-selected', b.dataset.t === tab ? 'true' : 'false'));
    placeInd(!!bar.dataset.ready); bar.dataset.ready = '1';
  }
  function go(t){ tab = t; renderTabs(); RH.haptic && RH.haptic(6); ({ov: viewOv, users: viewUsers, chats: viewChats, subs: viewSubs, team: viewTeam, set: viewSet})[t](); }
  $('dashTabs').onclick = e => { const b = e.target.closest('.u-tab'); if(b) go(b.dataset.t); };
  $('dashBody').addEventListener('click', e => {
    const h = e.target.closest('.u-acc-h'); if(!h) return;
    const a = h.parentNode; a.classList.toggle('open'); h.setAttribute('aria-expanded', a.classList.contains('open'));
  });

  /* ---------- Übersicht ---------- */
  async function viewOv(){
    loading();
    try{
      const j = await RH.api('/api/admin/overview');
      $('dashBody').innerHTML = '<div class="u-stats">'
        + [[j.users, 'Nutzer'], [j.pro || 0, 'Plus/Pro aktiv'], [j.chats, 'Chats'], [j.searches, 'Suchen']].map(s => '<div class="u-stat"><b>' + s[0] + '</b><span>' + s[1] + '</span></div>').join('') + '</div>'
        + acc('Häufigste Suchen', 'search', bars(j.topSearches, r => r.value), true)
        + acc('Meistgeöffnete Regeln', 'book', bars(j.topRules, r => ruleTitle(r.value)))
        + acc('Neueste Nutzer', 'user', j.newUsers.map(u => '<div class="u-bar"><span>' + esc(u.username) + '</span><span>' + D(u.created_at) + '</span></div>').join('') || '<div class="u-empty">Noch keine Nutzer.</div>');
      countUp($('dashBody'));
    }catch(e){ $('dashBody').innerHTML = err(e); }
  }
  // Kennzahlen zählen kurz hoch (nicht bei „Bewegung reduzieren“)
  function countUp(root){
    if(matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    root.querySelectorAll('.u-stat b').forEach(el => {
      const to = parseInt(el.textContent, 10); if(!(to > 0)) return;
      const t0 = performance.now(), dur = 700;
      const step = t => { const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3); el.textContent = Math.round(to * e); if(k < 1) requestAnimationFrame(step); else el.textContent = to; };
      el.textContent = '0'; requestAnimationFrame(step);
    });
  }

  /* ---------- Nutzer: suchen, filtern, im Detail verwalten ---------- */
  const UFILTERS = [['all', 'Alle'], ['pro', 'Pro'], ['plus', 'Plus'], ['free', 'Gratis'], ['banned', 'Gesperrt'], ['unverified', 'E-Mail offen'], ['staff', 'Team']];
  const UFEAT = {ai: 'KI-Aufgabenhilfe', favorites: 'Merkliste', recent: 'Zuletzt geöffnet', notes: 'Notizen', practice: 'Meine Kurse'};
  let uOpen = null, uPlan = 'pro', uDays = 30, uQ = '', uF = 'all', uTimer = 0, uMail = false;
  const fact = (k, v) => '<div class="u-fact"><span>' + esc(k) + '</span><b>' + v + '</b></div>';
  const TN = {pro: 'Pro', plus: 'Plus', free: 'Gratis'};
  function userRow(u){
    const open = uOpen === u.username;
    const sub = (u.grant && u.until ? 'Geschenk bis ' + D(u.until) : (u.email || 'Seit ' + D(u.created_at))) + (u.last_login ? ' · zuletzt ' + T(u.last_login) : '');
    let h = '<div class="u-item"><button type="button" class="u-row" data-u="' + esc(u.username) + '" aria-expanded="' + open + '"><span class="u-av ' + u.tier + '">' + esc(u.username.charAt(0).toUpperCase()) + '</span>'
      + '<span class="u-row-tx"><b>' + esc(u.username) + '</b><small>' + esc(sub) + '</small></span>' + (u.banned ? '<span class="u-badge bad">Gesperrt</span>' : '') + (u.email && !u.verified ? '<span class="u-badge warn">E-Mail offen</span>' : '')
      + (u.owner ? '<span class="u-badge ok">Besitzer</span>' : u.staff ? '<span class="u-badge ok">Team</span>' : '') + tier(u) + '</button>';
    if(open) h += '<div class="u-panel" id="uPanel"><div class="u-empty">Lade …</div></div>';
    return h + '</div>';
  }
  function panelHtml(d){
    const f = d.flags, locked = d.owner;
    const tierTx = TN[d.tier] + (d.grant ? ' (Geschenk bis ' + D(d.until) + ')' : d.hasSub ? ' (Abo' + (d.cancelAtEnd ? ', gekündigt zum ' + D(d.until) : '') + ')' : '');
    let h = '<div class="u-facts">'
      + fact('E-Mail', d.email ? esc(d.email) + (d.verified ? ' ✓' : ' (nicht bestätigt)') : 'keine') + fact('Registriert', d.created_at ? D(d.created_at) : '–') + fact('Zuletzt angemeldet', d.last_login ? T(d.last_login) : '–')
      + fact('Tarif', esc(tierTx)) + fact('Aktive Geräte', d.sessions) + fact('Chats', d.chats) + fact('Kurse im Konto', d.kurse) + fact('KI-Chats heute', d.aiToday) + (d.google ? fact('Anmeldung', 'Google') : '') + '</div>';
    if(locked) return h + '<div class="u-sub">Der Besitzer kann hier nicht verwaltet werden.</div>';
    h += '<div class="u-sec">Tarif schenken</div><div class="u-seg2"><button type="button" class="u-btn ghost sm" data-plan="pro" aria-pressed="' + (uPlan === 'pro') + '">' + ic('crown', 16) + 'Pro</button><button type="button" class="u-btn ghost sm" data-plan="plus" aria-pressed="' + (uPlan === 'plus') + '">Plus</button></div>'
      + '<div class="u-chips" style="margin-bottom:12px">' + [7, 30, 90, 365].map(x => '<button type="button" class="u-chip" data-days="' + x + '" aria-pressed="' + (uDays === x) + '">' + (x === 365 ? '1 Jahr' : x + ' Tage') + '</button>').join('') + '</div>'
      + '<div class="u-actions"><button type="button" class="u-btn" data-give="' + esc(d.username) + '">' + ic('gift', 18) + (uPlan === 'pro' ? 'Pro' : 'Plus') + ' schenken</button>' + (d.grant ? '<button type="button" class="u-btn danger" data-take="' + esc(d.username) + '">Geschenk beenden</button>' : '') + '</div>'
      + '<div class="u-sec">Token</div>' + fld('ut_amt', 'Token schenken (mit Minus abziehen)', '', 'z. B. 50', 'number') + '<div class="u-actions"><button type="button" class="u-btn" data-tok="' + esc(d.username) + '">' + ic('gift', 18) + 'Token buchen</button></div>'
      + '<div class="u-sec">Limits und Funktionen</div>' + fld('uf_lim', 'Zusätzliches Tageslimit (KI-Chats pro Tag) nur für diesen Nutzer (leer = keins, 0 = KI gesperrt)', f.aiLimit == null ? '' : f.aiLimit, 'Standard', 'number')
      + Object.keys(UFEAT).map(k => sw('uf_' + k, f.features[k] !== false, UFEAT[k])).join('')
      + '<div class="u-sec">Sperre</div>' + (f.banned ? '<div class="u-msg err" style="display:block">Dieses Konto ist gesperrt' + (f.banReason ? ': ' + esc(f.banReason) : '') + '. Der Nutzer sieht eine Sperrseite und kann sich nur abmelden oder sein Konto löschen.</div>' : '<div class="u-sub">Gesperrte Nutzer werden überall abgemeldet und sehen nach der Anmeldung nur eine Sperrseite mit dem Grund.</div>')
      + fld('uf_reason', 'Grund (sieht der Nutzer)', f.banReason, 'z. B. Missbrauch der KI')
      + sw('uf_notify', d.notifyActive, 'Nutzer per E-Mail informieren', d.notifyActive ? 'bei Sperre und Freischaltung' : 'keine bestätigte E-Mail oder Versand nicht eingerichtet')
      + '<div class="u-actions" style="margin-top:6px">' + (f.banned ? '<button type="button" class="u-btn" data-act="unban">Sperre aufheben</button>' : '<button type="button" class="u-btn danger" data-act="ban">Konto sperren</button>') + '</div>'
      + '<div class="u-sec">Notiz (nur für dich und das Team)</div>' + area('uf_note', '', f.note, 'z. B. Lehrerin, Testkonto …', 2)
      + '<div class="u-actions" style="margin-top:10px"><button type="button" class="u-btn" data-act="save">Speichern</button></div>'
      + '<div class="u-sec">Aktionen</div><div class="u-actions">'
      + '<button type="button" class="u-btn ghost" data-act="mail">' + ic('mail', 18) + 'E-Mail senden</button><button type="button" class="u-btn ghost" data-act="logout">Überall abmelden</button>'
      + (d.canDelete ? '<button type="button" class="u-btn danger" data-act="del">Konto löschen</button>' : '') + '</div>';
    if(uMail) h += '<div style="margin-top:10px">' + fld('um_sub', 'Betreff', '', 'Betreff') + area('um_txt', 'Nachricht', '', 'Hallo-Zeile und Gruß ergänzt das System.', 4) + '<div class="u-actions"><button type="button" class="u-btn" data-act="sendmail">Senden</button></div></div>';
    h += '<div style="margin-top:10px">' + fld('um_addr', 'E-Mail-Adresse setzen und als bestätigt markieren', d.email || '', 'name@beispiel.de', 'email') + '<div class="u-actions"><button type="button" class="u-btn ghost" data-act="setmail">Adresse speichern</button></div></div>'
      + (d.staff ? '' : '<div style="margin-top:10px">' + fld('um_name', 'Benutzernamen ändern', d.username, 'neuer Name') + '<div class="u-actions"><button type="button" class="u-btn ghost" data-act="rename">Namen ändern</button></div></div>')
      + '<div style="margin-top:10px">' + fld('um_pw', 'Neues Passwort setzen (meldet überall ab)', '', 'mindestens 8 Zeichen', 'password') + '<div class="u-actions"><button type="button" class="u-btn ghost" data-act="setpw">Passwort setzen</button></div></div>'
      + '<div class="u-msg" id="uMsg" role="status"></div>';
    return h;
  }
  async function loadDetail(){
    const box = $('uPanel'); if(!box || !uOpen) return;
    try{ const d = await RH.api('/api/admin/user?name=' + encodeURIComponent(uOpen)); const b = $('uPanel'); if(b) b.innerHTML = panelHtml(d); }
    catch(e){ box.innerHTML = '<div class="u-msg err">' + esc(e.message) + '</div>'; }
  }
  async function loadUsers(keepPanel){
    const box = $('uList'); if(!box) return;
    try{
      const j = await RH.api('/api/admin/users?q=' + encodeURIComponent(uQ) + '&f=' + uF);
      box.innerHTML = j.users.length ? j.users.map(userRow).join('') : '<div class="u-empty">Keine Nutzer gefunden.</div>';
      await loadDetail();
    }catch(e){ box.innerHTML = '<div class="u-msg err">' + esc(e.message) + '</div>'; }
  }
  function viewUsers(){
    $('dashBody').innerHTML = '<div class="u-search">' + ic('search') + '<input class="u-in" id="uSearch" type="search" placeholder="Nutzer oder E-Mail suchen" value="' + esc(uQ) + '" autocomplete="off"></div>'
      + '<div class="u-filters" role="group" aria-label="Filter">' + UFILTERS.map(x => '<button type="button" class="u-chip" data-f="' + x[0] + '" aria-pressed="' + (uF === x[0]) + '">' + x[1] + '</button>').join('') + '</div>'
      + '<div class="u-card"><div class="u-list" id="uList"><div class="u-empty">Lade …</div></div></div>';
    $('uSearch').oninput = e => { clearTimeout(uTimer); uTimer = setTimeout(() => { uQ = e.target.value.trim(); loadUsers(); }, 300); };
    document.querySelector('.u-filters').onclick = e => { const b = e.target.closest('[data-f]'); if(!b) return; uF = b.dataset.f; document.querySelectorAll('.u-filters .u-chip').forEach(x => x.setAttribute('aria-pressed', x.dataset.f === uF)); loadUsers(); };
    const msg = (t, ok) => { const m = $('uMsg'); if(m){ m.className = 'u-msg' + (ok === true ? ' ok' : ok === false ? ' err' : ''); m.textContent = t; } };
    $('uList').onclick = async e => {
      const row = e.target.closest('.u-row'), pl = e.target.closest('[data-plan]'), dy = e.target.closest('[data-days]'), gv = e.target.closest('[data-give]'), tk = e.target.closest('[data-take]'), tkn = e.target.closest('[data-tok]'), ac = e.target.closest('[data-act]');
      if(row){ uOpen = uOpen === row.dataset.u ? null : row.dataset.u; uMail = false; return loadUsers(); }
      if(pl){ uPlan = pl.dataset.plan; return loadDetail(); }
      if(dy){ uDays = +dy.dataset.days; return loadDetail(); }
      const name = uOpen, g = id => $(id) ? $(id).value : '', c = id => $(id) && $(id).checked;
      try{
        if(tkn){
          msg('…');
          const j = await RH.api('/api/admin/tokens', {body: {username: name, amount: +g('ut_amt') || 0}});
          msg('Gebucht. Neues Guthaben: ' + j.tokens.total + ' Token.', true);
        }else if(gv || tk){
          msg('…');
          const j = await RH.api('/api/admin/pro', {body: {username: name, plan: uPlan, days: uDays, revoke: !!tk}});
          await loadUsers(); msg(tk ? 'Geschenk beendet.' : (j.plan === 'plus' ? 'Plus' : 'Pro') + ' geschenkt bis ' + D(j.until) + '.', true);
        }else if(ac){
          const act = ac.dataset.act;
          if(act === 'save'){
            msg('Speichert …');
            const lim = g('uf_lim').trim();
            const j = await RH.api('/api/admin/user/update', {body: {username: name, aiLimit: lim === '' ? null : +lim, features: Object.fromEntries(Object.keys(UFEAT).map(k => [k, c('uf_' + k)])), note: g('uf_note')}});
            await loadUsers(); msg('Gespeichert.' + (j.mailed ? ' Der Nutzer wurde per E-Mail informiert.' : ''), true);
          }else if(act === 'ban' || act === 'unban'){
            msg('Speichert …');
            const j = await RH.api('/api/admin/user/update', {body: {username: name, banned: act === 'ban', banReason: g('uf_reason'), notify: c('uf_notify')}});
            await loadUsers(); msg((act === 'ban' ? 'Konto gesperrt.' : 'Sperre aufgehoben.') + (j.mailed ? ' Der Nutzer wurde per E-Mail informiert.' : ''), true);
          }else if(act === 'mail'){ uMail = !uMail; await loadDetail(); }
          else if(act === 'sendmail'){
            msg('Sendet …'); await RH.api('/api/admin/user/mail', {body: {username: name, subject: g('um_sub'), text: g('um_txt')}}); uMail = false; await loadDetail(); msg('E-Mail gesendet.', true);
          }else if(act === 'logout'){
            await RH.api('/api/admin/user/logout', {body: {username: name}}); await loadDetail(); msg('Auf allen Geräten abgemeldet.', true);
          }else if(act === 'setmail'){
            await RH.api('/api/admin/user/email', {body: {username: name, email: g('um_addr')}}); await loadUsers(); msg('E-Mail-Adresse gespeichert und als bestätigt markiert.', true);
          }else if(act === 'rename'){
            const j = await RH.api('/api/admin/user/rename', {body: {username: name, newName: g('um_name')}}); uOpen = j.username; await loadUsers(); msg('Benutzername geändert.', true);
          }else if(act === 'setpw'){
            await RH.api('/api/admin/user/password', {body: {username: name, password: g('um_pw')}}); await loadDetail(); msg('Neues Passwort gesetzt, der Nutzer ist überall abgemeldet.', true);
          }else if(act === 'del'){
            if(!await RH.confirm({title: 'Konto „' + name + '“ löschen?', text: 'Alle Daten (Chats, Kurse, Notizen, Abo) werden endgültig gelöscht. Das lässt sich nicht rückgängig machen.', ok: 'Endgültig löschen', danger: true})) return;
            await RH.api('/api/admin/user/delete', {body: {username: name, confirm: name}}); uOpen = null; await loadUsers();
          }
        }
      }catch(x){ msg(x.message, false); }
    };
    loadUsers();
  }

  /* ---------- Chats ---------- */
  async function viewChats(){
    loading();
    try{
      const j = await RH.api('/api/admin/chats');
      $('dashBody').innerHTML = '<div class="u-card"><div class="u-list">' + (j.chats.map(c => '<button type="button" class="u-row" data-c="' + esc(c.id) + '"><span class="u-av">' + esc((c.username || '?').charAt(0).toUpperCase()) + '</span><span class="u-row-tx"><b>' + esc(c.title || 'Ohne Titel') + '</b><small>' + esc(c.username) + ' · ' + T(c.updated_at) + '</small></span><span class="u-chev">' + ic('chevron-right', 16) + '</span></button>').join('') || '<div class="u-empty">Noch keine Chats.</div>') + '</div></div>';
      $('dashBody').querySelectorAll('[data-c]').forEach(b => b.onclick = () => viewChat(b.dataset.c));
    }catch(e){ $('dashBody').innerHTML = err(e); }
  }
  async function viewChat(id){
    loading();
    try{
      const j = await RH.api('/api/admin/chat?id=' + encodeURIComponent(id));
      let h = '<button type="button" class="u-btn ghost sm" id="chBack" style="margin-bottom:12px">' + ic('arrow-left', 16) + 'Alle Chats</button>'
        + '<div class="u-card"><div class="u-card-h">' + esc(j.title || 'Ohne Titel') + '</div><div class="u-sub">' + esc(j.username) + ' · ' + T(j.updated_at) + '</div></div>';
      if(j.thumb) h += '<img class="ai-thumb" src="' + esc(j.thumb) + '" alt="">';
      j.messages.forEach(m => { h += '<div class="ai-bubble ' + (m.role === 'user' ? 'user' : '') + '"><div class="ai-lbl">' + (m.role === 'user' ? esc(j.username) : 'KI') + '</div><p>' + esc(m.text) + '</p></div>'; });
      (j.rule_ids || []).forEach(rid => { h += '<button type="button" class="u-btn ghost sm block" data-r="' + esc(rid) + '" style="margin-top:8px">' + esc(ruleTitle(rid)) + '</button>'; });
      if(j.model) h += '<div class="u-sub" style="margin-top:12px">Antwort von <b>' + esc(prettyModel(j.model)) + '</b></div>';
      $('dashBody').innerHTML = h;
      $('chBack').onclick = viewChats;
      $('dashBody').querySelectorAll('[data-r]').forEach(b => b.onclick = () => openRule(b.dataset.r));
    }catch(e){ $('dashBody').innerHTML = err(e); }
  }

  /* ---------- Einreichungen (Community-Einträge prüfen) ---------- */
  let subState = 'pending';
  async function viewSubs(){
    loading();
    try{
      const j = await RH.api('/api/admin/submissions?s=' + subState);
      const labels = {pending: 'Offen' + (j.pending ? ' (' + j.pending + ')' : ''), approved: 'Freigegeben', rejected: 'Abgelehnt'};
      const FN = {mathe: 'Mathematik', physik: 'Physik', chemie: 'Chemie', biologie: 'Biologie'};
      let h = '<div class="u-actions" style="margin-bottom:12px">' + Object.keys(labels).map(k => '<button type="button" class="u-btn sm' + (k === subState ? '' : ' ghost') + '" data-ss="' + k + '">' + esc(labels[k]) + '</button>').join('') + '</div>';
      if(!j.items.length) h += '<div class="u-card"><div class="u-sub">Keine Einträge.</div></div>';
      j.items.forEach(s => {
        h += '<div class="u-card"><div class="u-card-h">' + esc(s.title) + '</div>'
          + '<div class="u-sub">' + esc(FN[s.fach] || s.fach) + ' · von ' + esc(s.username || 'gelöschtem Konto') + ' · ' + T(s.created_at) + (s.source ? ' · Quelle: ' + esc(s.source) : '') + '</div>'
          + fld('st_' + s.id, 'Titel', s.title) + fld('sc_' + s.id, 'Thema', s.category) + fld('sn_' + s.id, 'Genannt als (leer = nicht nennen)', s.credit)
          + '<label class="u-field"><span>Inhalt</span><textarea class="u-in" id="sb_' + s.id + '" rows="8">' + esc(s.body) + '</textarea></label>'
          + fld('sm_' + s.id, 'Notiz an die Einreichenden (optional)', s.note)
          + '<div class="u-actions"><button type="button" class="u-btn sm" data-sa="approve" data-id="' + s.id + '">' + ic('check', 16) + (s.status === 'approved' ? 'Änderungen speichern' : 'Freigeben') + '</button>'
          + (s.status !== 'rejected' ? '<button type="button" class="u-btn ghost sm" data-sa="reject" data-id="' + s.id + '">' + ic('x', 16) + 'Ablehnen</button>' : '')
          + '<button type="button" class="u-btn ghost sm" data-sa="delete" data-id="' + s.id + '">' + ic('trash', 16) + 'Löschen</button></div><div class="u-msg" id="sx_' + s.id + '"></div></div>';
      });
      $('dashBody').innerHTML = h;
      $('dashBody').querySelectorAll('[data-ss]').forEach(b => b.onclick = () => { subState = b.dataset.ss; viewSubs(); });
      $('dashBody').querySelectorAll('[data-sa]').forEach(b => b.onclick = async () => {
        const id = b.dataset.id, g = k => $(k + id).value, box = $('sx_' + id);
        if(b.dataset.sa === 'delete' && !confirm('Diesen Eintrag endgültig löschen?')) return;
        box.className = 'u-msg'; box.textContent = '…';
        try{
          await RH.api('/api/admin/submission', {body: {id: +id, action: b.dataset.sa, title: g('st_'), category: g('sc_'), credit: g('sn_'), body: g('sb_'), note: g('sm_')}});
          viewSubs();
        }catch(e){ box.className = 'u-msg err'; box.textContent = e.message || 'Das hat nicht geklappt.'; }
      });
    }catch(e){ $('dashBody').innerHTML = err(e); }
  }

  /* ---------- Team (nur Besitzer) ---------- */
  async function viewTeam(){
    loading();
    try{
      const j = await RH.api('/api/admin/overview'), staff = j.staff || [];
      $('dashBody').innerHTML = '<div class="u-card"><div class="u-card-h">' + ic('shield') + 'Zugriff aufs Dashboard</div>'
        + '<div class="u-sub" style="margin-bottom:12px">Team sieht Übersicht, Nutzer und Chats und kann Plus/Pro schenken. Einstellungen bleiben bei dir.</div>'
        + '<div class="u-list">' + (staff.map(n => '<div class="u-row"><span class="u-av">' + esc(n.charAt(0).toUpperCase()) + '</span><span class="u-row-tx"><b>' + esc(n) + '</b></span><button type="button" class="u-btn danger sm" data-rm="' + esc(n) + '">Entfernen</button></div>').join('') || '<div class="u-empty">Noch niemand im Team.</div>') + '</div></div>'
        + '<div class="u-card"><div class="u-card-h">' + ic('plus') + 'Person hinzufügen</div>' + fld('tmUser', 'Benutzername', '', 'z. B. lena_m')
        + '<button type="button" class="u-btn block" id="tmAdd">Zugriff geben</button><div class="u-msg" id="tmMsg" role="status"></div></div>';
      const act = async (name, remove) => {
        const m = $('tmMsg'); m.className = 'u-msg'; m.textContent = '…';
        try{ await RH.api('/api/admin/staff', {body: {username: name, remove}}); await viewTeam(); }
        catch(x){ const m2 = $('tmMsg'); m2.className = 'u-msg err'; m2.textContent = x.message; }
      };
      $('tmAdd').onclick = () => { const n = $('tmUser').value.trim(); if(n) act(n, false); };
      $('tmUser').addEventListener('keydown', e => { if(e.key === 'Enter') $('tmAdd').click(); });
      $('dashBody').querySelectorAll('[data-rm]').forEach(b => b.onclick = () => act(b.dataset.rm, true));
    }catch(e){ $('dashBody').innerHTML = err(e); }
  }

  /* ---------- Einstellungen (nur Besitzer) ---------- */
  const FEATURE_LABELS = {
    ai: 'KI-Aufgabenhilfe', registration: 'Registrierung', favorites: 'Merkliste', recent: 'Zuletzt geöffnet', notes: 'Notizen',
    practice: 'Meine Kurse', share: 'Regeln als Bild teilen', darkmode: 'Dunkelmodus', stats: 'Statistik'
  };
  const PROV_LABELS = {scher: 'ScherAI', gemini: 'Gemini', groq: 'Groq'};
  const NOTIFY_LABELS = {ban: 'Konto gesperrt', unban: 'Sperre aufgehoben (Freischaltung)', deleted: 'Konto gelöscht'};
  async function viewSet(){
    loading();
    let data;
    try{ data = await RH.api('/api/admin/settings'); }catch(e){ $('dashBody').innerHTML = err(e); return; }
    const S = data.settings, K = data.keys, SYS = data.system || {}, ST = data.stats || {};
    S.billing = Object.assign({enabled:false, proFeatures:{practice:true, notes:true}, freeTokens:60, plusTokens:600, proTokens:3000, costs:{ai:4, aiImage:8, kurs:40, karten:10, tts:8}, plusFeatures:{practice:false, notes:true}, yearly:true, kleinunternehmer:true, promo:false, note:''}, S.billing || {});
    S.billing.plusFeatures = Object.assign({practice:false, notes:true}, S.billing.plusFeatures || {});
    S.auth = Object.assign({requireEmail:true, requireVerified:true, google:true}, S.auth || {});
    S.notify = Object.assign({}, S.notify || {});
    S.limits = Object.assign({courses: 60, notes: 300}, S.limits || {});
    S.contact = Object.assign({email: '', phone: ''}, S.contact || {});
    const news = S.news || RH.defaults.news;
    const social = {discord: S.social.discord == null ? RH.defaults.discord : S.social.discord, instagram: S.social.instagram == null ? RH.defaults.instagram : S.social.instagram};
    let order = S.ai.order.slice();
    const tick = (ok, label) => '<div class="u-sub" style="color:var(' + (ok ? '--u-ok' : '--u-bad') + ')">' + (ok ? '✓ ' : '✗ ') + esc(label) + '</div>';
    const provHtml = () => order.map((p, i) => '<div class="u-row"><span class="u-av">' + (i + 1) + '</span><span class="u-row-tx"><b>' + PROV_LABELS[p] + '</b><small class="u-tech" style="color:var(' + (K[p] ? '--u-ok' : '--u-bad') + ')">' + (K[p] ? 'Key im Worker gesetzt' : 'Key fehlt im Worker') + '</small></span>'
      + '<button type="button" class="u-btn ghost sm" data-i="' + i + '" data-d="-1" aria-label="Nach oben"' + (i === 0 ? ' disabled' : '') + '>↑</button><button type="button" class="u-btn ghost sm" data-i="' + i + '" data-d="1" aria-label="Nach unten"' + (i === order.length - 1 ? ' disabled' : '') + '>↓</button>'
      + '<label class="u-sw" style="border:none;padding:0"><input type="checkbox" id="prov_' + p + '"' + (S.ai.enabled[p] ? ' checked' : '') + '><span class="u-sw-ui" aria-hidden="true"></span></label></div>').join('');

    $('dashBody').innerHTML = '<div class="u-card" style="padding:4px 16px">' + sw('showTech', false, 'Technische Angaben anzeigen', 'Keys, Anbindungen und Status') + '</div>'
      + '<div id="setWrap">'
      + acc('Funktionen', 'sliders', Object.keys(FEATURE_LABELS).map(k => sw('ft_' + k, S.features[k] !== false, FEATURE_LABELS[k])).join(''))
      + acc('Bezahlung', 'crown',
          '<div class="u-tech">' + tick(SYS.stripe && SYS.stripe.secret, 'Stripe-Key') + tick(SYS.stripe && SYS.stripe.webhook, 'Webhook-Secret') + tick(SYS.stripe && SYS.stripe.priceMonth, 'Pro Monat (STRIPE_PRO_PRICE_MONTH)') + tick(SYS.stripe && SYS.stripe.priceYear, 'Pro Jahr (STRIPE_PRO_PRICE_YEAR)') + tick(SYS.stripe && SYS.stripe.plusMonth, 'Plus Monat (STRIPE_PLUS_PRICE_MONTH)') + tick(SYS.stripe && SYS.stripe.plusYear, 'Plus Jahr (STRIPE_PLUS_PRICE_YEAR)') + tick(SYS.stripe && SYS.stripe.siteUrl, 'SITE_URL') + Object.entries(data.priceErrors || {}).map(([k, v]) => tick(false, 'Stripe meldet bei ' + k + ': ' + v)).join('') + '<div style="height:8px"></div></div>'
        + sw('bl_on', S.billing.enabled, 'Bezahlung aktiv', SYS.stripe && SYS.stripe.ready ? 'Stripe ist bereit' : 'Stripe noch nicht vollständig eingerichtet')
        + sw('bl_prac', S.billing.proFeatures.practice, 'Meine Kurse nur mit Pro') + sw('bl_note', S.billing.proFeatures.notes, 'Notizen nur mit Pro')
        + sw('bl_plus_prac', S.billing.plusFeatures.practice, 'Meine Kurse auch mit Plus') + sw('bl_plus_note', S.billing.plusFeatures.notes, 'Notizen auch mit Plus')
        + sw('bl_year', S.billing.yearly, 'Jahrestarif anbieten') + sw('bl_ku', S.billing.kleinunternehmer, 'Kleinunternehmer (§ 19 UStG)') + sw('bl_promo', S.billing.promo, 'Gutscheincodes erlauben')
        + '<div style="height:10px"></div>' + fld('bl_free', 'Gratis: Start-Token (einmalig, wird nicht aufgefüllt)', S.billing.freeTokens, '60', 'number') + fld('bl_plus_tok', 'Plus: Token pro Monat', S.billing.plusTokens, '600', 'number') + fld('bl_pro_tok', 'Pro: Token pro Monat', S.billing.proTokens, '3000', 'number') + '<div style="height:10px"></div>' + fld('bl_c_ai', 'Kosten: KI-Nachricht (Token)', S.billing.costs.ai, '4', 'number') + fld('bl_c_img', 'Kosten: KI-Nachricht mit Foto (Token)', S.billing.costs.aiImage, '8', 'number') + fld('bl_c_kurs', 'Kosten: Kurs erstellen (Token)', S.billing.costs.kurs, '40', 'number') + fld('bl_c_karten', 'Kosten: Karteikarten erstellen (Token)', S.billing.costs.karten, '10', 'number') + fld('bl_c_tts', 'Kosten: Podcast-Stimme (Token)', S.billing.costs.tts, '8', 'number') + '<div style="height:10px"></div>' + sw('adv_on', !S.advent || S.advent.enabled !== false, 'Adventskalender mit Gewinnen aktiv') + sw('sub_on', !S.submit || S.submit.enabled !== false, 'Einträge einreichen aktiv')
        + area('bl_note_t', 'Hinweis auf der Pro-Seite', S.billing.note, '', 2))
      + acc('Anmeldung', 'user',
          '<div class="u-tech">' + tick(SYS.mail && SYS.mail.ready, 'E-Mail-Versand' + (SYS.mail && SYS.mail.provider ? ' (' + SYS.mail.provider + ')' : '')) + tick(SYS.google && SYS.google.ready, 'Google-Login') + '<div style="height:8px"></div></div>'
        + (ST.users != null ? '<div class="u-sub" style="margin-bottom:6px">' + ST.users + ' Konten · ' + ST.verified + ' bestätigt · ' + ST.proActive + ' mit Plus/Pro</div>' : '')
        + sw('au_mail', S.auth.requireEmail, 'E-Mail-Adresse verlangen') + sw('au_ver', S.auth.requireVerified, 'E-Mail per Code bestätigen') + sw('au_g', S.auth.google, 'Anmeldung mit Google'))
      + acc('Mitteilung & Wartung', 'chat',
          sw('an_on', S.announcement.enabled, 'Mitteilung anzeigen')
        + '<label class="u-field" style="margin-top:8px"><span>Art</span><select class="u-in" id="an_type"><option value="info">Info</option><option value="warn">Warnung</option><option value="success">Erfolg</option></select></label>'
        + area('an_text', 'Text', S.announcement.text, 'z. B. Morgen 18–19 Uhr Wartung.', 2) + fld('an_link', 'Link (optional)', S.announcement.link, 'https://…') + fld('an_ltxt', 'Link-Text', S.announcement.linkText, 'Mehr erfahren')
        + '<div style="height:6px"></div>' + sw('mt_on', S.maintenance.enabled, 'Wartungsmodus', 'Sperrt die KI für alle außer dir') + area('mt_msg', 'Meldung', S.maintenance.message, '', 2))
      + acc('Popup „Neu“', 'sparkles',
          sw('nw_on', news.enabled !== false, 'Popup anzeigen') + '<div style="height:8px"></div>' + fld('nw_date', 'Datum', news.date, '21.10.2026') + fld('nw_title', 'Überschrift', news.title, 'Neu im Regelheft')
        + area('nw_items', 'Punkte (eine Zeile pro Punkt)', (news.items || []).join('\n'), '', 6))
      + acc('KI', 'sparkles', '<div id="provList">' + provHtml() + '</div><div style="height:10px"></div>' + fld('ai_rate', 'Anfragen pro Nutzer und Zeitfenster', S.ai.rateLimit, '20', 'number') + area('ai_extra', 'Zusätzliche Anweisung an die KI', S.ai.extra, 'z. B. Antworte besonders kurz.', 3))
      + acc('Kontakt (Impressum und Datenschutz)', 'mail',
          '<div class="u-sub" style="margin-bottom:6px">Diese Angaben erscheinen im Impressum, in der Datenschutzerklärung, AGB, Widerruf und im Footer. Leer lassen = Standard aus config.js.</div>'
        + fld('ct_email', 'E-Mail-Adresse', S.contact.email, RH.defaults.email || 'name@beispiel.de', 'email') + fld('ct_phone', 'Telefonnummer', S.contact.phone, RH.defaults.phone || '+49 …', 'tel'))
      + acc('Limits pro Konto', 'sliders',
          fld('lm_courses', 'Höchstzahl gespeicherter Kurse', S.limits.courses, '60', 'number') + fld('lm_notes', 'Höchstzahl Notizen', S.limits.notes, '300', 'number'))
      + acc('E-Mail-Benachrichtigungen', 'mail',
          '<div class="u-sub" style="margin-bottom:6px">' + (SYS.mail && SYS.mail.ready ? 'Automatische Mails gibt es nur bei diesen drei Ereignissen und nur an bestätigte Adressen.' : 'Der E-Mail-Versand ist noch nicht eingerichtet, es werden keine Mails verschickt.') + '</div>'
        + Object.keys(NOTIFY_LABELS).map(k => sw('nt_' + k, S.notify[k] !== false, NOTIFY_LABELS[k])).join(''))
      + acc('Rundmail', 'mail',
          '<div class="u-sub" style="margin-bottom:6px">Schickt eine Nachricht an alle Nutzer mit bestätigter E-Mail-Adresse (gesperrte Konten bekommen nichts).</div>'
        + '<label class="u-field"><span>Empfänger</span><select class="u-in" id="bc_aud"><option value="all">Alle</option><option value="pro">Nur Pro</option><option value="plus">Nur Plus</option><option value="free">Nur Gratis-Nutzer</option></select></label>'
        + fld('bc_sub', 'Betreff', '', 'z. B. Neu im Regelheft') + area('bc_txt', 'Nachricht', '', 'Die Anrede „Hallo Name“ und der Gruß werden automatisch ergänzt.', 5)
        + '<div class="u-actions"><button type="button" class="u-btn ghost" id="bc_count">Empfänger zählen</button><button type="button" class="u-btn" id="bc_send">' + ic('mail', 18) + 'Senden</button></div><div class="u-msg" id="bc_msg" role="status"></div>')
      + acc('Footer-Links', 'link', fld('so_dc', 'Discord', social.discord, 'https://discord.gg/…') + fld('so_ig', 'Instagram', social.instagram, 'https://instagram.com/…'))
      + '</div><div class="u-save"><span class="u-msg" id="setMsg" role="status"></span><button type="button" class="u-btn" id="setSave">Speichern</button></div>'
      + '<style>#setWrap .u-tech{display:none} #setWrap.show-tech .u-tech{display:block}</style>';

    // Technische Angaben (Keys, Anbindungen) nur auf Wunsch
    const wrap = $('setWrap');
    const techOff = () => wrap.classList.toggle('show-tech', $('showTech').checked);
    $('showTech').onchange = techOff;
    $('an_type').value = S.announcement.type;
    const keep = () => { order.forEach(p => { const el = $('prov_' + p); if(el) S.ai.enabled[p] = el.checked; }); };
    $('provList').onclick = e => {
      const b = e.target.closest('[data-d]'); if(!b) return;
      keep(); const i = +b.dataset.i, j = i + +b.dataset.d; [order[i], order[j]] = [order[j], order[i]];
      $('provList').innerHTML = provHtml();
      order.forEach(p => { $('prov_' + p).checked = !!S.ai.enabled[p]; });
    };
    // Rundmail in Paketen senden
    const bcMsg = (t, ok) => { const m = $('bc_msg'); m.className = 'u-msg' + (ok === true ? ' ok' : ok === false ? ' err' : ''); m.textContent = t; };
    $('bc_count').onclick = async () => { try{ const j = await RH.api('/api/admin/mail/broadcast', {body: {audience: $('bc_aud').value, count: true}}); bcMsg(j.total + ' Empfänger.', true); }catch(e){ bcMsg(e.message, false); } };
    $('bc_send').onclick = async () => {
      const aud = $('bc_aud').value, subject = $('bc_sub').value.trim(), text = $('bc_txt').value.trim();
      if(!subject || !text){ bcMsg('Bitte Betreff und Nachricht eingeben.', false); return; }
      try{
        const cnt = await RH.api('/api/admin/mail/broadcast', {body: {audience: aud, count: true}});
        if(!cnt.total){ bcMsg('Keine Empfänger mit bestätigter E-Mail.', false); return; }
        if(!await RH.confirm({title: 'Rundmail senden?', text: cnt.total + ' Empfänger. Das lässt sich nicht zurücknehmen.', ok: 'Senden'})) return;
        $('bc_send').disabled = true; let offset = 0, sent = 0, failed = 0;
        while(offset !== null){
          const j = await RH.api('/api/admin/mail/broadcast', {body: {audience: aud, subject, text, offset}});
          sent += j.sent; failed += j.failed; offset = j.next; bcMsg('Gesendet: ' + sent + ' von ' + j.total + (failed ? ' (' + failed + ' fehlgeschlagen)' : '') + ' …');
        }
        bcMsg('Fertig: ' + sent + ' gesendet' + (failed ? ', ' + failed + ' fehlgeschlagen' : '') + '.', !failed);
      }catch(e){ bcMsg(e.message, false); }
      $('bc_send').disabled = false;
    };
    $('setSave').onclick = async () => {
      keep();
      const g = id => $(id).value, c = id => $(id).checked;
      const payload = {
        maintenance: {enabled: c('mt_on'), message: g('mt_msg')},
        announcement: {enabled: c('an_on'), type: g('an_type'), text: g('an_text'), link: g('an_link'), linkText: g('an_ltxt')},
        news: {enabled: c('nw_on'), date: g('nw_date'), title: g('nw_title'), items: g('nw_items').split('\n').map(x => x.trim()).filter(Boolean)},
        features: Object.fromEntries(Object.keys(FEATURE_LABELS).map(k => [k, c('ft_' + k)])),
        ai: {order, enabled: Object.fromEntries(order.map(p => [p, $('prov_' + p).checked])), rateLimit: +g('ai_rate') || 20, extra: g('ai_extra')},
        social: {discord: g('so_dc').trim(), instagram: g('so_ig').trim()},
        billing: {enabled: c('bl_on'), proFeatures: {practice: c('bl_prac'), notes: c('bl_note')}, freeTokens: +g('bl_free') || 0, plusTokens: +g('bl_plus_tok') || 0, proTokens: +g('bl_pro_tok') || 0, costs: {ai: +g('bl_c_ai') || 0, aiImage: +g('bl_c_img') || 0, kurs: +g('bl_c_kurs') || 0, karten: +g('bl_c_karten') || 0, tts: +g('bl_c_tts') || 0}, plusFeatures: {practice: c('bl_plus_prac'), notes: c('bl_plus_note')}, yearly: c('bl_year'), kleinunternehmer: c('bl_ku'), promo: c('bl_promo'), note: g('bl_note_t')},
        auth: {requireEmail: c('au_mail'), requireVerified: c('au_ver'), google: c('au_g')}, advent: {enabled: c('adv_on')}, submit: {enabled: c('sub_on')},
        contact: {email: $('ct_email').value.trim(), phone: $('ct_phone').value.trim()},
        limits: {courses: +$('lm_courses').value || 60, notes: +$('lm_notes').value || 300},
        notify: Object.fromEntries(Object.keys(NOTIFY_LABELS).map(k => [k, c('nt_' + k)]))
      };
      const m = $('setMsg'); m.className = 'u-msg'; m.textContent = 'Speichert …'; $('setSave').disabled = true;
      try{ await RH.api('/api/admin/settings', {body: {settings: payload}}); m.className = 'u-msg ok'; m.textContent = 'Gespeichert. Gilt in ca. 20 Sekunden.'; }
      catch(e){ m.className = 'u-msg err'; m.textContent = e.message; }
      $('setSave').disabled = false;
    };
  }

  RH.ready.then(() => {
    const u = RH.user();
    if(!u){ RH.toLogin('dashboard.html'); return; }
    $('dashLoading').classList.add('u-hidden');
    if(!u.admin){ $('dashDenied').classList.remove('u-hidden'); return; }
    isOwner = !!u.owner;
    const r = $('dashRole'); r.textContent = isOwner ? 'Besitzer' : 'Team'; r.className = 'u-badge ok';
    $('dashApp').classList.remove('u-hidden');
    go('ov');
  });
})();
