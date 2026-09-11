# Feature Roadmap: PLZ-Karten-Webapp

## Zielbild

Die Webapp soll von einem Karten-Prototypen zu einer lokalen Vertriebs-Workbench wachsen: Upload einer Excel-Datei, robuste Kartenvisualisierung, sichere Statusbearbeitung, schnelle Suche und ein zweiter View für KPIs, Muster und Vertriebs-Insights. Alle Kundendaten bleiben lokal im Browser.

## Aktuelle Basis

- Excel-Upload und clientseitiges `.xlsx`-Parsing.
- Status aus Zellhintergrundfarbe.
- Kartenansicht mit PLZ-/Adressnäherung.
- Filter nach Status, Marktsegment, Accountinhaber und Partnerstatus.
- Keyword- und lokale Vektorsuche.
- Statusänderung, Change Log und Excel-Export.
- Lokal eingebettete Bundesländergrenzen.

## Leitprinzipien

- Keine Datenübertragung an externe Dienste.
- Single-File-Fähigkeit erhalten, solange der Prototyp verteilt werden muss.
- Karten- und Dashboard-Views teilen sich dieselben Filter und denselben Suchzustand.
- Visualisierungen müssen direkt handlungsorientiert sein: Prioritäten, Lücken, Risiken, Coverage und Pipeline-Status sichtbar machen.

## Phase 1: Stabilisierung und UX-Baseline

**Ziel:** Die bestehende Workbench zuverlässig und professionell bedienbar machen.

### Geocoding- und Flagging-Track

Die aktuelle Leitregions-Näherung bleibt nur Fallback. Da Kundendaten und Adressen nicht an externe Dienste gesendet werden dürfen, wird die Kartierung lokal präzisiert:

1. Geocode-Cache importieren/exportieren, keyed by stabiler anonymer Account-ID.
2. Qualitätsstufen je Marker einführen: `manual`, `address`, `street`, `postcode`, `region`, `unmapped`.
3. Manuelle Koordinatenkorrektur per Kartenklick ermöglichen.
4. Echte 5-stellige PLZ-Zentroiden lokal einbinden.
5. Zoomabhängiges Flagging einführen: Cluster/Bubbles bei weitem Zoom, Pins/Fahnen nur im Detailzoom.
6. Optional lokalen Geocode-Service oder lokalen Koordinatenexport anbinden.

Die Zielarchitektur ist in `GEO_TARGET_ARCHITECTURE.md` beschrieben.

1. Marker- und Datenqualität
   - Echte PLZ-Zentroiddaten lokal einbetten oder als optionale lokale Datei laden.
   - Aktuelle PLZ-Leitregionsnäherung als Fallback behalten.
   - Markerpositionen aus `PLZ + Stadt + Straße` deterministisch berechnen und transparent kennzeichnen.
   - Qualitätsindikator pro Marker: `exakt`, `PLZ-Zentroid`, `Leitregion`, `nicht zuordenbar`.

2. Filter- und Suchergonomie
   - Globaler Filterzustand oben sichtbar machen.
   - Filterchips einzeln entfernbar machen.
   - Suche mit Ergebnisgruppen: Accounts, PLZ, Städte, Segmente, Accountinhaber.
   - Optionaler Modus `Nur Treffer anzeigen` vs. `Nichttreffer verblassen`.

3. Karteninteraktion
   - Klick auf PLZ/Cluster zoomt auf die Region.
   - Tooltip kompakter, Detailpanel rechts statt großer Popups.
   - Marker-Legende mit Statusanzahl.
   - Mini-Summary im Kartenkopf: Accounts sichtbar, Statusmix, aktive Filter.

4. Robustheit
   - Upload-Validierung mit Checkliste: Sheet gefunden, Header gefunden, Zeilen gelesen, Statusfarben erkannt, PLZ gemappt.
   - Fehlerdialog mit konkreter Reparaturempfehlung.
   - Performance-Test mit ca. 2.000 Zeilen.

## Phase 2: Zweiter View `Dashboard`

**Ziel:** Neben der Karte einen KPI-/Insights-View schaffen, der relevante Vertriebsfragen beantwortet.

### Navigation

- Topbar-Tabs: `Karte`, `Dashboard`, `Änderungen`, optional `Datenqualität`.
- Filter, Suche und Statusauswahl gelten view-übergreifend.
- Dashboard kann zwischen `Gesamt`, `Accountinhaber`, `Segment`, `Region/PLZ` umschalten.

### KPI-Kacheln

Aus der Excel ableitbare KPIs:

