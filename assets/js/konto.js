/* ============================================================
   Mein Konto: Tarif (kündigen), E-Mail, Schnellzugriff, Konto löschen
   ============================================================ */
(function(){
  const $ = id => document.getElementById(id);
  document.querySelectorAll('[data-icon]').forEach(el => { el.innerHTML = icon(el.dataset.icon, +el.dataset.size || 20); });
  const dt = ms => new Date(ms).toLocaleDateString('de-DE');
  const crown = icon('crown', 12, true);
  const setErr = t => { $('kProErr').textContent = t || ''; };

  function badges(u, st){
    const b = [];
    if(u.pro && !u.admin || st.pro) b.push('<span class="u-badge pro">' + crown + 'Pro</span>');
    else if(u.plus || st.plus) b.push('<span class="u-badge plus">Plus</span>');
    if(u.owner) b.push('<span class="u-badge ok">Besitzer</span>'); else if(u.admin) b.push('<span class="u-badge ok">Team</span>');
    $('kontoBadges').innerHTML = b.join('');
    $('kontoAv').className = 'u-av' + (st.pro ? ' pro' : st.plus ? ' plus' : '');
  }

  async function renderAccount(){
    const u = RH.user(); if(!u) return;
    // E-Mail
    $('kMail').textContent = u.email || 'Noch keine E-Mail-Adresse angegeben.';
    const mb = $('kMailBadge'); mb.classList.toggle('u-hidden', !u.email);
    if(u.email){ mb.textContent = u.emailVerified ? 'Bestätigt' : 'Nicht bestätigt'; mb.className = 'u-badge ' + (u.emailVerified ? 'ok' : 'warn'); }
    $('kMailBtn').textContent = !u.email ? 'E-Mail angeben' : (u.emailVerified ? 'E-Mail ändern' : 'E-Mail bestätigen');
    if(!u.hasPassword){ $('delPw').type = 'text'; $('delPw').placeholder = 'Benutzernamen zur Bestätigung'; $('delPw').autocomplete = 'off'; }
    $('kLinkKi').classList.toggle('u-hidden', !RH.feat('ai')); $('kLinkUeben').classList.toggle('u-hidden', !RH.feat('practice'));

    // Tarif
    let st = {}; try{ st = await RH.api('/api/billing/status'); }catch(e){}
    badges(u, st);
    const billing = RH.cfg().billing.enabled, hasPlan = !!(st.pro || st.plus);
    $('kPro').classList.toggle('u-hidden', !(billing || hasPlan || u.admin));
    if(!(billing || hasPlan || u.admin)) return;
    const btns = [], name = u.admin ? 'Alle Funktionen' : st.pro ? 'Pro' : st.plus ? 'Plus' : 'Kostenlos';
    $('kPlanName').textContent = name;
    $('kPlanIc').className = 'u-plan-ic' + (st.pro || u.admin ? ' pro' : '');
    $('kPlanIc').innerHTML = icon(st.pro || u.admin ? 'crown' : st.plus ? 'sparkles' : 'user', 24, !!(st.pro || u.admin));
    let sub = '';
    if(u.admin) sub = u.owner ? 'Du bist der Betreiber.' : 'Du gehörst zum Team.';
    else if(hasPlan) sub = st.cancelAtEnd ? 'Gekündigt, läuft bis ' + dt(st.until) : st.grant ? 'Geschenkt bis ' + dt(st.until) : 'Verlängert sich am ' + dt(st.until);
    else sub = 'Mit Plus oder Pro gibt es mehr.';
    $('kPlanSub').textContent = sub;
    const q = !u.admin && !st.pro && st.quota;
    $('kQuota').classList.toggle('u-hidden', !q);
    if(q){ $('kQuotaBar').style.width = Math.min(100, st.quota.limit ? Math.round(st.quota.used / st.quota.limit * 100) : 100) + '%'; $('kQuotaTx').textContent = 'Heute ' + st.quota.used + ' von ' + st.quota.limit + ' KI-Chats genutzt'; }
    if(!u.admin){
      if(!st.pro && billing) btns.push('<a class="u-btn" href="pro.html">' + (st.plus ? 'Auf Pro wechseln' : (RH.cfg().billing.plusAvailable ? 'Plus oder Pro holen' : 'Pro holen')) + '</a>');
      if(st.hasSub && !st.cancelAtEnd) btns.push('<button class="u-btn danger" id="kCancel" type="button">Tarif kündigen</button>');
      if(st.hasSub && st.cancelAtEnd) btns.push('<button class="u-btn" id="kResume" type="button">Kündigung zurücknehmen</button>');
      if(st.canManage) btns.push('<button class="u-btn ghost" id="kPortal" type="button">Zahlung & Rechnungen</button>');
    }
    $('kProBtns').innerHTML = btns.join(''); $('kProBtns').classList.toggle('u-hidden', !btns.length);
    $('kCancelBox').classList.add('u-hidden'); setErr('');
    if($('kCancel')) $('kCancel').onclick = () => {
      $('kCancelTxt').textContent = 'Du kannst ' + name + ' noch bis zum ' + dt(st.until) + ' nutzen, danach endet der Tarif. Wir schicken dir eine Bestätigung per E-Mail.';
      $('kCancelBox').classList.remove('u-hidden'); $('kCancelBox').scrollIntoView({block:'nearest', behavior:'smooth'});
    };
    $('kCancelNo').onclick = () => $('kCancelBox').classList.add('u-hidden');
    $('kCancelYes').onclick = async () => {
      $('kCancelYes').disabled = true; setErr('');
      try{ await RH.api('/api/billing/cancel', {body:{confirm:true}}); await RH.refreshUser(); }
      catch(e){ setErr(e.message); }
      $('kCancelYes').disabled = false;
    };
    if($('kResume')) $('kResume').onclick = async () => { try{ await RH.api('/api/billing/resume', {body:{}}); await RH.refreshUser(); }catch(e){ setErr(e.message); } };
    if($('kPortal')) $('kPortal').onclick = async () => { try{ const j = await RH.api('/api/billing/portal', {body:{}}); location.href = j.url; }catch(e){ setErr(e.message); } };
  }
  $('kMailBtn').onclick = () => RH.openEmailDialog({dismissible:true});
  RH.onAuth(u => { if(u) renderAccount(); });
  RH.ready.then(() => {
    const u = RH.user();
    if(!u){ RH.toLogin('konto.html'); return; }
    $('kontoLoading').classList.add('u-hidden');
    $('kontoApp').classList.remove('u-hidden');
    $('kontoUser').textContent = u.username;
    $('kontoAv').textContent = (u.username || '?').trim().charAt(0).toUpperCase();
    if(u.admin) $('kontoDash').classList.remove('u-hidden');
  });
  $('kontoClearRecent').onclick = async () => {
    const b = $('kontoClearRecent'); b.disabled = true;
    try{ await RH.api('/api/recent', {body:{clear:true}}); b.textContent = 'Verlauf gelöscht'; }
    catch(e){ b.textContent = 'Löschen nicht möglich'; b.disabled = false; }
  };
  $('kontoLogout').onclick = async () => { await RH.logout(); location.href = 'index.html'; };
  $('kDanger').querySelector('.u-acc-h').onclick = e => { const a = $('kDanger'); a.classList.toggle('open'); e.currentTarget.setAttribute('aria-expanded', a.classList.contains('open')); };
  $('delGo').onclick = async () => {
    $('delGo').disabled = true; $('delErr').textContent = '';
    try{ await RH.api('/api/account/delete', {body:{password:$('delPw').value}}); RH.setAuth(null, null); location.href = 'index.html'; }
    catch(e){ $('delErr').textContent = e.message; $('delGo').disabled = false; }
  };
})();
