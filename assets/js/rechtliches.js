/* ============================================================
   Impressum & Datenschutzerklärung – Texte
   Deine Angaben (Name, Adresse, E-Mail …) stehen in config.js unter LEGAL.
   Die Texte werden daraus erzeugt: renderLegal('impressum') / renderLegal('datenschutz')
   ============================================================ */
function renderLegal(which){
  const CFG = () => RH.cfg();
  const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const v = k => LEGAL[k] ? esc(LEGAL[k]) : '<mark>[BITTE EINTRAGEN: ' + k + ']</mark>';
  const addr = () => v('company') + '<br>vertreten durch ' + v('rep') + '<br>' + v('street') + '<br>' + v('city') + '<br>' + v('country');
  const payNote = () => 'Die Zahlungsabwicklung und Rechnungsstellung für Produkte und Dienstleistungen von ' + esc(LEGAL.brand) + ' erfolgt über ' + esc(LEGAL.company) + ' (Zahlungsdienstleister: Stripe). Auf Kreditkarten- und Kontoabrechnungen erscheint die Belastung in der Regel unter Stripe.';
  const contact = () => 'E-Mail: ' + v('email') + (LEGAL.phone ? '<br>Telefon: ' + esc(LEGAL.phone) : '<br><mark>[BITTE EINTRAGEN: phone – oder ein anderes zweites Kontaktmittel]</mark>');
  const ext = [SOCIAL.discord && 'Discord', SOCIAL.instagram && 'Instagram'].filter(Boolean);
  const hasExt = ext.length > 0, extNames = ext.join(', ');

  const impressum = () => `
<h3>Anbieterkennzeichnung (Angaben gemäß § 5 DDG)</h3>
<p><b>${esc(LEGAL.brand)}</b></p>
<p>Ein Angebot von:<br>${v('company')}</p>
<p>Vertreten durch:<br>${v('rep')}<br>${v('street')}<br>${v('city')}<br>${v('country')}</p>
<h3>Zahlungshinweis &amp; Abrechnung</h3>
<p>${payNote()}</p>
<h3>Kontakt</h3>
<p>${contact()}</p>
<h3>Verantwortlich für den Inhalt (§ 18 Abs. 2 MStV)</h3>
<p>${addr()}</p>
<h3>Hinweis zu KI-Funktionen</h3>
<p>Die Antworten der KI-Aufgabenhilfe werden automatisch von einem KI-System erzeugt. Sie können Fehler enthalten und ersetzen weder Unterricht noch Schulbuch oder Lehrkraft. Für die Richtigkeit wird keine Gewähr übernommen.</p>
<h3>Haftung für Inhalte</h3>
<p>Als Diensteanbieter sind wir nach den allgemeinen Gesetzen für eigene Inhalte verantwortlich. Nach den §§ 8 bis 10 DDG sind wir nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen. Verpflichtungen zur Entfernung oder Sperrung von Informationen nach den allgemeinen Gesetzen bleiben unberührt. Bei Bekanntwerden entsprechender Rechtsverletzungen entfernen wir die betreffenden Inhalte umgehend.</p>
${hasExt ? '<h3>Haftung für Links</h3><p>Im Fußbereich der Seiten befinden sich Links zu externen Angeboten (' + extNames + '). Auf deren Inhalte haben wir keinen Einfluss und übernehmen dafür keine Gewähr. Für die Inhalte ist der jeweilige Betreiber verantwortlich.</p>' : ''}
<h3>Urheberrecht</h3>
<p>Die Inhalte dieses Angebots (Texte, Formeln, Grafiken, Zusammenstellung) wurden von ${esc(LEGAL.brand)} erstellt und unterliegen dem Urheberrecht („Copyright © ${esc(LEGAL.brand)}“). Eine Vervielfältigung oder Verwendung außerhalb der gesetzlichen Schranken (z. B. privates Lernen) bedarf der vorherigen Zustimmung des Anbieters. Wer Rechte an Inhalten verletzt sieht, kann sich unter der oben genannten E-Mail-Adresse melden.</p>
<h3>Verbraucherstreitbeilegung</h3>
<p>Wir sind weder bereit noch verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen (§ 36 VSBG).</p>`;

  const datenschutz = () => `
<p>Stand: ${esc(LEGAL.stand)}. Diese Erklärung informiert dich nach Art. 13 und 14 DSGVO darüber, welche personenbezogenen Daten beim Besuch und bei der Nutzung des Regelhefts verarbeitet werden.</p>
<h3>1. Verantwortlicher</h3>
<p>${addr()}<br>${contact()}</p>
<p>Das Regelheft Mathematik wird unter der Marke ${esc(LEGAL.brand)} als Angebot von ${esc(LEGAL.company)} betrieben.</p>${LEGAL.euRep ? '<p>Vertreter in der EU (Art. 27 DSGVO): ' + esc(LEGAL.euRep) + '</p>' : ''}
<p>Ein Datenschutzbeauftragter ist nicht benannt, da dafür keine gesetzliche Pflicht besteht.</p>
<h3>2. Überblick</h3>
<p>Das Regelheft kann ohne Konto genutzt werden. Dabei werden nur technisch notwendige Daten (Abschnitt 3) und eine anonyme Statistik (Abschnitt 5) verarbeitet. Ein Konto (Abschnitt 6) und die KI-Aufgabenhilfe (Abschnitt 7) sind freiwillig.</p>
<h3>3. Hosting und Server-Logfiles</h3>
<p>Die Webseite wird bei Render Services, Inc. (USA) gehostet. Beim Aufruf verarbeitet der Server technisch notwendige Daten, insbesondere deine IP-Adresse, Datum und Uhrzeit, die aufgerufene Datei und Angaben zu Browser und Gerät, um die Seite auszuliefern und ihre Sicherheit und Stabilität zu gewährleisten. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an einem sicheren und funktionsfähigen Betrieb). Mit dem Anbieter besteht ein Vertrag zur Auftragsverarbeitung nach Art. 28 DSGVO. Die Logdaten werden vom Anbieter nur kurzzeitig gespeichert.</p>
<h3>4. Keine Cookies, kein Tracking, lokaler Speicher</h3>
<p>Das Regelheft setzt keine Cookies und nutzt keine Analyse-, Werbe- oder Tracking-Dienste. Es werden keine externen Schriftarten, Skripte oder Karten nachgeladen. Wenn du dich anmeldest, wird in deinem Browser (localStorage) ein Anmelde-Token gespeichert (Name „regelheft-token“), damit du angemeldet bleibst. Dieser Zugriff auf dein Endgerät ist für den von dir ausdrücklich gewünschten Dienst (die Anmeldung) unbedingt erforderlich (§ 25 Abs. 2 Nr. 2 TDDDG), eine Einwilligung ist daher nicht nötig. Wenn du über den Schalter in der Kopfzeile zwischen hellem und dunklem Design wechselst, speichert dein Browser deine Wahl (localStorage, Name „regelheft-theme“). Das geschieht nur auf deinen Wunsch und dient allein dazu, dein Design beim nächsten Besuch wiederherzustellen; es wird nichts an den Server gesendet. Das Token ist 30 Tage gültig und wird beim Abmelden oder Löschen des Kontos entfernt.</p>
<h3>5. Statistik: Suchbegriffe und geöffnete Regeln</h3>
<p>Wenn du im Regelheft nach einem Begriff suchst oder eine Regel öffnest, werden der Suchbegriff bzw. die Kennung der Regel mit Zeitpunkt ohne Bezug zu dir gespeichert (ohne IP-Adresse, Benutzername oder Gerätekennung). So sehe ich, welche Regeln oft gesucht werden, und kann das Regelheft verbessern. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO. Bitte gib in die Suche keine personenbezogenen Daten ein. Diese Statistikdaten werden nach 12 Monaten gelöscht. Deine IP-Adresse wird dabei nur kurzzeitig im Arbeitsspeicher zur Begrenzung von Missbrauch (Anfragelimit) verarbeitet und nicht gespeichert.</p>
<h3>6. Konto: Registrierung und Anmeldung</h3>
<p>Für die KI-Aufgabenhilfe brauchst du ein Konto. Dabei werden verarbeitet: Benutzername, Passwort (nur als kryptografischer Hash mit Salt, nie im Klartext), Zeitpunkt der Registrierung und Sitzungsdaten (Anmelde-Token nur als Hash, Ablauf nach 30 Tagen). Ein eventuell eingegebener Einladungscode wird nur zur Prüfung verwendet und nicht gespeichert. Zweck ist die Bereitstellung des Kontos und der KI-Funktion sowie der Schutz vor Missbrauch. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO (Nutzungsverhältnis). Die Daten werden gespeichert, bis du dein Konto löschst. Das geht jederzeit selbst auf der Seite „Mein Konto“ („Konto löschen“). Bitte wähle einen Benutzernamen, der keinen Rückschluss auf deinen echten Namen zulässt. Wenn du Regeln mit dem Stern-Symbol in deiner Merkliste speicherst, wird die Kennung der jeweiligen Regel mit deinem Konto gespeichert, bis du den Eintrag entfernst oder dein Konto löschst. Außerdem werden die Kennungen der zuletzt geöffneten Regeln (maximal 15) mit deinem Konto gespeichert, damit du sie unter „Zuletzt“ wiederfindest. Diesen Verlauf kannst du auf der Seite „Mein Konto“ jederzeit löschen. Notizen, die du zu Regeln schreibst (bis 2.000 Zeichen je Regel), werden mit deinem Konto gespeichert und sind für andere Nutzer nicht sichtbar; leerst du das Textfeld, wird die Notiz gelöscht. Im Übungsmodus wird dein Lernstand pro Regel (Stufe 0 bis 3) mit deinem Konto gespeichert; du kannst ihn dort jederzeit zurücksetzen.</p>
${(CFG().auth.requireEmail || CFG().auth.mailActive) ? `<h3>6a. E-Mail-Adresse und Bestätigungscode</h3>
<p>Bei der Registrierung (und für bestehende Konten beim nächsten Besuch) fragen wir deine E-Mail-Adresse ab. Sie dient der Sicherheit deines Kontos${CFG().billing.enabled ? ', der Zusendung von Bestätigungen (z. B. zur Kündigung) und dem Zuordnen von Zahlungen' : ''}. Zur Bestätigung senden wir dir einen sechsstelligen Code per E-Mail; dafür wird deine Adresse an einen E-Mail-Dienstleister übermittelt (${CFG().auth.mailProvider === 'Resend' ? 'Resend, Inc., USA' : CFG().auth.mailProvider === 'Brevo' ? 'Brevo, Frankreich' : 'der eingesetzte E-Mail-Dienstleister'}). Der Code wird nur als Hash gespeichert und ist 15 Minuten gültig. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO (Betrieb deines Kontos). Die Adresse wird gespeichert, bis du sie änderst oder dein Konto löschst.</p>` : ''}
${CFG().auth.google ? `<h3>6b. Anmeldung mit Google</h3>
<p>Wenn du auf „Mit Google anmelden“ klickst, wirst du zu Google weitergeleitet (Google Ireland Limited). Erst ab diesem Klick werden Daten an Google übermittelt; beim bloßen Anzeigen der Seite lädt nichts von Google. Nach der Anmeldung erhalten wir von Google deine E-Mail-Adresse und eine Google-Kennung (nicht dein Passwort). Damit legen wir dein Konto an oder verknüpfen es mit einem bestehenden Konto mit derselben bestätigten E-Mail-Adresse. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO. Wenn du Google nicht nutzen möchtest, kannst du dich mit Benutzername und Passwort registrieren.</p>` : ''}
${CFG().billing.enabled ? `<h3>6c. Pro-Abo und Zahlung</h3>
<p>Die Zahlungsabwicklung und Rechnungsstellung für Regelheft Pro erfolgt über ${esc(LEGAL.company)}. Für den Kauf wirst du zu unserem Zahlungsdienstleister Stripe (Stripe Payments Europe, Ltd., Irland; Konzern: Stripe, Inc., USA) weitergeleitet. Auf deiner Kreditkarten- bzw. Kontoabrechnung erscheint die Belastung in der Regel unter „Stripe“. Deine Zahlungsdaten (z. B. Karten- oder Kontonummer) gibst du direkt bei Stripe ein; wir sehen sie nicht und speichern sie nicht. Wir speichern nur: die Stripe-Kunden- und Abo-Kennung, Tarif, Status und Laufzeit des Abos sowie den Zeitpunkt, zu dem du die Hinweise zum Kauf (Alter/Zustimmung, sofortiger Beginn und Widerrufsrecht) bestätigt hast. Rechtsgrundlagen sind Art. 6 Abs. 1 lit. b DSGVO (Vertrag) und lit. c DSGVO (steuer- und handelsrechtliche Aufbewahrungspflichten). Zahlungs- und Rechnungsdaten unterliegen gesetzlichen Aufbewahrungsfristen von bis zu zehn Jahren (u. a. Art. 958f des schweizerischen Obligationenrechts und, soweit anwendbar, § 147 AO, § 257 HGB). Eine Übermittlung in die USA stützt sich auf die Standardvertragsklauseln bzw. das EU-US Data Privacy Framework.</p>` : ''}
<h3>7. KI-Aufgabenhilfe</h3>
<p>Wenn du die KI-Aufgabenhilfe nutzt, werden dein Foto (verkleinert) und/oder dein Text, deine Antworten auf Rückfragen sowie eine Liste der Regel-Titel des Regelhefts an einen KI-Anbieter gesendet, damit dieser passende Regeln vorschlagen kann. Das sind je nach Einstellung ScherAI (Backend gehostet bei Hugging Face, Inc., USA), Google (Gemini, Google Ireland Limited bzw. Google LLC) und als Ausweichlösung Groq, Inc. (USA). Die Anbieter verarbeiten die Inhalte nach ihren eigenen Bedingungen. Bei kostenlosen Angeboten kann ein Anbieter eingesendete Inhalte zur Verbesserung seiner Dienste verwenden und von Menschen prüfen lassen.</p>
<p><b>Deshalb: Fotografiere nur die Aufgabe. Lade keine Fotos von Personen und keine Namen, Adressen, Gesundheitsdaten oder sonstigen persönlichen oder vertraulichen Angaben hoch.</b> Lade nur Aufgaben hoch, die du zum Lernen verwenden darfst.</p>
<p>Gespeichert werden in meiner Datenbank (Cloudflare, Abschnitt 8): Text deiner Anfrage, die Antworten der KI, der von der KI vergebene Chat-Titel, der Modellname, der Zeitpunkt und eine kleine Vorschau deines Fotos (höchstens 360 Pixel). Das vollständige Foto wird nicht gespeichert. Die Speicherung dient dazu, dass du deine Chats später wieder ansehen kannst (Art. 6 Abs. 1 lit. b DSGVO). Als Betreiber kann ich gespeicherte Chats einsehen, um Missbrauch zu verhindern, Fehler zu finden und das Angebot zu verbessern (Art. 6 Abs. 1 lit. f DSGVO). Du kannst einzelne Chats jederzeit löschen; mit dem Konto werden alle Chats gelöscht.</p>
<p>Die Antworten der KI werden automatisch erzeugt, können falsch sein und haben keine rechtliche oder ähnlich erhebliche Wirkung für dich. Eine automatisierte Entscheidungsfindung im Sinne des Art. 22 DSGVO findet nicht statt.</p>
<h3>8. Backend und Datenbank</h3>
<p>Konto, Chats, Statistik und die Weiterleitung an die KI laufen über Cloudflare, Inc. (USA; Cloudflare Workers und D1-Datenbank). Cloudflare verarbeitet dabei technisch bedingt auch deine IP-Adresse (z. B. in Server-Logs und zur Abwehr von Angriffen). Mit dem Anbieter besteht ein Vertrag zur Auftragsverarbeitung nach Art. 28 DSGVO.</p>
<h3>9. Empfänger</h3>
<p>Empfänger deiner Daten sind ${esc(LEGAL.company)} als Anbieter und die genannten Dienstleister: Render (Hosting), Cloudflare (Backend, Datenbank), ScherAI, Google und Groq (KI-Verarbeitung, nur bei Nutzung der KI)${CFG().billing.enabled ? ', Stripe (Zahlungsabwicklung, nur beim Kauf von Pro)' : ''}${CFG().auth.mailActive ? ', ein E-Mail-Dienstleister (Versand von Bestätigungscodes)' : ''}${CFG().auth.google ? ' sowie Google (nur bei Anmeldung mit Google)' : ''} Eine darüber hinausgehende Weitergabe erfolgt nicht, außer ich bin gesetzlich dazu verpflichtet.</p>
<h3>10. Übermittlung in Drittländer</h3>
<p>Die Anbieter haben ihren Sitz in den USA oder verarbeiten Daten dort. Die Übermittlung stützt sich auf den Angemessenheitsbeschluss der EU-Kommission zum EU-US Data Privacy Framework, soweit der Anbieter dafür zertifiziert ist, im Übrigen auf EU-Standardvertragsklauseln (Art. 46 Abs. 2 lit. c DSGVO). Der Anbieter ${esc(LEGAL.company)} hat seinen Sitz in der Schweiz; für die Schweiz besteht ein Angemessenheitsbeschluss der EU-Kommission. Eine Kopie der Garantien erhältst du auf Anfrage.</p>
<h3>11. Speicherdauer</h3>
<ul>
<li>Server-Logfiles: kurzzeitig beim Hoster</li>
<li>Statistik (Suchbegriffe, geöffnete Regeln): 12 Monate</li>
<li>Konto: bis zur Löschung des Kontos</li>
<li>Anmelde-Sitzung: 30 Tage bzw. bis zum Abmelden</li>
<li>Chats: bis du den Chat oder das Konto löschst</li>
<li>Merkliste: bis du den Eintrag oder das Konto löschst</li>
<li>Zuletzt geöffnet: höchstens 15 Einträge, bis du den Verlauf oder das Konto löschst</li>
<li>Notizen und Lernstand: bis du sie oder das Konto löschst</li>
<li>E-Mail-Adresse: bis du sie änderst oder das Konto löschst</li>${CFG().billing.enabled ? '<li>Abo-Daten: bis du das Konto löschst; Zahlungs- und Rechnungsdaten (bei Stripe und in der Buchhaltung): gesetzliche Aufbewahrungsfrist, bis zu zehn Jahre</li>' : ''}
</ul>
<h3>12. Deine Rechte</h3>
<p>Du hast das Recht auf Auskunft (Art. 15), Berichtigung (Art. 16), Löschung (Art. 17), Einschränkung der Verarbeitung (Art. 18), Datenübertragbarkeit (Art. 20) und Widerspruch gegen Verarbeitungen auf Grundlage berechtigter Interessen (Art. 21 DSGVO). Schreibe dazu eine E-Mail an die oben genannte Adresse. Konto und Chats kannst du auch selbst löschen. Außerdem hast du das Recht, dich bei einer Datenschutzaufsichtsbehörde zu beschweren, zum Beispiel bei: ${v('authority')}. Zuständig für den Anbieter in der Schweiz ist der Eidgenössische Datenschutz- und Öffentlichkeitsbeauftragte (EDÖB), Feldeggweg 1, 3003 Bern.</p>
<h3>13. Mindestalter und Jugendliche</h3>
<p>Ein Konto kannst du ab 16 Jahren anlegen. Jüngere Nutzerinnen und Nutzer brauchen die Zustimmung ihrer Erziehungsberechtigten. Das Regelheft selbst kann jeder ohne Konto nutzen.${CFG().billing.enabled ? ' Der Kauf von Regelheft Pro ist nur Volljährigen oder mit Zustimmung der Erziehungsberechtigten gestattet.' : ''}</p>
<h3>14. Datensicherheit</h3>
<p>Die Übertragung erfolgt verschlüsselt (HTTPS). Passwörter und Anmelde-Token werden nur als Hash gespeichert. Der Zugriff auf gespeicherte Chats und die Statistik ist auf mich als Betreiber beschränkt und durch Anmeldung geschützt.</p>
<h3>15. Erforderlichkeit der Angaben</h3>
<p>Die Nutzung des Regelhefts ist ohne Angabe personenbezogener Daten möglich. Für das Konto und die KI-Aufgabenhilfe sind Benutzername und Passwort erforderlich, sonst kann das Konto nicht angelegt werden.</p>
${hasExt ? '<h3>16. Externe Links (' + extNames + ')</h3><p>Im Fußbereich der Seiten befinden sich Links zu externen Angeboten (' + extNames + '). Beim Anklicken verlässt du das Regelheft. Ab dann gelten die Datenschutzbestimmungen des jeweiligen Anbieters. Allein durch das Anzeigen der Links werden keine Daten an diese Anbieter übertragen.</p>' : ''}
<h3>${hasExt ? '17' : '16'}. Änderungen</h3>
<p>Ich passe diese Erklärung an, wenn sich das Angebot oder die Rechtslage ändert. Es gilt die jeweils hier veröffentlichte Fassung.</p>`;


  const agb = () => `<p><b>Allgemeine Geschäftsbedingungen (AGB) für „Regelheft Pro“</b><br>Stand: ${esc(LEGAL.stand || '')}</p>
<h3>1. Geltungsbereich und Anbieter</h3>
<p>Diese AGB gelten für die entgeltliche Nutzung von „Regelheft Pro“ auf dieser Webseite. Anbieter und Vertragspartner ist ${addr()}<br>${contact()}. Das Regelheft wird unter der Marke „${esc(LEGAL.brand)}“ angeboten. Es ist ein Lernangebot und richtet sich an Schülerinnen und Schüler. Die Grundfunktionen (Regeln ansehen und suchen) sind kostenlos.</p>
<h3>2. Vertragsgegenstand</h3>
<p>Regelheft Pro schaltet für die Laufzeit des Abos Zusatzfunktionen frei. Aktuell sind das: ${CFG().billing.proFeatures.practice ? 'der Übungsmodus mit Karteikarten, ' : ''}${CFG().billing.proFeatures.notes ? 'eigene Notizen zu Regeln, ' : ''}die KI-Aufgabenhilfe ohne Tageslimit. Der Umfang der kostenlosen Version, insbesondere das Tageslimit der KI-Chats (derzeit ${CFG().billing.freeAiPerDay} pro Tag), kann sich ändern. Die KI-Antworten können Fehler enthalten; es wird kein bestimmter Lernerfolg geschuldet.</p>
<h3>3. Vertragsschluss</h3>
<p>Für den Kauf ist ein Konto mit bestätigter E-Mail-Adresse nötig. Der Vertrag kommt zustande, wenn du auf der Pro-Seite den Tarif wählst, die Hinweise bestätigst, auf „Zahlungspflichtig bestellen“ klickst und die Zahlung bei unserem Zahlungsdienstleister Stripe abschließt. Diese AGB kannst du jederzeit über „AGB“ im Seitenfuß aufrufen und speichern. Eine Bestätigung erhältst du von Stripe per E-Mail.</p>
<h3>4. Preise und Zahlung</h3>
<p>Es gelten die auf der Pro-Seite vor der Bestellung angezeigten Preise. ${CFG().billing.kleinunternehmer ? 'Gemäß § 19 UStG wird keine Umsatzsteuer berechnet.' : 'Die Preise enthalten die gesetzliche Umsatzsteuer.'} Die Zahlung erfolgt über Stripe (z. B. Karte oder SEPA-Lastschrift) im Voraus für den jeweiligen Abrechnungszeitraum. ${payNote()} Bei fehlgeschlagener Zahlung kann Regelheft Pro gesperrt werden.</p>
<h3>5. Laufzeit und Kündigung</h3>
<p>Das Abo läuft für den gewählten Zeitraum (monatlich oder jährlich) und verlängert sich automatisch um denselben Zeitraum, wenn es nicht gekündigt wird. Du kannst jederzeit mit Wirkung zum Ende des laufenden Zeitraums kündigen: unter „Mein Konto“ über die Schaltfläche „Abo kündigen“ oder per E-Mail an ${v('email')}. Nach der Kündigung kannst du Pro bis zum Ende des bezahlten Zeitraums weiter nutzen. Das Recht zur außerordentlichen Kündigung bleibt unberührt.</p>
<h3>6. Widerrufsrecht</h3>
<p>Als Verbraucher hast du ein gesetzliches Widerrufsrecht. Einzelheiten stehen in der <a href="widerruf.html">Widerrufsbelehrung</a>.</p>
<h3>7. Minderjährige</h3>
<p>Der Kauf von Regelheft Pro ist nur Volljährigen oder mit Zustimmung der gesetzlichen Vertreter erlaubt. Mit der Bestellung bestätigst du das.</p>
<h3>8. Nutzungsrechte und Pflichten</h3>
<p>Du erhältst ein einfaches, nicht übertragbares Recht, Regelheft Pro für eigene Lernzwecke zu nutzen. Konten und Zugänge dürfen nicht weitergegeben werden. Inhalte des Regelhefts dürfen nicht systematisch kopiert oder weiterverkauft werden.</p>
<h3>9. Verfügbarkeit</h3>
<p>Wir bemühen uns um eine hohe Erreichbarkeit, schulden aber keine ununterbrochene Verfügbarkeit. Wartungsarbeiten und Störungen (auch bei eingesetzten Drittanbietern wie KI-Diensten) sind möglich.</p>
<h3>10. Haftung</h3>
<p>Wir haften unbeschränkt bei Vorsatz und grober Fahrlässigkeit, bei Verletzung von Leben, Körper oder Gesundheit sowie nach dem Produkthaftungsgesetz. Bei leicht fahrlässiger Verletzung wesentlicher Vertragspflichten ist die Haftung auf den vorhersehbaren, vertragstypischen Schaden begrenzt. Im Übrigen ist die Haftung ausgeschlossen. Die Haftung für die Richtigkeit von KI-Antworten ist ausgeschlossen, soweit gesetzlich zulässig.</p>
<h3>11. Datenschutz</h3>
<p>Informationen zur Verarbeitung deiner Daten findest du in der <a href="datenschutz.html">Datenschutzerklärung</a>.</p>
<h3>12. Schlussbestimmungen</h3>
<p>Es gilt deutsches Recht; bei Verbrauchern gilt dies nur, soweit dadurch nicht zwingende Verbraucherschutzvorschriften des Staates entzogen werden, in dem du deinen gewöhnlichen Aufenthalt hast. Sollten einzelne Bestimmungen unwirksam sein, bleibt der Rest wirksam.</p>`;
  const widerruf = () => `<p><b>Widerrufsbelehrung</b><br>Stand: ${esc(LEGAL.stand || '')}</p>
<h3>Widerrufsrecht</h3>
<p>Du hast das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen. Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag des Vertragsabschlusses.</p>
<p>Um dein Widerrufsrecht auszuüben, musst du uns (${addr().replace(/<br>/g, ', ')}; ${LEGAL.email ? 'E-Mail: ' + esc(LEGAL.email) : ''}${LEGAL.phone ? '; Telefon: ' + esc(LEGAL.phone) : ''}) mittels einer eindeutigen Erklärung (z. B. ein mit der Post versandter Brief oder eine E-Mail) über deinen Entschluss, diesen Vertrag zu widerrufen, informieren. Du kannst dafür das untenstehende Muster-Widerrufsformular verwenden, das jedoch nicht vorgeschrieben ist. Zur Wahrung der Widerrufsfrist reicht es aus, dass du die Mitteilung über die Ausübung des Widerrufsrechts vor Ablauf der Widerrufsfrist absendest.</p>
<h3>Folgen des Widerrufs</h3>
<p>Wenn du diesen Vertrag widerrufst, haben wir dir alle Zahlungen, die wir von dir erhalten haben, unverzüglich und spätestens binnen vierzehn Tagen ab dem Tag zurückzuzahlen, an dem die Mitteilung über deinen Widerruf dieses Vertrags bei uns eingegangen ist. Für diese Rückzahlung verwenden wir dasselbe Zahlungsmittel, das du bei der ursprünglichen Transaktion eingesetzt hast; in keinem Fall werden dir wegen dieser Rückzahlung Entgelte berechnet.</p>
<p>Hast du verlangt, dass die Dienstleistung während der Widerrufsfrist beginnen soll, so hast du uns einen angemessenen Betrag zu zahlen, der dem Anteil der bis zu dem Zeitpunkt, zu dem du uns von der Ausübung des Widerrufsrechts hinsichtlich dieses Vertrags unterrichtest, bereits erbrachten Dienstleistungen im Vergleich zum Gesamtumfang der im Vertrag vorgesehenen Dienstleistungen entspricht.</p>
<h3>Vorzeitiges Erlöschen des Widerrufsrechts</h3>
<p>Das Widerrufsrecht erlischt bei einem Vertrag zur Erbringung von Dienstleistungen, wenn wir die Dienstleistung vollständig erbracht haben und mit der Ausführung der Dienstleistung erst begonnen haben, nachdem du dazu deine ausdrückliche Zustimmung gegeben hast und gleichzeitig deine Kenntnis davon bestätigt hast, dass du dein Widerrufsrecht bei vollständiger Vertragserfüllung durch uns verlierst.</p>
<h3>Muster-Widerrufsformular</h3>
<p>(Wenn du den Vertrag widerrufen willst, fülle bitte dieses Formular aus und sende es zurück.)<br>
– An ${addr().replace(/<br>/g, ', ')}${LEGAL.email ? ', E-Mail: ' + esc(LEGAL.email) : ''}:<br>
– Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen Vertrag über die Erbringung der folgenden Dienstleistung: Regelheft Pro<br>
– Bestellt am (*) / erhalten am (*)<br>
– Name des/der Verbraucher(s)<br>
– Anschrift des/der Verbraucher(s)<br>
– Unterschrift des/der Verbraucher(s) (nur bei Mitteilung auf Papier)<br>
– Datum<br>
(*) Unzutreffendes streichen.</p>`;
  const target = document.getElementById('legalBody');
  target.innerHTML = ({impressum, datenschutz, agb, widerruf})[which]();
  if(!renderLegal._h){ renderLegal._h = true; RH.onConfig(() => renderLegal(which)); }
}
