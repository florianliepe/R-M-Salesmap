# Zielmodus: R&M Salesmap

## Ziel

Die Anwendung laeuft als statische lokale Webapp und als GitHub-Pages-App. Nutzer laden die Excel-Datei im Browser hoch, pruefen und filtern Accounts auf einer Karte, praezisieren Standorte per Online-Geocoding und exportieren eine angereicherte Excel-Datei.

## Verbindlicher Standortansatz

1. Die Excel enthaelt keine GPS-Spalten als Quelle.
2. Fuehrender Bezugspunkt ist die postalische Adresse aus `Strasse (Hausadresse)`, `PLZ (Hausadresse)` und `Stadt (Hausadresse)`.
3. Primaere accountfreie Online-Aufloesung ist OpenStreetMap/Nominatim als bewusst gestarteter, rate-limitierter Lauf.
4. Google Geocoding bleibt als optionale Providerwahl verfuegbar, wenn ein Nutzer einen eigenen Google Maps JavaScript API Key besitzt.
5. Geocoding-Ergebnisse werden in einem lokalen JSON-Cache gespeichert und koennen importiert/exportiert werden.
6. Wenn kein Cache oder Online-Treffer vorhanden ist, nutzt die App nur einen sichtbar markierten Leitregion-Fallback. Dieser Fallback gilt nicht als korrekter Standort.

## Datenschutz und Secrets

Die Kundendatei wird nicht ins GitHub-Repository gelegt. Beim Geocoding wird nur die postalische Adresse an den gewaehlten Provider gesendet, nicht Status, Segment, Accountinhaber oder interne Vertriebsinformationen. API Keys werden nicht im Repository gespeichert.

## Export

Der Excel-Export bewahrt die bestehende Workbook-Struktur und Statusfarben und ergaenzt beziehungsweise aktualisiert diese Spalten:

- `GPS Latitude`
- `GPS Longitude`
- `GPS Coordinates`
- `Geocode Precision`
- `Geocode Source`
- `Geocode Address`

## Frontend

Die App priorisiert stabile Bedienung: klare Karten-/Dashboard-Tabs, Such- und Filterzustand uebergreifend, sichtbare Standortqualitaet, Cache-Aktionen im Standortbereich und zoomstabile Fahnenanker.
