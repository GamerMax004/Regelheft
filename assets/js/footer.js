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
    { label: "KI-Aufgabenhilfe", href: "ki.html" },
    { label: "Impressum",        href: "impressum.html" },
    { label: "Datenschutz",      href: "datenschutz.html" }
    // Weitere Links: { label: "Aktuelles", href: "index.html?news=1" }  ·  Mit Anmelde-Wechsel:
    // { label: "Anmelden", href: "anmeldung.html", loggedIn: { label: "Mein Konto", href: "konto.html" } }
  ],

  backToTop: true,                             // Knopf „Nach oben“
  copyright: "Copyright © Gölitzer Development",   // Text unten links
  madeIn: "Entwickelt in Deutschland"          // leer lassen = ausblenden
};
