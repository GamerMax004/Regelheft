/* ============================================================
   Regelheft Pro: Tarife anzeigen und zur Bezahlung (Stripe) weiterleiten
   Preise kommen live von Stripe, die Texte stehen hier.
   ============================================================ */
(function(){
  const $ = id => document.getElementById(id);
  document.querySelectorAll('[data-icon]').forEach(el => { el.innerHTML = icon(el.dataset.icon, +el.dataset.size || 20); });
  const params = new URLSearchParams(location.search);
  let plans = [], chosen = 'month';
  const eur = (c, cur) => new Intl.NumberFormat('de-DE', {style:'currency', currency:(cur || 'eur').toUpperCase()}).format(c / 100);
  const CHECK = icon('check', 18);

  function renderList(){
    const c = RH.cfg().billing, f = c.proFeatures;
    const items = [];
    if(f.practice) items.push('Üben mit Karteikarten: Regeln abfragen und den Lernstand speichern');
    if(f.notes) items.push('Eigene Notizen zu jeder Regel (Eselsbrücken, Beispiele)');
    items.push('KI-Aufgabenhilfe ohne Tageslimit' + (c.freeAiPerDay >= 0 ? ' (sonst ' + c.freeAiPerDay + ' Chats pro Tag)' : ''));
    items.push('Jederzeit kündbar, keine versteckten Kosten');
    $('proList').innerHTML = items.map(t => '<li>' + CHECK + '<span>' + RH.esc(t) + '</span></li>').join('');
    $('proFine').innerHTML = (c.kleinunternehmer ? 'Gemäß § 19 UStG wird keine Umsatzsteuer berechnet. ' : 'Alle Preise inkl. gesetzlicher Umsatzsteuer. ')
      + 'Das Abo verlängert sich automatisch um den gewählten Zeitraum und ist jederzeit unter „Mein Konto“ kündbar. Zahlungsabwicklung und Rechnungsstellung erfolgen über Scherer Integration Excellence, Zahlungsdienstleister ist Stripe (Karte, SEPA-Lastschrift u. a.); auf deiner Kreditkarten- bzw. Kontoabrechnung erscheint die Belastung in der Regel unter Stripe. Es gelten die <a href="agb.html" target="_blank">AGB</a>, die <a href="widerruf.html" target="_blank">Widerrufsbelehrung</a> und die <a href="datenschutz.html" target="_blank">Datenschutzerklärung</a>.'
      + (c.note ? ' ' + RH.esc(c.note) : '');
  }
  function renderPlans(){
    const m = plans.find(p => p.id === 'month'), y = plans.find(p => p.id === 'year');
    $('plans').innerHTML = plans.map(p => {
      const name = p.id === 'year' ? 'Pro Jahr' : 'Pro Monat';
      const per = p.id === 'year' ? ' / Jahr' : ' / Monat';
      const sub = p.id === 'year' ? 'entspricht ' + eur(Math.round(p.amount / 12), p.currency) + ' pro Monat' : 'monatlich kündbar';
      const save = p.id === 'year' && m ? Math.round((1 - p.amount / (m.amount * 12)) * 100) : 0;
      return '<label class="plan' + (chosen === p.id ? ' on' : '') + '"><input type="radio" name="plan" value="' + p.id + '"' + (chosen === p.id ? ' checked' : '') + '>'
        + (save > 0 ? '<span class="plan-badge">Spare ' + save + ' %</span>' : '')
        + '<div class="plan-name">' + name + '</div><div class="plan-price">' + eur(p.amount, p.currency) + '<small>' + per + '</small></div><div class="plan-sub">' + sub + '</div></label>';
    }).join('');
    $('plans').querySelectorAll('input').forEach(i => i.onchange = () => { chosen = i.value; renderPlans(); });
  }
  async function loadPlans(){
    try{ const j = await RH.api('/api/billing/plans'); plans = j.plans || []; }catch(e){ plans = []; }
    if(!plans.length){ $('plans').innerHTML = '<p class="page-lead">Die Preise konnten gerade nicht geladen werden. Bitte versuche es später noch einmal.</p>'; $('proGo').disabled = true; return; }
    chosen = plans[0].id; renderPlans();
  }
  function state(){
    const c = RH.cfg();
    if(!c.billing.enabled){ $('proMain').classList.add('is-hidden'); $('proOff').classList.remove('is-hidden'); return; }
    $('proMain').classList.remove('is-hidden'); $('proOff').classList.add('is-hidden');
    renderList();
    const u = RH.user();
    $('proLogin').classList.toggle('is-hidden', !!u);
    $('proForm').classList.toggle('is-hidden', !u);
    if(u && u.pro){
      $('proBuy').classList.add('is-hidden'); $('proActive').classList.remove('is-hidden');
      $('proActiveLine').textContent = u.admin ? 'Als Betreiber hast du alle Funktionen.' : 'Pro aktiv' + (u.proUntil ? ' bis ' + new Date(u.proUntil).toLocaleDateString('de-DE') : '') + (u.cancelAtEnd ? ' (gekündigt, endet dann)' : '');
    }else{ $('proBuy').classList.remove('is-hidden'); $('proActive').classList.add('is-hidden'); }
  }
  $('proGo').onclick = async () => {
    const err = t => { $('proErr').textContent = t; };
    if(!$('c18').checked || !$('cWaiver').checked) return err('Bitte bestätige beide Hinweise.');
    err(''); $('proGo').disabled = true; $('proGo').textContent = 'Einen Moment …';
    try{
      const j = await RH.api('/api/billing/checkout', {body:{plan:chosen, confirm18:true, waiver:true}});
      location.href = j.url;
    }catch(e){
      if(e.code === 'verify_required') RH.openEmailDialog({dismissible:true});
      err(e.message); $('proGo').disabled = false; $('proGo').textContent = 'Zahlungspflichtig bestellen';
    }
  };

  // Rückkehr von der Bezahlseite: kurz warten, bis Stripe uns die Zahlung gemeldet hat
  async function afterPay(){
    $('proWait').classList.remove('is-hidden'); $('proBuy').classList.add('is-hidden');
    for(let i = 0; i < 20; i++){
      try{ const u = await RH.refreshUser(); if(u && u.pro){ $('proWait').classList.add('is-hidden'); state(); history.replaceState(null, '', 'pro.html'); return; } }catch(e){}
      await new Promise(r => setTimeout(r, 2000));
    }
    $('proWait').innerHTML = '<h3>Danke!</h3><p class="page-lead" style="margin:6px 0 0">Die Freischaltung dauert etwas länger. Bitte lade die Seite gleich noch einmal neu. Falls Pro nicht erscheint, schreib uns kurz.</p>';
  }
  Promise.all([RH.configReady, RH.ready]).then(async () => {
    state(); RH.onAuth(state); RH.onConfig(state);
    if(RH.cfg().billing.enabled) await loadPlans();
    if(params.get('ok') === '1' && RH.user()) afterPay();
    else if(params.get('cancel') === '1') $('proErr').textContent = 'Der Kauf wurde abgebrochen. Es wurde nichts berechnet.';
  });
})();
