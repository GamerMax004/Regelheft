/* Regelheft Chemie – Regeldaten (Sekundarstufe I).
   Wird von index.html, ki.html, kurse.html und dashboard.html geladen.
   Jede Regel: id (c + Nummer, nie doppelt, nie wiederverwenden), title, category, body, diagram (null oder SVG).
   Schreibweise in "body" wie bei Mathe/Physik:
     $ Formel ‖ Erklärung   ## Überschrift   ! Merkkasten   - Aufzählung   T: a§b ;; c§d (Tabelle)
     **fett**, {a/b} Bruch, x^(2) hoch, H_(2)O tief
   Eigene Texte als Einstieg. Bitte mit dem Stoff aus deinem Unterricht abgleichen. */
window.RULES_CHEMIE = [
{ id: "c0", category: "Grundlagen", title: "Stoffe und Stoffeigenschaften", diagram: null, body: `Ein **Reinstoff** besteht nur aus einer Sorte Teilchen, ein **Stoffgemisch** aus mehreren Stoffen.
## Typische Stoffeigenschaften
- Aussehen (Farbe, Glanz) und Aggregatzustand bei Zimmertemperatur
- Schmelz- und Siedetemperatur (bei Reinstoffen immer gleich)
- Dichte, Löslichkeit, elektrische Leitfähigkeit, Brennbarkeit
$ ρ = m / V ‖ Dichte = Masse : Volumen
! Stoffe erkennt man an ihren Eigenschaften. Die Dichte hängt nicht von der Menge ab.` },
{ id: "c1", category: "Grundlagen", title: "Stoffgemische und Trennverfahren", diagram: null, body: `Ein Gemisch ist **homogen**, wenn man die Bestandteile nicht erkennen kann (Lösung, Legierung), und **heterogen**, wenn man sie sieht (Suspension, Emulsion, Gemenge).
T: Verfahren§Nutzt den Unterschied bei ;; Sieben§Korngröße ;; Filtrieren§Teilchengröße (Feststoff aus Flüssigkeit) ;; Sedimentieren und Dekantieren§Dichte (Feststoff setzt sich ab) ;; Eindampfen§Siedetemperatur (Feststoff bleibt zurück) ;; Destillieren§Siedetemperatur (Flüssigkeiten trennen) ;; Chromatografie§Löslichkeit und Haftung ;; Magnetscheidung§Magnetismus` },
{ id: "c2", category: "Grundlagen", title: "Chemische Reaktion und Energie", diagram: null, body: `Bei einer **chemischen Reaktion** entstehen aus den Ausgangsstoffen (**Edukten**) neue Stoffe (**Produkte**) mit neuen Eigenschaften.
$ Edukte → Produkte ‖ Reaktionsschema
- Die Atome werden nur neu angeordnet, ihre Anzahl bleibt gleich (Massenerhaltung).
- **exotherm**: Energie wird abgegeben (z. B. Verbrennung)
- **endotherm**: Energie wird aufgenommen (z. B. Zersetzung von Wasser)
- Die **Aktivierungsenergie** startet die Reaktion. Ein **Katalysator** senkt sie und wird nicht verbraucht.` },
{ id: "c3", category: "Atombau & Periodensystem", title: "Atombau", diagram: null, body: `Ein Atom besteht aus dem winzigen, positiv geladenen **Atomkern** und der **Atomhülle** aus Elektronen.
T: Teilchen§Ladung§Ort ;; Proton§+1§Kern ;; Neutron§0§Kern ;; Elektron§−1§Hülle
$ Ordnungszahl = Protonenzahl
$ Massenzahl = Protonenzahl + Neutronenzahl
$ Elektronenzahl = Protonenzahl ‖ Atome sind nach außen neutral
- Atome eines Elements haben gleich viele Protonen, können aber verschieden viele Neutronen haben (**Isotope**).` },
{ id: "c4", category: "Atombau & Periodensystem", title: "Periodensystem", diagram: null, body: `Das Periodensystem ordnet die Elemente nach steigender Ordnungszahl.
- **Periode** (Zeile): Zahl der Elektronenschalen
- **Hauptgruppe** (Spalte): Zahl der Außenelektronen (Valenzelektronen)
T: Gruppe§Name§Besonderheit ;; 1. Hauptgruppe§Alkalimetalle§sehr reaktiv, reagieren heftig mit Wasser ;; 2. Hauptgruppe§Erdalkalimetalle§reaktiv ;; 7. Hauptgruppe§Halogene§reaktive Nichtmetalle ;; 8. Hauptgruppe§Edelgase§reaktionsträge, Außenschale voll` },
{ id: "c5", category: "Atombau & Periodensystem", title: "Elektronenschalen und Oktettregel", diagram: null, body: `Die Elektronen sind in Schalen angeordnet (K, L, M, …). Auf die n-te Schale passen höchstens 2·n² Elektronen.
$ K: 2, L: 8, M: 18 ‖ höchste Elektronenzahl je Schale
- Die äußerste Schale enthält die **Valenzelektronen** und bestimmt das Reaktionsverhalten.
- **Oktettregel**: Atome streben acht Außenelektronen an (bei der K-Schale zwei), wie die Edelgase.
- Dazu geben sie Elektronen ab, nehmen welche auf oder teilen sie mit anderen Atomen.` },
{ id: "c6", category: "Bindungen", title: "Ionenbindung", diagram: null, body: `Metallatome geben Elektronen ab und werden zu positiven **Kationen**, Nichtmetallatome nehmen Elektronen auf und werden zu negativen **Anionen**. Die Ionen ziehen sich an: **Ionenbindung**.
$ Na → Na^(+) + e^(−) ‖ Abgabe: Natrium wird zum Kation
$ Cl + e^(−) → Cl^(−) ‖ Aufnahme: Chlor wird zum Anion
- Die Ionen bilden ein regelmäßiges **Ionengitter** (Salzkristall).
- Salze sind hart und spröde, haben hohe Schmelztemperaturen und leiten Strom erst als Schmelze oder Lösung (bewegliche Ionen).
- Die Ladungen müssen sich ausgleichen, z. B. Mg^(2+) und Cl^(−) ergeben MgCl_(2).` },
{ id: "c7", category: "Bindungen", title: "Atombindung (Elektronenpaarbindung)", diagram: null, body: `Nichtmetallatome teilen sich **Elektronenpaare**, sodass jedes Atom die Edelgasschale erreicht. So entstehen **Moleküle**.
T: Molekül§Bindung§Formel ;; Wasserstoff§Einfachbindung§H_(2) ;; Sauerstoff§Doppelbindung§O_(2) ;; Stickstoff§Dreifachbindung§N_(2) ;; Wasser§2 Einfachbindungen§H_(2)O ;; Kohlenstoffdioxid§2 Doppelbindungen§CO_(2)
- Ein bindendes Elektronenpaar wird in der **Valenzstrichformel** als Strich gezeichnet, nichtbindende Paare heißen freie Elektronenpaare.
- Molekülsubstanzen haben meist niedrige Schmelz- und Siedetemperaturen und leiten keinen Strom.` },
{ id: "c8", category: "Bindungen", title: "Metallbindung", diagram: null, body: `In Metallen sind die positiven Atomrümpfe in einem Gitter angeordnet, die Außenelektronen sind frei beweglich (**Elektronengas**).
- Gute elektrische und thermische Leitfähigkeit (bewegliche Elektronen)
- Verformbar, weil sich Schichten verschieben und das Elektronengas alles zusammenhält
- Metallglanz` },
{ id: "c9", category: "Reaktionen & Rechnen", title: "Reaktionsgleichung aufstellen", diagram: null, body: `## Vorgehen
- 1. Wortgleichung aufschreiben
- 2. Formeln einsetzen (H_(2), O_(2), N_(2), Cl_(2) usw. sind zweiatomig)
- 3. Atome ausgleichen: nur **Koeffizienten** (Zahlen vor der Formel) ändern, nie die Indizes (tiefgestellte Zahlen)
- 4. Zum Schluss jede Atomsorte nachzählen
$ 2 H_(2) + O_(2) → 2 H_(2)O ‖ Wasserstoff reagiert mit Sauerstoff zu Wasser
! Auf beiden Seiten muss von jeder Atomsorte gleich viel stehen.` },
{ id: "c10", category: "Reaktionen & Rechnen", title: "Wichtige Reaktionstypen", diagram: null, body: `T: Typ§Schema§Beispiel ;; Synthese§A + B → AB§2 Mg + O_(2) → 2 MgO ;; Analyse (Zersetzung)§AB → A + B§2 H_(2)O → 2 H_(2) + O_(2) ;; Umsetzung§AB + C → AC + B§Zn + 2 HCl → ZnCl_(2) + H_(2)` },
{ id: "c11", category: "Reaktionen & Rechnen", title: "Redoxreaktionen", diagram: null, body: `Bei einer **Redoxreaktion** werden Elektronen übertragen. Oxidation und Reduktion laufen immer gemeinsam ab.
- **Oxidation**: Ein Teilchen gibt Elektronen ab.
- **Reduktion**: Ein Teilchen nimmt Elektronen auf.
- Wer Elektronen abgibt, ist das **Reduktionsmittel**, wer sie aufnimmt, das **Oxidationsmittel**.
$ 2 Mg + O_(2) → 2 MgO ‖ Mg gibt Elektronen ab (Oxidation), O nimmt sie auf (Reduktion)` },
{ id: "c12", category: "Reaktionen & Rechnen", title: "Stoffmenge und molare Masse", diagram: null, body: `Die **Stoffmenge** n gibt in der Einheit mol an, wie viele Teilchen vorliegen. Ein mol enthält 6,022 · 10^(23) Teilchen (Avogadro-Zahl).
$ n = {m/M} ‖ Stoffmenge = Masse : molare Masse
$ N = n · N_(A) ‖ Teilchenzahl, N_A = 6,022 · 10^(23) mol^(−1)
- Die **molare Masse** M (in g/mol) hat dieselbe Maßzahl wie die Atom- oder Molekülmasse in u, z. B. M(H_(2)O) = 18 g/mol.` },
{ id: "c13", category: "Reaktionen & Rechnen", title: "Stoffmengenkonzentration", diagram: null, body: `$ c = {n/V} ‖ Konzentration in mol/L
$ n = c · V ‖ umgestellt
- Beispiel: 0,5 mol Salz in 2 L Lösung ergeben c = 0,25 mol/L.` },
{ id: "c14", category: "Säuren & Basen", title: "Säuren, Laugen und Indikatoren", diagram: null, body: `- **Säuren** geben H^(+)-Ionen (Protonen) ab. In Wasser entstehen H_(3)O^(+)-Ionen. Beispiele: Salzsäure HCl, Schwefelsäure H_(2)SO_(4)
- **Laugen** (Basen in Wasser) enthalten OH^(−)-Ionen. Beispiel: Natronlauge NaOH
- Ein **Indikator** zeigt es an: Universalindikator ist in sauren Lösungen rot, in neutralen grün und in alkalischen blau bis violett.
T: pH-Wert§Lösung ;; kleiner als 7§sauer ;; 7§neutral ;; größer als 7§alkalisch (basisch)` },
{ id: "c15", category: "Säuren & Basen", title: "Neutralisation", diagram: null, body: `$ Säure + Lauge → Salz + Wasser
$ HCl + NaOH → NaCl + H_(2)O ‖ Salzsäure + Natronlauge → Kochsalz + Wasser
$ H_(3)O^(+) + OH^(−) → 2 H_(2)O ‖ Kern der Reaktion: die Ionen bilden Wasser
- Ist genau so viel Säure wie Lauge vorhanden, ist die Lösung neutral (pH = 7).` },
{ id: "c16", category: "Säuren & Basen", title: "pH-Wert", diagram: null, body: `$ pH = −lg c(H_(3)O^(+)) ‖ negativer dekadischer Logarithmus der Konzentration in mol/L
- Je kleiner der pH-Wert, desto saurer ist die Lösung.
- Ein pH-Schritt bedeutet den Faktor 10: Bei pH 3 sind zehnmal so viele H_(3)O^(+)-Ionen in der Lösung wie bei pH 4.
- Beispiel: c(H_(3)O^(+)) = 0,001 mol/L = 10^(−3) mol/L ergibt pH = 3.` },
{ id: "c17", category: "Organische Chemie", title: "Alkane", diagram: null, body: `**Alkane** sind Kohlenwasserstoffe, die nur Einfachbindungen enthalten.
$ C_(n)H_(2n+2) ‖ allgemeine Formel
T: Name§Formel ;; Methan§CH_(4) ;; Ethan§C_(2)H_(6) ;; Propan§C_(3)H_(8) ;; Butan§C_(4)H_(10) ;; Pentan§C_(5)H_(12)
- Die Namen enden auf -an. Vorsilben: Meth- (1), Eth- (2), Prop- (3), But- (4), Pent- (5), Hex- (6) Kohlenstoffatome.
- Alkane sind unpolar, in Wasser nicht löslich und brennbar.` },
{ id: "c18", category: "Organische Chemie", title: "Alkohole", diagram: null, body: `Alkohole enthalten eine oder mehrere **Hydroxygruppen** (–OH). Der Name ist der des Alkans mit der Endung -ol.
T: Name§Formel ;; Methanol§CH_(3)OH ;; Ethanol§C_(2)H_(5)OH ;; Propanol§C_(3)H_(7)OH
- Die OH-Gruppe ist polar: Kurzkettige Alkohole mischen sich gut mit Wasser.
- Ethanol entsteht bei der alkoholischen Gärung aus Traubenzucker. Methanol ist giftig.` }
];
