# Änderungen (Stand: dein neuer Upload)

Alle Dateien aus diesem Ordner mit gleichem Pfad über deine Dateien kopieren. Nicht enthaltene Dateien bleiben unverändert. `worker.js` danach im Cloudflare-Worker einspielen. Die neuen Tabellen legt der Worker beim ersten Start selbst an.

## Aus deinem Discord-Screenshot (Status-Kanal)
- Fehler „Wrong number of parameter bindings“ bei `/api/admin/users`: Die Suche in der Nutzerliste hatte ein `?` im SQL, band aber zwei Werte. Behoben, die Suche geht jetzt über Benutzername und E-Mail.
- „Letzter Neustart: vor 57 Jahren (1970)“: `Date.now()` liefert im globalen Bereich eines Workers 0. Die Startzeit wird jetzt erst bei der ersten Anfrage gesetzt.
- Fußzeile „Gölitzer Development · prüft jede Minute“ heißt jetzt „Regelheft · prüft jede Minute“.

## „Gölitzer Development“ entfernt
- Mails, Status-Fußzeile, Impressum, Datenschutz, AGB, Meta-Tags und `config.js` (`brand` gelöscht). Betreiber in den Rechtstexten ist jetzt nur noch der Name aus `LEGAL.company`.
- Nicht angefasst: `LIESMICH.txt` (Beschreibung der Domain) und die Domain selbst.

## Adventskalender
- Im Türchen steht nur noch die Zahl. Fehler dahinter: Bei verschlossenen Türchen schimmerte die Innenseite (Titel, „noch offen“) durch die Tür.
- Der Hinweis „nur lokal gespeichert“ ist weg. Der Fortschritt (geöffnet, gelöst, Gewinne) gehört jetzt zum Konto und ist auf jedem Gerät da (`/api/advent/seen`). Der Zwischenspeicher im Browser ist je Konto getrennt.
- Team/Admin sehen immer alle Türchen (zum Testen, auch die Auslosung).

## KI-Chat (Fehler)
- Das Fach wurde nie mitgeschickt: In Physik, Chemie und Biologie antwortete die KI mit dem Mathe-Prompt. Behoben (`ki.js`, `worker.js`).
- Rückfragen im selben Chat kosten keine Token mehr (nur der neue Chat). Das Guthaben wird dabei weiter angezeigt.
- Regeln anderer Fächer in alten Chats werden wieder gefunden. Bei Limit-Fehlern gibt es „Erneut versuchen“.

## Kachel-Ansicht und Übersicht
- Neuer Knopf links neben „Filter“: Liste oder Kacheln. Kacheln sind nach Bereichen gegliedert, jeder Bereich hat eine Farbe (Mathe: Zahlen & Brüche, Prozent & Zuordnungen, Algebra, Funktionen, Geometrie, Stochastik; ebenso für Physik, Chemie, Biologie).
- In der Liste zeigt ein farbiger Streifen links und ein farbiges Themen-Etikett den Bereich. Im Heft-Look bleibt die Liste.
- Zuordnung der Themen zu Farben: `assets/js/bereiche.js`.

## Mehr Fächer
- Jetzt eingebunden: Mathematik, Physik (Datei war da, aber auf keiner Seite geladen), neu Chemie (19 Regeln) und Biologie (15 Regeln). Umschalter oben auf Startseite, KI und Meine Kurse.
- Neues Fach: Datei mit `window.RULES_<FACH>`, Eintrag in `fach.js` (LIST, DATA), `bereiche.js` und `FAECHER` im `worker.js`.
- Chemie und Biologie sind Einstiegstexte in eigenen Worten und sollten mit eurem Unterricht abgeglichen werden.

## Eintrag einreichen
- Neue Seite `einreichen.html` (Footer-Link und Hinweis unter der Regelliste): Fach, Thema, Titel, Inhalt mit Live-Vorschau, Quelle, optionaler Name, zwei Pflicht-Haken (Rechte, Veröffentlichung). „Meine Einreichungen“ mit Status und Zurückziehen.
- Dashboard → Tab „Einreichungen“: ansehen, bearbeiten, freigeben, ablehnen (mit Notiz), löschen. Schalter unter „Bezahlung“.
- Freigegebene Einträge erscheinen im Regelheft (Kennung z. B. `cx12`) mit „Eingereicht von …“.
- Grenzen: 5 pro Tag, 10 gleichzeitig in Prüfung, Titel 80 und Inhalt 4000 Zeichen. Beim Löschen des Kontos werden nicht freigegebene Beiträge gelöscht, freigegebene ohne Namen weitergeführt.

## Rechtliches (Entwurf, keine Rechtsberatung)
- Impressum: Urheberrecht erweitert, Lizenzen Dritter (Poppins, Patrick Hand, html2canvas, Lucide-Icons), „Rechtsverletzungen melden“.
- AGB: neuer Abschnitt 8a „Einreichungen“ (Rechtezusicherung, Nutzungsrecht, Nennung, Prüfung, Zurückziehen, Freistellung, Minderjährige).
- Datenschutz: neuer Abschnitt 7a (Token, Adventskalender, Einreichungen), weitere Browser-Speicher, Speicherdauer.
- Bitte prüfen lassen, bevor es als verbindlich gilt (z. B. Verbraucherzentrale/Anwalt, eRecht24-Generator).

## Sonst
- `core.js`: Schalter für Adventskalender und Einreichen aus dem Dashboard greifen jetzt auch auf den Seiten.
- Neue Versionsnummern bei allen geänderten Dateien.
