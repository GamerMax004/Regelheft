/* ============================================================
   Anmelden & Registrieren
   ============================================================ */
(function(){
  const $ = id => document.getElementById(id);
  const params = new URLSearchParams(location.search);
  const next = RH.safeNext(params.get('next'));
  let mode = location.hash === '#registrieren' ? 'register' : 'login';

  function setMode(m){
    mode = m;
    $('authTabLogin').classList.toggle('on', m === 'login');
    $('authTabReg').classList.toggle('on', m === 'register');
    $('authTitle').textContent = m === 'login' ? 'Anmelden' : 'Registrieren';
    $('authRegOnly').style.display = m === 'register' ? '' : 'none';
    $('authSubmit').textContent = m === 'login' ? 'Anmelden' : 'Registrieren';
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
  });

  $('authForm').onsubmit = async e => {
    e.preventDefault();
    const username = $('authUser').value.trim(), password = $('authPw').value;
    const err = t => { $('authErr').textContent = t; };
    if(!username || !password) return err('Bitte Benutzername und Passwort eingeben.');
    const body = {username, password};
    if(mode === 'register'){
      if(!/^[A-Za-z0-9_.-]{3,20}$/.test(username)) return err('Benutzername: 3–20 Zeichen (Buchstaben, Zahlen, _ . -), keine Leerzeichen oder Umlaute.');
      if(password.length < 8) return err('Das Passwort muss mindestens 8 Zeichen lang sein.');
      if(!$('authAge').checked) return err('Bitte bestätige dein Alter bzw. die Erlaubnis deiner Erziehungsberechtigten.');
      if(!$('authConsent').checked) return err('Bitte bestätige, dass du die Datenschutzerklärung gelesen hast.');
      body.consent = true; body.age = true;      // Einladungscode wird nicht mehr abgefragt
    }
    $('authSubmit').disabled = true; err('');
    try{
      const j = await RH.api('/api/' + mode, {body});
      $('authPw').value = '';
      RH.setAuth(j.token, j.user);
      location.href = next;
    }catch(ex){
      err(ex.message || 'Es ist ein Fehler aufgetreten.');
      $('authSubmit').disabled = false;
    }
  };

  // Schon angemeldet? Dann statt des Formulars eine Bestätigung zeigen.
  function showState(user, loading){
    const loggedIn = !!user;
    $('authCard').classList.toggle('is-hidden', loggedIn || (loading && RH.hasToken()));
    $('authDone').classList.toggle('is-hidden', !loggedIn);
    if(loggedIn) $('authDoneUser').textContent = user.username;
  }
  RH.onAuth(showState);
})();
