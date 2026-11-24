# Änderungen (Stand: neue Zip + neuer worker.js)

Alle Dateien in diesem Ordner einfach über deine Dateien kopieren, gleicher Pfad, gleicher Name. Nicht enthaltene Dateien bleiben unverändert. Danach `worker.js` im Cloudflare-Worker einspielen und wie gewohnt veröffentlichen.

## Startseite (Screenshot)
- Titel „Regelheft Mathematik“ ganz links, Symbole (Heft, Darstellung, Konto) ganz rechts, bündig mit der Leiste darunter (`header.css`).
- „Alle Regeln“ entfernt. Die Trefferzahl („177 Regeln“) steht jetzt links neben dem Filter-Knopf, die Themen-Zeile darunter ist weg (`index.html`, `index.js`, `style.css`, `heft.css`).
- Die „Wand“: Gewählte Filter bleiben in einer Zeile. Was nicht mehr passt, wird zu „+N“ (gestrichelt). Antippen öffnet das Filterfenster. Wenn gar kein Platz ist, steht dort „N Filter“.

## Neue Regel
- „Potenzfunktionen mit negativen Exponenten“ (Seite 89) mit Skizze (`regeln.js`). Jetzt 178 Regeln.

## Adventskalender
- Neu: `advent.html`, `advent.css`, `advent.js`, `advent-data.js`. Link im Footer (`footer.js`).
- 24 Türchen mit Aufgabe, Tipp, Lösungsweg und passender Regel. Öffnen sich ab dem jeweiligen Dezembertag (Berlin), Gewinne bis 6. Januar einlösbar.
- Nach der richtigen Antwort wird (angemeldet) auf dem Server ausgelost: Token, Plus oder Pro für ein paar Tage, oder nichts. Türchen 24 gibt immer einen größeren Gewinn. Wer den Tarif schon hat, bekommt Token statt Tarif.
- Gewinne und Wahrscheinlichkeiten: im `worker.js` bei `ADVENT_PRIZES`.
- Testen: Worker-Variable `ADVENT_TEST_DAY` = 24 setzen. Nur ansehen: `advent.html?vorschau=1`.
- Ein/Aus im Dashboard unter „Bezahlung“.

## Token statt KI-Chats pro Tag
- Gratis: einmalig 60 Token, wird nie aufgefüllt. Plus 600 und Pro 3000 pro Monat (jeden Monat neu). Gewonnene Bonus-Token verfallen nicht.
- Kosten: KI-Nachricht 4 (mit Foto 8), Kurs erstellen 40, Karteikarten 10, Podcast-Stimme 8.
- Alles im Dashboard unter „Bezahlung“ einstellbar. Im Nutzer-Detail gibt es jetzt „Token buchen“ (mit Minus abziehen).
- Das persönliche Tageslimit pro Nutzer bleibt als zusätzliche Obergrenze erhalten (leer = keins, 0 = KI gesperrt).
- Ohne eingeschaltete Bezahlung gibt es keine Limits. Betreiber und Team zahlen nichts.
- Neue Tabellen (`tokens`, `token_log`, `advent_claims`) legt der Worker beim ersten Start selbst an.
- Angepasst: `ki.js`, `konto.js`, `pro.js`, `core.js`, `dashboard.js`, `rechtliches.js` (AGB-Text), `pro.html`.

## Texte
- Copyright-Hinweis ersetzt durch „Alle Inhalte und Darstellungen sind urheberrechtlich geschützt.“ (Footer, Startseite, Meta-Tags aller Seiten, Urheberrecht-Absatz).
- „Entwickelt in Deutschland“ im Footer entfernt.

Die Seiten haben neue Versionsnummern bei den geänderten Dateien, damit Browser nichts Altes aus dem Cache laden.
