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
const canFav = () => loggedIn() && RH.feat('favorites'), canRecent = () => loggedIn() && RH.feat('recent'), canNote = () => loggedIn() && RH.feat('notes');
let toastT;
function toast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2000);
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
function renderChips(){
  let html = `<div class="chip ${activeCat==='Alle'?'active':''}" data-cat="Alle">Alle</div>`;
  if(canFav()) html += `<div class="chip ${activeCat===FAV?'active':''}" data-cat="${FAV}">${icon('star',15,activeCat===FAV)}Merkliste</div>`;
  if(canRecent()) html += `<div class="chip ${activeCat===REC?'active':''}" data-cat="${REC}">${icon('clock',15)}Zuletzt</div>`;
  if(canNote()) html += `<div class="chip ${activeCat===NOTE?'active':''}" data-cat="${NOTE}">${icon('pencil',15)}Notizen</div>`;
  categories.forEach(c=>{
    html += `<div class="chip ${activeCat===c?'active':''}" data-cat="${escapeAttr(c)}">${escapeHtml(c)}</div>`;
  });
  chipsEl.innerHTML = html;
  chipsEl.querySelectorAll('.chip').forEach(el=>{
    el.addEventListener('click', ()=>{
      activeCat = el.getAttribute('data-cat');
      applyFilter();
    });
  });
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

function applyFilter(){
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
  renderList();
  document.getElementById('resultCount').textContent = filtered.length;
  document.getElementById('activeCatLabel').textContent = activeCat === 'Alle' ? '' : (activeCat === FAV ? 'Merkliste' : activeCat === REC ? 'Zuletzt geöffnet' : activeCat === NOTE ? 'Notizen' : activeCat);
}

function renderList(){
  const listEl = document.getElementById('list');
  const emptyEl = document.getElementById('emptyState');
  if(filtered.length === 0){
    listEl.innerHTML = '';
    const fav = activeCat === FAV && !query.trim(), rec = activeCat === REC && !query.trim(), nt = activeCat === NOTE && !query.trim();
    document.getElementById('emptyTitle').textContent = fav ? 'Noch nichts gemerkt' : rec ? 'Noch nichts geöffnet' : nt ? 'Noch keine Notizen' : 'Keine Treffer';
    document.getElementById('emptySub').textContent = fav ? 'Öffne eine Regel und tippe auf den Stern, um sie hier zu speichern.' : rec ? 'Regeln, die du öffnest, erscheinen hier.' : nt ? 'Öffne eine Regel und schreibe unten deine Notiz dazu.' : 'Versuch es mit einem anderen Suchbegriff.';
    emptyEl.style.display = 'block';
    return;
  }
  emptyEl.style.display = 'none';
  const q = query.trim();
  listEl.innerHTML = filtered.map((r,idx) => `
    <div class="rule-card" data-id="${r.id}" style="animation-delay:${Math.min(idx*18,240)}ms">
      <div class="row-top">
        <span class="cat-pill">${escapeHtml(r.category)}</span>
        ${canFav() ? '<button class="fav-star' + (favs.has(r.id) ? ' on' : '') + '" data-id="' + r.id + '" aria-pressed="' + favs.has(r.id) + '" aria-label="' + (favs.has(r.id) ? 'Aus Merkliste entfernen' : 'Zur Merkliste hinzufügen') + '">' + icon('star', 22, favs.has(r.id)) + '</button>' : ''}
      </div>
      <h3>${highlight(r.title, q)}</h3>
      <p>${highlight(r.excerpt, q)}</p>
      ${notes[r.id] ? '<div class="card-note">' + icon('pencil', 14) + '<span>' + escapeHtml(notes[r.id].replace(/\s+/g, ' ').slice(0, 90)) + '</span></div>' : ''}
    </div>
  `).join('');
  listEl.querySelectorAll('.rule-card').forEach(el=>{
    el.addEventListener('click', (e)=>{
      const star = e.target.closest('.fav-star');
      if(star){ e.stopPropagation(); toggleFav(star.dataset.id); return; }
      openDetail(el.getAttribute('data-id'), {log:true});
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
function openDetail(id, opts){
  opts = opts || {};
  let idx = filtered.findIndex(r => r.id === id);
  if(idx === -1){            // Regel ist durch Suche/Filter ausgeblendet -> Filter zurücksetzen
    activeCat = "Alle"; query = ""; searchInput.value = ""; clearBtn.style.display = 'none';
    applyFilter();
    idx = filtered.findIndex(r => r.id === id);
    if(idx === -1) return;
  }
  const wasOpen = overlayEl.classList.contains('open');
  currentIndex = idx;
  showCurrent();
  overlayEl.classList.add('open');
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
function closeDetail(){
  document.getElementById('toast').classList.remove('show');
  if(overlayPushed){ overlayPushed = false; history.back(); return; }
  if(fromTarget && !location.search.includes('news=1')){
    if(history.length > 1) history.back(); else location.href = fromTarget;
    return;
  }
  overlayEl.classList.remove('open'); flushFav();
  if(location.hash) history.replaceState(null, '', location.pathname + location.search);
}
window.addEventListener('popstate', () => {
  const id = ruleIdFromHash();
  if(id) openDetail(id);
  else { overlayEl.classList.remove('open'); overlayPushed = false; flushFav(); }
});
document.getElementById('backBtn').addEventListener('click', closeDetail);
document.getElementById('prevBtn').addEventListener('click', () => {
  if(currentIndex > 0){ currentIndex--; showCurrent(); noteRecent(filtered[currentIndex].id); history.replaceState(null, '', '#' + filtered[currentIndex].id); }
});
document.getElementById('nextBtn').addEventListener('click', () => {
  if(currentIndex < filtered.length - 1){ currentIndex++; showCurrent(); noteRecent(filtered[currentIndex].id); history.replaceState(null, '', '#' + filtered[currentIndex].id); }
});

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
function applyFeatureUI(){
  aiSq.style.display = (AI_CONFIG.enabled && RH.feat('ai')) ? '' : 'none';
  practiceSq.style.display = RH.feat('practice') ? '' : 'none';
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
function closeNews(){ newsEl.classList.remove('open'); document.body.style.overflow = ''; }
function openNews(){
  const NEWS_ = RH.cfg().news;
  document.getElementById('newsTitle').textContent = NEWS_.title;
  document.getElementById('newsDate').textContent = NEWS_.date;
  const ul = document.getElementById('newsList'); ul.innerHTML = '';
  NEWS_.items.forEach(t => { const li = document.createElement('li'); li.textContent = t; ul.appendChild(li); });
  newsEl.classList.add('open'); document.body.style.overflow = 'hidden';
}
document.getElementById('newsClose').addEventListener('click', closeNews);
newsEl.addEventListener('click', e => { if(e.target === newsEl) closeNews(); });
document.addEventListener('keydown', e => {
  if(e.key !== 'Escape') return;
  if(newsEl.classList.contains('open')) closeNews();
  else if(overlayEl.classList.contains('open')) closeDetail();
});

// ---- Start ----
started = true;
renderChips();
applyFilter();
const startId = ruleIdFromHash();
if(startId) openDetail(startId, {log:true});
const wantNews = new URLSearchParams(location.search).get('news') === '1';
let cameFromHere = false;
try{ cameFromHere = !!document.referrer && new URL(document.referrer).origin === location.origin; }catch(e){}
RH.configReady.then(() => { const n = RH.cfg().news; if(n && n.enabled && n.items.length && (wantNews || (!cameFromHere && !startId))) openNews(); });
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
    const canvas = await html2canvas(card, {scale:2, backgroundColor:'#ffffff', logging:false, useCORS:true});
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
