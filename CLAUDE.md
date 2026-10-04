# Abnahmeprotokoll.ch

Kostenloses Abnahmeprotokoll für die Wohnungsabnahme in der Schweiz. Antritt (Einzug) und Rückgabe (Auszug), Schritt für Schritt auf dem Handy, mit Fotos, Unterschriften und PDF. Ohne Konto, alle Daten bleiben auf dem Gerät.

Arbeitsname und Domain sind noch nicht final (`abnahmeprotokoll.ch` ist Platzhalter). Name und URL stehen als Konstanten `APP_NAME` und `SITE` oben im Script von `app.html` und in den Meta-Tags von `index.html`. Bei einer Umbenennung überall ersetzen.

## Ziel dieser Phase

Freie Version launchen, echte Nutzung und Feedback sammeln. Keine Monetarisierung im Produkt. Einzige Business-Schnittstelle: Kontaktformular «Für Verwaltungen» (eigenes Logo, ohne Wasserzeichen, Archivierung, mehrere Nutzer). Keine Preise auf der Seite.

Später: gleicher Motor, weitere Länderprofile (CH → DE → AT), Bezahlversion zusammen mit einem Programmier-Partner.

## Stack und Dateien

Reines statisches HTML/CSS/JS, kein Build-Schritt, keine Frameworks, kein Backend. Deployment: GitHub → Netlify, Publish-Verzeichnis ist das Repo-Root.

- `app.html`: die App. Eine Datei mit CSS und JS inline. Auf `noindex` gesetzt, solange sie nur über `/app` erreichbar sein soll (Netlify-Rewrite `/app` → `/app.html` einrichten).
- `index.html`: Landingpage mit SEO, schema.org (SoftwareApplication, FAQPage), hreflang `de-CH`, Formular «Für Verwaltungen».
- `danke.html`: Bestätigungsseite nach dem B2B-Formular.
- `netlify.toml`: Security-Header, Publish-Pfad.

Noch zu erstellen: `/impressum`, `/datenschutz`, `/verwaltungen`, 404, `manifest.webmanifest` + Icons, `sitemap.xml`, `robots.txt`, Ratgeber-Seiten (siehe SEO).

## Architektur von app.html

