/* ============================================================
   Startseite: Suche, Filter, Regelliste, Regel-Detail, Aktuelles-Popup
   ============================================================ */
const RULES = window.RULES;
document.querySelectorAll('[data-icon]').forEach(el => { el.innerHTML = icon(el.dataset.icon, +el.dataset.size || 20); });

// ---- Merkliste (nur mit Konto): gespeichert wird nur die Regel-Kennung ----
let started = false;
const favs = new Set();
const FAV = '__fav', REC = '__recent';
let recent = [];        // zuletzt geöffnete Regel-Kennungen, neueste zuerst (nur mit Konto)
const loggedIn = () => !!RH.user();
let toastT;
function toast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2000);
}
async function toggleFav(id){
  if(!loggedIn()) return;
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
function flushFav(){ if(favDirty){ favDirty = false; applyFilter(); } }
function updateFavBtn(){
  const b = document.getElementById('favBtn');
  b.classList.toggle('is-hidden', !loggedIn());
  if(!loggedIn() || currentIndex < 0 || !filtered[currentIndex]) return;
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
  if(loggedIn()) html += `<div class="chip ${activeCat===FAV?'active':''}" data-cat="${FAV}">${icon('star',15,activeCat===FAV)}Merkliste</div>`;
  if(loggedIn()) html += `<div class="chip ${activeCat===REC?'active':''}" data-cat="${REC}">${icon('clock',15)}Zuletzt</div>`;
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

const escapeHtml = RH.esc;
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
    const catOk = activeCat === "Alle" || (activeCat === FAV ? favs.has(r.id) : activeCat === REC ? recent.includes(r.id) : r.category === activeCat);
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
  document.getElementById('activeCatLabel').textContent = activeCat === 'Alle' ? '' : (activeCat === FAV ? 'Merkliste' : activeCat === REC ? 'Zuletzt geöffnet' : activeCat);
}

function renderList(){
  const listEl = document.getElementById('list');
  const emptyEl = document.getElementById('emptyState');
  if(filtered.length === 0){
    listEl.innerHTML = '';
    const fav = activeCat === FAV && !query.trim(), rec = activeCat === REC && !query.trim();
    document.getElementById('emptyTitle').textContent = fav ? 'Noch nichts gemerkt' : rec ? 'Noch nichts geöffnet' : 'Keine Treffer';
    document.getElementById('emptySub').textContent = fav ? 'Öffne eine Regel und tippe auf den Stern, um sie hier zu speichern.' : rec ? 'Regeln, die du öffnest, erscheinen hier.' : 'Versuch es mit einem anderen Suchbegriff.';
    emptyEl.style.display = 'block';
    return;
  }
  emptyEl.style.display = 'none';
  const q = query.trim();
  listEl.innerHTML = filtered.map((r,idx) => `
    <div class="rule-card" data-id="${r.id}" style="animation-delay:${Math.min(idx*18,240)}ms">
      <div class="row-top">
        <span class="cat-pill">${escapeHtml(r.category)}</span>
        ${r.diagram ? '<span class="diag-dot" title="mit Skizze"></span>' : ''}
        ${loggedIn() ? '<button class="fav-star' + (favs.has(r.id) ? ' on' : '') + '" data-id="' + r.id + '" aria-pressed="' + favs.has(r.id) + '" aria-label="' + (favs.has(r.id) ? 'Aus Merkliste entfernen' : 'Zur Merkliste hinzufügen') + '">' + icon('star', 22, favs.has(r.id)) + '</button>' : ''}
      </div>
      <h3>${highlight(r.title, q)}</h3>
      <p>${highlight(r.excerpt, q)}</p>
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
const SUP_MAP = {'⁰':'0','¹':'1','²':'2','³':'3','⁴':'4','⁵':'5','⁶':'6','⁷':'7','⁸':'8','⁹':'9','⁺':'+','⁻':'−'};
const CLOSERS = {'{':'}','(':')','[':']'};
function matchClose(s, i){
  const open = s[i], close = CLOSERS[open];
  let d = 0;
  for(let k=i;k<s.length;k++){
    if(s[k]===open) d++;
    else if(s[k]===close){ d--; if(d===0) return k; }
  }
  return -1;
}
function topSlash(s){
  let d = 0;
  for(let k=0;k<s.length;k++){
    const c = s[k];
    if(c==='('||c==='{'||c==='[') d++;
    else if(c===')'||c==='}'||c===']') d--;
    else if(c==='/' && d===0) return [s.slice(0,k), s.slice(k+1)];
  }
  return null;
}
function isLetter(ch){ return /[A-Za-zÄÖÜäöüßα-ωΑ-Ω]/.test(ch||''); }
function isMinus(s,i){
  const p = i===0 ? ' ' : s[i-1], n = s[i+1] || ' ';
  if(p===' ' && n===' ') return true;
  const prevOp = i===0 || /[\s(\[{=+·*\/;,:|⇒⇔→<>≤≥≠±^_]/.test(p);
  if(prevOp) return /[0-9A-Za-zα-ωΑ-Ω({√∞.]/.test(n);
  if(/[0-9({√∞]/.test(n)) return true;
  return isLetter(n) && !isLetter(s[i+2]) && !(isLetter(p) && isLetter(s[i-2]));
}
function parseMath(s){
  let out = '', i = 0;
  while(i < s.length){
    const c = s[i];
    if(c==='{'){
      const j = matchClose(s,i);
      if(j<0){ out += '{'; i++; continue; }
      const inner = s.slice(i+1,j), sp = topSlash(inner);
      if(sp) out += '<span class="frac"><span class="num">'+parseMath(sp[0].trim())+'</span><span class="den">'+parseMath(sp[1].trim())+'</span></span>';
      else out += '{'+parseMath(inner)+'}';
      i = j+1; continue;
    }
    if(c==='√'){
      i++; let idx = '';
      if(s[i]==='['){ const j = matchClose(s,i); idx = s.slice(i+1,j); i = j+1; }
      let rad;
      if(s[i]==='('){ const j = matchClose(s,i); rad = s.slice(i+1,j); i = j+1; }
      else { const m = /^[A-Za-z0-9²³πΔ]+/.exec(s.slice(i)); rad = m?m[0]:''; i += rad.length; }
      out += '<span class="sqrt">'+(idx?'<sup class="idx">'+parseMath(idx)+'</sup>':'')+'<span class="rad">√</span><span class="radicand">'+parseMath(rad)+'</span></span>';
      continue;
    }
    if(c==='~' && s[i+1]==='('){
      const j = matchClose(s,i+1);
      out += '<span class="per">'+parseMath(s.slice(i+2,j))+'</span>'; i = j+1; continue;
    }
    if(c==='^' || c==='_'){
      let inner;
      if(s[i+1]==='('){ const j = matchClose(s,i+1); inner = s.slice(i+2,j); i = j+1; }
      else {
        const m = /^[-+]?[A-Za-z0-9]+/.exec(s.slice(i+1));
        if(m){ inner = m[0]; i += 1+inner.length; } else { out += c; i++; continue; }
      }
      out += (c==='^'?'<sup>':'<sub>')+parseMath(inner)+(c==='^'?'</sup>':'</sub>');
      continue;
    }
    if(SUP_MAP[c]!==undefined){
      let run = '';
      while(i<s.length && SUP_MAP[s[i]]!==undefined){ run += SUP_MAP[s[i]]; i++; }
      out += '<sup>'+run+'</sup>'; continue;
    }
    if(c==='-' && isMinus(s,i)){ out += '−'; i++; continue; }
    out += c==='&'?'&amp;':c==='<'?'&lt;':c==='>'?'&gt;':c;
    i++;
  }
  return out;
}
function inline(s){
  // **fett** + Mathe
  return s.split('**').map((seg,k)=> k%2 ? '<b>'+parseMath(seg)+'</b>' : parseMath(seg)).join('');
}
function renderTable(spec){
  const rows = spec.split(' ;; ').map(r=>r.split('§'));
  let h = '<div class="tbl-wrap"><table class="tbl">';
  rows.forEach((cells,ri)=>{
    h += '<tr>' + cells.map(c=>{
      const t = c.replace(/\u200e/g,'').trim();
      return (ri===0?'<th>':'<td>') + inline(t) + (ri===0?'</th>':'</td>');
    }).join('') + '</tr>';
  });
  return h + '</table></div>';
}
function formatBody(body){
  const lines = body.split('\n').map(l=>l.replace(/\s+$/,'')).filter(l=>l.trim().length>0);
  let html = '', i = 0;
  while(i < lines.length){
    const L = lines[i];
    if(L.startsWith('$ ')){
      let items = '';
      while(i<lines.length && lines[i].startsWith('$ ')){
        const raw = lines[i].slice(2);
        const parts = raw.split(' ‖ ');
        items += '<div class="fl"><span class="fl-expr">'+inline(parts[0])+'</span>'+(parts[1]?'<span class="fl-note">'+inline(parts.slice(1).join(' ‖ '))+'</span>':'')+'</div>';
        i++;
      }
      html += '<div class="formula-block">'+items+'</div>';
    } else if(L.startsWith('% ')){
      let pre = '';
      while(i<lines.length && lines[i].startsWith('% ')){ pre += escapeHtml(lines[i].slice(2))+'\n'; i++; }
      html += '<pre class="pre">'+pre.trimEnd()+'</pre>';
    } else if(L.startsWith('- ')){
      let items = '';
      while(i<lines.length && lines[i].startsWith('- ')){ items += '<li>'+inline(lines[i].slice(2))+'</li>'; i++; }
      html += '<ul class="bullet-list">'+items+'</ul>';
    } else if(L.startsWith('! ')){
      html += '<div class="callout">'+inline(L.slice(2))+'</div>'; i++;
    } else if(L.startsWith('## ')){
      html += '<h4 class="subhead">'+inline(L.slice(3))+'</h4>'; i++;
    } else if(L.startsWith('T: ')){
      html += renderTable(L.slice(3)); i++;
    } else {
      const m = /^(\d)\)\s+(.*)$/.exec(L);
      if(m) html += '<p class="step"><span class="n">'+m[1]+'</span><span>'+inline(m[2])+'</span></p>';
      else html += '<p class="prose-line">'+inline(L)+'</p>';
      i++;
    }
  }
  return html;
}


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
}


// Kam man über einen Link aus der KI-Seite (oder dem Dashboard)? Dann führt der Zurück-Pfeil dorthin zurück (zum Chat).
const FROM = {ki:'ki.html', dashboard:'dashboard.html'};
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
const SPARK = '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.9 5.6L19.5 9.5l-5.6 1.9L12 17l-1.9-5.6L4.5 9.5l5.6-1.9L12 2zM19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15z"/></svg>';
const LOCK = '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5zm-3 8V7a3 3 0 1 1 6 0v3H9zm3 4a2 2 0 0 1 1 3.7V19h-2v-1.3A2 2 0 0 1 12 14z"/></svg>';
const aiBtn = document.getElementById('aiOpen');
if(!AI_CONFIG.enabled) aiBtn.style.display = 'none';
RH.onAuth((user, loading) => {
  const open = !!user || (loading && RH.hasToken());
  aiBtn.href = open ? 'ki.html' : 'anmeldung.html?next=ki.html';
  aiBtn.classList.toggle('locked', !open);
  document.getElementById('aiOpenIcon').innerHTML = open ? SPARK : LOCK;
  document.getElementById('aiOpenSub').textContent = open
    ? 'Lade ein Foto deiner Aufgabe hoch und finde die passenden Regeln!'
    : 'Funktion gesperrt! Melde dich an, um dieses Feature zu nutzen.';
});

// ---- Merkliste laden, sobald ein Konto angemeldet ist (ohne Konto nicht verfügbar) ----
let favsFor = null;
RH.onAuth(async (user) => {
  if(!user){
    favs.clear(); favsFor = null;
    recent = [];
    if(activeCat === FAV || activeCat === REC) activeCat = 'Alle';
    if(started){ renderChips(); applyFilter(); }
    updateFavBtn();
    return;
  }
  if(favsFor === user.username) return;
  favsFor = user.username;
  try{ (await RH.api('/api/favs')).ids.forEach(id => favs.add(id)); }catch(e){}
  try{ const ids = (await RH.api('/api/recent')).ids; recent = recent.concat(ids.filter(x => !recent.includes(x))).slice(0, 15); }catch(e){}
  if(started){ renderChips(); applyFilter(); }
  updateFavBtn();
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
  document.getElementById('newsTitle').textContent = NEWS.title;
  document.getElementById('newsDate').textContent = NEWS.date;
  const ul = document.getElementById('newsList'); ul.innerHTML = '';
  NEWS.items.forEach(t => { const li = document.createElement('li'); li.textContent = t; ul.appendChild(li); });
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
if(NEWS.enabled && (wantNews || (!cameFromHere && !startId))) openNews();
if(wantNews) history.replaceState(null, '', location.pathname + location.hash);


// ---- Regel als Bild teilen (Bild wird im Browser erzeugt, nichts wird hochgeladen) ----
let h2cPromise;
function loadH2C(){
  if(window.html2canvas) return Promise.resolve();
  return h2cPromise || (h2cPromise = new Promise((res, rej) => {
    const sc = document.createElement('script');
    sc.src = 'assets/js/vendor/html2canvas.min.js';
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
