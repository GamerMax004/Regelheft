/* ============================================================
   Dashboard (Seite dashboard.html) – nur für den Betreiber (Admin)
   ============================================================ */
(function(){
  const $ = id => document.getElementById(id);
  const RULES = window.RULES;
  const esc = RH.esc, api = RH.api;
  const prettyModel = m => String(m).replace(/(^|[-\/])([a-z])/g, (_, p, c) => p + c.toUpperCase());
  const openRule = id => { location.href = 'index.html?from=dashboard#' + encodeURIComponent(id); };
  // ---------- Dashboard (nur Admin) ----------
  const T = ts => new Date(ts).toLocaleString('de-DE', {day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit'});
  const ruleTitle = id => { const r = RULES.find(x => x.id === id); return r ? r.title : id; };
  const bars = (rows, label) => {
    const max = Math.max(1, ...rows.map(r => r.c));
    return rows.length ? rows.map(r => '<div class="dash-row"><i style="width:' + Math.round(r.c / max * 100) + '%"></i><span>' + esc(label(r)) + '</span><span><b>' + r.c + '×</b></span></div>').join('') : '<p class="ai-sub">Noch keine Daten.</p>';
  };
  async function dashLoad(tab){
    const box = $('dashBody');
    $('dashTabOv').classList.toggle('ghost', tab !== 'ov'); $('dashTabChats').classList.toggle('ghost', tab !== 'chats');
    box.innerHTML = '<div class="ai-bubble muted">Lade …</div>';
    try{
      if(tab === 'chats'){
        const j = await RH.api('/api/admin/chats');
        box.innerHTML = j.chats.length ? '' : '<p class="ai-sub">Noch keine Chats.</p>';
        j.chats.forEach(c => {
          const b = document.createElement('button'); b.className = 'ai-rule';
          b.innerHTML = '<b>' + esc(c.title || 'Ohne Titel') + '</b><span>' + esc(c.username) + ' · ' + T(c.updated_at) + '</span>';
          b.onclick = () => dashChat(c.id); box.appendChild(b);
        });
      }else{
        const j = await RH.api('/api/admin/overview');
        box.innerHTML = '<div class="dash-stats"><div class="dash-stat"><b>' + j.users + '</b><span>Nutzer</span></div><div class="dash-stat"><b>' + j.chats + '</b><span>Chats</span></div><div class="dash-stat"><b>' + j.searches + '</b><span>Suchen</span></div></div>'
          + '<div class="dash-h">Häufigste Suchen</div>' + bars(j.topSearches, r => r.value)
          + '<div class="dash-h">Meistgeöffnete Regeln</div>' + bars(j.topRules, r => ruleTitle(r.value))
          + '<div class="dash-h">Neueste Nutzer</div>' + (j.newUsers.map(u => '<div class="dash-row"><span>' + esc(u.username) + '</span><span>' + T(u.created_at) + '</span></div>').join('') || '<p class="ai-sub">Noch keine Nutzer.</p>');
      }
    }catch(e){ box.innerHTML = '<div class="ai-bubble err">' + esc(e.message) + '</div>'; }
  }
  async function dashChat(id){
    const box = $('dashBody'); box.innerHTML = '<div class="ai-bubble muted">Lade …</div>';
    try{
      const j = await RH.api('/api/admin/chat?id=' + encodeURIComponent(id));
      let h = '<button class="ai-btn ghost" id="dashToList" style="margin-top:0"><svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" style=\"vertical-align:-3px;margin-right:6px\"><path d=\"M19 12H5\"/><path d=\"m12 19-7-7 7-7\"/></svg>Alle Chats</button><div class="ai-bubble"><div class="ai-lbl">' + esc(j.username) + ' · ' + T(j.updated_at) + '</div><b>' + esc(j.title || 'Ohne Titel') + '</b></div>';
      if(j.thumb) h += '<img class="ai-thumb" src="' + esc(j.thumb) + '" alt="">';
      j.messages.forEach(m => { h += '<div class="ai-bubble ' + (m.role === 'user' ? 'user' : '') + '"><div class="ai-lbl">' + (m.role === 'user' ? esc(j.username) : 'KI') + '</div><p>' + esc(m.text) + '</p></div>'; });
      (j.rule_ids || []).forEach(rid => { h += '<button class="ai-rule" data-id="' + esc(rid) + '"><b>' + esc(ruleTitle(rid)) + '</b></button>'; });
      if(j.model) h += '<div class="ai-model">Antwort generiert von <b>' + esc(prettyModel(j.model)) + '</b></div>';
      box.innerHTML = h;
      box.querySelector('#dashToList').onclick = () => dashLoad('chats');
      box.querySelectorAll('.ai-rule').forEach(b => b.onclick = () => openRule(b.dataset.id));
    }catch(e){ box.innerHTML = '<div class="ai-bubble err">' + esc(e.message) + '</div>'; }
  }

  $('dashTabOv').onclick = () => dashLoad('ov');
  $('dashTabChats').onclick = () => dashLoad('chats');

  RH.ready.then(() => {
    const u = RH.user();
    if(!u){ RH.toLogin('dashboard.html'); return; }
    $('dashLoading').classList.add('is-hidden');
    if(!u.admin){ $('dashDenied').classList.remove('is-hidden'); return; }
    $('dashApp').classList.remove('is-hidden');
    dashLoad('ov');
  });
})();
