# Export- und Filterpruefung

## Automatisiert

Die App selbst benoetigt weiterhin keinen Build. Node.js und die Dev-Abhaengigkeiten dienen nur den Tests:

```powershell
npm ci
npm test
```

Optional gegen eine lokale Kundendatei:

```powershell
$env:TEST_XLSX = "C:\lokaler-pfad\kontakte.xlsx"
npm test
Remove-Item Env:TEST_XLSX
```

Die Tests speichern keine Kundendaten im Repository. Sie pruefen:

- Erhalt aller unbeteiligten XLSX-ZIP-Eintraege, Worksheet-Werte, Formeln und Layoutdefinitionen.
- Reparatur der bekannten namespace-losen Knoten, ohne weitere Inhaltsaenderungen beim Standardexport.
- Statusaenderung: nur betroffene Fuellfarben; Schrift, Rahmen, Zahlenformate und Ausrichtung bleiben gleich.
- Exportwiederholung und Rueckkehr zum importierten Status ohne kumulative Veraenderungen.
- Optionale GPS-Spalten, leere statt falscher Null-Koordinaten und erneuten Import.
- Mehrfachauswahl mit ODER/UND, leere Auswahl, Erhalt bei Filter-Neuaufbau.
- HLS-Tint und unveraenderte RGB-Farben der importierten Accounts.

## Browser-Smoke-Test

1. `index.html` lokal oeffnen oder mit einem lokalen HTTP-Server bereitstellen.
2. Demo starten. In Status `Keine` anklicken: null Treffer und keine Fahnen.
3. Projekte und Kontakt aktivieren: zwei Accounts. Andere vier Marker sind vollstaendig verborgen.
4. Dashboard oeffnen: dieselben zwei Accounts. Karte und Reset testen.
5. Alpha suchen, Treffer oeffnen, Status auf eingeschlafen setzen: rote Fahne und Change Log.
6. Excel herunterladen; Rueckgaengig: urspruengliche gruene Fahne, erneut nicht exportierte Aenderung.
7. Kundendatei hochladen und Standardexport herunterladen; die Dateistruktur mit dem Upload vergleichen.
8. GPS-Option separat aktivieren und wiederholt exportieren: keine duplizierten Spalten.

## Ergebnis am 20.10.2026

Die fuenf automatisierten Tests bestanden sowohl mit der eingebauten Demo als auch mit der bereitgestellten Datei mit 1.802 Accounts. Browserpruefungen bestaetigten Upload, Mehrfachauswahl, vollstaendiges Ausblenden, gemeinsame Dashboard-Auswahl, Statusaenderung, Download und Rueckgaengig.

Die bereitgestellte Datei enthielt bereits namespace-lose Zellen und Styles aus einem frueheren Export. Der Fix repariert diese bekannte Ursache. Bereits verlorene Formatdefinitionen lassen sich daraus nicht ableiten. Native Microsoft-Excel-Darstellung und Excel-Reparaturdialoge wurden nicht geprueft; die Validierung erfolgte im Browser sowie auf XML-/ZIP-Ebene.

Die App bietet derzeit Statusbearbeitung. Vollstaendiges Anlegen/Loeschen von Accounts und die Bearbeitung aller Accountfelder gehoeren nicht zu dieser Korrektur und sind nicht als bestanden zu betrachten.
