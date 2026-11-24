/* ============================================================
   FOOTER – hier bearbeitest du den Inhalt des Footers (gilt für ALLE Seiten).
   Aussehen (Farben, Abstände): assets/css/footer.css
   Platzhalter in Links:  {discord}  {instagram}  {email}  (kommen aus config.js)
   Ein Eintrag mit leerem Ziel wird automatisch ausgeblendet.
   ============================================================ */
const FOOTER = {
  brand: ["Regelheft", "Mathematik"],          // Markenname, zweiteilig (zweiter Teil farbig)

  // Runde Icon-Buttons rechts. Erlaubte Symbole: instagram, discord, mail
  social: [
    { icon: "instagram", label: "Instagram", href: "{instagram}" },
    { icon: "discord",   label: "Discord",   href: "{discord}" },
    { icon: "mail",      label: "E-Mail",    href: "mailto:{email}" }
  ],

  // Link-Zeile (mit Umbruch auf dem Handy)
  links: [
    { label: "Impressum",        href: "impressum.html" },
    { label: "Datenschutz",      href: "datenschutz.html" },
    { label: "Adventskalender",  href: "advent.html" },
    // Nur sichtbar, wenn die Bezahlung im Dashboard eingeschaltet ist (rechtlich nötig):
    { label: "AGB",              href: "agb.html",     billing: true },
    { label: "Widerruf",         href: "widerruf.html", billing: true }
    // Weitere Links: { label: "Meine Kurse", href: "kurse.html" }  ·  { label: "Aktuelles", href: "index.html?news=1" }
  ],

  backToTop: true,                             // Knopf „Nach oben“
  copyright: "Alle Inhalte und Darstellungen sind urheberrechtlich geschützt.",   // Text unten links
  madeIn: ""                                  // leer lassen = ausblenden
};
