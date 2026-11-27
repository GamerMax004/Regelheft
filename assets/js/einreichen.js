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
    fillCat();
  }
  function fillCat(){
    var list = cats($('eFach').value);
    $('eCat').innerHTML = list.map(function(c){ return '<option value="' + esc(c) + '">' + esc(c) + '</option>'; }).join('') + '<option value="' + OWN + '">Anderes Thema …</option>';
    toggleOwn();
  }
  function toggleOwn(){ $('eCatOwnW').classList.toggle('is-hidden', $('eCat').value !== OWN); }
  function category(){ return $('eCat').value === OWN ? $('eCatOwn').value.trim() : $('eCat').value; }

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

  $('eFach').onchange = fillCat;
  $('eCat').onchange = toggleOwn;
  $('eBody').addEventListener('input', preview);

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
