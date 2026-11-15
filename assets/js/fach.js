/* ============================================================
   Fach-Auswahl: Mathematik oder Physik.
   Muss NACH footer.js (und, falls geladen, nach regeln.js + physik.js) und VOR core.js/layout.js stehen.
   • Gewähltes Fach: ?fach=physik in der Adresse, sonst Regel-Link (#p12 = Physik), sonst zuletzt gewählt.
   • window.RULES     = Regeln des gewählten Fachs (benutzen index.js, ki.js, ueben.js)
   • window.RULES_ALL = alle Regeln beider Fächer (z. B. für Titel alter KI-Chats)
   • Umschalter erscheint überall, wo im HTML <div data-fach-switch></div> steht.
   ============================================================ */
const FACH = (function(){
  const LIST = {
    mathe:  {name: 'Mathematik', prefix: 'r'},
    physik: {name: 'Physik',     prefix: 'p'}
  };
  const KEY = 'regelheft-fach';
  const params = new URLSearchParams(location.search);
  let id = params.get('fach');
  if(!LIST[id]){
    const h = location.hash.slice(1);
    id = /^p\d+$/.test(h) ? 'physik' : /^r\d+$/.test(h) ? 'mathe' : null;
  }
  if(!LIST[id]){ try{ id = localStorage.getItem(KEY); }catch(e){} }
  if(!LIST[id]) id = 'mathe';
  try{ localStorage.setItem(KEY, id); }catch(e){}
  const name = LIST[id].name;

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
  if(window.RULES || window.RULES_PHYSIK){
    const mathe = prep(window.RULES_MATHE || window.RULES), physik = prep(window.RULES_PHYSIK);
    window.RULES_MATHE = mathe; window.RULES_PHYSIK = physik;
    window.RULES_ALL = mathe.concat(physik);
    window.RULES = id === 'physik' ? physik : mathe;
  }

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
    el.innerHTML = Object.keys(LIST).map(k => '<button type="button" data-fach="' + k + '" aria-pressed="' + (k === id) + '"'
      + (k === id ? ' class="on"' : '') + '>' + LIST[k].name + '</button>').join('');
    el.querySelectorAll('button').forEach(b => b.onclick = () => go(b.dataset.fach));
  });

  return {id, name, list: LIST, go};
})();
