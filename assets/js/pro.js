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
  const CHECK = icon('check', 18), CROSS = icon('x', 18);
  const NAMES = {plus_month:'Plus Monat', plus_year:'Plus Jahr', month:'Pro Monat', year:'Pro Jahr'};

  function renderList(){
    const c = RH.cfg().billing, f = c.proFeatures, pf = c.plusFeatures || {}, plus = !!c.plusAvailable;
    const li = (t, no) => '<li' + (no ? ' class="no"' : '') + '>' + (no ? CROSS : CHECK) + '<span>' + RH.esc(t) + '</span></li>';
    const head = (t, s) => '<li class="tier-h">' + RH.esc(t) + (s ? ' <small>' + RH.esc(s) + '</small>' : '') + '</li>';
    const pro = [];
    if(f.practice) pro.push(li('Üben mit Karteikarten: Regeln abfragen und den Lernstand speichern'));
    if(f.notes) pro.push(li('Eigene Notizen zu jeder Regel (Eselsbrücken, Beispiele)'));
    pro.push(li('KI-Aufgabenhilfe ohne Tageslimit' + (c.freeAiPerDay >= 0 ? ' (kostenlos: ' + c.freeAiPerDay + ' Chats pro Tag)' : '')));
    let out = [];
    if(plus){
      const pl = [];
      pl.push(li('KI-Aufgabenhilfe mit ' + c.plusAiPerDay + ' Chats pro Tag (kostenlos: ' + c.freeAiPerDay + ')'));
      if(f.notes) pl.push(li('Eigene Notizen zu jeder Regel (Eselsbrücken, Beispiele)', !pf.notes));
      if(f.practice) pl.push(li('Üben mit Karteikarten' + (pf.practice ? '' : ' (nur mit Pro)'), !pf.practice));
      out = [head('Plus', 'mehr Limit, günstiger'), ...pl.filter((_, i) => true), head('Pro', 'alles ohne Limit'), ...pro];
    }else out = pro;
    out.push(li('Jederzeit kündbar, keine versteckten Kosten'));
    $('proList').innerHTML = out.join('');
    $('proFine').innerHTML = (c.kleinunternehmer ? 'Gemäß § 19 UStG wird keine Umsatzsteuer berechnet. ' : 'Alle Preise inkl. gesetzlicher Umsatzsteuer. ')
      + 'Das Abo verlängert sich automatisch um den gewählten Zeitraum und ist jederzeit unter „Mein Konto“ kündbar. Zahlungsabwicklung und Rechnungsstellung erfolgen über Scherer Development Excellence, Zahlungsdienstleister ist Stripe (Karte, SEPA-Lastschrift u. a.); auf deiner Kreditkarten- bzw. Kontoabrechnung erscheint die Belastung in der Regel unter Stripe. Es gelten die <a href="agb.html" target="_blank">AGB</a>, die <a href="widerruf.html" target="_blank">Widerrufsbelehrung</a> und die <a href="datenschutz.html" target="_blank">Datenschutzerklärung</a>.'
      + (c.note ? ' ' + RH.esc(c.note) : '');
  }
  function renderPlans(){
    const both = plans.some(p => p.id.startsWith('plus')) && plans.some(p => !p.id.startsWith('plus'));
    $('plans').innerHTML = plans.map((p, i) => {
      const yearly = p.id.endsWith('year'), isPlus = p.id.startsWith('plus');
      const m = plans.find(q => q.id === (isPlus ? 'plus_month' : 'month'));
      const name = NAMES[p.id] || p.id;
      const per = yearly ? ' / Jahr' : ' / Monat';
      const sub = yearly ? 'entspricht ' + eur(Math.round(p.amount / 12), p.currency) + ' pro Monat' : 'monatlich kündbar';
      const save = yearly && m ? Math.round((1 - p.amount / (m.amount * 12)) * 100) : 0;
      const first = both && (i === 0 || plans[i - 1].id.startsWith('plus') !== isPlus);
      return (first ? '<div class="plan-group">' + (isPlus ? 'Plus: mehr Limit, günstiger' : 'Pro: alles ohne Limit') + '</div>' : '')
        + '<label class="plan' + (chosen === p.id ? ' on' : '') + '"><input type="radio" name="plan" value="' + p.id + '"' + (chosen === p.id ? ' checked' : '') + '>'
        + (save > 0 ? '<span class="plan-badge">Spare ' + save + ' %</span>' : '')
        + '<div class="plan-name">' + name + '</div><div class="plan-price">' + eur(p.amount, p.currency) + '<small>' + per + '</small></div><div class="plan-sub">' + sub + '</div></label>';
    }).join('');
    $('plans').querySelectorAll('input').forEach(i => i.onchange = () => { chosen = i.value; renderPlans(); });
  }
  async function loadPlans(){
    try{ const j = await RH.api('/api/billing/plans'); plans = j.plans || []; }catch(e){ plans = []; }
    if(!plans.length){ $('plans').innerHTML = '<p class="page-lead">Die Preise konnten gerade nicht geladen werden. Bitte versuche es später noch einmal.</p>'; $('proGo').disabled = true; return; }
    chosen = plans.some(p => p.id === 'month') ? 'month' : plans[0].id; renderPlans();
  }
  function state(){
    const c = RH.cfg();
    if(!c.billing.enabled){ $('proMain').classList.add('is-hidden'); $('proOff').classList.remove('is-hidden'); return; }
    $('proMain').classList.remove('is-hidden'); $('proOff').classList.add('is-hidden');
    renderList();
    const u = RH.user();
    $('proLogin').classList.toggle('is-hidden', !!u);
    $('proForm').classList.toggle('is-hidden', !u);
    const tier = u && u.pro ? 'Pro' : (u && u.plus ? 'Plus' : null);
    if(tier){
      $('proBuy').classList.add('is-hidden'); $('proActive').classList.remove('is-hidden');
      $('proActiveH').textContent = 'Du hast ' + tier;
      $('proActiveLine').textContent = u.admin ? 'Als Betreiber hast du alle Funktionen.' : tier + ' aktiv' + (u.proUntil ? ' bis ' + new Date(u.proUntil).toLocaleDateString('de-DE') : '') + (u.cancelAtEnd ? ' (gekündigt, endet dann)' : '');
      $('proSwitch').classList.toggle('is-hidden', tier !== 'Plus');   // Plus → Pro: Tarifwechsel im Stripe-Kundenportal
    }else{ $('proBuy').classList.remove('is-hidden'); $('proActive').classList.add('is-hidden'); }
  }
  $('proSwitch').onclick = async () => {
    $('proActiveErr').textContent = '';
    try{ const j = await RH.api('/api/billing/portal', {body:{}}); location.href = j.url; }
    catch(e){ $('proActiveErr').textContent = e.message; }
  };
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
      try{ const u = await RH.refreshUser(); if(u && (u.pro || u.plus)){ $('proWait').classList.add('is-hidden'); state(); history.replaceState(null, '', 'pro.html'); return; } }catch(e){}
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
