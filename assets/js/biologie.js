/* Regelheft Biologie – Regeldaten (Sekundarstufe I).
   Wird von index.html, ki.html, kurse.html und dashboard.html geladen.
   Jede Regel: id (b + Nummer, nie doppelt, nie wiederverwenden), title, category, body, diagram (null oder SVG).
   Schreibweise in "body" wie bei Mathe/Physik:
     $ Formel ‖ Erklärung   ## Überschrift   ! Merkkasten   - Aufzählung   T: a§b ;; c§d (Tabelle)
     **fett**, x^(2) hoch, H_(2)O tief
   Eigene Texte als Einstieg. Bitte mit dem Stoff aus deinem Unterricht abgleichen. */
window.RULES_BIOLOGIE = [
{ id: "b0", category: "Zelle", title: "Bau von Tier- und Pflanzenzelle", diagram: null, body: `T: Bestandteil§Aufgabe§Vorkommen ;; Zellkern§enthält die Erbinformation (DNA)§beide ;; Zellmembran§umgibt die Zelle, regelt den Stoffaustausch§beide ;; Zellplasma§Raum für Stoffwechselvorgänge§beide ;; Mitochondrien§Zellatmung, Energiegewinnung§beide ;; Zellwand§stützt und schützt die Zelle§nur Pflanze ;; Chloroplasten§Fotosynthese§nur Pflanze ;; Vakuole§Speicher für Wasser und Stoffe§vor allem Pflanze
- Ordnung im Körper: Zelle → Gewebe → Organ → Organsystem → Organismus` },
{ id: "b1", category: "Zelle", title: "Mikroskopieren", diagram: null, body: `$ Gesamtvergrößerung = Okular × Objektiv ‖ z. B. 10 × 40 = 400-fach
- Immer mit der kleinsten Vergrößerung beginnen.
- Das Objekt mittig auf den Objekttisch legen. Von der Seite das Objektiv fast bis ans Deckglas heranfahren, dann beim Hineinschauen vom Objekt weg scharf stellen.
- Zeichnung mit Bleistift, saubere Linien, Beschriftung mit Linien, Titel und Vergrößerung angeben.` },
{ id: "b2", category: "Zelle", title: "Mitose und Meiose", diagram: null, body: `T: Merkmal§Mitose§Meiose ;; Zweck§Wachstum und Erneuerung§Bildung von Keimzellen ;; Ergebnis§2 Zellen§4 Zellen ;; Chromosomensatz§bleibt diploid (2n)§wird halbiert zu haploid (n) ;; Erbgut§identisch zur Mutterzelle§neu kombiniert
- Mensch: 46 Chromosomen in Körperzellen (2n), 23 in Keimzellen (n).` },
{ id: "b3", category: "Stoffwechsel", title: "Fotosynthese", diagram: null, body: `Pflanzen bauen mit **Lichtenergie** aus Kohlenstoffdioxid und Wasser Traubenzucker (Glucose) auf und setzen Sauerstoff frei. Das geschieht in den **Chloroplasten** (mit Chlorophyll).
$ 6 CO_(2) + 6 H_(2)O → C_(6)H_(12)O_(6) + 6 O_(2) ‖ mit Lichtenergie
- Glucose dient als Energielieferant, wird als Stärke gespeichert und zu Zellulose verbaut.` },
{ id: "b4", category: "Stoffwechsel", title: "Zellatmung", diagram: null, body: `$ C_(6)H_(12)O_(6) + 6 O_(2) → 6 CO_(2) + 6 H_(2)O + Energie ‖ in den Mitochondrien
- Läuft in allen Zellen von Tieren und Pflanzen, Tag und Nacht.
- Sie ist das Gegenstück zur Fotosynthese: Die Produkte der einen sind die Ausgangsstoffe der anderen.` },
{ id: "b5", category: "Stoffwechsel", title: "Diffusion und Osmose", diagram: null, body: `- **Diffusion**: Teilchen verteilen sich von selbst vom Ort hoher zum Ort niedriger Konzentration, bis sie gleichmäßig verteilt sind.
- **Osmose**: Diffusion von Wasser durch eine **selektiv permeable Membran**, die nur manche Stoffe durchlässt. Das Wasser wandert zur Seite mit der höheren Salzkonzentration.
- Eine Pflanzenzelle in konzentrierter Salzlösung verliert Wasser und schrumpft (Plasmolyse). In Süßwasser nimmt sie Wasser auf und wird prall.` },
{ id: "b6", category: "Genetik", title: "DNA und Gene", diagram: null, body: `Die Erbinformation liegt als **DNA** im Zellkern. Sie ist eine Doppelhelix aus zwei Strängen mit vier Basen.
T: Base§paart mit ;; Adenin (A)§Thymin (T) ;; Guanin (G)§Cytosin (C)
- Ein **Gen** ist ein DNA-Abschnitt mit dem Bauplan für ein Merkmal (Protein).
- Die DNA ist zu **Chromosomen** aufgewickelt. Der Mensch hat 46 Chromosomen (23 Paare).` },
{ id: "b7", category: "Genetik", title: "Mendelsche Regeln", diagram: null, body: `T: Regel§Aussage ;; 1. Uniformitätsregel§Kreuzt man zwei reinerbige Individuen, die sich in einem Merkmal unterscheiden, sind alle Nachkommen (F1) gleich ;; 2. Spaltungsregel§Kreuzt man F1 untereinander, treten in F2 beide Merkmale wieder auf, bei dominant-rezessivem Erbgang im Verhältnis 3 : 1 ;; 3. Unabhängigkeitsregel§Verschiedene Merkmale werden unabhängig voneinander vererbt und neu kombiniert
- **dominant**: setzt sich durch (Großbuchstabe), **rezessiv**: wird überdeckt (Kleinbuchstabe)
- **homozygot** (reinerbig): AA oder aa, **heterozygot** (mischerbig): Aa
- **Genotyp** = Erbanlagen, **Phänotyp** = sichtbares Merkmal
$ Aa × Aa → AA : Aa : aa = 1 : 2 : 1 ‖ Phänotypen im Verhältnis 3 : 1` },
{ id: "b8", category: "Mensch", title: "Verdauung", diagram: null, body: `T: Organ§Aufgabe ;; Mund§Zerkleinern, Speichel beginnt den Stärkeabbau ;; Speiseröhre§Transport durch Muskelbewegung ;; Magen§Magensäure, Eiweißverdauung ;; Dünndarm§Verdauung wird abgeschlossen, Nährstoffe gehen ins Blut (Resorption) ;; Dickdarm§entzieht dem Nahrungsbrei Wasser ;; Leber, Galle, Bauchspeicheldrüse§Verdauungssäfte, vor allem für die Fettverdauung` },
{ id: "b9", category: "Mensch", title: "Blut und Blutkreislauf", diagram: null, body: `T: Bestandteil§Aufgabe ;; Rote Blutkörperchen§Sauerstofftransport (Hämoglobin) ;; Weiße Blutkörperchen§Abwehr von Krankheitserregern ;; Blutplättchen§Blutgerinnung ;; Blutplasma§Transport von Nährstoffen, Hormonen und Wärme
- **Lungenkreislauf**: Herz → Lunge → Herz (Aufnahme von O_(2), Abgabe von CO_(2))
- **Körperkreislauf**: Herz → Körper → Herz
- Arterien führen vom Herzen weg, Venen zum Herzen hin.` },
{ id: "b10", category: "Mensch", title: "Reiz-Reaktions-Kette", diagram: null, body: `Reiz → Sinneszelle → sensorische Nervenbahn → Gehirn oder Rückenmark (**ZNS**) → motorische Nervenbahn → Muskel (Reaktion)
- Die **Sinneszellen** wandeln Reize in elektrische Signale um.
- Das **ZNS** verarbeitet die Signale und entscheidet über die Reaktion.
- Bei einem **Reflex** läuft die Reaktion über das Rückenmark besonders schnell und unbewusst ab.` },
{ id: "b11", category: "Mensch", title: "Immunsystem und Impfung", diagram: null, body: `- **Antigene** sind körperfremde Merkmale, z. B. auf Viren oder Bakterien.
- **Antikörper** binden an Antigene und markieren sie, damit Fresszellen sie beseitigen.
- **Gedächtniszellen** speichern die Information. Bei erneutem Kontakt reagiert der Körper schneller.
T: Impfung§Prinzip ;; aktiv§abgeschwächte oder abgetötete Erreger bzw. ihre Bestandteile, der Körper bildet selbst Antikörper und Gedächtniszellen, der Schutz hält lange ;; passiv§fertige Antikörper werden gespritzt, sofort wirksam, der Schutz hält nur kurz` },
{ id: "b12", category: "Ökologie & Evolution", title: "Nahrungskette und Energiefluss", diagram: null, body: `Produzenten (Pflanzen) → Konsumenten 1. Ordnung (Pflanzenfresser) → Konsumenten 2. Ordnung (Fleischfresser) → …
- **Destruenten** (Bakterien, Pilze) zersetzen Abgestorbenes zu Mineralstoffen.
- Mehrere verknüpfte Nahrungsketten bilden ein **Nahrungsnetz**.
- Von Stufe zu Stufe geht viel Energie verloren. Faustregel: Nur etwa 10 % werden an die nächste Stufe weitergegeben.` },
{ id: "b13", category: "Ökologie & Evolution", title: "Umweltfaktoren und Toleranz", diagram: null, body: `- **Abiotische** Faktoren: Licht, Temperatur, Wasser, Boden
- **Biotische** Faktoren: Nahrung, Konkurrenz, Fressfeinde, Krankheiten, Symbiose
T: Bereich§Bedeutung ;; Optimum§beste Lebensbedingungen ;; Toleranzbereich§Überleben und Fortpflanzung sind möglich ;; Pessimum§nur Überleben, keine Fortpflanzung ;; außerhalb§Tod` },
{ id: "b14", category: "Ökologie & Evolution", title: "Evolution durch Selektion", diagram: null, body: `Nach Darwin entwickeln sich Arten durch **natürliche Selektion**:
- **Variation**: Die Individuen einer Art unterscheiden sich (Mutation, Rekombination).
- **Überproduktion**: Es entstehen mehr Nachkommen, als überleben können.
- **Selektion**: Individuen mit vorteilhaften Merkmalen überleben und pflanzen sich häufiger fort.
- **Vererbung**: Vorteilhafte Merkmale werden weitergegeben, die Population verändert sich.` }
];
