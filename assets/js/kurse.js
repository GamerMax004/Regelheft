/* ============================================================
   Üben → Meine Kurse (Pro)
   Aus einem Regelheft-Thema oder eigenen Unterlagen (PDF, Fotos, GoodNotes, Text) macht die KI einen Kurs:
   • Lernpfad mit Lektionen (Fragen, Herzen, XP)
   • Karteikarten mit Wiederholung in Abständen – auch eigene Karten
   • Podcast mit wechselnden Moderatoren (normal oder „zum Einschlafen“ mit Schlaftimer)
   • Zusammenfassung
   Kurse, Fortschritt, Serie und XP gehören zum Konto: Sie liegen im Browser (IndexedDB, auch offline) und werden mit dem Worker abgeglichen (/api/kurse/…),
   damit sie auf jedem Gerät da sind. Nur die Podcast-Aufnahmen bleiben auf dem Gerät (zu groß) und lassen sich dort neu erstellen.
   Server: /api/upload-url, /api/kurs, /api/karten, /api/tts, /api/kurse/… im Worker (braucht GEMINI_API_KEY).
   ============================================================ */
(function(){
  const $ = id => document.getElementById(id);
  const esc = RH.esc;
  const sec = $('pcSec'), tabs = $('pTabs');
  if(!sec) return;
  const STANDALONE = !tabs;   // kurse.html: eigene Seite ohne Tab-Umschalter
  const RULES = window.RULES || [];
  const FACH_ID = (typeof FACH !== 'undefined' && FACH.id) || (RULES[0] && RULES[0].id[0] === 'p' ? 'physik' : 'mathe');
  const cats = []; RULES.forEach(r => { if(!cats.includes(r.category)) cats.push(r.category); });
  const DAY = 864e5;
  const shuffle = a => { a = a.slice(); for(let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  /* ================= Speicher (IndexedDB) ================= */
  const db = {
    open(){
      return this._p || (this._p = new Promise((res, rej) => {
        const r = indexedDB.open('regelheft-kurse', 1);
        r.onupgradeneeded = () => { r.result.createObjectStore('kurse', {keyPath:'id'}); r.result.createObjectStore('audio'); };
        r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
      }));
    },
    async run(store, mode, fn){
      const d = await this.open();
      return new Promise((res, rej) => { const q = fn(d.transaction(store, mode).objectStore(store)); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); });
    },
    all(){ return this.run('kurse', 'readonly', s => s.getAll()); },
    put(k){ return this.run('kurse', 'readwrite', s => s.put(k)); },
    del(id){ return Promise.all([this.run('kurse', 'readwrite', s => s.delete(id)), this.run('audio', 'readwrite', s => s.delete(id + ':normal')), this.run('audio', 'readwrite', s => s.delete(id + ':calm'))]); },
    audio(k){ return this.run('audio', 'readonly', s => s.get(k)); },
    putAudio(k, v){ return this.run('audio', 'readwrite', s => s.put(v, k)); },
    delAudio(k){ return this.run('audio', 'readwrite', s => s.delete(k)); }
  };
  const mine = list => list.filter(k => k.owner === (RH.user() && RH.user().username) && k.fach === FACH_ID).sort((a, b) => b.created - a.created);
  const save = k => { k.u = Date.now(); sync.queue(k); return db.put(k).catch(() => {}); };

  /* ================= Abgleich mit dem Konto (Worker) ================= */
  const sync = {
    off: false, running: null, timers: {}, latest: {}, st: null,
    me: () => RH.user() && RH.user().username,
    tombKey(){ return 'regelheft-kurse-del-' + this.me(); },
    tomb(){ try{ return JSON.parse(localStorage.getItem(this.tombKey())) || {}; }catch(e){ return {}; } },
    setTomb(t){ try{ localStorage.setItem(this.tombKey(), JSON.stringify(t)); }catch(e){} },
    fatal(e){ if(e && (e.status === 402 || e.status === 403 || e.status === 404)) this.off = true; },
    async push(k){
      try{ await RH.api('/api/kurse/item', {body:{id: k.id, updated: k.u || k.created || Date.now(), data: k}}); }
      catch(e){ this.fatal(e); }
    },
    queue(k){   // kurz warten, damit schnelle Änderungen (Karten bewerten …) in einer Anfrage landen
      if(this.off || !this.me() || k.owner !== this.me()) return;
      this.latest[k.id] = k; clearTimeout(this.timers[k.id]);
      this.timers[k.id] = setTimeout(() => { const x = this.latest[k.id]; delete this.latest[k.id]; if(x) this.push(x); }, 1500);
    },
    flush(){ Object.keys(this.latest).forEach(id => { clearTimeout(this.timers[id]); const x = this.latest[id]; delete this.latest[id]; this.push(x); }); },
    async remove(id){
      if(this.off || !this.me()) return;
      const t = this.tomb(); t[id] = Date.now(); this.setTomb(t);
      try{ await RH.api('/api/kurse/delete', {body:{id, updated: t[id]}}); const n = this.tomb(); delete n[id]; this.setTomb(n); }
      catch(e){ this.fatal(e); }   // ohne Verbindung: bleibt als Merkzettel und wird beim nächsten Abgleich nachgeholt
    },
    queueStats(){
      if(this.off || !this.me()) return; clearTimeout(this.st);
      this.st = setTimeout(() => RH.api('/api/kurse/stats', {body:{data: stats()}}).catch(e => this.fatal(e)), 1500);
    },
    mergeStats(a, b){
      if(!b) return a;
      const o = {xp: Math.max(a.xp || 0, b.xp || 0), streak: 0, last: null, day: null, dayXp: 0};
      const al = a.last || '', bl = b.last || '';
      if(al > bl) { o.last = a.last; o.streak = a.streak; } else if(bl > al) { o.last = b.last; o.streak = b.streak; } else { o.last = a.last; o.streak = Math.max(a.streak || 0, b.streak || 0); }
      const ad = a.day || '', bd = b.day || '';
      if(ad > bd) { o.day = a.day; o.dayXp = a.dayXp; } else if(bd > ad) { o.day = b.day; o.dayXp = b.dayXp; } else { o.day = a.day; o.dayXp = Math.max(a.dayXp || 0, b.dayXp || 0); }
      return o;
    },
    // gleicht lokal und Konto ab; true, wenn sich lokal etwas geändert hat
    all(){
      if(this.off || !this.me()) return Promise.resolve(false);
      if(this.running) return this.running;
      this.flush();
      this.running = (async () => {
        let changed = false;
        try{
          const me = this.me();
          const tomb = this.tomb();
          for(const id of Object.keys(tomb)){ try{ await RH.api('/api/kurse/delete', {body:{id, updated: tomb[id]}}); delete tomb[id]; }catch(e){ if(e.status === 402 || e.status === 403) throw e; } }
          this.setTomb(tomb);
          const srv = await RH.api('/api/kurse/sync');
          const local = (await db.all().catch(() => [])).filter(k => k.owner === me);
          const lmap = new Map(local.map(k => [k.id, k])), smap = new Map(srv.items.map(i => [i.id, i]));
          for(const i of srv.items){
            const l = lmap.get(i.id), lu = l ? (l.u || l.created || 0) : 0;
            if(tomb[i.id]) continue;
            if(i.deleted){ if(l && lu <= i.updated){ await db.del(i.id).catch(() => {}); changed = true; } continue; }
            if(!l || lu < i.updated){
              try{ const it = await RH.api('/api/kurse/item?id=' + encodeURIComponent(i.id)); if(it.data){ it.data.u = i.updated; it.data.owner = me; await db.put(it.data); changed = true; } }catch(e){ if(e.status !== 404) throw e; }
            }
          }
          for(const l of local){
            const i = smap.get(l.id), lu = l.u || l.created || 0;
            if(!i || lu > i.updated){ if(!l.u){ l.u = lu; await db.put(l).catch(() => {}); } await this.push(l); }
          }
          const ls = stats(), merged = this.mergeStats(ls, srv.stats);
          if(JSON.stringify(merged) !== JSON.stringify(Object.assign({xp:0, streak:0, last:null, day:null, dayXp:0}, ls))){ try{ localStorage.setItem(statsKey(), JSON.stringify(merged)); changed = true; }catch(e){} }
          if(!srv.stats || JSON.stringify(srv.stats) !== JSON.stringify(merged)) await RH.api('/api/kurse/stats', {body:{data: merged}}).catch(() => {});
        }catch(e){ this.fatal(e); }
        return changed;
      })().finally(() => { this.running = null; });
      return this.running;
    }
  };

  /* ================= Serie & XP (pro Konto) ================= */
  const statsKey = () => 'regelheft-lernen-' + ((RH.user() && RH.user().username) || 'gast');
  const today = () => new Date().toLocaleDateString('sv-SE');
  const yesterday = () => new Date(Date.now() - DAY).toLocaleDateString('sv-SE');
  const GOAL = 30;   // Tagesziel in XP
  function stats(){ try{ return Object.assign({xp:0, streak:0, last:null, day:null, dayXp:0}, JSON.parse(localStorage.getItem(statsKey()))); }catch(e){ return {xp:0, streak:0, last:null, day:null, dayXp:0}; } }
  function addXp(n){
    const s = stats();
    if(s.last !== today()){ s.streak = s.last === yesterday() ? s.streak + 1 : 1; s.last = today(); }
    if(s.day !== today()){ s.day = today(); s.dayXp = 0; }
    s.xp += n; s.dayXp += n;
    try{ localStorage.setItem(statsKey(), JSON.stringify(s)); }catch(e){}
    sync.queueStats();
    drawStats();
  }
  const dayXp = () => { const s = stats(); return s.day === today() ? s.dayXp : 0; };
  const streakNow = () => { const s = stats(); return s.last === today() || s.last === yesterday() ? s.streak : 0; };
  function drawStats(){
    const el = $('kStats'); if(!el) return;
    el.innerHTML = '<span title="Tage in Folge gelernt">' + icon('flame', 17) + '<b>' + streakNow() + '</b></span><span title="Erfahrungspunkte">' + icon('zap', 17) + '<b>' + stats().xp + '</b></span>';
  }
  // Text mit Index/Hochzahl: R_i → R<sub>i</sub>, x^2 → x<sup>2</sup>
  const fx = t => esc(t)
    .replace(/([A-Za-zÄÖÜäöüα-ωΑ-Ω)])_\{([^}]{1,12})\}/g, '$1<sub>$2</sub>')
    .replace(/([A-Za-zÄÖÜäöüα-ωΑ-Ω)])_([A-Za-z0-9]{1,4})\b/g, '$1<sub>$2</sub>')
    .replace(/\^\{([^}]{1,12})\}/g, '<sup>$1</sup>')
    .replace(/([A-Za-z0-9)])\^(-?[0-9a-z]{1,3})\b/g, '$1<sup>$2</sup>');

  /* ================= Tabs: Karteikarten | Meine Kurse (Altlast: Kurse laufen jetzt immer allein auf kurse.html) ================= */
  let active = STANDALONE ? 'pod' : 'cards';
  function setTab(t){
    active = t;
    tabs.querySelectorAll('[role=tab]').forEach(b => { const on = b.dataset.t === t; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); b.tabIndex = on ? 0 : -1; });
    stopAudio();
    if(t === 'pod'){ window.Practice && window.Practice.hideSetup(); sec.classList.remove('is-hidden'); route(); }
    else{ sec.classList.add('is-hidden'); window.Practice && window.Practice.showSetup(); }
    try{ sessionStorage.setItem('regelheft-ueben-tab', t); }catch(e){}
  }
  if(tabs){
    tabs.addEventListener('click', e => { const b = e.target.closest('[role=tab]'); if(b) setTab(b.dataset.t); });
    tabs.addEventListener('keydown', e => {
      if(e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault(); setTab(active === 'cards' ? 'pod' : 'cards'); tabs.querySelector('.on').focus();
    });
  }

  // Für ueben.js: nach einer Karteikarten-Runde zurück zum Kurs
  let view = {name:'list'};
  window.PodcastUI = {
    hide(){ stopAudio(); sec.classList.add('is-hidden'); if(tabs) tabs.classList.add('is-hidden'); const h = $('kHero'); if(h) h.classList.add('is-hidden'); },
    show(){ if(tabs) tabs.classList.remove('is-hidden'); const h = $('kHero'); if(h) h.classList.remove('is-hidden'); sec.classList.remove('is-hidden'); active = 'pod'; route(); window.scrollTo(0, 0); }
  };

  const shell = inner => '<div class="k-top"><span class="k-stats" id="kStats"></span></div>' + inner;
  async function route(){
    stopAudio();
    const u = RH.user();
    if(!u){ sec.innerHTML = '<div class="k-gate"><div class="k-gate-ic" aria-hidden="true">' + icon('library', 44) + '</div><h3>Deine eigenen Kurse</h3><p class="page-lead">Lade deine Unterlagen hoch – daraus entstehen ein Lernpfad, Karteikarten und ein Podcast.</p><a class="ai-btn" href="anmeldung.html?next=kurse.html">Anmelden</a></div>'; return; }
    if(RH.cfg().billing.enabled && !RH.isPro() && !RH.isPlus() && !u.admin){
      sec.innerHTML = '<div class="k-gate"><div class="k-gate-ic" aria-hidden="true">' + icon('crown', 44, true) + '</div><h3>Meine Kurse gibt es mit Plus oder Pro</h3><p class="page-lead">Mit Plus erstellst du Kurse zu Themen aus dem Regelheft – mit Lernpfad, Karteikarten, Regeln, Test und Podcast. Mit Pro lädst du zusätzlich eigene Lerndateien hoch (PDF, Fotos, GoodNotes; bis zu ' + MAX_FILES + ' pro Kurs).</p><a class="ai-btn" href="pro.html">Plus und Pro ansehen</a></div>';
      return;
    }
    if(view.name === 'kurs'){
      const k = (await db.all().catch(() => [])).find(x => x.id === view.id);
      if(k) return renderKurs(k, view.tab || 'pfad');
      view = {name:'list'};
    }
    renderList();
  }

  /* ================= Liste & Erstellen ================= */
  const MAX_FILES = 5;   // Pro: eigene Lerndateien pro Kurs (prüft auch der Worker)
  const canUpload = () => { const u = RH.user(); return !RH.cfg().billing.enabled || RH.isPro() || !!(u && u.admin); };
  let pending = [], mode = 'upload', topic = null, custom = '', formOpen = false;
  const READABLE = /\.(pdf|png|jpe?g|webp|gif|heic|heif|txt|md|csv)$/i;
  const fmtMB = n => (n / 1048576).toLocaleString('de-DE', {maximumFractionDigits:1}) + ' MB';
  const progressOf = k => { const all = lessonsOf(k); return all.length ? Object.keys(k.done || {}).length / all.length : 0; };
  const dueOf = k => k.flashcards.filter(c => (c.due || 0) <= Date.now()).length;

  // Ring für das Tagesziel (SVG, ohne Animation bei „Bewegung reduzieren“)
  const ring = (f, label) => { const r = 26, c = 2 * Math.PI * r, p = Math.max(0, Math.min(1, f));
    return '<svg class="k-ring" viewBox="0 0 64 64" role="img" aria-label="' + esc(label) + '"><circle cx="32" cy="32" r="' + r + '" class="k-ring-bg"/><circle cx="32" cy="32" r="' + r + '" class="k-ring-fg" stroke-dasharray="' + c.toFixed(1) + '" stroke-dashoffset="' + (c * (1 - p)).toFixed(1) + '"/></svg>'; };

  async function renderList(msg){
    view = {name:'list'}; sec.classList.remove('has-tabbar');
    if(!canUpload() && mode === 'upload') mode = 'topic';
    const list = mine(await db.all().catch(() => [])), now = Date.now();
    const dueAll = list.flatMap(k => k.flashcards.filter(c => (c.due || 0) <= now).map(c => ({k, c})));
    const dueCourses = new Set(dueAll.map(x => x.k.id)).size, dx = dayXp(), st = streakNow();
    const next = list.map(k => ({k, l: lessonsOf(k).find(l => !(l.key in (k.done || {})))})).find(x => x.l);
    const form =
      '<div class="k-new" id="kNewBox">' +
        '<h3 class="k-h">Neuen Kurs erstellen</h3>' +
        '<div class="pc-seg k-mode" role="radiogroup" aria-label="Woraus?"><button type="button" role="radio" data-m="upload" aria-checked="' + (mode === 'upload') + '" class="' + (mode === 'upload' ? 'on' : '') + '">Eigene Unterlagen' + (canUpload() ? '' : ' <span class="pc-badge">Pro</span>') + '</button><button type="button" role="radio" data-m="topic" aria-checked="' + (mode === 'topic') + '" class="' + (mode === 'topic' ? 'on' : '') + '">Thema aus dem Regelheft</button></div>' +
        (mode === 'upload'
          ? '<label class="k-drop" id="kDrop"><input type="file" id="kFile" multiple hidden accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.heic,.heif,.txt,.md,.goodnotes"><span class="k-drop-ic" aria-hidden="true">' + icon('file-text', 38) + '</span><b>Dateien hierher ziehen oder antippen</b><small>PDF (bis 50 MB) · Fotos von Mitschriften · GoodNotes · Text · höchstens ' + MAX_FILES + ' Dateien</small></label>' +
            (pending.length ? '<p class="k-filecount">' + pending.length + ' von ' + MAX_FILES + ' Dateien</p>' : '') +
            '<ul class="k-chips" id="kList">' + pending.map((f, i) => '<li>' + esc(f.name) + ' <button type="button" data-i="' + i + '" aria-label="Entfernen">×</button></li>').join('') + '</ul>' +
            '<textarea class="pc-input k-notes" id="kNotes" rows="3" placeholder="Optional: eigene Notizen oder Text einfügen …">' + esc(custom) + '</textarea>'
          : '<div class="p-chips" id="kCats" role="radiogroup" aria-label="Thema">' + cats.map(c => '<button type="button" class="p-chip' + (topic === c ? ' on' : '') + '" role="radio" aria-checked="' + (topic === c) + '" data-c="' + esc(c) + '">' + esc(c) + '</button>').join('') + '</div>' +
            '<input class="pc-input k-topic" id="kTopic" type="text" maxlength="100" placeholder="… oder eigenes Thema, z. B. Satz des Pythagoras" value="' + esc(custom) + '">') +
        '<div class="k-form-act"><button class="ai-btn k-create" id="kCreate" type="button">Kurs erstellen</button>' + (list.length ? '<button type="button" class="k-cancel" id="kCancel">Abbrechen</button>' : '') + '</div>' +
        '<div class="u-msg" id="kMsg" role="status" aria-live="polite">' + (msg ? esc(msg) : '') + '</div>' +
      '</div>';
    const showForm = !list.length || formOpen || pending.length || custom || topic || msg;
    const courses = list.length ? '<div class="k-courses">' + list.map(k => {
        const due = dueOf(k);
        return '<button type="button" class="k-card" data-id="' + esc(k.id) + '"><span class="k-card-em" aria-hidden="true">' + icon('book', 26) + '</span>' +
          '<span class="k-card-tx"><b>' + esc(k.title) + '</b><small>' + plural(lessonsOf(k).length, 'Lektion', 'Lektionen') + ' · ' + plural(k.flashcards.length, 'Karte', 'Karten') + ' · ' + plural((k.rules || []).length, 'Regel', 'Regeln') + (due ? ' · <strong>' + due + ' fällig</strong>' : '') + '</small>' +
          '<span class="k-bar"><i style="width:' + Math.round(progressOf(k) * 100) + '%"></i></span></span><span class="k-chev" aria-hidden="true">›</span></button>';
      }).join('') + '</div>' : '';
    const today =
      '<section class="k-today" aria-label="Heute">' +
        '<div class="k-goal">' + ring(dx / GOAL, dx + ' von ' + GOAL + ' XP heute') + '<div><small>Tagesziel</small><b>' + Math.min(dx, GOAL) + ' / ' + GOAL + ' XP</b><span>' + (dx >= GOAL ? 'Geschafft – stark!' : 'Noch ' + (GOAL - dx) + ' XP') + '</span></div></div>' +
        '<div class="k-tstats"><div><b>' + icon('flame', 18) + st + '</b><small>' + (st === 1 ? 'Tag' : 'Tage') + ' in Folge</small></div><div><b>' + icon('zap', 18) + stats().xp + '</b><small>XP gesamt</small></div><div><b>' + icon('layers', 18) + dueAll.length + '</b><small>fällig</small></div></div>' +
        '<div class="k-tact">' +
          (dueAll.length ? '<button type="button" class="ai-btn" id="kDueAll">' + plural(dueAll.length, 'fällige Karte', 'fällige Karten') + ' lernen' + (dueCourses > 1 ? ' · ' + dueCourses + ' Kurse' : '') + '</button>' : '') +
          (next ? '<button type="button" class="ai-btn' + (dueAll.length ? ' ghost' : '') + '" id="kNext" data-id="' + esc(next.k.id) + '">Weiter: ' + esc(next.l.title) + '</button>' : '') +
        '</div>' +
      '</section>';
    sec.innerHTML = (STANDALONE ? '' : '<div class="k-top"><span class="k-stats" id="kStats"></span></div>') +
      (list.length
        ? today + '<div class="k-sec-h"><h3 class="k-h">Deine Kurse</h3><button type="button" class="k-add-btn" id="kToNew">' + icon('plus', 16) + 'Neuer Kurs</button></div>' + courses + (showForm ? form : '')
        : '<div class="k-intro"><div class="k-intro-ic" aria-hidden="true">' + icon('library', 44) + '</div><h3>Dein erster Kurs</h3><p>Lade Unterlagen hoch oder wähle ein Thema – daraus entstehen ein Lernpfad, Karteikarten, Regeln, ein Test und ein Podcast.</p></div>' + form);
    drawStats();
    if(showForm){
    sec.querySelector('.k-mode').onclick = e => { const b = e.target.closest('[data-m]');
      if(b && b.dataset.m === 'upload' && !canUpload()){ $('kMsg').innerHTML = 'Eigene Lerndateien hochladen gibt es mit <a class="link" href="pro.html">Pro</a>. Mit Plus erstellst du Kurse zu Themen aus dem Regelheft.'; return; }
      if(b && b.dataset.m !== mode){ mode = b.dataset.m; custom = ''; renderList().then(() => $('kNewBox').scrollIntoView({block:'nearest'})); } };
    if(mode === 'upload'){
      const drop = $('kDrop'), input = $('kFile');
      const add = files => { const all = pending.concat([...files]); pending = all.slice(0, MAX_FILES);
        if(all.length > MAX_FILES){ renderList('Höchstens ' + MAX_FILES + ' Dateien pro Kurs – ' + (all.length - MAX_FILES) + ' wurden nicht übernommen.').then(() => $('kNewBox').scrollIntoView({block:'nearest'})); return; } renderList().then(() => $('kNewBox').scrollIntoView({block:'nearest'})); };
      input.onchange = () => add(input.files);
      ['dragenter', 'dragover'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('over'); }));
      ['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove('over'); }));
      drop.addEventListener('drop', e => add(e.dataTransfer.files));
      $('kList').onclick = e => { const i = e.target.dataset.i; if(i != null){ pending.splice(+i, 1); renderList().then(() => $('kNewBox').scrollIntoView({block:'nearest'})); } };
      $('kNotes').oninput = e => custom = e.target.value;
    }else{
      $('kCats').onclick = e => { const b = e.target.closest('.p-chip'); if(!b) return; topic = topic === b.dataset.c ? null : b.dataset.c; custom = '';
        $('kCats').querySelectorAll('.p-chip').forEach(x => { const on = x.dataset.c === topic; x.classList.toggle('on', on); x.setAttribute('aria-checked', on); }); $('kTopic').value = ''; };
      $('kTopic').oninput = e => { custom = e.target.value; if(custom.trim() && topic){ topic = null; $('kCats').querySelectorAll('.p-chip').forEach(b => { b.classList.remove('on'); b.setAttribute('aria-checked', 'false'); }); } };
      $('kTopic').onkeydown = e => { if(e.key === 'Enter') create(); };
    }
    $('kCreate').onclick = create;
    if($('kCancel')) $('kCancel').onclick = () => { formOpen = false; pending = []; custom = ''; topic = null; renderList(); };
    }
    if($('kToNew')) $('kToNew').onclick = () => { formOpen = true; renderList().then(() => { const b = $('kNewBox'); if(b) b.scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block:'start'}); }); };
    if($('kDueAll')) $('kDueAll').onclick = () => {
      window.Practice.start(shuffle(dueAll).map(({k, c}) => ({front: c.front, back: backOf(k, c), onRate: good => {
        c.box = good ? Math.min(5, (c.box || 0) + 1) : 0;
        c.due = good ? Date.now() + STEPS[c.box] * DAY : Date.now();
        save(k); addXp(1);
      }})), 'Alle Kurse');
    };
    if($('kNext')) $('kNext').onclick = async () => { const k = list.find(x => x.id === $('kNext').dataset.id); if(k){ renderKurs(k, 'pfad'); lesson(k, lessonsOf(k).find(l => !(l.key in (k.done || {})))); } };
    sec.querySelectorAll('.k-card').forEach(b => b.onclick = () => { view = {name:'kurs', id:b.dataset.id, tab:'pfad'}; route(); });
  }

  // Passende Regeln: ganzes Kapitel oder die Regeln mit den meisten Treffern zum eigenen Thema
  function rulesFor(t, isCat){
    let list;
    if(isCat) list = RULES.filter(r => r.category === t);
    else{
      const words = t.toLowerCase().split(/[^a-zäöüß0-9]+/).filter(w => w.length > 2);
      list = RULES.map(r => ({r, n: words.reduce((n, w) => n + (r.title.toLowerCase().includes(w) ? 3 : 0) + ((r.plain || '').toLowerCase().includes(w) ? 1 : 0), 0)}))
        .filter(x => x.n > 0).sort((a, b) => b.n - a.n).slice(0, 12).map(x => x.r);
    }
    return list.slice(0, 25).map(r => ({title: r.title, category: r.category, text: (r.plain || r.body || '').slice(0, 1200)}));
  }

  // GoodNotes-Dateien sind ZIP-Archive: eingebettete PDFs/Bilder herausholen (Handschrift selbst ist nicht lesbar)
  async function expand(files){
    const out = [];
    for(const f of files){
      if(!/\.goodnotes$/i.test(f.name)){ out.push(f); continue; }
      const { unzipSync } = await import('./vendor/fflate.js');
      let entries;
      try{ entries = unzipSync(new Uint8Array(await f.arrayBuffer()), {filter: e => READABLE.test(e.name) && !/thumbnail/i.test(e.name)}); }
      catch(e){ throw new Error('„' + f.name + '“ konnte nicht gelesen werden. Exportiere die Notiz in GoodNotes bitte als PDF.'); }
      const inner = Object.entries(entries).filter(([, d]) => d.length);
      if(!inner.length) throw new Error('In „' + f.name + '“ ist nur Handschrift gespeichert, die man nicht direkt lesen kann. Exportiere die Notiz in GoodNotes als PDF (Teilen → Exportieren → PDF) und lade die PDF hoch.');
      const base = f.name.replace(/\.goodnotes$/i, '');
      inner.forEach(([p, d]) => out.push(new File([d], base + ' – ' + p.split('/').pop())));
    }
    return out;
  }
  // Datei direkt zu Google hochladen (der Worker gibt nur die Upload-Adresse heraus)
  async function upload(file, onProgress){
    const start = await RH.api('/api/upload-url', {body:{name: file.name, size: file.size}});
    return new Promise((res, rej) => {
      const x = new XMLHttpRequest();
      x.open('POST', start.uploadUrl);
      x.setRequestHeader('X-Goog-Upload-Offset', '0');
      x.setRequestHeader('X-Goog-Upload-Command', 'upload, finalize');
      x.upload.onprogress = e => e.lengthComputable && onProgress(e.loaded);
      x.onload = () => { try{ const f = JSON.parse(x.responseText).file; if(x.status !== 200 || !f.name) throw 0; res({name: f.name, mimeType: f.mimeType || start.mimeType, label: file.name}); }catch(e){ rej(new Error('Upload von „' + file.name + '“ fehlgeschlagen.')); } };
      x.onerror = () => rej(new Error('Upload von „' + file.name + '“ fehlgeschlagen. Prüfe deine Internetverbindung.'));
      x.send(file);
    });
  }

  async function create(){
    const msg = $('kMsg'), isCat = mode === 'topic' && !!topic, t = mode === 'topic' ? (topic || custom).trim() : '', notes = mode === 'upload' ? custom.trim() : '';
    if(mode === 'upload' && !pending.length && !notes){ msg.textContent = 'Lade mindestens eine Datei hoch oder füge Text ein.'; return; }
    if(mode === 'topic' && !t){ msg.textContent = 'Wähle ein Thema oder gib ein eigenes ein.'; return; }
    const L = loader(sec, 'Kurs wird erstellt');
    try{
      // 1. Unterlagen hochladen – Restzeit aus der gemessenen Geschwindigkeit
      if(mode === 'upload' && pending.length && !canUpload()) throw new Error('Eigene Lerndateien hochladen gibt es nur mit Pro.');
      const files = mode === 'upload' ? await expand(pending) : [];
      if(files.length > MAX_FILES) throw new Error('In deinen Dateien stecken ' + files.length + ' einzelne Dateien (z. B. Seiten aus GoodNotes) – höchstens ' + MAX_FILES + ' pro Kurs. Exportiere die Notiz als eine PDF.');
      const total = files.reduce((n, f) => n + f.size, 0), up = [];
      const mb = total / 1048576, genSec = Math.min(170, Math.round(t ? 25 : 30 + mb * 6 + files.length * 4));   // geschätzte Dauer der Erstellung
      const upShare = files.length ? 0.3 : 0;   // Anteil des Hochladens am Balken
      let done = 0; const t0 = Date.now();
      for(let i = 0; i < files.length; i++){
        L.step('Hochladen · Datei ' + (i + 1) + ' von ' + files.length);
        up.push(await upload(files[i], loaded => {
          const sent = done + loaded, secs = (Date.now() - t0) / 1000, speed = sent / Math.max(secs, 0.5);
          L.progress(upShare * sent / total);
          L.eta((total - sent) / Math.max(speed, 1) + genSec, fmtMB(sent) + ' von ' + fmtMB(total));
        }));
        done += files[i].size;
      }
      // 2. Kurs erstellen lassen – Restzeit geschätzt, Balken nähert sich dem Ende
      const steps = files.length || notes ? ['Unterlagen werden gelesen', 'Inhalte werden zusammengefasst', 'Lernpfad wird erstellt', 'Karteikarten werden geschrieben', 'Podcast wird vorbereitet'] : ['Thema wird aufbereitet', 'Lernpfad wird erstellt', 'Karteikarten werden geschrieben', 'Podcast wird vorbereitet'];
      L.estimate(genSec, upShare, steps);
      const j = await RH.api('/api/kurs', {body:{topic: t, fach: FACH_ID, rules: t ? rulesFor(t, isCat) : [], files: up, notes}});
      if(j.error) throw new Error(j.error);
      const k = Object.assign(j, {id: 'k' + uid(), owner: RH.user().username, fach: FACH_ID, created: Date.now(), done: {},
        rules: (j.rules || []).map(r => ({id: uid(), title: r.title, text: r.text, example: r.example || ''})),
        flashcards: j.flashcards.map(c => ({id: uid(), front: c.front, back: c.back, box: 0, due: 0}))});
      await save(k);
      pending = []; custom = ''; topic = null; formOpen = false;
      view = {name:'kurs', id:k.id, tab:'pfad'}; route();
    }catch(e){ renderList(e.message || 'Das hat nicht geklappt. Bitte nochmal versuchen.').then(() => { const m = $('kMsg'); if(m) m.scrollIntoView({block:'center'}); }); }   // Fehlermeldung immer sichtbar machen
    finally{ L.stop(); }
  }

  /* ---------- Ladeanzeige: feste Größe (nichts springt), Fortschritt und ca. Restzeit ---------- */
  const etaText = s => s > 90 ? 'noch ca. ' + Math.round(s / 60) + ' Min.' : s > 5 ? 'noch ca. ' + Math.ceil(s / 5) * 5 + ' Sek.' : 'gleich fertig';
  function loader(host, title, compact){
    host.innerHTML = (compact ? '' : '') +
      '<div class="k-load' + (compact ? ' compact' : '') + '">' +
        (compact ? '' : '<div class="k-spin" aria-hidden="true"></div><h3 class="k-load-h">' + esc(title) + '</h3>') +
        '<p class="k-load-t" role="status" aria-live="polite"></p>' +
        '<div class="k-load-bar" role="progressbar" aria-label="Fortschritt" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i></i></div>' +
        '<p class="k-load-m"><span class="k-load-d"></span><span class="k-load-e"></span></p>' +
      '</div>';
    const box = host.querySelector('.k-load'), bar = box.querySelector('.k-load-bar'), q = c => box.querySelector(c);
    let timer = null;
    const api = {
      step(text){ q('.k-load-t').textContent = text; },
      progress(f){ const p = Math.round(Math.max(0, Math.min(1, f)) * 100); bar.firstChild.style.width = p + '%'; bar.setAttribute('aria-valuenow', p); },
      eta(sec, detail){ q('.k-load-e').textContent = etaText(sec); q('.k-load-d').textContent = detail || ''; },
      // Schätzung: Balken läuft gleichmäßig bis ~95 %, Schritte wechseln nach Zeit
      estimate(totalSec, from, steps){
        clearInterval(timer);
        const t0 = Date.now();
        const tick = () => {
          const t = (Date.now() - t0) / 1000, f = Math.min(0.95, t / totalSec);
          api.progress(from + (1 - from) * f);
          api.step(steps[Math.min(steps.length - 1, Math.floor(f * steps.length))]);
          api.eta(Math.max(0, totalSec - t), t > totalSec ? 'dauert etwas länger als gedacht' : 'Seite bitte offen lassen');
        };
        tick(); timer = setInterval(tick, 500);
      },
      stop(){ clearInterval(timer); }
    };
    api.step('Wird vorbereitet'); api.eta(0, ''); q('.k-load-e').textContent = '';
    return api;
  }

  /* ================= Kursansicht ================= */
  const lessonsOf = k => k.units.flatMap((u, ui) => u.lessons.map((l, li) => Object.assign({}, l, {key: ui + '-' + li})));
  const KTABS = {pfad:'Lernpfad', karten:'Karten', regeln:'Regeln', test:'Test', podcast:'Podcast'};
  const TAB_ICONS = {pfad:'target', karten:'layers', regeln:'ruler', test:'pencil', podcast:'headphones'};

  function renderKurs(k, tab){
    view = {name:'kurs', id:k.id, tab};
    k.rules = k.rules || [];
    const due = dueOf(k), pct = Math.round(progressOf(k) * 100);
    sec.innerHTML =
      '<div class="k-nav"><button type="button" class="k-back" id="kBack"><span aria-hidden="true">‹</span> Kurse</button><span class="k-nav-r"><span class="k-stats" id="kStats"></span><button type="button" class="k-info" id="kInfo" aria-label="Überblick und Kurs verwalten">' + icon('info', 22) + '</button></span></div>' +
      '<div class="k-head"><span class="k-head-em" aria-hidden="true">' + icon('book', 30) + '</span><div><h3>' + esc(k.title) + '</h3>' +
        '<p class="k-head-sub">' + plural(lessonsOf(k).length, 'Lektion', 'Lektionen') + ' · ' + plural(k.flashcards.length, 'Karte', 'Karten') + ' · ' + plural(k.rules.length, 'Regel', 'Regeln') + ' · ' + pct + ' % geschafft</p></div></div>' +
      '<div class="k-tabs" role="tablist">' + Object.entries(KTABS).map(([t, l]) => '<button type="button" role="tab" data-t="' + t + '" aria-selected="' + (t === tab) + '" class="' + (t === tab ? 'on' : '') + '">' + icon(TAB_ICONS[t], 22) + '<span class="k-tl">' + l + '</span>' + (t === 'karten' && due ? '<span class="k-dot" aria-label="' + due + ' fällig">' + due + '</span>' : '') + '</button>').join('') + '</div>' +
      '<div id="kBody"></div>';
    sec.classList.add('has-tabbar');
    drawStats();
    $('kBack').onclick = () => { view = {name:'list'}; route(); };
    sec.querySelector('.k-tabs').onclick = e => { const b = e.target.closest('[data-t]'); if(b){ stopAudio(); renderKurs(k, b.dataset.t); } };
    $('kInfo').onclick = () => { stopAudio(); renderKurs(k, 'info'); };
    if(tab === 'info') sec.querySelectorAll('.k-tabs [role=tab]').forEach(b => b.setAttribute('aria-selected', 'false'));
    (({pfad: renderPath, karten: renderCards, regeln: renderRules, test: renderTest, podcast: renderPodcast, info: renderInfo})[tab] || renderPath)(k, $('kBody'));
    window.scrollTo(0, 0);
  }

  function renderInfo(k, body){
    body.innerHTML = '<h3 class="k-h">Überblick</h3><div class="k-summary">' + esc(k.summary).replace(/\n/g, '<br>') + '</div>' +
      '<div class="k-manage"><button type="button" class="pc-del" id="kDel">Kurs löschen</button><small>Der Kurs wird mit Fortschritt, Karteikarten und Aufnahmen aus deinem Konto entfernt.</small></div>';
    $('kDel').onclick = async () => {
      if(!await RH.confirm({title:'Kurs löschen?', text:'„' + k.title + '“ mit Fortschritt, Karteikarten und Aufnahmen wird aus deinem Konto gelöscht.', ok:'Löschen', danger:true})) return;
      await db.del(k.id).catch(() => {}); sync.remove(k.id); view = {name:'list'}; route();
    };
  }

  /* ---------- Lernpfad ---------- */
  const NODE_ICONS = ['star', 'target', 'lightbulb', 'book', 'pencil', 'layers'];
  function renderPath(k, body){
    const all = lessonsOf(k), first = all.findIndex(l => !(l.key in k.done));
    let i = 0, h = '';
    k.units.forEach((u, ui) => {
      h += '<div class="k-unit u' + (ui % 4) + '"><small>Einheit ' + (ui + 1) + '</small><b>' + esc(u.title) + '</b></div><div class="k-path">';
      u.lessons.forEach(l => {
        const n = i++, done = all[n].key in k.done, cur = n === first, locked = !done && !cur;
        h += '<div class="k-node-wrap" style="transform:translateX(' + Math.round(Math.sin(n * 1.1) * 70) + 'px)">' + (cur ? '<span class="k-start">Start</span>' : '') +
          '<button type="button" class="k-node ' + (done ? 'done' : cur ? 'cur' : '') + '" data-n="' + n + '" aria-label="' + esc(l.title) + (done ? ' (geschafft)' : locked ? ' (gesperrt)' : '') + '"' + (locked ? ' aria-disabled="true"' : '') + '>' + (done ? icon('check', 30) : locked ? icon('lock', 26) : icon(NODE_ICONS[n % NODE_ICONS.length], 28)) + '</button>' +
          '<span class="k-node-l">' + esc(l.title) + '</span></div>';
      });
      h += '</div>';
    });
    if(first === -1) h += '<div class="k-trophy" aria-hidden="true">' + icon('trophy', 56) + '</div><p class="page-lead" style="text-align:center">Ganzer Pfad geschafft! Lektionen kannst du jederzeit wiederholen.</p>';
    body.innerHTML = h;
    body.onclick = e => { const b = e.target.closest('.k-node'); if(!b) return; const n = +b.dataset.n; if(n !== first && !(all[n].key in k.done)) return; lesson(k, all[n]); };
  }

  const KIND = {multiple_choice:'Wähle die richtige Antwort', true_false:'Wahr oder falsch?', fill_blank:'Fülle die Lücke'};
  function lesson(k, l){
    const ov = document.createElement('div'); ov.className = 'k-lesson'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', 'Lektion: ' + l.title);
    document.body.appendChild(ov); document.body.classList.add('k-noscroll');
    const qs = shuffle(l.questions).map(q => { const o = q.options.map((t, i) => ({t, ok: i === q.correctIndex})); return Object.assign({}, q, {opts: q.type === 'true_false' ? o : shuffle(o)}); });
    const s = {queue: qs, total: qs.length, right: 0, miss: 0, hearts: 3, sel: null, checked: false, t0: Date.now()};
    const close = () => { document.removeEventListener('keydown', key); ov.remove(); document.body.classList.remove('k-noscroll'); renderKurs(k, 'pfad'); };
    function draw(){
      const q = s.queue[0], ok = s.checked && q.opts[s.sel].ok;
      const text = q.type === 'fill_blank' ? fx(q.question.replace(/_{2,}/, '\u0000')).replace('\u0000', '<span class="k-blank">' + (s.sel != null ? fx(q.opts[s.sel].t) : '&nbsp;') + '</span>') : fx(q.question);
      ov.innerHTML = '<div class="k-l-top"><button type="button" class="k-l-x" id="kLx" aria-label="Lektion beenden">' + icon('x', 22) + '</button><div class="p-progress"><i style="width:' + (s.right / s.total * 100) + '%"></i></div><span class="k-hearts" aria-label="' + s.hearts + ' Herzen">' + icon('heart', 18, true) + s.hearts + '</span></div>' +
        '<div class="k-l-body"><div class="p-label">' + (KIND[q.type] || 'Frage') + '</div><div class="k-q">' + text + '</div><div class="k-opts' + (q.opts.length === 2 ? ' two' : '') + '">' +
        q.opts.map((o, i) => { let c = s.sel === i ? 'sel' : ''; if(s.checked) c = o.ok ? 'right' : s.sel === i ? 'wrong' : ''; return '<button type="button" class="k-opt ' + c + '" data-i="' + i + '"' + (s.checked ? ' disabled' : '') + '><span class="k-key">' + (i + 1) + '</span><span>' + fx(o.t) + '</span></button>'; }).join('') + '</div></div>' +
        '<div class="k-l-foot ' + (s.checked ? (ok ? 'ok' : 'bad') : '') + '"><div class="k-l-fi"><div class="k-fb" role="status">' +
        (s.checked ? (ok ? '<b>Richtig!</b><span>' + fx(q.explanation) + '</span>' : '<b>Nicht ganz.</b><span>Richtig: <strong>' + fx((q.opts.find(o => o.ok) || {}).t) + '</strong> – ' + fx(q.explanation) + '</span>') : '') +
        '</div><button type="button" class="ai-btn k-go ' + (s.checked ? (ok ? 'ok' : 'bad') : '') + '" id="kGo"' + (s.sel == null ? ' disabled' : '') + '>' + (s.checked ? 'Weiter' : 'Prüfen') + '</button></div></div>';
      $('kLx').onclick = async () => { if(await RH.confirm({title:'Lektion abbrechen?', text:'Der Fortschritt dieser Lektion geht verloren.', ok:'Abbrechen', danger:true})) close(); };
      ov.querySelector('.k-opts').onclick = e => { const b = e.target.closest('.k-opt'); if(b && !s.checked){ s.sel = +b.dataset.i; draw(); } };
      $('kGo').onclick = next;
      (s.checked ? $('kGo') : ov.querySelector('.k-opt.sel') || ov.querySelector('.k-opt')).focus({preventScroll:true});
    }
    function next(){
      if(s.sel == null) return;
      const q = s.queue[0];
      if(!s.checked){ s.checked = true; if(q.opts[s.sel].ok) s.right++; else{ s.hearts--; s.miss++; } RH.haptic && RH.haptic(q.opts[s.sel].ok ? 8 : 20); return draw(); }
      s.queue.shift(); if(!q.opts[s.sel].ok) s.queue.push(q);   // falsche Fragen kommen später nochmal
      s.sel = null; s.checked = false;
      if(s.hearts <= 0) return finish(false);
      if(!s.queue.length) return finish(true);
      draw();
    }
    function finish(won){
      const acc = Math.round(s.total / (s.total + s.miss) * 100), mins = Math.max(1, Math.round((Date.now() - s.t0) / 60000));
      let xp = 0;
      if(won){ xp = (l.key in k.done ? 5 : 10) + (s.miss ? 0 : 5); k.done[l.key] = Math.max(k.done[l.key] || 0, acc); save(k); addXp(xp); }
      ov.innerHTML = '<div class="k-l-body k-res"><div class="k-res-em" aria-hidden="true">' + (won ? (s.miss ? icon('sparkles', 72) : icon('award', 72)) : icon('heart-crack', 72)) + '</div><h3>' + (won ? (s.miss ? 'Lektion geschafft!' : 'Perfekt – ohne Fehler!') : 'Keine Herzen mehr') + '</h3><p class="page-lead">' + (won ? esc(l.title) : 'Kein Problem – probier es gleich nochmal.') + '</p>' +
        (won ? '<div class="k-res-st"><div><small>XP</small><b>' + icon('zap', 18) + '+' + xp + '</b></div><div><small>Genauigkeit</small><b>' + icon('target', 18) + acc + '%</b></div><div><small>Zeit</small><b>' + icon('timer', 18) + mins + ' min</b></div></div>' : '') + '</div>' +
        '<div class="k-l-foot"><div class="k-l-fi">' + (won ? '<span></span>' : '<button type="button" class="ai-btn ghost" id="kRe">Nochmal</button>') + '<button type="button" class="ai-btn" id="kEnd">Weiter</button></div></div>';
      $('kEnd').onclick = close; $('kEnd').focus();
      if(!won) $('kRe').onclick = () => { document.removeEventListener('keydown', key); ov.remove(); document.body.classList.remove('k-noscroll'); lesson(k, l); };
    }
    function key(e){
      if(!s.queue.length || !ov.isConnected) return;
      const n = parseInt(e.key, 10);
      if(!s.checked && n >= 1 && n <= s.queue[0].opts.length){ s.sel = n - 1; draw(); }
      if(e.key === 'Enter' && !e.target.closest('.k-opt, .k-l-x')){ e.preventDefault(); next(); }
    }
    document.addEventListener('keydown', key);
    draw();
  }

  /* ---------- Karteikarten (Wiederholung in Abständen, eigene Karten) ---------- */
  const STEPS = [0, 1, 3, 7, 14, 30];   // Tage bis zur nächsten Wiederholung je Stufe
  const plural = (n, one, many) => n + ' ' + (n === 1 ? one : many);
  const ruleOf = (k, id) => id && (k.rules || []).find(r => r.id === id);
  // Rückseite beim Lernen: Antwort + (falls verknüpft) die Regel als Merkkasten
  // Vorschau in Listen: Zeilenmarker ($, !, ##, ‖) und Formelklammern entfernen, damit keine Rohschreibweise zu sehen ist
  const flat = t => String(t == null ? '' : t).split('\n').map(l => l.replace(/^(\$ |## |! |- )/, '').replace(/ ‖ /g, ' – ')).filter(Boolean).join(' · ').replace(/\{([^{}]*)\}/g, '$1');
  const backOf = (k, c) => { const r = ruleOf(k, c.ruleId); return r && !c.fromRule ? c.back + '\n! ' + r.title + ': ' + r.text : c.back; };
  const ruleOptions = (k, sel) => '<option value="">Keine Regel</option>' + k.rules.map(r => '<option value="' + esc(r.id) + '"' + (r.id === sel ? ' selected' : '') + '>' + esc(r.title) + '</option>').join('');

  function renderCards(k, body){
    const due = k.flashcards.filter(c => (c.due || 0) <= Date.now());
    const nextDue = Math.min(...k.flashcards.map(c => c.due || 0).filter(d => d > Date.now()));
    const own = k.flashcards.filter(c => c.own).length;
    let filter = 'alle', editing = null;
    body.innerHTML =
      '<div class="k-cards-top"><div><b class="k-big">' + due.length + '</b> <span>fällig von ' + k.flashcards.length + ' Karten</span>' +
        (!due.length && isFinite(nextDue) ? '<small class="k-next">Nächste ' + new Date(nextDue).toLocaleString('de-DE', {weekday:'long', hour:'2-digit', minute:'2-digit'}) + '</small>' : '') + '</div>' +
        '<div class="btn-row"><button type="button" class="ai-btn" id="kLearn"' + (due.length ? '' : ' disabled') + '>Jetzt lernen</button><button type="button" class="ai-btn ghost" id="kAll">Alle üben</button></div></div>' +
      '<div class="k-list-h"><div class="pc-seg k-filter" role="radiogroup" aria-label="Anzeigen"><button type="button" role="radio" data-f="alle" class="on" aria-checked="true">Alle ' + k.flashcards.length + '</button><button type="button" role="radio" data-f="own" aria-checked="false">Eigene ' + own + '</button><button type="button" role="radio" data-f="due" aria-checked="false">Fällig ' + due.length + '</button></div><span class="k-add-row"><button type="button" class="k-add-btn alt" id="kAiNew" aria-expanded="false" aria-controls="kAi">Von der KI</button><button type="button" class="k-add-btn" id="kNew" aria-expanded="false" aria-controls="kForm">' + icon('plus', 16) + 'Neue Karte</button></span></div>' +
      '<div class="k-form is-hidden" id="kForm">' +
        '<h4 class="k-form-h" id="kFormH">Eigene Karte</h4>' +
        '<label class="k-lbl" for="kF">Vorderseite</label><input class="pc-input" id="kF" maxlength="300" placeholder="Frage oder Aufgabe">' +
        '<label class="k-lbl" for="kB">Rückseite</label><textarea class="pc-input" id="kB" rows="2" maxlength="600" placeholder="Antwort"></textarea>' +
        '<label class="k-lbl" for="kR">Regel dazu <span>(wird beim Lernen mit angezeigt)</span></label><select class="pc-sel k-sel" id="kR">' + ruleOptions(k) + '</select>' +
        '<div class="k-form-act"><button type="button" class="ai-btn ghost is-hidden" id="kCancel">Abbrechen</button><button type="button" class="ai-btn" id="kSave">Karte speichern</button></div>' +
      '</div>' +
      '<div class="k-form is-hidden" id="kAi"></div>' +
      '<div class="k-clist" id="kClist"></div>';
    const list = $('kClist');
    function drawList(){
      const now = Date.now(), cards = k.flashcards.filter(c => filter === 'own' ? c.own : filter === 'due' ? (c.due || 0) <= now : true);
      list.innerHTML = cards.length ? cards.map(c => { const r = ruleOf(k, c.ruleId);
        return '<div class="k-c"><div><b>' + fx(flat(c.front)) + '</b><span>' + fx(flat(c.back)) + '</span>' +
          ((c.own || c.gen || r) ? '<span class="k-tags">' + (c.own ? '<i class="k-tag">Eigene</i>' : '') + (c.gen ? '<i class="k-tag">Von der KI</i>' : '') + (r ? '<i class="k-tag rule">' + icon('ruler', 13) + esc(r.title) + '</i>' : '') + '</span>' : '') + '</div>' +
          '<span class="k-c-st" title="Lernstufe ' + (c.box || 0) + ' von 5" aria-label="Lernstufe ' + (c.box || 0) + ' von 5">' + '●'.repeat(c.box || 0) + '○'.repeat(5 - (c.box || 0)) + '</span>' +
          (c.own || c.gen ? '<button type="button" class="k-c-act" data-edit="' + c.id + '" aria-label="Karte bearbeiten">Bearbeiten</button>' : '') +
          '<button type="button" class="k-c-del" data-id="' + c.id + '" aria-label="Karte löschen">Löschen</button></div>'; }).join('')
        : '<p class="k-empty">' + (filter === 'own' ? 'Noch keine eigenen Karten – schreib oben deine erste.' : 'Gerade ist nichts fällig.') + '</p>';
    }
    drawList();
    sec.querySelector('.k-filter').onclick = e => { const b = e.target.closest('[data-f]'); if(!b) return; filter = b.dataset.f;
      sec.querySelectorAll('.k-filter button').forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-checked', x === b); }); drawList(); };
    const run = cards => {
      window.Practice.start(shuffle(cards).map(c => ({front: c.front, back: backOf(k, c), onRate: good => {
        c.box = good ? Math.min(5, (c.box || 0) + 1) : 0;
        c.due = good ? Date.now() + STEPS[c.box] * DAY : Date.now();
        save(k); addXp(1);
      }})), k.title);
    };
    $('kLearn').onclick = () => run(due);
    $('kAll').onclick = () => run(k.flashcards);
    const openForm = on => { $('kForm').classList.toggle('is-hidden', !on); $('kNew').setAttribute('aria-expanded', on); $('kNew').classList.toggle('is-hidden', on); if(on) $('kF').focus(); };
    $('kNew').onclick = () => { aiPanel(false); openForm(true); };
    $('kAiNew').onclick = () => { openForm(false); aiPanel(true); };

    /* ---- Karten von der KI: Anzahl, Art, Schwerpunkt → Vorschau → auswählen und übernehmen ---- */
    const ai = {n: 10, art: 'gemischt', focus: ''};
    function aiPanel(on){
      const box = $('kAi'); box.classList.toggle('is-hidden', !on); $('kAiNew').classList.toggle('is-hidden', on); $('kAiNew').setAttribute('aria-expanded', on);
      if(!on) return;
      const seg = (name, val, opts) => '<div class="pc-seg k-seg" role="radiogroup" data-k="' + name + '">' + opts.map(([v, l]) => '<button type="button" role="radio" data-v="' + v + '" aria-checked="' + (v == val) + '" class="' + (v == val ? 'on' : '') + '">' + l + '</button>').join('') + '</div>';
      box.innerHTML = '<h4 class="k-form-h">Karten von der KI</h4><p class="k-form-p">Die KI schreibt neue Karten zu diesem Kurs – passend zu Zusammenfassung, Regeln und ohne die Karten, die du schon hast. Du suchst danach aus, welche du behältst.</p>' +
        '<span class="k-lbl">Anzahl</span>' + seg('n', ai.n, [[5, '5'], [10, '10'], [20, '20']]) +
        '<span class="k-lbl">Art</span>' + seg('art', ai.art, [['gemischt', 'Gemischt'], ['aufgaben', 'Übungsaufgaben'], ['begriffe', 'Begriffe']]) +
        '<label class="k-lbl" for="kAiF">Schwerpunkt <span>(optional)</span></label><input class="pc-input" id="kAiF" maxlength="200" placeholder="z. B. Textaufgaben mit Rabatt" value="' + esc(ai.focus) + '">' +
        '<div class="k-form-act"><button type="button" class="ai-btn ghost" id="kAiX">Abbrechen</button><button type="button" class="ai-btn" id="kAiGo">Karten erstellen</button></div><div class="u-msg" id="kAiMsg" role="status" aria-live="polite"></div>';
      box.querySelectorAll('.k-seg').forEach(g => g.onclick = e => { const b = e.target.closest('[data-v]'); if(!b) return; ai[g.dataset.k] = g.dataset.k === 'n' ? +b.dataset.v : b.dataset.v;
        g.querySelectorAll('button').forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-checked', x === b); }); });
      $('kAiF').oninput = e => ai.focus = e.target.value;
      $('kAiF').onkeydown = e => { if(e.key === 'Enter') generate(); };
      $('kAiX').onclick = () => aiPanel(false);
      $('kAiGo').onclick = generate;
    }
    async function generate(){
      const box = $('kAi'), L = loader(box, '', true), secs = 8 + ai.n * 1.6;
      L.estimate(secs, 0, ['Kurs wird gelesen', 'Karten werden geschrieben', 'Karten werden geprüft']);
      try{
        const j = await RH.api('/api/karten', {body:{fach: FACH_ID, title: k.title, summary: k.summary, count: ai.n, art: ai.art, focus: ai.focus.trim(),
          rules: k.rules.map(r => ({title: r.title, text: r.text})), cards: k.flashcards.map(c => ({front: c.front, back: c.back}))}});
        if(j.error) throw new Error(j.error);
        const seen = new Set(k.flashcards.map(c => c.front.trim().toLowerCase()));
        const got = (j.flashcards || []).filter(c => c.front && c.back && !seen.has(c.front.trim().toLowerCase()));
        if(!got.length) throw new Error('Diesmal kamen keine neuen Karten zurück. Versuch es mit einem anderen Schwerpunkt.');
        L.stop(); preview(got);
      }catch(e){ L.stop(); aiPanel(true); $('kAiMsg').textContent = e.message || 'Das hat nicht geklappt. Bitte nochmal versuchen.'; }
    }
    function preview(got){
      const box = $('kAi'), byTitle = t => k.rules.find(r => r.title.trim().toLowerCase() === String(t || '').trim().toLowerCase());
      box.innerHTML = '<h4 class="k-form-h">' + got.length + ' neue Karten</h4><p class="k-form-p">Häkchen weg bei Karten, die du nicht willst.</p>' +
        '<div class="k-pick">' + got.map((c, i) => { const r = byTitle(c.rule);
          return '<label class="k-pick-i"><input type="checkbox" data-i="' + i + '" checked><span><b>' + fx(flat(c.front)) + '</b><span>' + fx(flat(c.back)) + '</span>' + (r ? '<i class="k-tag rule">' + icon('ruler', 13) + esc(r.title) + '</i>' : '') + '</span></label>'; }).join('') + '</div>' +
        '<div class="k-form-act"><button type="button" class="ai-btn ghost" id="kAiNo">Verwerfen</button><button type="button" class="ai-btn" id="kAiOk">' + got.length + ' übernehmen</button></div>';
      const count = () => box.querySelectorAll('.k-pick input:checked').length;
      box.querySelector('.k-pick').onchange = () => { const n = count(); $('kAiOk').textContent = n + ' übernehmen'; $('kAiOk').disabled = !n; };
      $('kAiNo').onclick = () => aiPanel(false);
      $('kAiOk').onclick = () => {
        const add = [...box.querySelectorAll('.k-pick input:checked')].map(x => got[+x.dataset.i]).map(c => { const r = byTitle(c.rule);
          return {id: uid(), front: c.front, back: c.back, box: 0, due: 0, gen: true, ruleId: r ? r.id : undefined}; });
        k.flashcards = add.concat(k.flashcards); save(k);
        RH.toast && RH.toast(plural(add.length, 'Karte', 'Karten') + ' hinzugefügt');
        renderKurs(k, 'karten');
      };
      box.scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start'});
    }
    const resetForm = () => { openForm(false); editing = null; $('kF').value = ''; $('kB').value = ''; $('kR').value = ''; $('kFormH').textContent = 'Eigene Karte'; $('kSave').textContent = 'Karte speichern'; $('kCancel').classList.add('is-hidden'); };
    $('kCancel').onclick = resetForm;
    $('kSave').onclick = () => {
      const f = $('kF').value.trim(), b = $('kB').value.trim(), r = $('kR').value;
      if(!f || !b){ (f ? $('kB') : $('kF')).focus(); return; }
      if(editing){ Object.assign(editing, {front: f, back: b, ruleId: r || undefined}); RH.toast && RH.toast('Karte gespeichert'); }
      else{ k.flashcards.unshift({id: uid(), front: f, back: b, box: 0, due: 0, own: true, ruleId: r || undefined}); RH.toast && RH.toast('Karte hinzugefügt'); }
      save(k); renderKurs(k, 'karten'); setTimeout(() => $('kF') && $('kF').focus());
    };
    list.onclick = async e => {
      const ed = e.target.closest('[data-edit]');
      if(ed){ editing = k.flashcards.find(c => c.id === ed.dataset.edit); if(!editing) return;
        $('kF').value = editing.front; $('kB').value = editing.back; $('kR').value = editing.ruleId || '';
        openForm(true); $('kFormH').textContent = 'Karte bearbeiten'; $('kSave').textContent = 'Änderung speichern'; $('kCancel').classList.remove('is-hidden');
        $('kForm').scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center'}); $('kF').focus({preventScroll:true}); return; }
      const b = e.target.closest('.k-c-del'); if(!b) return;
      if(!await RH.confirm({title:'Karte löschen?', text:'Diese Karteikarte wird aus dem Kurs entfernt.', ok:'Löschen', danger:true})) return;
      k.flashcards = k.flashcards.filter(c => c.id !== b.dataset.id); save(k); renderKurs(k, 'karten');
    };
  }

  /* ---------- Regeln: von der KI aus den Unterlagen + eigene Regeln ---------- */
  function renderRules(k, body){
    let editing = null;
    const cardFor = r => k.flashcards.find(c => c.fromRule && c.ruleId === r.id);
    const linked = r => k.flashcards.filter(c => c.ruleId === r.id).length;
    body.innerHTML =
      '<div class="k-list-h"><b class="k-count">' + plural(k.rules.length, 'Regel', 'Regeln') + '</b><button type="button" class="k-add-btn" id="kRNew" aria-expanded="false" aria-controls="kRForm">' + icon('plus', 16) + 'Neue Regel</button></div>' +
      '<div class="k-form is-hidden" id="kRForm">' +
        '<h4 class="k-form-h" id="kRH">Eigene Regel</h4>' +
        '<label class="k-lbl" for="kRT">Name</label><input class="pc-input" id="kRT" maxlength="120" placeholder="z. B. Satz des Pythagoras">' +
        '<label class="k-lbl" for="kRX">Regel</label><textarea class="pc-input" id="kRX" rows="3" maxlength="800" placeholder="z. B. Im rechtwinkligen Dreieck gilt a² + b² = c²."></textarea>' +
        '<label class="k-lbl" for="kRE">Beispiel <span>(optional)</span></label><input class="pc-input" id="kRE" maxlength="400" placeholder="z. B. 3² + 4² = 5²">' +
        '<label class="k-check"><input type="checkbox" id="kRC" checked> Auch als Karteikarte lernen</label>' +
        '<div class="k-form-act"><button type="button" class="ai-btn ghost is-hidden" id="kRCancel">Abbrechen</button><button type="button" class="ai-btn" id="kRSave">Regel speichern</button></div>' +
      '</div>' +
      (k.rules.length
        ? '<div class="k-rules">' + k.rules.map(r => { const c = cardFor(r), n = linked(r);
            return '<article class="k-rule"><div class="k-rule-top"><h4>' + esc(r.title) + '</h4>' + (r.own ? '<i class="k-tag">Eigene</i>' : '') + '</div>' +
              '<p>' + fx(r.text) + '</p>' + (r.example ? '<p class="k-rule-ex"><span>Beispiel</span>' + fx(r.example) + '</p>' : '') +
              '<div class="k-rule-act">' + (c ? '<span class="k-ok">' + icon('check', 14) + 'Als Karte' + (n > 1 ? ' · ' + (n - 1) + ' weitere' : '') + '</span>' : '<button type="button" class="mini" data-card="' + r.id + '">' + icon('plus', 14) + 'Als Karte</button>' + (n ? '<span class="k-ok">' + n + ' Karte' + (n > 1 ? 'n' : '') + '</span>' : '')) +
              '<span class="k-sp"></span><button type="button" class="k-c-act" data-edit="' + r.id + '">Bearbeiten</button><button type="button" class="k-c-del" data-del="' + r.id + '">Löschen</button></div></article>'; }).join('') + '</div>'
        : '<p class="k-empty">Noch keine Regeln. Schreib oben deine erste – sie kommt auf Wunsch gleich als Karteikarte in den Kurs.</p>');
    const toCard = r => ({id: uid(), front: 'Wie lautet die Regel „' + r.title + '“?', back: r.text + (r.example ? '\n! Beispiel: ' + r.example : ''), box: 0, due: 0, own: !!r.own, ruleId: r.id, fromRule: true});
    const openForm = on => { $('kRForm').classList.toggle('is-hidden', !on); $('kRNew').setAttribute('aria-expanded', on); $('kRNew').classList.toggle('is-hidden', on); if(on) $('kRT').focus(); };
    $('kRNew').onclick = () => openForm(true);
    if(!k.rules.length) openForm(true);
    const reset = () => { openForm(false); editing = null; ['kRT', 'kRX', 'kRE'].forEach(i => $(i).value = ''); $('kRC').checked = true; $('kRC').parentNode.classList.remove('is-hidden'); $('kRH').textContent = 'Eigene Regel'; $('kRSave').textContent = 'Regel speichern'; $('kRCancel').classList.add('is-hidden'); };
    $('kRCancel').onclick = reset;
    $('kRSave').onclick = () => {
      const t = $('kRT').value.trim(), x = $('kRX').value.trim(), ex = $('kRE').value.trim();
      if(!t || !x){ (t ? $('kRX') : $('kRT')).focus(); return; }
      if(editing){
        Object.assign(editing, {title: t, text: x, example: ex});
        const c = cardFor(editing); if(c){ const n = toCard(editing); c.front = n.front; c.back = n.back; }   // verknüpfte Karte mitziehen
        RH.toast && RH.toast('Regel gespeichert');
      }else{
        const r = {id: uid(), title: t, text: x, example: ex, own: true};
        k.rules.unshift(r);
        if($('kRC').checked) k.flashcards.unshift(toCard(r));
        RH.toast && RH.toast($('kRC').checked ? 'Regel und Karte hinzugefügt' : 'Regel hinzugefügt');
      }
      save(k); renderKurs(k, 'regeln');
    };
    body.onclick = async e => {
      const a = e.target.closest('[data-card],[data-edit],[data-del]'); if(!a) return;
      const r = k.rules.find(x => x.id === (a.dataset.card || a.dataset.edit || a.dataset.del)); if(!r) return;
      if(a.dataset.card){ k.flashcards.unshift(toCard(r)); save(k); RH.toast && RH.toast('Als Karteikarte hinzugefügt'); return renderKurs(k, 'regeln'); }
      if(a.dataset.edit){
        editing = r; $('kRT').value = r.title; $('kRX').value = r.text; $('kRE').value = r.example || '';
        openForm(true); $('kRC').parentNode.classList.add('is-hidden'); $('kRH').textContent = 'Regel bearbeiten'; $('kRSave').textContent = 'Änderung speichern'; $('kRCancel').classList.remove('is-hidden');
        $('kRForm').scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center'}); $('kRT').focus({preventScroll:true}); return;
      }
      if(!await RH.confirm({title:'Regel löschen?', text:'„' + r.title + '“ wird aus dem Kurs entfernt' + (cardFor(r) ? ', zusammen mit ihrer Karteikarte' : '') + '.', ok:'Löschen', danger:true})) return;
      k.rules = k.rules.filter(x => x !== r);
      k.flashcards = k.flashcards.filter(c => !(c.fromRule && c.ruleId === r.id)).map(c => c.ruleId === r.id ? Object.assign(c, {ruleId: undefined}) : c);
      save(k); renderKurs(k, 'regeln');
    };
  }

  /* ---------- Test: Prüfung ohne sofortige Auflösung, Note am Ende ---------- */
  const GRADES = [[92, 1, 'sehr gut'], [81, 2, 'gut'], [67, 3, 'befriedigend'], [50, 4, 'ausreichend'], [30, 5, 'mangelhaft'], [0, 6, 'ungenügend']];
  const gradeOf = p => GRADES.find(g => p >= g[0]);
  const fmtTime = sec => Math.floor(sec / 60) + ':' + String(Math.floor(sec % 60)).padStart(2, '0');
  const testCfg = {n: 10, min: 0};
  function renderTest(k, body){
    const pool = k.units.flatMap(u => u.lessons.flatMap(l => l.questions.map(q => Object.assign({}, q, {from: l.title}))));
    k.tests = k.tests || [];
    if(testCfg.n > pool.length) testCfg.n = 0;
    const seg = (name, val, opts) => '<div class="pc-seg k-seg" role="radiogroup" data-k="' + name + '">' + opts.map(([v, l]) => '<button type="button" role="radio" data-v="' + v + '" aria-checked="' + (v === val) + '" class="' + (v === val ? 'on' : '') + '">' + l + '</button>').join('') + '</div>';
    const best = k.tests.reduce((b, t) => !b || t.pct > b.pct ? t : b, null);
    body.innerHTML =
      '<div class="k-form k-test-setup">' +
        '<h4 class="k-form-h">Teste dich wie in einer Prüfung</h4>' +
        '<p class="k-form-p">Fragen aus dem ganzen Kurs, gemischt. Du siehst erst am Ende, was richtig war – mit Note und allen Lösungen.</p>' +
        '<span class="k-lbl">Fragen</span>' + seg('n', testCfg.n, [[10, '10'], [20, '20'], [0, 'Alle ' + pool.length]].filter(([v]) => v < pool.length)) +
        '<span class="k-lbl">Zeitlimit</span>' + seg('min', testCfg.min, [[0, 'Ohne'], [10, '10 Min.'], [20, '20 Min.'], [45, '45 Min.']]) +
        '<button type="button" class="ai-btn" id="kTestGo"' + (pool.length < 3 ? ' disabled' : '') + '>Test starten</button>' +
      '</div>' +
      (k.tests.length
        ? '<div class="k-sec-h"><h3 class="k-h">Deine Tests</h3>' + (best ? '<span class="k-best">Bestes Ergebnis: Note ' + best.grade + ' · ' + best.pct + ' %</span>' : '') + '</div>' +
          '<div class="k-clist">' + k.tests.slice().reverse().slice(0, 8).map(t => '<div class="k-c k-tr"><span class="k-grade g' + t.grade + '">' + t.grade + '</span><div><b>' + t.right + ' von ' + t.n + ' richtig · ' + t.pct + ' %</b><span>' + new Date(t.at).toLocaleString('de-DE', {weekday:'short', day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit'}) + ' · ' + fmtTime(t.secs) + ' min</span></div></div>').join('') + '</div>'
        : '');
    body.querySelectorAll('.k-seg').forEach(g => g.onclick = e => { const b = e.target.closest('[data-v]'); if(!b) return; testCfg[g.dataset.k] = +b.dataset.v;
      g.querySelectorAll('button').forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-checked', x === b); }); });
    $('kTestGo').onclick = () => exam(k, shuffle(pool).slice(0, testCfg.n || pool.length), testCfg.min);
  }

  /* ---------- Nebenrechnung: Zeichenfläche für Stift (Apple Pencil) oder Finger/Maus ---------- */
  const PEN_KEY = 'regelheft-stift';
  const penKnown = () => { try{ return localStorage.getItem(PEN_KEY) === '1'; }catch(e){ return false; } };
  const penSeen = () => { try{ localStorage.setItem(PEN_KEY, '1'); }catch(e){} };
  const INKS = [['ink', 'Schwarz'], ['#0A64D6', 'Blau'], ['#D70015', 'Rot']];
  function scratchPad(host, it){
    if(!host) return;
    let tool = scratchPad.tool || 'ink', erase = false;
    host.innerHTML = '<div class="k-sc-bar" role="toolbar" aria-label="Nebenrechnung">' +
        INKS.map(([c, l]) => '<button type="button" class="k-sc-c' + (c === tool ? ' on' : '') + '" data-c="' + c + '" aria-label="' + l + '" aria-pressed="' + (c === tool) + '"><i style="background:' + (c === 'ink' ? 'var(--ink)' : c) + '"></i></button>').join('') +
        '<button type="button" class="k-sc-b" data-a="erase" aria-pressed="false">Radierer</button>' +
        '<span class="k-sp"></span><button type="button" class="k-sc-b" data-a="undo" aria-label="Rückgängig">' + icon('undo', 16) + '</button><button type="button" class="k-sc-b" data-a="clear">Leeren</button></div>' +
      '<canvas class="k-sc-canvas" aria-label="Zeichenfläche für Nebenrechnungen"></canvas>' +
      '<p class="k-sc-hint">' + (penKnown() ? 'Mit dem Stift schreiben – der Finger zeichnet hier nicht, damit die Hand aufliegen kann.' : 'Mit Stift, Finger oder Maus rechnen. Ein Apple Pencil wird automatisch erkannt.') + ' Wird nicht bewertet.</p>';
    const cv = host.querySelector('canvas'), ctx = cv.getContext('2d');
    let W = 0, H = 0, cur = null;
    const color = c => c === 'ink' ? getComputedStyle(host).getPropertyValue('--ink').trim() || '#000' : c;
    function seg(s, a, b){
      ctx.globalCompositeOperation = s.c === 'erase' ? 'destination-out' : 'source-over';
      ctx.strokeStyle = s.c === 'erase' ? '#000' : color(s.c);
      ctx.lineWidth = s.c === 'erase' ? 22 : s.w * (0.45 + (b[2] || 0.5) * 1.1);
      ctx.beginPath(); ctx.moveTo(a[0] * W, a[1] * W); ctx.lineTo(b[0] * W, b[1] * W); ctx.stroke();
    }
    function redraw(){
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height);
      const r = window.devicePixelRatio || 1; ctx.setTransform(r, 0, 0, r, 0, 0); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      it.ink.forEach(s => { if(s.p.length === 1) seg(s, s.p[0], s.p[0]); for(let n = 1; n < s.p.length; n++) seg(s, s.p[n - 1], s.p[n]); });
      ctx.globalCompositeOperation = 'source-over';
    }
    function size(){
      const r = window.devicePixelRatio || 1, w = cv.clientWidth, h = cv.clientHeight; if(!w || (w === W && h === H)) return;
      W = w; H = h; cv.width = Math.round(w * r); cv.height = Math.round(h * r); redraw();
    }
    const ro = new ResizeObserver(size); ro.observe(cv); size();
    const pt = e => { const b = cv.getBoundingClientRect(); return [(e.clientX - b.left) / W, (e.clientY - b.top) / W, e.pointerType === 'pen' ? (e.pressure || 0.5) : 0.5]; };
    cv.addEventListener('pointerdown', e => {
      if(e.pointerType === 'pen' && !penKnown()) penSeen();
      if(e.pointerType === 'touch' && penKnown()) return;   // Handballen ignorieren, wenn mit Stift geschrieben wird
      if(e.button > 0) return;
      e.preventDefault(); try{ cv.setPointerCapture(e.pointerId); }catch(err){}
      cur = {c: erase ? 'erase' : tool, w: e.pointerType === 'pen' ? 2.6 : 2.4, p: [pt(e)], id: e.pointerId}; it.ink.push(cur);
      seg(cur, cur.p[0], cur.p[0]);
    });
    cv.addEventListener('pointermove', e => {
      if(!cur || e.pointerId !== cur.id) return;
      const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
      (evs.length ? evs : [e]).forEach(ev => { const p = pt(ev), last = cur.p[cur.p.length - 1]; if(Math.abs(p[0] - last[0]) + Math.abs(p[1] - last[1]) < 0.0015) return; cur.p.push(p); seg(cur, last, p); });
      ctx.globalCompositeOperation = 'source-over';
    });
    const up = e => { if(cur && e.pointerId === cur.id) cur = null; };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    host.querySelector('.k-sc-bar').onclick = e => {
      const b = e.target.closest('button'); if(!b) return;
      if(b.dataset.c){ tool = scratchPad.tool = b.dataset.c; erase = false; }
      else if(b.dataset.a === 'erase') erase = !erase;
      else if(b.dataset.a === 'undo'){ it.ink.pop(); redraw(); }
      else if(b.dataset.a === 'clear'){ if(it.ink.length){ it.ink.length = 0; redraw(); } }
      host.querySelectorAll('.k-sc-c').forEach(x => { const on = !erase && x.dataset.c === tool; x.classList.toggle('on', on); x.setAttribute('aria-pressed', on); });
      const eb = host.querySelector('[data-a=erase]'); eb.classList.toggle('on', erase); eb.setAttribute('aria-pressed', erase);
    };
  }

  function exam(k, qs, minutes){
    const ov = document.createElement('div'); ov.className = 'k-lesson k-exam'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', 'Test: ' + k.title);
    document.body.appendChild(ov); document.body.classList.add('k-noscroll');
    const items = qs.map(q => { const o = q.options.map((t, i) => ({t, ok: i === q.correctIndex})); return {q, opts: q.type === 'true_false' ? o : shuffle(o), sel: null, ink: []}; });
    const t0 = Date.now(), end = minutes ? t0 + minutes * 60000 : 0;
    let i = 0, timer = null, done = false;
    let padOpen = penKnown();   // Nebenrechnung: offen, sobald ein Stift (z. B. Apple Pencil) erkannt wurde
    // Stift irgendwo im Test benutzt → Nebenrechnung automatisch öffnen
    ov.addEventListener('pointerdown', e => { if(e.pointerType === 'pen' && !penKnown()){ penSeen(); if(!padOpen){ padOpen = true; draw(); } } }, true);
    const close = () => { clearInterval(timer); document.removeEventListener('keydown', key); ov.remove(); document.body.classList.remove('k-noscroll'); renderKurs(k, 'test'); };
    const answered = () => items.filter(x => x.sel != null).length;
    function tick(){
      const el = ov.querySelector('.k-timer'); if(!el) return;
      if(end){ const left = Math.max(0, (end - Date.now()) / 1000); el.innerHTML = icon('timer', 16) + fmtTime(left); el.classList.toggle('warn', left < 60); if(left <= 0) finish(true); }
      else el.innerHTML = icon('timer', 16) + fmtTime((Date.now() - t0) / 1000);
    }
    function draw(){
      const it = items[i], q = it.q, last = i === items.length - 1;
      const text = q.type === 'fill_blank' ? fx(q.question.replace(/_{2,}/, '\u0000')).replace('\u0000', '<span class="k-blank">' + (it.sel != null ? fx(it.opts[it.sel].t) : '&nbsp;') + '</span>') : fx(q.question);
      ov.innerHTML = '<div class="k-l-top"><button type="button" class="k-l-x" id="kLx" aria-label="Test abbrechen">' + icon('x', 22) + '</button><div class="p-progress"><i style="width:' + (answered() / items.length * 100) + '%"></i></div>' +
        '<button type="button" class="k-pen-btn' + (padOpen ? ' on' : '') + '" id="kPenBtn" aria-pressed="' + padOpen + '" title="Nebenrechnung">' + icon('pencil', 16) + '<span> Nebenrechnung</span></button><span class="k-timer" aria-live="off"></span></div>' +
        '<div class="k-l-body' + (padOpen ? ' with-pad' : '') + '"><div class="k-qnav" role="tablist" aria-label="Fragen">' + items.map((x, n) => '<button type="button" role="tab" data-q="' + n + '" aria-selected="' + (n === i) + '" class="' + (n === i ? 'on ' : '') + (x.sel != null ? 'ans' : '') + '" aria-label="Frage ' + (n + 1) + (x.sel != null ? ' (beantwortet)' : '') + '">' + (n + 1) + '</button>').join('') + '</div>' +
        '<div class="k-ex-grid"><div class="k-ex-main"><div class="p-label">Frage ' + (i + 1) + ' von ' + items.length + ' · ' + (KIND[q.type] || 'Frage') + '</div><div class="k-q">' + text + '</div><div class="k-opts' + (it.opts.length === 2 ? ' two' : '') + '">' +
        it.opts.map((o, n) => '<button type="button" class="k-opt ' + (it.sel === n ? 'sel' : '') + '" data-i="' + n + '" aria-pressed="' + (it.sel === n) + '"><span class="k-key">' + (n + 1) + '</span><span>' + fx(o.t) + '</span></button>').join('') + '</div></div>' +
        (padOpen ? '<div class="k-scratch" id="kScratch"></div>' : '') + '</div></div>' +
        '<div class="k-l-foot"><div class="k-l-fi"><button type="button" class="ai-btn ghost" id="kPrev"' + (i ? '' : ' disabled') + '>Zurück</button><span class="k-fb"><span>' + answered() + ' von ' + items.length + ' beantwortet</span></span>' +
        '<button type="button" class="ai-btn" id="kNx">' + (last ? 'Abgeben' : 'Weiter') + '</button></div></div>';
      tick();
      $('kLx').onclick = async () => { if(await RH.confirm({title:'Test abbrechen?', text:'Deine Antworten gehen verloren.', ok:'Abbrechen', danger:true})) close(); };
      ov.querySelector('.k-qnav').onclick = e => { const b = e.target.closest('[data-q]'); if(b){ i = +b.dataset.q; draw(); } };
      ov.querySelector('.k-opts').onclick = e => { const b = e.target.closest('.k-opt'); if(b){ it.sel = +b.dataset.i; draw(); } };
      $('kPrev').onclick = () => { if(i){ i--; draw(); } };
      $('kNx').onclick = () => last ? submit() : (i++, draw());
      $('kPenBtn').onclick = () => { padOpen = !padOpen; draw(); if(padOpen){ const sc = $('kScratch'); if(sc) sc.scrollIntoView({block:'nearest'}); } };
      if(padOpen) scratchPad($('kScratch'), it);
      const cur = ov.querySelector('.k-qnav .on'); if(cur) cur.scrollIntoView({block:'nearest', inline:'center'});
    }
    async function submit(){
      const open = items.length - answered();
      if(open && !await RH.confirm({title:'Test abgeben?', text: plural(open, 'Frage ist', 'Fragen sind') + ' noch offen und zählen als falsch.', ok:'Abgeben'})) return;
      finish(false);
    }
    function finish(timeUp){
      if(done) return; done = true; clearInterval(timer);
      const right = items.filter(x => x.sel != null && x.opts[x.sel].ok).length, pct = Math.round(right / items.length * 100), g = gradeOf(pct);
      const secs = Math.round((Date.now() - t0) / 1000), xp = right * 2 + (g[1] <= 2 ? 10 : 0);
      k.tests = (k.tests || []).concat({at: Date.now(), n: items.length, right, pct, grade: g[1], secs}).slice(-30); save(k); addXp(xp);
      const wrong = items.filter(x => x.sel == null || !x.opts[x.sel].ok);
      ov.innerHTML = '<div class="k-l-top"><span></span></div><div class="k-l-body k-res">' + (timeUp ? '<p class="k-timeup">Die Zeit ist um – der Test wurde abgegeben.</p>' : '') +
        '<div class="k-grade-big g' + g[1] + '"><span>' + g[1] + '</span></div><h3>Note ' + g[1] + ' – ' + g[2] + '</h3><p class="page-lead">' + right + ' von ' + items.length + ' richtig</p>' +
        '<div class="k-res-st"><div><small>Ergebnis</small><b>' + pct + ' %</b></div><div><small>Zeit</small><b>' + fmtTime(secs) + '</b></div><div><small>XP</small><b>+' + xp + '</b></div></div>' +
        '<h4 class="k-review-h">Alle Lösungen</h4><ol class="k-review">' + items.map(x => { const ok = x.sel != null && x.opts[x.sel].ok, r = x.opts.find(o => o.ok);
          return '<li class="' + (ok ? 'ok' : 'bad') + '"><b>' + fx(x.q.question) + '</b>' + (ok ? '<span class="k-rv-a">' + icon('check', 14) + fx(r.t) + '</span>' : '<span class="k-rv-a">' + icon('x', 14) + (x.sel == null ? 'Nicht beantwortet' : fx(x.opts[x.sel].t)) + '</span><span class="k-rv-c">Richtig: ' + fx(r.t) + '</span>') + (x.q.explanation ? '<span class="k-rv-e">' + fx(x.q.explanation) + '</span>' : '') + '</li>'; }).join('') + '</ol></div>' +
        '<div class="k-l-foot"><div class="k-l-fi">' + (wrong.length ? '<button type="button" class="ai-btn ghost" id="kWrongCards">' + plural(wrong.length, 'Fehler', 'Fehler') + ' als Karten lernen</button>' : '<span></span>') + '<button type="button" class="ai-btn" id="kEnd">Fertig</button></div></div>';
      $('kEnd').onclick = close; $('kEnd').focus();
      if(wrong.length) $('kWrongCards').onclick = () => {
        const have = new Set(k.flashcards.map(c => c.front.trim().toLowerCase()));
        const add = wrong.map(x => ({id: uid(), front: x.q.question.replace(/_{2,}/, '…'), back: x.opts.find(o => o.ok).t + (x.q.explanation ? '\n' + x.q.explanation : ''), box: 0, due: 0, gen: true}))
          .filter(c => !have.has(c.front.trim().toLowerCase()));
        k.flashcards = add.concat(k.flashcards); save(k);
        RH.toast && RH.toast(add.length ? plural(add.length, 'Karte', 'Karten') + ' hinzugefügt' : 'Diese Karten gibt es schon');
        $('kWrongCards').disabled = true; $('kWrongCards').innerHTML = icon('check', 16) + 'Bei den Karten';
      };
    }
    function key(e){
      if(done || !ov.isConnected || e.target.closest('input,textarea')) return;
      const n = parseInt(e.key, 10);
      if(n >= 1 && n <= items[i].opts.length){ items[i].sel = n - 1; draw(); }
      else if(e.key === 'ArrowRight' && i < items.length - 1){ i++; draw(); }
      else if(e.key === 'ArrowLeft' && i){ i--; draw(); }
    }
    document.addEventListener('keydown', key);
    timer = setInterval(tick, 500);
    draw();
  }

  /* ---------- Podcast (Gemini-Stimmen) ---------- */
  function chunkLines(lines, max){
    const out = [[]]; let len = 0;
    lines.forEach(l => { if(len + l.text.length > max && out[out.length - 1].length){ out.push([]); len = 0; } out[out.length - 1].push(l); len += l.text.length; });
    return out;
  }
  function pcmOf(bytes, mime){   // WAV-Kopf entfernen, falls das Modell WAV statt rohem PCM liefert
    if(!/wav/i.test(mime || '')) return bytes;
    const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    for(let i = 12; i + 8 <= bytes.length;){
      const id = String.fromCharCode(bytes[i], bytes[i + 1], bytes[i + 2], bytes[i + 3]), size = dv.getUint32(i + 4, true);
      if(id === 'data') return bytes.subarray(i + 8, Math.min(bytes.length, i + 8 + size));
      i += 8 + size + (size % 2);
    }
    return bytes.subarray(44);
  }
  function wav(parts, rate){
    const size = parts.reduce((n, p) => n + p.length, 0), h = new DataView(new ArrayBuffer(44));
    const w = (o, s) => [...s].forEach((c, i) => h.setUint8(o + i, c.charCodeAt(0)));
    w(0, 'RIFF'); h.setUint32(4, 36 + size, true); w(8, 'WAVEfmt '); h.setUint32(16, 16, true); h.setUint16(20, 1, true); h.setUint16(22, 1, true);
    h.setUint32(24, rate, true); h.setUint32(28, rate * 2, true); h.setUint16(32, 2, true); h.setUint16(34, 16, true); w(36, 'data'); h.setUint32(40, size, true);
    return new Blob([h].concat(parts), {type:'audio/wav'});
  }
  // Kurze Stücke, je 3 gleichzeitig – der Worker reicht die Gemini-Antwort unverändert durch
  async function record(lines, calm, onStep){
    const chunks = chunkLines(lines, 1500), audio = new Array(chunks.length); let rate = 24000, done = 0, next = 0;
    onStep(0, chunks.length);
    async function work(){
      while(next < chunks.length){
        const i = next++;
        const j = await RH.api('/api/tts', {body:{lines: chunks[i], calm, hosts: ttsHosts}});
        if(j.error) throw new Error(typeof j.error === 'string' ? j.error : 'Die Aufnahme hat nicht geklappt.');
        const got = ((j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts) || []).filter(p => p.inlineData && p.inlineData.data);
        if(!got.length) throw new Error('Die Aufnahme hat nicht geklappt. Bitte nochmal versuchen.');
        const mime = got[0].inlineData.mimeType || '', m = mime.match(/rate=(\d+)/);
        if(m) rate = +m[1];
        else if(/wav/i.test(mime)){ const h = atob(got[0].inlineData.data.slice(0, 64)); rate = (h.charCodeAt(24) | h.charCodeAt(25) << 8 | h.charCodeAt(26) << 16) || rate; }
        const pcm = got.map(p => pcmOf(Uint8Array.from(atob(p.inlineData.data), c => c.charCodeAt(0)), p.inlineData.mimeType));
        audio[i] = pcm.length === 1 ? pcm[0] : new Uint8Array(await new Blob(pcm).arrayBuffer());
        onStep(++done, chunks.length);
      }
    }
    await Promise.all([work(), work(), work()]);
    const parts = [];
    audio.forEach((a, i) => { if(i) parts.push(new Uint8Array(Math.round(rate * (calm ? 1.5 : 0.6)) * 2)); parts.push(a); });
    return wav(parts, rate);
  }

  let player = null;
  function stopAudio(){
    if(!player) return;
    player.audio.pause(); clearInterval(player.timer); URL.revokeObjectURL(player.audio.src);
    const n = $('pcNight'); if(n) n.remove();
    player = null;
  }
  const fmt = s => isFinite(s) ? Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0') : '0:00';

  // Moderatoren: bei neuen Kursen vom Server gewählt (Name, Geschlecht, wer erklärt); ältere Kurse behalten Lena & Max
  const hostsOf = pod => (Array.isArray(pod.hosts) && pod.hosts.length === 2 ? pod.hosts : [{name:'Lena', gender:'f', role:'erklärt'}, {name:'Max', gender:'m', role:'fragt'}]);
  let ttsHosts = null;
  function renderPodcast(k, body){
    const pod = k.podcast, hosts = hostsOf(pod), hostNames = hosts.map(h => h.name).join(' & ');
    ttsHosts = hosts.map(h => ({name: h.name, gender: h.gender}));
    let calm = false; try{ calm = sessionStorage.getItem('regelheft-pod-calm') === '1'; }catch(e){}
    const key = () => k.id + ':' + (calm ? 'calm' : 'normal');
    const total = pod.lines.reduce((n, l) => n + l.text.length, 0) || 1, starts = [];
    pod.lines.reduce((n, l) => (starts.push(n / total), n + l.text.length), 0);

    async function draw(){
      stopAudio();
      const blob = await db.audio(key()).catch(() => null);
      body.innerHTML =
        '<div class="pc-player' + (calm ? ' night' : '') + '">' +
          '<div class="pc-head"><div class="pc-cover" aria-hidden="true">' + (calm ? icon('moon', 30) : icon('headphones', 30)) + '</div><div><h3>' + esc(pod.title) + '</h3><p>' + esc(hostNames) + ' · ' + (calm ? 'Einschlaf-Version' : 'Normale Version') + ' · ca. ' + Math.max(1, Math.round(total / (calm ? 650 : 850))) + ' min</p></div></div>' +
          '<div class="pc-seg" role="radiogroup" aria-label="Version"><button type="button" role="radio" aria-checked="' + !calm + '" data-m="0" class="' + (calm ? '' : 'on') + '">' + icon('headphones', 16) + 'Normal</button><button type="button" role="radio" aria-checked="' + calm + '" data-m="1" class="' + (calm ? 'on' : '') + '">' + icon('moon', 16) + 'Zum Einschlafen</button></div>' +
          '<div id="pcCtl"></div>' +
        '</div>' +
        '<details class="pc-script"><summary>Mitlesen</summary><div id="pcLines">' + pod.lines.map((l, i) => '<button type="button" class="pc-line ' + (l.speaker === hosts[1].name ? 'max' : 'lena') + '" data-i="' + i + '"><b>' + esc(l.speaker) + '</b><span>' + esc(l.text) + '</span></button>').join('') + '</div></details>';
      body.querySelector('.pc-seg').onclick = e => {
        const b = e.target.closest('[data-m]'); if(!b || (b.dataset.m === '1') === calm) return;
        calm = b.dataset.m === '1'; try{ sessionStorage.setItem('regelheft-pod-calm', calm ? '1' : '0'); }catch(e){}
        draw();
      };
      if(blob) setup(blob); else showRecord();
    }
    function showRecord(err){
      $('pcCtl').innerHTML = (err ? '<p class="pc-err">' + esc(err) + '</p>' : '') +
        '<button type="button" class="pc-rec" id="pcRec">' + icon('mic', 18) + (calm ? 'Einschlaf-Version' : 'Podcast') + ' aufnehmen</button>' +
        '<p class="pc-small">Einmalig, dauert ca. ' + (Math.ceil(chunkLines(pod.lines, 1500).length / 3) * (calm ? 55 : 40)) + ' Sek. Danach ist die Aufnahme auf diesem Gerät gespeichert.</p>';
      $('pcRec').onclick = async () => {
        const L = loader($('pcCtl'), '', true);
        const n = chunkLines(pod.lines, 1500).length, est = Math.ceil(n / 3) * (calm ? 55 : 40);   // je 3 Teile gleichzeitig
        L.estimate(est, 0, [calm ? 'Einschlaf-Version wird aufgenommen' : 'Podcast wird aufgenommen']);
        try{
          const blob = await record(pod.lines, calm, () => {}).finally(() => L.stop());
          await db.putAudio(key(), blob);
          if(body.isConnected) draw();
        }catch(e){ if(body.isConnected && $('pcCtl')) showRecord(e.message); }
      };
    }
    function setup(blob){
      const audio = new Audio(URL.createObjectURL(blob));
      audio.preload = 'auto'; audio.loop = calm;
      player = {audio, timer:null, end:null};
      $('pcCtl').innerHTML =
        '<div class="pc-row"><button type="button" class="pc-b" id="pcBk" aria-label="15 Sekunden zurück">' + icon('rotate', 16) + '15</button><button type="button" class="pc-play" id="pcPlay" aria-label="Abspielen">' + icon('play', 24, true) + '</button><button type="button" class="pc-b" id="pcFw" aria-label="15 Sekunden vor">15' + icon('rotate-cw', 16) + '</button>' +
        '<select class="pc-sel" id="pcRate" aria-label="Geschwindigkeit"><option value="0.85">0,85×</option><option value="1" selected>1×</option><option value="1.15">1,15×</option><option value="1.3">1,3×</option></select></div>' +
        '<div class="pc-seek"><span id="pcCur">0:00</span><input type="range" id="pcPos" min="0" max="1000" value="0" aria-label="Position"><span id="pcDur">0:00</span></div>' +
        '<div class="pc-row pc-sleep"><label>' + icon('timer', 16) + 'Schlaftimer <select class="pc-sel" id="pcSleep"><option value="0">Aus</option><option value="10">10 min</option><option value="20">20 min</option><option value="30"' + (calm ? ' selected' : '') + '>30 min</option><option value="45">45 min</option><option value="60">60 min</option><option value="end">Ende der Folge</option></select></label>' +
        '<label><input type="checkbox" id="pcLoop"' + (calm ? ' checked' : '') + '> ' + icon('repeat', 16) + 'Wiederholen</label>' +
        '<button type="button" class="pc-b" id="pcDark">' + icon('monitor', 16) + 'Bildschirm dunkel</button><button type="button" class="pc-b" id="pcRedo" title="Aufnahme löschen und neu erstellen">' + icon('rotate-cw', 16) + 'Neu</button></div>' +
        '<p class="pc-small" id="pcSleepT"></p>';
      const play = $('pcPlay'), pos = $('pcPos');
      const ui = () => {
        if(!play.isConnected) return;
        { const st = audio.paused ? 'p' : 'r'; if(play.dataset.s !== st){ play.dataset.s = st; play.innerHTML = icon(audio.paused ? 'play' : 'pause', 24, true); } } play.setAttribute('aria-label', audio.paused ? 'Abspielen' : 'Pause');
        $('pcCur').textContent = fmt(audio.currentTime); $('pcDur').textContent = fmt(audio.duration);
        if(audio.duration) pos.value = Math.round(audio.currentTime / audio.duration * 1000);
        const f = audio.duration ? audio.currentTime / audio.duration : 0; let cur = 0;
        while(cur + 1 < starts.length && starts[cur + 1] <= f) cur++;
        body.querySelectorAll('.pc-line').forEach((el, i) => el.classList.toggle('now', i === cur && audio.currentTime > 0));
        const nt = $('pcNightT'); if(nt) nt.textContent = player && player.end ? 'Schlaftimer: noch ' + fmt(Math.max(0, (player.end - Date.now()) / 1000)) : '';
      };
      ['timeupdate', 'play', 'pause', 'loadedmetadata', 'ended'].forEach(ev => audio.addEventListener(ev, ui));
      audio.addEventListener('ended', () => { if(!audio.loop) addXp(5); });
      play.onclick = () => audio.paused ? audio.play() : audio.pause();
      $('pcBk').onclick = () => audio.currentTime = Math.max(0, audio.currentTime - 15);
      $('pcFw').onclick = () => audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 15);
      $('pcRate').onchange = e => audio.playbackRate = +e.target.value;
      pos.oninput = () => { if(audio.duration) audio.currentTime = pos.value / 1000 * audio.duration; };
      $('pcLoop').onchange = e => audio.loop = e.target.checked;
      $('pcRedo').onclick = async () => { if(!await RH.confirm({title:'Neu aufnehmen?', text:'Die gespeicherte Aufnahme wird gelöscht und neu erstellt.', ok:'Neu aufnehmen'})) return; await db.delAudio(key()).catch(() => {}); draw(); };
      $('pcLines').onclick = e => { const l = e.target.closest('.pc-line'); if(!l || !audio.duration) return; audio.currentTime = starts[+l.dataset.i] * audio.duration; audio.play(); };
      // Schlaftimer: läuft ab dem Abspielen, in der letzten Minute wird es leiser
      function sleep(v){
        clearInterval(player.timer); player.end = null; audio.volume = 1; $('pcSleepT').textContent = '';
        if(v === '0') return;
        if(v === 'end'){ audio.loop = false; $('pcLoop').checked = false; $('pcSleepT').textContent = 'Stoppt am Ende der Folge.'; return; }
        if(audio.paused){
          $('pcSleepT').textContent = 'Schlaftimer: ' + v + ' min ab Start · wird am Ende leiser';
          audio.addEventListener('play', () => { if(player && $('pcSleep') && $('pcSleep').value === v && !player.end) sleep(v); }, {once:true});
          return;
        }
        player.end = Date.now() + v * 60000;
        player.timer = setInterval(() => {
          if(!player) return;
          const left = (player.end - Date.now()) / 1000;
          if($('pcSleepT')) $('pcSleepT').textContent = 'Schlaftimer: noch ' + fmt(Math.max(0, left)) + ' · wird am Ende leiser';
          if(left <= 60) audio.volume = Math.max(0, left / 60);
          if(left <= 0){ audio.pause(); audio.volume = 1; clearInterval(player.timer); player.end = null; if($('pcSleepT')) $('pcSleepT').textContent = 'Gute Nacht'; const n = $('pcNight'); if(n) n.remove(); }
        }, 1000);
      }
      $('pcSleep').onchange = e => sleep(e.target.value);
      if(calm) sleep('30');
      $('pcDark').onclick = () => {
        if(audio.paused) audio.play();
        const n = document.createElement('div'); n.id = 'pcNight'; n.setAttribute('role', 'button'); n.tabIndex = 0;
        n.innerHTML = '<div aria-hidden="true">' + icon('moon', 56) + '</div><p id="pcNightT"></p><small>Tippen zum Beenden</small>';
        n.onclick = () => n.remove(); n.onkeydown = e => { if(e.key === 'Enter' || e.key === 'Escape') n.remove(); };
        document.body.appendChild(n); n.focus(); ui();
      };
      if('mediaSession' in navigator){
        navigator.mediaSession.metadata = new MediaMetadata({title: pod.title, artist: 'Regelheft · ' + (calm ? 'Zum Einschlafen' : hostNames), album: k.title});
        navigator.mediaSession.setActionHandler('play', () => audio.play());
        navigator.mediaSession.setActionHandler('pause', () => audio.pause());
        navigator.mediaSession.setActionHandler('seekbackward', () => audio.currentTime -= 15);
        navigator.mediaSession.setActionHandler('seekforward', () => audio.currentTime += 15);
      }
    }
    draw();
  }

  // Zuletzt gewählten Tab wiederherstellen; bei Anmeldung/Abmeldung neu zeichnen
  Promise.all([RH.configReady, RH.ready]).then(() => {
    let t = null; try{ t = sessionStorage.getItem('regelheft-ueben-tab'); }catch(e){}
    if(STANDALONE){
      const id = new URLSearchParams(location.search).get('kurs'); if(id) view = {name:'kurs', id, tab:'pfad'};
      Promise.race([sync.all(), new Promise(r => setTimeout(r, 2500))]).catch(() => {}).then(() => route());
      document.addEventListener('visibilitychange', () => {
        if(document.visibilityState === 'hidden') return sync.flush();
        sync.all().then(ch => { if(ch && view.name === 'list' && !pending.length && !custom && !topic && !document.querySelector('.k-lesson')) route(); });
      });
      window.addEventListener('pagehide', () => sync.flush());
      return;
    }
    if(t === 'pod' && !tabs.classList.contains('is-hidden')) setTab('pod');
  });
  RH.onAuth(() => { if(active === 'pod' && !sec.classList.contains('is-hidden')) route(); });
})();
