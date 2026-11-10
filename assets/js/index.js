/* ============================================================
   Startseite: Suche, Filter, Regelliste, Regel-Detail, Aktuelles-Popup
   ============================================================ */
const RULES = window.RULES;
document.querySelectorAll('[data-icon]').forEach(el => { el.innerHTML = icon(el.dataset.icon, +el.dataset.size || 20); });

// ---- Merkliste (nur mit Konto): gespeichert wird nur die Regel-Kennung ----
let started = false;
const favs = new Set();
const FAV = '__fav', REC = '__recent', NOTE = '__notes';
const notes = {};       // Notizen pro Regel (nur mit Konto)
let recent = [];        // zuletzt geöffnete Regel-Kennungen, neueste zuerst (nur mit Konto)
const loggedIn = () => !!RH.user();
const canFav = () => loggedIn() && RH.feat('favorites'), canRecent = () => loggedIn() && RH.feat('recent'), canNote = () => loggedIn() && RH.feat('notes') && RH.hasAccess('notes');
const noteLocked = () => loggedIn() && RH.feat('notes') && !RH.hasAccess('notes');
let toastT;
function toast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2600);
}
async function toggleFav(id){
  if(!canFav()) return;
  const on = !favs.has(id);
  on ? favs.add(id) : favs.delete(id);
  refreshFavUI();
  try{ await RH.api('/api/favs', {body:{id, on}}); }
  catch(e){
    on ? favs.delete(id) : favs.add(id);      // zurücksetzen
    refreshFavUI();
    toast('Merkliste konnte nicht gespeichert werden.');
  }
}
function noteRecent(id){
  if(!RH.feat('recent')) return;
  if(!loggedIn()){ if(RH.isLoading()) RH.ready.then(() => noteRecent(id)); return; }
  recent = [id].concat(recent.filter(x => x !== id)).slice(0, 15);
  if(activeCat === REC) favDirty = true;           // Reihenfolge erst nach dem Schließen aktualisieren
  RH.api('/api/recent', {body:{id}}).catch(() => {});
}
let favDirty = false;
function refreshFavUI(){
  if(activeCat === FAV){
    // Liste erst neu aufbauen, wenn das Regel-Detail zu ist (sonst verschiebt sich „Vorherige/Nächste“)
    if(document.getElementById('overlay').classList.contains('open')) favDirty = true;
    else applyFilter();
  }else document.querySelectorAll('.fav-star').forEach(b => setStar(b, favs.has(b.dataset.id)));
  updateFavBtn();
}
function flushFav(){ flushNote(); if(favDirty){ favDirty = false; applyFilter(); } }

// ---- Notizen zur Regel (nur mit Konto, speichert automatisch) ----
const noteBox = document.getElementById('noteBox'), noteText = document.getElementById('noteText'), noteStatus = document.getElementById('noteStatus');
let notePending = null, noteTimer;
function updateNoteUI(){
  const r = filtered[currentIndex];
  document.getElementById('noteLock').classList.toggle('is-hidden', !noteLocked() || !r);
  noteBox.classList.toggle('is-hidden', !canNote() || !r);
  if(!canNote() || !r) return;
  noteText.value = notes[r.id] || '';
  noteStatus.textContent = '';
}
async function sendNote(id, text){
  noteStatus.textContent = 'Speichert …';
  try{ await RH.api('/api/notes', {body:{id, text}}); noteStatus.textContent = 'Gespeichert'; }
  catch(e){ noteStatus.textContent = e.message || 'Nicht gespeichert'; }
}
function flushNote(){
  clearTimeout(noteTimer);
  if(!notePending) return;
  const p = notePending; notePending = null;
  const t = p.text.trim();
  if(t) notes[p.id] = t; else delete notes[p.id];
  favDirty = true;                                  // Liste nach dem Schließen neu aufbauen (Notiz-Vorschau)
  sendNote(p.id, p.text);
}
noteText.addEventListener('input', () => {
  const r = filtered[currentIndex]; if(!r) return;
  notePending = {id:r.id, text:noteText.value};
  noteStatus.textContent = '…';
  clearTimeout(noteTimer); noteTimer = setTimeout(flushNote, 900);
});
noteText.addEventListener('blur', flushNote);
function updateFavBtn(){
  const b = document.getElementById('favBtn');
  b.classList.toggle('is-hidden', !canFav());
  if(!canFav() || currentIndex < 0 || !filtered[currentIndex]) return;
  const on = favs.has(filtered[currentIndex].id);
  b.classList.toggle('on', on);
  b.setAttribute('aria-pressed', on);
  b.setAttribute('aria-label', on ? 'Aus Merkliste entfernen' : 'Zur Merkliste hinzufügen');
  b.innerHTML = icon('star', 20, on);
}
function setStar(b, on){
  b.classList.toggle('on', on);
  b.setAttribute('aria-pressed', on);
  b.setAttribute('aria-label', on ? 'Aus Merkliste entfernen' : 'Zur Merkliste hinzufügen');
  b.innerHTML = icon('star', 22, on);
}
const categories = [];
RULES.forEach(r => { if(!categories.includes(r.category)) categories.push(r.category); });

