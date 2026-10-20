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

Der Standardexport bewahrt die bestehende Workbook-Struktur, Ansichten, Spaltenbreiten, Filterbereiche, Formeln und Statusfarben. Nur bewusst geaenderte Statusfarben werden in den zugehoerigen Zellen aktualisiert; andere Zellformate bleiben erhalten. Bekannte namespace-lose SpreadsheetML-Knoten aus frueheren App-Exporten werden repariert. Bereits verlorene Formatierung kann ohne unbeschaedigte Originaldatei nicht rekonstruiert werden.

Die Karte und der JSON-Geocode-Cache funktionieren unabhaengig von Excel-Spaltenerweiterungen. Nur mit der ausdruecklich aktivierten Option `GPS-Spalten im Excel ergaenzen/aktualisieren` ergaenzt beziehungsweise aktualisiert der Export diese Spalten:

- `GPS Latitude`
- `GPS Longitude`
- `GPS Coordinates`
- `Geocode Precision`
- `Geocode Source`
- `Geocode Address`

Bestehende Tabellen- und Filterbereiche werden bei dieser optionalen Erweiterung nicht vergroessert. Neue GPS-Spalten liegen ausserhalb dieser Bereiche. Vorhandene Formeln in GPS-Zellen werden nicht ueberschrieben. Wiederholte Exporte starten immer vom Upload und duerfen weder Spalten noch Styles kumulativ vervielfachen.

## Frontend

Die App priorisiert stabile Bedienung: klare Karten-/Dashboard-Tabs, Such- und Filterzustand uebergreifend, sichtbare Standortqualitaet, Cache-Aktionen im Standortbereich und zoomstabile Fahnenanker.

## Abnahmekriterien der Export-/Filterkorrektur

1. Der Export erhaelt alle unbeteiligten ZIP-Bestandteile der XLSX bytegleich. Im Account-Sheet bleiben bestehende Werte, Formeln und Layoutdefinitionen erhalten.
2. RGB-, indizierte und Theme-Farben mit HLS-Tint werden fuer die Fahnen ausgewertet. Die konkrete Zellfarbe bleibt auch dann sichtbar, wenn sie nur naeherungsweise einer Statuskategorie entspricht.
3. Statusaenderung und Rueckgaengig aktualisieren Fahne, Suche, Filterzaehler und Dashboard. Rueckkehr zum importierten Status stellt die importierte Farbe wieder her.
4. Checkboxen erlauben Auswahl ohne Strg/Shift. `Alle` aktiviert alle Kategorien, `Keine` deaktiviert alle; null gewaehlte Kategorien zeigen null Accounts.
5. Mehrfachauswahl innerhalb einer Kategorie gilt als ODER; verschiedene Filter und Suche werden mit UND kombiniert. Leere Kategorie-Werte bleiben als `nicht angegeben` auswaehlbar.
6. Nicht passende Marker verschwinden standardmaessig vollstaendig, einschliesslich offener Popups/Tooltips. Verblassen bleibt eine ausdrueckliche Option.
7. Cache-Aktualisierungen erhalten die Auswahl. Filter zuruecksetzen aktiviert alle Kategorien und leert die Suche.
8. Synthetische Regressionstests, lokaler Test mit Kundendatei und Browser-Smoke-Test muessen bestanden sein. Kundendaten werden niemals eingecheckt.
