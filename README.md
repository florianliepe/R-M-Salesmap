# R&M PLZ-Karten-Webapp

## Nutzung

`rm-plz-karte.html` per Doppelklick in Chrome, Edge oder Firefox öffnen. Die App läuft vollständig im Browser im `file://`-Kontext; es gibt keinen Server, kein Java/JDK, kein npm und keine Installation.

Die App läuft lokal, nutzt aber bewusst Online-Karten und optional Online-Geocoding. Laufzeit-CDNs sind `cdnjs.cloudflare.com` für Leaflet und JSZip, plus OpenStreetMap-Kacheln für den Kartenhintergrund. Beim aktiv gestarteten Geocoding wird nur die postalische Adresse an den gewählten Provider gesendet; Status, Segment, Accountinhaber und interne IDs werden nicht übertragen.

Die Karte nutzt OpenStreetMap-Kacheln und lokal eingebettete Bundesländergrenzen. Fahnen bleiben bei jedem Zoom sichtbar und skalieren nur in der Größe. Der Leaflet-Marker hat einen festen 60x60-Pixel-Container mit konstantem Ankerpunkt am Mastfuß; nur die innere Fahne wird per CSS skaliert. Dadurch bleibt der geografische Punkt beim Zoomen stabil. Die Fahnenfarben werden aus der Statusfarblegende der hochgeladenen Excel gelesen. Standorte werden zuerst aus einem lokalen Geocode-Cache geladen, dann per Google Geocoding oder OpenStreetMap/Nominatim präzisiert und nur als sichtbar markierter Fallback aus PLZ, Straße und Stadt angenähert.

Das Suchfeld durchsucht alle Accountparameter. `Schlagwort` nutzt Teiltreffer und exakte PLZ-/Textsuche; `Vektor` nutzt eine lokale Token-/N-Gramm-Vektorsuche mit Kosinus-Ähnlichkeit. Treffer erscheinen als Standortliste und können direkt auf der Karte angesprungen werden.

Die Topbar bietet zwei Ansichten: `Karte` und `Dashboard`. Beide nutzen denselben Such- und Filterzustand. Das Dashboard zeigt KPI-Kacheln für Vertriebssteuerung, einen Status-Mix, ein Radar Chart für Accountinhaber-Profile, eine Segment-/Portfolio-Potenzialkarte mit priorisiertem Ranking, eine Status-Pipeline, eine Accountinhaber-Matrix, Datenqualität und automatische Insight-Karten.

Die Suche gruppiert Treffer nach Accounts, PLZ, Städten, Segmenten und Accountinhabern. Gruppen können direkt als Suche oder Filter übernommen werden.

## Dateien

- `rm-plz-karte.html`: komplette Single-File-App mit inline HTML/CSS/JavaScript.
- `test-accounts.xlsx`: synthetische Testdatei mit allen Statusfarben, Theme-Farben, führender Null, ungültiger und fehlender PLZ.
- `tests/generate_test_accounts.py`: erzeugt die Testdatei erneut.
- `tests/validate_export.py`: prüft eine exportierte Datei gegen erwartete Werte/Farben.
- `FEATURE_ROADMAP.md`: priorisierte Feature-Roadmap inklusive Dashboard-View für Vertriebs-KPIs und Insights.
- `GEO_TARGET_ARCHITECTURE.md`: Zielarchitektur für lokale präzise Kartierung, Geocode-Cache, Qualitätsstufen und zoomabhängiges Flagging.

Die eingebetteten Bundesländergrenzen basieren auf `isellsoap/deutschlandGeoJSON`, Datei `2_bundeslaender/4_niedrig.geo.json` unter Unlicense.

## Tests

Testdatei erzeugen:

```powershell
python tests/generate_test_accounts.py
```

Export validieren, nachdem in der App bei `Alpha Fiber GmbH` der Status auf `eingeschlafen / keinen Kontakt` gesetzt und heruntergeladen wurde:

```powershell
python tests/validate_export.py test-accounts.xlsx test-accounts_updated_YYYYMMDD-HHMM.xlsx
```