let activeCat = "Alle";
let query = "";
let filtered = RULES.slice();
let currentIndex = -1;

const chipsEl = document.getElementById('chips');
let chipSig = '';
function renderChips(){
  const list = [{cat:'Alle', html:'Alle'}];
  if(canFav()) list.push({cat:FAV, html:icon('star',15,activeCat===FAV)+'Merkliste'});
  if(canRecent()) list.push({cat:REC, html:icon('clock',15)+'Zuletzt'});
  if(canNote()) list.push({cat:NOTE, html:icon('pencil',15)+'Notizen'});
  categories.forEach(c => list.push({cat:c, html:escapeHtml(c)}));
  const sig = list.map(x => x.cat).join('|') + '|' + (activeCat === FAV);
  if(sig !== chipSig){
    const hadFocus = chipsEl.contains(document.activeElement) ? document.activeElement.getAttribute('data-cat') : null;
    chipSig = sig;
    chipsEl.innerHTML = list.map(x => `<button type="button" class="chip" data-cat="${escapeAttr(x.cat)}" aria-pressed="false">${x.html}</button>`).join('');
    chipsEl.querySelectorAll('.chip').forEach(el => el.addEventListener('click', () => {
      activeCat = el.getAttribute('data-cat');
      applyFilter({animate:true});
      el.scrollIntoView({block:'nearest', inline:'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'});
    }));
    if(hadFocus !== null){ const again = Array.from(chipsEl.children).find(c => c.getAttribute('data-cat') === hadFocus); if(again) again.focus({preventScroll:true}); }
  }
  chipsEl.querySelectorAll('.chip').forEach(el => { const on = el.getAttribute('data-cat') === activeCat; el.classList.toggle('active', on); el.setAttribute('aria-pressed', on ? 'true' : 'false'); });
}

const escapeAttr = RH.esc;

function highlight(text, q){
  if(!q) return escapeHtml(text);
  const esc = escapeHtml(text);
  const qEsc = escapeHtml(q);
  try{
    const re = new RegExp('(' + qEsc.replace(/[.*+?^${}()|[\]\\]/g,'\\$&') + ')', 'ig');
    return esc.replace(re, '<mark>$1</mark>');
  }catch(e){ return esc; }
}

function applyFilter(opts){
  opts = opts || {};
  const q = query.trim().toLowerCase();
  filtered = RULES.filter(r=>{
    const catOk = activeCat === "Alle" || (activeCat === FAV ? favs.has(r.id) : activeCat === REC ? recent.includes(r.id) : activeCat === NOTE ? !!notes[r.id] : r.category === activeCat);
    if(!catOk) return false;
    if(!q) return true;
    return (r.title.toLowerCase().includes(q) || r.plain.toLowerCase().includes(q) || r.category.toLowerCase().includes(q));
  });
  if(q){
    // Rank so title matches always come before body/category-only matches.
    // 0 = title starts with query, 1 = title contains query, 2 = only body/category matches.
    const rank = (r) => {
      const t = r.title.toLowerCase();
      if(t.startsWith(q)) return 0;
      if(t.includes(q)) return 1;
      return 2;
    };
    filtered = filtered
      .map((r, idx) => ({ r, idx, rank: rank(r) }))
      .sort((a, b) => (a.rank - b.rank) || (a.idx - b.idx))
      .map(x => x.r);
  }
  if(activeCat === REC && !q) filtered.sort((a, b) => recent.indexOf(a.id) - recent.indexOf(b.id));   // neueste zuerst
  renderChips();
  renderList(opts.animate);
  document.getElementById('resultCount').textContent = filtered.length;
  document.getElementById('activeCatLabel').textContent = activeCat === 'Alle' ? '' : (activeCat === FAV ? 'Merkliste' : activeCat === REC ? 'Zuletzt geöffnet' : activeCat === NOTE ? 'Notizen' : activeCat);
}

