/* ============================================================
   Mein Konto: Abmelden und Konto löschen
   ============================================================ */
(function(){
  const $ = id => document.getElementById(id);
  document.querySelectorAll('[data-icon]').forEach(el => { el.innerHTML = icon(el.dataset.icon, +el.dataset.size || 20); });
  const dt = ms => new Date(ms).toLocaleDateString('de-DE');
  async function renderAccount(){
    const u = RH.user(); if(!u) return;
    $('kMail').textContent = u.email || 'Noch keine E-Mail-Adresse angegeben.';
    const b = $('kMailBadge'); b.classList.toggle('is-hidden', !u.email);
    if(u.email){ b.textContent = u.emailVerified ? 'Bestätigt' : 'Nicht bestätigt'; b.className = u.emailVerified ? 'badge-ok' : 'badge-warn'; }
    $('kMailBtn').textContent = !u.email ? 'E-Mail angeben' : (u.emailVerified ? 'E-Mail ändern' : 'E-Mail bestätigen');
    if(!u.hasPassword){ $('delPw').type = 'text'; $('delPw').placeholder = 'Benutzernamen eingeben'; $('delPw').autocomplete = 'off'; }
    // Pro
    const on = RH.cfg().billing.enabled;
    $('kPro').classList.toggle('is-hidden', !on);
    if(!on) return;
    let st = {}; try{ st = await RH.api('/api/billing/status'); }catch(e){}
    const btns = [];
    if(u.admin){ $('kProLine').textContent = 'Als Betreiber hast du alle Funktionen.'; }
    else if(st.pro){
      $('kProLine').innerHTML = '<span class="badge-ok">Pro aktiv</span><span>' + (st.cancelAtEnd ? 'gekündigt, endet am ' : (st.grant ? 'geschenkt bis ' : 'verlängert sich am ')) + (st.until ? dt(st.until) : '') + '</span>';
      if(st.hasSub && !st.cancelAtEnd) btns.push('<button class="ai-btn ghost" id="kCancel" type="button">Abo kündigen</button>');
      if(st.hasSub && st.cancelAtEnd) btns.push('<button class="ai-btn" id="kResume" type="button">Kündigung zurücknehmen</button>');
      if(st.canManage) btns.push('<button class="ai-btn ghost" id="kPortal" type="button">Zahlung und Rechnungen verwalten</button>');
    }else{
      $('kProLine').textContent = 'Du nutzt die kostenlose Version.' + (st.quota ? ' Heute ' + st.quota.used + ' von ' + st.quota.limit + ' KI-Chats genutzt.' : '');
      btns.push('<a class="ai-btn" href="pro.html">Pro holen</a>');
      if(st.canManage) btns.push('<button class="ai-btn ghost" id="kPortal" type="button">Rechnungen ansehen</button>');
    }
    $('kProBtns').innerHTML = btns.join('');
    const pe = t => { $('kProErr').textContent = t; };
    if($('kCancel')) $('kCancel').onclick = () => { $('kCancelTxt').textContent = 'Du kannst Pro noch bis zum ' + dt(st.until) + ' nutzen, danach endet das Abo. Wir schicken dir eine Bestätigung per E-Mail.'; $('kCancelBox').classList.remove('is-hidden'); };
    $('kCancelNo').onclick = () => $('kCancelBox').classList.add('is-hidden');
    $('kCancelYes').onclick = async () => { $('kCancelYes').disabled = true; try{ await RH.api('/api/billing/cancel', {body:{confirm:true}}); await RH.refreshUser(); $('kCancelBox').classList.add('is-hidden'); renderAccount(); }catch(e){ pe(e.message); } $('kCancelYes').disabled = false; };
    if($('kResume')) $('kResume').onclick = async () => { try{ await RH.api('/api/billing/resume', {body:{}}); await RH.refreshUser(); renderAccount(); }catch(e){ alert(e.message); } };
    if($('kPortal')) $('kPortal').onclick = async () => { try{ const j = await RH.api('/api/billing/portal', {body:{}}); location.href = j.url; }catch(e){ alert(e.message); } };
  }
  $('kMailBtn').onclick = () => RH.openEmailDialog({dismissible:true});
  RH.onAuth(u => { if(u) renderAccount(); });
  RH.ready.then(() => {
    const u = RH.user();
    if(!u){ RH.toLogin('konto.html'); return; }
    $('kontoLoading').classList.add('is-hidden');
    $('kontoApp').classList.remove('is-hidden');
    $('kontoUser').textContent = u.username;
    if(u.admin) $('kontoDash').classList.remove('is-hidden');
  });
  $('kontoClearRecent').onclick = async () => {
    const b = $('kontoClearRecent'); b.disabled = true;
    try{ await RH.api('/api/recent', {body:{clear:true}}); b.textContent = 'Verlauf gelöscht'; }
    catch(e){ b.textContent = 'Löschen nicht möglich'; b.disabled = false; }
  };
  $('kontoLogout').onclick = async () => { await RH.logout(); location.href = 'index.html'; };
  $('delStart').onclick = () => { $('delStart').classList.add('is-hidden'); $('delBox').classList.remove('is-hidden'); $('delPw').value = ''; $('delErr').textContent = ''; $('delPw').focus(); };
  $('delCancel').onclick = () => { $('delBox').classList.add('is-hidden'); $('delStart').classList.remove('is-hidden'); };
  $('delGo').onclick = async () => {
    $('delGo').disabled = true; $('delErr').textContent = '';
    try{
      await RH.api('/api/account/delete', {body:{password:$('delPw').value}});
      RH.setAuth(null, null);
      location.href = 'index.html';
    }catch(e){ $('delErr').textContent = e.message; $('delGo').disabled = false; }
  };
})();
