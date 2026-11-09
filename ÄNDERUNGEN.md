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
