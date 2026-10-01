# TASK ID: LAUNCH-013.1
# TITLE: Add i18n: German (de)
# STATUS: pending
# DEPENDENCIES: LAUNCH-012.2
# ALLOWED FILES: product/apps/admin/src/i18n/de.json
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
German for DACH market.

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src/i18n/de.json`:

```json
{
  "common": {
    "save": "Speichern",
    "cancel": "Abbrechen",
    "delete": "Löschen",
    "edit": "Bearbeiten",
    "search": "Suchen",
    "loading": "Lädt…",
    "error": "Ein Fehler ist aufgetreten",
    "success": "Erfolg",
    "confirm": "Bestätigen",
    "yes": "Ja",
    "no": "Nein",
    "today": "Heute",
    "yesterday": "Gestern",
    "thisWeek": "Diese Woche",
    "thisMonth": "Diesen Monat"
  },
  "nav": {
    "dashboard": "Übersicht",
    "projects": "Projekte",
    "users": "Benutzer",
    "patients": "Patienten",
    "samples": "Proben",
    "appointments": "Termine",
    "audit": "Audit-Log",
    "modules": "Module",
    "settings": "Einstellungen",
    "help": "Hilfe",
    "logout": "Abmelden"
  },
  "patients": {
    "title": "Patienten",
    "addPatient": "Patient hinzufügen",
    "name": "Name",
    "phone": "Telefon",
    "email": "E-Mail",
    "dateOfBirth": "Geburtsdatum",
    "archive": "Archivieren",
    "search": "Patienten suchen…"
  },
  "appointments": {
    "title": "Termine",
    "today": "Heutige Termine",
    "newAppointment": "Neuer Termin",
    "patient": "Patient",
    "doctor": "Arzt",
    "time": "Zeit",
    "duration": "Dauer",
    "status": "Status",
    "checkIn": "Anmelden",
    "cancel": "Absagen"
  },
  "samples": {
    "title": "Proben",
    "intake": "Probe annehmen",
    "sampleId": "Proben-ID",
    "type": "Typ",
    "submittedBy": "Eingereicht von",
    "receivedAt": "Empfangen am",
    "status": "Status",
    "start": "Test starten",
    "results": "Ergebnisse",
    "issueReport": "Bericht ausstellen"
  },
  "errors": {
    "notFound": "Nicht gefunden",
    "forbidden": "Verboten",
    "unauthorized": "Nicht autorisiert",
    "validation": "Ungültige Eingabe",
    "network": "Netzwerkfehler",
    "serverError": "Serverfehler"
  },
  "auth": {
    "login": "Anmelden",
    "signup": "Registrieren",
    "email": "E-Mail",
    "password": "Passwort",
    "forgotPassword": "Passwort vergessen?",
    "verifyEmail": "E-Mail bestätigen"
  }
}
```

## TESTS

```bash
cd product
test -f apps/admin/src/i18n/de.json || { echo "FAIL"; exit 1; }
python3 -c "import json; json.load(open('apps/admin/src/i18n/de.json'))" || { echo "FAIL: invalid"; exit 1; }
grep -q "Speichern" apps/admin/src/i18n/de.json || { echo "FAIL: not translated"; exit 1; }
echo "OK"
```
