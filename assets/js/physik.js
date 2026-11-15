/* Regelheft Physik – Regeldaten.
   Wird von index.html, ki.html, ueben.html und dashboard.html geladen.
   Jede Regel: id (p + Nummer, nie doppelt, nie wiederverwenden), title, page, category, body, diagram (null oder SVG).
   "plain" und "excerpt" (für Suche und Vorschau) erzeugt fach.js automatisch aus "body".

   Schreibweise in "body" (wie im Mathe-Regelheft):
     $ Formel ‖ Erklärung     Formelzeile (mehrere untereinander = ein Formelblock)
     ## Überschrift           Zwischenüberschrift
     ! Text                   Merkkasten
     - Text                   Aufzählung
     T: a§b ;; c§d            Tabelle (erste Zeile = Kopf)
     **fett**, {a/b} Bruch, √(x) Wurzel, x^2 hoch, v_0 bzw. v_(an) tief */
window.RULES_PHYSIK = [
/* ---------- Größen & Einheiten ---------- */
{id:"p0", page:1, category:"Größen & Einheiten", title:"Physikalische Größen",
 body:"Eine physikalische Größe besteht aus **Zahlenwert** und **Einheit**.\n$ s = 25 m ‖ Größe = Zahlenwert · Einheit\n! Ohne Einheit ist eine physikalische Angabe wertlos – Einheit immer mitschreiben!\n## Formelzeichen\nJede Größe hat ein Formelzeichen, z. B. s (Weg), t (Zeit), m (Masse), F (Kraft)."},
{id:"p1", page:1, category:"Größen & Einheiten", title:"SI-Basiseinheiten",
 body:"Alle Einheiten lassen sich aus sieben Basiseinheiten bilden.\nT: Größe§Zeichen§Einheit ;; Länge§l, s§Meter (m) ;; Masse§m§Kilogramm (kg) ;; Zeit§t§Sekunde (s) ;; Stromstärke§I§Ampere (A) ;; Temperatur§T§Kelvin (K) ;; Stoffmenge§n§Mol (mol) ;; Lichtstärke§I_v§Candela (cd)"},
{id:"p2", page:1, category:"Größen & Einheiten", title:"Vorsätze für Einheiten",
 body:"Vorsätze machen sehr große oder sehr kleine Werte handlich.\nT: Vorsatz§Zeichen§Faktor ;; Giga§G§10^9 ;; Mega§M§10^6 ;; Kilo§k§10^3 ;; Dezi§d§10^(-1) ;; Zenti§c§10^(-2) ;; Milli§m§10^(-3) ;; Mikro§µ§10^(-6) ;; Nano§n§10^(-9)\n## Beispiele\n$ 4,7 kW = 4700 W\n$ 250 mA = 0,25 A"},
{id:"p3", page:1, category:"Größen & Einheiten", title:"Einheiten umrechnen",
 body:"## Geschwindigkeit\n$ 1 {m/s} = 3,6 {km/h} ‖ km/h → m/s: durch 3,6 teilen\n$ 72 {km/h} = 72 : 3,6 {m/s} = 20 {m/s}\n## Zeit\n$ 1 h = 60 min = 3600 s\n## Fläche und Volumen\n$ 1 m² = 10 000 cm²\n$ 1 m³ = 1000 dm³ = 1000 l\n$ 1 cm³ = 1 ml"},
{id:"p4", page:2, category:"Größen & Einheiten", title:"Rechnen mit Formeln",
 body:"1) Gegebene und gesuchte Größen mit Einheiten notieren.\n2) Passende Formel aufschreiben.\n3) Formel nach der gesuchten Größe umstellen.\n4) Einheiten passend umrechnen, dann Werte einsetzen.\n5) Ergebnis sinnvoll runden und mit Antwortsatz angeben.\n! Erst umstellen, dann einsetzen – so bleiben Fehler sichtbar."},
{id:"p5", page:2, category:"Größen & Einheiten", title:"Proportionalität",
 body:"Zwei Größen sind **proportional** (x ~ y), wenn der Quotient {y/x} konstant ist.\n- Doppelte Ursache → doppelte Wirkung.\n- Im Diagramm: Gerade durch den Ursprung.\n$ {y/x} = k ‖ k: Proportionalitätsfaktor\n## Beispiel\nBeim Ohmschen Gesetz ist U ~ I, der Faktor ist der Widerstand R."},

/* ---------- Mechanik: Bewegung ---------- */
{id:"p6", page:3, category:"Bewegung", title:"Geschwindigkeit",
 body:"Die Geschwindigkeit gibt an, welchen Weg ein Körper in einer bestimmten Zeit zurücklegt.\n$ v = {s/t} ‖ v: Geschwindigkeit, s: Weg, t: Zeit\n$ s = v · t\n$ t = {s/v}\nEinheit: 1 {m/s} oder 1 {km/h}\n## Beispiel\n$ v = {100 m/12,5 s} = 8 {m/s}"},
{id:"p7", page:3, category:"Bewegung", title:"Gleichförmige Bewegung",
 body:"Bei einer **gleichförmigen Bewegung** ist die Geschwindigkeit konstant.\n- s-t-Diagramm: Ursprungsgerade, die Steigung ist v.\n- v-t-Diagramm: waagerechte Linie, die Fläche darunter ist der Weg s.\n$ s = v · t"},
{id:"p8", page:3, category:"Bewegung", title:"Durchschnittsgeschwindigkeit",
 body:"Ändert sich die Geschwindigkeit unterwegs, rechnet man mit der Durchschnittsgeschwindigkeit.\n$ v_(m) = {s_(gesamt)/t_(gesamt)}\n! Nicht einfach die Geschwindigkeiten mitteln – immer Gesamtweg durch Gesamtzeit!"},
{id:"p9", page:4, category:"Bewegung", title:"Beschleunigung",
 body:"Die Beschleunigung gibt an, wie schnell sich die Geschwindigkeit ändert.\n$ a = {Δv/Δt} ‖ Einheit: 1 {m/s²}\nBei Abbremsen ist a negativ (Verzögerung).\n## Beispiel\nEin Auto beschleunigt in 5 s von 0 auf 20 {m/s}:\n$ a = {20 {m/s}/5 s} = 4 {m/s²}"},
{id:"p10", page:4, category:"Bewegung", title:"Gleichmäßig beschleunigte Bewegung",
 body:"Bei konstanter Beschleunigung aus dem Stand (v_0 = 0) gilt:\n$ v = a · t\n$ s = {1/2} · a · t²\n$ v = √(2 · a · s)\nMit Anfangsgeschwindigkeit v_0:\n$ v = v_0 + a · t\n$ s = v_0 · t + {1/2} · a · t²\n- s-t-Diagramm: Parabel\n- v-t-Diagramm: Gerade, Steigung = a"},
{id:"p11", page:5, category:"Bewegung", title:"Freier Fall",
 body:"Ohne Luftwiderstand fallen alle Körper gleich schnell. Die Fallbeschleunigung ist g.\n$ g ≈ 9,81 {m/s²} ‖ in Mitteleuropa\n$ v = g · t\n$ h = {1/2} · g · t²\n## Beispiel\nFallzeit aus 20 m Höhe:\n$ t = √({2h/g}) = √({2 · 20 m/9,81 {m/s²}}) ≈ 2,0 s"},
{id:"p12", page:5, category:"Bewegung", title:"Anhalteweg",
 body:"Der Anhalteweg setzt sich aus Reaktionsweg und Bremsweg zusammen.\n$ s_(A) = s_(R) + s_(B)\n$ s_(R) = v · t_(R) ‖ t_(R): Reaktionszeit, meist ca. 1 s\n$ s_(B) = {v²/2a} ‖ a: Bremsverzögerung\n## Faustregeln (Fahrschule, v in km/h)\n$ s_(R) ≈ {v/10} · 3\n$ s_(B) ≈ ({v/10})²\n! Doppelte Geschwindigkeit → vierfacher Bremsweg!"},

/* ---------- Mechanik: Kräfte ---------- */
{id:"p13", page:6, category:"Kräfte", title:"Kraft",
 body:"Kräfte erkennt man an ihren Wirkungen: Sie können einen Körper **verformen** oder seine **Bewegung ändern** (schneller, langsamer, Richtung).\nFormelzeichen: F, Einheit: 1 Newton (N)\n$ 1 N = 1 {kg · m/s²}\n## Kraft als Vektor\nEine Kraft hat Betrag, Richtung und Angriffspunkt. Man zeichnet sie als Pfeil."},
{id:"p14", page:6, category:"Kräfte", title:"Masse und Gewichtskraft",
 body:"Die **Masse** m ist überall gleich. Die **Gewichtskraft** F_G hängt vom Ort ab.\n$ F_G = m · g ‖ g: Ortsfaktor\nT: Ort§Ortsfaktor g ;; Erde§9,81 {N/kg} ;; Mond§1,62 {N/kg} ;; Mars§3,71 {N/kg} ;; Jupiter§24,8 {N/kg}\n## Beispiel\n$ F_G = 50 kg · 9,81 {N/kg} ≈ 490 N"},
{id:"p15", page:7, category:"Kräfte", title:"Hookesches Gesetz",
 body:"Bei einer Schraubenfeder ist die Verlängerung proportional zur Kraft (solange die Feder nicht überdehnt wird).\n$ F = D · s ‖ D: Federkonstante in {N/m}, s: Verlängerung\nEin Federkraftmesser nutzt dieses Gesetz zum Messen von Kräften."},
{id:"p16", page:7, category:"Kräfte", title:"Kräfte zusammensetzen",
 body:"## Gleiche Richtung\n$ F_(res) = F_1 + F_2\n## Entgegengesetzte Richtung\n$ F_(res) = F_1 - F_2 ‖ Richtung der größeren Kraft\n## Beliebige Richtungen\nKräfteparallelogramm zeichnen: Die Diagonale ist die resultierende Kraft.\nBei 90°:\n$ F_(res) = √(F_1² + F_2²)\n! Kräftegleichgewicht: Ist F_(res) = 0, bleibt der Körper in Ruhe oder bewegt sich gleichförmig."},
{id:"p17", page:8, category:"Kräfte", title:"Newtonsche Gesetze",
 body:"## 1. Trägheitsgesetz\nEin Körper bleibt in Ruhe oder gleichförmiger Bewegung, solange keine resultierende Kraft auf ihn wirkt.\n## 2. Grundgesetz der Mechanik\n$ F = m · a\n## 3. Wechselwirkungsgesetz\nÜbt Körper A eine Kraft auf B aus, so übt B eine gleich große, entgegengesetzte Kraft auf A aus.\n$ F_(AB) = -F_(BA) ‖ actio = reactio"},
{id:"p18", page:8, category:"Kräfte", title:"Reibung",
 body:"Reibungskräfte wirken der Bewegung entgegen.\n$ F_R = μ · F_N ‖ μ: Reibungszahl, F_N: Normalkraft\n- Haftreibung > Gleitreibung > Rollreibung\n- Auf waagerechter Fläche gilt F_N = F_G."},
{id:"p19", page:9, category:"Kräfte", title:"Hebelgesetz",
 body:"Ein Hebel ist im Gleichgewicht, wenn die Drehmomente auf beiden Seiten gleich sind.\n$ F_1 · l_1 = F_2 · l_2 ‖ Kraft · Kraftarm = Last · Lastarm\n$ M = F · l ‖ Drehmoment, Einheit: 1 Nm\n- **Einseitiger Hebel:** beide Kräfte auf derselben Seite der Drehachse (z. B. Schubkarre).\n- **Zweiseitiger Hebel:** Kräfte auf verschiedenen Seiten (z. B. Wippe, Schere)."},
{id:"p20", page:9, category:"Kräfte", title:"Rollen und Flaschenzug",
 body:"- **Feste Rolle:** ändert nur die Richtung der Kraft.\n- **Lose Rolle:** halbiert die nötige Kraft, der Zugweg verdoppelt sich.\n## Flaschenzug mit n tragenden Seilstücken\n$ F_Z = {F_G/n}\n$ s_Z = n · h\n! Goldene Regel der Mechanik: Was man an Kraft spart, muss man an Weg zusetzen."},
{id:"p21", page:10, category:"Kräfte", title:"Kreisbewegung",
 body:"Damit sich ein Körper auf einer Kreisbahn bewegt, braucht er eine zum Mittelpunkt gerichtete **Zentripetalkraft**.\n$ F_Z = {m · v²/r}\n$ v = {2π · r/T} ‖ T: Umlaufdauer\n$ f = {1/T} ‖ Frequenz"},

/* ---------- Energie, Arbeit, Leistung ---------- */
{id:"p22", page:11, category:"Energie & Leistung", title:"Mechanische Arbeit",
 body:"Arbeit wird verrichtet, wenn eine Kraft einen Körper entlang eines Weges bewegt.\n$ W = F · s ‖ F und s in gleicher Richtung\nEinheit: 1 Joule (J)\n$ 1 J = 1 Nm = 1 Ws\n## Hubarbeit\n$ W = F_G · h = m · g · h"},
{id:"p23", page:11, category:"Energie & Leistung", title:"Energieformen",
 body:"Energie ist die Fähigkeit, Arbeit zu verrichten, Wärme abzugeben oder Licht auszusenden.\n$ E_(pot) = m · g · h ‖ Lageenergie\n$ E_(kin) = {1/2} · m · v² ‖ Bewegungsenergie\n$ E_(Spann) = {1/2} · D · s² ‖ Spannenergie\nWeitere Formen: thermische, elektrische, chemische Energie, Strahlungs- und Kernenergie."},
{id:"p24", page:12, category:"Energie & Leistung", title:"Energieerhaltung",
 body:"Energie kann weder erzeugt noch vernichtet werden. Sie wird nur von einer Form in andere umgewandelt.\n$ E_(gesamt) = konstant\n## Beispiel: Fallender Körper\n$ m · g · h = {1/2} · m · v²\n$ v = √(2 · g · h)\n! „Energieverlust“ bedeutet: Energie wird in nicht nutzbare Wärme umgewandelt."},
{id:"p25", page:12, category:"Energie & Leistung", title:"Leistung",
 body:"Die Leistung gibt an, wie schnell Arbeit verrichtet oder Energie umgewandelt wird.\n$ P = {W/t} = {E/t} ‖ Einheit: 1 Watt (W) = 1 {J/s}\n$ E = P · t\n## Beispiel\nEin Wasserkocher mit 2000 W läuft 3 min:\n$ E = 2000 W · 180 s = 360 000 J = 360 kJ"},
{id:"p26", page:13, category:"Energie & Leistung", title:"Wirkungsgrad",
 body:"Der Wirkungsgrad gibt an, welcher Anteil der zugeführten Energie nutzbar wird.\n$ η = {E_(nutz)/E_(zu)} = {P_(nutz)/P_(zu)}\nη ist immer kleiner als 1 bzw. 100 %.\nT: Gerät§Wirkungsgrad ;; LED-Lampe§ca. 30–40 % ;; Glühlampe§ca. 5 % ;; Elektromotor§ca. 90 % ;; Benzinmotor§ca. 30 % ;; Solarzelle§ca. 20 %"},

/* ---------- Druck & Auftrieb ---------- */
{id:"p27", page:14, category:"Dichte, Druck & Auftrieb", title:"Dichte",
 body:"Die Dichte gibt an, welche Masse ein Volumen von 1 cm³ (bzw. 1 m³) eines Stoffes hat.\n$ ρ = {m/V}\n$ 1 {g/cm³} = 1000 {kg/m³}\nT: Stoff§Dichte in {g/cm³} ;; Wasser§1,0 ;; Eis§0,92 ;; Holz (Fichte)§ca. 0,5 ;; Aluminium§2,7 ;; Eisen§7,9 ;; Gold§19,3 ;; Luft§0,0013"},
{id:"p28", page:14, category:"Dichte, Druck & Auftrieb", title:"Druck",
 body:"Druck ist Kraft pro Fläche.\n$ p = {F/A} ‖ Einheit: 1 Pascal (Pa) = 1 {N/m²}\n$ 1 bar = 100 000 Pa = 1000 hPa\nKleine Fläche → großer Druck (Messer, Nadel). Große Fläche → kleiner Druck (Schneeschuh)."},
{id:"p29", page:15, category:"Dichte, Druck & Auftrieb", title:"Schweredruck",
 body:"In Flüssigkeiten nimmt der Druck mit der Tiefe zu.\n$ p = ρ · g · h ‖ h: Tiefe\nIm Wasser steigt der Druck etwa alle 10 m um 1 bar.\n! Der Schweredruck hängt nicht von der Form des Gefäßes ab (hydrostatisches Paradoxon)."},
{id:"p30", page:15, category:"Dichte, Druck & Auftrieb", title:"Hydraulik",
 body:"Der Druck in einer eingeschlossenen Flüssigkeit ist überall gleich.\n$ {F_1/A_1} = {F_2/A_2}\nEine kleine Kraft am kleinen Kolben erzeugt eine große Kraft am großen Kolben (Hebebühne, Bremse)."},
{id:"p31", page:16, category:"Dichte, Druck & Auftrieb", title:"Auftrieb (Archimedes)",
 body:"Ein Körper in einer Flüssigkeit erfährt eine Auftriebskraft. Sie ist so groß wie die Gewichtskraft der verdrängten Flüssigkeit.\n$ F_A = ρ_(Fl) · g · V_(K) ‖ V_(K): eingetauchtes Volumen\n## Schwimmen, Schweben, Sinken\n- F_A > F_G: Körper steigt bzw. schwimmt (ρ_K < ρ_(Fl))\n- F_A = F_G: Körper schwebt (ρ_K = ρ_(Fl))\n- F_A < F_G: Körper sinkt (ρ_K > ρ_(Fl))"},
{id:"p32", page:16, category:"Dichte, Druck & Auftrieb", title:"Luftdruck",
 body:"Die Luft der Atmosphäre übt durch ihr Gewicht einen Druck aus.\n$ p_0 ≈ 1013 hPa ‖ normaler Luftdruck auf Meereshöhe\nMit zunehmender Höhe nimmt der Luftdruck ab (etwa 1 hPa pro 8 m in Bodennähe).\nMessgerät: Barometer"},

/* ---------- Wärmelehre ---------- */
{id:"p33", page:17, category:"Wärmelehre", title:"Temperatur",
 body:"Die Temperatur beschreibt, wie schnell sich die Teilchen eines Körpers im Mittel bewegen.\n$ T = ϑ + 273,15 ‖ T in K, ϑ in °C\n$ 0 K = -273,15 °C ‖ absoluter Nullpunkt\nTemperaturdifferenzen sind in K und °C gleich groß: Δϑ = 10 °C entspricht ΔT = 10 K."},
{id:"p34", page:17, category:"Wärmelehre", title:"Wärme und spezifische Wärmekapazität",
 body:"Die Wärme Q ist Energie, die wegen eines Temperaturunterschieds übertragen wird.\n$ Q = c · m · ΔT ‖ c: spezifische Wärmekapazität\nT: Stoff§c in {kJ/(kg · K)} ;; Wasser§4,19 ;; Eis§2,1 ;; Aluminium§0,90 ;; Eisen§0,45 ;; Luft§1,0\n## Beispiel\n1 l Wasser von 20 °C auf 100 °C:\n$ Q = 4,19 {kJ/(kg · K)} · 1 kg · 80 K ≈ 335 kJ"},
{id:"p35", page:18, category:"Wärmelehre", title:"Aggregatzustände",
 body:"T: Übergang§Name ;; fest → flüssig§Schmelzen ;; flüssig → fest§Erstarren ;; flüssig → gasförmig§Verdampfen / Sieden ;; gasförmig → flüssig§Kondensieren ;; fest → gasförmig§Sublimieren ;; gasförmig → fest§Resublimieren\n! Während des Schmelzens und Siedens bleibt die Temperatur gleich – die Energie wird zum Ändern des Zustands gebraucht.\n$ Q = q_s · m ‖ Schmelzwärme, Wasser: q_s = 334 {kJ/kg}\n$ Q = q_v · m ‖ Verdampfungswärme, Wasser: q_v = 2257 {kJ/kg}"},
{id:"p36", page:18, category:"Wärmelehre", title:"Wärmeausdehnung",
 body:"Die meisten Stoffe dehnen sich beim Erwärmen aus.\n$ Δl = α · l_0 · ΔT ‖ α: Längenausdehnungskoeffizient\n- Gase dehnen sich stärker aus als Flüssigkeiten, Flüssigkeiten stärker als Feststoffe.\n! Anomalie des Wassers: Wasser hat bei 4 °C die größte Dichte. Eis schwimmt deshalb auf Wasser."},
{id:"p37", page:19, category:"Wärmelehre", title:"Wärmetransport",
 body:"- **Wärmeleitung:** Energie wird von Teilchen zu Teilchen weitergegeben (Metalle leiten gut, Luft schlecht).\n- **Wärmeströmung (Konvektion):** erwärmter Stoff strömt und nimmt die Energie mit (Heizung, Wind).\n- **Wärmestrahlung:** Energie wird ohne Stoff übertragen (Sonne, Lagerfeuer).\nDunkle, matte Flächen nehmen Strahlung besser auf als helle, glänzende."},
{id:"p38", page:19, category:"Wärmelehre", title:"Allgemeines Gasgesetz",
 body:"Für eine abgeschlossene Gasmenge gilt:\n$ {p · V/T} = konstant ‖ T in Kelvin!\n$ p · V = konstant ‖ T konstant (Boyle-Mariotte)\n$ {V/T} = konstant ‖ p konstant (Gay-Lussac)\n$ {p/T} = konstant ‖ V konstant (Amontons)"},

/* ---------- Elektrizität ---------- */
{id:"p39", page:20, category:"Elektrizität", title:"Elektrische Ladung",
 body:"Es gibt positive und negative Ladungen.\n- Gleichnamige Ladungen stoßen sich ab, ungleichnamige ziehen sich an.\n- Elektronen sind negativ, Protonen positiv geladen.\nFormelzeichen: Q, Einheit: 1 Coulomb (C)\n$ 1 C = 1 As\n$ e = 1,602 · 10^(-19) C ‖ Elementarladung"},
{id:"p40", page:20, category:"Elektrizität", title:"Stromstärke",
 body:"Die Stromstärke gibt an, wie viel Ladung pro Sekunde durch einen Leiterquerschnitt fließt.\n$ I = {Q/t} ‖ Einheit: 1 Ampere (A)\nMessung mit dem **Amperemeter** – es wird **in Reihe** geschaltet.\n! Technische Stromrichtung: von Plus nach Minus. Die Elektronen fließen von Minus nach Plus."},
{id:"p41", page:21, category:"Elektrizität", title:"Spannung",
 body:"Die Spannung ist der „Antrieb“ des elektrischen Stroms. Sie entsteht durch Ladungstrennung.\nFormelzeichen: U, Einheit: 1 Volt (V)\nMessung mit dem **Voltmeter** – es wird **parallel** zum Bauteil geschaltet.\nT: Quelle§Spannung ;; Batterie (Mignon)§1,5 V ;; Autobatterie§12 V ;; Steckdose§230 V ;; Oberleitung Bahn§15 000 V"},
{id:"p42", page:21, category:"Elektrizität", title:"Ohmsches Gesetz und Widerstand",
 body:"Der Widerstand gibt an, wie stark ein Bauteil den Strom hemmt.\n$ R = {U/I} ‖ Einheit: 1 Ohm (Ω) = 1 {V/A}\n$ U = R · I\n$ I = {U/R}\n**Ohmsches Gesetz:** Bei konstanter Temperatur ist U ~ I, also R konstant.\n## Merkhilfe URI\n„U = R mal I“"},
{id:"p43", page:22, category:"Elektrizität", title:"Widerstand eines Drahtes",
 body:"$ R = ρ · {l/A} ‖ ρ: spezifischer Widerstand, l: Länge, A: Querschnittsfläche\n- Längerer Draht → größerer Widerstand.\n- Dickerer Draht → kleinerer Widerstand.\nT: Stoff§ρ in {Ω · mm²/m} ;; Silber§0,016 ;; Kupfer§0,017 ;; Aluminium§0,028 ;; Eisen§0,10 ;; Konstantan§0,50"},
{id:"p44", page:22, category:"Elektrizität", title:"Reihenschaltung",
 body:"Alle Bauteile liegen hintereinander in einem Stromkreis.\n$ I = I_1 = I_2 ‖ Stromstärke überall gleich\n$ U = U_1 + U_2 ‖ Spannungen addieren sich\n$ R = R_1 + R_2 ‖ Widerstände addieren sich\n! Fällt ein Bauteil aus, ist der ganze Stromkreis unterbrochen."},
{id:"p45", page:23, category:"Elektrizität", title:"Parallelschaltung",
 body:"Die Bauteile liegen nebeneinander, jedes hat seinen eigenen Zweig.\n$ U = U_1 = U_2 ‖ Spannung überall gleich\n$ I = I_1 + I_2 ‖ Ströme addieren sich\n$ {1/R} = {1/R_1} + {1/R_2}\nDer Gesamtwiderstand ist kleiner als der kleinste Einzelwiderstand.\n! So sind die Steckdosen im Haushalt geschaltet."},
{id:"p46", page:23, category:"Elektrizität", title:"Elektrische Leistung und Energie",
 body:"$ P = U · I ‖ Einheit: 1 W = 1 VA\n$ P = I² · R = {U²/R}\n$ E = P · t ‖ Einheit: 1 J = 1 Ws\n$ 1 kWh = 3 600 000 J = 3,6 MJ\n## Stromkosten\n$ Kosten = E in kWh · Preis pro kWh"},
{id:"p47", page:24, category:"Elektrizität", title:"Sicherheit im Stromkreis",
 body:"- **Kurzschluss:** Der Strom fließt fast ohne Widerstand – sehr hohe Stromstärke, Brandgefahr.\n- **Sicherung:** unterbricht den Stromkreis bei zu großer Stromstärke.\n- **Schutzleiter (gelb-grün):** leitet Strom bei defektem Gehäuse zur Erde ab.\n- **FI-Schalter:** schaltet ab, wenn Strom über den Körper abfließt.\n! Schon ab ca. 50 V Wechselspannung ist es für Menschen lebensgefährlich."},

/* ---------- Magnetismus & Induktion ---------- */
{id:"p48", page:25, category:"Magnetismus", title:"Magnete",
 body:"Jeder Magnet hat einen Nord- und einen Südpol.\n- Gleichnamige Pole stoßen sich ab, ungleichnamige ziehen sich an.\n- Magnetisch sind Eisen, Nickel und Cobalt (ferromagnetische Stoffe).\n- Magnetfeldlinien verlaufen außerhalb des Magneten vom Nord- zum Südpol.\n! Der geografische Nordpol der Erde ist ein magnetischer Südpol."},
{id:"p49", page:25, category:"Magnetismus", title:"Elektromagnet",
 body:"Ein stromdurchflossener Leiter ist von einem Magnetfeld umgeben (Oersted).\nEine Spule mit Eisenkern wirkt als Elektromagnet. Das Magnetfeld wird stärker durch:\n- größere Stromstärke\n- mehr Windungen\n- einen Eisenkern\nAnwendungen: Klingel, Relais, Lautsprecher, Lasthebemagnet"},
{id:"p50", page:26, category:"Magnetismus", title:"Lorentzkraft",
 body:"Auf einen stromdurchflossenen Leiter im Magnetfeld wirkt eine Kraft.\n$ F = B · I · l ‖ B: magnetische Flussdichte in Tesla (T)\nRichtung: **Drei-Finger-Regel** (linke Hand für Elektronen, rechte Hand für technische Stromrichtung): Daumen = Ursache (Strom), Zeigefinger = Magnetfeld, Mittelfinger = Kraft.\nAnwendung: Elektromotor"},
{id:"p51", page:26, category:"Magnetismus", title:"Elektromagnetische Induktion",
 body:"Ändert sich das Magnetfeld in einer Spule, wird eine Spannung induziert.\nDie Induktionsspannung ist größer bei:\n- schnellerer Änderung des Magnetfelds\n- mehr Windungen\n- stärkerem Magneten\n**Lenzsche Regel:** Der Induktionsstrom ist so gerichtet, dass er seiner Ursache entgegenwirkt.\nAnwendung: Generator, Dynamo, Induktionsherd"},
{id:"p52", page:27, category:"Magnetismus", title:"Transformator",
 body:"Ein Transformator wandelt Wechselspannungen um. Er besteht aus zwei Spulen auf einem gemeinsamen Eisenkern.\n$ {U_1/U_2} = {N_1/N_2} ‖ N: Windungszahl\n$ {I_1/I_2} = {N_2/N_1} ‖ idealer Trafo\n! Ein Transformator funktioniert nur mit Wechselspannung.\nFernleitungen nutzen Hochspannung, weil bei kleiner Stromstärke weniger Energie als Wärme verloren geht."},

/* ---------- Optik ---------- */
{id:"p53", page:28, category:"Optik", title:"Lichtausbreitung und Schatten",
 body:"Licht breitet sich geradlinig aus. Man stellt es mit Lichtstrahlen dar.\n$ c ≈ 300 000 {km/s} ‖ Lichtgeschwindigkeit im Vakuum\n- **Kernschatten:** kein Licht der Lichtquellen erreicht diesen Bereich.\n- **Halbschatten:** nur ein Teil des Lichts erreicht ihn.\nMond- und Sonnenfinsternis entstehen durch Schatten."},
{id:"p54", page:28, category:"Optik", title:"Reflexionsgesetz",
 body:"Licht wird an glatten Flächen reflektiert.\n$ α = α' ‖ Einfallswinkel = Reflexionswinkel\nBeide Winkel werden zum **Lot** gemessen (Senkrechte auf der Fläche).\nEinfallender Strahl, Lot und reflektierter Strahl liegen in einer Ebene.\nAm ebenen Spiegel ist das Bild genauso weit hinter dem Spiegel wie der Gegenstand davor."},
{id:"p55", page:29, category:"Optik", title:"Brechung",
 body:"Beim Übergang in ein anderes Medium ändert Licht seine Richtung.\n- Übergang ins optisch **dichtere** Medium (z. B. Luft → Wasser): **zum Lot hin** gebrochen.\n- Übergang ins optisch **dünnere** Medium: **vom Lot weg** gebrochen.\n$ n_1 · sin α = n_2 · sin β ‖ Brechungsgesetz (Snellius)\n! Totalreflexion: Vom dichteren ins dünnere Medium wird ab dem Grenzwinkel alles Licht reflektiert (Glasfaserkabel)."},
{id:"p56", page:29, category:"Optik", title:"Linsen",
 body:"- **Sammellinse (konvex):** in der Mitte dicker, bündelt parallele Strahlen im Brennpunkt F.\n- **Zerstreuungslinse (konkav):** in der Mitte dünner, streut das Licht.\n## Besondere Strahlen (Sammellinse)\n- Parallelstrahl → wird zum Brennpunktstrahl.\n- Mittelpunktstrahl → geht ungebrochen durch.\n- Brennpunktstrahl → wird zum Parallelstrahl.\n$ D = {1/f} ‖ Brechkraft in Dioptrien (dpt), f in m"},
{id:"p57", page:30, category:"Optik", title:"Linsengleichung und Abbildungsmaßstab",
 body:"$ {1/f} = {1/g} + {1/b} ‖ g: Gegenstandsweite, b: Bildweite\n$ {B/G} = {b/g} ‖ B: Bildgröße, G: Gegenstandsgröße\nT: Gegenstandsweite§Bild ;; g > 2f§verkleinert, umgekehrt, reell ;; g = 2f§gleich groß, umgekehrt, reell ;; f < g < 2f§vergrößert, umgekehrt, reell ;; g < f§vergrößert, aufrecht, virtuell (Lupe)"},
{id:"p58", page:30, category:"Optik", title:"Farben und Spektrum",
 body:"Weißes Licht besteht aus vielen Farben. Ein Prisma zerlegt es in ein Spektrum: Rot, Orange, Gelb, Grün, Blau, Violett.\n- Rotes Licht wird am wenigsten, violettes am stärksten gebrochen.\n- **Additive Farbmischung** (Licht): Rot + Grün + Blau = Weiß.\n- **Subtraktive Farbmischung** (Farbstoffe): Cyan + Magenta + Gelb = Schwarz.\nEin Gegenstand erscheint in der Farbe, die er reflektiert."},

/* ---------- Schwingungen & Wellen ---------- */
{id:"p59", page:31, category:"Schwingungen & Wellen", title:"Schwingungen",
 body:"Eine Schwingung ist eine regelmäßige Hin- und Herbewegung um eine Ruhelage.\n$ f = {1/T} ‖ Frequenz in Hertz (Hz), T: Periodendauer\n- **Amplitude:** größte Auslenkung aus der Ruhelage.\n## Fadenpendel\n$ T = 2π · √({l/g})\nDie Periodendauer hängt nur von der Länge ab, nicht von der Masse."},
{id:"p60", page:31, category:"Schwingungen & Wellen", title:"Wellen",
 body:"Eine Welle transportiert Energie, aber keinen Stoff.\n$ c = λ · f ‖ c: Ausbreitungsgeschwindigkeit, λ: Wellenlänge\n- **Querwelle (Transversalwelle):** schwingt senkrecht zur Ausbreitung (Seilwelle, Licht).\n- **Längswelle (Longitudinalwelle):** schwingt in Ausbreitungsrichtung (Schall)."},
{id:"p61", page:32, category:"Schwingungen & Wellen", title:"Schall",
 body:"Schall ist eine Längswelle. Er braucht einen Stoff zur Ausbreitung – im Vakuum gibt es keinen Schall.\n$ c_(Luft) ≈ 340 {m/s} ‖ bei 20 °C\n- Hohe Frequenz → hoher Ton, große Amplitude → lauter Ton.\n- Hörbereich des Menschen: etwa 20 Hz bis 20 000 Hz.\n- Darunter Infraschall, darüber Ultraschall.\n- Lautstärke wird in Dezibel (dB) angegeben."},
{id:"p62", page:32, category:"Schwingungen & Wellen", title:"Elektromagnetisches Spektrum",
 body:"Licht ist eine elektromagnetische Welle. Alle elektromagnetischen Wellen breiten sich mit Lichtgeschwindigkeit aus.\nT: Strahlung§Wellenlänge ;; Radiowellen§über 1 m ;; Mikrowellen§1 mm – 1 m ;; Infrarot§780 nm – 1 mm ;; sichtbares Licht§380 nm – 780 nm ;; Ultraviolett§10 nm – 380 nm ;; Röntgen- und Gammastrahlung§unter 10 nm\n! Je kleiner die Wellenlänge, desto energiereicher die Strahlung."},

/* ---------- Atom- & Kernphysik ---------- */
{id:"p63", page:33, category:"Atom- & Kernphysik", title:"Aufbau des Atoms",
 body:"Ein Atom besteht aus dem **Atomkern** und der **Atomhülle**.\n- Kern: Protonen (positiv) und Neutronen (neutral)\n- Hülle: Elektronen (negativ)\n$ A = Z + N ‖ Massenzahl = Protonenzahl + Neutronenzahl\n**Isotope** sind Atome eines Elements mit gleicher Protonen-, aber unterschiedlicher Neutronenzahl (z. B. C‑12 und C‑14)."},
{id:"p64", page:33, category:"Atom- & Kernphysik", title:"Radioaktive Strahlung",
 body:"Instabile Kerne zerfallen und senden dabei Strahlung aus.\nT: Strahlung§besteht aus§abschirmbar durch ;; α-Strahlung§Heliumkernen§Blatt Papier ;; β-Strahlung§Elektronen§einige mm Aluminium ;; γ-Strahlung§elektromagnetischer Welle§dickes Blei, Beton\nNachweis: Geiger-Müller-Zählrohr\n$ 1 Bq = 1 Zerfall pro Sekunde ‖ Aktivität in Becquerel"},
{id:"p65", page:34, category:"Atom- & Kernphysik", title:"Halbwertszeit",
 body:"Die Halbwertszeit T_(1/2) ist die Zeit, nach der die Hälfte der Kerne zerfallen ist.\n$ N(t) = N_0 · ({1/2})^({t/T_(1/2)})\nNach 1 Halbwertszeit: {1/2}, nach 2: {1/4}, nach 3: {1/8} der Kerne übrig.\nT: Nuklid§Halbwertszeit ;; Iod‑131§8 Tage ;; Cäsium‑137§30 Jahre ;; Kohlenstoff‑14§5730 Jahre ;; Uran‑238§4,5 Mrd. Jahre"},
{id:"p66", page:34, category:"Atom- & Kernphysik", title:"Kernspaltung und Kernfusion",
 body:"- **Kernspaltung:** Ein schwerer Kern (z. B. Uran‑235) wird durch ein Neutron in zwei mittelschwere Kerne gespalten. Dabei werden Energie und weitere Neutronen frei → Kettenreaktion (Kernkraftwerk).\n- **Kernfusion:** Leichte Kerne verschmelzen zu einem schwereren Kern (z. B. Wasserstoff → Helium in der Sonne).\n$ E = m · c² ‖ Massendefekt wird als Energie frei"}
];