function renderList(animate){
  const listEl = document.getElementById('list');
  const emptyEl = document.getElementById('emptyState');
  if(filtered.length === 0){
    listEl.innerHTML = '';
    const fav = activeCat === FAV && !query.trim(), rec = activeCat === REC && !query.trim(), nt = activeCat === NOTE && !query.trim();
    document.getElementById('emptyTitle').textContent = fav ? 'Noch nichts gemerkt' : rec ? 'Noch nichts geöffnet' : nt ? 'Noch keine Notizen' : 'Keine Treffer';
    document.getElementById('emptySub').textContent = fav ? 'Öffne eine Regel und tippe auf den Stern, um sie hier zu speichern.' : rec ? 'Regeln, die du öffnest, erscheinen hier.' : nt ? 'Öffne eine Regel und schreibe unten deine Notiz dazu.' : 'Versuch es mit einem anderen Suchbegriff.';
    emptyEl.style.display = 'block';
    document.getElementById('emptyReset').style.display = (query.trim() || activeCat !== 'Alle') ? '' : 'none';
    return;
  }
  emptyEl.style.display = 'none';
  const q = query.trim();
  listEl.innerHTML = filtered.map((r,idx) => `
    <div class="rule-card${animate ? ' anim' : ''}" role="listitem" data-id="${r.id}" style="${animate ? 'animation-delay:' + Math.min(idx*18,240) + 'ms' : ''}">
      <div class="row-top">
        <span class="cat-pill">${escapeHtml(r.category)}</span>
        ${canFav() ? '<button class="fav-star' + (favs.has(r.id) ? ' on' : '') + '" data-id="' + r.id + '" aria-pressed="' + favs.has(r.id) + '" aria-label="' + (favs.has(r.id) ? 'Aus Merkliste entfernen' : 'Zur Merkliste hinzufügen') + '">' + icon('star', 22, favs.has(r.id)) + '</button>' : ''}
      </div>
      <h3><a class="rule-link" href="index.html#${encodeURIComponent(r.id)}">${highlight(r.title, q)}</a></h3>
      <p>${highlight(r.excerpt, q)}</p>
      ${notes[r.id] ? '<div class="card-note">' + icon('pencil', 14) + '<span>' + escapeHtml(notes[r.id].replace(/\s+/g, ' ').slice(0, 90)) + '</span></div>' : ''}
    </div>
  `).join('');
  listEl.querySelectorAll('.rule-card').forEach(el=>{
    el.addEventListener('click', (e)=>{
      const star = e.target.closest('.fav-star');
      if(star){ e.stopPropagation(); toggleFav(star.dataset.id); return; }
      if(e.ctrlKey || e.metaKey || e.shiftKey || e.button === 1) return;      // „In neuem Tab öffnen“ bleibt möglich
      e.preventDefault();
      openDetail(el.getAttribute('data-id'), {log:true, from:el});
    });
  });
}

// ---- Math renderer (explicit syntax): {a/b} Bruch, √(..) √[n](..) Wurzel, ^(..) hoch, _(..) tief, ~(..) Periode ----

