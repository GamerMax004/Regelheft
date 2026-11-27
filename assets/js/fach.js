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
  document.querySelectorAll('[data-fach-switch]').forEach(el => {
    el.className = 'fach-switch'; el.setAttribute('role', 'group'); el.setAttribute('aria-label', 'Fach wählen');
    el.innerHTML = Object.keys(LIST).filter(k => !Object.values(DATA).some(Boolean) || DATA[k]).map(k => '<button type="button" data-fach="' + k + '" aria-pressed="' + (k === id) + '"'
      + (k === id ? ' class="on"' : '') + '>' + LIST[k].name + '</button>').join('');
    el.querySelectorAll('button').forEach(b => b.onclick = () => go(b.dataset.fach));
  });

  return {id, name, list: LIST, go};
})();
