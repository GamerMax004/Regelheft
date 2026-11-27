/* ============================================================
   BEREICHE – ordnet jedes Thema (Kategorie) einem Bereich mit eigener Farbe zu.
   Genutzt für die farbige Kachel-Ansicht und die farbigen Markierungen in der Liste.
   Neues Thema oder neues Fach: unten bei "cats" eintragen. Unbekannte Themen landen bei „Weitere Themen“ (grau).
   Farben (c): blue, violet, green, amber, rose, teal, slate – die Farbwerte stehen in style.css ([data-c="…"]).
   ============================================================ */
window.BEREICHE = (function(){
  const FACH = {r: 'mathe', p: 'physik', c: 'chemie', b: 'biologie'};   // Anfangsbuchstabe der Regel-ID
  const D = {
    mathe: [
      {k: 'zahlen',      l: 'Zahlen & Brüche',        c: 'amber',  cats: ['Brüche & Dezimalzahlen', 'Bruchrechnung: Malnehmen & Teilen', 'Dezimalzahlen & Rationale Zahlen', 'Zahlenmengen & Wurzeln']},
      {k: 'prozent',     l: 'Prozent & Zuordnungen',  c: 'teal',   cats: ['Zuordnungen & Prozent-Grundlagen', 'Prozentrechnung & Zinsen']},
      {k: 'algebra',     l: 'Algebra',                c: 'blue',   cats: ['Terme & Gleichungen', 'Bruchterme & Winkelbeziehungen', 'Binomische Formeln', 'Lineare Gleichungssysteme', 'Quadratische Gleichungen', 'Potenzgesetze']},
      {k: 'funktionen',  l: 'Funktionen',             c: 'violet', cats: ['Funktionen & Lineare Funktionen', 'Quadratische Funktionen', 'Exponentielles Wachstum & Logarithmus']},
      {k: 'geometrie',   l: 'Geometrie',              c: 'green',  cats: ['Koordinatensystem, Kreis & Winkel', 'Dreieckskonstruktionen', 'Flächeninhalte', 'Thaleskreis & Zentrische Streckung', 'Kreis, Prisma & Pythagoras', 'Trigonometrie']},
      {k: 'stochastik',  l: 'Stochastik',             c: 'rose',   cats: ['Stochastik & Wahrscheinlichkeit', 'Statistik-Basics & Terme']}
    ],
    physik: [
      {k: 'grundlagen',  l: 'Grundlagen',             c: 'slate',  cats: ['Größen & Einheiten']},
      {k: 'mechanik',    l: 'Mechanik',               c: 'blue',   cats: ['Bewegung', 'Kräfte', 'Energie & Leistung', 'Dichte, Druck & Auftrieb']},
      {k: 'waerme',      l: 'Wärme',                  c: 'amber',  cats: ['Wärmelehre']},
      {k: 'elektro',     l: 'Elektrizität & Magnetismus', c: 'violet', cats: ['Elektrizität', 'Magnetismus']},
      {k: 'optik',       l: 'Optik & Wellen',         c: 'teal',   cats: ['Optik', 'Schwingungen & Wellen']},
      {k: 'atom',        l: 'Atom- & Kernphysik',     c: 'rose',   cats: ['Atom- & Kernphysik']}
    ],
    chemie: [
      {k: 'grundlagen',  l: 'Grundlagen',             c: 'slate',  cats: ['Grundlagen']},
      {k: 'atom',        l: 'Atombau & Periodensystem', c: 'violet', cats: ['Atombau & Periodensystem']},
      {k: 'bindung',     l: 'Bindungen',              c: 'blue',   cats: ['Bindungen']},
      {k: 'reaktion',    l: 'Reaktionen & Rechnen',   c: 'amber',  cats: ['Reaktionen & Rechnen']},
      {k: 'saeure',      l: 'Säuren & Basen',         c: 'rose',   cats: ['Säuren & Basen']},
      {k: 'organik',     l: 'Organische Chemie',      c: 'green',  cats: ['Organische Chemie']}
    ],
    biologie: [
      {k: 'zelle',       l: 'Zelle',                  c: 'green',  cats: ['Zelle']},
      {k: 'stoff',       l: 'Stoffwechsel',           c: 'amber',  cats: ['Stoffwechsel']},
      {k: 'genetik',     l: 'Genetik',                c: 'violet', cats: ['Genetik']},
      {k: 'mensch',      l: 'Mensch',                 c: 'rose',   cats: ['Mensch']},
      {k: 'oeko',        l: 'Ökologie & Evolution',   c: 'teal',   cats: ['Ökologie & Evolution']}
    ]
  };
  const OTHER = {k: 'sonst', l: 'Weitere Themen', c: 'slate'};
  const fachOf = r => FACH[String(r.id || '')[0]] || 'mathe';
  function of(r){
    const a = (D[fachOf(r)] || []).find(x => x.cats.indexOf(r.category) >= 0);
    return a || OTHER;
  }
  // Regeln nach Bereichen gruppieren, in der Reihenfolge der Bereiche (leere Bereiche entfallen)
  function groups(list){
    const g = new Map();
    list.forEach(r => { const a = of(r); if(!g.has(a.k + '|' + fachOf(r))) g.set(a.k + '|' + fachOf(r), {k: a.k, l: a.l, c: a.c, fach: fachOf(r), items: []}); g.get(a.k + '|' + fachOf(r)).items.push(r); });
    const order = x => { const i = (D[x.fach] || []).findIndex(a => a.k === x.k); return i < 0 ? 99 : i; };
    return [...g.values()].sort((a, b) => order(a) - order(b));
  }
  return {of, groups, areas: D};
})();
