/* ============================================================
   Mein Konto: Abmelden und Konto löschen
   ============================================================ */
(function(){
  const $ = id => document.getElementById(id);
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