// ---- Regel-Detail (als Overlay; die Adresse bekommt #regel-id, damit man Regeln verlinken kann) ----
const overlayEl = document.getElementById('overlay');
let overlayPushed = false;
function ruleIdFromHash(){
  let h = ''; try{ h = decodeURIComponent(location.hash.slice(1)); }catch(e){}
  return RULES.some(r => r.id === h) ? h : null;
}
// Hintergrund „abschalten“, solange das Detail offen ist (Tastatur und Screenreader bleiben im Dialog)
const BG = () => Array.from(document.querySelectorAll('header.top, main, footer, #siteNotice'));
let lastFocus = null;
function lockBackground(on){
  BG().forEach(el => on ? el.setAttribute('inert', '') : el.removeAttribute('inert'));
  document.documentElement.classList.toggle('modal-open', on);
}
const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const overlayBody = overlayEl.querySelector('.overlay-body');
let closeTimer = 0, instantClose = false;
function openDetail(id, opts){
  opts = opts || {};
  let idx = filtered.findIndex(r => r.id === id);
  if(idx === -1){            // Regel ist durch Suche/Filter ausgeblendet -> Filter zurücksetzen
    activeCat = "Alle"; query = ""; searchInput.value = ""; clearBtn.style.display = 'none';
    applyFilter();
    idx = filtered.findIndex(r => r.id === id);
    if(idx === -1) return;
  }
  const wasOpen = overlayEl.classList.contains('open') && !overlayEl.classList.contains('closing');
  if(!wasOpen){ lastFocus = (document.activeElement && document.activeElement !== document.body) ? document.activeElement : null; }
  currentIndex = idx;
  showCurrent();
  if(!wasOpen){
    clearTimeout(closeTimer); overlayEl.classList.remove('closing'); overlayEl.style.cssText = '';
    if(opts.from && !still()){                                     // wächst aus der Karte heraus, auf die getippt wurde
      const b = opts.from.getBoundingClientRect();
      overlayEl.style.transformOrigin = (b.left + b.width / 2) + 'px ' + (b.top + b.height / 2) + 'px';
      overlayEl.classList.add('opening'); setTimeout(() => overlayEl.classList.remove('opening'), 400);
    }
  }
  overlayEl.classList.add('open');
  if(!wasOpen){
    lockBackground(true); document.getElementById('backBtn').focus({preventScroll:true});
    // Einmalig: Der Inhalt „deutet“ von selbst an, dass man wischen kann (statt Erklärtext)
    if(matchMedia('(pointer: coarse)').matches && !still() && filtered.length > 1){
      try{ if(!localStorage.getItem('regelheft-peek')){ localStorage.setItem('regelheft-peek', '1');
        setTimeout(() => { if(overlayEl.classList.contains('open')) overlayBody.animate([{transform:'none'}, {transform:'translateX(-30px)'}, {transform:'none'}], {duration:1000, easing:'ease-in-out'}); }, 1200); } }catch(e){}
    }
  }
  if(opts.log){ RH.logEv('open', id); noteRecent(id); }
  if(location.hash !== '#' + id){
    if(wasOpen) history.replaceState(null, '', '#' + id);
    else { history.pushState(null, '', '#' + id); overlayPushed = true; }
  }
}
function showCurrent(){
  flushNote();
  const r = filtered[currentIndex];
  document.getElementById('overlayCat').textContent = r.category;
  document.getElementById('overlayTitle').textContent = r.title;
  document.getElementById('overlayText').innerHTML = formatBody(r.body);
  const diagSection = document.getElementById('diagramSection');
  const diagFrame = document.getElementById('diagramFrame');
  if(r.diagram){
    diagFrame.innerHTML = r.diagram;
    RH.zoomable(diagFrame, r.title);
    diagSection.style.display = 'block';
  } else {
    diagFrame.innerHTML = '';
    diagSection.style.display = 'none';
  }
  document.getElementById('prevBtn').disabled = currentIndex <= 0;
  document.getElementById('nextBtn').disabled = currentIndex >= filtered.length - 1;
  document.getElementById('overlay').scrollTop = 0;
  updateFavBtn();
  updateNoteUI();
}


