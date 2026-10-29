/* ============================================================
   EINSTELLUNGEN – hier trägst du alles ein, was sich ändern kann.
   Wird von allen Seiten geladen.
   ============================================================ */

/* ---------- KI-Aufgabenhilfe & Konto ----------
   proxyUrl = Adresse deines Cloudflare-Workers (siehe worker.js).
   Den API-Key (Gemini/Groq) NIE in diese Datei schreiben, nur im Worker. */
const AI_CONFIG = {
  enabled: true,
  proxyUrl: "https://ki-support.doctormaster82.workers.dev/"
};

/* ---------- Rechtliches (Impressum + Datenschutzerklärung) ----------
   Beide Seiten werden aus diesen Angaben erzeugt.
   Nicht ausgefüllte Felder erscheinen gelb markiert als [BITTE EINTRAGEN]. */
const LEGAL = {
  brand:   "Gölitzer Development",   // Marke / Name des Angebots (Copyright liegt hier)
  company: "Scherer Integration Excellence",   // Anbieter und Vertragspartner (Rechnungsstellung, Zahlungsabwicklung)
  rep:     "Luca Scherer",   // vertreten durch
  street:  "Steinenbühlstrasse 24A",   // Straße und Hausnummer des Anbieters
  city:    "5417 Untersiggenthal",   // PLZ und Ort des Anbieters
  country: "Schweiz",   // Land des Anbieters
  euRep:   "",   // optional: Vertreter in der EU nach Art. 27 DSGVO (Name und Anschrift); leer = wird nicht angezeigt
  email:  "maxgoel2010@gmail.com",   // E-Mail-Adresse (Pflicht)
  phone:  "015203191145",   // Telefonnummer (neben der E-Mail ist ein zweites schnelles Kontaktmittel nötig, z. B. Telefon)
  authority: "Landesbeauftragte für Datenschutz und Informationsfreiheit Nordrhein-Westfalen, Kavalleriestraße 2–4, 40213 Düsseldorf",  // Beispiel für eine Aufsichtsbehörde in Deutschland
  stand: "29.10.2026"
};

/* ---------- Social-Links (erscheinen im Footer) ----------
   Leer lassen ("") = Link wird ausgeblendet.
   Das sind die STANDARD-Werte. Im Dashboard (Einstellungen) kannst du sie ohne Code ändern. */
const SOCIAL = {
  discord:   "https://discord.gg/MQetGYSpur",   // Einladungslink deines Discord-Servers
  instagram: ""                                  // z. B. https://instagram.com/deinname
};

/* ---------- AKTUELLES-POPUP (Startseite) ----------
   Das sind die STANDARD-Werte. Im Dashboard (Einstellungen) kannst du Text und Schalter ohne Code ändern.
   • enabled: true = Popup erscheint beim Öffnen der Startseite, false = aus
   • items:   eine Zeile pro Punkt
   Über den Footer-Link „Aktuelles“ kann man es jederzeit erneut öffnen. */
const NEWS = {
  enabled: true,
  date: "21.10.2026",
  title: "Neu im Regelheft",
  items: [
    "Persönliches Konto: Mit einem Konto wird die KI-Aufgabenhilfe freigeschaltet und die Chats werden gespeichert!",
    "KI-Aufgabenhilfe: KI-Funktionen sind nur noch mit Konto verfügbar!",
    "Design-Update: Das Regelheft hat ein neues, moderneres Design mit frischen Farben und neuer Schrift!",
    "Kontakt: Nutze unseren Discord Server und trete mit uns in Kontakt, wenn es Probelme gibt."
  ]
};
