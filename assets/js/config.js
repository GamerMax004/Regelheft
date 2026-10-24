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
  name:   "Maximilian Gölitzer",   // Vor- und Nachname (Pflicht, Klarname)
  street: "Wacholderschleife 13",   // Straße und Hausnummer (Pflicht, ladungsfähige Anschrift, kein Postfach)
  city:   "51597 Morsbach",   // PLZ und Ort (Pflicht)
  email:  "maxgoel2010@gmail.com",   // E-Mail-Adresse (Pflicht)
  phone:  "015203191145",   // Telefonnummer (neben der E-Mail ist ein zweites schnelles Kontaktmittel nötig, z. B. Telefon)
  authority: "Landesbeauftragte für Datenschutz und Informationsfreiheit Nordrhein-Westfalen, Kavalleriestraße 2–4, 40213 Düsseldorf",  // zuständige Aufsichtsbehörde (Bundesland des Betreibers)
  stand: "15.10.2026"
};

/* ---------- Social-Links (erscheinen im Footer) ----------
   Leer lassen ("") = Link wird ausgeblendet. */
const SOCIAL = {
  discord:   "https://discord.gg/MQetGYSpur",   // Einladungslink deines Discord-Servers
  instagram: "https://teams.microsoft.com/l/message/48:notes/1792845211191?context=%7B%22contextType%22%3A%22chat%22%2C%22oid%22%3A%228%3Aorgid%3A7b1e4712-bb36-4971-88ee-27bc6826b19a%22%7D"                                  // z. B. https://instagram.com/deinname
};

/* ---------- AKTUELLES-POPUP (Startseite) ----------
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