- **Zustand**: ein einziges Objekt `S`, serialisiert in IndexedDB (DB `abnahmeprotokoll`, Store `kv`, Key `state`). Autosave über `save()` mit Debounce. Fotos liegen als verkleinerte JPEG-Data-URLs (max. 1400 px, Qualität 0.8) im Zustand.
- **Rendering**: `render()` baut den aktuellen Schritt komplett neu per innerHTML. `render(true)` scrollt nach oben (nur beim Schrittwechsel), sonst bleibt die Scroll-Position erhalten. Das ist eine bewusste Nutzeranforderung: Die Seite darf bei Auswahl, Foto, Status nie nach oben springen.
- **Eingaben**: Felder haben `data-bind="pfad.im.zustand"`, Änderungen laufen über ein delegiertes `input`-Event und `set()`. Buttons über `data-*`-Attribute und ein delegiertes `click`-Event.
- **Schritte** (`steps()`): Objekt & Parteien → Zählerstände → Schlüssel → Räume → Nebenräume (nur wenn vorhanden) → Allgemein → Mängel → Depot → Abschluss & Unterschriften.
- **Protokolltypen**: `S.type` ist `antritt` oder `rueckgabe`. Rückgabe zeigt zusätzliche Spalten (Stand bei Antritt), Einstufung normale/übermässige Abnützung, Kostenbeteiligung, Depot-Freigabe, neue Adresse.
- **Räume**: Typen `zimmer`, `kueche`, `bad`, `flur`, `balkon`, jeweils mit eigener Prüfpunkt-Liste (`ITEMS`). Nebenräume (`NEBEN`) haben Checklisten. Räume und Nebenräume sind frei umbenennbar, ergänzbar, löschbar.
- **Mängel**: Prüfpunkte mit Status «Mangel» werden automatisch in die Mängelliste übernommen (`autoMaengel()`), dazu frei erfassbare weitere Mängel.
- **Fotos**: laufende Nummer `S.photoCounter` (Foto 1, 2, 3 …), Nummer erscheint bei Prüfpunkt, in der Mängeltabelle und im Foto-Anhang.
- **Unterschriften**: Canvas mit Pointer-Events, als PNG-Data-URL im Zustand. Dürfen leer bleiben (Unterschrift auf Papier).
- **Protokoll-Ausgabe**: `buildDoc()` erzeugt das Dokument als HTML, Ausgabe über `window.print()` (PDF aus dem Druckdialog) und «Als Datei sichern» (HTML-Datei). Im Fuss steht «Erstellt mit …» (einziges Marketing im kostenlosen Produkt, bei der Verwaltungsversion entfällt es).
- **Antritt → Rückgabe**: Am Ende des Antritts wird per `exportData()` eine `.json`-Datei gesichert. In der Rückgabe wird sie über `importAntritt()` geladen: Objekt, Parteien, Räume, Zähler-Nr. und -Stand, Schlüssel werden vorbefüllt, `S.antritt` hält den Zustand bei Antritt, der pro Prüfpunkt als graue Zeile («Bei Antritt: …») und als Spalte im PDF erscheint. Die Datei-Struktur ist ein Vertrag: Änderungen nur abwärtskompatibel (Feld `ver` beachten).
- **Feedback**: Floating-Button auf jedem Schritt, Modal, POST an Netlify Forms (`name="feedback"`, verstecktes Formular im HTML für die Erkennung), Fallback mailto. Mitgesendet werden nur Schritt, Protokolltyp, Version, User-Agent. Nie Protokolldaten oder Fotos.
- **Demo**: `loadDemo()` füllt ein Rückgabeprotokoll mit Musterdaten (Max Muster, Musterstrasse 12, 8001 Zürich). Aufrufbar über `/app#beispiel`.
- **Downloads**: `download()` nutzt wenn vorhanden die Plattform-Funktion, sonst klassischer `<a download>`.

## Harte Regeln

- **Datenschutz zuerst**: keine Protokolldaten, keine Fotos, keine Namen verlassen das Gerät. Keine Analytics mit Cookies, keine Fremd-Tracker. Falls Statistik: Plausible oder Umami ohne Cookies, und nur Seitenaufrufe und Funnel-Schritte, keine Inhalte. Datenschutzerklärung muss das exakt widerspiegeln.
- **Keine Konten, keine Cloud, kein Backend** in dieser Phase. Wenn eine Funktion einen Server braucht, gehört sie in die spätere Bezahlversion.
- **Zustand nicht brechen**: Änderungen am Zustands-Schema müssen alte, im Browser gespeicherte Zustände weiter laden können (`Object.assign(freshState(), gespeichert)`). Prüfen, dass ein angefangenes Protokoll nach einem Update nicht verloren geht.
- **Scroll-Position** nach Interaktionen im selben Schritt erhalten (siehe `render`).
- **Mobile zuerst**: iPhone Safari und Android Chrome sind die Hauptziele. Touch-Ziele mindestens 44 px, Safe-Area-Insets beachten, Eingabefelder mindestens 16 px gross (sonst zoomt iOS).
- **Rechtliche Aussagen vorsichtig**: Texte zu Art. 267a OR, Lebensdauertabelle, Fristen sind Orientierung, keine Rechtsberatung. Disclaimer im Protokoll und auf der Seite beibehalten. Keine neuen rechtlichen Behauptungen ohne Quelle.

## Sprache und Stil

