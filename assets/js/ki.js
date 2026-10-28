/* ============================================================
   KI-Aufgabenhilfe (Seite ki.html) – nur mit Konto
   Adresse des Servers: config.js -> AI_CONFIG
   ============================================================ */
(function(){
  const $ = id => document.getElementById(id);
  const RULES = window.RULES;
  const LOGO = '<img class="ai-logo" alt="Gemini als Ladeanimation" src="assets/img/gemini.png">';
  const esc = RH.esc, api = RH.api;
  const PROV = {gemini:'Google Gemini', groq:'Groq'};
  const chats = []; let cur = null, seq = 0;   // Chats leben nur im Arbeitsspeicher: Tab schließen oder neu laden = weg

  const hhmm = d => d.toLocaleTimeString('de-DE', {hour:'2-digit', minute:'2-digit'});
  const logoFor = j => /^gemini/i.test(j.model || '') ? LOGO : '';
  const prettyModel = m => String(m).replace(/(^|[-\/])([a-z])/g, (_, p, c) => p + c.toUpperCase());
  const modelLine = j => j.model ? '<div class="ai-model">Antwort generiert von <b>' + esc(prettyModel(j.model)) + '</b></div>' : '';

  function toJpeg(file, max){
    return new Promise((res, rej) => {
      const img = new Image(), u = URL.createObjectURL(file);
      img.onload = () => {
        const k = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(u);
        res(c.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = rej; img.src = u;
    });
  }
  // Regel öffnen = Startseite mit #regel-id (der Zurück-Knopf des Browsers führt wieder hierher)
  function openRule(id){ location.href = 'index.html?from=ki#' + encodeURIComponent(id); }

  function renderHist(){
    $('aiHistBtn').textContent = 'Chats (' + chats.length + ')';
    const l = $('aiHistList'); l.innerHTML = '';
    chats.slice().reverse().forEach(c => {
      const b = document.createElement('button');
      b.className = 'ai-rule' + (c === cur ? ' cur' : '');
      b.innerHTML = '<b>' + esc(c.title) + '</b><span>' + hhmm(c.time) + (c.busy ? ' · läuft …' : '') + (c === cur ? ' · geöffnet' : '') + '</span>';
      b.onclick = () => activate(c);
      l.appendChild(b);
    });
  }
  function activate(c){
    cur = c;
    if(c.restored && !c.loaded) loadChat(c);
    chats.forEach(x => x.el.style.display = x === c ? '' : 'none');
    $('aiHist').style.display = 'none';
    renderHist();
    history.replaceState(null, '', (c.restored || c.msgs.length) ? '#' + c.cid : location.pathname + location.search);
    window.scrollTo(0, 0);
  }

  function removeChat(c){
    if(!confirm('Diesen Chat wirklich löschen?')) return;
    const i = chats.indexOf(c);
    chats.splice(i, 1); c.el.remove();
    if(RH.user()) api('/api/chat/delete', {body:{chatId:c.cid}}).catch(() => {});
    if(cur === c){ if(chats.length) activate(chats[Math.min(i, chats.length - 1)]); else newChat(); }
    else renderHist();
  }
  function startNew(){ if(cur && !cur.msgs.length){ activate(cur); return; } newChat(); }

  async function loadChat(c){
    c.loaded = true;
    const wait = c.add('<span class="ai-shimmer">Lade Chat …</span>', 'muted');
    try{
      const j = await api('/api/chat?id=' + encodeURIComponent(c.cid));
      wait.remove();
      if(j.thumb) c.add('<div class="ai-lbl">Deine Aufgabe</div><img class="ai-thumb" src="' + esc(j.thumb) + '" alt="">', 'user');
      j.messages.forEach(m => {
        if(m.role === 'user' && !m.text) return;
        c.add('<div class="ai-lbl">' + (m.role === 'user' ? 'Du' : 'KI') + '</div><p>' + esc(m.text) + '</p>', m.role === 'user' ? 'user' : '');
      });
      const ids = (j.rule_ids || []).filter(id => RULES.some(r => r.id === id));
      let h = ids.length ? '<div class="ai-lbl">Vorgeschlagene Regeln</div>' + ids.map(id => '<button class="ai-rule" data-id="' + esc(id) + '"><b>' + esc(ruleTitle(id)) + '</b></button>').join('') : '';
      h += modelLine(j) + '<button class="ai-btn ghost ai-new">Neuer Chat</button>';
      const d = c.add(h);
      d.querySelectorAll('.ai-rule').forEach(b => b.onclick = () => openRule(b.dataset.id));
      d.querySelector('.ai-new').onclick = startNew;
    }catch(e){ wait.remove(); c.loaded = false; c.add(esc(e.message), 'err'); }
  }
  async function loadHistory(){
    try{
      const j = await api('/api/chats');
      for(let i = chats.length - 1; i >= 0; i--) if(chats[i].restored){ chats[i].el.remove(); chats.splice(i, 1); }
      j.chats.slice().reverse().forEach(m => newChat(m));
      renderHist();
    }catch(e){}
  }

  function newChat(meta){
    const el = $('aiTpl').content.firstElementChild.cloneNode(true);
    const c = {title:'Neuer Chat', n:++seq, cid:'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8), time:new Date(), image:null, msgs:[], busy:false, el};
    const q = s => el.querySelector(s), thread = q('.ai-thread');
    c.add = (html, cls) => {
      const d = document.createElement('div');
      d.className = 'ai-bubble ' + (cls || '');
      d.innerHTML = html; thread.appendChild(d);
      if(c === cur) d.scrollIntoView({behavior:'smooth', block:'nearest'});
      return d;
    };
    const upd = () => { q('.ai-go').disabled = c.busy || !(c.image || q('.ai-text').value.trim()); };
    c.upd = upd;

    q('.ai-del').onclick = () => removeChat(c);
    q('.ai-pick').onclick = () => q('.ai-file').click();
    q('.ai-text').oninput = upd;
    q('.ai-file').onchange = async e => {
      const f = e.target.files[0]; if(!f) return;
      try{ c.image = await toJpeg(f, 1280); }catch(_){ c.add('Das Bild konnte nicht gelesen werden.', 'err'); return; }
      q('.ai-prev-img').src = c.image; q('.ai-preview').style.display = 'block'; q('.ai-pick').style.display = 'none'; upd();
    };
    q('.ai-remove').onclick = () => { c.image = null; q('.ai-file').value = ''; q('.ai-preview').style.display = 'none'; q('.ai-pick').style.display = ''; upd(); };
    q('.ai-go').onclick = async () => {
      const note = q('.ai-text').value.trim();
      c.msgs = [{role:'user', text: note || 'Welche Regeln aus dem Regelheft brauche ich für diese Aufgabe?'}];
      c.autoTitle = note ? note.slice(0, 40) : 'Foto-Aufgabe ' + c.n;
      c.title = c.autoTitle; q('.ai-title').textContent = c.title;
      history.replaceState(null, '', '#' + c.cid);
      q('.ai-del').style.display = '';
      q('.ai-setup').style.display = 'none';
      c.add('<div class="ai-lbl">Deine Aufgabe</div>' + (c.image ? '<img class="ai-thumb" src="' + c.image + '" alt="">' : '') + (note ? '<p>' + esc(note) + '</p>' : ''), 'user');
      renderHist();
      c.thumb = c.image ? await shrink(c.image, 360, 0.6) : null;
      run(c);
    };
    if(meta){
      c.cid = meta.cid; c.title = meta.title || 'Chat'; c.time = new Date(meta.updated_at); c.restored = true; c.msgs = [{role:'user', text:''}];
      q('.ai-title').textContent = c.title; q('.ai-setup').style.display = 'none'; q('.ai-del').style.display = ''; el.style.display = 'none';
      chats.push(c); $('aiChats').appendChild(el);
      return c;
    }
    chats.push(c); $('aiChats').appendChild(el); activate(c);
    return c;
  }

  function show(c, j){
    if(j.title && !c.aiTitled){ c.aiTitled = true; c.title = j.title; c.el.querySelector('.ai-title').textContent = j.title; renderHist(); }
    if(j.type === 'question'){
      c.msgs.push({role:'assistant', text:j.question});
      const head = '<div class="ai-lbl">' + logoFor(j) + 'Rückfrage</div><p>' + esc(j.question) + '</p>';
      const d = c.add(head + '<textarea rows="2" placeholder="Deine Antwort (Pflicht)"></textarea><button class="ai-btn" disabled>Antworten</button>' + modelLine(j), 'q');
      const ta = d.querySelector('textarea'), b = d.querySelector('button');
      ta.oninput = () => { b.disabled = !ta.value.trim(); };
      b.onclick = () => {
        const t = ta.value.trim(); if(!t) return;
        d.innerHTML = head + '<p class="ai-you">' + esc(t) + '</p>' + modelLine(j);
        c.msgs.push({role:'user', text:t}); run(c);
      };
      if(c === cur) ta.focus();
      return;
    }
    const ids = (j.rule_ids || []).filter(id => RULES.some(r => r.id === id));
    let h = '<div class="ai-lbl">' + logoFor(j) + 'Vorschlag</div>';
    if(j.explanation) h += '<p>' + esc(j.explanation) + '</p>';
    if(!ids.length) h += '<p>Dazu habe ich keine passende Regel gefunden.</p>';
    ids.forEach(id => {
      const r = RULES.find(x => x.id === id);
      h += '<button class="ai-rule" data-id="' + id + '"><b>' + esc(r.title) + '</b><span>' + esc(r.category) + ' · Seite ' + r.page + '</span></button>';
    });
    h += modelLine(j) + '<button class="ai-btn ghost ai-new">Neuer Chat</button>';
    const d = c.add(h);
    d.querySelectorAll('.ai-rule').forEach(b => b.onclick = () => openRule(b.dataset.id));
    d.querySelector('.ai-new').onclick = startNew;
  }

  async function run(c){
    c.busy = true; c.upd(); renderHist();
    const wait = c.add('<div class="ai-load">' + LOGO + '<span class="ai-shimmer">Die KI schaut sich die Aufgabe an …</span></div>', 'muted');
    try{
      if(AI_CONFIG.proxyUrl.includes('DEIN-PROXY')) throw new Error('Die KI ist noch nicht eingerichtet (proxyUrl fehlt im Code).');
      const j = await api('/api/ai', {body:{image:c.image, thumb:c.thumb, chatId:c.cid, messages:c.msgs, rules:RULES.map(x => ({id:x.id, title:x.title, category:x.category, hint:(x.plain || x.excerpt || '').replace(/\s+/g,' ').slice(0,100)}))}});
      wait.remove(); show(c, j); setQuota(j.quota);
    }catch(e){
      wait.remove();
      if(e.status === 401){ RH.toLogin('ki.html'); return; }
      if(e.code === 'limit'){ if(e.data && e.data.quota) setQuota(e.data.quota); c.add(esc(e.message) + '<br><a class="ai-btn" href="pro.html">Pro ansehen</a>', 'err'); c.busy = false; c.upd(); renderHist(); return; }
      if(e.code === 'verify_required'){ const d0 = c.add(esc(e.message) + '<br><button class="ai-btn">E-Mail bestätigen</button>', 'err'); d0.querySelector('button').onclick = () => RH.openEmailDialog({dismissible:true}); c.busy = false; c.upd(); renderHist(); return; }
      const d = c.add(esc(e.message || 'Unbekannter Fehler') + '<br><button class="ai-btn ghost">Erneut versuchen</button>', 'err');
      d.querySelector('button').onclick = () => { d.remove(); run(c); };
    }
    c.busy = false; c.upd(); renderHist();
  }


  function setQuota(q){
    const el = $('kiQuota'); if(!el) return;
    if(!q || !RH.cfg().billing.enabled){ el.innerHTML = ''; return; }
    const left = Math.max(0, q.limit - q.used);
    el.innerHTML = 'Heute noch <b>' + left + ' von ' + q.limit + '</b> KI-Chats frei. <a href="pro.html">Unbegrenzt mit Pro</a>';
  }
  RH.ready.then(async () => { if(RH.user() && RH.cfg().billing.enabled && !RH.isPro()){ try{ const st = await api('/api/billing/status'); if(st.quota) setQuota(st.quota); }catch(e){} } });

  // Foto/Vorschau verkleinern
  function shrink(src, max, q){
    return new Promise(res => {
      const img = new Image();
      img.onload = () => {
        const k = Math.min(1, max / Math.max(img.width, img.height)), c = document.createElement('canvas');
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); res(c.toDataURL('image/jpeg', q));
      };
      img.onerror = () => res(null); img.src = src;
    });
  }
  const ruleTitle = id => { const r = RULES.find(x => x.id === id); return r ? r.title : id; };

  $('aiNewChat').onclick = startNew;
  $('aiHistBtn').onclick = () => { const h = $('aiHist'); renderHist(); h.style.display = h.style.display === 'none' ? '' : 'none'; };

  // Ohne Konto -> zur Anmeldung. Mit Konto -> gespeicherte Chats laden, ggf. den per #-Link angegebenen öffnen.
  RH.ready.then(async () => {
    if(!RH.user()){ RH.toLogin('ki.html'); return; }
    await RH.configReady;
    const c = RH.cfg(), admin = !!RH.user().admin;
    if(!admin && (!c.features.ai || c.maintenance.enabled)){
      $('kiLoading').classList.remove('is-hidden');
      $('kiLoading').textContent = c.maintenance.enabled ? (c.maintenance.message || 'Wartungsarbeiten. Bitte später wieder vorbeischauen.') : 'Die KI-Aufgabenhilfe ist gerade deaktiviert.';
      return;
    }
    $('kiLoading').classList.add('is-hidden');
    $('kiApp').classList.remove('is-hidden');
    await loadHistory();
    const want = location.hash.slice(1);
    const found = chats.find(x => x.cid === want);
    if(found) activate(found); else newChat();
  });
})();
