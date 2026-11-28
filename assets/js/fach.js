/* ============================================================
   Fach-Auswahl: Mathematik, Physik, Chemie oder Biologie.
   Muss NACH footer.js und NACH den Regeldateien (regeln.js, physik.js, chemie.js, biologie.js) und VOR core.js/layout.js stehen.
   • Gewähltes Fach: ?fach=physik in der Adresse, sonst Regel-Link (#p12 = Physik), sonst zuletzt gewählt.
   • window.RULES     = Regeln des gewählten Fachs (benutzen index.js, ki.js, ueben.js)
   • window.RULES_ALL = alle Regeln aller Fächer (z. B. für Titel alter KI-Chats)
   • Neues Fach: Eintrag in LIST (Name + Anfangsbuchstabe der Regel-IDs), Datei mit window.RULES_<FACH> laden, Eintrag in DATA, ggf. FAECHER im worker.js und Bereiche in bereiche.js.
   • Umschalter erscheint überall, wo im HTML <div data-fach-switch></div> steht.
   ============================================================ */
const FACH = (function(){
  const LIST = {
    mathe:    {name: 'Mathematik', prefix: 'r'},
    physik:   {name: 'Physik',     prefix: 'p'},
    chemie:   {name: 'Chemie',     prefix: 'c'},
    biologie: {name: 'Biologie',   prefix: 'b'}
  };
  // Regeldaten je Fach (nur Fächer, deren Datei auf der Seite geladen wurde)
  const DATA = {mathe: window.RULES_MATHE || window.RULES, physik: window.RULES_PHYSIK, chemie: window.RULES_CHEMIE, biologie: window.RULES_BIOLOGIE};
  const KEY = 'regelheft-fach';
  const params = new URLSearchParams(location.search);
  let id = params.get('fach');
  if(!LIST[id]){
    const h = location.hash.slice(1);
    const m = /^([a-z])x?\d+$/.exec(h);   // r12, p3, c7, b2 und Community-Einträge wie cx4
    id = (m && Object.keys(LIST).find(k => LIST[k].prefix === m[1])) || null;
  }
  if(!LIST[id]){ try{ id = localStorage.getItem(KEY); }catch(e){} }
  if(!LIST[id]) id = 'mathe';
  try{ localStorage.setItem(KEY, id); }catch(e){}

  /* ---------- Regeldaten ---------- */
  // Text ohne Formatzeichen (für Suche) und kurze Vorschau, falls in den Daten nicht vorhanden
  function plainOf(body){
    return body.split('\n').filter(l => l.trim()).map(l => {
      if(l.startsWith('T: ')) return l.slice(3).split(' ;; ').map(r => r.split('§').join(', ')).join('; ');
      return l.replace(/^(\$ |## |! |- )/, '').replace(/ ‖ /g, ' – ');
    }).join('\n').replace(/\*\*/g, '').replace(/\{([^{}]*)\}/g, '$1').replace(/\{([^{}]*)\}/g, '$1').replace(/[_^]\(([^()]*)\)/g, '$1').replace(/_/g, '');
  }
  function excerptOf(plain){
    let out = '';
    for(const l of plain.split('\n')){ out += (out ? ' ' : '') + l; if(out.length >= 150) break; }
    return out.length > 260 ? out.slice(0, 257).replace(/\s\S*$/, '') + ' …' : out;
  }
  const prep = list => (list || []).map(r => {
    const plain = r.plain || plainOf(r.body);
    return Object.assign({diagram: null}, r, {plain, excerpt: r.excerpt || excerptOf(plain)});
  });
  if(Object.values(DATA).some(Boolean)){
    const all = [];
    Object.keys(DATA).forEach(k => { if(DATA[k]){ DATA[k] = prep(DATA[k]); window['RULES_' + k.toUpperCase()] = DATA[k]; all.push(...DATA[k]); } });
    window.RULES_ALL = all;
    window.prepRules = prep;   // für nachgeladene Einträge (Community)
    if(!DATA[id]){ const first = Object.keys(DATA).find(k => DATA[k]); if(first) id = first; }
    window.RULES = DATA[id];
  }
  const name = LIST[id].name;

  /* ---------- Name des Fachs in Titel, Kopfzeile und Footer ---------- */
  if(id !== 'mathe'){
    document.title = document.title.replace('Regelheft Mathematik', 'Regelheft ' + name);
    document.querySelectorAll('.brand h1 span').forEach(s => { s.textContent = ' ' + name; });
    if(typeof FOOTER !== 'undefined' && FOOTER.brand) FOOTER.brand[1] = name;
  }

  /* ---------- Umschalter ---------- */
  function go(to){
    if(to === id) return;
    try{ localStorage.setItem(KEY, to); }catch(e){}
    const p = new URLSearchParams(location.search); p.delete('fach');
    const q = p.toString();
    location.href = location.pathname + (q ? '?' + q : '');   // ohne #regel, die gehört zum alten Fach
  }
  // Mit weichem Ausblenden, damit der Wechsel nicht hart wirkt
  function goSoft(to){
    if(to === id) return;
    if(matchMedia('(prefers-reduced-motion: reduce)').matches){ go(to); return; }
    document.documentElement.classList.add('mv-leave');
    setTimeout(() => go(to), 150);
  }
  window.addEventListener('pageshow', e => { if(e.persisted) document.documentElement.classList.remove('mv-leave'); });

  /* ---------- Fach-Menü am Namen („Mathematik ⌄“) ----------
     Antippen öffnet ein Menü. Auf dem Namen drücken, über die Fächer ziehen und loslassen wählt direkt aus (wie bei Apple-Menüs). */
  const keys = Object.keys(LIST).filter(k => !Object.values(DATA).some(Boolean) || DATA[k]);
  const holders = document.querySelectorAll('[data-fach-switch]');
  const row = document.querySelector('.toprow');
  const brand = row && row.querySelector('.brand');
  if(holders.length && row && brand && keys.length > 1){
    holders.forEach(el => el.remove());
    brand.classList.add('has-fach-menu');
    const chev = '<svg class="fach-chev" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
    const check = '<svg class="fach-check" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 13l4 4L19 7"/></svg>';
    const wrap = document.createElement('div'); wrap.className = 'fach-wrap';
    wrap.innerHTML = '<div class="fach-anchor"><button type="button" class="fach-pill" aria-haspopup="menu" aria-expanded="false" aria-label="Fach wechseln, aktuell ' + name + '"><span>' + name + '</span>' + chev + '</button>'
      + '<div class="fach-menu" role="menu" aria-label="Fach wählen">' + keys.map(k => '<button type="button" role="menuitemradio" class="fach-item" data-fach="' + k + '" aria-checked="' + (k === id) + '"><span>' + LIST[k].name + '</span>' + check + '</button>').join('') + '</div></div>';
    brand.insertAdjacentElement('afterend', wrap);
    const pill = wrap.querySelector('.fach-pill'), menu = wrap.querySelector('.fach-menu'), items = [...menu.querySelectorAll('.fach-item')];
    const buzz = ms => { try{ if(window.mvBuzz) mvBuzz(ms); else if(navigator.vibrate) navigator.vibrate(ms); }catch(e){} };
    let isOpen = false, fresh = false, drag = null, hl = null;
    const setHl = it => { if(it === hl) return; if(hl) hl.classList.remove('hl'); hl = it; if(hl){ hl.classList.add('hl'); buzz(5); } };
    const open = () => { if(isOpen) return; isOpen = true; wrap.classList.add('open'); pill.setAttribute('aria-expanded', 'true'); };
    const close = () => { if(!isOpen) return; isOpen = false; wrap.classList.remove('open'); pill.setAttribute('aria-expanded', 'false'); setHl(null); };
    const choose = k => { close(); if(k !== id){ buzz(10); goSoft(k); } };
    const itemAt = (x, y) => { const el = document.elementFromPoint(x, y); return el && el.closest ? el.closest('.fach-item') : null; };
    pill.addEventListener('pointerdown', e => {
      if(e.pointerType === 'mouse' && e.button !== 0) return;
      fresh = !isOpen; if(fresh) open();
      drag = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: false };
      try{ pill.setPointerCapture(e.pointerId); }catch(_){}
    });
    pill.addEventListener('pointermove', e => {
      if(!drag || e.pointerId !== drag.id) return;
      if(!drag.moved && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 8) return;
      drag.moved = true; setHl(itemAt(e.clientX, e.clientY));
    });
    const up = e => {
      if(!drag || e.pointerId !== drag.id) return;
      const d = drag; drag = null;
      if(d.moved){
        const it = itemAt(e.clientX, e.clientY);
        const swallow = c => { c.preventDefault(); c.stopPropagation(); };
        pill.addEventListener('click', swallow, { capture: true, once: true }); setTimeout(() => pill.removeEventListener('click', swallow, true), 150);
        if(it) choose(it.dataset.fach); else close();
      }
    };
    pill.addEventListener('pointerup', up); pill.addEventListener('pointercancel', e => { drag = null; if(isOpen && fresh) close(); });
    pill.addEventListener('click', () => { if(fresh){ fresh = false; return; } isOpen ? close() : open(); });
    items.forEach(it => it.addEventListener('click', () => choose(it.dataset.fach)));
    document.addEventListener('pointerdown', e => { if(isOpen && !wrap.contains(e.target)) close(); });
    wrap.addEventListener('keydown', e => {
      if(e.key === 'Escape'){ close(); pill.focus(); }
      else if(e.key === 'ArrowDown' || e.key === 'ArrowUp'){
        e.preventDefault(); open();
        const i = items.indexOf(document.activeElement), n = e.key === 'ArrowDown' ? (i + 1) % items.length : (i <= 0 ? items.length - 1 : i - 1);
        items[n].focus();
      }
    });
  } else {
    // Seiten ohne Kopfzeile: einfache Auswahl wie bisher
    holders.forEach(el => {
      el.className = 'fach-switch'; el.setAttribute('role', 'group'); el.setAttribute('aria-label', 'Fach wählen');
      el.innerHTML = keys.map(k => '<button type="button" data-fach="' + k + '" aria-pressed="' + (k === id) + '"' + (k === id ? ' class="on"' : '') + '>' + LIST[k].name + '</button>').join('');
      el.querySelectorAll('button').forEach(b => b.onclick = () => goSoft(b.dataset.fach));
    });
  }

  return {id, name, list: LIST, go};
})();
