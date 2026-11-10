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
    return '<button type="button" class="p-chip' + (on ? ' on' : '') + '" role="radio" aria-checked="' + on + '" tabindex="' + (on ? 0 : -1) + '" data-k="' + RH.esc(String(key)) + '">' + RH.esc(label) + '</button>';
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
        if(!await RH.confirm({title:'Lernstand zurücksetzen?', text:'Alle Regeln gelten danach wieder als „noch nicht sicher“. Das lässt sich nicht rückgängig machen.', ok:'Zurücksetzen', danger:true})) return;
        try{ await RH.api('/api/cards', {body:{reset:true}}); boxes = {}; renderSetup(); $('pMsg').textContent = 'Lernstand zurückgesetzt.'; }catch(e){ $('pMsg').textContent = e.message; }
      };
    }else{
      st.classList.remove('is-hidden');
      st.innerHTML = 'Tipp: Mit einem <a class="link" href="anmeldung.html?next=ueben.html">Konto</a> merkt sich das Regelheft, welche Regeln du schon sicher kannst.';
    }
  }
  function pick(group, b){
    if(group === 'src') source = b.dataset.k; else count = +b.dataset.k;
    renderSetup();
    const again = $(group === 'src' ? 'pSource' : 'pCount').querySelector('.p-chip.on'); if(again) again.focus();
  }
  [['pSource', 'src'], ['pCount', 'cnt']].forEach(([id, group]) => {
    const box = $(id);
    box.addEventListener('click', e => { const b = e.target.closest('.p-chip'); if(b) pick(group, b); });
    box.addEventListener('keydown', e => {
      const keys = {ArrowRight:1, ArrowDown:1, ArrowLeft:-1, ArrowUp:-1};
      if(!keys[e.key]) return;
      const all = Array.from(box.querySelectorAll('.p-chip')), i = all.indexOf(document.activeElement); if(i < 0) return;
      e.preventDefault(); pick(group, all[(i + keys[e.key] + all.length) % all.length]);
    });
  });

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
    if(!deck.length){ $('pMsg').textContent = source === '__fav' ? 'Deine Merkliste ist noch leer. Tippe in einer Regel auf den Stern, um sie hier zu üben.' : 'Für diese Auswahl gibt es keine Karten.'; return; }
    $('pMsg').textContent = '';
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
    $('pNum').textContent = (idx + 1) + ' von ' + deck.length;
    setProgress(idx / deck.length * 100);
    const c = $('pCard');
    c.setAttribute('role', 'button'); c.setAttribute('tabindex', '0'); c.setAttribute('aria-label', 'Karte umdrehen: ' + r.title);
    c.classList.remove('is-flipped');
    c.focus({preventScroll:true});
  }
  function setProgress(pct){ $('pBar').style.width = pct + '%'; $('pProg').setAttribute('aria-valuenow', Math.round(pct)); }
  let peekHook = null;
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
    RH.zoomable($('pDiag'), r.title);
    // Die Rückseite enthält Links und Knöpfe: die Karte ist jetzt eine Gruppe, kein Knopf mehr
    const c = $('pCard');
    c.setAttribute('role', 'group'); c.removeAttribute('tabindex'); c.setAttribute('aria-label', 'Antwort: ' + r.title);
    c.classList.add('is-flipped'); RH.haptic(6);
    if(peekHook) peekHook();
    $('pBack').setAttribute('tabindex', '-1'); $('pBack').focus({preventScroll:true});
  }
  $('pCard').addEventListener('click', e => { if(e.target.closest('a')) return; flip(); });
  $('pCard').addEventListener('keydown', e => { if(!flipped && e.target === $('pCard') && (e.key === 'Enter' || e.key === ' ')){ e.preventDefault(); flip(); } });

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

  /* ---------- Wischen: Die Karte folgt dem Finger, wird dabei leicht grau und unscharf, ein Symbol blendet ein.
     Rechts = gewusst, links = nochmal. Beim ersten Mal „zeigt“ die Karte die Geste selbst (bis man sie einmal benutzt hat). ---------- */
  (function(){
    const card = $('pCard'), reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
    let x0 = 0, y0 = 0, dx = 0, drag = false, locked = false, pid = null, busy = false, peeking = 0, crossed = false;
    const SEEN = 'regelheft-swipe-seen';
    const seen = () => { try{ return +localStorage.getItem(SEEN) || 0; }catch(e){ return 0; } };
    const mark = n => { try{ localStorage.setItem(SEEN, String(n)); }catch(e){} };
    function clean(){
      cancelAnimationFrame(peeking); card.style.transform = ''; card.style.opacity = ''; card.style.transition = '';
      if(card.classList.contains('dragging')) card.classList.remove('dragging');      // nur anfassen, wenn nötig (jede Klassenänderung weckt den Beobachter unten)
      if(card.hasAttribute('data-swipe')) card.removeAttribute('data-swipe');
      card.style.removeProperty('--swipe');
    }
    function look(x, max){
      card.style.transform = 'translateX(' + x + 'px) rotate(' + (x / 28).toFixed(2) + 'deg)';
      card.setAttribute('data-swipe', x >= 0 ? 'know' : 'again');
      card.style.setProperty('--swipe', Math.min(1, Math.abs(x) / max).toFixed(2));
    }
    card.addEventListener('pointerdown', e => {
      if(!flipped || busy || e.pointerType === 'mouse' || e.target.closest('a, button, .tbl-wrap, .pre, .diagram-frame')) return;
      clean(); drag = true; locked = false; crossed = false; dx = 0; x0 = e.clientX; y0 = e.clientY; pid = e.pointerId;
    });
    card.addEventListener('pointermove', e => {
      if(!drag || e.pointerId !== pid) return;
      const mx = e.clientX - x0, my = e.clientY - y0;
      if(!locked){
        if(Math.abs(my) > 14 && Math.abs(my) > Math.abs(mx)){ drag = false; return; }
        if(Math.abs(mx) < 10) return;
        locked = true; try{ card.setPointerCapture(pid); }catch(_){} card.classList.add('dragging');
      }
      dx = mx;
      if(reduce()) card.style.setProperty('--swipe', Math.min(1, Math.abs(dx) / 110).toFixed(2)), card.setAttribute('data-swipe', dx > 0 ? 'know' : 'again');
      else look(dx, 110);
      if(!crossed && Math.abs(dx) > 110){ crossed = true; RH.haptic(10); } else if(crossed && Math.abs(dx) < 100) crossed = false;   // „rastet“ ein
    });
    function end(e){
      if(!drag || (e && e.pointerId !== pid)) return;
      drag = false;
      if(locked && Math.abs(dx) > 110){
        const good = dx > 0; busy = true; mark(3);
        if(reduce()){ clean(); busy = false; rate(good); return; }
        card.classList.remove('dragging');
        card.style.transition = 'transform .24s cubic-bezier(.4,0,1,1), opacity .24s';
        card.style.transform = 'translateX(' + (good ? 130 : -130) + '%) rotate(' + (good ? 14 : -14) + 'deg)'; card.style.opacity = '0';
        setTimeout(() => { clean(); busy = false; rate(good); }, 220);
      }else{
        if(reduce()){ clean(); return; }
        card.classList.remove('dragging');
        card.style.transition = 'transform .42s cubic-bezier(.2,1.3,.35,1)';                  // federt zurück
        card.style.transform = ''; card.removeAttribute('data-swipe');
        setTimeout(clean, 420);
      }
    }
    card.addEventListener('pointerup', end); card.addEventListener('pointercancel', end);

    // Die Karte macht die Geste einmal selbst vor: erst nach rechts (grün, Haken), dann nach links (Pfeil).
    peekHook = function(){
      const n = seen();
      if(n >= 3 || reduce() || !matchMedia('(pointer: coarse)').matches) return;
      mark(n + 1);
      const t0 = performance.now() + 750, D = 2200;
      const frame = t => {
        if(!flipped || drag || busy){ clean(); return; }
        const k = (t - t0) / D;
        if(k < 0){ peeking = requestAnimationFrame(frame); return; }
        if(k >= 1){ clean(); return; }
        const ph = k < .5 ? Math.sin(k * 2 * Math.PI) : -Math.sin((k - .5) * 2 * Math.PI);
        look(ph * 60, 60 / .8);
        peeking = requestAnimationFrame(frame);
      };
      peeking = requestAnimationFrame(frame);
    };
    // Falls eine neue Karte kommt, während die Andeutung läuft
    new MutationObserver(() => { if(!flipped && (card.hasAttribute('data-swipe') || card.style.transform)) clean(); }).observe(card, {attributes:true, attributeFilter:['class']});
  })();

  /* ---------- Ergebnis ---------- */
  function finish(){
    setProgress(100);
    $('pRun').classList.add('is-hidden'); $('pDone').classList.remove('is-hidden');
    $('pDoneBig').textContent = known + ' von ' + deck.length;
    $('pDoneSub').textContent = missed.length ? (known >= deck.length / 2 ? 'Stark! ' : 'Weiter so! ') + 'Die ' + missed.length + ' verpassten Karten kannst du gleich noch einmal üben.' : 'Alle gewusst. Stark!';
    $('pRepeat').classList.toggle('is-hidden', !missed.length);
    window.scrollTo(0, 0);
  }
  $('pRepeat').onclick = () => start(shuffle(missed.slice()));
  $('pNew').onclick = () => { $('pDone').classList.add('is-hidden'); $('pSetup').classList.remove('is-hidden'); renderSetup(); window.scrollTo(0, 0); };

  /* ---------- Start: Lernstand und Merkliste laden ---------- */
  function proGate(){
    if(!RH.needsPro('practice') || RH.hasAccess('practice')) return false;
    ['pSetup','pRun','pDone'].forEach(i => $(i).classList.add('is-hidden')); $('pPro').classList.remove('is-hidden');
    $('pProText').textContent = logged() ? 'Der Übungsmodus mit Karteikarten ist Teil von Regelheft Pro.' : 'Der Übungsmodus mit Karteikarten ist Teil von Regelheft Pro. Melde dich an, um Pro zu holen.';
    $('pProBtns').innerHTML = (logged() ? '' : '<a class="ai-btn ghost" href="anmeldung.html?next=ueben.html">Anmelden</a>') + '<a class="ai-btn" href="pro.html">Pro ansehen</a>';
    return true;
  }
  Promise.all([RH.configReady, RH.ready]).then(proGate);
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
