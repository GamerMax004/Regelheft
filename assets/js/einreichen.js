/* ============================================================
   EINTRAG EINREICHEN
   Angemeldete Nutzer schreiben eine Regel auf. Sie ist erst sichtbar, wenn das Team sie im Dashboard (Tab „Einreichungen“) freigibt.
   Server: /api/submit, /api/submit/mine, /api/submit/delete (worker.js)
   ============================================================ */
(function(){
  'use strict';
  var $ = function(id){ return document.getElementById(id); };
  var esc = function(s){ return RH.esc(String(s == null ? '' : s)); };
  var FACH_NAMEN = { mathe: 'Mathematik', physik: 'Physik', chemie: 'Chemie', biologie: 'Biologie' };
  var STATUS = { pending: ['In Prüfung', 'pending'], approved: ['Freigegeben', 'approved'], rejected: ['Abgelehnt', 'rejected'] };
  var OWN = '__eigenes__';

  function cats(fach){
    var areas = (window.BEREICHE && BEREICHE.areas[fach]) || [], out = [];
    areas.forEach(function(a){ a.cats.forEach(function(c){ out.push(c); }); });
    return out;
  }
  function fillFach(){
    var sel = $('eFach'), pre = new URLSearchParams(location.search).get('fach');
    sel.innerHTML = Object.keys(FACH_NAMEN).map(function(k){ return '<option value="' + k + '">' + FACH_NAMEN[k] + '</option>'; }).join('');
    if (pre && FACH_NAMEN[pre]) sel.value = pre;
    fachChips();
    fillCat();
  }
  function fachChips(){
    var bar = $('eFachBar'), cur = $('eFach').value;
    bar.innerHTML = Object.keys(FACH_NAMEN).map(function(k){ return '<button type="button" class="mv-chip" data-v="' + k + '" aria-pressed="' + (k === cur) + '">' + FACH_NAMEN[k] + '</button>'; }).join('');
  }
  $('eFachBar').addEventListener('click', function(e){
    var b = e.target.closest('button[data-v]'); if (!b) return;
    $('eFach').value = b.dataset.v;
    bar_pressed(this, b); fillCat();
  });
  function bar_pressed(bar, on){ bar.querySelectorAll('button').forEach(function(x){ x.setAttribute('aria-pressed', String(x === on)); }); }
  function catChips(){
    var sel = $('eCat'), box = $('eCatChips');
    box.innerHTML = Array.prototype.map.call(sel.options, function(o){ return '<button type="button" class="mv-chip" data-v="' + esc(o.value) + '" aria-pressed="' + (o.value === sel.value) + '">' + esc(o.textContent) + '</button>'; }).join('');
  }
  $('eCatChips').addEventListener('click', function(e){
    var b = e.target.closest('button[data-v]'); if (!b) return;
    $('eCat').value = b.dataset.v; toggleOwn(); bar_pressed(this, b);
    if (b.dataset.v === OWN) setTimeout(function(){ $('eCatOwn').focus(); }, 60);
  });
  function fillCat(){
    var list = cats($('eFach').value);
    $('eCat').innerHTML = list.map(function(c){ return '<option value="' + esc(c) + '">' + esc(c) + '</option>'; }).join('') + '<option value="' + OWN + '">Anderes Thema …</option>';
    catChips();
    toggleOwn();
  }
  function toggleOwn(){ $('eCatOwnW').classList.toggle('is-hidden', $('eCat').value !== OWN); }
  function category(){ return $('eCat').value === OWN ? $('eCatOwn').value.trim() : $('eCat').value; }

  /* ---------- Baukasten: der Inhalt wird aus Bausteinen zusammengesetzt, die Schreibweise macht das Formular ---------- */
  var TYPES = {
    text:    { t: 'Text',        ph: 'Schreibe in eigenen Worten …', multi: true },
    bullet:  { t: 'Aufzählung',  ph: 'Ein Punkt der Aufzählung' },
    head:    { t: 'Überschrift', ph: 'Kurze Überschrift' },
    note:    { t: 'Merkkasten',  ph: 'Das solltest du dir merken …', multi: true },
    formula: { t: 'Formel' },
    table:   { t: 'Tabelle' }
  };
  var SYMS = [['x²', '^()', 1], ['xₙ', '_()', 1], ['a⁄b', '{/}', 1], ['√', '√'], ['π', 'π'], ['·', '·'], ['±', '±'], ['≤', '≤'], ['≥', '≥'], ['≠', '≠'], ['Δ', 'Δ'], ['°', '°'], ['→', '→'], ['Fett', '**', 2]];
  var lastField = null;
  function blocksEl(){ return $('eBlocks'); }
  function mkBlock(type, vals){
    var d = TYPES[type], el = document.createElement('div'), inner = '';
    el.className = 'e-block'; el.dataset.type = type;
    if (type === 'formula') inner = '<input type="text" class="e-f-a" placeholder="z. B. a^(2) + b^(2) = c^(2)" aria-label="Formel" autocomplete="off"><input type="text" class="e-f-b" placeholder="Erklärung (optional)" aria-label="Erklärung zur Formel" autocomplete="off">';
    else if (type === 'table') inner = '<div class="e-tbl"></div><div class="e-tbl-a"><button type="button" class="mv-chip" data-t="row+">Zeile +</button><button type="button" class="mv-chip" data-t="row-">Zeile −</button><button type="button" class="mv-chip" data-t="col+">Spalte +</button><button type="button" class="mv-chip" data-t="col-">Spalte −</button></div>';
    else if (d.multi) inner = '<textarea rows="3" placeholder="' + d.ph + '" aria-label="' + d.t + '"></textarea>';
    else inner = '<input type="text" placeholder="' + d.ph + '" aria-label="' + d.t + '" autocomplete="off">';
    el.innerHTML = '<div class="e-block-h"><span class="e-block-t">' + d.t + '</span><span class="e-block-a"><button type="button" data-act="up" aria-label="Nach oben">↑</button><button type="button" data-act="down" aria-label="Nach unten">↓</button><button type="button" data-act="del" aria-label="Baustein entfernen">×</button></span></div>' + inner;
    if (type === 'table') { var g = el.querySelector('.e-tbl'); g.dataset.cols = '2'; for (var r = 0; r < 3; r++) addRow(g); }
    if (vals && vals[0] != null) { var f = el.querySelector('input,textarea'); if (f) f.value = vals[0]; }
    return el;
  }
  function addRow(g){ var n = +g.dataset.cols, row = document.createElement('div'); row.className = 'e-tr'; row.style.gridTemplateColumns = 'repeat(' + n + ',minmax(0,1fr))'; for (var i = 0; i < n; i++) row.appendChild(cell(g.children.length === 0)); g.appendChild(row); }
  function cell(head){ var i = document.createElement('input'); i.type = 'text'; i.maxLength = 40; i.setAttribute('aria-label', 'Tabellenzelle'); if (head) i.placeholder = 'Kopf'; return i; }
  function tableOp(g, op){
    var rows = g.children, cols = +g.dataset.cols;
    if (op === 'row+') addRow(g);
    else if (op === 'row-' && rows.length > 2) g.lastElementChild.remove();
    else if (op === 'col+' && cols < 4) { g.dataset.cols = cols + 1; Array.prototype.forEach.call(rows, function(r, i){ r.appendChild(cell(i === 0)); r.style.gridTemplateColumns = 'repeat(' + (cols + 1) + ',minmax(0,1fr))'; }); }
    else if (op === 'col-' && cols > 2) { g.dataset.cols = cols - 1; Array.prototype.forEach.call(rows, function(r){ r.lastElementChild.remove(); r.style.gridTemplateColumns = 'repeat(' + (cols - 1) + ',minmax(0,1fr))'; }); }
  }
  function serialize(){
    var out = [];
    Array.prototype.forEach.call(blocksEl().children, function(b){
      var t = b.dataset.type, f = b.querySelectorAll('input,textarea'), v = f[0] ? f[0].value.trim() : '';
      if (t === 'text') { v.split('\n').forEach(function(l){ if (l.trim()) out.push(l.trim()); }); }
      else if (t === 'bullet') { if (v) out.push('- ' + v); }
      else if (t === 'head') { if (v) out.push('## ' + v); }
      else if (t === 'note') { v.split('\n').forEach(function(l){ if (l.trim()) out.push('! ' + l.trim()); }); }
      else if (t === 'formula') { var e = f[1] ? f[1].value.trim() : ''; if (v) out.push('$ ' + v + (e ? ' ‖ ' + e : '')); }
      else if (t === 'table') {
        var rows = Array.prototype.map.call(b.querySelectorAll('.e-tr'), function(r){ return Array.prototype.map.call(r.querySelectorAll('input'), function(i){ return i.value.trim().replace(/[§;]/g, ','); }).join('§'); })
          .filter(function(r){ return r.replace(/§/g, '').length; });
        if (rows.length) out.push('T: ' + rows.join(' ;; '));
      }
    });
    return out.join('\n');
  }
  function sync(){ $('eBody').value = serialize(); preview(); }
  function addBlock(type, focus){
    var el = mkBlock(type); el.classList.add('is-new'); blocksEl().appendChild(el);
    setTimeout(function(){ el.classList.remove('is-new'); }, 450);
    if (focus !== false) { var f = el.querySelector('input,textarea'); if (f) { f.focus({ preventScroll: false }); lastField = f; } }
    sync();
  }
  function resetBlocks(){ blocksEl().innerHTML = ''; lastField = null; addBlock('text', false); }
  document.querySelector('.e-add').addEventListener('click', function(e){ var b = e.target.closest('[data-add]'); if (b) addBlock(b.dataset.add); });
  blocksEl().addEventListener('input', sync);
  blocksEl().addEventListener('focusin', function(e){ if (e.target.matches('input,textarea')) lastField = e.target; });
  blocksEl().addEventListener('click', function(e){
    var t = e.target.closest('[data-t]'), a = e.target.closest('[data-act]'), blk = e.target.closest('.e-block');
    if (t && blk) { tableOp(blk.querySelector('.e-tbl'), t.dataset.t); sync(); return; }
    if (!a || !blk) return;
    if (a.dataset.act === 'del') {
      if (window.mvBuzz) mvBuzz(8);
      blk.classList.add('is-out');
      setTimeout(function(){ blk.remove(); if (!blocksEl().children.length) addBlock('text', false); sync(); }, 220);
    } else if (a.dataset.act === 'up' && blk.previousElementSibling) { blk.parentNode.insertBefore(blk, blk.previousElementSibling); sync(); }
    else if (a.dataset.act === 'down' && blk.nextElementSibling) { blk.parentNode.insertBefore(blk.nextElementSibling, blk); sync(); }
  });
  $('eSym').innerHTML = SYMS.map(function(s, i){ return '<button type="button" class="e-sym-b" data-i="' + i + '">' + s[0] + '</button>'; }).join('');
  $('eSym').addEventListener('mousedown', function(e){ e.preventDefault(); });   // Eingabefeld behält den Fokus
  $('eSym').addEventListener('click', function(e){
    var b = e.target.closest('[data-i]'); if (!b) return;
    var f = lastField && document.body.contains(lastField) ? lastField : blocksEl().querySelector('input,textarea'); if (!f) return;
    var s = SYMS[+b.dataset.i], ins = s[1], a = f.selectionStart || 0, z = f.selectionEnd || 0, v = f.value, mid = v.slice(a, z), caret;
    if (s[2] === 2) { ins = '**' + mid + '**'; caret = mid ? a + ins.length : a + 2; }
    else if (s[2] === 1) { caret = a + ins.indexOf(ins.indexOf('(') >= 0 ? '(' : '{') + 1; if (mid && ins.indexOf('(') >= 0) { ins = ins.replace('()', '(' + mid + ')'); caret = a + ins.length; } }
    else caret = a + ins.length;
    f.value = v.slice(0, a) + ins + v.slice(z); f.focus(); f.setSelectionRange(caret, caret); sync();
  });
  $('eForm').addEventListener('reset', function(){ setTimeout(function(){ resetBlocks(); fachChips(); fillCat(); sync(); }, 0); });
  resetBlocks();

  var tmr;
  function preview(){
    var t = $('eBody').value; $('eCount').textContent = t.length + ' / 4000';
    clearTimeout(tmr);
    tmr = setTimeout(function(){
      var box = $('ePrev');
      if (!t.trim()) { box.innerHTML = '<span class="e-muted">Hier siehst du, wie dein Eintrag aussieht.</span>'; return; }
      try { box.innerHTML = formatBody(t); } catch (e) { box.textContent = t; }
    }, 150);
  }

  function err(t){ $('eErr').textContent = t || ''; }
  function when(ts){ return new Date(ts).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' }); }

  async function loadMine(){
    try {
      var j = await RH.api('/api/submit/mine');
      $('eMine').classList.toggle('is-hidden', !j.items.length);
      $('eList').innerHTML = j.items.map(function(s){
        var st = STATUS[s.status] || STATUS.pending;
        return '<div class="e-item"><div class="e-item-top"><b>' + esc(s.title) + '</b><span class="e-badge is-' + st[1] + '">' + st[0] + '</span></div>'
          + '<div class="e-muted">' + esc(FACH_NAMEN[s.fach] || s.fach) + ' · ' + esc(s.category) + ' · ' + when(s.created_at) + '</div>'
          + (s.note ? '<p class="e-note">Hinweis vom Team: ' + esc(s.note) + '</p>' : '')
          + '<button type="button" class="e-del" data-id="' + s.id + '">' + (s.status === 'approved' ? 'Zurückziehen und entfernen' : 'Zurückziehen') + '</button></div>';
      }).join('');
    } catch (e) {}
  }

  $('eList').addEventListener('click', async function(e){
    var b = e.target.closest('.e-del'); if (!b) return;
    if (!confirm('Diesen Eintrag zurückziehen? Er wird gelöscht und ist dann auch im Regelheft nicht mehr zu sehen.')) return;
    try { await RH.api('/api/submit/delete', { body: { id: +b.dataset.id } }); loadMine(); } catch (er) { err(er.message); }
  });

  $('eFach').onchange = function(){ fachChips(); fillCat(); };
  $('eCat').onchange = toggleOwn;

  $('eForm').addEventListener('submit', async function(e){
    e.preventDefault(); err('');
    var data = { fach: $('eFach').value, category: category(), title: $('eTitle').value.trim(), body: $('eBody').value.trim(),
      source: $('eSource').value.trim(), credit: $('eCredit').value.trim(), rights: $('eRights').checked, license: $('eLicense').checked };
    if (data.category.length < 2) return err('Bitte wähle ein Thema oder schreibe ein eigenes.');
    if (data.title.length < 3) return err('Bitte gib einen Titel ein.');
    if (data.body.length < 20) return err('Der Inhalt ist noch zu kurz (mindestens 20 Zeichen).');
    if (!data.rights || !data.license) return err('Bitte bestätige beide Hinweise ganz unten.');
    var btn = $('eSend'); btn.disabled = true; btn.textContent = 'Wird gesendet …';
    try {
      await RH.api('/api/submit', { body: data });
      $('eForm').reset(); fillCat(); preview();
      err('');
      $('eErr').textContent = ''; var ok = document.createElement('p'); ok.className = 'e-ok'; ok.setAttribute('role', 'status');
      ok.textContent = 'Danke! Dein Eintrag ist angekommen. Das Team prüft ihn, danach erscheint er im Regelheft.';
      $('eForm').insertAdjacentElement('beforebegin', ok); setTimeout(function(){ ok.remove(); }, 9000);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      loadMine();
    } catch (er) { err(er.message || 'Das hat leider nicht geklappt.'); }
    btn.disabled = false; btn.textContent = 'Einreichen';
  });

  RH.ready.then(function(){
    var cfg = RH.cfg ? RH.cfg() : {};
    if (cfg.submit === false) { $('eOff').classList.remove('is-hidden'); return; }
    if (!RH.user()) {
      var n = $('eNeed'); n.classList.remove('is-hidden');
      n.innerHTML = 'Zum Einreichen brauchst du ein Konto. <a href="anmeldung.html?next=einreichen.html">Jetzt anmelden</a>';
      return;
    }
    fillFach(); $('eForm').classList.remove('is-hidden'); loadMine();
  });
})();