// Kam man über einen Link aus der KI-Seite (oder dem Dashboard)? Dann führt der Zurück-Pfeil dorthin zurück (zum Chat).
const FROM = {ki:'ki.html', dashboard:'dashboard.html', ueben:'ueben.html'};
const fromTarget = FROM[new URLSearchParams(location.search).get('from')] || null;
function hideOverlay(){
  const instant = instantClose; instantClose = false;
  lockBackground(false);
  const finish = () => { overlayEl.classList.remove('open', 'closing'); overlayEl.style.cssText = ''; };
  clearTimeout(closeTimer);
  if(instant || still() || !overlayEl.classList.contains('open')) finish();
  else {
    const card = document.querySelector('.rule-card[data-id="' + (filtered[currentIndex] ? filtered[currentIndex].id : '') + '"]');
    if(card){ const b = card.getBoundingClientRect(); if(b.bottom > 0 && b.top < innerHeight) overlayEl.style.transformOrigin = (b.left + b.width / 2) + 'px ' + (b.top + b.height / 2) + 'px'; }
    overlayEl.classList.add('closing'); closeTimer = setTimeout(finish, 230);
  }
  if(lastFocus && document.contains(lastFocus)) lastFocus.focus({preventScroll:true});
  else { const c = document.querySelector('.rule-card[data-id="' + (filtered[currentIndex] ? filtered[currentIndex].id : '') + '"] .rule-link'); if(c) c.focus({preventScroll:true}); }
  lastFocus = null;
}
function closeDetail(instant){
  if(instant === true) instantClose = true;
  document.getElementById('toast').classList.remove('show');
  if(overlayPushed){ overlayPushed = false; history.back(); return; }
  if(fromTarget && !location.search.includes('news=1')){
    if(history.length > 1) history.back(); else location.href = fromTarget;
    return;
  }
  hideOverlay(); flushFav();
  if(location.hash) history.replaceState(null, '', location.pathname + location.search);
}
window.addEventListener('popstate', () => {
  const id = ruleIdFromHash();
  if(id) openDetail(id);
  else { if(overlayEl.classList.contains('open')) hideOverlay(); overlayPushed = false; flushFav(); }
});
document.getElementById('backBtn').addEventListener('click', closeDetail);
function stepRule(delta){
  const n = currentIndex + delta; if(n < 0 || n >= filtered.length) return;
  currentIndex = n; showCurrent(); noteRecent(filtered[currentIndex].id); history.replaceState(null, '', '#' + filtered[currentIndex].id);
  overlayEl.scrollTop = 0; RH.haptic(6);
  if(!still()) overlayBody.animate([{transform:'translateX(' + (delta > 0 ? 56 : -56) + 'px)', opacity:0}, {transform:'none', opacity:1}], {duration:300, easing:'cubic-bezier(.2,.9,.25,1)'});
}
document.getElementById('prevBtn').addEventListener('click', () => stepRule(-1));
document.getElementById('nextBtn').addEventListener('click', () => stepRule(1));

const searchInput = document.getElementById('searchInput');
const clearBtn = document.getElementById('clearBtn');
searchInput.addEventListener('input', (e) => {
  query = e.target.value;
  clearBtn.style.display = query ? 'flex' : 'none';
  applyFilter();
  clearTimeout(qt);
  const v = query.trim().toLowerCase().replace(/\s+/g, ' ');
  qt = setTimeout(() => { if(v.length >= 2 && v !== lastQ){ lastQ = v; RH.logEv('search', v); } }, 1500);
});
let lastQ = '', qt;
searchInput.addEventListener('keydown', e => {
  if(e.key === 'Escape' && searchInput.value){ e.preventDefault(); clearBtn.click(); }
  else if(e.key === 'Enter'){ e.preventDefault(); if(matchMedia('(pointer: coarse)').matches) searchInput.blur(); }   // Tastatur wegklappen, Ergebnisse sehen
});
document.getElementById('emptyReset').addEventListener('click', () => { searchInput.value = ''; query = ''; clearBtn.style.display = 'none'; activeCat = 'Alle'; applyFilter({animate:true}); searchInput.focus(); });
clearBtn.addEventListener('click', () => {
  searchInput.value = '';
  query = '';
  clearBtn.style.display = 'none';
  applyFilter();
  searchInput.focus();
});

// ---- KI-Knopf: Link zur KI-Seite (ohne Konto: gesperrt, führt zur Anmeldung) ----
// ---- KI-Knopf neben der Suche (ohne Konto: gesperrt, führt zur Anmeldung) ----
const aiSq = document.getElementById('aiSq');
const practiceSq = document.getElementById('practiceSq'), shareBtn = document.getElementById('shareBtn');
function updatePractice(){
  const gated = RH.needsPro('practice'), locked = gated && !RH.hasAccess('practice');
  const hidden = !RH.feat('practice') || (gated && !RH.user());       // ohne Bezahl-Version: ohne Konto gar nicht sichtbar
  practiceSq.style.display = hidden ? 'none' : '';
  practiceSq.href = locked ? 'pro.html' : 'ueben.html';
  practiceSq.classList.toggle('has-crown', locked);
  document.getElementById('practiceCrown').classList.toggle('is-hidden', !locked);
  practiceSq.title = locked ? 'Üben (mit Pro)' : 'Üben mit Karteikarten';
  practiceSq.setAttribute('aria-label', locked ? 'Üben mit Karteikarten (mit Pro)' : 'Üben mit Karteikarten');
}
RH.onAuth(() => updatePractice());
function applyFeatureUI(){
  aiSq.style.display = (AI_CONFIG.enabled && RH.feat('ai')) ? '' : 'none';
  updatePractice();
  shareBtn.style.display = RH.feat('share') ? '' : 'none';
  if(!RH.feat('favorites') && activeCat === FAV) activeCat = 'Alle';
  if(!RH.feat('recent') && activeCat === REC) activeCat = 'Alle';
  if(!RH.feat('notes') && activeCat === NOTE) activeCat = 'Alle';
  if(started){ renderChips(); applyFilter(); }
  updateFavBtn(); updateNoteUI();
}
RH.onConfig(applyFeatureUI);
RH.onAuth((user, loading) => {
  const open = !!user || (loading && RH.hasToken());
  aiSq.href = open ? 'ki.html' : 'anmeldung.html?next=ki.html';
  aiSq.classList.toggle('locked', !open);
  document.getElementById('aiSqIcon').innerHTML = icon(open ? 'sparkles' : 'lock', 22);
  aiSq.setAttribute('aria-label', open ? 'KI-Aufgabenhilfe' : 'KI-Aufgabenhilfe (gesperrt – bitte anmelden)');
  aiSq.title = open ? 'KI-Aufgabenhilfe' : 'Gesperrt – bitte anmelden';
});

