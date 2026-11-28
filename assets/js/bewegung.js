/* ============================================================
   Bewegung & Gefühl (gehört zu bewegung.css). Läuft auf jeder Seite nach layout.js.
   • Rückmeldung beim Tippen (kurzes Vibrieren, wo es geht, plus eine kleine Bewegung)
   • Schalter lassen sich ziehen, nicht nur antippen
   • Tab-Leisten (.k-tabs, .fach-switch): gleitende Markierung; Finger/Maus drüberziehen wählt aus,
     wie bei Apple-Auswahlleisten. Die Dashboard-Leiste (.u-tabs) lässt sich ebenfalls so bedienen.
   ============================================================ */
(function(){
  'use strict';
  var reduce = function(){ return window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches; };
  function buzz(ms){ try{ if(window.RH && RH.haptic) RH.haptic(ms); else if(navigator.vibrate) navigator.vibrate(ms); }catch(e){} }
  window.mvBuzz = buzz;

  /* ---------- Rückmeldung beim Tippen ---------- */
  document.addEventListener('click', function(e){
    var t = e.target.closest && e.target.closest('button.u-row, .u-open, .u-tab, .k-card, .rule-card, .chip, .mv-chip, .layout-btn, .fach-switch button, .k-tabs button, .e-add button');
    if(!t) return;
    buzz(5);
    if(reduce() || !t.matches('button.u-row, .k-card, .rule-card, .mv-chip, .e-add button')) return;
    t.classList.remove('mv-tap'); void t.offsetWidth; t.classList.add('mv-tap');
    setTimeout(function(){ t.classList.remove('mv-tap'); }, 450);
  }, true);

  /* ---------- Schalter: Haptik beim Umlegen und Ziehen ---------- */
  document.addEventListener('change', function(e){
    var i = e.target;
    if(i && i.type === 'checkbox' && i.matches('.u-sw input, .sw')) buzz(8);
  });
  document.addEventListener('pointerdown', function(e){
    var ui = e.target.closest && e.target.closest('.sw-ui, .u-sw-ui');
    if(!ui || (e.pointerType === 'mouse' && e.button !== 0)) return;
    var input = ui.previousElementSibling;
    if(!input || input.type !== 'checkbox' || input.disabled) return;
    var r = ui.getBoundingClientRect(), travel = Math.max(10, r.width - r.height), startX = e.clientX, startOn = input.checked, moved = false, p = startOn ? travel : 0, id = e.pointerId;
    function move(ev){
      if(ev.pointerId !== id) return;
      var dx = ev.clientX - startX;
      if(!moved){ if(Math.abs(dx) < 5) return; moved = true; ui.classList.add('mv-drag'); try{ ui.setPointerCapture(id); }catch(_){} }
      p = Math.max(0, Math.min(travel, (startOn ? travel : 0) + dx));
      ui.style.setProperty('--mv-x', p + 'px');
      var on = p > travel / 2;
      if(on !== ui.classList.contains('mv-on')){ ui.classList.toggle('mv-on', on); buzz(6); }
    }
    function end(ev){
      if(ev.pointerId !== id) return;
      ui.removeEventListener('pointermove', move); ui.removeEventListener('pointerup', end); ui.removeEventListener('pointercancel', end);
      if(!moved) return;
      var on = p > travel / 2;
      ui.classList.remove('mv-drag', 'mv-on'); ui.style.removeProperty('--mv-x');
      var swallow = function(c){ c.preventDefault(); c.stopPropagation(); };
      window.addEventListener('click', swallow, true);          // der Klick nach dem Ziehen darf nicht noch einmal umschalten
      setTimeout(function(){ window.removeEventListener('click', swallow, true); }, 120);
      if(on !== input.checked){ input.checked = on; input.dispatchEvent(new Event('change', { bubbles: true })); }
    }
    ui.addEventListener('pointermove', move); ui.addEventListener('pointerup', end); ui.addEventListener('pointercancel', end);
    if(startOn) ui.classList.add('mv-on'); else ui.classList.remove('mv-on');
  });

  /* ---------- Tab-Leisten ---------- */
  var POS = {};   // letzte Lage je Leiste: auch neu gezeichnete Leisten gleiten von der alten Stelle zur neuen
  var SEL = ':scope > [aria-selected="true"], :scope > .on, :scope > [aria-pressed="true"]';
  var selOf = function(bar){ return bar.querySelector(SEL); };
  function keyOf(bar){ var p = bar.parentElement; return bar.className.split(' ')[0] + '@' + (bar.closest('[id]') ? bar.closest('[id]').id : (p && p.className) || ''); }

  function itemAt(bar, x){
    var best = null, bd = 1e9;
    bar.querySelectorAll(':scope > button').forEach(function(b){
      if(b.disabled || !b.offsetWidth) return;
      var r = b.getBoundingClientRect(), d = x < r.left ? r.left - x : x > r.right ? x - r.right : 0;
      if(d < bd){ bd = d; best = b; }
    });
    return best;
  }
  function dragify(bar, moveInd){
    var down = null;
    bar.addEventListener('pointerdown', function(e){
      if(e.pointerType === 'mouse' && e.button !== 0) return;
      var it = e.target.closest('button'); if(!it || it.parentElement !== bar) return;
      down = { x: e.clientX, id: e.pointerId, start: it, over: it, moved: false };
    });
    bar.addEventListener('pointermove', function(e){
      if(!down || e.pointerId !== down.id) return;
      if(!down.moved){
        if(Math.abs(e.clientX - down.x) < 10) return;
        down.moved = true; try{ bar.setPointerCapture(e.pointerId); }catch(_){}
      }
      var it = itemAt(bar, e.clientX);
      if(it && it !== down.over){ down.over = it; buzz(6); moveInd(it); }
    });
    function end(e){
      if(!down || e.pointerId !== down.id) return;
      var d = down; down = null;
      if(!d.moved) return;
      var swallow = function(c){ c.preventDefault(); c.stopPropagation(); };
      bar.addEventListener('click', swallow, true);
      setTimeout(function(){ bar.removeEventListener('click', swallow, true); }, 120);
      var cur = selOf(bar) || bar.querySelector(':scope > [aria-selected="true"]');
      if(d.over && d.over !== cur) d.over.click(); else moveInd(cur || d.start);
    }
    bar.addEventListener('pointerup', end); bar.addEventListener('pointercancel', end);
  }

  function setInd(ind, el, fx){
    if(!el || !el.offsetWidth){ ind.style.opacity = '0'; return; }
    ind.style.opacity = '1';
    if(!fx || reduce()) ind.classList.add('mv-nofx');
    ind.style.width = el.offsetWidth + 'px'; ind.style.height = el.offsetHeight + 'px';
    ind.style.transform = 'translate(' + el.offsetLeft + 'px,' + el.offsetTop + 'px)';
    if(!fx || reduce()){ void ind.offsetWidth; ind.classList.remove('mv-nofx'); }
  }
  function place(bar, fx){
    var ind = bar.querySelector(':scope > .mv-ind');
    if(!ind){ ind = document.createElement('span'); ind.className = 'mv-ind'; ind.setAttribute('aria-hidden', 'true'); bar.insertBefore(ind, bar.firstChild); }
    var on = selOf(bar);
    setInd(ind, on, fx);
    if(on && on.offsetWidth) POS[keyOf(bar)] = { x: on.offsetLeft, y: on.offsetTop, w: on.offsetWidth, h: on.offsetHeight };
    if(on && fx && bar.scrollWidth > bar.clientWidth) on.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }
  function initBar(bar){
    if(bar.dataset.mv) return;
    bar.dataset.mv = '1'; bar.classList.add('mv-bar');
    var ind = document.createElement('span'); ind.className = 'mv-ind mv-nofx'; ind.setAttribute('aria-hidden', 'true'); bar.insertBefore(ind, bar.firstChild);
    var prev = POS[keyOf(bar)];
    if(prev && !reduce()){ ind.style.width = prev.w + 'px'; ind.style.height = prev.h + 'px'; ind.style.transform = 'translate(' + prev.x + 'px,' + prev.y + 'px)'; }
    void ind.offsetWidth; ind.classList.remove('mv-nofx');
    place(bar, !!prev);
    new MutationObserver(function(list){
      list = list.filter(function(m){ return !(m.target.classList && m.target.classList.contains('mv-ind')); });   // die Markierung selbst nicht beobachten
      if(!list.length) return;
      var again = list.some(function(m){ return m.type === 'childList'; });
      place(bar, !again);
    }).observe(bar, { attributes: true, attributeFilter: ['class', 'aria-selected', 'aria-pressed'], subtree: true, childList: true });
    dragify(bar, function(it){ setInd(bar.querySelector(':scope > .mv-ind') || ind, it, true); });
  }
  function initDash(bar){   // Dashboard: eigene Markierung (.u-ind) wird nur mitgezogen
    if(bar.dataset.mvd) return; bar.dataset.mvd = '1';
    dragify(bar, function(it){
      var ind = bar.querySelector('.u-ind'); if(!ind || !it) return;
      ind.style.width = it.offsetWidth + 'px'; ind.style.transform = 'translateX(' + it.offsetLeft + 'px)';
    });
  }
  var queued = false;
  function scan(){
    queued = false;
    document.querySelectorAll('.k-tabs:not([data-mv]), .fach-switch:not([data-mv])').forEach(initBar);
    document.querySelectorAll('.u-tabs:not([data-mvd])').forEach(initDash);
  }
  function queue(){ if(!queued){ queued = true; requestAnimationFrame(scan); } }
  function relayout(){ document.querySelectorAll('.mv-bar[data-mv]').forEach(function(b){ place(b, false); }); }
  scan();
  new MutationObserver(queue).observe(document.body, { childList: true, subtree: true });
  window.addEventListener('resize', relayout);
  window.addEventListener('load', relayout);
  if(document.fonts && document.fonts.ready) document.fonts.ready.then(relayout);
})();
