# Änderungen – Apple-Design-Durchgang (9. Nov 2026)

## 🔴 Fehlerbehebungen
- 🔴 `--glass`, `--muted`, `--formula` waren sich selbst zugewiesen (Kopfzeile im normalen Hell-Look durchsichtig, Platzhalter ohne Farbe) – repariert; `.legal mark` hatte kaputte Farbe
- 🔴 `maximum-scale=1` entfernt: Zoomen ist wieder möglich (Eingabefelder auf mind. 16 px gegen den iOS-Sprung)
- 🔴 Kategorien und Regelkarten waren `div`s → jetzt Knöpfe bzw. echter Link (Tastatur, VoiceOver, „In neuem Tab öffnen“)
- 🔴 Regel-Detail ist ein echter Dialog: Fokus rein, Hintergrund gesperrt, Fokus zurück an die Karte
- 🔴 Kontrast unter 4,5:1: Stiftgrün, Türkis, Gold/Stern-Text, Grau; Schalter/Eingabe-Rahmen jetzt 3:1
- 🔴 `alert()`/`confirm()` ersetzt durch Meldung in der Seite bzw. Rückfrage im Seitenstil (Abbrechen vorausgewählt)

## 🟣 Neue Funktionen
- 🟣 Darstellung: Automatisch (Gerät) / Hell / Dunkel
- 🟣 Tastatur: `/` Suche, ← → Regeln blättern, Esc zurück; Wischen im Detail
- 🟣 Üben: Karte folgt dem Finger (rechts gewusst, links nochmal), Pfeiltasten in der Auswahl
- 🟣 Formeln werden von VoiceOver als Bruch/Wurzel/hoch/tief vorgelesen, Skizzen beschriftet
- 🟣 Sprunglink „Zum Inhalt“, Suche mit Zähler, leerer Zustand mit „Suche zurücksetzen“

## 🔄 Überarbeitet
- 🔄 Alle Schriftgrößen und das Heft-Raster in `rem`: wächst mit der Browser-Schriftgröße, sieht bei Standard gleich aus
- 🔄 Karten-Animation nur noch beim Laden/Kategoriewechsel, nicht bei jedem Buchstaben
- 🔄 Detail und Aktuelles gleiten als Sheet ein; sanfter Seitenwechsel; alles aus bei „Bewegung reduzieren“
- 🔄 Reduzierte Transparenz und erhöhter Kontrast werden beachtet

## ⚖️ Entscheidungen
- ⚖️ „Aktuelles“ erscheint nur noch einmal pro Neuigkeit (Text/Datum ändern → erscheint wieder). `?news=1` öffnet es immer.
- ⚖️ Heft-Look bleibt Standard und unverändert.


---

# Zweiter Durchgang – Gesten, Animationen, Dashboard und Konto (9. Nov 2026)

## 🟣 Gesten
- 🟣 Regel-Detail: von oben nach unten ziehen schließt (Fenster folgt dem Finger, Liste dahinter scheint durch); links/rechts wischen = nächste/vorherige Regel, am Ende zieht es gummiartig zurück
- 🟣 Üben: Karte folgt dem Finger, wird grau und leicht unscharf, ein Haken bzw. Pfeil blendet ein – kein Text mehr; rastet bei der Schwelle spürbar ein
- 🟣 Skizzen antippen = Vollbild: zwei Finger zoomen, Doppeltippen zoomt, ziehen verschiebt, nach unten wegwischen schließt
- 🟣 Gesten zeigen sich selbst: einmalig deutet die Regel das Wischen an, die Lernkarte macht es dreimal vor (bis man es einmal benutzt hat)

## 🔄 Animationen
- 🔄 Regel wächst aus der angetippten Karte heraus und schrumpft beim Schließen wieder hinein
- 🔄 Gleiten beim Blättern, federnde Rückkehr, einheitliche Feder-Kurve, Druck-Effekt auf Karten/Knöpfe
- 🔄 Dashboard/Konto: gleitende Tab-Markierung, Inhalt blendet ein, Balken wachsen, Zahlen zählen hoch, Auf-/Zuklapper gleiten, iOS-Schalter mit federndem Daumen, Ladegerüst statt „Lade …“
- 🔄 Alles aus bei „Bewegung reduzieren“

## ⚖️ Entscheidungen
- ⚖️ Erklärtexte zum Wischen entfernt; „Nochmal/Gewusst“ und „Vorherige/Nächste“ sind auf dem Handy unsichtbar, bleiben aber für Tastatur, Maus und VoiceOver erhalten
- ⚖️ Kopfzeile zeigt auf schmalen Handys nur „Regelheft“
- ⚖️ Haptik nur wo der Browser sie erlaubt (Android); iPhone-Safari erlaubt sie nicht

## 🔴 Fehler dabei
- 🔴 Endlosschleife in der Wisch-Aufräumfunktion (Beobachter löste sich selbst aus) – im Test gefunden und behoben
