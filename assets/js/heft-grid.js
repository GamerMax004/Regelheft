/* ============================================================
   Heft-Raster: rundet die Höhe von Formel-Kästen, Tabellen, Hinweisen und Skizzen
   auf ganze Kästchen (24px), damit der Text darunter wieder auf den Linien steht.
   Läuft nur, wenn der Heft-Look an ist.
   ============================================================ */
(function(){
  const CELL = 24;
  const root = document.documentElement;
  const SEL = '.overlay-body .fl, .overlay-body .formula-block, .overlay-body .callout, .overlay-body .tbl-wrap, .overlay-body .pre, .overlay-body .diagram-frame, .overlay-body .step';
  let queued = false;
  function snap(){
    queued = false;
    const els = document.querySelectorAll(SEL);
    els.forEach(e => { e.style.minHeight = ''; });
    if(root.getAttribute('data-heft') !== 'on') return;
    // von innen nach außen: erst die Zeilen, dann die Kästen darum
    const list = Array.from(els).sort((a, b) => (a.contains(b) ? 1 : b.contains(a) ? -1 : 0));
    list.forEach(e => {
      const h = e.getBoundingClientRect().height;
      // Formel-Kästen und Hinweise bekommen oben/unten je ein halbes Kästchen Luft
      const extra = (e.matches('.formula-block, .callout')) ? CELL : 0;
      if(h > 0) e.style.minHeight = (Math.ceil((h + extra - 0.5) / CELL) * CELL) + 'px';
    });
  }
  function queue(){ if(queued) return; queued = true; requestAnimationFrame(snap); }
  new MutationObserver(queue).observe(document.body, { childList: true, subtree: true });
  new MutationObserver(queue).observe(root, { attributes: true, attributeFilter: ['data-heft', 'data-theme'] });
  window.addEventListener('resize', queue);
  window.addEventListener('load', queue);
  if(document.fonts && document.fonts.ready) document.fonts.ready.then(queue);
  queue();
})();
