# Zielarchitektur: Praezise lokale Kartierung und Flagging

## Ausgangslage

Die aktuelle App zeigt Online-Kartenkacheln, aber die Standortpositionen entstehen lokal aus zweistelligen PLZ-Leitregionen plus deterministischem Versatz. Das ist stabil, aber nicht genau genug. Falsche oder scheinbar wandernde Faehnchen sind deshalb meist kein Markerproblem, sondern ein Koordinatenproblem.

Die fachliche Vorgabe lautet:

- Internetzugang ist vorhanden.
- Kundendaten und Adressen duerfen fuer die korrekte Standortermittlung an einen bewusst konfigurierten Online-Geocoder gesendet werden.
- Eine anonyme ID-Zuordnung ist erlaubt.
- Die bestmoegliche Standortallokation ist gewuenscht.
- Die App darf von Single-HTML auf ein ZIP-Paket erweitert werden, muss lokal lauffaehig bleiben.

## Zielbild

Die App wird zu einer lokalen Karten-Workbench mit Online-Basiskarte und kontrollierter Online-Geocoding-Schicht. Geocoding-Ergebnisse werden lokal gecacht, damit Adressen nicht bei jedem Start erneut gesendet werden.

```text
Excel Upload
  -> Account Parsing
  -> stabile Account-ID
  -> Geocode-Aufloesung
       1. bestaetigter Cache
       2. Online-Geocoder mit API-Key (primaer Google)
       3. optional bewusst gedrosselter OSM/Nominatim-Modus
       4. lokale PLZ-Zentroiden
       5. PLZ-Leitregion-Fallback
       6. nicht zuordenbar
  -> Marker-/Cluster-Layer
  -> Dashboard + Data Quality
  -> Cache/Report/Excel Export
```

Online-Komponenten duerfen Kartenkacheln liefern. Fuer die Ermittlung genauer Standortkoordinaten wird ein explizit aktivierter Geocoding-Provider genutzt. Der Nutzer sieht Provider, Fortschritt und Cache-Status.

## Provider-Entscheidung

Eindeutiger Zielmodus:

1. Primaer OpenStreetMap/Nominatim ohne Nutzerkonto, aber nur fuer bewusst gestartete, rate-limitierte Laeufe.
2. Optional Google Geocoding API mit eigenem API-Key fuer Nutzer mit Google-Cloud-Zugang.
3. Lokaler Cache ist Pflicht.
4. Fallbacks bleiben sichtbar markiert.

Begruendung: Die Excel enthaelt keine GPS-Koordinaten. Ein korrekter Standort kann daher nur aus der postalischen Adresse berechnet werden. Ohne externen oder lokalen Geocoder bleibt nur eine Naeherung.

## Zielpaket

Kurzfristig bleibt die App per Doppelklick oder lokalem Mini-Server startbar. Das Auslieferungsformat ist ein ZIP:

```text
rm-plz-webapp/
  index.html
  assets/
    leaflet/
    app.css
    app.js
  data/
    bundeslaender.geojson
    plz-centroids.de.json
    optional-street-index.de.sqlite|json|pmtiles
  cache/
    geocode-cache.example.json
  tests/
    generate_test_accounts.py
    validate_export.py
  README.md
  GEO_TARGET_ARCHITECTURE.md
```

Der erste Schritt kann weiterhin die bestehende Single-HTML-Datei erweitern. Sobald Geodaten groesser werden, ist die ZIP-Struktur sinnvoller als alles in eine HTML-Datei einzubetten.

## Datenschutzmodell

### Account-ID

Jeder Account bekommt lokal eine stabile ID. Die ID wird aus nicht exportierten internen Merkmalen gebildet und in der App konsistent verwendet.

Beispiel:

```json
{
  "accountId": "acc_7d4f8c3d5a91",
  "row": 428,
  "sourceWorkbookFingerprint": "wb_2026_07_16"
}
```

Die ID dient als Schluessel fuer lokale Caches, manuelle Korrekturen und Audit Trails. Beim Online-Geocoding wird die postalische Adresse an den konfigurierten Provider gesendet. Account-ID, Status, Segment und Accountinhaber muessen dabei nicht mitgesendet werden.

### Geocode-Cache

Der Cache speichert Koordinaten und Qualitaetsmetadaten, aber keine Klarnamen oder vollen Adressen.