Playwright ist in dieser Umgebung nicht installiert. Deshalb liegt die Round-Trip-Validierung als Python-Skript plus manuelle Smoke-Checkliste vor.

## Manuelle Smoke-Checkliste

1. `rm-plz-karte.html` per Doppelklick öffnen.
2. `test-accounts.xlsx` hochladen oder Demo-Modus starten.
3. Prüfen: Marker erscheinen, Legende zeigt sechs Status inklusive `kein Status gesetzt`.
4. Suche per PLZ, Standort, Accountname oder Segment testen; Treffer anklicken und Kartenzoom prüfen.
5. Filter für Status, Segment, Accountinhaber, Partnerstatus und Standortgenauigkeit setzen; Trefferzahlen und Verblassen/Ausblenden prüfen.
6. In `Dashboard` wechseln; KPI-Kacheln, Status-Mix, Radar Chart, Potenzialkarte, Pipeline, Matrix, Datenqualität und Insights werden angezeigt.
7. Radar-Accountinhaber wechseln und prüfen, dass sich das Profil aktualisiert.
8. Eine KPI-Kachel oder ein Segment im Potenzialranking anklicken und prüfen, dass Filter/Chips aktualisiert werden.
9. Marker `Alpha Fiber GmbH` anklicken, Status auf rot ändern.
10. Change Log zeigt einen nicht exportierten Eintrag; Rückgängig funktioniert.
11. Status erneut ändern und `Aktualisierte Excel herunterladen` klicken.
12. Optional unter `Standorte` einen Google-API-Key setzen oder OpenStreetMap/Nominatim wählen, `Standorte präzisieren` starten und prüfen, dass die Genauigkeit auf `Adresse online`, `Straße online` oder `PLZ/Ort online` wechselt.
13. Geocode-Cache exportieren, Seite neu öffnen, Cache importieren und prüfen, dass präzise Koordinaten wiederverwendet werden.
14. Export mit `tests/validate_export.py` prüfen.

## Bekannte Einschränkungen

- Ohne Geocode-Cache oder bewusst gestartetes Online-Geocoding bleibt die Verortung eine sichtbare Fallback-Näherung über zweistellige PLZ-Leitregionen. Für korrekte Standorte muss der Cache per Google Geocoding, OpenStreetMap/Nominatim oder einem späteren lokalen Geocode-Service aufgebaut werden.
- Bundesländergrenzen sind als vereinfachtes GeoJSON eingebettet. Die Genauigkeit reicht für Kartenübersicht und Regionalzoom; für amtliche Detailansprüche sollte ein höher aufgelöster lokaler GeoJSON/TopoJSON-Auszug eingebettet werden.
- Die App parst die für dieses Excel-Format relevanten `.xlsx`-XML-Strukturen selbst. Stark abweichende Arbeitsmappen können klare Fehlermeldungen auslösen.

## Vorschläge für akkurate Strukturen

- Bundesländer: Für produktive Genauigkeit einen amtlichen GeoJSON/TopoJSON-Auszug mit Bundeslandgrenzen fest in die HTML-Datei einbetten oder als lokale Begleitdatei laden. Dadurch bleiben die Grenzen auch offline korrekt und es gibt keine CORS-Abhängigkeit.
- PLZ-/Adressstrukturen: Die Leitregions-Näherung bleibt nur Fallback. Produktiv sollte ein exportierter Geocode-Cache verwendet werden; für sehr große regelmäßige Läufe ist ein lokaler `Adresse -> lat/lon`-Service performanter als öffentliches Live-Geocoding.

## Empfohlene Geocoding-Zielumsetzung

Die Zielumsetzung nutzt Google Geocoding als primäre Option und OpenStreetMap/Nominatim als kleine, bewusst gedrosselte Alternative. Ergebnisse werden im lokalen Geocode-Cache gespeichert und können als JSON exportiert/importiert werden. Details stehen in `GEO_TARGET_ARCHITECTURE.md`.
