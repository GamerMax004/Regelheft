/* ============================================================
   Übungsmodus: Karteikarten zu den Regeln
   • ohne Konto: Karten durchgehen (nichts wird gespeichert)
   • mit Konto: Lernstand pro Regel wird gespeichert (0 = noch nicht sicher … 3 = sicher),
     unsichere Regeln kommen zuerst dran
   ============================================================ */
(function(){
  const $ = id => document.getElementById(id);
  const RULES = window.RULES;
  document.querySelectorAll('[data-icon]').forEach(el => { el.innerHTML = icon(el.dataset.icon, +el.dataset.size || 20); });

  const cats = []; RULES.forEach(r => { if(!cats.includes(r.category)) cats.push(r.category); });
  let boxes = {}, favIds = [], source = 'all', count = 10;
  let deck = [], idx = 0, flipped = false, missed = [], known = 0, wasLoggedIn = false;
  const logged = () => !!RH.user();

  /* ---------- Auswahl ---------- */
  function chip(label, key, group){
    const on = group === 'src' ? source === key : count === key;
    return '<button type="button" class="p-chip' + (on ? ' on' : '') + '" role="radio" aria-checked="' + on + '" data-k="' + RH.esc(String(key)) + '">' + RH.esc(label) + '</button>';
  }
  function renderSetup(){
    let h = chip('Alle Regeln', 'all', 'src');
    if(logged()) h += chip('Meine Merkliste', '__fav', 'src') + chip('Noch nicht sicher', '__weak', 'src');
    h += cats.map(c => chip(c, c, 'src')).join('');
    $('pSource').innerHTML = h;
    $('pCount').innerHTML = chip('10', 10, 'cnt') + chip('20', 20, 'cnt') + chip('Alle', 0, 'cnt');
    const st = $('pStats');
    if(logged()){
      const sure = RULES.filter(r => (boxes[r.id] || 0) >= 2).length;
      st.classList.remove('is-hidden');
      st.innerHTML = 'Du kannst schon <b>' + sure + ' von ' + RULES.length + '</b> Regeln sicher. Dein Lernstand wird in deinem Konto gespeichert.<br><button type="button" id="pReset">Lernstand zurücksetzen</button>';
      $('pReset').onclick = async () => {
        if(!confirm('Lernstand wirklich zurücksetzen?')) return;
        try{ await RH.api('/api/cards', {body:{reset:true}}); boxes = {}; renderSetup(); }catch(e){ alert(e.message); }
      };
    }else{
      st.classList.remove('is-hidden');
      st.innerHTML = 'Tipp: Mit einem <a class="link" href="anmeldung.html?next=ueben.html">Konto</a> merkt sich das Regelheft, welche Regeln du schon sicher kannst.';
    }
  }
  $('pSource').addEventListener('click', e => { const b = e.target.closest('.p-chip'); if(b){ source = b.dataset.k; renderSetup(); } });
  $('pCount').addEventListener('click', e => { const b = e.target.closest('.p-chip'); if(b){ count = +b.dataset.k; renderSetup(); } });

  /* ---------- Stapel bauen ---------- */
  function shuffle(a){ for(let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function buildDeck(){
    let pool = RULES.slice();
    if(source === '__fav') pool = pool.filter(r => favIds.includes(r.id));
    else if(source === '__weak') pool = pool.filter(r => (boxes[r.id] || 0) < 2);
    else if(source !== 'all') pool = pool.filter(r => r.category === source);
    shuffle(pool);
    if(logged()) pool.sort((a, b) => (boxes[a.id] || 0) - (boxes[b.id] || 0));   // Unsicheres zuerst (stabil: Zufall bleibt innerhalb gleicher Stufe)
    return count > 0 ? pool.slice(0, count) : pool;
  }
  function start(cards){
    deck = cards; idx = 0; missed = []; known = 0;
    if(!deck.length){ alert(source === '__fav' ? 'Deine Merkliste ist noch leer.' : 'Für diese Auswahl gibt es keine Karten.'); return; }
    $('pSetup').classList.add('is-hidden'); $('pDone').classList.add('is-hidden'); $('pRun').classList.remove('is-hidden');
    window.scrollTo(0, 0);
    show();
  }
  $('pStart').onclick = () => start(buildDeck());

  /* ---------- Karte anzeigen ---------- */
  function show(){
    const r = deck[idx]; flipped = false;
    $('pCat').textContent = r.category; $('pTitle').textContent = r.title;
    $('pFront').classList.remove('is-hidden'); $('pBack').classList.add('is-hidden'); $('pActions').classList.add('is-hidden');
    $('pNum').textContent = (idx + 1) + ' / ' + deck.length;
    $('pBar').style.width = (idx / deck.length * 100) + '%';
    $('pCard').setAttribute('aria-label', 'Karte umdrehen: ' + r.title);
  }
  function flip(){
    if(flipped) return;
    flipped = true;
    const r = deck[idx];
    $('pTitle2').textContent = r.title;
    $('pBody').innerHTML = formatBody(r.body);
    $('pDiagSec').classList.toggle('is-hidden', !r.diagram);
    $('pDiag').innerHTML = r.diagram || '';
    $('pOpen').href = 'index.html?from=ueben#' + encodeURIComponent(r.id);
    $('pFront').classList.add('is-hidden'); $('pBack').classList.remove('is-hidden'); $('pActions').classList.remove('is-hidden');
  }
  $('pCard').addEventListener('click', e => { if(e.target.closest('a')) return; flip(); });
  $('pCard').addEventListener('keydown', e => { if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); flip(); } });

  function rate(good){
    const r = deck[idx];
    const box = good ? Math.min(3, (boxes[r.id] || 0) + 1) : 0;
    if(good) known++; else missed.push(r);
    if(logged()){ boxes[r.id] = box; RH.api('/api/cards', {body:{id:r.id, box}}).catch(() => {}); }
    idx++;
    if(idx >= deck.length) finish(); else show();
  }
  $('pKnow').onclick = () => rate(true);
  $('pAgain').onclick = () => rate(false);
  document.addEventListener('keydown', e => {
    if($('pRun').classList.contains('is-hidden') || !flipped) return;
    if(e.key === 'ArrowRight') rate(true); else if(e.key === 'ArrowLeft') rate(false);
  });
  $('pQuit').onclick = () => { $('pRun').classList.add('is-hidden'); $('pSetup').classList.remove('is-hidden'); renderSetup(); };

  /* ---------- Ergebnis ---------- */
  function finish(){
    $('pBar').style.width = '100%';
    $('pRun').classList.add('is-hidden'); $('pDone').classList.remove('is-hidden');
    $('pDoneBig').textContent = known + ' von ' + deck.length;
    $('pDoneSub').textContent = missed.length ? (known >= deck.length / 2 ? 'Stark! ' : 'Weiter so! ') + 'Die ' + missed.length + ' verpassten Karten kannst du gleich noch einmal üben.' : 'Alle gewusst. Stark!';
    $('pRepeat').classList.toggle('is-hidden', !missed.length);
    window.scrollTo(0, 0);
  }
  $('pRepeat').onclick = () => start(shuffle(missed.slice()));
  $('pNew').onclick = () => { $('pDone').classList.add('is-hidden'); $('pSetup').classList.remove('is-hidden'); renderSetup(); window.scrollTo(0, 0); };

  /* ---------- Start: Lernstand und Merkliste laden ---------- */
  RH.configReady.then(() => {
    if(RH.feat('practice')) return;
    ['pSetup','pRun','pDone'].forEach(i => $(i).classList.add('is-hidden')); $('pOff').classList.remove('is-hidden');
  });
  renderSetup();
  RH.ready.then(async () => {
    if(logged()){
      try{ boxes = (await RH.api('/api/cards')).boxes || {}; }catch(e){}
      try{ favIds = (await RH.api('/api/favs')).ids || []; }catch(e){}
    }
    wasLoggedIn = logged();
    renderSetup();
  });
})();
