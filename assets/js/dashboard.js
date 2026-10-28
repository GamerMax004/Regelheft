/* ============================================================
   Dashboard (Seite dashboard.html) – nur für den Betreiber (Admin)
   ============================================================ */
(function(){
  const $ = id => document.getElementById(id);
  const RULES = window.RULES;
  const esc = RH.esc, api = RH.api;
  const prettyModel = m => String(m).replace(/(^|[-\/])([a-z])/g, (_, p, c) => p + c.toUpperCase());
  const openRule = id => { location.href = 'index.html?from=dashboard#' + encodeURIComponent(id); };
  // ---------- Dashboard (nur Admin) ----------
  const T = ts => new Date(ts).toLocaleString('de-DE', {day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit'});
  const ruleTitle = id => { const r = RULES.find(x => x.id === id); return r ? r.title : id; };
  const bars = (rows, label) => {
    const max = Math.max(1, ...rows.map(r => r.c));
    return rows.length ? rows.map(r => '<div class="dash-row"><i style="width:' + Math.round(r.c / max * 100) + '%"></i><span>' + esc(label(r)) + '</span><span><b>' + r.c + '×</b></span></div>').join('') : '<p class="ai-sub">Noch keine Daten.</p>';
  };
  async function dashLoad(tab){
    const box = $('dashBody');
    $('dashTabOv').classList.toggle('ghost', tab !== 'ov'); $('dashTabChats').classList.toggle('ghost', tab !== 'chats'); $('dashTabSet').classList.toggle('ghost', tab !== 'set');
    if(tab === 'set') return dashSettings();
    box.innerHTML = '<div class="ai-bubble muted">Lade …</div>';
    try{
      if(tab === 'chats'){
        const j = await RH.api('/api/admin/chats');
        box.innerHTML = j.chats.length ? '' : '<p class="ai-sub">Noch keine Chats.</p>';
        j.chats.forEach(c => {
          const b = document.createElement('button'); b.className = 'ai-rule';
          b.innerHTML = '<b>' + esc(c.title || 'Ohne Titel') + '</b><span>' + esc(c.username) + ' · ' + T(c.updated_at) + '</span>';
          b.onclick = () => dashChat(c.id); box.appendChild(b);
        });
      }else{
        const j = await RH.api('/api/admin/overview');
        box.innerHTML = '<div class="dash-stats"><div class="dash-stat"><b>' + j.users + '</b><span>Nutzer</span></div><div class="dash-stat"><b>' + j.chats + '</b><span>Chats</span></div><div class="dash-stat"><b>' + j.searches + '</b><span>Suchen</span></div></div>'
          + '<div class="dash-h">Häufigste Suchen</div>' + bars(j.topSearches, r => r.value)
          + '<div class="dash-h">Meistgeöffnete Regeln</div>' + bars(j.topRules, r => ruleTitle(r.value))
          + '<div class="dash-h">Neueste Nutzer</div>' + (j.newUsers.map(u => '<div class="dash-row"><span>' + esc(u.username) + '</span><span>' + T(u.created_at) + '</span></div>').join('') || '<p class="ai-sub">Noch keine Nutzer.</p>');
      }
    }catch(e){ box.innerHTML = '<div class="ai-bubble err">' + esc(e.message) + '</div>'; }
  }
  /* ---------- Einstellungen (Mitteilung, Neues, Funktionen an/aus, KI, Links) ---------- */
  const FEATURE_LABELS = {
    ai: ['KI-Aufgabenhilfe', 'Foto hochladen und passende Regeln finden'],
    registration: ['Registrierung', 'Neue Konten dürfen angelegt werden'],
    favorites: ['Merkliste', 'Stern an den Regeln'],
    recent: ['Zuletzt geöffnet', 'Verlauf der letzten Regeln'],
    notes: ['Notizen', 'Eigene Notizen zu Regeln'],
    practice: ['Übungsmodus', 'Karteikarten'],
    share: ['Regeln als Bild teilen', 'Knopf im Regel-Detail'],
    darkmode: ['Dunkelmodus', 'Umschalter in der Kopfzeile'],
    stats: ['Statistik', 'Suchbegriffe und geöffnete Regeln zählen']
  };
  const PROV_LABELS = {scher: 'ScherAI (scherai-1)', gemini: 'Gemini', groq: 'Groq'};
  const sw = (id, on, label, sub) => '<label class="sw-row"><span class="sw-tx"><b>' + esc(label) + '</b>' + (sub ? '<small>' + esc(sub) + '</small>' : '') + '</span><input type="checkbox" class="sw" id="' + id + '"' + (on ? ' checked' : '') + '><span class="sw-ui" aria-hidden="true"></span></label>';
  const fld = (id, label, val, ph, type) => '<label class="set-f"><span>' + esc(label) + '</span><input class="auth-in" id="' + id + '" type="' + (type || 'text') + '" value="' + esc(val == null ? '' : val) + '" placeholder="' + esc(ph || '') + '"></label>';
  const area = (id, label, val, ph, rows) => '<label class="set-f"><span>' + esc(label) + '</span><textarea class="set-ta" id="' + id + '" rows="' + (rows || 3) + '" placeholder="' + esc(ph || '') + '">' + esc(val || '') + '</textarea></label>';
  async function dashSettings(){
    const box = $('dashBody');
    let data;
    try{ data = await RH.api('/api/admin/settings'); }catch(e){ box.innerHTML = '<div class="ai-bubble err">' + esc(e.message) + '</div>'; return; }
    const S = data.settings, K = data.keys, SYS = data.system || {}, ST = data.stats || {};
    S.billing = Object.assign({enabled:false, proFeatures:{practice:true, notes:true}, freeAiPerDay:3, yearly:true, kleinunternehmer:true, promo:false, note:''}, S.billing || {});
    S.auth = Object.assign({requireEmail:true, requireVerified:true, google:true}, S.auth || {});
    const tick = (ok, label) => '<li class="' + (ok ? 'ok' : 'bad') + '">' + (ok ? '✓ ' : '✗ ') + esc(label) + '</li>';
    const news = S.news || RH.defaults.news;
    let order = S.ai.order.slice();
    const social = {discord: S.social.discord == null ? RH.defaults.discord : S.social.discord, instagram: S.social.instagram == null ? RH.defaults.instagram : S.social.instagram};
    const provHtml = () => order.map((p, i) => '<div class="prov-row"><span class="prov-n">' + (i + 1) + '</span><span class="prov-name"><b>' + PROV_LABELS[p] + '</b><small class="' + (K[p] ? 'ok' : 'bad') + '">' + (K[p] ? 'API-Key im Worker gesetzt' : 'API-Key fehlt im Worker') + '</small></span>'
      + '<button type="button" class="prov-mv" data-i="' + i + '" data-d="-1" aria-label="Nach oben"' + (i === 0 ? ' disabled' : '') + '>↑</button><button type="button" class="prov-mv" data-i="' + i + '" data-d="1" aria-label="Nach unten"' + (i === order.length - 1 ? ' disabled' : '') + '>↓</button>'
      + '<input type="checkbox" class="sw" id="prov_' + p + '"' + (S.ai.enabled[p] ? ' checked' : '') + '><label class="sw-ui sw-solo" for="prov_' + p + '" aria-label="' + PROV_LABELS[p] + ' aktiv"></label></div>').join('');
    box.innerHTML = '<div class="set-wrap">'
      + '<section class="set-card"><h3>Mitteilung</h3><p class="set-help">Ein Hinweis-Banner oben auf allen Seiten.</p>'
      + sw('an_on', S.announcement.enabled, 'Mitteilung anzeigen')
      + '<label class="set-f"><span>Art</span><select class="auth-in" id="an_type"><option value="info">Info (blau)</option><option value="warn">Warnung (gelb)</option><option value="success">Erfolg (grün)</option></select></label>'
      + area('an_text', 'Text', S.announcement.text, 'z. B. Morgen von 18 bis 19 Uhr Wartungsarbeiten.', 2)
      + fld('an_link', 'Link (optional)', S.announcement.link, 'https://… oder ueben.html') + fld('an_ltxt', 'Link-Text', S.announcement.linkText, 'Mehr erfahren')
      + '</section>'
      + '<section class="set-card"><h3>Wartungsmodus</h3><p class="set-help">Zeigt einen Hinweis und sperrt die KI für alle außer dir.</p>'
      + sw('mt_on', S.maintenance.enabled, 'Wartungsmodus aktiv') + area('mt_msg', 'Meldung', S.maintenance.message, '', 2) + '</section>'
      + '<section class="set-card"><h3>Neu im Regelheft (Popup)</h3><p class="set-help">Erscheint beim Öffnen der Startseite.</p>'
      + sw('nw_on', news.enabled !== false, 'Popup anzeigen') + fld('nw_date', 'Datum', news.date, '21.10.2026') + fld('nw_title', 'Überschrift', news.title, 'Neu im Regelheft')
      + area('nw_items', 'Punkte (eine Zeile pro Punkt, höchstens 8)', (news.items || []).join('\n'), '', 6) + '</section>'
      + '<section class="set-card"><h3>Funktionen</h3><p class="set-help">Abgeschaltete Funktionen verschwinden auf der Webseite und werden auch vom Server gesperrt.</p>'
      + Object.keys(FEATURE_LABELS).map(k => sw('ft_' + k, S.features[k] !== false, FEATURE_LABELS[k][0], FEATURE_LABELS[k][1])).join('') + '</section>'
      + '<section class="set-card"><h3>Bezahlung (Pro)</h3><p class="set-help">Aus = Bezahlung ist nirgends auffindbar und alle Funktionen sind frei (wie bisher). An = Üben/Notizen nur mit Pro, KI mit Tageslimit. Die Bezahlung wird erst aktiv, wenn Stripe vollständig eingerichtet ist.</p>'
      + '<ul class="sys-list">' + tick(SYS.stripe && SYS.stripe.secret, 'Stripe-Key (STRIPE_SECRET_KEY)') + tick(SYS.stripe && SYS.stripe.webhook, 'Webhook-Secret (STRIPE_WEBHOOK_SECRET)') + tick(SYS.stripe && SYS.stripe.priceMonth, 'Preis Monat (STRIPE_PRICE_MONTH)') + tick(SYS.stripe && SYS.stripe.priceYear, 'Preis Jahr (STRIPE_PRICE_YEAR, optional)') + tick(SYS.stripe && SYS.stripe.siteUrl, 'Webseiten-Adresse (SITE_URL)') + '</ul>'
      + sw('bl_on', S.billing.enabled, 'Bezahlung aktiv', SYS.stripe && SYS.stripe.ready ? 'Stripe ist bereit' : 'Stripe ist noch nicht vollständig eingerichtet (Einstellung wird gespeichert, wirkt aber erst danach)')
      + sw('bl_prac', S.billing.proFeatures.practice, 'Üben nur mit Pro') + sw('bl_note', S.billing.proFeatures.notes, 'Notizen nur mit Pro')
      + fld('bl_free', 'Kostenlose KI-Chats pro Tag (0 = KI nur mit Pro)', S.billing.freeAiPerDay, '3', 'number')
      + sw('bl_year', S.billing.yearly, 'Jahrestarif anbieten', 'Braucht STRIPE_PRICE_YEAR') + sw('bl_ku', S.billing.kleinunternehmer, 'Kleinunternehmer (§ 19 UStG)', 'Zeigt „keine Umsatzsteuer“ statt „inkl. USt“') + sw('bl_promo', S.billing.promo, 'Gutscheincodes erlauben')
      + area('bl_note_t', 'Zusatzhinweis auf der Pro-Seite (optional)', S.billing.note, '', 2) + '</section>'
      + '<section class="set-card"><h3>Konten und Anmeldung</h3><p class="set-help">' + (ST.users != null ? ST.users + ' Konten · ' + ST.verified + ' bestätigte E-Mails · ' + ST.proActive + ' mit Pro' : '') + '</p>'
      + '<ul class="sys-list">' + tick(SYS.mail && SYS.mail.ready, 'E-Mail-Versand' + (SYS.mail && SYS.mail.provider ? ' (' + SYS.mail.provider + ')' : ' (RESEND_API_KEY oder BREVO_API_KEY + MAIL_FROM)')) + tick(SYS.google && SYS.google.ready, 'Google-Login (GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET)') + '</ul>'
      + sw('au_mail', S.auth.requireEmail, 'E-Mail-Adresse verlangen', 'Bei der Registrierung und von bestehenden Konten') + sw('au_ver', S.auth.requireVerified, 'E-Mail mit Code bestätigen lassen', 'Wirkt nur, wenn der E-Mail-Versand eingerichtet ist') + sw('au_g', S.auth.google, 'Anmeldung mit Google anbieten')
      + '</section>'
      + '<section class="set-card"><h3>Pro schenken / entziehen</h3><p class="set-help">Zum Testen oder als Dankeschön. Wirkt sofort.</p>'
      + fld('gr_user', 'Benutzername', '', 'z. B. lena_m') + fld('gr_days', 'Tage', 30, '30', 'number')
      + '<div class="btn-row" style="flex-direction:row"><button class="ai-btn" id="grGive" type="button" style="margin:0">Pro schenken</button><button class="ai-btn ghost" id="grTake" type="button" style="margin:0">Pro entziehen</button></div><div class="auth-err" id="grMsg" role="status" style="margin-top:8px"></div></section>'
      + '<section class="set-card"><h3>KI</h3><p class="set-help">Reihenfolge: Der erste aktive Anbieter mit Key antwortet, bei Fehlern kommt der nächste dran. Die Keys stehen als Secrets im Cloudflare-Worker (nie hier).</p>'
      + '<div id="provList">' + provHtml() + '</div>'
      + fld('ai_rate', 'Anfragen pro Nutzer und Zeitfenster', S.ai.rateLimit, '20', 'number')
      + area('ai_extra', 'Zusätzliche Anweisung an die KI (optional)', S.ai.extra, 'z. B. Antworte besonders kurz.', 3) + '</section>'
      + '<section class="set-card"><h3>Links im Footer</h3><p class="set-help">Leer lassen = Link wird ausgeblendet.</p>'
      + fld('so_dc', 'Discord', social.discord, 'https://discord.gg/…') + fld('so_ig', 'Instagram', social.instagram, 'https://instagram.com/…') + '</section>'
      + '<div class="set-save"><button class="ai-btn" id="setSave" type="button">Speichern</button><span id="setMsg" role="status"></span></div></div>';
    $('an_type').value = S.announcement.type;
    const keep = () => { order.forEach(p => { S.ai.enabled[p] = $('prov_' + p).checked; }); };
    $('provList').onclick = e => {
      const b = e.target.closest('.prov-mv'); if(!b) return;
      keep(); const i = +b.dataset.i, j = i + +b.dataset.d; [order[i], order[j]] = [order[j], order[i]];
      $('provList').innerHTML = provHtml();
    };
    const grant = async revoke => {
      const m = $('grMsg'); m.style.color = ''; m.textContent = '…';
      try{ const j = await RH.api('/api/admin/pro', {body:{username: $('gr_user').value.trim(), days: +$('gr_days').value || 0, revoke}}); m.textContent = revoke ? 'Pro entzogen.' : 'Pro geschenkt bis ' + new Date(j.until).toLocaleDateString('de-DE') + '.'; }
      catch(e){ m.textContent = e.message; }
    };
    $('grGive').onclick = () => grant(false); $('grTake').onclick = () => grant(true);
    $('setSave').onclick = async () => {
      keep();
      const g = id => $(id).value, c = id => $(id).checked;
      const items = g('nw_items').split('\n').map(x => x.trim()).filter(Boolean);
      const payload = {
        maintenance: {enabled: c('mt_on'), message: g('mt_msg')},
        announcement: {enabled: c('an_on'), type: g('an_type'), text: g('an_text'), link: g('an_link'), linkText: g('an_ltxt')},
        news: {enabled: c('nw_on'), date: g('nw_date'), title: g('nw_title'), items},
        features: Object.fromEntries(Object.keys(FEATURE_LABELS).map(k => [k, c('ft_' + k)])),
        ai: {order, enabled: Object.fromEntries(order.map(p => [p, $('prov_' + p).checked])), rateLimit: +g('ai_rate') || 20, extra: g('ai_extra')},
        social: {discord: g('so_dc').trim(), instagram: g('so_ig').trim()},
        billing: {enabled: c('bl_on'), proFeatures: {practice: c('bl_prac'), notes: c('bl_note')}, freeAiPerDay: +g('bl_free') || 0, yearly: c('bl_year'), kleinunternehmer: c('bl_ku'), promo: c('bl_promo'), note: g('bl_note_t')},
        auth: {requireEmail: c('au_mail'), requireVerified: c('au_ver'), google: c('au_g')}
      };
      const m = $('setMsg'); m.textContent = 'Speichert …'; $('setSave').disabled = true;
      try{ await RH.api('/api/admin/settings', {body:{settings:payload}}); m.textContent = 'Gespeichert. Gilt auf der Webseite innerhalb von etwa 20 Sekunden.'; }
      catch(e){ m.textContent = e.message; }
      $('setSave').disabled = false;
    };
  }
  async function dashChat(id){
    const box = $('dashBody'); box.innerHTML = '<div class="ai-bubble muted">Lade …</div>';
    try{
      const j = await RH.api('/api/admin/chat?id=' + encodeURIComponent(id));
      let h = '<button class="ai-btn ghost" id="dashToList" style="margin-top:0"><svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" style=\"vertical-align:-3px;margin-right:6px\"><path d=\"M19 12H5\"/><path d=\"m12 19-7-7 7-7\"/></svg>Alle Chats</button><div class="ai-bubble"><div class="ai-lbl">' + esc(j.username) + ' · ' + T(j.updated_at) + '</div><b>' + esc(j.title || 'Ohne Titel') + '</b></div>';
      if(j.thumb) h += '<img class="ai-thumb" src="' + esc(j.thumb) + '" alt="">';
      j.messages.forEach(m => { h += '<div class="ai-bubble ' + (m.role === 'user' ? 'user' : '') + '"><div class="ai-lbl">' + (m.role === 'user' ? esc(j.username) : 'KI') + '</div><p>' + esc(m.text) + '</p></div>'; });
      (j.rule_ids || []).forEach(rid => { h += '<button class="ai-rule" data-id="' + esc(rid) + '"><b>' + esc(ruleTitle(rid)) + '</b></button>'; });
      if(j.model) h += '<div class="ai-model">Antwort generiert von <b>' + esc(prettyModel(j.model)) + '</b></div>';
      box.innerHTML = h;
      box.querySelector('#dashToList').onclick = () => dashLoad('chats');
      box.querySelectorAll('.ai-rule').forEach(b => b.onclick = () => openRule(b.dataset.id));
    }catch(e){ box.innerHTML = '<div class="ai-bubble err">' + esc(e.message) + '</div>'; }
  }

  $('dashTabOv').onclick = () => dashLoad('ov');
  $('dashTabChats').onclick = () => dashLoad('chats');
  $('dashTabSet').onclick = () => dashLoad('set');

  RH.ready.then(() => {
    const u = RH.user();
    if(!u){ RH.toLogin('dashboard.html'); return; }
    $('dashLoading').classList.add('is-hidden');
    if(!u.admin){ $('dashDenied').classList.remove('is-hidden'); return; }
    $('dashApp').classList.remove('is-hidden');
    dashLoad('ov');
  });
})();
