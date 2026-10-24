/* ============================================================
   FOOTER – hier bearbeitest du den Inhalt des Footers (gilt für ALLE Seiten).
   Aussehen (Farben, Abstände): assets/css/footer.css
   Platzhalter in Links:  {discord}  {instagram}  {email}  (kommen aus config.js)
   Ein Link/Eintrag mit leerem Ziel wird automatisch ausgeblendet.
   ============================================================ */
const FOOTER = {
  brand: ["Regelheft", "Mathematik"],          // Markenname, zweiteilig (zweiter Teil farbig)
  tagline: "Alle Regeln, Formeln und Grafiken auf einen Blick – dein digitales Mathe-Regelheft.",

  // Runde Buttons unter dem Text. Erlaubte Symbole: instagram, discord, mail
  social: [
    { icon: "instagram", label: "Instagram", href: "{instagram}" },
    { icon: "discord",   label: "Discord",   href: "{discord}" },
    { icon: "mail",      label: "E-Mail",    href: "mailto:{email}" }
  ],

  // Link-Spalten. wide: true = Spalte läuft auf dem Handy über die volle Breite.
  columns: [
    { title: "Regelheft", links: [
      { label: "Aktuelles",         href: "index.html?news=1" },
      { label: "Anmelden", href: "anmeldung.html", loggedIn: { label: "Mein Konto", href: "konto.html" } },       
      { label: "KI-Aufgabenhilfe",  href: "ki.html" }

    ]},
    { title: "Rechtliches", wide: true, links: [
      { label: "Impressum",       href: "impressum.html" },
      { label: "Datenschutz",     href: "datenschutz.html" }
    ]}
  ],

  copyright: "Gölitzer Development",           // davor kommt automatisch „© Jahr“
  madeIn: "Entwickelt in Deutschland"          // leer lassen = Zeile ausblenden
};
