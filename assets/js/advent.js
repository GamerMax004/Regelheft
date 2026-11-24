/* ============================================================
   ADVENTSKALENDER – Oberfläche
   • Türchen 1–24 öffnen sich ab dem jeweiligen Dezembertag (Berlin).
   • Jedes Türchen hat eine Aufgabe. Wer angemeldet ist, bekommt nach der richtigen Antwort eine Auslosung
     (Token, Plus oder Pro). Die Auslosung macht der Server (worker.js), nicht der Browser.
   • Fortschritt (geöffnet/gelöst) wird in diesem Browser gespeichert, Gewinne im Konto.
   • Vorschau für dich: advent.html?vorschau=1 öffnet alle Türchen zum Ansehen (ohne Auslosung).
   ============================================================ */
(function(){
  'use strict';
  var D = window.ADVENT, YEAR = D.year, DAYS = D.days;
  var ORDER = [14,3,21,9,17,1,24,6,12,19,4,22,8,15,2,20,11,23,7,13,18,5,10,16];   // wie bei einem echten Kalender durcheinander
  var KEY = 'rh_advent_' + YEAR;
  var PREVIEW = new URLSearchParams(location.search).get('vorschau') === '1';
  var REDUCED = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function(id){ return document.getElementById(id); };
  var esc = function(s){ return (window.RH && RH.esc) ? RH.esc(s) : String(s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); };
  var ic = function(n, s){ return (typeof icon === 'function') ? icon(n, s || 18) : ''; };
  var byDay = function(d){ return DAYS.filter(function(t){ return t.d === d; })[0]; };

  /* ----- Speicher (nur in diesem Browser) ----- */
  var S = { o: [], s: [] };
  try { var raw = JSON.parse(localStorage.getItem(KEY) || 'null'); if (raw && Array.isArray(raw.o) && Array.isArray(raw.s)) S = raw; } catch (e) {}
  function save(){ try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  var claims = {};     // Gewinne vom Server: { tag: { id, label } }
  var tokens = null;   // Token-Guthaben vom Server (nur wenn Bezahlung an ist)
  var cur = 0;         // gerade geöffnetes Türchen

  /* ----- Datum (Berlin) ----- */
  function berlin(){
    var p = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()).split('-').map(Number);
    return { y: p[0], m: p[1], d: p[2] };
  }
  function maxOpen(){
    if (PREVIEW) return 24;
    var t = berlin();
    if (t.y === YEAR && t.m === 12) return Math.min(t.d, 24);
    if (t.y > YEAR || (t.y === YEAR && t.m > 12)) return 24;
    return 0;
  }

  /* ----- Antwort prüfen (gleiche Regeln wie auf dem Server) ----- */
  function num(s){
    s = String(s == null ? '' : s).trim().toLowerCase().replace(/[−–]/g, '-').replace(/\s+/g, '');
    if (/^[1-9]\d{0,2}(\.\d{3})+(,\d+)?(?![\d])/.test(s)) s = s.replace(/\./g, '');   // 1.000 = tausend
    s = s.replace(/,/g, '.');
    var m = s.match(/^(-?\d+(?:\.\d+)?)(?:\/(-?\d+(?:\.\d+)?))?[^\d\/.\-]*$/);
    if (!m) return NaN;
    var a = +m[1], b = m[2] == null ? 1 : +m[2];
    return b ? a / b : NaN;
  }
  function isRight(t, v){ var x = num(v); return t.a.some(function(a){ return Math.abs(num(a) - x) < 1e-9; }); }

  /* ----- Seite zeichnen ----- */
  function render(){
    var max = maxOpen(), t = berlin(), inDec = t.y === YEAR && t.m === 12;
    var solved = S.s.length, opened = S.o.length;
    // Status
    var main;
    if (max === 0) { var n = Math.round((Date.UTC(YEAR, 11, 1) - Date.UTC(t.y, t.m - 1, t.d)) / 864e5); main = n > 0 ? 'Noch ' + n + (n === 1 ? ' Tag' : ' Tage') + ' bis zum ersten Türchen' : 'Der Kalender ist gerade nicht geöffnet'; }
    else if (inDec && t.d <= 24 && !PREVIEW) main = 'Heute ist Türchen ' + t.d;
    else main = PREVIEW ? 'Vorschau: alle Türchen sind offen' : 'Alle Türchen sind offen';
    $('adStatus').textContent = main;
    $('adCount').textContent = opened + ' von 24 geöffnet · ' + solved + ' gelöst' + (tokens ? ' · Guthaben: ' + tokens.total + ' Token' : '');
    // Fortschrittsleiste
    var chain = '';
    for (var d = 1; d <= 24; d++) chain += '<li class="' + (S.s.indexOf(d) >= 0 ? 'is-done' : (d <= max ? 'is-open' : '')) + (inDec && d === t.d && !PREVIEW ? ' is-today' : '') + '"></li>';
    $('adChain').innerHTML = chain;
    // Türchen
    var html = '';
    ORDER.forEach(function(d){
      var tt = byDay(d), locked = d > max, open = S.o.indexOf(d) >= 0 && !locked, done = S.s.indexOf(d) >= 0, c = claims[d];
      var isToday = inDec && d === t.d && !PREVIEW;
      var inner = done ? (c && c.id !== 'none' ? ic('star', 20) : ic('check', 20)) : ic('lightbulb', 20);
      var back = '<span class="door-back">' + inner + '<b>' + esc(tt.title) + '</b>' + (c && c.id !== 'none' ? '<span>' + esc(c.label) + '</span>' : (done ? '<span>gelöst</span>' : '<span>noch offen</span>')) + '</span>';
      var sub = locked ? 'ab ' + d + '. Dez.' : (isToday ? 'Heute' : '');
      var front = '<span class="door-front"><span class="door-lock">' + ic('lock', 16) + '</span><span class="door-num">' + d + '</span><span class="door-sub">' + sub + '</span></span>';
      var label = 'Türchen ' + d + (locked ? ', verschlossen bis ' + d + '. Dezember' : open ? ', geöffnet: ' + tt.title + (done ? ', gelöst' : '') : ', zum Öffnen');
      html += '<li class="door' + (locked ? ' is-locked' : '') + (open ? ' is-open' : '') + (isToday ? ' is-today' : '') + '" data-d="' + d + '"><button class="door-btn" type="button" data-d="' + d + '" aria-label="' + esc(label) + '"' + (locked ? ' aria-disabled="true"' : '') + '>' + back + front + '</button></li>';
    });
    $('adGrid').innerHTML = html;
  }
  function msg(t){ $('adMsg').textContent = t || ''; }

  $('adGrid').addEventListener('click', function(e){
    var b = e.target.closest('.door-btn'); if (!b) return;
    var d = +b.dataset.d, li = b.parentNode;
    if (d > maxOpen()) {
      msg('Türchen ' + d + ' öffnet sich am ' + d + '. Dezember.');
      if (!REDUCED) { li.classList.remove('is-shake'); void li.offsetWidth; li.classList.add('is-shake'); }
      return;
    }
    msg('');
    if (S.o.indexOf(d) < 0) { S.o.push(d); save(); }
    li.classList.add('is-open');
    setTimeout(function(){ show(d); }, REDUCED ? 0 : 320);
  });

  /* ----- Dialog ----- */
  var dlg = $('adDlg');
  function fb(kind, text){ var el = $('adFb'); el.className = 'ad-fb' + (kind ? ' ' + kind : ''); el.textContent = text || ''; }
  function reveal(t, withRule){
    $('adSol').innerHTML = '<b>Lösungsweg:</b> ' + esc(t.sol);
    $('adSol').classList.remove('is-hidden');
    var a = $('adRule'); a.href = 'index.html#' + t.rule; $('adRuleTx').textContent = 'Passende Regel: ' + t.rt; a.classList.remove('is-hidden');
  }
  function show(d){
    cur = d; var t = byDay(d), done = S.s.indexOf(d) >= 0;
    $('adDay').textContent = 'Türchen ' + d;
    $('adTitle').textContent = t.title; $('adQ').textContent = t.q;
    var inp = $('adIn'); inp.value = ''; inp.disabled = done; $('adForm').querySelector('button').disabled = done;
    fb(done ? 'ok' : '', done ? 'Gelöst' : '');
    $('adHint').classList.add('is-hidden'); $('adSol').classList.add('is-hidden'); $('adRule').classList.add('is-hidden');
    $('adHintBtn').style.display = done ? 'none' : ''; $('adSolBtn').style.display = done ? 'none' : '';
    var box = $('adPrize'); if (box) box.remove();
    if (done) { reveal(t); prizeBlock(d); }
    try { dlg.showModal(); } catch (e) { dlg.setAttribute('open', ''); }
    if (!done) setTimeout(function(){ try { inp.focus(); } catch (e) {} }, 60);
  }
  function loggedIn(){ return !!(window.RH && RH.user && RH.user()); }
  function prizeEl(){ var b = $('adPrize'); if (!b) { b = document.createElement('div'); b.id = 'adPrize'; $('adRule').insertAdjacentElement('beforebegin', b); } return b; }
  function prizeBlock(d){   // für gelöste Türchen: Gewinn zeigen oder anbieten
    var c = claims[d];
    if (c) return showPrize(c, true);
    if (typeof RH === 'undefined' || (RH.cfg && RH.cfg().advent === false)) return;
    var b = prizeEl();
    if (!loggedIn()) { b.className = 'ad-prize is-none'; b.innerHTML = '<p>Melde dich an, dann kannst du bei jedem gelösten Türchen etwas gewinnen: Token, Plus oder Pro.</p><a class="ai-btn" href="anmeldung.html?next=advent.html">Anmelden</a>'; return; }
    b.className = 'ad-prize'; b.innerHTML = '<small>Auslosung</small><p>Du hast dieses Türchen gelöst. Ziehe jetzt dein Los.</p><button class="ai-btn" type="button" id="adDraw">Gewinn ziehen</button>';
    $('adDraw').onclick = function(){ draw(byDay(d), byDay(d).a[0]); };
  }
  function showPrize(p, already, tk){
    var b = prizeEl(), none = p.id === 'none';
    b.className = 'ad-prize' + (none ? ' is-none' : '');
    var extra = '';
    if (!none && p.until) extra = '<p>Gilt bis ' + new Date(p.until).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' }) + '.</p>';
    else if (!none && p.converted) extra = '<p>Du hast diesen Tarif schon, deshalb bekommst du Token dafür.</p>';
    if (tk && !none && p.tokens) extra += '<p>Dein Guthaben: ' + tk.total + ' Token</p>';
    b.innerHTML = '<small>' + (already ? 'Dein Gewinn' : (none ? 'Auslosung' : 'Du hast gewonnen')) + '</small><strong>' + esc(none ? 'Diesmal leider nichts' : p.label) + '</strong>' + (none ? '<p>Morgen wartet ein neues Türchen mit neuer Chance.</p>' : extra);
  }
  async function draw(t, answer){
    var b = prizeEl(); b.className = 'ad-prize'; b.innerHTML = '<small>Auslosung</small><p>Das Los wird gezogen …</p>';
    try {
      var j = await RH.api('/api/advent/open', { body: { day: t.d, answer: answer } });
      if (j.correct === false) { b.className = 'ad-prize is-none'; b.innerHTML = '<p>Der Server hat die Antwort nicht erkannt. Schreibe sie bitte als Zahl, Dezimalzahl oder Bruch.</p>'; return; }
      claims[t.d] = j.prize; if (j.tokens) tokens = j.tokens;
      showPrize(j.prize, !!j.already, j.tokens); render();
    } catch (e) {
      if (e.status === 401) { prizeBlock(t.d); return; }
      b.className = 'ad-prize is-none'; b.innerHTML = '<p>' + esc(e.message || 'Das hat leider nicht geklappt.') + '</p>';
    }
  }

  $('adForm').addEventListener('submit', function(e){
    e.preventDefault();
    var t = byDay(cur), v = $('adIn').value.trim(); if (!v) return;
    if (!isRight(t, v)) { fb('err', 'Noch nicht ganz. Probiere es noch einmal!'); return; }
    if (S.s.indexOf(cur) < 0) { S.s.push(cur); save(); }
    fb('ok', 'Richtig!'); $('adIn').disabled = true; $('adForm').querySelector('button').disabled = true;
    $('adHint').classList.add('is-hidden'); $('adHintBtn').style.display = 'none'; $('adSolBtn').style.display = 'none';
    reveal(t); render();
    if (loggedIn() && !(window.RH && RH.cfg && RH.cfg().advent === false)) draw(t, v); else prizeBlock(cur);
  });
  $('adHintBtn').onclick = function(){ var t = byDay(cur), h = $('adHint'); h.textContent = 'Tipp: ' + t.hint; h.classList.remove('is-hidden'); };
  $('adSolBtn').onclick = function(){
    var t = byDay(cur); reveal(t); fb('', 'Lösung: ' + t.a[0]);
    $('adHintBtn').style.display = 'none'; $('adSolBtn').style.display = 'none';
  };
  $('adClose').onclick = function(){ dlg.close(); };
  dlg.addEventListener('click', function(e){ if (e.target === dlg) dlg.close(); });   // Klick neben die Karte schließt
  dlg.addEventListener('close', function(){ render(); });

  /* ----- Start ----- */
  $('adClose').innerHTML = ic('x', 20);
  var ri = document.querySelector('#adRule [data-icon]'); if (ri) ri.innerHTML = ic('book', 18);
  render();
  if (window.RH && RH.ready) RH.ready.then(async function(){
    var cfg = RH.cfg ? RH.cfg() : {};
    if (cfg.advent === false) { msg('Der Adventskalender ist gerade nicht aktiv.'); }
    if (!loggedIn()) {
      var p = document.createElement('p'); p.className = 'ad-login';
      p.innerHTML = 'Du kannst alle Aufgaben auch ohne Konto lösen. <a href="anmeldung.html?next=advent.html">Melde dich an</a>, dann wird bei jedem gelösten Türchen etwas ausgelost: Token, Plus oder Pro.';
      $('adChain').insertAdjacentElement('afterend', p);
      return;
    }
    try {
      var st = await RH.api('/api/advent/state');
      if (st && st.enabled) { (st.claims || []).forEach(function(c){ claims[c.day] = c; if (S.s.indexOf(c.day) < 0) { S.s.push(c.day); } }); save(); tokens = st.tokens || null; render(); }
    } catch (e) {}
  });
})();
