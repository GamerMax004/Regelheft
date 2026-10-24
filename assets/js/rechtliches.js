/* ============================================================
   Impressum & Datenschutzerklärung – Texte
   Deine Angaben (Name, Adresse, E-Mail …) stehen in config.js unter LEGAL.
   Die Texte werden daraus erzeugt: renderLegal('impressum') / renderLegal('datenschutz')
   ============================================================ */
function renderLegal(which){
  const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const v = k => LEGAL[k] ? esc(LEGAL[k]) : '<mark>[BITTE EINTRAGEN: ' + k + ']</mark>';
  const addr = () => v('name') + '<br>' + v('street') + '<br>' + v('city');
  const contact = () => 'E-Mail: ' + v('email') + (LEGAL.phone ? '<br>Telefon: ' + esc(LEGAL.phone) : '<br><mark>[BITTE EINTRAGEN: phone – oder ein anderes zweites Kontaktmittel]</mark>');
  const ext = [SOCIAL.discord && 'Discord', SOCIAL.instagram && 'Instagram'].filter(Boolean);
  const hasExt = ext.length > 0, extNames = ext.join(', ');

  const impressum = () => `
<h3>Angaben gemäß § 5 DDG</h3>
<p>${addr()}</p>
<p>Angebot: „Regelheft Mathematik“ (Gölitzer Development), ein privates, nicht kommerzielles Lernangebot.</p>
<h3>Kontakt</h3>
<p>${contact()}</p>
<h3>Verantwortlich für den Inhalt (§ 18 Abs. 2 MStV)</h3>
<p>${addr()}</p>
<h3>Hinweis zu KI-Funktionen</h3>
<p>Die Antworten der KI-Aufgabenhilfe werden automatisch von einem KI-System erzeugt. Sie können Fehler enthalten und ersetzen weder Unterricht noch Schulbuch oder Lehrkraft. Für die Richtigkeit wird keine Gewähr übernommen.</p>
<h3>Haftung für Inhalte</h3>
<p>Als Diensteanbieter bin ich nach den allgemeinen Gesetzen für eigene Inhalte verantwortlich. Nach den §§ 8 bis 10 DDG bin ich nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen. Verpflichtungen zur Entfernung oder Sperrung von Informationen nach den allgemeinen Gesetzen bleiben unberührt. Bei Bekanntwerden entsprechender Rechtsverletzungen entferne ich die betreffenden Inhalte umgehend.</p>
${hasExt ? '<h3>Haftung für Links</h3><p>Im Fußbereich der Seiten befinden sich Links zu externen Angeboten (' + extNames + '). Auf deren Inhalte habe ich keinen Einfluss und übernehme dafür keine Gewähr. Für die Inhalte ist der jeweilige Betreiber verantwortlich.</p>' : ''}
<h3>Urheberrecht</h3>
<p>Die Inhalte dieses Angebots (Texte, Formeln, Grafiken, Zusammenstellung) wurden vom Betreiber erstellt und unterliegen dem deutschen Urheberrecht. Eine Vervielfältigung oder Verwendung außerhalb der gesetzlichen Schranken (z. B. privates Lernen) bedarf der vorherigen Zustimmung des Betreibers. Wer Rechte an Inhalten verletzt sieht, kann sich unter der oben genannten E-Mail-Adresse melden.</p>
<h3>Verbraucherstreitbeilegung</h3>
<p>Ich bin weder bereit noch verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen (§ 36 VSBG).</p>`;

  const datenschutz = () => `
<p>Stand: ${esc(LEGAL.stand)}. Diese Erklärung informiert dich nach Art. 13 und 14 DSGVO darüber, welche personenbezogenen Daten beim Besuch und bei der Nutzung des Regelhefts verarbeitet werden.</p>
<h3>1. Verantwortlicher</h3>
<p>${addr()}<br>${contact()}</p>
<p>Ein Datenschutzbeauftragter ist nicht benannt, da dafür keine gesetzliche Pflicht besteht.</p>
<h3>2. Überblick</h3>
<p>Das Regelheft kann ohne Konto genutzt werden. Dabei werden nur technisch notwendige Daten (Abschnitt 3) und eine anonyme Statistik (Abschnitt 5) verarbeitet. Ein Konto (Abschnitt 6) und die KI-Aufgabenhilfe (Abschnitt 7) sind freiwillig.</p>
<h3>3. Hosting und Server-Logfiles</h3>
<p>Die Webseite wird bei Render Services, Inc. (USA) gehostet. Beim Aufruf verarbeitet der Server technisch notwendige Daten, insbesondere deine IP-Adresse, Datum und Uhrzeit, die aufgerufene Datei und Angaben zu Browser und Gerät, um die Seite auszuliefern und ihre Sicherheit und Stabilität zu gewährleisten. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an einem sicheren und funktionsfähigen Betrieb). Mit dem Anbieter besteht ein Vertrag zur Auftragsverarbeitung nach Art. 28 DSGVO. Die Logdaten werden vom Anbieter nur kurzzeitig gespeichert.</p>
<h3>4. Keine Cookies, kein Tracking, lokaler Speicher</h3>
<p>Das Regelheft setzt keine Cookies und nutzt keine Analyse-, Werbe- oder Tracking-Dienste. Es werden keine externen Schriftarten, Skripte oder Karten nachgeladen. Wenn du dich anmeldest, wird in deinem Browser (localStorage) ein Anmelde-Token gespeichert (Name „regelheft-token“), damit du angemeldet bleibst. Dieser Zugriff auf dein Endgerät ist für den von dir ausdrücklich gewünschten Dienst (die Anmeldung) unbedingt erforderlich (§ 25 Abs. 2 Nr. 2 TDDDG), eine Einwilligung ist daher nicht nötig. Das Token ist 30 Tage gültig und wird beim Abmelden oder Löschen des Kontos entfernt.</p>
<h3>5. Statistik: Suchbegriffe und geöffnete Regeln</h3>
<p>Wenn du im Regelheft nach einem Begriff suchst oder eine Regel öffnest, werden der Suchbegriff bzw. die Kennung der Regel mit Zeitpunkt ohne Bezug zu dir gespeichert (ohne IP-Adresse, Benutzername oder Gerätekennung). So sehe ich, welche Regeln oft gesucht werden, und kann das Regelheft verbessern. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO. Bitte gib in die Suche keine personenbezogenen Daten ein. Diese Statistikdaten werden nach 12 Monaten gelöscht. Deine IP-Adresse wird dabei nur kurzzeitig im Arbeitsspeicher zur Begrenzung von Missbrauch (Anfragelimit) verarbeitet und nicht gespeichert.</p>
<h3>6. Konto: Registrierung und Anmeldung</h3>
<p>Für die KI-Aufgabenhilfe brauchst du ein Konto. Dabei werden verarbeitet: Benutzername, Passwort (nur als kryptografischer Hash mit Salt, nie im Klartext), Zeitpunkt der Registrierung und Sitzungsdaten (Anmelde-Token nur als Hash, Ablauf nach 30 Tagen). Ein eventuell eingegebener Einladungscode wird nur zur Prüfung verwendet und nicht gespeichert. Zweck ist die Bereitstellung des Kontos und der KI-Funktion sowie der Schutz vor Missbrauch. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO (Nutzungsverhältnis). Die Daten werden gespeichert, bis du dein Konto löschst. Das geht jederzeit selbst auf der Seite „Mein Konto“ („Konto löschen“). Bitte wähle einen Benutzernamen, der keinen Rückschluss auf deinen echten Namen zulässt. Wenn du Regeln mit dem Stern-Symbol in deiner Merkliste speicherst, wird die Kennung der jeweiligen Regel mit deinem Konto gespeichert, bis du den Eintrag entfernst oder dein Konto löschst. Außerdem werden die Kennungen der zuletzt geöffneten Regeln (maximal 15) mit deinem Konto gespeichert, damit du sie unter „Zuletzt“ wiederfindest. Diesen Verlauf kannst du auf der Seite „Mein Konto“ jederzeit löschen.</p>
<h3>7. KI-Aufgabenhilfe</h3>
<p>Wenn du die KI-Aufgabenhilfe nutzt, werden dein Foto (verkleinert) und/oder dein Text, deine Antworten auf Rückfragen sowie eine Liste der Regel-Titel des Regelhefts an einen KI-Anbieter gesendet, damit dieser passende Regeln vorschlagen kann. Das sind Google (Gemini, Google Ireland Limited bzw. Google LLC) und als Ausweichlösung Groq, Inc. (USA). Die Anbieter verarbeiten die Inhalte nach ihren eigenen Bedingungen. Bei kostenlosen Angeboten kann ein Anbieter eingesendete Inhalte zur Verbesserung seiner Dienste verwenden und von Menschen prüfen lassen.</p>
<p><b>Deshalb: Fotografiere nur die Aufgabe. Lade keine Fotos von Personen und keine Namen, Adressen, Gesundheitsdaten oder sonstigen persönlichen oder vertraulichen Angaben hoch.</b> Lade nur Aufgaben hoch, die du zum Lernen verwenden darfst.</p>
<p>Gespeichert werden in meiner Datenbank (Cloudflare, Abschnitt 8): Text deiner Anfrage, die Antworten der KI, der von der KI vergebene Chat-Titel, der Modellname, der Zeitpunkt und eine kleine Vorschau deines Fotos (höchstens 360 Pixel). Das vollständige Foto wird nicht gespeichert. Die Speicherung dient dazu, dass du deine Chats später wieder ansehen kannst (Art. 6 Abs. 1 lit. b DSGVO). Als Betreiber kann ich gespeicherte Chats einsehen, um Missbrauch zu verhindern, Fehler zu finden und das Angebot zu verbessern (Art. 6 Abs. 1 lit. f DSGVO). Du kannst einzelne Chats jederzeit löschen; mit dem Konto werden alle Chats gelöscht.</p>
<p>Die Antworten der KI werden automatisch erzeugt, können falsch sein und haben keine rechtliche oder ähnlich erhebliche Wirkung für dich. Eine automatisierte Entscheidungsfindung im Sinne des Art. 22 DSGVO findet nicht statt.</p>
<h3>8. Backend und Datenbank</h3>
<p>Konto, Chats, Statistik und die Weiterleitung an die KI laufen über Cloudflare, Inc. (USA; Cloudflare Workers und D1-Datenbank). Cloudflare verarbeitet dabei technisch bedingt auch deine IP-Adresse (z. B. in Server-Logs und zur Abwehr von Angriffen). Mit dem Anbieter besteht ein Vertrag zur Auftragsverarbeitung nach Art. 28 DSGVO.</p>
<h3>9. Empfänger</h3>
<p>Empfänger deiner Daten sind die genannten Dienstleister: Render (Hosting), Cloudflare (Backend, Datenbank), Google und Groq (KI-Verarbeitung, nur bei Nutzung der KI). Eine darüber hinausgehende Weitergabe erfolgt nicht, außer ich bin gesetzlich dazu verpflichtet.</p>
<h3>10. Übermittlung in Drittländer</h3>
<p>Die Anbieter haben ihren Sitz in den USA oder verarbeiten Daten dort. Die Übermittlung stützt sich auf den Angemessenheitsbeschluss der EU-Kommission zum EU-US Data Privacy Framework, soweit der Anbieter dafür zertifiziert ist, im Übrigen auf EU-Standardvertragsklauseln (Art. 46 Abs. 2 lit. c DSGVO). Eine Kopie der Garantien erhältst du auf Anfrage.</p>
<h3>11. Speicherdauer</h3>
<ul>
<li>Server-Logfiles: kurzzeitig beim Hoster</li>
<li>Statistik (Suchbegriffe, geöffnete Regeln): 12 Monate</li>
<li>Konto: bis zur Löschung des Kontos</li>
<li>Anmelde-Sitzung: 30 Tage bzw. bis zum Abmelden</li>
<li>Chats: bis du den Chat oder das Konto löschst</li>
<li>Merkliste: bis du den Eintrag oder das Konto löschst</li>
<li>Zuletzt geöffnet: höchstens 15 Einträge, bis du den Verlauf oder das Konto löschst</li>
</ul>
<h3>12. Deine Rechte</h3>
<p>Du hast das Recht auf Auskunft (Art. 15), Berichtigung (Art. 16), Löschung (Art. 17), Einschränkung der Verarbeitung (Art. 18), Datenübertragbarkeit (Art. 20) und Widerspruch gegen Verarbeitungen auf Grundlage berechtigter Interessen (Art. 21 DSGVO). Schreibe dazu eine E-Mail an die oben genannte Adresse. Konto und Chats kannst du auch selbst löschen. Außerdem hast du das Recht, dich bei einer Datenschutzaufsichtsbehörde zu beschweren, zum Beispiel bei: ${v('authority')}.</p>
<h3>13. Mindestalter und Jugendliche</h3>
<p>Ein Konto kannst du ab 16 Jahren anlegen. Jüngere Nutzerinnen und Nutzer brauchen die Zustimmung ihrer Erziehungsberechtigten. Das Regelheft selbst kann jeder ohne Konto nutzen.</p>
<h3>14. Datensicherheit</h3>
<p>Die Übertragung erfolgt verschlüsselt (HTTPS). Passwörter und Anmelde-Token werden nur als Hash gespeichert. Der Zugriff auf gespeicherte Chats und die Statistik ist auf mich als Betreiber beschränkt und durch Anmeldung geschützt.</p>
<h3>15. Erforderlichkeit der Angaben</h3>
<p>Die Nutzung des Regelhefts ist ohne Angabe personenbezogener Daten möglich. Für das Konto und die KI-Aufgabenhilfe sind Benutzername und Passwort erforderlich, sonst kann das Konto nicht angelegt werden.</p>
${hasExt ? '<h3>16. Externe Links (' + extNames + ')</h3><p>Im Fußbereich der Seiten befinden sich Links zu externen Angeboten (' + extNames + '). Beim Anklicken verlässt du das Regelheft. Ab dann gelten die Datenschutzbestimmungen des jeweiligen Anbieters. Allein durch das Anzeigen der Links werden keine Daten an diese Anbieter übertragen.</p>' : ''}
<h3>${hasExt ? '17' : '16'}. Änderungen</h3>
<p>Ich passe diese Erklärung an, wenn sich das Angebot oder die Rechtslage ändert. Es gilt die jeweils hier veröffentlichte Fassung.</p>`;


  const target = document.getElementById('legalBody');
  target.innerHTML = which === 'impressum' ? impressum() : datenschutz();
}