- `Accounts gesamt`
- `Accounts mit aktivem Projektstatus`
- `Kontaktquote`: Status `aktuell Kontakt` + `aktuell Projekte` / alle Accounts
- `Schlafende Accounts`: Status `eingeschlafen / keinen Kontakt`
- `Ohne Status`: Status `kein Status gesetzt`
- `Distributor-Anteil`
- `Zertifizierungsquote`: `Partnerstatus = zertifiziert` / alle Accounts
- `Nicht zertifiziert / ungültig`
- `Anzahl Accountinhaber`
- `Top-Segment nach Accountzahl`
- `PLZ-Abdeckung`: eindeutige PLZ / Accounts
- `Datenqualität`: Anteil Accounts mit PLZ, Straße, Stadt, Status

### Dashboard-Visualisierungen

1. Status-Mix
   - Gestapeltes Balkendiagramm nach Status.
   - Varianten: nach Accountinhaber, Marktsegment, Partnerstatus.
   - Frage: Wo liegen offene, aktive oder eingeschlafene Accounts?

2. Radar Chart: Accountinhaber-Profil
   - Achsen:
     - Projektanteil
     - Kontaktanteil
     - Zertifizierungsquote
     - Distributor-Anteil
     - Segmentdiversität
     - Datenqualität
   - Vergleich: ein Accountinhaber vs. Gesamtbenchmark.
   - Frage: Welche Profile und Stärken haben einzelne Accountinhaber?

3. Scatter Plot: Segment-/Portfolio-Positionierung
   - X-Achse: Kontakt-/Projektquote.
   - Y-Achse: Zertifizierungsquote oder Distributor-Anteil.
   - Punktgröße: Anzahl Accounts.
   - Farbe: dominanter Status oder Segment.
   - Frage: Welche Segmente sind groß, aber schwach aktiviert?

4. Bubble Map / Region Summary
   - Auf Kartenebene pro PLZ-Leitregion aggregierte Bubbles.
   - Größe: Accountanzahl.
   - Farbe: dominanter Status oder Risikoquote.
   - Frage: Wo sind regionale Hotspots oder Lücken?

5. Top-N Listen
   - Top 10 PLZ mit den meisten Accounts.
   - Top 10 Städte.
   - Top 10 Segmente.
   - Top Accounts ohne Status.
   - Top Accounts `eingeschlafen`.

6. Heatmap / Matrix
   - Zeilen: Accountinhaber.
   - Spalten: Status oder Marktsegment.
   - Zellen: Accountzahl oder Anteil.
   - Frage: Wer betreut welche Status-/Segment-Schwerpunkte?

7. Funnel / Status Pipeline
   - `kein Status` -> `aktuell Kontakt` -> `aktuell Projekte`.
   - Separate Ansicht für `eingeschlafen` als Reaktivierungspotenzial.
   - Frage: Wie ist die Vertriebsbewegung im Bestand?

8. Data Quality Panel
   - Fehlende PLZ, fehlende Straße, unbekannter Status, nicht zuordenbare PLZ.
   - Exportierbare Fehlerliste.
   - Frage: Welche Datenqualität verhindert bessere Vertriebssteuerung?

## Phase 3: Dashboard-Interaktion

**Ziel:** Visualisierungen sollen nicht nur anzeigen, sondern Workflows steuern.

- Klick auf Chart-Segment setzt Filter.
- Klick auf KPI-Kachel öffnet zugehörige Accountliste.
- Brushing im Scatter Plot filtert Karte und Liste.
- Dashboard-Liste mit Accountdetails, Statusänderung und Karten-Zoom.
- Vergleichsmodus: zwei Accountinhaber oder Segmente nebeneinander.
- `Insight Cards`: automatisch erkannte Auffälligkeiten, z. B.:
  - "Viele eingeschlafene Accounts im Segment X"
  - "Hoher Anteil ohne Status bei Accountinhaber Y"
  - "PLZ-Region 01 hat hohe Accountdichte und niedrige Kontaktquote"

## Phase 4: Visual Design Upgrade

**Ziel:** Von Prototyp zu ruhiger, vertriebsgeeigneter Workbench.

- Layout:
  - Linke Filterleiste kompakter.
  - Rechte Detail-/Insight-Schiene kontextabhängig.
  - Dashboard mit dichtem Grid statt Marketing-Layout.

- Komponenten:
  - KPI-Kacheln mit klaren Zahlen und Delta-/Anteil-Hinweisen.
  - Einheitliche Statusfarben aus Excel-Legende.
  - Tooltips mit Definitionen für KPIs.
  - Empty States und Loading States.

- Karten-/Dashboard-Konsistenz:
  - Gleiche Filterchips in allen Views.
  - Gleiche Farben und Begriffe.
  - Gleiche Accountdetail-Komponente.