// ---- Merkliste laden, sobald ein Konto angemeldet ist (ohne Konto nicht verfügbar) ----
let favsFor = null;
RH.onAuth(async (user) => {
  if(!user){
    favs.clear(); favsFor = null;
    recent = [];
    Object.keys(notes).forEach(k => delete notes[k]);
    if(activeCat === FAV || activeCat === REC || activeCat === NOTE) activeCat = 'Alle';
    if(started){ renderChips(); applyFilter(); }
    updateFavBtn(); updateNoteUI();
    return;
  }
  if(favsFor === user.username) return;
  favsFor = user.username;
  try{ (await RH.api('/api/favs')).ids.forEach(id => favs.add(id)); }catch(e){}
  try{ Object.assign(notes, (await RH.api('/api/notes')).notes || {}); }catch(e){}
  try{ const ids = (await RH.api('/api/recent')).ids; recent = recent.concat(ids.filter(x => !recent.includes(x))).slice(0, 15); }catch(e){}
  if(started){ renderChips(); applyFilter(); }
  updateFavBtn(); updateNoteUI();
});
document.getElementById('favBtn').addEventListener('click', () => { const r = filtered[currentIndex]; if(r) toggleFav(r.id); });

// ---- Link zur Regel kopieren ----
document.getElementById('copyBtn').addEventListener('click', async () => {
  const r = filtered[currentIndex]; if(!r) return;
  const url = location.origin + location.pathname + '#' + r.id;
  let ok = false;
  try{ await navigator.clipboard.writeText(url); ok = true; }
  catch(e){
    const ta = document.createElement('textarea'); ta.value = url; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try{ ok = document.execCommand('copy'); }catch(_){}
    ta.remove();
  }
  if(ok){
    const b = document.getElementById('copyBtn'); b.innerHTML = icon('check', 20);
    setTimeout(() => { b.innerHTML = icon('link', 20); }, 1500);
    toast('Link kopiert');
  }else toast('Kopieren nicht möglich – Adresse oben aus der Leiste nehmen.');
});

// ---- Aktuelles-Popup (Inhalt: config.js -> NEWS) ----
const newsEl = document.getElementById('newsOverlay');
// Das Popup erscheint nur, wenn es etwas Neues gibt: gemerkt wird, welche Fassung schon gesehen wurde.
const newsKey = n => 'regelheft-news:' + [n.title, n.date, (n.items || []).join('|')].join('~').slice(0, 400);
let newsFocus = null;
function closeNews(){
  const n = RH.cfg().news; try{ if(n) localStorage.setItem(newsKey(n), '1'); }catch(e){}
  newsEl.classList.remove('open'); document.body.style.overflow = '';
  if(!overlayEl.classList.contains('open')) BG().forEach(el => el.removeAttribute('inert'));
  if(newsFocus && document.contains(newsFocus)) newsFocus.focus({preventScroll:true}); newsFocus = null;
}
function openNews(){
  newsFocus = document.activeElement && document.activeElement !== document.body ? document.activeElement : null;
  const NEWS_ = RH.cfg().news;
  document.getElementById('newsTitle').textContent = NEWS_.title;
  document.getElementById('newsDate').textContent = NEWS_.date;
  const ul = document.getElementById('newsList'); ul.innerHTML = '';
  NEWS_.items.forEach(t => { const li = document.createElement('li'); li.textContent = t; ul.appendChild(li); });
  newsEl.classList.add('open'); document.body.style.overflow = 'hidden';
  BG().forEach(el => el.setAttribute('inert', ''));
  document.getElementById('newsClose').focus({preventScroll:true});
}
document.getElementById('newsClose').addEventListener('click', closeNews);
newsEl.addEventListener('click', e => { if(e.target === newsEl) closeNews(); });
const typing = t => t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
document.addEventListener('keydown', e => {
  if(e.key === 'Escape'){
    if(newsEl.classList.contains('open')) closeNews();
    else if(overlayEl.classList.contains('open')) closeDetail();
    return;
  }
  if(e.ctrlKey || e.metaKey || e.altKey || typing(e.target) || newsEl.classList.contains('open')) return;
  if(overlayEl.classList.contains('open')){
    if(e.key === 'ArrowLeft'){ e.preventDefault(); document.getElementById('prevBtn').click(); }
    else if(e.key === 'ArrowRight'){ e.preventDefault(); document.getElementById('nextBtn').click(); }
  }else if(e.key === '/'){ e.preventDefault(); searchInput.focus(); searchInput.select(); }
});

