/* ============================================================
   Anmelden, Registrieren (mit E-Mail + Bestätigungscode) und Google-Login
   ============================================================ */
(function(){
  const $ = id => document.getElementById(id);
  const params = new URLSearchParams(location.search);
  const next = RH.safeNext(params.get('next'));
  let mode = location.hash === '#registrieren' ? 'register' : 'login';
  let busyFlow = false;                     // während Code-Eingabe / Google-Abschluss nicht automatisch weiterleiten
  const show = id => { ['authCard','authVerify','authGConsent','authDone'].forEach(x => $(x).classList.toggle('is-hidden', x !== id)); };

  function setMode(m){
    mode = m;
    $('authTabLogin').classList.toggle('on', m === 'login');
    $('authTabReg').classList.toggle('on', m === 'register');
    $('authTitle').textContent = m === 'login' ? 'Anmelden' : 'Registrieren';
    $('authRegOnly').style.display = m === 'register' ? '' : 'none';
    $('authMail').classList.toggle('is-hidden', m !== 'register');
    $('authSubmit').textContent = m === 'login' ? 'Anmelden' : 'Registrieren';
    $('googleTxt').textContent = m === 'login' ? 'Mit Google anmelden' : 'Mit Google registrieren';
    $('authPw').autocomplete = m === 'login' ? 'current-password' : 'new-password';
    $('authErr').textContent = '';
    history.replaceState(null, '', location.pathname + location.search + (m === 'register' ? '#registrieren' : ''));
  }
  $('authTabLogin').onclick = () => setMode('login');
  $('authTabReg').onclick = () => setMode('register');
  setMode(mode);

  RH.onConfig(cfg => {
    const open = cfg.features.registration !== false;
    $('authTabReg').style.display = open ? '' : 'none';
    if(!open && mode === 'register') setMode('login');
    let n = document.getElementById('regClosed');
    if(!open && !n){ n = document.createElement('p'); n.id = 'regClosed'; n.className = 'page-note'; n.textContent = 'Die Registrierung ist gerade geschlossen. Wer schon ein Konto hat, kann sich anmelden.'; $('authCard').before(n); }
    if(open && n) n.remove();
    $('googleWrap').classList.toggle('is-hidden', !cfg.auth.google);
    $('googleBtn').href = RH.apiBase + '/api/auth/google/start?next=' + encodeURIComponent(next);
  });

  /* ---------- Anmelden / Registrieren ---------- */
  $('authForm').onsubmit = async e => {
    e.preventDefault();
    const username = $('authUser').value.trim(), password = $('authPw').value, mail = $('authMail').value.trim();
    const err = t => { $('authErr').textContent = t; };
    if(!username || !password) return err('Bitte Benutzername und Passwort eingeben.');
    const body = {username, password};
    if(mode === 'register'){
      if(!/^[A-Za-z0-9_.-]{3,20}$/.test(username)) return err('Benutzername: 3–20 Zeichen (Buchstaben, Zahlen, _ . -), keine Leerzeichen oder Umlaute.');
      if(RH.cfg().auth.requireEmail && !/^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/.test(mail)) return err('Bitte gib eine gültige E-Mail-Adresse ein.');
      if(password.length < 8) return err('Das Passwort muss mindestens 8 Zeichen lang sein.');
      if(!$('authAge').checked) return err('Bitte bestätige dein Alter bzw. die Erlaubnis deiner Erziehungsberechtigten.');
      if(!$('authConsent').checked) return err('Bitte bestätige, dass du die Datenschutzerklärung gelesen hast.');
      body.consent = true; body.age = true; body.email = mail;
    }
    $('authSubmit').disabled = true; err('');
    try{
      const j = await RH.api('/api/' + mode, {body});
      $('authPw').value = '';
      if(mode === 'register' && j.needsVerify){
        busyFlow = true; RH.setAuth(j.token, j.user);
        $('vLead').textContent = 'Wir haben dir einen 6-stelligen Code an ' + mail + ' geschickt. Er ist 15 Minuten gültig.';
        show('authVerify'); $('vCode').focus();
        return;
      }
      RH.setAuth(j.token, j.user);
      location.href = next;
    }catch(ex){
      err(ex.message || 'Es ist ein Fehler aufgetreten.');
      $('authSubmit').disabled = false;
    }
  };

  /* ---------- Code eingeben ---------- */
  $('vGo').onclick = async () => {
    $('vGo').disabled = true; $('vErr').textContent = '';
    try{ await RH.api('/api/email/verify', {body:{code:$('vCode').value.trim()}}); await RH.refreshUser(); location.href = next; }
    catch(e){ $('vErr').textContent = e.message; $('vGo').disabled = false; }
  };
  $('vCode').addEventListener('keydown', e => { if(e.key === 'Enter') $('vGo').click(); });
  $('vResend').onclick = async () => {
    try{ await RH.api('/api/email/start', {body:{email:$('authMail').value.trim() || (RH.user() && RH.user().email) || ''}}); $('vErr').textContent = 'Neuer Code gesendet.'; }
    catch(e){ $('vErr').textContent = e.message; }
  };

  /* ---------- Rückkehr von Google ---------- */
  const ERR = {off:'Der Google-Login ist gerade nicht verfügbar.', busy:'Zu viele Versuche. Bitte warte ein paar Minuten.', state:'Der Google-Login ist abgelaufen. Bitte versuche es noch einmal.', mail:'Deine Google-E-Mail-Adresse ist nicht bestätigt. Bitte nutze einen anderen Weg.', fail:'Der Google-Login hat nicht geklappt. Bitte versuche es noch einmal.'};
  if(params.get('gerr')) $('authErr').textContent = ERR[params.get('gerr')] || ERR.fail;
  const gcode = params.get('gcode');
  async function gExchange(consent){
    const body = {code:gcode}; if(consent){ body.age = true; body.consent = true; }
    const j = await RH.api('/api/auth/google/exchange', {body});
    if(j.needsConsent){ busyFlow = true; $('gLead').textContent = 'Du meldest dich mit deinem Google-Konto ' + j.email + ' zum ersten Mal an. Bitte bestätige kurz Folgendes:'; show('authGConsent'); return; }
    RH.setAuth(j.token, j.user); location.href = next;
  }
  if(gcode){
    busyFlow = true; history.replaceState(null, '', location.pathname + '?next=' + encodeURIComponent(next));
    gExchange(false).catch(e => { busyFlow = false; show('authCard'); $('authErr').textContent = e.message; });
    $('gGo').onclick = async () => {
      if(!$('gAge').checked || !$('gConsent').checked){ $('gErr').textContent = 'Bitte bestätige beide Punkte.'; return; }
      $('gGo').disabled = true;
      try{ await gExchange(true); }catch(e){ $('gErr').textContent = e.message; $('gGo').disabled = false; }
    };
  }

  // Schon angemeldet? Dann statt des Formulars eine Bestätigung zeigen.
  RH.onAuth((user, loading) => {
    if(busyFlow) return;
    const loggedIn = !!user;
    if(loggedIn){ show('authDone'); $('authDoneUser').textContent = user.username; }
    else if(loading && RH.hasToken()){ ['authCard','authVerify','authGConsent','authDone'].forEach(x => $(x).classList.add('is-hidden')); }
    else show('authCard');
  });
})();