- Accessibility:
  - Tastaturbedienbare Tabs und Filter.
  - Ausreichender Kontrast.
  - Text nicht nur über Farbe codieren.

## Phase 5: Datenmodell und Export-Erweiterungen

**Ziel:** Analysen reproduzierbar und teilbar machen.

- Session-State als lokale JSON-Datei exportieren/importieren.
- Dashboard-Snapshot als PNG oder HTML-Report exportieren.
- Geänderte Status + KPI-Zusammenfassung im Exportbericht.
- Optional: zusätzliches Sheet `Dashboard Summary` im Excel-Export erzeugen, ohne Originaldaten zu verändern.
- Audit Trail für Statusänderungen mit Benutzerinitialen, Kommentar und Grund.

## Phase 6: Technische Umsetzungsempfehlung

### Kurzfristig, Single-File-kompatibel

- Charting über CDN, z. B. Chart.js oder Apache ECharts.
- Dashboard-View als zweites DOM-Panel in der bestehenden HTML-Datei.
- Gemeinsame Funktionen:
  - `getFilteredAccounts()`
  - `computeKpis(accounts)`
  - `groupBy(accounts, field)`
  - `renderDashboard()`
  - `syncFiltersAcrossViews()`

### Mittelfristig

- Lokale modulare Struktur statt riesiger Single-File-Logik.
- Build-Schritt optional, aber weiterhin Export als statische App.
- Separate Dateien:
  - `excel.js`
  - `map.js`
  - `filters.js`
  - `dashboard.js`
  - `kpis.js`

### Langfristig

- Vollständiger lokaler PLZ-/Adressdatensatz.
- Optionaler lokaler IndexedDB-Cache für große Dateien.
- Test-Suite mit Playwright für Upload, Filter, Dashboard und Export.

## Priorisierte nächste Entwicklungsschritte

1. Dashboard-Tab in die bestehende App einbauen.
2. Gemeinsame Filterfunktion `getVisibleAccounts()` einführen.
3. KPI-Kacheln implementieren: Gesamt, Kontaktquote, Projektquote, ohne Status, eingeschlafen, zertifiziert.
4. Status-Mix-Balkendiagramm und Accountinhaber-Matrix ergänzen.
5. Radar Chart für Accountinhaber-Profil ergänzen.
6. Scatter Plot für Segmentpotenzial ergänzen.
7. Klick-Interaktionen zwischen Dashboard, Liste und Karte verbinden.
8. Data-Quality-Panel ergänzen.
9. Dashboard-Snapshot/Report exportieren.
10. Lokalen PLZ-Zentroiddatensatz ersetzen oder ergänzen.

## KPI-Definitionen für die erste Dashboard-Version

| KPI | Definition | Datenfelder |
| --- | --- | --- |
| Accounts gesamt | Anzahl gelesener Datenzeilen | `Account Name 1` |
| Kontaktquote | (`aktuell Kontakt` + `aktuell Projekte`) / Gesamt | Statusfarbe |
| Projektquote | `aktuell Projekte` / Gesamt | Statusfarbe |
| Reaktivierungspotenzial | `eingeschlafen / keinen Kontakt` / Gesamt | Statusfarbe |
| Ohne Status | `kein Status gesetzt` / Gesamt | Statusfarbe |
| Zertifizierungsquote | `Partnerstatus = zertifiziert` / Gesamt | `Partnerstatus` |
| Distributor-Anteil | `Distributor` / Gesamt | Statusfarbe oder `Partnertyp` |
| Segmentbreite | Anzahl eindeutiger Marktsegmente | `Markt Kunden Segment` |
| Accountinhaber-Load | Accounts pro Accountinhaber | `Accountinhaber` |
| Regionale Dichte | Accounts pro PLZ/Leitregion | `PLZ (Hausadresse)` |
| Datenqualität | Anteil Zeilen mit PLZ, Stadt, Straße und erkennbarem Status | PLZ, Stadt, Straße, Status |

## Akzeptanzkriterien für den Dashboard-View

- Dashboard öffnet nach Upload ohne erneutes Parsen.
- Alle KPIs reagieren auf aktive Filter und Suche.
- Mindestens vier Visualisierungen sind vorhanden:
  - KPI-Kacheln
  - Status-Mix
  - Radar Chart
  - Scatter Plot
- Klick auf Chart-Element filtert Karte und Accountliste.
- Zahlen sind bei leerem Filter identisch zur Excel-Grundgesamtheit.
- Export-Roundtrip der Excel bleibt unverändert funktionsfähig.