```json
{
  "schemaVersion": 1,
  "createdAt": "2026-07-31T12:00:00.000Z",
  "records": {
    "acc_7d4f8c3d5a91": {
      "lat": 51.05041,
      "lon": 13.73726,
      "precision": "manual",
      "confidence": 1,
      "source": "user-confirmed",
      "updatedAt": "2026-07-31T12:00:00.000Z"
    }
  }
}
```

## Praezisionsstufen

Jeder Marker bekommt eine transparente Qualitaetsstufe:

| Stufe | Bedeutung | Anzeige |
| --- | --- | --- |
| `manual` | Manuell bestaetigte Koordinate | gruenes Qualitaetsbadge |
| `address` | Adresse mit Hausnummer lokal gefunden | sehr hoch |
| `street` | Strasse lokal gefunden, Hausnummer approximiert | hoch |
| `postcode` | PLZ-Zentroid | mittel |
| `region` | zweistellige PLZ-Leitregion | niedrig |
| `unmapped` | keine belastbare Zuordnung | Fehlerliste |

Die Karte darf niemals so tun, als waere eine Leitregion hausgenau. Tooltip, Popup und Data-Quality-Panel zeigen die Stufe.

## Geocode-Strategie

### Phase A: Online-Geocoding mit Cache

Dies ist der pragmatische naechste Schritt.

- Import/Export von `geocode-cache.json`.
- Provider-Auswahl: Google oder OSM/Nominatim.
- API-Key-Feld fuer Google.
- Batch-Geocoding mit Fortschritt und Abbruchmoeglichkeit.
- Speicherung der Koordinate unter anonymer Account-ID.
- Fallback auf PLZ-Zentroid oder Leitregion.
- Data-Quality-Liste fuer Accounts mit niedriger Genauigkeit.

Vorteil: hoechste Genauigkeit fuer die meisten Adressen, keine wiederholten Requests nach Cache-Aufbau, transparente Qualitaetsstufen.

### Phase B: Lokale PLZ-Zentroiden

Die zweistellige Leitregion wird durch echte PLZ-Zentroiden ersetzt.

- Datei `plz-centroids.de.json`.
- Key: 5-stellige PLZ.
- Wert: `lat`, `lon`, optional `quality`, `source`.
- Fallback nur, wenn PLZ unbekannt ist.

Erwarteter Effekt: deutlich bessere Verteilung ohne Datenschutzrisiko.

### Phase C: Lokaler Street-/Address-Geocoder

Fuer bestmoegliche Genauigkeit ohne externe Datenuebertragung braucht es lokale Adressdaten.

Optionen:

1. Interner Standort-/CRM-Export mit bekannten Koordinaten.
2. Lokaler Firmen-/Kundendatenbestand mit `AccountId -> lat/lon`.
3. Lokaler OSM-basierter Geocoder auf dem Rechner oder im Firmennetz.
4. Vorprozessiertes lokales Strassen-/Hausnummern-Indexpaket.

Die Webapp sollte nicht versuchen, ein komplettes Deutschland-Geocoding in einer riesigen HTML-Datei zu tragen. Besser ist ein vorbereiteter lokaler Cache oder ein lokaler Geocode-Service.

## Marker- und Flagging-Zielverhalten

### Zoomstufen

| Zoom | Darstellung | Zweck |
| --- | --- | --- |
| 4-6 | regionale Cluster/Bubbles | Ueberblick |
| 7-9 | PLZ-/Statuscluster | Hotspots |
| 10-12 | kompakte Pins | Standortvergleich |
| 13+ | Fahnen oder detaillierte Pins | einzelne Accounts |

Einzelfaehnchen sind bei weitem Zoom nicht geeignet. Sie ueberdecken sich und suggerieren Genauigkeit, die bei Fallback-Koordinaten nicht vorhanden ist.

### Cluster

Cluster zeigen:

- Accountzahl
- dominanten Status
- Statusmix als Mini-Segmente oder Ring
- niedrigste enthaltene Genauigkeitsstufe

Bei Klick:

- Zoom auf Cluster-Bounds.
- Wenn mehrere Accounts exakt gleiche Koordinate haben: Spiderfy/Offset.
- Rechts ein Detailpanel mit Accountliste.

### Marker

Ein Marker besteht aus:

- stabiler Koordinate
- Statusfarbe
- Genauigkeitsbadge
- Tooltip mit Account, Status, PLZ/Stadt, Genauigkeit
- Popup oder Detailpanel mit Statusaenderung und Koordinateninfo

## Empfohlene technische Umsetzung

### Kurzfristig in der bestehenden App

1. Neues Datenfeld je Account:

```js
{
  accountId,
  lat,
  lon,
  geoPrecision,
  geoConfidence,
  geoSource,
  geoStatus
}
```

2. Neue Funktionen:

```js
resolveAccountLocation(account)
loadGeocodeCache(file)
exportGeocodeCache()
applyManualLocation(accountId, lat, lon)
renderLocationQuality()
renderClusterLayer()
```

3. Bestehende Funktion ersetzen:

```js
coordFor(plz, street, city)
```

durch:

```js
resolveAccountLocation(account)
```

Die alte Leitregion bleibt nur Fallback.

### Mittelfristig als ZIP-App

Die App wird modular:

```text
js/
  excel.js
  geocode.js
  map.js
  markers.js
  clusters.js
  dashboard.js
  export.js
```

Der ZIP-Export enthaelt alle lokalen App-Dateien. Internet wird nur fuer Basiskarten genutzt.

### Optionaler lokaler Geocode-Service

Wenn hausgenaue Genauigkeit fuer alle Accounts gefordert ist, ohne Adressen extern zu senden, ist ein lokaler Service die sauberste Loesung:

```text
Webapp -> http://127.0.0.1:PORT/geocode
```

Der Service laeuft nur lokal oder im Firmennetz und nutzt lokale Daten. Die Webapp bleibt als ZIP auslieferbar; der Service ist optional.

## Umsetzungsfahrplan

### Schritt 1: Geocode-Cache und Qualitaetsanzeige

Lieferumfang:

- `geocode-cache.json` importieren/exportieren.
- Account-ID stabil erzeugen.
- `manual`, `postcode`, `region`, `unmapped` anzeigen.
- Data-Quality-Panel um Geocode-Qualitaet erweitern.
- Marker-Popup zeigt Quelle und Genauigkeit.

Akzeptanz:

- Upload funktioniert ohne Cache.
- Cache verbessert Koordinaten sofort.
- Exportierter Cache enthaelt keine Klarnamen/Adressen.
- Fallback bleibt funktionsfaehig.

### Schritt 2: Manuelle Standortkorrektur

Lieferumfang:

- Account markieren.
- Button `Koordinate korrigieren`.
- Klick auf Karte setzt neue Koordinate.
- Aenderung landet im Geocode-Cache.

Akzeptanz:

- Korrigierter Account bleibt nach Cache-Import an gleicher Position.
- Genauigkeit wird `manual`.
- Urspruengliche Excel wird dadurch nicht ungewollt veraendert.

### Schritt 3: Echte PLZ-Zentroiden

Lieferumfang:

- Lokale Datei `plz-centroids.de.json`.
- Resolver nutzt 5-stellige PLZ vor Leitregion.
- Dashboard zeigt Anteil `postcode` vs. `region`.

Akzeptanz:

- Accounts mit gueltiger PLZ nutzen PLZ-Zentroid.
- Leitregion wird nur noch fuer unbekannte PLZ verwendet.
- Marker sind sichtbar plausibler verteilt.

### Schritt 4: Cluster- und Flagging-Layer

Lieferumfang:

- Zoomabhaengige Darstellung.
- Cluster bei niedrigen Zoomstufen.
- Einzelfahnen nur bei hohem Zoom.
- Spiderfy/Offset fuer gleiche Koordinate.

Akzeptanz:

- Keine massive Fahnenwand bei Deutschlandansicht.
- Ein Standort bleibt beim Zoomen stabil.
- Cluster-Klick zoomt auf enthaltene Accounts.

### Schritt 5: Lokaler Praezisions-Geocoder

Lieferumfang:

- Schnittstelle fuer lokalen Geocode-Service oder lokalen Koordinatenexport.
- Batch-Aufloesung nur lokal.
- Ergebnis wird als Cache importierbar/exportierbar.

Akzeptanz:

- Keine Adresse verlaesst den Rechner oder das Firmennetz.
- Genauigkeitsstufen `address` und `street` sind moeglich.
- Problemfaelle bleiben manuell korrigierbar.

## Entscheidungsempfehlung

Die beste Reihenfolge ist:

1. Cache + Qualitaetsstufen.
2. Manuelle Korrektur.
3. PLZ-Zentroiden.
4. Cluster/Flagging.
5. Optional lokaler Geocode-Service.

Damit wird die aktuelle App schnell besser, ohne Datenschutzregeln zu verletzen. Die teuerste und komplexeste Komponente, der lokale Geocoder, wird erst eingefuehrt, wenn klar ist, dass Cache, manuelle Korrektur und PLZ-Zentroiden nicht ausreichen.
