# R&M PLZ-Karten-Webapp

## Nutzung

`index.html` per Doppelklick in Chrome, Edge oder Firefox öffnen. Die App läuft vollständig im Browser im `file://`-Kontext; es gibt keinen Server, kein Java/JDK, kein npm und keine Installation.

Die App läuft lokal, nutzt aber bewusst Online-Karten und optional Online-Geocoding. Laufzeit-CDNs sind `cdnjs.cloudflare.com` für Leaflet und JSZip, plus OpenStreetMap-Kacheln für den Kartenhintergrund. Beim aktiv gestarteten Geocoding wird nur die postalische Adresse an den gewählten Provider gesendet; Status, Segment, Accountinhaber und interne IDs werden nicht übertragen.

Die Karte nutzt OpenStreetMap-Kacheln und lokal eingebettete Bundesländergrenzen. Fahnen bleiben bei jedem Zoom sichtbar und skalieren nur in der Größe. Der Leaflet-Marker hat einen festen 60x60-Pixel-Container mit konstantem Ankerpunkt am Mastfuß; nur die innere Fahne wird per CSS skaliert. Dadurch bleibt der geografische Punkt beim Zoomen stabil. Die Fahnenfarben werden aus der Statusfarblegende der hochgeladenen Excel gelesen. Standorte werden zuerst aus einem lokalen Geocode-Cache geladen, dann standardmäßig per OpenStreetMap/Nominatim oder optional per Google Geocoding präzisiert und nur als sichtbar markierter Fallback aus PLZ, Straße und Stadt angenähert.

Das Suchfeld durchsucht alle Accountparameter. `Schlagwort` nutzt Teiltreffer und exakte PLZ-/Textsuche; `Vektor` nutzt eine lokale Token-/N-Gramm-Vektorsuche mit Kosinus-Ähnlichkeit. Treffer erscheinen als Standortliste und können direkt auf der Karte angesprungen werden.

Die Topbar bietet zwei Ansichten: `Karte` und `Dashboard`. Beide nutzen denselben Such- und Filterzustand. Das Dashboard zeigt KPI-Kacheln für Vertriebssteuerung, einen Status-Mix, ein Radar Chart für Accountinhaber-Profile, eine Segment-/Portfolio-Potenzialkarte mit priorisiertem Ranking, eine Status-Pipeline, eine Accountinhaber-Matrix, Datenqualität und automatische Insight-Karten.

Die Suche gruppiert Treffer nach Accounts, PLZ, Städten, Segmenten und Accountinhabern. Gruppen können direkt als Suche oder Filter übernommen werden.

## Dateien

- `index.html`: komplette Single-File-App mit inline HTML/CSS/JavaScript.
- `tests/regression.cjs`: automatisierte Regressionstests mit synthetischer Demo und optionaler lokaler Excel-Datei.
- `FEATURE_ROADMAP.md`: priorisierte Feature-Roadmap inklusive Dashboard-View für Vertriebs-KPIs und Insights.
- `GEO_TARGET_ARCHITECTURE.md`: Zielarchitektur für lokale präzise Kartierung, Geocode-Cache, Qualitätsstufen und zoomabhängiges Flagging.

Die eingebetteten Bundesländergrenzen basieren auf `isellsoap/deutschlandGeoJSON`, Datei `2_bundeslaender/4_niedrig.geo.json` unter Unlicense.

## Tests

Regressionstests: `npm ci` und `npm test`. Browser-Schritte, Originaldatei-Vergleich und verbleibende Grenzen stehen in [TESTING.md](TESTING.md). Die Node-Abhängigkeiten werden nur für Tests benötigt.

## Export und Mehrfachauswahl

Der Standardexport erhält die Excel-Struktur und ändert nur bewusst bearbeitete Statusfarben. Bekannte XML-Namensraumfehler älterer Exporte werden repariert. GPS-Spalten werden nur bei aktivierter Option ergänzt/aktualisiert; Kartenpositionen lassen sich unabhängig davon als JSON-Cache sichern.

Filter bieten Checkboxen mit `Alle` und `Keine`. Keine Auswahl bedeutet null Treffer. Innerhalb eines Filters gilt ODER, zwischen Filtern und Suche UND. Nicht passende Marker sind standardmäßig vollständig ausgeblendet.

## Bekannte Einschränkungen

- Ohne Geocode-Cache oder bewusst gestartetes Online-Geocoding bleibt die Verortung eine sichtbare Fallback-Näherung über zweistellige PLZ-Leitregionen. Für korrekte Standorte muss der Cache per Google Geocoding, OpenStreetMap/Nominatim oder einem späteren lokalen Geocode-Service aufgebaut werden.
- Bundesländergrenzen sind als vereinfachtes GeoJSON eingebettet. Die Genauigkeit reicht für Kartenübersicht und Regionalzoom; für amtliche Detailansprüche sollte ein höher aufgelöster lokaler GeoJSON/TopoJSON-Auszug eingebettet werden.
- Die App parst die für dieses Excel-Format relevanten `.xlsx`-XML-Strukturen selbst. Stark abweichende Arbeitsmappen können klare Fehlermeldungen auslösen.

## Vorschläge für akkurate Strukturen

- Bundesländer: Für produktive Genauigkeit einen amtlichen GeoJSON/TopoJSON-Auszug mit Bundeslandgrenzen fest in die HTML-Datei einbetten oder als lokale Begleitdatei laden. Dadurch bleiben die Grenzen auch offline korrekt und es gibt keine CORS-Abhängigkeit.
- PLZ-/Adressstrukturen: Die Leitregions-Näherung bleibt nur Fallback. Produktiv sollte ein exportierter Geocode-Cache verwendet werden; für sehr große regelmäßige Läufe ist ein lokaler `Adresse -> lat/lon`-Service performanter als öffentliches Live-Geocoding.

## Empfohlene Geocoding-Zielumsetzung

Die Zielumsetzung nutzt OpenStreetMap/Nominatim als accountfreien Default und Google Geocoding als optionale präzisere Providerwahl mit eigenem API-Key. Ergebnisse werden im lokalen Geocode-Cache gespeichert und können als JSON exportiert/importiert werden. Details stehen in `GEO_TARGET_ARCHITECTURE.md`.