- Anrede **Sie**.
- Schweizer Schreibweise: **ss statt ß** (Strasse, übermässig, Abnützung), Anführungszeichen «…».
- Terminologie: Antritt / Rückgabe (nicht Einzug/Auszug als Hauptbegriff), Abnahmeprotokoll, Mietzinsdepot (nicht Kaution), Nebenkosten, Verwaltung, Mieter/in, Vermieter/in, Lebensdauertabelle (paritätisch), kleiner Unterhalt, Storen, Réduit, Estrich, Sonnerie, Lavabo, Kehrichtsack.
- Ton: sachlich, kurz, hilfreich. Kein Marketing-Pathos, keine Ausrufezeichen-Orgien.
- Alle UI-Texte Deutsch (de-CH). Code-Kommentare dürfen Englisch sein.

## SEO

Ziel: Suchanfragen mit Absicht «erstellen / online / kostenlos» statt «Vorlage herunterladen» (dort dominieren Banken und Verbände). Die App ist `noindex`, Inhalte liegen auf der Landingpage und eigenen Ratgeber-Seiten.

Geplante Seiten, je eine pro Suchanfrage: Abnahmeprotokoll Vorlage / Muster, Wohnungsabnahme Checkliste, Wohnungsabnahme Auszug, Wohnungsübergabe Einzug (Antritt), Lebensdauertabelle, kleiner Unterhalt, Mietzinsdepot, Wohnungsabnahme Zürich / Bern / Basel. Jede Seite: eigener Title und Description, H1, FAQ mit schema.org, interne Links, klare Schaltfläche zur App. Ausserdem `hreflang de-CH` ab Tag 1, damit spätere DE-/AT-Versionen nicht kollidieren.

Core Web Vitals sind ein Vorteil statischer Seiten, nicht verschlechtern: keine grossen Skripte, Schrift mit Fallback, Bilder komprimiert.

## Rechtliches (noch offen)

- **Impressum**: Pflicht. Als öffentliche Kontaktadresse die Adresse des Betreibers verwenden, die dieser dafür bestimmt (nicht die Privatadresse der Familie). Angaben vom Betreiber einholen, nicht erfinden.
- **Datenschutzerklärung nach Schweizer DSG** (und DSGVO-tauglich formulieren, da später DE): Verarbeitung nur lokal im Browser, Netlify-Hosting, Netlify Forms für Feedback und Verwaltungsanfragen (dort werden E-Mail und Nachricht verarbeitet), Hinweis zu Cookies/Statistik je nach Setup.
- **Disclaimer**: Dokumentationswerkzeug, keine Rechtsberatung.

## Roadmap (nächste Schritte, in dieser Reihenfolge)

1. Auf echten Geräten testen: Kamera, Foto aus Mediathek, Unterschrift, Druck/PDF, `.json` sichern und laden. iOS Safari, iOS als Home-Screen-App, Android Chrome.
2. PWA: Manifest, Icons, einfacher Service Worker für Offline-Nutzung nach erstem Laden (Keller ohne Empfang). Update-Verhalten so, dass ein laufendes Protokoll nie unterbrochen wird.
3. Impressum, Datenschutz, 404, `/verwaltungen`, Sitemap, robots.txt.
4. Statistik ohne Cookies: Funnel Landing → Start → Protokoll erstellen.
5. Ratgeber-Seiten und ausgefülltes Musterprotokoll als PDF für SEO.
6. Refactoring zum Länderprofil als Konfiguration (Begriffe, Prüfpunkte, Rechtstexte, Währung), damit DE und AT ohne Code-Kopie möglich sind.

## Arbeitsweise

- Vor grösseren Änderungen kurz sagen, was geändert wird und warum. Kleine, einzeln prüfbare Schritte.
- Nach jeder Änderung an `app.html` Syntax prüfen und einen Durchlauf des Kernablaufs testen (Start → alle Schritte → Protokoll → zurück; Demo laden; Export/Import).
- Keine neuen Abhängigkeiten ohne Rückfrage. Die App soll eine Datei mit inline CSS/JS bleiben, bis es einen klaren Grund zur Aufteilung gibt.
- Bei Unsicherheit zu rechtlichen Texten, Impressumsangaben oder Preisen fragen, nicht raten.