// ---- Gesten im Regel-Detail (der Inhalt folgt dem Finger):
//      nach links/rechts = nächste/vorherige Regel · von oben nach unten ziehen = schließen ----
(function(){
  let t = null;
  const reset = (spring) => {
    overlayBody.style.transition = spring ? 'transform .4s cubic-bezier(.2,1.3,.35,1), opacity .25s' : '';
    overlayBody.style.transform = ''; overlayBody.style.opacity = '';
    overlayEl.style.transition = spring ? 'transform .4s cubic-bezier(.2,1.3,.35,1), border-radius .3s' : '';
    overlayEl.style.transform = ''; overlayEl.style.borderRadius = '';
    overlayEl.classList.remove('dragging-down');
    if(spring) setTimeout(() => { overlayBody.style.transition = ''; overlayEl.style.transition = ''; }, 420);
  };
  overlayEl.addEventListener('touchstart', e => {
    if(e.touches.length !== 1){ t = null; return; }
    const p = e.touches[0];
    t = {x:p.clientX, y:p.clientY, at:Date.now(), mode:null, ok:!e.target.closest('.tbl-wrap, .pre, textarea, input, .lb')};
  }, {passive:true});
  overlayEl.addEventListener('touchmove', e => {
    if(!t || !t.ok || e.touches.length !== 1) return;
    const p = e.touches[0], dx = p.clientX - t.x, dy = p.clientY - t.y;
    if(!t.mode){
      if(Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
      if(String(window.getSelection && window.getSelection())){ t.mode = 'none'; return; }
      if(Math.abs(dx) > Math.abs(dy) * 1.5) t.mode = 'h';
      else if(dy > 0 && overlayEl.scrollTop <= 0) t.mode = 'v';
      else t.mode = 'none';
    }
    if(t.mode === 'h'){
      const atEdge = (dx < 0 && currentIndex >= filtered.length - 1) || (dx > 0 && currentIndex <= 0);
      overlayBody.style.transition = 'none';
      overlayBody.style.transform = 'translateX(' + (dx * (atEdge ? .22 : 1)) + 'px)';                  // am Ende der Liste zieht es gummiartig zurück
      overlayBody.style.opacity = String(1 - Math.min(.55, Math.abs(dx) / 480));
    }else if(t.mode === 'v'){
      overlayEl.classList.add('dragging-down'); overlayEl.style.transition = 'none';
      overlayEl.style.transform = 'translateY(' + dy + 'px) scale(' + (1 - Math.min(.07, dy / 2800)).toFixed(4) + ')';
      overlayEl.style.borderRadius = Math.min(30, dy / 5) + 'px';
    }
  }, {passive:true});
  overlayEl.addEventListener('touchend', e => {
    if(!t || !t.ok){ t = null; return; }
    const p = e.changedTouches[0], dx = p.clientX - t.x, dy = p.clientY - t.y, dt = Math.max(1, Date.now() - t.at), m = t.mode; t = null;
    if(m === 'h'){
      const go = Math.abs(dx) > 90 || (Math.abs(dx) > 40 && Math.abs(dx) / dt > .5);
      const delta = dx < 0 ? 1 : -1, ok = currentIndex + delta >= 0 && currentIndex + delta < filtered.length;
      if(go && ok){
        if(still()){ reset(false); stepRule(delta); return; }
        overlayBody.style.transition = 'transform .14s ease-in, opacity .14s'; overlayBody.style.transform = 'translateX(' + (delta > 0 ? -70 : 70) + 'px)'; overlayBody.style.opacity = '0';
        setTimeout(() => { reset(false); stepRule(delta); }, 130);
      }else reset(!still());
    }else if(m === 'v'){
      if(dy > 130 || (dy > 50 && dy / dt > .6)){
        if(still()){ reset(false); closeDetail(true); return; }
        overlayEl.style.transition = 'transform .26s cubic-bezier(.4,0,1,1)'; overlayEl.style.transform = 'translateY(105%)'; RH.haptic(8);
        setTimeout(() => closeDetail(true), 240);
      }else reset(!still());
    }
  }, {passive:true});
  overlayEl.addEventListener('touchcancel', () => { t = null; reset(!still()); }, {passive:true});
})();

// ---- Start ----
started = true;
renderChips();
applyFilter({animate:true});
const startId = ruleIdFromHash();
if(startId) openDetail(startId, {log:true});
const wantNews = new URLSearchParams(location.search).get('news') === '1';
let cameFromHere = false;
try{ cameFromHere = !!document.referrer && new URL(document.referrer).origin === location.origin; }catch(e){}
let seenNews = false;
RH.configReady.then(() => {
  const n = RH.cfg().news;
  try{ seenNews = !!(n && localStorage.getItem(newsKey(n))); }catch(e){}
  if(n && n.enabled && n.items.length && (wantNews || (!cameFromHere && !startId && !seenNews))) openNews();
});
if(wantNews) history.replaceState(null, '', location.pathname + location.hash);


// ---- Regel als Bild teilen (Bild wird im Browser erzeugt, nichts wird hochgeladen) ----
let h2cPromise;
function loadH2C(){
  if(window.html2canvas) return Promise.resolve();
  return h2cPromise || (h2cPromise = new Promise((res, rej) => {
    const sc = document.createElement('script');
    sc.src = 'assets/js/vendor/html2canvas.min.js?v=1.4.1';
    sc.onload = res; sc.onerror = () => { h2cPromise = null; rej(new Error('load')); };
    document.head.appendChild(sc);
  }));
}
document.getElementById('shareBtn').addEventListener('click', async () => {
  const r = filtered[currentIndex]; if(!r) return;
  const btn = document.getElementById('shareBtn');
  if(btn.disabled) return;
  btn.disabled = true; toast('Bild wird erstellt …');
  let card;
  try{
    await loadH2C();
    if(document.fonts && document.fonts.ready) await document.fonts.ready;
    card = document.createElement('div');
    card.className = 'overlay-body share-card';
    card.innerHTML = '<span class="cat-pill">' + escapeHtml(r.category) + '</span><h2>' + escapeHtml(r.title) + '</h2><div>' + formatBody(r.body) + '</div>'
      + (r.diagram ? '<div class="diagram-section"><div class="label">Skizze</div><div class="diagram-frame">' + r.diagram + '</div></div>' : '')
      + '<div class="share-foot"><b>Regelheft Mathematik</b><span>' + escapeHtml(location.host || 'Regelheft') + '</span></div>';
    document.body.appendChild(card);
    const canvas = await html2canvas(card, {scale:2, backgroundColor:'#ffffff', logging:false, useCORS:true,
      // Das Bild wird immer im hellen Standard-Look gezeichnet (Heft-Look und Dunkelmodus der Seite spielen keine Rolle)
      onclone: doc => { const r = doc.documentElement; r.setAttribute('data-heft', 'off'); r.setAttribute('data-theme', 'light'); r.style.colorScheme = 'light'; }});
    const blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
    if(!blob) throw new Error('blob');
    const name = 'Regelheft-' + r.title.replace(/[^A-Za-z0-9ÄÖÜäöüß]+/g, '-').replace(/^-|-$/g, '').slice(0, 50) + '.png';
    const file = new File([blob], name, {type:'image/png'});
    if(navigator.canShare && navigator.canShare({files:[file]})){
      try{ await navigator.share({files:[file], title:r.title}); toast('Bild geteilt'); return; }
      catch(e){ if(e && e.name === 'AbortError'){ toast(''); document.getElementById('toast').classList.remove('show'); return; } }
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    toast('Bild gespeichert');
  }catch(e){
    toast('Das Bild konnte nicht erstellt werden.');
  }finally{
    if(card) card.remove();
    btn.disabled = false;
  }
});
